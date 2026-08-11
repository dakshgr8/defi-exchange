'use client'

import { useAccount, useConnect, useSwitchChain } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { useState } from 'react'

interface WidgetConnectButtonProps {
  label?: string
  className?: string
}

export function WidgetConnectButton({ label = 'Connect Wallet', className }: WidgetConnectButtonProps) {
  const { isConnected, chainId } = useAccount()
  const { connectAsync, connectors, isPending } = useConnect()
  const { switchChain } = useSwitchChain()
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setError(null)
    const connector = connectors.find(c => c.id === 'metaMask') || connectors[0]

    if (!connector) {
      if (typeof window !== 'undefined' && !(window as any).ethereum) {
        window.open('https://metamask.io/download/', '_blank')
        return
      }
    }

    try {
      if (connector) {
        await connectAsync({ connector })
      }
    } catch (err: any) {
      console.error('Wallet connect error:', err)
      if (err?.code === 4001 || err?.name === 'UserRejectedRequestError') {
        setError('Connection request rejected')
      } else {
        setError(err?.shortMessage || err?.message || 'Connection failed')
      }
    }
  }

  if (isConnected && chainId !== sepolia.id) {
    return (
      <button
        type="button"
        onClick={() => switchChain({ chainId: sepolia.id })}
        className="w-full bg-destructive border-2 border-destructive text-background py-4 font-mono font-bold text-lg uppercase tracking-widest cyber-chamfer hover:brightness-110 shadow-[0_0_15px_#ff336680] transition-all cursor-pointer"
      >
        Switch to Sepolia
      </button>
    )
  }

  const defaultStyle = "w-full bg-accent border-2 border-accent text-background py-4 font-mono font-bold text-lg uppercase tracking-widest cyber-chamfer hover:brightness-110 shadow-[var(--box-shadow-neon-lg)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"

  return (
    <div className="w-full flex flex-col gap-1">
      <button
        type="button"
        onClick={handleConnect}
        disabled={isPending}
        className={className || defaultStyle}
      >
        {isPending ? (
          <>
            <svg className="animate-spin h-5 w-5 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting Wallet...
          </>
        ) : (
          label
        )}
      </button>
      {error && (
        <span className="text-xs font-mono text-destructive text-center tracking-tight mt-1">{error}</span>
      )}
    </div>
  )
}
