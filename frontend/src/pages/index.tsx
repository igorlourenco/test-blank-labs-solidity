import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { formatUnits } from 'viem'
import { polygonAmoy } from 'viem/chains'
import { TokenSwap } from '../components/TokenSwap'
import { useLiquidityPool } from '../components/hooks/useLiquidityPool'
import { useBalances } from '../components/hooks/useBalances'

export default function IndexPage() {
  const { address, isConnected } = useAccount()
  const { open } = useWeb3Modal()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const isWrongNetwork = isConnected && chainId !== polygonAmoy.id

  const { exchangeRate } = useLiquidityPool()

  const { polBalance, usdcBalance, bltmBalance } = useBalances()

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
              <p className="text-red-500">
                Please connect to Polygon Amoy network
              </p>
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
                      ? `${Number(formatUnits(bltmBalance, 6)).toFixed(2)} BLTM`
                      : '0 BLTM'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Exchange Rate</p>
                <p className="text-xl font-bold text-blue-700">
                  1 USDC = {exchangeRate ? Number(exchangeRate) : '0'} BLTM
                </p>
              </div>

              <TokenSwap />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
