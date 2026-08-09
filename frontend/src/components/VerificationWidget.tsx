'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import addresses from '../config/addresses.json'
import abis from '../config/abis.json'

export function VerificationWidget() {
  const { isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const [proofUrl, setProofUrl] = useState('')
  const [requestAmount, setRequestAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const [nextClaimId, setNextClaimId] = useState(0)
  const [claims, setClaims] = useState<any[]>([])

  // Fetch all claims when component loads
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
        setNextClaimId(count);

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
            yesVotes: (claim as any)[3],
            noVotes: (claim as any)[4],
            processed: (claim as any)[5]
          });
        }
        setClaims(fetchedClaims);
      } catch (err) {
        console.error("Failed to fetch claims:", err);
      }
    };
    
    if (isConnected) {
      fetchClaims();
    }
  }, [isConnected, publicClient, message]) // re-fetch when message changes (after actions)

  const handleSubmitClaim = async () => {
    if (!proofUrl || !requestAmount) {
      setMessage('ERROR: Missing fields.')
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
      setMessage('WAITING_FOR_CONFIRMATION...')
      await publicClient?.waitForTransactionReceipt({ hash: tx })
      setMessage('CLAIM_SUBMITTED_SUCCESSFULLY!')
      setProofUrl('')
      setRequestAmount('')
    } catch (err: any) {
      console.error(err)
      setMessage(`ERROR: ${err.message.substring(0, 40)}...`)
    }
    setLoading(false)
  }

  const handleVote = async (claimId: number, voteYes: boolean) => {
    setLoading(true)
    setMessage(`VOTING_${voteYes ? 'YES' : 'NO'}...`)
    try {
      const tx = await writeContractAsync({
        address: (addresses as any).mockEthAddress,
        abi: (abis as any).MockToken,
        functionName: 'voteOnClaim',
        args: [BigInt(claimId), voteYes]
      })
      setMessage('WAITING_FOR_CONFIRMATION...')
      await publicClient?.waitForTransactionReceipt({ hash: tx })
      setMessage('VOTE_CAST_SUCCESSFULLY!')
    } catch (err: any) {
      console.error(err)
      const shortMsg = err?.shortMessage || err?.message || 'Unknown error'
      setMessage(`ERROR: ${shortMsg.substring(0, 100)}`)
    }
    setLoading(false)
  }

  const handleProcess = async (claimId: number) => {
    setLoading(true)
    setMessage('PROCESSING_CLAIM...')
    try {
      const tx = await writeContractAsync({
        address: (addresses as any).mockEthAddress,
        abi: (abis as any).MockToken,
        functionName: 'processClaim',
        args: [BigInt(claimId)]
      })
      setMessage('WAITING_FOR_CONFIRMATION...')
      await publicClient?.waitForTransactionReceipt({ hash: tx })
      setMessage('CLAIM_PROCESSED_SUCCESSFULLY!')
    } catch (err: any) {
      console.error(err)
      const shortMsg = err?.shortMessage || err?.message || 'Unknown error'
      setMessage(`ERROR: ${shortMsg.substring(0, 100)}`)
    }
    setLoading(false)
  }

  if (!isConnected) {
    return (
      <div className="w-full bg-input border border-border p-6 flex flex-col items-center justify-center space-y-4 cyber-chamfer-sm">
        <p className="text-muted-foreground font-mono tracking-widest uppercase">Wallet Not Connected</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-card p-4 sm:p-6 shadow-[var(--box-shadow-neon-sm)] w-full border border-border">
        
        {/* CREATE CLAIM SECTION */}
        <div className="mb-8">
            <h2 className="text-lg font-bold font-sans tracking-widest text-foreground uppercase border-b border-border pb-2 mb-4">
                Submit Green Proof (Request CRB)
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-mono tracking-widest text-muted-foreground uppercase mb-1">Proof URL (e.g. Solar API Link)</label>
                    <input 
                    type="text"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-input border border-border p-3 text-foreground font-mono text-sm focus:outline-none focus:border-primary focus:shadow-[var(--box-shadow-neon-sm)] transition-all"
                    disabled={loading}
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-mono tracking-widest text-muted-foreground uppercase mb-1">Requested CRB</label>
                    <input 
                    type="number"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-input border border-border p-3 text-foreground font-mono text-sm focus:outline-none focus:border-primary focus:shadow-[var(--box-shadow-neon-sm)] transition-all"
                    disabled={loading}
                    />
                </div>
                
                <button 
                    onClick={handleSubmitClaim}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono tracking-widest uppercase py-3 px-4 border border-primary cyber-chamfer-sm shadow-[var(--box-shadow-neon-sm)] transition-all disabled:opacity-50"
                >
                    {loading ? 'PROCESSING...' : 'SUBMIT CLAIM'}
                </button>
            </div>
        </div>

        {/* LIST CLAIMS SECTION */}
        <div>
            <h2 className="text-lg font-bold font-sans tracking-widest text-foreground uppercase border-b border-border pb-2 mb-4">
                DAO Peer-Verification (Open Claims)
            </h2>
            
            {claims.length === 0 ? (
                <p className="text-muted-foreground font-mono tracking-widest text-sm uppercase">NO_CLAIMS_FOUND</p>
            ) : (
                <div className="space-y-4">
                    {claims.map((claim) => (
                        <div key={claim.id} className="bg-input border border-border p-4 cyber-chamfer-sm relative">
                            {claim.processed && (
                                <div className="absolute top-2 right-2 bg-muted text-muted-foreground text-xs px-2 py-1 uppercase font-bold tracking-widest">PROCESSED</div>
                            )}
                            <p className="font-mono text-sm text-foreground mb-1"><span className="text-primary">ID:</span> {claim.id}</p>
                            <p className="font-mono text-sm text-foreground mb-1"><span className="text-primary">User:</span> {claim.user.substring(0,6)}...{claim.user.substring(38)}</p>
                            <p className="font-mono text-sm text-foreground mb-1">
                                <span className="text-primary">Proof:</span> <a href={claim.proofUrl} target="_blank" rel="noreferrer" className="underline hover:text-primary">{claim.proofUrl}</a>
                            </p>
                            <p className="font-mono text-sm text-foreground mb-4"><span className="text-primary">Requested:</span> {formatUnits(claim.amountRequested, 18)} CRB</p>
                            
                            <div className="flex gap-4 mb-4">
                                <div className="text-green-500 font-bold font-mono">YES: {Number(formatUnits(claim.yesVotes, 18)).toFixed(2)}</div>
                                <div className="text-red-500 font-bold font-mono">NO: {Number(formatUnits(claim.noVotes, 18)).toFixed(2)}</div>
                            </div>

                            {!claim.processed && (
                                <div className="flex gap-2 flex-wrap">
                                    <button 
                                        onClick={() => handleVote(claim.id, true)}
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-500 text-white font-bold font-mono tracking-widest uppercase py-2 px-4 border border-green-400 cyber-chamfer-sm transition-all text-xs"
                                    >VOTE YES</button>
                                    <button 
                                        onClick={() => handleVote(claim.id, false)}
                                        disabled={loading}
                                        className="bg-red-600 hover:bg-red-500 text-white font-bold font-mono tracking-widest uppercase py-2 px-4 border border-red-400 cyber-chamfer-sm transition-all text-xs"
                                    >VOTE NO</button>
                                    <div className="flex-1"></div>
                                    <button 
                                        onClick={() => handleProcess(claim.id)}
                                        disabled={loading}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono tracking-widest uppercase py-2 px-4 border border-primary cyber-chamfer-sm transition-all text-xs"
                                    >PROCESS</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        {message && (
          <div className="mt-4 p-3 bg-secondary/20 border border-secondary text-secondary-foreground font-mono text-sm cyber-chamfer-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
