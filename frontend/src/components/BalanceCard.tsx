export interface IBalance {
  balance: string
  symbol: string
  label: string
}

export const BalanceCard = ({ balance, symbol, label }: IBalance) => {
  return (
    <div className="bg-gray-50 p-2 rounded-lg">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-xl font-bold">
        {balance ? `${Number(balance).toFixed(4)} ${symbol}` : '0'}
      </p>
    </div>
  )
}
