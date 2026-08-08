'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import addresses from '@/config/addresses.json'
import abis from '@/config/abis.json'

const TOKENS = {
  ETH: { address: addresses.mockEthAddress as `0x${string}`, decimals: 18, symbol: 'mETH' },
  USDC: { address: addresses.mockUsdcAddress as `0x${string}`, decimals: 18, symbol: 'mUSDC' }
}

export function LiquidityWidget() {
  const { isConnected, address } = useAccount()
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')

  // 1. READ LAYER (Fetch Reserves & Allowances)
  const { data: contractData, refetch } = useReadContracts({
    contracts: [
      { address: addresses.poolAddress as `0x${string}`, abi: abis.LiquidityPool, functionName: 'reserve0' },
      { address: addresses.poolAddress as `0x${string}`, abi: abis.LiquidityPool, functionName: 'reserve1' },
      { address: TOKENS.ETH.address, abi: abis.MockToken, functionName: 'allowance', args: [address || '0x0', addresses.poolAddress] },
      { address: TOKENS.USDC.address, abi: abis.MockToken, functionName: 'allowance', args: [address || '0x0', addresses.poolAddress] }
    ],
    query: { enabled: !!address }
  })

  const reserve0 = contractData?.[0].result as bigint | undefined
  const reserve1 = contractData?.[1].result as bigint | undefined
  const allowance0 = contractData?.[2].result as bigint | undefined
  const allowance1 = contractData?.[3].result as bigint | undefined

  const isEmptyPool = reserve0 === 0n && reserve1 === 0n

  // 2. FRONTEND MATH (Ratio Auto-Fill)
  const handleAmount0Change = (val: string) => {
    setAmount0(val)
    if (isEmptyPool || !val || isNaN(Number(val)) || !reserve0 || !reserve1) return
    
    try {
      const parsed0 = parseUnits(val, TOKENS.ETH.decimals)
      const optimal1 = (parsed0 * reserve1) / reserve0
      setAmount1(formatUnits(optimal1, TOKENS.USDC.decimals))
    } catch {
      setAmount1('')
    }
  }

  const handleAmount1Change = (val: string) => {
    setAmount1(val)
    if (isEmptyPool || !val || isNaN(Number(val)) || !reserve0 || !reserve1) return
    
    try {
      const parsed1 = parseUnits(val, TOKENS.USDC.decimals)
      const optimal0 = (parsed1 * reserve0) / reserve1
      setAmount0(formatUnits(optimal0, TOKENS.ETH.decimals))
    } catch {
      setAmount0('')
    }
  }

  // 3. WRITE LAYER (Approve 0, Approve 1, Add Liquidity)
  const { writeContract: writeApprove0, data: hashApprove0, isPending: isReqApprove0 } = useWriteContract()
  const { writeContract: writeApprove1, data: hashApprove1, isPending: isReqApprove1 } = useWriteContract()
  const { writeContract: writeAddLiq, data: hashAddLiq, isPending: isReqAddLiq } = useWriteContract()

  const { isLoading: isTxApprove0, isSuccess: isSuccessApprove0 } = useWaitForTransactionReceipt({ hash: hashApprove0 })
  const { isLoading: isTxApprove1, isSuccess: isSuccessApprove1 } = useWaitForTransactionReceipt({ hash: hashApprove1 })
  const { isLoading: isTxAddLiq, isSuccess: isSuccessAddLiq } = useWaitForTransactionReceipt({ hash: hashAddLiq })

  useEffect(() => {
    if (isSuccessApprove0 || isSuccessApprove1) refetch()
  }, [isSuccessApprove0, isSuccessApprove1, refetch])

  useEffect(() => {
    if (isSuccessAddLiq) {
      setAmount0('')
      setAmount1('')
      refetch()
    }
  }, [isSuccessAddLiq, refetch])

  const parsed0 = amount0 ? parseUnits(amount0, TOKENS.ETH.decimals) : 0n
  const parsed1 = amount1 ? parseUnits(amount1, TOKENS.USDC.decimals) : 0n

  const needsApprove0 = allowance0 !== undefined && allowance0 < parsed0
  const needsApprove1 = allowance1 !== undefined && allowance1 < parsed1

  const isApproving0 = isReqApprove0 || isTxApprove0
  const isApproving1 = isReqApprove1 || isTxApprove1
  const isAdding = isReqAddLiq || isTxAddLiq

  // The 4-Tier Button State
  const renderButton = () => {
    if (!isConnected) {
      return <button disabled className="w-full bg-gray-700 text-gray-400 py-4 rounded-xl font-bold text-lg">Connect Wallet First</button>
    }
    
    if (!parsed0 || !parsed1) {
      return <button disabled className="w-full bg-gray-700 text-gray-400 py-4 rounded-xl font-bold text-lg">Enter Amounts</button>
    }

    if (needsApprove0) {
      return (
        <button 
          onClick={() => writeApprove0({ address: TOKENS.ETH.address, abi: abis.MockToken, functionName: 'approve', args: [addresses.poolAddress as `0x${string}`, parsed0] })}
          disabled={isApproving0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-colors"
        >
          {isApproving0 ? `Approving ${TOKENS.ETH.symbol}...` : `Approve ${TOKENS.ETH.symbol}`}
        </button>
      )
    }

    if (needsApprove1) {
      return (
        <button 
          onClick={() => writeApprove1({ address: TOKENS.USDC.address, abi: abis.MockToken, functionName: 'approve', args: [addresses.poolAddress as `0x${string}`, parsed1] })}
          disabled={isApproving1}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-colors"
        >
          {isApproving1 ? `Approving ${TOKENS.USDC.symbol}...` : `Approve ${TOKENS.USDC.symbol}`}
        </button>
      )
    }

    return (
      <button 
        onClick={() => writeAddLiq({ address: addresses.poolAddress as `0x${string}`, abi: abis.LiquidityPool, functionName: 'addLiquidity', args: [parsed0, parsed1] })}
        disabled={isAdding}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-colors"
      >
        {isAdding ? 'Adding Liquidity...' : 'Add Liquidity'}
      </button>
    )
  }

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-700 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Add Liquidity</h2>
      </div>

      {isEmptyPool && (
        <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 p-3 rounded-lg text-sm mb-4">
          ⚠️ You are the first liquidity provider. The ratio of tokens you add will set the initial price of this pool.
        </div>
      )}

      <div className="bg-gray-900 p-4 rounded-xl mb-2 border border-gray-800 focus-within:border-gray-600 transition-colors">
        <div className="flex justify-between items-center">
          <input
            type="number"
            value={amount0}
            onChange={(e) => handleAmount0Change(e.target.value)}
            placeholder="0.0"
            className="bg-transparent text-3xl outline-none w-full"
          />
          <button className="bg-gray-800 px-3 py-1 rounded-lg font-medium min-w-[80px]">{TOKENS.ETH.symbol}</button>
        </div>
      </div>

      <div className="flex justify-center -my-3 relative z-10 text-xl font-bold text-gray-500">
        +
      </div>

      <div className="bg-gray-900 p-4 rounded-xl mb-6 border border-gray-800 focus-within:border-gray-600 transition-colors">
        <div className="flex justify-between items-center">
          <input
            type="number"
            value={amount1}
            onChange={(e) => handleAmount1Change(e.target.value)}
            placeholder="0.0"
            className="bg-transparent text-3xl outline-none w-full"
          />
          <button className="bg-gray-800 px-3 py-1 rounded-lg font-medium min-w-[80px]">{TOKENS.USDC.symbol}</button>
        </div>
      </div>

      {renderButton()}
    </div>
  )
}
