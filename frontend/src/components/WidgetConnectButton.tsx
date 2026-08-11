'use client'

import { useAccount, useConnect, useSwitchChain, type Connector } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface WidgetConnectButtonProps {
  label?: string
  className?: string
}

export function WidgetConnectButton({ label = 'Connect Wallet', className }: WidgetConnectButtonProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { isConnected, chainId } = useAccount()
  const { connectAsync, connectors, isPending } = useConnect()
  const { switchChain } = useSwitchChain()
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleConnect = async (selectedConnector?: Connector) => {
    setError(null)
    setShowModal(false)

    const hasWeb3Provider = typeof window !== 'undefined' && 
      (Boolean((window as any).ethereum) || Boolean((window as any).okxwallet))

    if (!hasWeb3Provider && connectors.length === 0) {
      if (typeof window !== 'undefined') {
        window.open('https://www.okx.com/web3', '_blank')
      }
      return
    }

    const connectorToUse = selectedConnector 
      || connectors.find(c => c.id !== 'injected') 
      || connectors.find(c => c.id === 'injected') 
      || connectors[0]

    try {
      if (connectorToUse) {
        await connectAsync({ connector: connectorToUse })
      } else {
        for (const c of connectors) {
          try {
            await connectAsync({ connector: c })
            return
          } catch (e) {
            console.warn('Fallback connector failed:', c.name, e)
          }
        }
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

  const handleButtonClick = () => {
    const uniqueConnectors = connectors.filter((c, idx, self) => 
      self.findIndex(t => t.id === c.id || t.name === c.name) === idx
    )
    
    if (uniqueConnectors.length > 1) {
      setShowModal(true)
    } else {
      handleConnect()
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
    <div className="w-full flex flex-col gap-1 relative">
      <button
        type="button"
        onClick={handleButtonClick}
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

      {showModal && mounted && createPortal(
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 text-left font-sans">
          <div className="bg-card border-2 border-accent p-6 rounded-xl max-w-sm w-full shadow-[var(--box-shadow-neon-lg)] flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-border/50 pb-3">
              <div>
                <h3 className="font-sans font-bold text-lg text-foreground uppercase tracking-wider">Select Wallet</h3>
                <p className="text-xs text-muted-foreground font-mono">Connect your Web3 provider</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground font-mono font-bold text-xl px-2 py-1 hover:bg-muted rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2.5 my-1">
              {connectors.map((c) => (
                <button
                  key={c.id || c.name}
                  onClick={() => handleConnect(c)}
                  className="w-full flex items-center gap-4 p-3.5 bg-muted/60 hover:bg-accent/15 border border-border hover:border-accent/50 rounded-xl font-mono transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-2xl border border-border group-hover:border-accent/40 shadow-sm">
                    {c.name.toLowerCase().includes('okx') ? '🖤' : c.name.toLowerCase().includes('metamask') ? '🦊' : '⚡'}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-sm text-foreground group-hover:text-accent transition-colors">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground">Connect via {c.name}</div>
                  </div>
                  <div className="text-muted-foreground group-hover:text-accent font-mono text-xs">→</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => handleConnect()}
              className="w-full py-2.5 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-mono text-center uppercase tracking-widest border border-border/50 rounded-lg transition-colors cursor-pointer"
            >
              Default Injected Provider
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
