'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ConnectButton } from "@/components/ConnectButton"
import { SwapWidget } from "@/components/SwapWidget"
import { LiquidityWidget } from "@/components/LiquidityWidget"
import { RemoveWidget } from "@/components/RemoveWidget"
import { OffsetWidget } from "@/components/OffsetWidget"
import { RetireWidget } from "@/components/RetireWidget"
import { PriceChart } from "@/components/PriceChart"
import { VerificationWidget } from "@/components/VerificationWidget"

const TABS = [
  { id: 'swap', label: 'Swap', icon: '⇄', desc: 'Trade CRB ↔ USDT' },
  { id: 'liquidity', label: 'Pool', icon: '💧', desc: 'Add Liquidity' },
  { id: 'remove', label: 'Remove', icon: '🔓', desc: 'Withdraw LP' },
  { id: 'offset', label: 'Offset', icon: '🌿', desc: 'Claim Credits' },
  { id: 'retire', label: 'Retire', icon: '🔥', desc: 'Burn Carbon' },
  { id: 'verify', label: 'DAO', icon: '🗳️', desc: 'Peer Verify' },
  { id: 'stats', label: 'Stats', icon: '📈', desc: 'Price Chart' },
] as const

type TabId = typeof TABS[number]['id']

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('swap')

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      
      {/* ─── Premium Navbar ─── */}
      <nav className="w-full flex justify-between items-center px-6 sm:px-10 py-4 border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-tertiary flex items-center justify-center font-bold text-lg text-background rounded-lg shadow-[var(--box-shadow-neon-sm)]">
            <span className="font-sans text-sm">C</span>
          </div>
          <div className="hidden sm:block">
            <Link href="/" className="text-xl font-black font-sans uppercase tracking-[0.3em] text-foreground hover:text-accent transition-colors">
              CARBON<span className="text-accent">DEX</span>
            </Link>
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase -mt-1">Decentralized Carbon Trading</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span className="text-xs font-mono text-accent">Sepolia Testnet</span>
          </div>
          <ConnectButton />
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-6 sm:py-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          
          {/* Left Column: Navigation & Info (Sticky) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="sticky top-[80px] flex flex-col gap-6">
              
              {/* Tab Navigation */}
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-lg">
                <div className="px-5 py-3 bg-muted/50 border-b border-border/30">
                  <h3 className="text-xs font-sans font-bold text-muted-foreground uppercase tracking-[0.2em]">Actions</h3>
                </div>
                <div className="p-2">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-lg font-mono text-sm transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-accent/15 text-accent border border-accent/30 shadow-[inset_0_0_20px_rgba(0,255,136,0.05)]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <div className="text-left">
                        <div className={`font-bold uppercase tracking-wider text-xs ${activeTab === tab.id ? 'text-accent' : ''}`}>{tab.label}</div>
                        <div className="text-[10px] text-muted-foreground">{tab.desc}</div>
                      </div>
                      {activeTab === tab.id && (
                        <div className="ml-auto w-1.5 h-8 bg-accent rounded-full shadow-[0_0_8px_#00ff88]"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Active Widget (Huge) */}
          <div className="lg:col-span-8">
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-lg min-h-[600px] flex flex-col">
              <div className="flex items-center gap-3 px-6 py-4 bg-muted/50 border-b border-border/30">
                <span className="text-2xl">{TABS.find(t => t.id === activeTab)?.icon}</span>
                <div>
                  <h2 className="text-lg font-sans font-bold text-foreground uppercase tracking-wide">
                    {TABS.find(t => t.id === activeTab)?.label}
                  </h2>
                  <p className="text-xs font-mono text-muted-foreground">
                    {TABS.find(t => t.id === activeTab)?.desc}
                  </p>
                </div>
              </div>
              <div className="p-6 sm:p-8 flex-1">
                {activeTab === 'swap' && <SwapWidget />}
                {activeTab === 'liquidity' && <LiquidityWidget />}
                {activeTab === 'remove' && <RemoveWidget />}
                {activeTab === 'offset' && <OffsetWidget />}
                {activeTab === 'retire' && <RetireWidget />}
                {activeTab === 'verify' && <VerificationWidget />}
                {activeTab === 'stats' && (
                  <div className="flex flex-col items-center justify-center h-full w-full">
                    <PriceChart />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="w-full border-t border-border/30 py-4 px-6 mt-auto">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          <p className="text-xs font-mono text-muted-foreground">© 2026 CarbonDEX — Blockchain PS-08</p>
          <div className="flex gap-4">
            <span className="text-xs font-mono text-muted-foreground hover:text-accent cursor-pointer transition-colors">Sepolia</span>
            <span className="text-xs font-mono text-muted-foreground hover:text-accent cursor-pointer transition-colors">GitHub</span>
            <span className="text-xs font-mono text-muted-foreground hover:text-accent cursor-pointer transition-colors">Docs</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
