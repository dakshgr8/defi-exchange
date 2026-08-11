'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import addresses from '@/config/addresses.json'
import abis from '@/config/abis.json'
import { WidgetConnectButton } from '@/components/WidgetConnectButton'

const TOKENS = {
  ETH: { decimals: 18, symbol: 'CRB' },
  USDC: { decimals: 18, symbol: 'USDT' }
}

export function RemoveWidget() {
  const { isConnected, address } = useAccount()
  const [percentage, setPercentage] = useState(50)

  const { data: contractData, refetch } = useReadContracts({
    contracts: [
      { address: addresses.poolAddress as `0x${string}`, abi: abis.LiquidityPool, functionName: 'reserve0' },
      { address: addresses.poolAddress as `0x${string}`, abi: abis.LiquidityPool, functionName: 'reserve1' },
      { address: addresses.poolAddress as `0x${string}`, abi: abis.LiquidityPool, functionName: 'totalSupply' },
      { address: addresses.poolAddress as `0x${string}`, abi: abis.LiquidityPool, functionName: 'balanceOf', args: [address || '0x0'] }
    ],
    query: { enabled: !!address }
  })

  const reserve0 = contractData?.[0].result as bigint | undefined
  const reserve1 = contractData?.[1].result as bigint | undefined
  const totalSupply = contractData?.[2].result as bigint | undefined
  const userBalance = contractData?.[3].result as bigint | undefined

  let expected0 = 0n
  let expected1 = 0n
  let sharesToBurn = 0n

  if (userBalance && totalSupply && reserve0 && reserve1) {
    sharesToBurn = (userBalance * BigInt(percentage)) / 100n
    expected0 = (sharesToBurn * reserve0) / totalSupply
    expected1 = (sharesToBurn * reserve1) / totalSupply
  }

  const { writeContract, data: hash, isPending: isReq } = useWriteContract()
  const { isLoading: isTx, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
        refetch()
        setPercentage(0)
    }
  }, [isSuccess, refetch])

  const isRemoving = isReq || isTx
  const hasLiquidity = userBalance && userBalance > 0n

  const handleRemove = () => {
    if (sharesToBurn === 0n) return
    writeContract({
      address: addresses.poolAddress as `0x${string}`,
      abi: abis.LiquidityPool,
      functionName: 'removeLiquidity',
      args: [sharesToBurn],
    })
  }

  return (
    <div className="bg-card p-4 sm:p-6 shadow-[0_0_10px_#ff336640] w-full border border-border cyber-chamfer-sm">
      <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
        <h2 className="text-lg font-bold font-sans tracking-widest text-foreground uppercase">Remove Liquidity</h2>
      </div>

      {!hasLiquidity ? (
        <div className="bg-muted p-8 text-center border border-border cyber-chamfer-sm">
          <p className="text-muted-foreground font-mono uppercase tracking-widest text-sm">No LP Tokens Found</p>
        </div>
      ) : (
        <>
          <div className="bg-input p-4 mb-4 border border-border cyber-chamfer-sm relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-destructive"></div>
            <div className="flex justify-between items-center mb-4 pl-2">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Drain Percentage</span>
              <span className="font-bold text-xl text-destructive font-mono">[{percentage}%]</span>
            </div>
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full h-1 bg-muted appearance-none cursor-pointer mb-2"
                style={{ accentColor: 'var(--color-destructive)' }}
              />
            </div>
            <div className="flex justify-between mt-4 text-xs font-mono text-muted-foreground uppercase tracking-widest pl-2">
              <button onClick={() => setPercentage(25)} className="hover:text-destructive hover:border-destructive border border-border transition-colors bg-muted px-3 py-1 cyber-chamfer-sm">25%</button>
              <button onClick={() => setPercentage(50)} className="hover:text-destructive hover:border-destructive border border-border transition-colors bg-muted px-3 py-1 cyber-chamfer-sm">50%</button>
              <button onClick={() => setPercentage(75)} className="hover:text-destructive hover:border-destructive border border-border transition-colors bg-muted px-3 py-1 cyber-chamfer-sm">75%</button>
              <button onClick={() => setPercentage(100)} className="hover:text-destructive hover:border-destructive border border-border transition-colors bg-muted px-3 py-1 cyber-chamfer-sm text-foreground">MAX</button>
            </div>
          </div>

          <div className="bg-input p-4 mb-6 border border-border cyber-chamfer-sm relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
            <h3 className="text-xs font-mono text-muted-foreground mb-4 uppercase tracking-widest pl-2">Estimated Recovery:</h3>
            <div className="flex justify-between items-center mb-3 pl-2">
              <span className="text-xl font-mono text-foreground">{formatUnits(expected0, TOKENS.ETH.decimals)}</span>
              <span className="bg-muted border border-border px-3 py-1 font-mono font-bold cyber-chamfer-sm">{TOKENS.ETH.symbol}</span>
            </div>
            <div className="flex justify-between items-center pl-2">
              <span className="text-xl font-mono text-foreground">{formatUnits(expected1, TOKENS.USDC.decimals)}</span>
              <span className="bg-muted border border-border px-3 py-1 font-mono font-bold cyber-chamfer-sm">{TOKENS.USDC.symbol}</span>
            </div>
          </div>

          {!isConnected ? (
            <WidgetConnectButton />
          ) : (
            <button 
              onClick={handleRemove}
              disabled={isRemoving || sharesToBurn === 0n}
              className="w-full bg-destructive border-2 border-destructive text-background py-4 font-mono font-bold text-lg uppercase tracking-widest cyber-chamfer hover:brightness-110 shadow-[0_0_15px_#ff336680] transition-all disabled:bg-muted disabled:border-border disabled:text-muted-foreground disabled:shadow-none"
            >
              {isRemoving ? 'Removing...' : 'Remove Liquidity'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
