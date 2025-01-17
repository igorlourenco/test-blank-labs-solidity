import { useEffect, useState } from 'react'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useWatchContractEvent,
  usePublicClient,
} from 'wagmi'
import { parseUnits } from 'viem'
import { polygonAmoy } from 'viem/chains'
import {
  USDC_ADDRESS,
  BLTM_ADDRESS,
  LIQUIDITY_POOL_ADDRESS,
  TOKEN_DECIMALS,
} from '../../config/consts'
import { erc20Abi, liquidityPoolAbi } from '../../config/abi'
import type { Log } from 'viem'

interface Transaction {
  date: Date
  action: 'Deposit' | 'Withdraw'
  given: bigint
  received: bigint
  hash: `0x${string}`
}

interface TokensEvent extends Log {
  args: {
    user: `0x${string}`
    usdcAmount: bigint
    bltmAmount: bigint
    royaltyAmount: bigint
  }
}

export function useTransactionHistory() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const fetchPastEvents = async () => {
    if (!address || !publicClient) return

    const [swapLogs, redeemLogs] = await Promise.all([
      publicClient.getLogs({
        address: LIQUIDITY_POOL_ADDRESS,
        event: {
          type: 'event',
          name: 'TokensSwapped',
          inputs: [
            { type: 'address', name: 'user', indexed: true },
            { type: 'uint256', name: 'usdcAmount' },
            { type: 'uint256', name: 'bltmAmount' },
            { type: 'uint256', name: 'royaltyAmount' },
          ],
        },
        args: {
          user: address,
        },
        fromBlock: BigInt(16942958), // 2025-01-16
      }),
      publicClient.getLogs({
        address: LIQUIDITY_POOL_ADDRESS,
        event: {
          type: 'event',
          name: 'TokensRedeemed',
          inputs: [
            { type: 'address', name: 'user', indexed: true },
            { type: 'uint256', name: 'bltmAmount' },
            { type: 'uint256', name: 'usdcAmount' },
            { type: 'uint256', name: 'royaltyAmount' },
          ],
        },
        args: {
          user: address,
        },
        fromBlock: BigInt(16942958), // 2025-01-16
      }),
    ])

    // Get block timestamps
    const blockNumbers = [...swapLogs, ...redeemLogs].map(
      (log) => log.blockNumber,
    )
    const uniqueBlockNumbers = Array.from(new Set(blockNumbers))
    const blocks = await Promise.all(
      uniqueBlockNumbers.map((blockNumber) =>
        publicClient.getBlock({ blockNumber }),
      ),
    )

    // Create a map of block number to timestamp
    const blockTimestamps = new Map(
      blocks.map((block) => [Number(block.number), Number(block.timestamp)]),
    )

    const pastTransactions = [
      ...swapLogs.map((log) => ({
        date: new Date(blockTimestamps.get(Number(log.blockNumber))! * 1000),
        action: 'Deposit' as const,
        given:
          (log as TokensEvent).args.usdcAmount +
          (log as TokensEvent).args.royaltyAmount,
        received: (log as TokensEvent).args.bltmAmount,
        hash: log.transactionHash,
      })),
      ...redeemLogs.map((log) => ({
        date: new Date(blockTimestamps.get(Number(log.blockNumber))! * 1000),
        action: 'Withdraw' as const,
        given: (log as TokensEvent).args.bltmAmount,
        received: (log as TokensEvent).args.usdcAmount,
        hash: log.transactionHash,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime())

    setTransactions(pastTransactions)
  }

  return { transactions, fetchPastEvents }
}
