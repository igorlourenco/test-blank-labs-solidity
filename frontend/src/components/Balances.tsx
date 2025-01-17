import { BalanceCard, IBalance } from './BalanceCard'

interface BalancesProps {
  balances: IBalance[]
  exchangeRate: bigint
}

export const Balances = ({ balances, exchangeRate }: BalancesProps) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      {balances.map((balance) => (
        <BalanceCard key={balance.label} {...balance} />
      ))}

      <div className="bg-blue-50 p-2 rounded-lg shadow-md">
        <p className="text-sm text-blue-600 mb-1">Exchange Rate</p>
        <p className="text-xl font-bold text-blue-700">
          1 USDC = {exchangeRate ? Number(exchangeRate) : '0'} BLTM
        </p>
      </div>
    </div>
  )
}
