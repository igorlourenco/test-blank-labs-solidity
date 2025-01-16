import { useEffect, useState } from 'react'
import { polygonAmoy } from 'viem/chains'
import { BLTM_ADDRESS } from '../config/consts'
import { erc20Abi, liquidityPoolAbi } from '../config/abi'
import { LIQUIDITY_POOL_ADDRESS } from '../config/consts'
import toast from 'react-hot-toast'
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { formatUnits } from 'viem'
import { parseUnits } from 'viem'

interface SwapBLTMForUSDCProps {
  exchangeRate: bigint
  bltmBalance: bigint
  refreshBalances: () => Promise<void>
}

export const SwapBLTMForUSDC = ({
  exchangeRate,
  bltmBalance,
  refreshBalances,
}: SwapBLTMForUSDCProps) => {
  const [isApproving, setIsApproving] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>()
  const [withdrawHash, setWithdrawHash] = useState<`0x${string}` | undefined>()

  const { address } = useAccount()
  const { writeContractAsync: approveBltm } = useWriteContract()
  const { writeContractAsync: withdraw } = useWriteContract()

  const { data: bltmAllowance, refetch: refetchBltmAllowance } =
    useReadContract({
      address: BLTM_ADDRESS,
      abi: erc20Abi,
      functionName: 'allowance',
      args: address ? [address, LIQUIDITY_POOL_ADDRESS] : undefined,
    })

  // Get transaction receipts
  const { isLoading: isWaitingForApproval, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({
      hash: approvalHash,
    })

  const { isLoading: isWaitingForWithdraw, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({
      hash: withdrawHash,
    })

  // Check if the current input amount is approved
  const hasApprovedAmount =
    withdrawAmount && bltmAllowance
      ? parseUnits(withdrawAmount, 6) <= bltmAllowance
      : false

  const hasEnoughBalance =
    withdrawAmount && bltmBalance
      ? parseUnits(withdrawAmount, 6) <= bltmBalance
      : false

  const isTransactionPending = isWaitingForApproval || isWaitingForWithdraw

  const formattedBltmAllowance = bltmAllowance
    ? formatUnits(bltmAllowance, 6)
    : '0'

  const handleWithdraw = async () => {
    if (!withdrawAmount || !address) return

    // Convert amounts to BigInt for accurate comparison
    const amount = parseUnits(withdrawAmount, 6)

    // Check BLTM balance
    if (!bltmBalance || amount > bltmBalance) {
      toast.error('Insufficient BLTM balance')
      return
    }

    // Check allowance
    if (!bltmAllowance || amount > bltmAllowance) {
      toast.error('Please approve BLTM first')
      return
    }

    setIsWithdrawing(true)
    	const toastId = toast.loading('Swapping BLTM for USDC...')

    try {
      const hash = await withdraw({
        address: LIQUIDITY_POOL_ADDRESS,
        abi: liquidityPoolAbi,
        functionName: 'swapBLTMForUSDC',
        args: [amount],
        chain: polygonAmoy,
        account: address,
      })
      setWithdrawHash(hash)
      toast.loading('Waiting for swap confirmation...', { id: toastId })
    } catch (error: any) {
      console.error('Error withdrawing:', error)
      toast.error(error.shortMessage || 'Failed to swap BLTM for USDC', {
        duration: 5000,
      })
      toast.dismiss(toastId)
    }

    setIsWithdrawing(false)
  }

  const handleApproveBltm = async () => {
    if (!withdrawAmount || !address) return
    setIsApproving(true)

    const toastId = toast.loading('Approving BLTM...')

    try {
      const amount = parseUnits(withdrawAmount, 6)
      const hash = await approveBltm({
        address: BLTM_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [LIQUIDITY_POOL_ADDRESS, amount],
        chain: polygonAmoy,
        account: address,
      })
      setApprovalHash(hash)
      toast.loading('Waiting for approval confirmation...', { id: toastId })
    } catch (error: any) {
       console.error('Error approving BLTM:', error)
      toast.error(error.shortMessage || 'Failed to approve BLTM', { duration: 5000 })
      toast.dismiss(toastId)
    }

    setIsApproving(false)
  }

  useEffect(() => {
    const approvalPostAction = async () => {
      if (isApprovalSuccess) {
        toast.success('BLTM approved successfully!')
        toast.dismiss()
        refreshBalances()
        refetchBltmAllowance()
      }
    }
    approvalPostAction()
  }, [isApprovalSuccess])

  useEffect(() => {
    const withdrawPostAction = async () => {
      if (isWithdrawSuccess) {
        	toast.success('Swap completed successfully!')
        toast.dismiss()
        setWithdrawAmount('')
        refreshBalances()
      }
    }
    withdrawPostAction()
  }, [isWithdrawSuccess])

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <p className="text-sm font-medium text-gray-700 mb-2">
        Swap BLTM for USDC
      </p>
      <div className="space-y-2">
        <input
          type="number"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="Enter BLTM amount"
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          {!hasApprovedAmount ? (
            <button
              onClick={handleApproveBltm}
              disabled={
                isApproving ||
                isTransactionPending ||
                	!withdrawAmount ||
                !hasEnoughBalance
              }
              className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {isApproving
                ? 'Approving...'
                : isWaitingForApproval
                  ? 'Confirming Approval...'
                  : 'Approve BLTM'}
            </button>
          ) : (
            <button
              	onClick={handleWithdraw}
              disabled={
                isWithdrawing ||
                isTransactionPending ||
                !withdrawAmount ||
                !hasEnoughBalance
              }
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isWithdrawing
                ? 'Swapping...'
                : isWaitingForWithdraw
                  ? 'Confirming Swap...'
                  : 'Swap BLTM for USDC'}
            </button>
          )}
        </div>
        <div className="space-y-1 text-sm text-gray-500">
          <p>
            {Number(formattedBltmAllowance).toFixed(2)} BLTM approved for swap
          </p>
          {withdrawAmount && exchangeRate && (
            <p>
              You will receive approximately{' '}
              {(Number(withdrawAmount) / Number(exchangeRate)).toFixed(2)} USDC
            </p>
          )}
          {withdrawAmount && !hasEnoughBalance && (
            <p className="text-red-500">Insufficient BLTM balance</p>
          )}
        </div>
      </div>
    </div>
  )
}
