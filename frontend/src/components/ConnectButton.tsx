'use client'

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { sepolia } from 'wagmi/chains'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function ConnectButton() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const router = useRouter()

  const handleDisconnect = () => {
    disconnect()
    router.push('/')
  }

  if (!mounted) {
    return (
      <button 
        disabled
        className="bg-accent/50 border border-accent/50 text-background/50 px-6 py-2 font-mono font-bold uppercase tracking-widest rounded-lg text-sm z-50 relative"
      >
        Loading...
      </button>
    )
  }

  if (isConnected) {
    if (chainId !== sepolia.id) {
      return (
        <button 
          onClick={() => switchChain({ chainId: sepolia.id })}
          className="bg-destructive border border-destructive hover:brightness-110 text-background px-6 py-2 font-mono font-bold uppercase tracking-widest transition-colors shadow-[0_0_10px_#ff336640] rounded-lg text-sm cursor-pointer z-50 relative"
        >
          Switch to Sepolia
        </button>
      )
    }

    return (
      <div className="flex items-center gap-4">
        <div className="bg-muted border border-border text-foreground px-4 py-2 text-sm font-mono uppercase tracking-widest rounded-lg">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <button 
          onClick={handleDisconnect}
          className="bg-transparent border border-destructive text-destructive hover:bg-destructive hover:text-background px-4 py-2 font-mono uppercase tracking-widest transition-colors shadow-[0_0_10px_#ff336640] rounded-lg text-sm font-bold cursor-pointer z-50 relative"
        >
          [ DISCONNECT ]
        </button>
      </div>
    )
  }

  return (
    <button 
      onClick={() => connect({ connector: injected() })}
      className="bg-accent border border-accent hover:brightness-110 text-background px-6 py-2 font-mono font-bold uppercase tracking-widest transition-colors shadow-[var(--box-shadow-neon-sm)] rounded-lg text-sm cursor-pointer z-50 relative"
    >
      Connect Wallet
    </button>
  )
}
