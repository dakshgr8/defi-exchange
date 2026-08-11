'use client'

import { useAccount, useConnect, useDisconnect, useSwitchChain, type Connector } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function ConnectButton() {
  const [mounted, setMounted] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const { address, isConnected, chainId } = useAccount()
  const { connectAsync, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const router = useRouter()

  const handleConnect = async (selectedConnector?: Connector) => {
    setConnectError(null)
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
      console.error('Wallet connection error:', err)
      if (err?.code === 4001 || err?.name === 'UserRejectedRequestError') {
        setConnectError('Connection request rejected')
      } else {
        setConnectError(err?.shortMessage || err?.message || 'Connection failed')
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
    <div className="flex flex-col items-end gap-1 relative z-50">
      <button 
        onClick={handleButtonClick}
        disabled={isPending}
        className="bg-accent border border-accent hover:brightness-110 text-background px-6 py-2 font-mono font-bold uppercase tracking-widest transition-colors shadow-[var(--box-shadow-neon-sm)] rounded-lg text-sm cursor-pointer relative flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <svg className="animate-spin h-4 w-4 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting...
          </>
        ) : (
          'Connect Wallet'
        )}
      </button>

      {connectError && (
        <span className="text-[10px] font-mono text-destructive tracking-tight absolute top-full mt-1 right-0 whitespace-nowrap bg-background/90 px-2 py-0.5 rounded border border-destructive/50 z-50">{connectError}</span>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 text-left">
          <div className="bg-card border-2 border-accent p-6 rounded-xl max-w-sm w-full shadow-[var(--box-shadow-neon-lg)] flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-sans font-bold text-lg text-foreground uppercase tracking-wider">Select Wallet</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground font-mono font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {connectors.map((c) => (
                <button
                  key={c.id || c.name}
                  onClick={() => handleConnect(c)}
                  className="w-full flex items-center gap-3 p-3 bg-muted hover:bg-accent/20 border border-border hover:border-accent rounded-lg font-mono transition-all cursor-pointer"
                >
                  <span className="text-xl">
                    {c.name.toLowerCase().includes('okx') ? '🖤' : c.name.toLowerCase().includes('metamask') ? '🦊' : '⚡'}
                  </span>
                  <div>
                    <div className="font-bold text-foreground">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground">Connect via {c.name}</div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => handleConnect()}
              className="w-full py-2 bg-transparent text-muted-foreground hover:text-foreground text-xs font-mono text-center uppercase tracking-widest border border-border rounded-lg mt-2 cursor-pointer"
            >
              Default Injected Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


