'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { parseUnits, formatUnits } from 'viem'
import addresses from '@/config/addresses.json'
import abis from '@/config/abis.json'

const TOKENS = {
  CRB: { address: addresses.mockEthAddress as `0x${string}`, decimals: 18, symbol: 'CRB' }
}

export function OffsetWidget() {
  const { isConnected, address, chainId } = useAccount()
  const [certificateId, setCertificateId] = useState('')
  const [tonnes, setTonnes] = useState(0)

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
      setIsOracleLoading(false)
      refetchBalance()
      refetchNonce()
    }
  }, [isSuccess, refetchBalance, refetchNonce])

  const [isOracleLoading, setIsOracleLoading] = useState(false)

  // When user types in certificate, try to parse tonnes for UI preview
  useEffect(() => {
    const parts = certificateId.split('-')
    if (parts.length === 4 && parts[0] === 'VERRA') {
      const parsed = Number(parts[2])
      if (!isNaN(parsed) && parsed > 0) {
        setTonnes(parsed)
        return
      }
    }
    setTonnes(0)
  }, [certificateId])

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
        <button disabled className="w-full bg-muted border-2 border-border text-muted-foreground py-4 font-mono font-bold text-lg uppercase tracking-widest cyber-chamfer">
          Connect Wallet
        </button>
      ) : chainId !== sepolia.id ? (
        <button disabled className="w-full bg-destructive/20 border-2 border-destructive text-destructive py-4 font-mono font-bold text-lg uppercase tracking-widest cyber-chamfer">
          Wrong Network
        </button>
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
