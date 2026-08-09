'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Intersection Observer Hook for scroll animations
function useInView(threshold = 0.1) {
  const [isIntersecting, setIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIntersecting(true);
        observer.unobserve(node);
      }
    }, { threshold });

    observer.observe(node);

    return () => {
      observer.unobserve(node);
    };
  }, [threshold]);

  return [ref, isIntersecting] as const;
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [cursorBlink, setCursorBlink] = useState(true);

  // Handle navbar scroll background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Blinking cursor effect for hero
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Smooth scroll handler
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Refs for animation sections
  const [featuresRef, featuresInView] = useInView();
  const [howItWorksRef, howItWorksInView] = useInView();
  const [tokenomicsRef, tokenomicsInView] = useInView();
  const [securityRef, securityInView] = useInView();
  const [techStackRef, techStackInView] = useInView();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-accent/30 selection:text-accent">
      
      {/* 1. NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? 'bg-background/80 backdrop-blur-xl border-border/50 py-3'
            : 'bg-transparent border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-accent/20 border border-accent flex items-center justify-center cyber-chamfer-sm">
              <span className="text-accent text-lg font-bold">C</span>
            </div>
            <div>
              <div className="text-xl font-bold tracking-wider">
                <span className="text-white">CARBON</span>
                <span className="text-accent">DEX</span>
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                Decentralized Carbon Trading
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-mono tracking-wide">
            <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="text-muted-foreground hover:text-accent transition-colors">Features</a>
            <a href="#how-it-works" onClick={(e) => handleScrollTo(e, 'how-it-works')} className="text-muted-foreground hover:text-accent transition-colors">How It Works</a>
            <a href="#tokenomics" onClick={(e) => handleScrollTo(e, 'tokenomics')} className="text-muted-foreground hover:text-accent transition-colors">Tokenomics</a>
            <a href="#security" onClick={(e) => handleScrollTo(e, 'security')} className="text-muted-foreground hover:text-accent transition-colors">Security</a>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/50 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-muted-foreground">Sepolia Testnet</span>
            </div>
            <Link 
              href="/dashboard"
              className="px-5 py-2 bg-accent/10 border border-accent text-accent hover:bg-accent hover:text-background transition-all duration-300 font-mono text-sm uppercase tracking-wider cyber-chamfer-sm hover:shadow-[0_0_15px_rgba(0,255,136,0.5)]"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-20 pb-10 overflow-hidden">
        {/* Background Grid & Particles */}
        <div className="absolute inset-0 cyber-grid opacity-30 z-0"></div>
        <div className="absolute inset-0 noise-overlay opacity-20 z-0 mix-blend-overlay"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-[20%] left-[15%] w-1.5 h-1.5 rounded-full bg-accent animate-float animation-delay-100 z-0 blur-[1px]"></div>
        <div className="absolute top-[60%] left-[8%] w-2 h-2 rounded-full bg-accent-secondary animate-float animation-delay-500 z-0 blur-[1px]"></div>
        <div className="absolute top-[30%] right-[20%] w-1 h-1 rounded-full bg-accent-tertiary animate-float animation-delay-1000 z-0"></div>
        <div className="absolute top-[75%] right-[12%] w-2 h-2 rounded-full bg-accent animate-float animation-delay-700 z-0 blur-[2px]"></div>
        <div className="absolute top-[45%] left-[50%] w-1 h-1 rounded-full bg-accent-secondary animate-float animation-delay-200 z-0"></div>
        <div className="absolute bottom-[20%] left-[30%] w-2.5 h-2.5 rounded-full bg-accent-tertiary animate-float animation-delay-2000 z-0 blur-[1px]"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="max-w-4xl">
            {/* Terminal Status */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-accent/30 bg-accent/5 rounded-sm font-mono text-xs text-accent animate-fade-in-down">
              <span className="animate-pulse">❯</span> SYSTEM_OVERRIDE_ENABLED
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6">
              <div className="animate-fade-in-right animation-delay-100 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                TRADE CARBON
              </div>
              <div className="cyber-glitch-text text-accent animate-fade-in-left animation-delay-300 drop-shadow-[0_0_15px_rgba(0,255,136,0.4)]">
                ON-CHAIN.
              </div>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground font-mono max-w-2xl mb-10 animate-fade-in-up animation-delay-500 leading-relaxed">
              The first decentralized automated market maker specifically designed for verified carbon credits. Swap, provide liquidity, and offset your emissions with absolute transparency.
              <span className={`inline-block w-3 h-5 bg-accent ml-1 align-middle ${cursorBlink ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}></span>
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-6 mb-16 animate-fade-in-up animation-delay-700">
              <Link 
                href="/dashboard"
                className="group relative px-8 py-4 bg-accent/10 border-2 border-accent text-accent font-mono font-bold tracking-widest uppercase overflow-hidden cyber-chamfer hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all duration-300"
              >
                <span className="relative z-10 group-hover:text-background transition-colors duration-300">Launch Exchange</span>
                <div className="absolute inset-0 bg-accent transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out z-0"></div>
              </Link>
              
              <a 
                href="https://github.com/dakshgr8/defi-exchange"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-card/50 border border-border text-foreground font-mono uppercase tracking-widest hover:border-accent/50 hover:bg-card transition-all duration-300 flex items-center gap-3 cyber-chamfer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                View on GitHub
              </a>
            </div>

            {/* Stat Counters */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl animate-fade-in-up animation-delay-1000">
              {[
                { label: 'Trade Fee', value: '0.3%' },
                { label: 'Uptime', value: '24/7' },
                { label: 'On-Chain', value: '100%' },
              ].map((stat, i) => (
                <div key={i} className="glass p-4 border border-border/50 border-l-2 border-l-accent flex flex-col justify-center cyber-chamfer-sm">
                  <div className="text-2xl md:text-3xl font-bold font-mono text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce z-10 cursor-pointer" onClick={(e) => handleScrollTo(e as any, 'features')}>
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Scroll</span>
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="py-32 relative bg-card/20" ref={featuresRef}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={`mb-16 transition-all duration-1000 ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl font-bold tracking-tight mb-4 inline-block relative">
              PLATFORM CAPABILITIES
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-accent via-accent-tertiary to-transparent"></div>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: '01', title: 'Instant Swaps', icon: '⇄', desc: 'Trade CRB and USDT instantly with zero middlemen. Automated market maker ensures deep liquidity for every trade.' },
              { id: '02', title: 'Liquidity Pools', icon: '💧', desc: 'Deposit paired tokens into decentralized pools. Become a market maker and earn fees from every trade that routes through your liquidity.' },
              { id: '03', title: 'Carbon Offsetting', icon: '🌿', desc: 'Claim verified carbon credits directly on-chain. Bridge real-world environmental impact to the blockchain.' },
              { id: '04', title: 'Carbon Retirement', icon: '🔥', desc: 'Permanently burn carbon credits to prove your environmental commitment. Immutable proof on the blockchain.' },
              { id: '05', title: 'DAO Governance', icon: '🗳️', desc: 'Participate in decentralized governance. Vote on protocol upgrades, verify carbon credit submissions, and shape the future of the platform.' },
              { id: '06', title: 'Real-Time Analytics', icon: '📊', desc: 'Monitor live price charts, pool reserves, and trading volume. Full transparency powered by The Graph subgraph indexing.' },
            ].map((feature, i) => (
              <div 
                key={i} 
                className={`glass p-8 border border-border/50 hover:border-accent/50 transition-all duration-500 group relative overflow-hidden cyber-chamfer ${
                  featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="absolute top-0 right-0 p-4 text-6xl font-black text-muted-foreground/10 group-hover:text-accent/10 transition-colors font-mono z-0 pointer-events-none">
                  {feature.id}
                </div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 mb-6 bg-card/80 border border-accent/30 flex items-center justify-center text-2xl group-hover:shadow-[0_0_15px_rgba(0,255,136,0.3)] group-hover:border-accent transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-accent transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
                
                {/* Hover Glow Effect at bottom */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-accent transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 z-10"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-32 relative" ref={howItWorksRef}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={`text-center mb-20 transition-all duration-1000 ${howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-center">
              HOW IT WORKS
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Seamless decentralized execution from connection to impact.</p>
          </div>

          <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-4 before:hidden md:before:block before:absolute before:top-8 before:left-[10%] before:right-[10%] before:h-0.5 before:bg-border/50 before:border-t before:border-dashed before:border-muted-foreground/30 before:z-0">
            {[
              { id: '01', title: 'Connect Wallet', desc: 'Link your MetaMask or any Web3 wallet to the Sepolia testnet to get started.' },
              { id: '02', title: 'Choose Action', desc: 'Swap tokens, provide liquidity, offset carbon credits, or participate in DAO governance.' },
              { id: '03', title: 'Execute On-Chain', desc: 'Every transaction is processed through audited smart contracts. No intermediaries, no hidden fees.' },
              { id: '04', title: 'Track & Earn', desc: 'Monitor your positions, track rewards, and watch your impact grow in real-time.' },
            ].map((step, i) => (
              <div 
                key={i} 
                className={`relative z-10 flex flex-col items-center text-center max-w-[250px] mx-auto transition-all duration-700 ${
                  howItWorksInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
                style={{ transitionDelay: `${i * 200}ms` }}
              >
                <div className="w-16 h-16 rounded-full bg-background border-2 border-accent text-accent font-mono text-xl font-bold flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                  {step.id}
                </div>
                <h4 className="text-lg font-bold text-white mb-3">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TOKENOMICS / TRADING PAIRS */}
      <section id="tokenomics" className="py-32 relative bg-card/30 border-y border-border/50" ref={tokenomicsRef}>
        <div className="absolute inset-0 noise-overlay opacity-10 z-0"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className={`mb-16 transition-all duration-1000 ${tokenomicsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl font-bold tracking-tight mb-4 inline-block relative">
              TRADING ECOSYSTEM
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-accent-secondary via-accent to-transparent"></div>
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left: Trading Pair */}
            <div className={`flex-1 glass p-8 border border-border cyber-chamfer transition-all duration-1000 ${tokenomicsInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-4">
                    <div className="w-12 h-12 rounded-full bg-card border border-accent flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,255,136,0.2)] z-10">⚡</div>
                    <div className="w-12 h-12 rounded-full bg-card border border-accent-secondary flex items-center justify-center text-xl z-0">💵</div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">CRB / USDT</h3>
                    <p className="text-sm text-muted-foreground font-mono">Carbon Token / Tether</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono">$2.45</div>
                  <div className="text-sm text-accent font-mono">+12.5%</div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between text-sm text-muted-foreground font-mono mb-2">
                  <span>Pool Fee</span>
                  <span>0.3%</span>
                </div>
                <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-[30%]"></div>
                </div>
              </div>

              {/* Fake Sparkline Chart */}
              <div className="h-32 flex items-end justify-between gap-1 mt-10 border-b border-border/50 pb-2">
                {[40, 45, 30, 50, 65, 55, 70, 60, 80, 75, 90, 85, 100, 95, 110, 105, 120].map((h, i) => (
                  <div 
                    key={i} 
                    className="w-full bg-accent/40 hover:bg-accent transition-colors rounded-t-sm"
                    style={{ height: `${(h / 120) * 100}%` }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Right: Protocol Stats */}
            <div className={`flex-1 grid grid-cols-2 gap-4 transition-all duration-1000 delay-300 ${tokenomicsInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              {[
                { label: 'Total Value Locked', value: '$1.2M' },
                { label: '24h Volume', value: '$342K' },
                { label: 'Total Trades', value: '12,847' },
                { label: 'Active LPs', value: '234' },
                { label: 'Carbon Offset', value: '1,523 tons', highlight: true },
                { label: 'Carbon Retired', value: '892 tons', highlight: true },
              ].map((stat, i) => (
                <div key={i} className={`glass p-6 border border-border/50 flex flex-col justify-center cyber-chamfer-sm ${stat.highlight ? 'border-l-2 border-l-accent' : ''}`}>
                  <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">{stat.label}</div>
                  <div className={`text-2xl lg:text-3xl font-bold font-mono ${stat.highlight ? 'text-accent' : 'text-white'}`}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. ARCHITECTURE & SECURITY */}
      <section id="security" className="py-32 relative" ref={securityRef}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-1000 ${securityInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-center">
              ARCHITECTURE & SECURITY
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Built on robust, open-source smart contracts designed for maximum security and transparency.</p>
          </div>

          {/* Contracts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { name: 'SimpleSwap.sol', desc: 'Core AMM engine. Handles token swaps using constant product formula (x * y = k).', addr: '0x7a3f...8b2c' },
              { name: 'CarbonCredit.sol', desc: 'ERC-20 carbon credit token with offset and retirement tracking capabilities.', addr: '0x1c4e...9f3a' },
              { name: 'CarbonCreditDAO.sol', desc: 'Decentralized governance for carbon credit verification and protocol upgrades.', addr: '0x9b2d...4e1f' },
            ].map((contract, i) => (
              <div 
                key={i} 
                className={`glass p-6 border border-border/50 hover:border-accent/30 transition-all duration-500 cyber-chamfer ${
                  securityInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${i * 200}ms` }}
              >
                <div className="flex items-center gap-2 mb-4 text-accent font-mono text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  {contract.name}
                </div>
                <p className="text-sm text-muted-foreground mb-6 h-16">{contract.desc}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-card/80 border border-border text-xs font-mono rounded text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-tertiary"></span>
                  {contract.addr}
                </div>
              </div>
            ))}
          </div>

          {/* Security Features */}
          <div className={`flex flex-wrap justify-center gap-8 md:gap-16 transition-all duration-1000 delay-500 ${securityInView ? 'opacity-100' : 'opacity-0'}`}>
            {[
              { label: 'Immutable Contracts', icon: '🔒' },
              { label: 'Open Source', icon: '💻' },
              { label: 'Testnet Verified', icon: '✅' },
              { label: 'No Admin Keys', icon: '🛡️' },
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 text-lg font-medium text-white/80">
                <span className="text-2xl">{feat.icon}</span>
                {feat.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. TECHNOLOGY STACK */}
      <section className="py-20 bg-accent/5 border-y border-border/30 overflow-hidden" ref={techStackRef}>
        <div className="max-w-7xl mx-auto px-6 mb-10">
          <h2 className="text-2xl font-bold tracking-widest uppercase text-center font-mono text-muted-foreground">
            Built With
          </h2>
        </div>
        
        <div className={`flex flex-wrap justify-center gap-4 max-w-5xl mx-auto px-6 transition-all duration-1000 ${techStackInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {[
            { name: 'Solidity', icon: '💠' },
            { name: 'Ethereum', icon: '⟠' },
            { name: 'Hardhat', icon: '👷' },
            { name: 'Next.js', icon: '▲' },
            { name: 'The Graph', icon: '🕸️' },
            { name: 'wagmi', icon: '🔗' },
            { name: 'viem', icon: '⚡' },
            { name: 'Sepolia', icon: '🧪' },
          ].map((tech, i) => (
            <div 
              key={i} 
              className="px-6 py-3 glass border border-border/50 rounded-full flex items-center gap-3 hover:border-accent/50 hover:bg-card/80 transition-colors cursor-default"
            >
              <span className="text-xl">{tech.icon}</span>
              <span className="font-mono font-medium text-sm">{tech.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 8. CTA SECTION */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent/10 z-0 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-6 text-white drop-shadow-lg">
            READY TO <span className="text-accent cyber-glitch-text">TRADE?</span>
          </h2>
          <p className="text-xl text-muted-foreground font-mono mb-12 max-w-2xl mx-auto">
            Connect your wallet and start trading carbon credits on the most transparent decentralized exchange.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link 
              href="/dashboard"
              className="px-10 py-4 bg-accent text-background font-mono font-bold tracking-widest uppercase cyber-chamfer hover:bg-accent-tertiary transition-colors duration-300 shadow-[0_0_20px_rgba(0,255,136,0.4)]"
            >
              Launch Exchange
            </Link>
            <a 
              href="https://github.com/dakshgr8/defi-exchange"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 bg-transparent border-2 border-border text-foreground font-mono font-bold tracking-widest uppercase cyber-chamfer hover:border-accent hover:text-accent transition-colors duration-300"
            >
              Read Docs
            </a>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-card/50 border-t border-border pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-sm bg-accent/20 border border-accent flex items-center justify-center cyber-chamfer-sm">
                  <span className="text-accent font-bold">C</span>
                </div>
                <div className="text-xl font-bold tracking-wider">
                  <span className="text-white">CARBON</span><span className="text-accent">DEX</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm font-mono leading-relaxed">
                Decentralized automated market maker for carbon credits and environmental assets.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold font-mono tracking-widest uppercase mb-6 text-sm">Protocol</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-mono">
                <li><a href="#" className="hover:text-accent transition-colors">About</a></li>
                <li><a href="https://github.com/dakshgr8/defi-exchange" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold font-mono tracking-widest uppercase mb-6 text-sm">Platform</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-mono">
                <li><Link href="/dashboard" className="hover:text-accent transition-colors">Trade</Link></li>
                <li><Link href="/dashboard" className="hover:text-accent transition-colors">Liquidity</Link></li>
                <li><Link href="/dashboard" className="hover:text-accent transition-colors">Carbon Offset</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold font-mono tracking-widest uppercase mb-6 text-sm">Community</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-mono">
                <li><a href="#" className="hover:text-accent transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Governance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-muted-foreground">
            <p>© 2026 CarbonDEX — Decentralized Carbon Trading Protocol</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              Built on Ethereum
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
