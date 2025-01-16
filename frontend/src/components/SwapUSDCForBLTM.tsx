import { useEffect, useState } from 'react'
import { polygonAmoy } from 'viem/chains'
import { USDC_ADDRESS } from '../config/consts'
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

interface SwapUSDCForBLTMProps {
  exchangeRate: bigint
  usdcBalance: bigint
  refreshBalances: () => Promise<void>
}

export const SwapUSDCForBLTM = ({
  exchangeRate,
  usdcBalance,
  refreshBalances,
}: SwapUSDCForBLTMProps) => {
  const [isApproving, setIsApproving] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>()
  const [depositHash, setDepositHash] = useState<`0x${string}` | undefined>()

  const { address } = useAccount()
  const { writeContractAsync: approveUsdc } = useWriteContract()
  const { writeContractAsync: deposit } = useWriteContract()

  const { data: usdcAllowance, refetch: refetchUsdcAllowance } =
    useReadContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'allowance',
      args: address ? [address, LIQUIDITY_POOL_ADDRESS] : undefined,
    })

  // Get transaction receipts
  const { isLoading: isWaitingForApproval, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({
      hash: approvalHash,
    })

  const { isLoading: isWaitingForDeposit, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    })

  // Check if the current input amount is approved
  const hasApprovedAmount =
    depositAmount && usdcAllowance
      ? parseUnits(depositAmount, 6) <= usdcAllowance
      : false

  const hasEnoughBalance =
    depositAmount && usdcBalance
      ? parseUnits(depositAmount, 6) <= usdcBalance
      : false

  const isTransactionPending = isWaitingForApproval || isWaitingForDeposit

  const formattedUsdcAllowance = usdcAllowance
    ? formatUnits(usdcAllowance, 6)
    : '0'

  const handleDeposit = async () => {
    if (!depositAmount || !address) return

    // Convert amounts to BigInt for accurate comparison
    const amount = parseUnits(depositAmount, 6)

    // Check USDC balance
    if (!usdcBalance || amount > usdcBalance) {
      toast.error('Insufficient USDC balance')
      return
    }

    // Check allowance
    if (!usdcAllowance || amount > usdcAllowance) {
      toast.error('Please approve USDC first')
      return
    }

    setIsDepositing(true)
    const toastId = toast.loading('Swapping USDC for BLTM...')

    try {
      const hash = await deposit({
        address: LIQUIDITY_POOL_ADDRESS,
        abi: liquidityPoolAbi,
        functionName: 'swapUSDCForBLTM',
        args: [amount],
        chain: polygonAmoy,
        account: address,
      })
      setDepositHash(hash)
      toast.loading('Waiting for swap confirmation...', { id: toastId })
    } catch (error: any) {
      console.error('Error depositing:', error)
      toast.error(error.message || 'Failed to swap USDC for BLTM', {
        duration: 5000,
      })
      toast.dismiss(toastId)
    }

    setIsDepositing(false)
  }

  const handleApproveUsdc = async () => {
    if (!depositAmount || !address) return
    setIsApproving(true)

    const toastId = toast.loading('Approving USDC...')

    try {
      const amount = parseUnits(depositAmount, 6)
      const hash = await approveUsdc({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [LIQUIDITY_POOL_ADDRESS, amount],
        chain: polygonAmoy,
        account: address,
      })
      setApprovalHash(hash)
      toast.loading('Waiting for approval confirmation...', { id: toastId })
    } catch (error: any) {
      console.error('Error approving USDC:', error)
      toast.error(error.message || 'Failed to approve USDC', { duration: 5000 })
      toast.dismiss(toastId)
    }

    setIsApproving(false)
  }

  useEffect(() => {
    const approvalPostAction = async () => {
      if (isApprovalSuccess) {
        toast.success('USDC approved successfully!')
        toast.dismiss()
        refreshBalances()
        refetchUsdcAllowance()
      }
    }
    approvalPostAction()
  }, [isApprovalSuccess])

  useEffect(() => {
    const depositPostAction = async () => {
      if (isDepositSuccess) {
        toast.success('Swap completed successfully!')
        toast.dismiss()
        setDepositAmount('')
        refreshBalances()
      }
    }
    depositPostAction()
  }, [isDepositSuccess])

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <p className="text-sm font-medium text-gray-700 mb-2">
        Swap USDC for BLTM
      </p>
      <div className="space-y-2">
        <input
          type="number"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          placeholder="Enter USDC amount"
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          {!hasApprovedAmount ? (
            <button
              onClick={handleApproveUsdc}
              disabled={
                isApproving ||
                isTransactionPending ||
                !depositAmount ||
                !hasEnoughBalance
              }
              className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {isApproving
                ? 'Approving...'
                : isWaitingForApproval
                  ? 'Confirming Approval...'
                  : 'Approve USDC'}
            </button>
          ) : (
            <button
              onClick={handleDeposit}
              disabled={
                isDepositing ||
                isTransactionPending ||
                !depositAmount ||
                !hasEnoughBalance
              }
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isDepositing
                ? 'Swapping...'
                : isWaitingForDeposit
                  ? 'Confirming Swap...'
                  : 'Swap USDC for BLTM'}
            </button>
          )}
        </div>
        <div className="space-y-1 text-sm text-gray-500">
          <p>
            {Number(formattedUsdcAllowance).toFixed(2)} USDC approved for swap
          </p>
          {depositAmount && exchangeRate && (
            <p>
              You will receive approximately{' '}
              {(Number(depositAmount) * Number(exchangeRate)).toFixed(2)} BLTM
            </p>
          )}
          {depositAmount && !hasEnoughBalance && (
            <p className="text-red-500">Insufficient USDC balance</p>
          )}
        </div>
      </div>
    </div>
  )
}
