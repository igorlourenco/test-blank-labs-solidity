import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { erc20Abi, formatUnits, parseUnits } from 'viem'
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline'
import { polygonAmoy } from 'viem/chains'
import toast from 'react-hot-toast'
import { USDC_ADDRESS, BLTM_ADDRESS, LIQUIDITY_POOL_ADDRESS, TOKEN_DECIMALS } from '../config/consts'
import { liquidityPoolAbi } from '../config/abi'

interface TokenSwapProps {
  address: `0x${string}`
  usdcBalance?: bigint
  bltmBalance?: bigint
  exchangeRate?: bigint
  refreshBalances: () => Promise<void>
}

export function TokenSwap({
  address,
  usdcBalance,
  bltmBalance,
  exchangeRate,
  refreshBalances,
}: TokenSwapProps) {
  const [isUsdcToBltm, setIsUsdcToBltm] = useState(true)
  const [amount, setAmount] = useState('')
  const [approvalHash, setApprovalHash] = useState<`0x${string}`>()
  const [swapHash, setSwapHash] = useState<`0x${string}`>()

  // Contract interactions
  const { writeContractAsync: approve } = useWriteContract()
  const { writeContractAsync: swap } = useWriteContract()

  // Get allowances
  const { data: usdcAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address, LIQUIDITY_POOL_ADDRESS],
  })

  const { data: bltmAllowance } = useReadContract({
    address: BLTM_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address, LIQUIDITY_POOL_ADDRESS],
  })

  // Transaction states
  const { isLoading: isWaitingForApproval, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({
      hash: approvalHash,
    })

  const { isLoading: isWaitingForSwap, isSuccess: isSwapSuccess } =
    useWaitForTransactionReceipt({
      hash: swapHash,
    })



  const sourceBalance = isUsdcToBltm ? usdcBalance : bltmBalance
  const sourceAllowance = isUsdcToBltm ? usdcAllowance : bltmAllowance
  const sourceToken = isUsdcToBltm ? 'USDC' : 'BLTM'
  const targetToken = isUsdcToBltm ? 'BLTM' : 'USDC'

  const targetAmount = amount && exchangeRate
    ? isUsdcToBltm
      ? (Number(amount) * Number(exchangeRate)).toFixed(2)
      : (Number(amount) / Number(exchangeRate)).toFixed(2)
    : '0'

  const handleSwitch = () => {
    setIsUsdcToBltm(!isUsdcToBltm)
    setAmount('')
  }

  const handleApprove = async () => {
    if (!amount) return
    const toastId = toast.loading(`Approving ${sourceToken}...`)
    
    try {
      const tokenAmount = parseUnits(amount, TOKEN_DECIMALS)
      const hash = await approve({
        address: isUsdcToBltm ? USDC_ADDRESS : BLTM_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [LIQUIDITY_POOL_ADDRESS, tokenAmount],
        chain: polygonAmoy,
        account: address,
      })
      setApprovalHash(hash)
      toast.loading('Waiting for approval confirmation...', { id: toastId })
    } catch (error: any) {
      console.error('Error approving token:', error)
      toast.error(error.message || `Failed to approve ${sourceToken}`, { id: toastId })
    }
  }

  const handleSwap = async () => {
    if (!amount) return
    const toastId = toast.loading(`Swapping ${sourceToken} for ${targetToken}...`)
    
    try {
      const tokenAmount = parseUnits(amount, TOKEN_DECIMALS)
      const hash = await swap({
        address: LIQUIDITY_POOL_ADDRESS,
        abi: liquidityPoolAbi,
        functionName: isUsdcToBltm ? 'swapUSDCForBLTM' : 'swapBLTMForUSDC',
        args: [tokenAmount],
        chain: polygonAmoy,
        account: address,
      })
      setSwapHash(hash)
      toast.loading('Waiting for swap confirmation...', { id: toastId })
    } catch (error: any) {
      console.error('Error swapping tokens:', error)
      toast.error(error.message || 'Failed to swap tokens', { id: toastId })
    }
  }

  // Check if amount is approved
  const hasApprovedAmount = amount && sourceAllowance
    ? parseUnits(amount, TOKEN_DECIMALS) <= sourceAllowance
    : false

  // Check if user has enough balance
  const hasEnoughBalance = amount && sourceBalance
    ? parseUnits(amount, TOKEN_DECIMALS) <= sourceBalance
    : false

  const isTransactionPending = isWaitingForApproval || isWaitingForSwap

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {sourceToken} Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Enter ${sourceToken} amount`}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500">
            Balance: {sourceBalance ? formatUnits(sourceBalance, TOKEN_DECIMALS) : '0'} {sourceToken}
          </p>
        </div>

        <button
          onClick={handleSwitch}
          className="mx-auto block p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowsUpDownIcon className="h-5 w-5 text-gray-500" />
        </button>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {targetToken} Amount (estimated)
          </label>
          <input
            type="text"
            value={targetAmount}
            disabled
            className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
          />
        </div>

        <div className="pt-4">
          {!hasApprovedAmount ? (
            <button
              onClick={handleApprove}
              disabled={isTransactionPending || !amount || !hasEnoughBalance}
              className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {isWaitingForApproval
                ? 'Approving...'
                : `Approve ${sourceToken}`}
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={isTransactionPending || !amount || !hasEnoughBalance}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isWaitingForSwap
                ? 'Swapping...'
                : `Swap ${sourceToken} for ${targetToken}`}
            </button>
          )}
        </div>

        {amount && !hasEnoughBalance && (
          <p className="text-sm text-red-500">
            Insufficient {sourceToken} balance
          </p>
        )}
      </div>
    </div>
  )
} 