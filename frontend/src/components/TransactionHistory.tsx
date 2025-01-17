import { useState, useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getFilteredRowModel,
} from '@tanstack/react-table'
import { formatUnits } from 'viem'
import { format } from 'date-fns'
import { useLiquidityPool } from './hooks/useLiquidityPool'
import { TOKEN_DECIMALS } from '../config/consts'
import { useTransactionHistory } from './hooks/useTransactionHistory'

interface Transaction {
  date: Date
  action: 'Deposit' | 'Withdraw'
  given: bigint
  received: bigint
  hash: `0x${string}`
}

const columnHelper = createColumnHelper<Transaction>()

const columns = [
  columnHelper.accessor('date', {
    header: 'Date',
    cell: (info) => format(info.getValue(), 'PPpp'),
  }),
  columnHelper.accessor('action', {
    header: 'Action',
    cell: (info) => info.getValue(),
    filterFn: 'equals',
  }),
  columnHelper.accessor('given', {
    header: 'Given',
    cell: (info) => {
      const given = info.getValue()
      const action = info.row.original.action
      const token = action === 'Deposit' ? 'USDC' : 'BLTM'

      return `${formatUnits(given, TOKEN_DECIMALS)} ${token}`
    },
  }),
  columnHelper.accessor('received', {
    header: 'Received',
    cell: (info) => {
      const received = info.getValue()
      const action = info.row.original.action
      const token = action === 'Deposit' ? 'BLTM' : 'USDC'

      return `${formatUnits(received, TOKEN_DECIMALS)} ${token}`
    },
  }),
  columnHelper.accessor('hash', {
    header: 'Transaction',
    cell: (info) => (
      <a
        href={`https://explorer.goerli.linea.build/tx/${info.getValue()}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-700 underline"
      >
        {`${info.getValue().slice(0, 6)}...${info.getValue().slice(-4)}`}
      </a>
    ),
  }),
]

export function TransactionHistory() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [actionFilter, setActionFilter] = useState<string>('')
  const transactions = useTransactionHistory()

  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      sorting,
      columnFilters: actionFilter
        ? [{ id: 'action', value: actionFilter }]
        : [],
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Transaction History
        </h2>
        <div className="mt-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option value="Deposit">Deposits Only</option>
            <option value="Withdraw">Withdrawals Only</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                >
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
