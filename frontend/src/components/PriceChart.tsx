'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts'
import request, { gql } from 'graphql-request'

export function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    // Production Integration: Fetch real event data from The Graph
    const fetchGraphData = async () => {
      const query = gql`
        {
          poolDayDatas(first: 30, orderBy: date, orderDirection: desc) {
            date
            open
            high
            low
            close
          }
        }
      `
      try {
        const endpoint = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/YOUR_ID/defi-exchange/version/latest'
        const data: any = await request(endpoint, query)
        
        if (data && data.poolDayDatas && data.poolDayDatas.length > 0) {
          const transformedData = data.poolDayDatas.map((day: any) => ({
            time: new Date(day.date * 1000).toISOString().split('T')[0],
            open: parseFloat(day.open),
            high: parseFloat(day.high),
            low: parseFloat(day.low),
            close: parseFloat(day.close)
          })).reverse() // lightweight-charts strictly requires chronological order
          
          setChartData(transformedData)
        }
      } catch (e) {
        console.error("Failed to fetch subgraph data:", e)
      }
    }
    fetchGraphData()
  }, [])

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1f2937' }, 
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    })

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', 
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    if (chartData.length > 0) {
      candlestickSeries.setData(chartData)
      chart.timeScale().fitContent()
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [chartData])

  return (
    <div className="bg-card p-4 sm:p-6 shadow-[var(--box-shadow-neon-sm)] w-full border border-border mt-8 mb-8 relative">
      <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
        <h2 className="text-lg font-bold font-sans tracking-widest text-foreground uppercase">CRB / USDT Price</h2>
      </div>
      {chartData.length === 0 ? (
        <div className="w-full h-[400px] bg-input border border-border flex items-center justify-center cyber-chamfer-sm">
          <p className="text-muted-foreground font-mono tracking-widest uppercase text-sm">WAITING_FOR_SUBGRAPH_DATA...</p>
        </div>
      ) : (
        <div ref={chartContainerRef} className="w-full bg-input border border-border cyber-chamfer-sm" />
      )}
    </div>
  )
}
