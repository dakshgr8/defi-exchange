'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import addresses from '@/config/addresses.json'
import abis from '@/config/abis.json'
import { WidgetConnectButton } from '@/components/WidgetConnectButton'

const TOKENS = {
  ETH: { address: addresses.mockEthAddress as `0x${string}`, decimals: 18, symbol: 'CRB' },
  USDC: { address: addresses.mockUsdcAddress as `0x${string}`, decimals: 18, symbol: 'USDT' }
}

export function LiquidityWidget() {
  const { isConnected, address } = useAccount()
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')

  // 1. READ LAYER
  const { data: reserves } = useReadContracts({
    contracts: [
      { address: addresses.poolAddress as `0x${string}`, abi: abis.LiquidityPool, functionName: 'reserve0' },
      { address: addresses.poolAddress as `0x${string}`, abi: abis.LiquidityPool, functionName: 'reserve1' }
    ]
  })

  const { data: allowance0, refetch: refetchAllowance0 } = useReadContract({
    address: TOKENS.ETH.address,
    abi: abis.MockToken,
    functionName: 'allowance',
    args: [address, addresses.poolAddress],
    query: { enabled: !!address }
  })

  const { data: allowance1, refetch: refetchAllowance1 } = useReadContract({
    address: TOKENS.USDC.address,
    abi: abis.MockToken,
    functionName: 'allowance',
    args: [address, addresses.poolAddress],
    query: { enabled: !!address }
  })

  const { data: balance0, refetch: refetchBalance0 } = useReadContract({
    address: TOKENS.ETH.address,
    abi: abis.MockToken,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address }
  })

  const { data: balance1, refetch: refetchBalance1 } = useReadContract({
    address: TOKENS.USDC.address,
    abi: abis.MockToken,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address }
  })

  const reserve0 = reserves?.[0].result as bigint | undefined
  const reserve1 = reserves?.[1].result as bigint | undefined

  // The Auto-Fill Ratio Math
  const handleAmount0Change = (val: string) => {
    setAmount0(val)
    if (!reserve0 || !reserve1 || reserve0 === 0n) return
    const num = Number(val)
    if (isNaN(num)) return
    const ratio = Number(reserve1) / Number(reserve0)
    setAmount1((num * ratio).toFixed(4))
  }

  const handleAmount1Change = (val: string) => {
    setAmount1(val)
    if (!reserve0 || !reserve1 || reserve1 === 0n) return
    const num = Number(val)
    if (isNaN(num)) return
    const ratio = Number(reserve0) / Number(reserve1)
    setAmount0((num * ratio).toFixed(4))
  }

  // 3. WRITE LAYER
  const { writeContract: writeApprove0, data: hashApprove0, isPending: isReqApprove0 } = useWriteContract()
  const { writeContract: writeApprove1, data: hashApprove1, isPending: isReqApprove1 } = useWriteContract()
  const { writeContract: writeAddLiq, data: hashAddLiq, isPending: isReqAddLiq } = useWriteContract()

  const { isLoading: isTxApprove0, isSuccess: isSuccApprove0 } = useWaitForTransactionReceipt({ hash: hashApprove0 })
  const { isLoading: isTxApprove1, isSuccess: isSuccApprove1 } = useWaitForTransactionReceipt({ hash: hashApprove1 })
  const { isLoading: isTxAddLiq, isSuccess: isSuccAddLiq } = useWaitForTransactionReceipt({ hash: hashAddLiq })

  useEffect(() => { if (isSuccApprove0) refetchAllowance0() }, [isSuccApprove0, refetchAllowance0])
  useEffect(() => { if (isSuccApprove1) refetchAllowance1() }, [isSuccApprove1, refetchAllowance1])
  useEffect(() => {
    if (isSuccAddLiq) {
      setAmount0('')
      setAmount1('')
      refetchBalance0()
      refetchBalance1()
    }
  }, [isSuccAddLiq, refetchBalance0, refetchBalance1])

  const safeParseUnits = (val: string, decimals: number) => {
    try {
      return parseUnits(val, decimals)
    } catch (e) {
      return 0n
    }
  }

  const parsed0 = amount0 ? safeParseUnits(amount0, TOKENS.ETH.decimals) : 0n
  const parsed1 = amount1 ? safeParseUnits(amount1, TOKENS.USDC.decimals) : 0n

  const needsApprove0 = allowance0 !== undefined && (allowance0 as bigint) < parsed0
  const needsApprove1 = allowance1 !== undefined && (allowance1 as bigint) < parsed1

  const handleApprove0 = () => writeApprove0({ address: TOKENS.ETH.address, abi: abis.MockToken, functionName: 'approve', args: [addresses.poolAddress as `0x${string}`, parsed0] })
  const handleApprove1 = () => writeApprove1({ address: TOKENS.USDC.address, abi: abis.MockToken, functionName: 'approve', args: [addresses.poolAddress as `0x${string}`, parsed1] })
  
  const handleAddLiquidity = () => {
    writeAddLiq({
      address: addresses.poolAddress as `0x${string}`,
      abi: abis.LiquidityPool,
      functionName: 'addLiquidity',
      args: [parsed0, parsed1],
    })
  }

  const isApproving0 = isReqApprove0 || isTxApprove0
  const isApproving1 = isReqApprove1 || isTxApprove1
  const isAdding = isReqAddLiq || isTxAddLiq

  return (
    <div className="bg-card p-4 sm:p-6 shadow-[var(--box-shadow-neon-sm)] w-full border border-border relative">
      <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
        <h2 className="text-lg font-bold font-sans tracking-widest text-foreground uppercase">Add Liquidity</h2>
      </div>

      <div className="bg-input p-4 mb-2 border border-border focus-within:border-accent transition-all cyber-chamfer-sm">
        <div className="flex justify-between text-xs font-mono text-muted-foreground mb-3 tracking-widest uppercase">
          <span>Deposit Amount</span>
          <span 
            onClick={() => balance0 && handleAmount0Change(formatUnits(balance0 as bigint, TOKENS.ETH.decimals))}
            className="cursor-pointer hover:text-accent transition"
          >
            BAL: {isConnected && balance0 ? Number(formatUnits(balance0 as bigint, TOKENS.ETH.decimals)).toFixed(2) : '0.00'}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <input
            type="number"
            value={amount0}
            onChange={(e) => handleAmount0Change(e.target.value)}
            placeholder="0.00"
            className="bg-transparent text-3xl font-mono outline-none w-full text-accent"
          />
          <div className="bg-muted border border-border px-3 py-2 font-mono font-bold cyber-chamfer-sm">
            {TOKENS.ETH.symbol}
          </div>
        </div>
      </div>

      <div className="flex justify-center -my-3 relative z-10">
        <div className="bg-card p-2 border-2 border-border text-muted-foreground">
          +
        </div>
      </div>

      <div className="bg-input p-4 mb-6 border border-border focus-within:border-accent transition-all cyber-chamfer-sm">
        <div className="flex justify-between text-xs font-mono text-muted-foreground mb-3 tracking-widest uppercase">
          <span>Deposit Amount</span>
          <span 
            onClick={() => balance1 && handleAmount1Change(formatUnits(balance1 as bigint, TOKENS.USDC.decimals))}
            className="cursor-pointer hover:text-accent transition"
          >
            BAL: {isConnected && balance1 ? Number(formatUnits(balance1 as bigint, TOKENS.USDC.decimals)).toFixed(2) : '0.00'}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <input
            type="number"
            value={amount1}
            onChange={(e) => handleAmount1Change(e.target.value)}
            placeholder="0.00"
            className="bg-transparent text-3xl font-mono outline-none w-full text-accent"
          />
          <div className="bg-muted border border-border px-3 py-2 font-mono font-bold cyber-chamfer-sm">
            {TOKENS.USDC.symbol}
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-3">
        {!isConnected ? (
          <WidgetConnectButton />
        ) : (
          <>
            {needsApprove0 && (
              <button 
                onClick={handleApprove0}
                disabled={isApproving0 || !amount0}
                className="w-full bg-transparent border-2 border-accent text-accent py-4 font-mono font-bold uppercase tracking-widest cyber-chamfer hover:bg-accent hover:text-background shadow-[var(--box-shadow-neon-sm)] transition-all"
              >
                {isApproving0 ? 'Approving...' : `Approve ${TOKENS.ETH.symbol}`}
              </button>
            )}
            {needsApprove1 && (
              <button 
                onClick={handleApprove1}
                disabled={isApproving1 || !amount1}
                className="w-full bg-transparent border-2 border-accent-tertiary text-accent-tertiary py-4 font-mono font-bold uppercase tracking-widest cyber-chamfer hover:bg-accent-tertiary hover:text-background shadow-[var(--box-shadow-neon-tertiary)] transition-all"
              >
                {isApproving1 ? 'Approving...' : `Approve ${TOKENS.USDC.symbol}`}
              </button>
            )}
            <button 
              onClick={handleAddLiquidity}
              disabled={isAdding || needsApprove0 || needsApprove1 || !amount0 || !amount1}
              className="w-full bg-accent border-2 border-accent text-background py-4 font-mono font-bold text-lg uppercase tracking-widest cyber-chamfer hover:brightness-110 shadow-[var(--box-shadow-neon-lg)] transition-all disabled:bg-muted disabled:border-border disabled:text-muted-foreground disabled:shadow-none"
            >
              {isAdding ? 'Adding Liquidity...' : 'Add Liquidity'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
