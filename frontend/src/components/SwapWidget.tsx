'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import addresses from '@/config/addresses.json'
import abis from '@/config/abis.json'

const TOKENS = {
  ETH: { address: addresses.mockEthAddress as `0x${string}`, decimals: 18, symbol: 'mETH' },
  USDC: { address: addresses.mockUsdcAddress as `0x${string}`, decimals: 18, symbol: 'mUSDC' }
}

export function SwapWidget() {
  const { isConnected, address } = useAccount()
  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount, setOutputAmount] = useState('')
  const [isToken0, setIsToken0] = useState(true)

  const tokenIn = isToken0 ? TOKENS.ETH : TOKENS.USDC
  const tokenOut = isToken0 ? TOKENS.USDC : TOKENS.ETH

  // 1. READ LAYER (Fetch Reserves & Allowance)
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

  // 2. FRONTEND MATH (Replicate AMM Invariant with BigInt)
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

  // Sync state after successful transactions
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
  const needsApproval = allowance !== undefined && allowance < parsedInput

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

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Swap</h2>
      </div>

      <div className="bg-gray-900 p-4 rounded-xl mb-2 border border-gray-800 focus-within:border-gray-600 transition-colors">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>You pay</span>
        </div>
        <div className="flex justify-between items-center">
          <input
            type="number"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder="0.0"
            className="bg-transparent text-3xl outline-none w-full"
          />
          <button className="bg-gray-800 px-3 py-1 rounded-lg font-medium min-w-[80px]">
            {tokenIn.symbol}
          </button>
        </div>
      </div>

      <div className="flex justify-center -my-4 relative z-10">
        <button 
          onClick={() => setIsToken0(!isToken0)}
          className="bg-gray-700 p-2 rounded-xl border-4 border-gray-800 hover:bg-gray-600 transition-colors"
        >
          ↓
        </button>
      </div>

      <div className="bg-gray-900 p-4 rounded-xl mb-6 border border-gray-800">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>You receive</span>
        </div>
        <div className="flex justify-between items-center">
          <input
            type="text"
            value={outputAmount}
            readOnly
            placeholder="0.0"
            className="bg-transparent text-3xl outline-none w-full text-gray-300 cursor-not-allowed"
          />
          <button className="bg-gray-800 px-3 py-1 rounded-lg font-medium min-w-[80px]">
            {tokenOut.symbol}
          </button>
        </div>
      </div>

      {!isConnected ? (
        <button disabled className="w-full bg-gray-700 text-gray-400 py-4 rounded-xl font-bold text-lg">
          Connect Wallet First
        </button>
      ) : needsApproval ? (
        <button 
          onClick={handleApprove}
          disabled={isApproving || !inputAmount}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-colors"
        >
          {isApproving ? 'Approving...' : `Approve ${tokenIn.symbol}`}
        </button>
      ) : (
        <button 
          onClick={handleSwap}
          disabled={isSwapping || !inputAmount || !outputAmount}
          className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-colors"
        >
          {isSwapping ? 'Swapping...' : 'Swap'}
        </button>
      )}
    </div>
  )
}
