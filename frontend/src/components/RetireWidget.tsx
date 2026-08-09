'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { TOKENS } from '@/config/addresses'
import abis from '@/config/abis.json'

export function RetireWidget() {
  const { isConnected, address } = useAccount()
  const [retireAmount, setRetireAmount] = useState('')
  const [retireNote, setRetireNote] = useState('Offsetting company flights')

  const { data: crbBalance, refetch: refetchBalance } = useReadContract({
    address: TOKENS.CRB.address as `0x${string}`,
    abi: abis.MockToken,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address }
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleRetire = async () => {
    if (!retireAmount || !address) return
    
    writeContract({
      address: TOKENS.CRB.address as `0x${string}`,
      abi: abis.MockToken as any,
      functionName: 'retire',
      args: [parseUnits(retireAmount, 18), retireNote],
    })
  }

  // Clear inputs on success
  if (isSuccess && retireAmount) {
    setRetireAmount('')
    refetchBalance()
  }

  const isRetiring = isPending || isConfirming

  return (
    <div className="bg-card p-4 sm:p-6 shadow-[var(--box-shadow-neon-sm)] w-full border border-border relative cyber-chamfer-sm">
      <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
        <h2 className="text-lg font-bold font-sans tracking-widest text-foreground uppercase">Retire Carbon</h2>
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Permanent Offset</span>
      </div>

      <div className="bg-input p-4 mb-4 border border-border focus-within:border-destructive transition-all cyber-chamfer-sm">
        <div className="flex justify-between text-xs font-mono text-muted-foreground mb-3 tracking-widest uppercase">
          <span>Amount to Burn (CRB)</span>
          <span>Balance: {crbBalance ? Number(formatUnits(crbBalance as bigint, 18)).toFixed(2) : '0.00'}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <input
            type="number"
            value={retireAmount}
            onChange={(e) => setRetireAmount(e.target.value)}
            placeholder="0.0"
            className="bg-transparent text-3xl font-mono outline-none w-full text-destructive"
          />
          <button 
            onClick={() => crbBalance && setRetireAmount(formatUnits(crbBalance as bigint, 18))}
            className="text-xs font-mono bg-destructive/10 text-destructive px-2 py-1 uppercase tracking-widest hover:bg-destructive hover:text-background transition-colors"
          >
            MAX
          </button>
        </div>
      </div>

      <div className="bg-input p-4 mb-6 border border-border focus-within:border-destructive transition-all cyber-chamfer-sm">
        <div className="flex justify-between text-xs font-mono text-muted-foreground mb-3 tracking-widest uppercase">
          <span>Public Retirement Note</span>
        </div>
        <input
          type="text"
          value={retireNote}
          onChange={(e) => setRetireNote(e.target.value)}
          placeholder="Why are you offsetting?"
          maxLength={100}
          className="bg-transparent text-sm font-mono outline-none w-full text-foreground"
        />
      </div>

      {!isConnected ? (
        <button disabled className="w-full bg-muted border border-border text-muted-foreground py-4 font-mono font-bold text-lg uppercase tracking-widest cyber-chamfer-sm">
          Connect Wallet to Retire
        </button>
      ) : (
        <button 
          onClick={handleRetire}
          disabled={isRetiring || !retireAmount || Number(retireAmount) <= 0}
          className="w-full bg-destructive border-2 border-destructive text-background py-4 font-mono font-bold text-lg uppercase tracking-widest cyber-chamfer hover:brightness-110 shadow-[0_0_15px_#ff336660] transition-all disabled:bg-muted disabled:border-border disabled:text-muted-foreground disabled:shadow-none"
        >
          {isRetiring ? 'Burning...' : 'Retire CRB Forever'}
        </button>
      )}
    </div>
  )
}
