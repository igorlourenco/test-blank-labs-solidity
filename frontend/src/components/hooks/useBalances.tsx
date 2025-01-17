import { USDC_ADDRESS } from '../../config/consts'
import { BLTM_ADDRESS } from '../../config/consts'
import { erc20Abi } from 'viem'
import { useBalance, useReadContract } from 'wagmi'
import { useAccount } from 'wagmi'

export const useBalances = () => {
  const { address } = useAccount()

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

  const refreshBalances = async () => {
    await refetchPolBalance()
    await refetchUsdcBalance()
    await refetchBltmBalance()
  }

  return {
    polBalance,
    usdcBalance,
    bltmBalance,
    refreshBalances,
  }
}
