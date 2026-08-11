'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import addresses from '../config/addresses.json'
import abis from '../config/abis.json'
import { WidgetConnectButton } from '@/components/WidgetConnectButton'

export function VerificationWidget() {
  const { isConnected, address: userAddress } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const [proofUrl, setProofUrl] = useState('')
  const [requestAmount, setRequestAmount] = useState('')
  const [stakeAmount, setStakeAmount] = useState('10')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [claims, setClaims] = useState<any[]>([])
  const [now, setNow] = useState(Math.floor(Date.now() / 1000))

  // Update "now" every 10 seconds for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 10000)
    return () => clearInterval(interval)
  }, [])

  // Fetch all claims
  useEffect(() => {
    const fetchClaims = async () => {
      if (!publicClient) return;
      try {
        const nextId = await publicClient.readContract({
          address: (addresses as any).mockEthAddress,
          abi: (abis as any).MockToken,
          functionName: 'nextClaimId'
        });
        const count = Number(nextId);
        const fetchedClaims = [];
        for (let i = 0; i < count; i++) {
          const claim = await publicClient.readContract({
            address: (addresses as any).mockEthAddress,
            abi: (abis as any).MockToken,
            functionName: 'claims',
            args: [i]
          });
          fetchedClaims.push({
            id: i,
            user: (claim as any)[0],
            proofUrl: (claim as any)[1],
            amountRequested: (claim as any)[2],
            yesStake: (claim as any)[3],
            noStake: (claim as any)[4],
            processed: (claim as any)[5],
            voterCount: (claim as any)[6],
            deadline: Number((claim as any)[7])
          });
        }
        setClaims(fetchedClaims);
      } catch (err) {
        console.error("Failed to fetch claims:", err);
      }
    };
    if (isConnected) fetchClaims();
  }, [isConnected, publicClient, message, now])

  const handleFinalizeClaim = async (claimId: number) => {
    setLoading(true)
    setMessage(`FINALIZING CLAIM #${claimId}...`)
    try {
      const tx = await writeContractAsync({
        address: (addresses as any).mockEthAddress,
        abi: (abis as any).MockToken,
        functionName: 'finalizeClaim',
        args: [BigInt(claimId)]
      })
      await publicClient?.waitForTransactionReceipt({ hash: tx })
      setMessage(`CLAIM #${claimId} FINALIZED! Rewards & stakes distributed.`)
    } catch (err: any) {
      const shortMsg = err?.shortMessage || err?.message || 'Finalization failed'
      setMessage(`ERROR: ${shortMsg.substring(0, 100)}`)
    }
    setLoading(false)
  }

  const handleSubmitClaim = async () => {
    if (!proofUrl || !requestAmount) {
      setMessage('ERROR: Fill in all fields.')
      return
    }
    setLoading(true)
    setMessage('SUBMITTING_CLAIM...')
    try {
      const tx = await writeContractAsync({
        address: (addresses as any).mockEthAddress,
        abi: (abis as any).MockToken,
        functionName: 'submitClaim',
        args: [proofUrl, parseUnits(requestAmount, 18)]
      })
      await publicClient?.waitForTransactionReceipt({ hash: tx })
      setMessage('CLAIM_SUBMITTED! Voting window is now open for 5 minutes.')
      setProofUrl('')
      setRequestAmount('')
    } catch (err: any) {
      const shortMsg = err?.shortMessage || err?.message || 'Unknown error'
      setMessage(`ERROR: ${shortMsg.substring(0, 100)}`)
    }
    setLoading(false)
  }

  const handleVote = async (claimId: number, voteYes: boolean) => {
    if (!stakeAmount || Number(stakeAmount) < 1) {
      setMessage('ERROR: Minimum stake is 1 CRB')
      return
    }
    setLoading(true)
    setMessage(`STAKING ${stakeAmount} CRB on ${voteYes ? 'YES' : 'NO'}...`)
    try {
      const tx = await writeContractAsync({
        address: (addresses as any).mockEthAddress,
        abi: (abis as any).MockToken,
        functionName: 'voteOnClaim',
        args: [BigInt(claimId), voteYes, parseUnits(stakeAmount, 18)]
      })
      await publicClient?.waitForTransactionReceipt({ hash: tx })
      setMessage(`VOTE_CAST! Staked ${stakeAmount} CRB on ${voteYes ? 'YES' : 'NO'}`)
    } catch (err: any) {
      const shortMsg = err?.shortMessage || err?.message || 'Unknown error'
      setMessage(`ERROR: ${shortMsg.substring(0, 100)}`)
    }
    setLoading(false)
  }

  const formatCountdown = (deadline: number) => {
    const remaining = deadline - now
    if (remaining <= 0) return 'ENDED — Awaiting finalization'
    const mins = Math.floor(remaining / 60)
    const secs = remaining % 60
    return `${mins}m ${secs}s remaining`
  }

  if (!isConnected) {
    return (
      <div className="w-full bg-input border border-border p-8 flex flex-col items-center justify-center space-y-4 cyber-chamfer-sm max-w-md mx-auto">
        <p className="text-muted-foreground font-mono tracking-widest uppercase text-sm">Wallet Not Connected</p>
        <p className="text-xs text-muted-foreground text-center">Connect your Web3 wallet to access peer verification and DAO claims.</p>
        <WidgetConnectButton />
      </div>
    )
  }

  // Separate claims into categories
  const myClaims = claims.filter(c => c.user.toLowerCase() === userAddress?.toLowerCase())
  const openClaims = claims.filter(c => !c.processed)

  return (
    <div className="w-full">
      <div className="bg-card p-4 sm:p-6 shadow-[var(--box-shadow-neon-sm)] w-full border border-border">
        
        {/* SUBMIT CLAIM */}
        <div className="mb-8">
          <h2 className="text-lg font-bold font-sans tracking-widest text-foreground uppercase border-b border-border pb-2 mb-4">
            Submit Green Proof (Request CRB)
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono tracking-widest text-muted-foreground uppercase mb-1">Proof URL (e.g. Solar API / IPFS Link)</label>
              <input type="text" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="https://..." disabled={loading}
                className="w-full bg-input border border-border p-3 text-foreground font-mono text-sm focus:outline-none focus:border-primary focus:shadow-[var(--box-shadow-neon-sm)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-mono tracking-widest text-muted-foreground uppercase mb-1">Requested CRB</label>
              <input type="number" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} placeholder="0.0" disabled={loading}
                className="w-full bg-input border border-border p-3 text-foreground font-mono text-sm focus:outline-none focus:border-primary focus:shadow-[var(--box-shadow-neon-sm)] transition-all" />
            </div>
            <button onClick={handleSubmitClaim} disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono tracking-widest uppercase py-3 px-4 border border-primary cyber-chamfer-sm shadow-[var(--box-shadow-neon-sm)] transition-all disabled:opacity-50">
              {loading ? 'PROCESSING...' : 'SUBMIT CLAIM'}
            </button>
          </div>
        </div>

        {/* STAKE AMOUNT */}
        <div className="mb-6 bg-input border border-border p-4 cyber-chamfer-sm">
          <label className="block text-xs font-mono tracking-widest text-muted-foreground uppercase mb-2">Your Stake Amount (CRB per vote)</label>
          <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="10" disabled={loading} min="1"
            className="w-full bg-card border border-border p-3 text-foreground font-mono text-sm focus:outline-none focus:border-primary focus:shadow-[var(--box-shadow-neon-sm)] transition-all" />
          <p className="text-xs font-mono text-muted-foreground mt-2">⚠️ Stake is LOCKED. Winners earn losers&apos; stakes. Losers forfeit.</p>
        </div>

        {/* OPEN CLAIMS FOR VOTING */}
        <div className="mb-8">
          <h2 className="text-lg font-bold font-sans tracking-widest text-foreground uppercase border-b border-border pb-2 mb-4">
            Open Claims (Vote Now)
          </h2>
          
          {openClaims.length === 0 ? (
            <p className="text-muted-foreground font-mono tracking-widest text-sm uppercase">NO_OPEN_CLAIMS</p>
          ) : (
            <div className="space-y-4">
              {openClaims.map((claim) => (
                <div key={claim.id} className="bg-input border border-border p-4 cyber-chamfer-sm relative">
                  <div className="absolute top-2 right-2 text-xs font-mono text-accent uppercase tracking-widest">
                    ⏱ {formatCountdown(claim.deadline)}
                  </div>
                  <p className="font-mono text-sm text-foreground mb-1"><span className="text-primary">ID:</span> {claim.id}</p>
                  <p className="font-mono text-sm text-foreground mb-1"><span className="text-primary">User:</span> {claim.user.substring(0,6)}...{claim.user.substring(38)}</p>
                  <p className="font-mono text-sm text-foreground mb-1">
                    <span className="text-primary">Proof:</span> <a href={claim.proofUrl} target="_blank" rel="noreferrer" className="underline hover:text-primary">{claim.proofUrl.length > 40 ? claim.proofUrl.substring(0, 40) + '...' : claim.proofUrl}</a>
                  </p>
                  <p className="font-mono text-sm text-foreground mb-4"><span className="text-primary">Requested:</span> {Number(formatUnits(claim.amountRequested, 18)).toLocaleString()} CRB</p>
                  
                  <div className="flex gap-4 mb-2">
                    <div className="text-green-500 font-bold font-mono text-sm">✅ YES: {Number(formatUnits(claim.yesStake, 18)).toLocaleString(undefined, {maximumFractionDigits: 0})} CRB</div>
                    <div className="text-red-500 font-bold font-mono text-sm">❌ NO: {Number(formatUnits(claim.noStake, 18)).toLocaleString(undefined, {maximumFractionDigits: 0})} CRB</div>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground mb-4">Voters: {Number(claim.voterCount)}</p>

                  {now < claim.deadline ? (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => handleVote(claim.id, true)} disabled={loading}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold font-mono tracking-widest uppercase py-2 px-4 border border-green-400 cyber-chamfer-sm transition-all text-xs cursor-pointer">
                        STAKE YES
                      </button>
                      <button onClick={() => handleVote(claim.id, false)} disabled={loading}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold font-mono tracking-widest uppercase py-2 px-4 border border-red-400 cyber-chamfer-sm transition-all text-xs cursor-pointer">
                        STAKE NO
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleFinalizeClaim(claim.id)} disabled={loading}
                      className="bg-accent hover:brightness-110 text-background font-bold font-mono tracking-widest uppercase py-2 px-4 border border-accent cyber-chamfer-sm transition-all text-xs cursor-pointer shadow-[var(--box-shadow-neon-sm)]">
                      {loading ? 'FINALIZING...' : 'FINALIZE CLAIM & DISTRIBUTE STAKES'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MY CLAIMS HISTORY */}
        {myClaims.length > 0 && (
          <div>
            <h2 className="text-lg font-bold font-sans tracking-widest text-foreground uppercase border-b border-border pb-2 mb-4">
              My Claim History
            </h2>
            <div className="space-y-3">
              {myClaims.map((claim) => (
                <div key={`my-${claim.id}`} className="bg-input border border-border p-3 cyber-chamfer-sm flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-foreground"><span className="text-primary">#{claim.id}</span> — {Number(formatUnits(claim.amountRequested, 18)).toLocaleString()} CRB</p>
                    <p className="font-mono text-xs text-muted-foreground">{claim.proofUrl.length > 50 ? claim.proofUrl.substring(0, 50) + '...' : claim.proofUrl}</p>
                  </div>
                  <div className="text-right">
                    {claim.processed ? (
                      claim.yesStake > claim.noStake ? (
                        <span className="text-green-500 font-bold font-mono text-sm">✅ APPROVED</span>
                      ) : (
                        <span className="text-red-500 font-bold font-mono text-sm">❌ REJECTED</span>
                      )
                    ) : (
                      <span className="text-accent font-bold font-mono text-sm animate-pulse">⏱ VOTING</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {message && (
          <div className="mt-4 p-3 bg-secondary/20 border border-secondary text-secondary-foreground font-mono text-sm cyber-chamfer-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
