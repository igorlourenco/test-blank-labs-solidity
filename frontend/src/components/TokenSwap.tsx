import { useEffect, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { TOKEN_DECIMALS } from '../config/consts'
import { useLiquidityPool } from './hooks/useLiquidityPool'
import { useBalances } from './hooks/useBalances'

interface TokenSwapProps {
  address: `0x${string}`
  usdcBalance?: bigint
  bltmBalance?: bigint
  exchangeRate?: bigint
}

export function TokenSwap() {
  const [isUsdcToBltm, setIsUsdcToBltm] = useState(true)
  const [amount, setAmount] = useState('')

  const {
    bltmAllowance,
    usdcAllowance,
    isApproving,
    isDepositing,
    isTransactionPending,
    isApprovalSuccess,
    isDepositSuccess,
    handleDeposit,
    handleApprove,
    exchangeRate,
  } = useLiquidityPool()

  const { usdcBalance, bltmBalance, refreshBalances } = useBalances()

  useEffect(() => {
    const approvalPostAction = async () => {
      if (isApprovalSuccess) {
        toast.success(`${sourceToken} approved successfully!`)
        toast.dismiss()
        await refreshBalances()
      }
    }
    approvalPostAction()
  }, [isApprovalSuccess])

  useEffect(() => {
    const depositPostAction = async () => {
      if (isDepositSuccess) {
        toast.success('Swap completed successfully!')
        toast.dismiss()
        setAmount('')
        await refreshBalances()
      }
    }
    depositPostAction()
  }, [isDepositSuccess])

  const sourceBalance = isUsdcToBltm ? usdcBalance : bltmBalance
  const sourceAllowance = isUsdcToBltm ? usdcAllowance : bltmAllowance
  const sourceToken = isUsdcToBltm ? 'USDC' : 'BLTM'
  const targetToken = isUsdcToBltm ? 'BLTM' : 'USDC'

  const targetAmount =
    amount && exchangeRate
      ? isUsdcToBltm
        ? (Number(amount) * Number(exchangeRate)).toFixed(2)
        : ((Number(amount) / Number(exchangeRate)) * 0.98).toFixed(2) // 2% fee
      : '0'

  const handleSwitch = () => {
    setIsUsdcToBltm(!isUsdcToBltm)
    setAmount('')
  }

  const handleApproveToken = async () => {
    await handleApprove(amount, sourceToken)
  }

  const handleSwapToken = async () => {
    await handleDeposit(amount, sourceBalance, sourceToken)
  }

  // Check if amount is approved
  const hasApprovedAmount =
    amount && sourceAllowance
      ? parseUnits(amount, TOKEN_DECIMALS) <= sourceAllowance
      : false

  // Check if user has enough balance
  const hasEnoughBalance =
    amount && sourceBalance
      ? parseUnits(amount, TOKEN_DECIMALS) <= sourceBalance
      : false

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
            Balance:{' '}
            {sourceBalance ? formatUnits(sourceBalance, TOKEN_DECIMALS) : '0'}{' '}
            {sourceToken}
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
            {targetToken} Amount (estimated){' '}
            {!isUsdcToBltm ? 'with 2% fee' : ''}
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
              onClick={handleApproveToken}
              disabled={isTransactionPending || !amount || !hasEnoughBalance}
              className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {isApproving ? 'Approving...' : `Approve ${sourceToken}`}
            </button>
          ) : (
            <button
              onClick={handleSwapToken}
              disabled={isTransactionPending || !amount || !hasEnoughBalance}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isDepositing
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
