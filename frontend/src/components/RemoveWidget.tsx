'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import addresses from '@/config/addresses.json'
import abis from '@/config/abis.json'

const TOKENS = {
  ETH: { decimals: 18, symbol: 'mETH' },
  USDC: { decimals: 18, symbol: 'mUSDC' }
}

export function RemoveWidget() {
  const { isConnected, address } = useAccount()
  const [percentage, setPercentage] = useState(50)

  // 1. READ LAYER (Fetch Reserves, Total Supply, and User Balance)
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

  // 2. FRONTEND MATH (Calculate expected returns)
  let expected0 = 0n
  let expected1 = 0n
  let sharesToBurn = 0n

  if (userBalance && totalSupply && reserve0 && reserve1) {
    sharesToBurn = (userBalance * BigInt(percentage)) / 100n
    expected0 = (sharesToBurn * reserve0) / totalSupply
    expected1 = (sharesToBurn * reserve1) / totalSupply
  }

  // 3. WRITE LAYER (Remove Liquidity)
  const { writeContract, data: hash, isPending: isReq } = useWriteContract()
  const { isLoading: isTx, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
        refetch()
        setPercentage(0) // Reset slider after success
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
    <div className="bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-700 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Remove Liquidity</h2>
      </div>

      {!hasLiquidity ? (
        <div className="bg-gray-900 p-8 rounded-xl text-center border border-gray-800 mt-4">
          <p className="text-gray-400">You don't have any LP tokens in this pool.</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-900 p-4 rounded-xl mb-4 border border-gray-800 mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Amount to Remove</span>
              <span className="font-bold text-xl text-blue-400">{percentage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-3 text-xs text-gray-500 font-medium">
              <button onClick={() => setPercentage(25)} className="hover:text-white transition-colors bg-gray-800 px-2 py-1 rounded">25%</button>
              <button onClick={() => setPercentage(50)} className="hover:text-white transition-colors bg-gray-800 px-2 py-1 rounded">50%</button>
              <button onClick={() => setPercentage(75)} className="hover:text-white transition-colors bg-gray-800 px-2 py-1 rounded">75%</button>
              <button onClick={() => setPercentage(100)} className="hover:text-white transition-colors bg-gray-800 px-2 py-1 rounded">Max</button>
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl mb-6 border border-gray-800">
            <h3 className="text-sm text-gray-400 mb-3">You will receive (Estimated):</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xl">{formatUnits(expected0, TOKENS.ETH.decimals)}</span>
              <span className="bg-gray-800 px-3 py-1 rounded-lg font-medium min-w-[80px] text-center">{TOKENS.ETH.symbol}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xl">{formatUnits(expected1, TOKENS.USDC.decimals)}</span>
              <span className="bg-gray-800 px-3 py-1 rounded-lg font-medium min-w-[80px] text-center">{TOKENS.USDC.symbol}</span>
            </div>
          </div>

          {!isConnected ? (
            <button disabled className="w-full bg-gray-700 text-gray-400 py-4 rounded-xl font-bold text-lg">
              Connect Wallet First
            </button>
          ) : (
            <button 
              onClick={handleRemove}
              disabled={isRemoving || sharesToBurn === 0n}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
            >
              {isRemoving ? 'Removing...' : 'Remove Liquidity'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
