'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ConnectButton } from "@/components/ConnectButton"
import { SwapWidget } from "@/components/SwapWidget"
import { LiquidityWidget } from "@/components/LiquidityWidget"
import { RemoveWidget } from "@/components/RemoveWidget"
import { OffsetWidget } from "@/components/OffsetWidget"
import { PriceChart } from "@/components/PriceChart"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity' | 'remove' | 'offset'>('offset')

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center">
      
      {/* Cyberpunk Navbar */}
      <nav className="w-full flex justify-between items-center px-4 sm:px-8 py-4 border-b-2 border-border bg-background/90 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent text-background flex items-center justify-center font-bold text-lg cyber-chamfer-sm">
            <span className="font-sans">NX</span>
          </div>
          <Link href="/" className="text-2xl font-black font-sans uppercase tracking-widest text-accent drop-shadow-[var(--box-shadow-neon-sm)] hidden sm:block">
            NEON_DEX
          </Link>
        </div>
        
        <div className="hidden md:flex bg-muted border border-border cyber-chamfer-sm">
          <div className="px-6 py-2 bg-accent/10 text-accent font-bold uppercase tracking-widest border-b-2 border-accent">App</div>
          <div className="px-6 py-2 text-muted-foreground font-mono uppercase tracking-widest opacity-50">v1.0.0</div>
        </div>

        <div>
          <ConnectButton />
        </div>
      </nav>

      {/* Main Content Area - Grid Layout for proper alignment */}
      <div className="w-full max-w-[1400px] px-4 sm:px-8 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 z-10 items-start">
        
        {/* Left Column - Chart */}
        <div className="lg:col-span-2 w-full border-2 border-border cyber-chamfer bg-card relative shadow-[var(--box-shadow-neon-sm)]">
          {/* Decorative Terminal Header */}
          <div className="w-full bg-muted border-b border-border py-2 px-4 flex gap-2 items-center">
            <div className="w-3 h-3 bg-destructive cyber-chamfer-sm"></div>
            <div className="w-3 h-3 bg-yellow-500 cyber-chamfer-sm"></div>
            <div className="w-3 h-3 bg-accent cyber-chamfer-sm"></div>
            <span className="ml-4 text-xs font-mono text-accent uppercase tracking-[0.2em]">Live Price Chart</span>
          </div>
          <div className="p-1">
             <PriceChart />
          </div>
        </div>
        
        {/* Right Column - Swap Interface */}
        <div className="lg:col-span-1 w-full flex flex-col gap-6">
          {/* Sleek Tab Navigation - Cyberpunk Style */}
          <div className="flex bg-card p-1 cyber-chamfer w-full border border-border relative">
            <button
              onClick={() => setActiveTab('swap')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold font-mono uppercase tracking-widest transition-all duration-200 cyber-chamfer-sm ${
                activeTab === 'swap' 
                  ? 'bg-accent text-background shadow-[var(--box-shadow-neon-sm)]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => setActiveTab('liquidity')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold font-mono uppercase tracking-widest transition-all duration-200 cyber-chamfer-sm ${
                activeTab === 'liquidity' 
                  ? 'bg-accent-tertiary text-background shadow-[var(--box-shadow-neon-tertiary)]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Pool
            </button>
            <button
              onClick={() => setActiveTab('offset')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold font-mono uppercase tracking-widest transition-all duration-200 cyber-chamfer-sm ${
                activeTab === 'offset'
                  ? 'bg-accent text-background shadow-[var(--box-shadow-neon-sm)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Offset
            </button>
            <button
              onClick={() => setActiveTab('remove')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold font-mono uppercase tracking-widest transition-all duration-200 cyber-chamfer-sm ${
                activeTab === 'remove' 
                  ? 'bg-destructive text-background shadow-[0_0_10px_#ff336660]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Remove
            </button>
          </div>

          {/* The active widget */}
          <div className="w-full transition-all duration-300">
            {activeTab === 'swap' && <SwapWidget />}
            {activeTab === 'liquidity' && <LiquidityWidget />}
            {activeTab === 'remove' && <RemoveWidget />}
            {activeTab === 'offset' && <OffsetWidget />}
          </div>
        </div>
      </div>
    </main>
  )
}
