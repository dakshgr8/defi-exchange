'use client'

import { useState } from 'react'
import { ConnectButton } from "@/components/ConnectButton"
import { SwapWidget } from "@/components/SwapWidget"
import { LiquidityWidget } from "@/components/LiquidityWidget"
import { RemoveWidget } from "@/components/RemoveWidget"
import { PriceChart } from "@/components/PriceChart"

export default function Home() {
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity' | 'remove'>('swap')

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-gray-900 text-white gap-8 pt-32">
      <div className="absolute top-8 right-8">
        <ConnectButton />
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight mb-2">DeFi Exchange</h1>
      
      <PriceChart />
      
      <div className="flex bg-gray-800 p-1 rounded-xl w-full max-w-md shadow-xl border border-gray-700">
        <button
          onClick={() => setActiveTab('swap')}
          className={`flex-1 py-2 font-medium rounded-lg transition-colors ${activeTab === 'swap' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Swap
        </button>
        <button
          onClick={() => setActiveTab('liquidity')}
          className={`flex-1 py-2 font-medium rounded-lg transition-colors ${activeTab === 'liquidity' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Liquidity
        </button>
        <button
          onClick={() => setActiveTab('remove')}
          className={`flex-1 py-2 font-medium rounded-lg transition-colors ${activeTab === 'remove' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Manage
        </button>
      </div>

      {activeTab === 'swap' && <SwapWidget />}
      {activeTab === 'liquidity' && <LiquidityWidget />}
      {activeTab === 'remove' && <RemoveWidget />}
    </main>
  )
}
