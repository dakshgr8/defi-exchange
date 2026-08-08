'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <div className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <button 
          onClick={() => disconnect()}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button 
      onClick={() => connect({ connector: injected() })}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg"
    >
      Connect Wallet
    </button>
  )
}
