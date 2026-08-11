'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { parseUnits, formatUnits } from 'viem'
import addresses from '@/config/addresses.json'
import abis from '@/config/abis.json'
import { WidgetConnectButton } from '@/components/WidgetConnectButton'

const TOKENS = {
  CRB: { address: addresses.mockEthAddress as `0x${string}`, decimals: 18, symbol: 'CRB' }
}

export function OffsetWidget() {
  const { isConnected, address, chainId } = useAccount()
  const [certificateId, setCertificateId] = useState('')
  const [tonnes, setTonnes] = useState(0)
  const [activeTab, setActiveTab] = useState<'ENTERPRISE' | 'STRAVA' | 'TESLA' | 'PLAID'>('ENTERPRISE')
  const [mockConnected, setMockConnected] = useState(false)

  const { data: crbBalance, refetch: refetchBalance } = useReadContract({
    address: TOKENS.CRB.address,
    abi: abis.MockToken,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address }
  })

  // Read Nonce for Signature
  const { data: nonce, refetch: refetchNonce } = useReadContract({
    address: TOKENS.CRB.address,
    abi: abis.MockToken,
    functionName: 'nonces',
    args: [address],
    query: { enabled: !!address }
  })

  // Write Layer
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isTxConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      setCertificateId('')
      setTonnes(0)
      setMockConnected(false)
      setIsOracleLoading(false)
      refetchBalance()
      refetchNonce()
    }
  }, [isSuccess, refetchBalance, refetchNonce])

  const [isOracleLoading, setIsOracleLoading] = useState(false)

  // When user types in certificate, try to parse tonnes for UI preview
  useEffect(() => {
    const VALID_REGISTRY: Record<string, number> = {
      'VERRA-2026-100-ALPHA': 100,
      'VERRA-2026-500-BETA': 500,
      'VERRA-2026-1000-GAMMA': 1000,
      'VERRA-2026-5000-DELTA': 5000,
      'STRAVA-2026-100-CYCLING': 100,
      'TESLA-2026-500-EV': 500,
      'PLAID-2026-1000-PURCHASE': 1000
    }
    
    const parsed = VALID_REGISTRY[certificateId.toUpperCase()]
    if (parsed) {
      setTonnes(parsed)
    } else {
      setTonnes(0)
    }
  }, [certificateId])

  const handleMockConnect = (integration: 'STRAVA' | 'TESLA' | 'PLAID') => {
    setMockConnected(true)
    if (integration === 'STRAVA') setCertificateId('STRAVA-2026-100-CYCLING')
    if (integration === 'TESLA') setCertificateId('TESLA-2026-500-EV')
    if (integration === 'PLAID') setCertificateId('PLAID-2026-1000-PURCHASE')
  }

  const handleClaim = async () => {
    if (!certificateId || tonnes <= 0 || nonce === undefined) return
    
    setIsOracleLoading(true)
    
    try {
      // 1. Ask Oracle for Signature
      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          certificateId,
          nonce: Number(nonce)
        })
      })
      
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // 2. Submit Signature to Blockchain
      writeContract({
        address: TOKENS.CRB.address,
        abi: abis.MockToken as any,
        functionName: 'claim',
        args: [certificateId, BigInt(data.amount), data.signature as `0x${string}`],
      })
    } catch (e) {
      console.error(e)
      setIsOracleLoading(false)
    }
  }

  const isClaiming = isPending || isTxConfirming
  const estimatedCrb = tonnes ? (tonnes * 100).toFixed(2) : '0.00'

  return (
    <div className="bg-card p-4 sm:p-6 shadow-[var(--box-shadow-neon-sm)] w-full border border-border relative cyber-chamfer-sm">
      <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
        <h2 className="text-lg font-bold font-sans tracking-widest text-foreground uppercase">Claim Carbon Offset</h2>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        {['ENTERPRISE', 'STRAVA', 'TESLA', 'PLAID'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab as any)
              setCertificateId('')
              setTonnes(0)
              setMockConnected(false)
            }}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-accent text-background border-accent shadow-[var(--box-shadow-neon-sm)]' 
                : 'bg-muted text-muted-foreground border-border hover:bg-input hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'ENTERPRISE' ? (
        <div className="bg-input p-4 mb-4 border border-border focus-within:border-accent transition-all cyber-chamfer-sm">
          <div className="flex justify-between text-xs font-mono text-muted-foreground mb-3 tracking-widest uppercase">
            <span>Carbon Registry Certificate</span>
            <span>(e.g., VERRA-2026-500-ABC)</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <input
              type="text"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value.toUpperCase())}
              placeholder="VERRA-YYYY-TONNES-RANDOM"
              className="bg-transparent text-xl font-mono outline-none w-full text-accent uppercase"
            />
          </div>
        </div>
      ) : (
        <div className="bg-input p-4 mb-4 border border-border cyber-chamfer-sm flex flex-col items-center justify-center py-8">
          {!mockConnected ? (
            <>
              <p className="text-muted-foreground font-mono text-sm mb-4 text-center">
                Connect your {activeTab} account to automatically verify your green behavior.
              </p>
              <button 
                onClick={() => handleMockConnect(activeTab)}
                className="bg-accent/20 border border-accent text-accent px-6 py-2 font-mono font-bold uppercase tracking-widest hover:bg-accent hover:text-background transition-all"
              >
                Connect {activeTab}
              </button>
            </>
          ) : (
            <div className="text-center">
              <p className="text-accent font-mono font-bold text-lg mb-2 uppercase tracking-widest">Connected & Verified!</p>
              <p className="text-muted-foreground font-mono text-sm">
                Generated Proof: {certificateId}
              </p>
            </div>
          )}
        </div>
      )}

      {tonnes > 0 && (
        <div className="bg-input p-4 mb-6 border border-border cyber-chamfer-sm relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
          <h3 className="text-xs font-mono text-muted-foreground mb-4 uppercase tracking-widest pl-2">Reward Estimate:</h3>
          <div className="flex justify-between items-center pl-2">
            <span className="text-2xl font-mono text-foreground">+{estimatedCrb}</span>
            <span className="text-accent font-bold font-mono text-xl">{TOKENS.CRB.symbol}</span>
          </div>
        </div>
      )}

      {!isConnected ? (
        <WidgetConnectButton />
      ) : (
        <button 
          onClick={handleClaim}
          disabled={isClaiming || isOracleLoading || !certificateId || tonnes <= 0}
          className="w-full bg-accent border-2 border-accent text-background py-4 font-mono font-bold text-lg uppercase tracking-widest cyber-chamfer hover:brightness-110 shadow-[var(--box-shadow-neon-lg)] transition-all disabled:bg-muted disabled:border-border disabled:text-muted-foreground disabled:shadow-none"
        >
          {isOracleLoading ? 'Contacting Oracle...' : isClaiming ? 'Mining Transaction...' : 'Verify Proof & Claim CRB'}
        </button>
      )}

      {isConnected && (
        <div className="mt-4 text-center">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Your Balance: <span className="text-foreground">{crbBalance ? Number(formatUnits(crbBalance as bigint, TOKENS.CRB.decimals)).toFixed(2) : '0.00'} CRB</span>
          </p>
        </div>
      )}
    </div>
  )
}
