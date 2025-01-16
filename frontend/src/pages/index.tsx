import {
  useAccount,
  useBalance,
  useReadContract,
  useChainId,
  useSwitchChain,
} from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { erc20Abi, formatUnits } from 'viem'
import { polygonAmoy } from 'viem/chains'
import toast from 'react-hot-toast'
import { USDC_ADDRESS, BLTM_ADDRESS, LIQUIDITY_POOL_ADDRESS } from '../config/consts'
import { liquidityPoolAbi } from '../config/abi'
import { TokenSwap } from '../components/TokenSwap'

export default function IndexPage() {
  const { address, isConnected } = useAccount()
  const { open } = useWeb3Modal()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const isWrongNetwork = isConnected && chainId !== polygonAmoy.id

  const { data: polBalance, refetch: refetchPolBalance } = useBalance({
    address: isWrongNetwork ? undefined : address,
  })

  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: !isWrongNetwork && address ? [address] : undefined,
  })

  const { data: bltmBalance, refetch: refetchBltmBalance } = useReadContract({
    address: BLTM_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: !isWrongNetwork && address ? [address] : undefined,
  })

  const { data: exchangeRate } = useReadContract({
    address: LIQUIDITY_POOL_ADDRESS,
    abi: liquidityPoolAbi,
    functionName: 'exchangeRate',
  })

  const refreshBalances = async () => {
    const toastId = toast.loading('Refreshing balances...')
    await refetchPolBalance()
    await refetchUsdcBalance()
    await refetchBltmBalance()
    toast.dismiss(toastId)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          {!isConnected ? (
            <div className="text-center">
              <button
                onClick={() => open()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Connect Wallet
              </button>
            </div>
          ) : isWrongNetwork ? (
            <div className="text-center space-y-4">
              <p className="text-red-500">Please connect to Polygon Amoy network</p>
              <button
                onClick={() => switchChain({ chainId: polygonAmoy.id })}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Switch to Polygon Amoy
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Connected Address</p>
                  <p className="font-mono">{address}</p>
                </div>
                <button
                  onClick={() => open()}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Disconnect
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Native Balance</p>
                  <p className="text-xl font-bold">
                    {polBalance
                      ? `${Number(polBalance.formatted).toFixed(4)} ${
                          polBalance.symbol
                        }`
                      : '0'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">USDC Balance</p>
                  <p className="text-xl font-bold">
                    {usdcBalance
                      ? `${Number(formatUnits(usdcBalance, 6)).toFixed(2)} USDC`
                      : '0 USDC'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">BLTM Balance</p>
                  <p className="text-xl font-bold">
                    {bltmBalance
                      ? `${Number(formatUnits(bltmBalance, 18)).toFixed(2)} BLTM`
                      : '0 BLTM'}
                  </p>
                </div>
              </div>

              <TokenSwap
                address={address}
                usdcBalance={usdcBalance}
                bltmBalance={bltmBalance}
                exchangeRate={exchangeRate}
                refreshBalances={refreshBalances}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
