'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import addresses from '@/config/addresses.json'
import abis from '@/config/abis.json'

const TOKENS = {
  CRB: { address: addresses.mockEthAddress as `0x${string}`, decimals: 18, symbol: 'CRB' }
}

export function OffsetWidget() {
  const { isConnected, address } = useAccount()
  const [co2Tonnes, setCo2Tonnes] = useState('')

  const { data: crbBalance, refetch: refetchBalance } = useReadContract({
    address: TOKENS.CRB.address,
    abi: abis.MockToken,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address }
  })

  // Write Layer
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isTxConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      setCo2Tonnes('')
      refetchBalance()
    }
  }, [isSuccess, refetchBalance])

  const handleClaim = () => {
    if (!co2Tonnes) return
    // 1 Tonne of CO2 = 100 CRB tokens
    const crbAmount = (Number(co2Tonnes) * 100).toString()
    const parsedAmount = parseUnits(crbAmount, TOKENS.CRB.decimals)

    writeContract({
      address: TOKENS.CRB.address,
      abi: abis.MockToken,
      functionName: 'claim',
      args: [parsedAmount],
    })
  }

  const isClaiming = isPending || isTxConfirming
  const estimatedCrb = co2Tonnes ? (Number(co2Tonnes) * 100).toFixed(2) : '0.00'

  return (
    <div className="bg-card p-4 sm:p-6 shadow-[var(--box-shadow-neon-sm)] w-full border border-border relative cyber-chamfer-sm">
      <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
        <h2 className="text-lg font-bold font-sans tracking-widest text-foreground uppercase">Claim Carbon Offset</h2>
      </div>

      <div className="bg-input p-4 mb-4 border border-border focus-within:border-accent transition-all cyber-chamfer-sm">
        <div className="flex justify-between text-xs font-mono text-muted-foreground mb-3 tracking-widest uppercase">
          <span>CO2 Offset (Tonnes)</span>
          <span>Proof: Required</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <input
            type="number"
            value={co2Tonnes}
            onChange={(e) => setCo2Tonnes(e.target.value)}
            placeholder="0"
            className="bg-transparent text-3xl font-mono outline-none w-full text-accent"
          />
          <div className="bg-muted border border-border px-3 py-2 font-mono font-bold cyber-chamfer-sm text-sm">
            TONNES
          </div>
        </div>
      </div>

      {co2Tonnes && (
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
      ) : (
        <button 
          onClick={handleClaim}
          disabled={isClaiming || !co2Tonnes || Number(co2Tonnes) <= 0}
          className="w-full bg-accent border-2 border-accent text-background py-4 font-mono font-bold text-lg uppercase tracking-widest cyber-chamfer hover:brightness-110 shadow-[var(--box-shadow-neon-lg)] transition-all disabled:bg-muted disabled:border-border disabled:text-muted-foreground disabled:shadow-none"
        >
          {isClaiming ? 'Verifying Proof & Minting...' : 'Verify Proof & Claim CRB'}
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
