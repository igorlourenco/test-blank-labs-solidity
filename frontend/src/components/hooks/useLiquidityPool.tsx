import toast from 'react-hot-toast'
import { formatUnits, parseUnits } from 'viem'
import { LIQUIDITY_POOL_ADDRESS, USDC_ADDRESS } from '../../config/consts'
import { BLTM_ADDRESS } from '../../config/consts'
import { erc20Abi } from 'viem'
import { polygonAmoy } from 'viem/chains'
import { useBalance, useWaitForTransactionReceipt } from 'wagmi'
import { useReadContract } from 'wagmi'
import { useWriteContract } from 'wagmi'
import { useAccount } from 'wagmi'
import { useState } from 'react'
import { liquidityPoolAbi } from '../../config/abi'

export const useLiquidityPool = () => {
  const [isApproving, setIsApproving] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>()
  const [depositHash, setDepositHash] = useState<`0x${string}` | undefined>()

  const { address } = useAccount()
  const { writeContractAsync: approve } = useWriteContract()
  const { writeContractAsync: deposit } = useWriteContract()

  const { data: polBalance, refetch: refetchPolBalance } = useBalance({
    address: address,
  })

  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: bltmBalance, refetch: refetchBltmBalance } = useReadContract({
    address: BLTM_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

    const { data: exchangeRate } = useReadContract({
    address: LIQUIDITY_POOL_ADDRESS,
    abi: liquidityPoolAbi,
    functionName: 'exchangeRate',
  })


  const { data: bltmAllowance, refetch: refetchBltmAllowance } =
    useReadContract({
      address: BLTM_ADDRESS,
      abi: erc20Abi,
      functionName: 'allowance',
      args: address ? [address, LIQUIDITY_POOL_ADDRESS] : undefined,
    })

  const { data: usdcAllowance, refetch: refetchUsdcAllowance } =
    useReadContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'allowance',
      args: address ? [address, LIQUIDITY_POOL_ADDRESS] : undefined,
    })

  const { isLoading: isWaitingForApproval, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({
      hash: approvalHash,
    })

  const { isLoading: isWaitingForDeposit, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    })

  const isTransactionPending = isWaitingForApproval || isWaitingForDeposit

  const handleDeposit = async (
    depositAmount: string,
    balance: bigint,
    token: 'BLTM' | 'USDC',
  ) => {
    if (!depositAmount || !address) return

    // Convert amounts to BigInt for accurate comparison
    const amount = parseUnits(depositAmount, 6)

    // Check BLTM balance
    if (!balance || amount > balance) {
      toast.error('Insufficient BLTM balance')
      return
    }

    const allowance = token === 'BLTM' ? bltmAllowance : usdcAllowance

    // Check allowance
    if (!allowance || amount > allowance) {
      toast.error('Please approve BLTM first')
      return
    }

    setIsDepositing(true)
    const toastId = toast.loading(
      `Swapping ${token} for ${token === 'BLTM' ? 'USDC' : 'BLTM'} ...`,
    )

    try {
      const hash = await deposit({
        address: LIQUIDITY_POOL_ADDRESS,
        abi: liquidityPoolAbi,
        functionName: token === 'BLTM' ? 'swapBLTMForUSDC' : 'swapUSDCForBLTM',
        args: [amount],
        chain: polygonAmoy,
        account: address,
      })
      setDepositHash(hash)
      toast.loading('Waiting for swap confirmation...', { id: toastId })
    } catch (error: any) {
      console.error('Error depositing:', error)
      toast.error(error.shortMessage || 'Failed to swap BLTM for USDC', {
        duration: 5000,
      })
      toast.dismiss(toastId)
    }

    setIsDepositing(false)
  }

  const handleApprove = async (
    depositAmount: string,
    token: 'BLTM' | 'USDC',
  ) => {
    if (!depositAmount || !address) return
    setIsApproving(true)

    const toastId = toast.loading(`Approving ${token}...`)

    try {
      const amount = parseUnits(depositAmount, 6)
      const hash = await approve({
        address: token === 'BLTM' ? BLTM_ADDRESS : USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [LIQUIDITY_POOL_ADDRESS, amount],
        chain: polygonAmoy,
        account: address,
      })
      setApprovalHash(hash)
      toast.loading('Waiting for approval confirmation...', { id: toastId })
    } catch (error: any) {
      console.error(`Error approving ${token}:`, error)
      toast.error(error.shortMessage || `Failed to approve ${token}`, {
        duration: 5000,
      })
      toast.dismiss(toastId)
    }

    setIsApproving(false)
  }

  const refreshBalances = async () => {
    await refetchPolBalance()
    await refetchUsdcBalance()
    await refetchBltmBalance()
  }

  return {
    polBalance,
    usdcBalance,
    bltmBalance,
	exchangeRate,
    bltmAllowance,
    usdcAllowance,
    isApproving,
    isDepositing,
    approvalHash,
    depositHash,
    isTransactionPending,
    isApprovalSuccess,
    isDepositSuccess,
    refetchBltmAllowance,
    refetchUsdcAllowance,
    handleDeposit,
    handleApprove,
    refreshBalances,
  }
}
