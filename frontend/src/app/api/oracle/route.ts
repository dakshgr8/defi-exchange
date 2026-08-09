import { NextResponse } from 'next/server'
import { createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import addresses from '@/config/addresses.json'

// Domain for EIP-712
const domain = {
  name: 'Carbon', // Must match the Token name in the smart contract exactly
  version: '1',
  chainId: sepolia.id,
  verifyingContract: addresses.mockEthAddress as `0x${string}`,
} as const

// The Claim struct type
const types = {
  Claim: [
    { name: 'user', type: 'address' },
    { name: 'certificateId', type: 'string' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const

export async function POST(req: Request) {
  try {
    const { userAddress, certificateId, nonce } = await req.json()

    if (!userAddress || !certificateId || nonce === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Check against the Mock Registry Database
    // In a real startup, you would query Verra's enterprise API here.
    const VALID_REGISTRY: Record<string, number> = {
      'VERRA-2026-100-ALPHA': 100,
      'VERRA-2026-500-BETA': 500,
      'VERRA-2026-1000-GAMMA': 1000,
      'VERRA-2026-5000-DELTA': 5000,
      'STRAVA-2026-100-CYCLING': 100,
      'TESLA-2026-500-EV': 500,
      'PLAID-2026-1000-PURCHASE': 1000
    }

    const tonnes = VALID_REGISTRY[certificateId.toUpperCase()]
    
    if (!tonnes) {
      return NextResponse.json({ 
        error: 'Invalid or Unrecognized Certificate ID. Please verify with the registry.' 
      }, { status: 400 })
    }

    console.log(`[ORACLE] Verifying certificate ${certificateId} for ${tonnes} tonnes of offset for ${userAddress}...`)
    
    // 2. Calculate the reward amount
    const crbAmount = (tonnes * 100).toString()
    const parsedAmount = parseUnits(crbAmount, 18)

    // 3. Generate the cryptographic signature using the Oracle's Private Key
    const privateKey = process.env.ORACLE_PRIVATE_KEY as `0x${string}`
    if (!privateKey) {
      return NextResponse.json({ error: 'Oracle offline: No private key configured' }, { status: 500 })
    }

    const account = privateKeyToAccount(privateKey)

    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: 'Claim',
      message: {
        user: userAddress as `0x${string}`,
        certificateId,
        amount: parsedAmount,
        nonce: BigInt(nonce),
      },
    })

    console.log(`[ORACLE] Cryptographic signature generated successfully!`)

    return NextResponse.json({ signature, amount: parsedAmount.toString() })

  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
