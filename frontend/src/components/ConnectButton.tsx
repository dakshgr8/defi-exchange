'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { useRouter } from 'next/navigation'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  const handleDisconnect = () => {
    disconnect()
    router.push('/')
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <div className="bg-muted border border-border text-foreground px-4 py-2 text-sm font-mono uppercase tracking-widest cyber-chamfer-sm">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <button 
          onClick={handleDisconnect}
          className="bg-transparent border border-destructive text-destructive hover:bg-destructive hover:text-background px-4 py-2 font-mono uppercase tracking-widest transition-colors shadow-[0_0_10px_#ff336640] cyber-chamfer-sm text-sm font-bold"
        >
          [ DISCONNECT ]
        </button>
      </div>
    )
  }

  return (
    <button 
      onClick={() => connect({ connector: injected() })}
      className="bg-accent border border-accent hover:brightness-110 text-background px-6 py-2 font-mono font-bold uppercase tracking-widest transition-colors shadow-[var(--box-shadow-neon-sm)] cyber-chamfer-sm text-sm"
    >
      Connect Wallet
    </button>
  )
}
