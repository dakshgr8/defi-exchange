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
    <div className="bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-4xl border border-gray-700 mt-8 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">ETH / USDC Price</h2>
      </div>
      {chartData.length === 0 ? (
        <div className="w-full h-[400px] rounded-xl shadow-inner border border-gray-700 flex items-center justify-center bg-gray-900">
          <p className="text-gray-500 font-medium">Waiting for Subgraph Data...</p>
        </div>
      ) : (
        <div ref={chartContainerRef} className="w-full rounded-xl overflow-hidden shadow-inner border border-gray-700" />
      )}
    </div>
  )
}
