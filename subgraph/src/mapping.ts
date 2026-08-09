import { BigInt, BigDecimal } from "@graphprotocol/graph-ts"
import { Swap, Sync } from "../generated/LiquidityPool/LiquidityPool"
import { SwapEvent, PoolSnapshot } from "../generated/schema"

// Helper function to convert token units to readable decimals (18 decimals for both CRB and USDT in our mock)
function toDecimal(amount: BigInt): BigDecimal {
  let bd = amount.toBigDecimal()
  let divisor = BigInt.fromI32(10).pow(18).toBigDecimal()
  return bd.div(divisor)
}

export function handleSync(event: Sync): void {
  let snapshot = new PoolSnapshot(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  
  snapshot.reserve0 = event.params.reserve0
  snapshot.reserve1 = event.params.reserve1
  
  // CRB is token0, USDT is token1
  // Price of CRB in USDT = reserve1 / reserve0
  let r0 = toDecimal(snapshot.reserve0)
  let r1 = toDecimal(snapshot.reserve1)
  
  if (r0.equals(BigDecimal.fromString("0"))) {
    snapshot.crbPriceInUsdt = BigDecimal.fromString("0")
  } else {
    snapshot.crbPriceInUsdt = r1.div(r0)
  }
  
  snapshot.timestamp = event.block.timestamp
  snapshot.save()
}

export function handleSwap(event: Swap): void {
  let swap = new SwapEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  
  swap.sender = event.params.sender
  swap.amount0In = event.params.amount0In
  swap.amount1In = event.params.amount1In
  swap.amount0Out = event.params.amount0Out
  swap.amount1Out = event.params.amount1Out
  
  // The price of CRB (token0) paid in this swap can be calculated by looking at the input/output ratio
  // If amount1In > 0, User bought CRB (sold USDT). Price = amount1In / amount0Out
  // If amount0In > 0, User sold CRB (bought USDT). Price = amount1Out / amount0In
  
  let price = BigDecimal.fromString("0")
  
  if (swap.amount1In.gt(BigInt.fromI32(0)) && swap.amount0Out.gt(BigInt.fromI32(0))) {
    price = toDecimal(swap.amount1In).div(toDecimal(swap.amount0Out))
  } else if (swap.amount0In.gt(BigInt.fromI32(0)) && swap.amount1Out.gt(BigInt.fromI32(0))) {
    price = toDecimal(swap.amount1Out).div(toDecimal(swap.amount0In))
  }
  
  swap.crbPriceInUsdt = price
  swap.timestamp = event.block.timestamp
  swap.blockNumber = event.block.number
  
  swap.save()
}
