'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function LandingPage() {
  const [cursorVisible, setCursorVisible] = useState(true)

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center overflow-x-hidden relative">
      
      {/* Decorative Corner Accents */}
      <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-accent opacity-50"></div>
      <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-accent opacity-50"></div>
      <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-accent opacity-50"></div>
      <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-accent opacity-50"></div>

      {/* Cyberpunk Navbar */}
      <nav className="w-full flex justify-between items-center px-4 sm:px-12 py-6 relative z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent text-background flex items-center justify-center font-bold text-lg cyber-chamfer-sm">
            <span className="font-sans">NX</span>
          </div>
          <span className="text-2xl font-black font-sans uppercase tracking-widest text-accent drop-shadow-[var(--box-shadow-neon-sm)]">
            NEON_DEX
          </span>
        </div>
        
        <div className="flex gap-4">
          <Link href="/dashboard" className="px-8 py-3 bg-accent text-background font-bold font-mono uppercase tracking-widest cyber-chamfer-sm shadow-[var(--box-shadow-neon)] hover:brightness-110 transition-all">
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-7xl px-4 py-20 z-10 relative">
        <div className="text-center mb-12">
          <p className="text-accent font-mono uppercase tracking-[0.3em] mb-4 text-sm animate-pulse">
            &gt; SYSTEM_OVERRIDE_ENABLED
          </p>
          <h1 className="text-6xl md:text-8xl font-black font-sans uppercase tracking-widest text-foreground mb-6 cyber-glitch-text relative">
            THE SPRAWL <br/> <span className="text-accent drop-shadow-[var(--box-shadow-neon-lg)]">AWAITS.</span>
          </h1>
          <p className="text-lg md:text-xl font-mono text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A decentralized trading protocol built for the future. Swap tokens instantly, provide liquidity to the network, and earn passive yield powered by immutable smart contracts.
            <span className={cursorVisible ? 'opacity-100' : 'opacity-0'}>_</span>
          </p>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row gap-6 mb-32">
          <Link href="/dashboard" className="group relative px-10 py-5 bg-transparent border-2 border-accent text-accent font-bold font-mono uppercase tracking-widest cyber-chamfer shadow-[var(--box-shadow-neon-sm)] hover:shadow-[var(--box-shadow-neon)] transition-all hover:-translate-y-1">
            <span className="relative z-10 group-hover:text-background transition-colors">Trade Now</span>
            <div className="absolute inset-0 bg-accent w-0 group-hover:w-full transition-all duration-300 ease-out z-0"></div>
          </Link>
          <a href="https://github.com/dakshgr8/defi-exchange" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-10 py-5 bg-transparent border border-border text-muted-foreground hover:text-accent hover:border-accent font-bold font-mono uppercase tracking-widest cyber-chamfer transition-all">
            GitHub
          </a>
        </div>

        {/* Feature Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 -skew-y-1">
          {[
            { title: "INSTANT SWAPS", desc: "Trade Carbon (CRB) and USDT instantly with zero middlemen. Powered by automated smart contracts and peer-to-peer liquidity." },
            { title: "PROVIDE LIQUIDITY", desc: "Deposit your crypto into decentralized pools to become a market maker. Your funds power the entire exchange." },
            { title: "EARN PASSIVE YIELD", desc: "Collect a 0.3% fee on every single trade that routes through your pool. Withdraw your initial deposit and earnings at any time." }
          ].map((feature, i) => (
            <div key={i} className="bg-card border border-border cyber-chamfer p-8 hover:-translate-y-2 hover:border-accent transition-all duration-300 group">
              <div className="w-12 h-12 border border-accent flex items-center justify-center mb-6 shadow-[var(--box-shadow-neon-sm)] text-accent font-mono">
                0{i + 1}
              </div>
              <h3 className="text-xl font-bold font-sans text-foreground uppercase tracking-widest mb-3 group-hover:text-accent transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

    </main>
  )
}
