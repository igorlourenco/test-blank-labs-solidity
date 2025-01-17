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

  const handleSetMax = () => {
    if (!sourceBalance) return
    setAmount(formatUnits(sourceBalance, TOKEN_DECIMALS))
  }

  const handleSetHalf = () => {
    if (!sourceBalance) return
    const halfBalance = sourceBalance / BigInt(2)
    setAmount(formatUnits(halfBalance, TOKEN_DECIMALS))
  }

  const hasApprovedAmount =
    amount && sourceAllowance
      ? parseUnits(amount, TOKEN_DECIMALS) <= sourceAllowance
      : false

  const hasEnoughBalance =
    amount && sourceBalance
      ? parseUnits(amount, TOKEN_DECIMALS) <= sourceBalance
      : false

  return (
    <div className="bg-gray-50 p-4  rounded-lg shadow-md w-full mx-auto">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {sourceToken} Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter ${sourceToken} amount`}
              className="w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-[160px]"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
              <button
                onClick={handleSetHalf}
                className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 rounded"
              >
                HALF
              </button>
              <button
                onClick={handleSetMax}
                className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 rounded"
              >
                MAX
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSwitch}
          className="mx-auto border block p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowsUpDownIcon className="h-5 w-5 text-gray-500" />
        </button>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {targetToken} Amount
            {!isUsdcToBltm ? ' - with 2% fee deducted' : ''}
          </label>
          <input
            type="text"
            value={targetAmount}
            disabled
            className="w-full h-10 p-2 rounded-md border-gray-300 bg-gray-100 shadow-sm"
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
