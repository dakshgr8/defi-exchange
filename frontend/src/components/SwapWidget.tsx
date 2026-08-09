'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import addresses from '@/config/addresses.json'
import abis from '@/config/abis.json'

const TOKENS = {
  ETH: { address: addresses.mockEthAddress as `0x${string}`, decimals: 18, symbol: 'CRB', icon: '⚡' },
  USDC: { address: addresses.mockUsdcAddress as `0x${string}`, decimals: 18, symbol: 'USDT', icon: '💵' }
}

export function SwapWidget() {
  const { isConnected, address } = useAccount()
  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount, setOutputAmount] = useState('')
  const [isToken0, setIsToken0] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [slippage, setSlippage] = useState('0.5')
  
  // Animation state for the switch button
  const [isSpinning, setIsSpinning] = useState(false)

  const tokenIn = isToken0 ? TOKENS.ETH : TOKENS.USDC
  const tokenOut = isToken0 ? TOKENS.USDC : TOKENS.ETH

  // 1. READ LAYER
  const { data: reserves, refetch: refetchReserves } = useReadContracts({
    contracts: [
      { address: addresses.poolAddress as `0x${string}`, abi: abis.LiquidityPool, functionName: 'reserve0' },
      { address: addresses.poolAddress as `0x${string}`, abi: abis.LiquidityPool, functionName: 'reserve1' }
    ]
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenIn.address,
    abi: abis.MockToken,
    functionName: 'allowance',
    args: [address, addresses.poolAddress],
    query: { enabled: !!address }
  })

  const reserve0 = reserves?.[0].result as bigint | undefined
  const reserve1 = reserves?.[1].result as bigint | undefined

  // 2. FRONTEND MATH
  useEffect(() => {
    if (!inputAmount || isNaN(Number(inputAmount)) || !reserve0 || !reserve1) {
      setOutputAmount('')
      return
    }

    try {
      const amountInBigInt = parseUnits(inputAmount, tokenIn.decimals)
      if (amountInBigInt === 0n) {
        setOutputAmount('')
        return
      }

      const reserveIn = isToken0 ? reserve0 : reserve1
      const reserveOut = isToken0 ? reserve1 : reserve0

      const amountInWithFee = amountInBigInt * 997n
      const numerator = amountInWithFee * reserveOut
      const denominator = (reserveIn * 1000n) + amountInWithFee
      
      const expectedOut = numerator / denominator
      setOutputAmount(formatUnits(expectedOut, tokenOut.decimals))
    } catch (e) {
      setOutputAmount('')
    }
  }, [inputAmount, isToken0, reserve0, reserve1, tokenIn.decimals, tokenOut.decimals])

  // 3. WRITE LAYER (Approve & Swap)
  const { writeContract: writeApprove, data: approveHash, isPending: isApprovingReq } = useWriteContract()
  const { writeContract: writeSwap, data: swapHash, isPending: isSwappingReq } = useWriteContract()

  const { isLoading: isApprovingTx, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isLoading: isSwappingTx, isSuccess: isSwapSuccess } = useWaitForTransactionReceipt({ hash: swapHash })

  useEffect(() => {
    if (isApproveSuccess) refetchAllowance()
  }, [isApproveSuccess, refetchAllowance])

  useEffect(() => {
    if (isSwapSuccess) {
      setInputAmount('')
      setOutputAmount('')
      refetchAllowance()
      refetchReserves()
    }
  }, [isSwapSuccess, refetchAllowance, refetchReserves])

  const parsedInput = inputAmount ? parseUnits(inputAmount, tokenIn.decimals) : 0n
  const needsApproval = allowance !== undefined && (allowance as bigint) < parsedInput

  const isApproving = isApprovingReq || isApprovingTx
  const isSwapping = isSwappingReq || isSwappingTx

  const handleApprove = () => {
    if (!parsedInput) return
    writeApprove({
      address: tokenIn.address,
      abi: abis.MockToken,
      functionName: 'approve',
      args: [addresses.poolAddress as `0x${string}`, parsedInput],
    })
  }

  const handleSwap = () => {
    if (!parsedInput) return
    writeSwap({
      address: addresses.poolAddress as `0x${string}`,
      abi: abis.LiquidityPool,
      functionName: 'swap',
      args: [tokenIn.address, parsedInput],
    })
  }

  const handleSwitchTokens = () => {
    setIsSpinning(true)
    setIsToken0(!isToken0)
    setInputAmount(outputAmount)
    setTimeout(() => setIsSpinning(false), 300)
  }

  const priceImpact = outputAmount && reserve0 && reserve1 ? (Number(inputAmount) / (Number(inputAmount) + Number(formatUnits(isToken0 ? reserve0 : reserve1, 18))) * 100).toFixed(2) : "0.00"

  return (
    <div className="bg-card p-4 sm:p-6 shadow-[var(--box-shadow-neon-sm)] w-full border border-border relative">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-md z-50 p-6 flex flex-col justify-center border border-accent cyber-chamfer-sm">
          <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
            <h3 className="text-xl font-bold font-sans tracking-widest text-accent uppercase">CONFIG // SYS</h3>
            <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-destructive font-mono font-bold transition"> [ X ] </button>
          </div>
          <div className="mb-6">
            <label className="text-xs font-mono text-muted-foreground mb-3 block uppercase tracking-[0.2em]">&gt; SLIPPAGE_TOLERANCE</label>
            <div className="flex gap-2">
              {['0.1', '0.5', '1.0'].map(val => (
                <button 
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`flex-1 py-2 rounded-none text-sm font-mono font-bold border transition-all ${slippage === val ? 'bg-accent/20 border-accent text-accent shadow-[var(--box-shadow-neon-sm)]' : 'bg-muted border-border text-muted-foreground hover:border-muted-foreground'}`}
                >
                  {val}%
                </button>
              ))}
              <div className="flex items-center bg-input border border-border px-3 focus-within:border-accent focus-within:shadow-[var(--box-shadow-neon-sm)] transition-all">
                <span className="text-accent text-sm mr-1">&gt;</span>
                <input type="text" placeholder="CUST" className="w-16 bg-transparent text-sm font-mono outline-none text-foreground" />
                <span className="text-muted-foreground text-sm ml-1">%</span>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-mono text-muted-foreground mb-3 block uppercase tracking-[0.2em]">&gt; TX_DEADLINE</label>
            <div className="flex items-center gap-2">
              <span className="text-accent text-sm">&gt;</span>
              <input type="number" defaultValue="20" className="w-20 bg-input border border-border px-3 py-2 text-sm font-mono outline-none focus:border-accent transition-all text-center text-foreground" />
              <span className="text-xs font-mono text-muted-foreground">MINUTES</span>
            </div>
          </div>
          <button onClick={() => setShowSettings(false)} className="mt-6 w-full bg-muted border border-border hover:border-accent hover:text-accent text-foreground font-mono font-bold py-3 uppercase tracking-[0.2em] transition-colors cyber-chamfer-sm">
            COMMIT_CHANGES
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6 relative z-10 border-b border-border pb-2">
        <h2 className="text-lg font-bold font-sans tracking-widest text-foreground uppercase">Swap</h2>
        <button onClick={() => setShowSettings(true)} className="text-muted-foreground hover:text-accent transition-all hover:rotate-90 duration-300 p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>

      {/* Input Section */}
      <div className="bg-input p-4 mb-2 border border-border focus-within:border-accent focus-within:shadow-[var(--box-shadow-neon-sm)] transition-all cyber-chamfer-sm relative group">
        <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
        <div className="flex justify-between text-xs font-mono text-muted-foreground mb-3 tracking-widest uppercase">
          <span>You Pay</span>
          <span className="cursor-pointer hover:text-accent transition">BAL: {isConnected ? '1,000.00' : '0.00'}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <input
            type="number"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder="0.00"
            className="bg-transparent text-3xl font-mono outline-none w-full placeholder-muted-foreground text-accent"
          />
          <div className="bg-muted border border-border text-foreground px-3 py-2 font-mono font-bold flex items-center gap-2 cyber-chamfer-sm min-w-fit">
            <span>{tokenIn.symbol}</span>
          </div>
        </div>
      </div>

      {/* Switch Button */}
      <div className="flex justify-center -my-3 relative z-10">
        <button 
          onClick={handleSwitchTokens}
          className={`bg-card p-2 border-2 border-border hover:border-accent transition-all text-muted-foreground hover:text-accent shadow-lg ${isSpinning ? 'rotate-180' : ''} duration-300`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
        </button>
      </div>

      {/* Output Section */}
      <div className="bg-input p-4 mb-6 border border-border transition-all cyber-chamfer-sm relative">
        <div className="flex justify-between text-xs font-mono text-muted-foreground mb-3 tracking-widest uppercase">
          <span>You Receive</span>
          <span>BAL: {isConnected ? '500.00' : '0.00'}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <input
            type="text"
            value={outputAmount}
            readOnly
            placeholder="0.00"
            className="bg-transparent text-3xl font-mono outline-none w-full text-muted-foreground"
          />
          <button className="bg-muted border border-border px-3 py-2 font-mono font-bold flex items-center gap-2 cyber-chamfer-sm min-w-fit text-muted-foreground">
            <span>{tokenOut.symbol}</span>
          </button>
        </div>
      </div>

      {/* Trade Info / Route details */}
      {inputAmount && outputAmount && (
        <div className="p-3 mb-6 border border-border bg-muted/50 text-xs font-mono cyber-chamfer-sm">
          <div className="flex justify-between items-center py-1 text-muted-foreground">
            <span>Price Impact</span>
            <span className={`${Number(priceImpact) > 5 ? 'text-destructive' : Number(priceImpact) > 1 ? 'text-yellow-500' : 'text-accent'}`}>
              [{priceImpact}%]
            </span>
          </div>
          <div className="flex justify-between items-center py-1 text-muted-foreground">
            <span>Minimum Received</span>
            <span className="text-foreground">{(Number(outputAmount) * (1 - Number(slippage)/100)).toFixed(4)} {tokenOut.symbol}</span>
          </div>
          <div className="flex justify-between items-center py-1 text-muted-foreground">
            <span>Network Fee</span>
            <span className="text-foreground">[0.0012 CRB]</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-2">
        {!isConnected ? (
          <button disabled className="w-full bg-muted border-2 border-border text-muted-foreground py-4 font-mono font-bold text-lg uppercase tracking-widest cyber-chamfer">
            Connect Wallet
          </button>
        ) : needsApproval ? (
          <button 
            onClick={handleApprove}
            disabled={isApproving || !inputAmount}
            className="w-full bg-transparent border-2 border-accent text-accent py-4 font-mono font-bold text-lg uppercase tracking-widest cyber-chamfer hover:bg-accent hover:text-background shadow-[var(--box-shadow-neon)] transition-all disabled:border-muted disabled:text-muted-foreground disabled:hover:bg-transparent disabled:shadow-none"
          >
            {isApproving ? 'Approving...' : `Approve ${tokenIn.symbol}`}
          </button>
        ) : (
          <button 
            onClick={handleSwap}
            disabled={isSwapping || !inputAmount || !outputAmount}
            className="relative group w-full bg-accent border-2 border-accent text-background py-4 font-mono font-bold text-lg uppercase tracking-widest cyber-chamfer hover:brightness-110 shadow-[var(--box-shadow-neon-lg)] transition-all overflow-hidden disabled:bg-muted disabled:border-border disabled:text-muted-foreground disabled:shadow-none"
          >
            <span className="relative z-10">{isSwapping ? 'Swapping...' : 'Swap'}</span>
            {!isSwapping && inputAmount && outputAmount && (
               <div className="absolute inset-0 bg-white/20 w-0 group-hover:w-full transition-all duration-300 ease-out z-0"></div>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
