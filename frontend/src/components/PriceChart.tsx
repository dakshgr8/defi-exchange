'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { request, gql } from 'graphql-request'

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/1757571/carbon-dex-subgraph/v1.0.5'

const GET_SWAPS = gql`
  {
    swapEvents(first: 100, orderBy: timestamp, orderDirection: asc) {
      id
      crbPriceInUsdt
      timestamp
    }
  }
`

export function PriceChart() {
  const [chartData, setChartData] = useState<any[]>([])
  const [currentPrice, setCurrentPrice] = useState('5.00')
  const [priceChange, setPriceChange] = useState('+0.00%')

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const data = await request(SUBGRAPH_URL, GET_SWAPS)
        
        if (data && (data as any).swapEvents && (data as any).swapEvents.length > 0) {
          const formattedData = (data as any).swapEvents.map((swap: any) => {
            const date = new Date(Number(swap.timestamp) * 1000)
            const price = parseFloat(swap.crbPriceInUsdt)
            return {
              time: `${date.getMonth()+1}/${date.getDate()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2, '0')}`,
              price: price
            }
          })
          
          setChartData(formattedData)
          const lastPrice = formattedData[formattedData.length - 1].price
          const firstPrice = formattedData[0].price
          setCurrentPrice(lastPrice.toFixed(4))
          const change = ((lastPrice - firstPrice) / firstPrice * 100)
          setPriceChange(`${change >= 0 ? '+' : ''}${change.toFixed(2)}%`)
        } else {
          setChartData([
            { time: 'Start', price: 5.0 },
            { time: 'Now', price: 5.0 }
          ])
          setCurrentPrice('5.0000')
        }
      } catch (err) {
        console.error("Error fetching subgraph data", err)
        setChartData([
          { time: 'Start', price: 5.0 },
          { time: 'Now', price: 5.0 }
        ])
      }
    }

    fetchGraphData()
    const interval = setInterval(fetchGraphData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const isPositive = !priceChange.startsWith('-')

  return (
    <div className="w-full">
      {/* Price Header */}
      <div className="flex items-end gap-4 mb-4 px-2">
        <div>
          <p className="text-3xl sm:text-4xl font-bold font-sans text-foreground">${currentPrice}</p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${isPositive ? 'bg-accent/15 text-accent' : 'bg-destructive/15 text-destructive'}`}>
          {priceChange}
        </div>
        <p className="text-xs font-mono text-muted-foreground mb-1">per CRB</p>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="w-full h-[280px] sm:h-[320px] flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <p className="text-muted-foreground font-mono tracking-widest uppercase text-sm">Loading Subgraph Data...</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-[280px] sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.25}/>
                  <stop offset="50%" stopColor="#00ff88" stopOpacity={0.08}/>
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2e" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#4b5563" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                dy={8}
              />
              <YAxis 
                stroke="#4b5563" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value: any) => `$${Number(value).toFixed(2)}`} 
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                dx={-5}
                width={60}
              />
              <Tooltip 
                formatter={(value: any) => [`$${Number(value).toFixed(4)}`, 'CRB Price']}
                contentStyle={{ 
                  backgroundColor: '#1c1c2e', 
                  borderColor: '#2a2a3a', 
                  borderRadius: '8px',
                  color: '#00ff88',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
                itemStyle={{ color: '#00ff88' }}
                labelStyle={{ color: '#6b7280', fontSize: '11px' }}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#00ff88" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorPrice)"
                dot={false}
                activeDot={{ r: 5, fill: '#00ff88', stroke: '#0a0a0f', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
