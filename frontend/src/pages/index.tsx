import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { formatUnits } from 'viem'
import { polygonAmoy } from 'viem/chains'
import { TokenSwap } from '../components/TokenSwap'
import { useLiquidityPool } from '../components/hooks/useLiquidityPool'
import { useBalances } from '../components/hooks/useBalances'
import { TransactionHistory } from '../components/TransactionHistory'
import { IBalance } from '../components/BalanceCard'
import { TOKEN_DECIMALS } from '../config/consts'
import { Balances } from '../components/Balances'
import { ConnectWallet } from '../components/ConnectWallet'
import { ChangeNetwork } from '../components/ChangeNetwork'
import { Account } from '../components/Account'

export default function IndexPage() {
  const { isConnected } = useAccount()
  const chainId = useChainId()

  const isWrongNetwork = isConnected && chainId !== polygonAmoy.id

  const { exchangeRate } = useLiquidityPool()

  const { polBalance, usdcBalance, bltmBalance } = useBalances()

  const balances: IBalance[] = [
    {
      balance: polBalance
        ? Number(formatUnits(polBalance.value, 18)).toFixed(2)
        : '0',
      symbol: 'POL',
      label: 'POL Balance',
    },
    {
      balance: usdcBalance
        ? Number(formatUnits(usdcBalance, TOKEN_DECIMALS)).toFixed(2)
        : '0',
      symbol: 'USDC',
      label: 'USDC Balance',
    },
    {
      balance: bltmBalance
        ? Number(formatUnits(bltmBalance, TOKEN_DECIMALS)).toFixed(2)
        : '0',
      symbol: 'BLTM',
      label: 'BLTM Balance',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          {!isConnected ? (
            <ConnectWallet />
          ) : isWrongNetwork ? (
            <ChangeNetwork />
          ) : (
            <Account />
          )}

          {isConnected && !isWrongNetwork && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-x-4 md:gap-y-0">
              <Balances balances={balances} exchangeRate={exchangeRate} />

              <div className="col-span-2">
                <TokenSwap />
              </div>
            </div>
          )}

          {isConnected && !isWrongNetwork && <TransactionHistory />}
        </div>
      </div>
    </div>
  )
}
