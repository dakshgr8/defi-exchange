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

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/1757571/carbon-dex-subgraph/v1.0.4'

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

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const data = await request(SUBGRAPH_URL, GET_SWAPS)
        
        if (data && (data as any).swapEvents && (data as any).swapEvents.length > 0) {
          const formattedData = (data as any).swapEvents.map((swap: any) => {
            const date = new Date(Number(swap.timestamp) * 1000)
            return {
              time: `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`,
              price: parseFloat(swap.crbPriceInUsdt)
            }
          })
          
          setChartData(formattedData)
        } else {
          // Fallback if no swaps yet
          setChartData([
            { time: '00:00', price: 5.0 },
            { time: '04:00', price: 5.0 }
          ])
        }
      } catch (err) {
        console.error("Error fetching subgraph data", err)
      }
    }

    fetchGraphData()
  }, [])

  return (
    <div className="bg-card p-4 sm:p-6 shadow-[var(--box-shadow-neon-sm)] w-full border border-border mt-8 mb-8 relative">
      <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
        <h2 className="text-lg font-bold font-sans tracking-widest text-foreground uppercase">CRB / USDT Price (Live Subgraph Data)</h2>
      </div>
      {chartData.length === 0 ? (
        <div className="w-full h-[400px] bg-input border border-border flex items-center justify-center cyber-chamfer-sm">
          <p className="text-muted-foreground font-mono tracking-widest uppercase text-sm">LOADING_SUBGRAPH_DATA...</p>
        </div>
      ) : (
        <div className="w-full h-[400px] bg-input border border-border cyber-chamfer-sm pt-4 pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: any) => `$${Number(value).toFixed(2)}`} domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip 
                formatter={(value: any) => [`$${Number(value).toFixed(4)}`, 'Price']}
                contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#10b981' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
