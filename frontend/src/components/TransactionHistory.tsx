import { useState, useEffect, useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table'
import { formatUnits } from 'viem'
import { format } from 'date-fns'
import { TOKEN_DECIMALS } from '../config/consts'
import { useTransactionHistory } from './hooks/useTransactionHistory'
import Link from 'next/link'

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
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.date.getTime()
      const b = rowB.original.date.getTime()
      return a < b ? -1 : a > b ? 1 : 0
    },
  }),
  columnHelper.accessor('action', {
    header: 'Action',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('given', {
    header: 'Given',
    cell: (info) => {
      const given = info.getValue()
      const action = info.row.original.action
      const token = action === 'Deposit' ? 'USDC' : 'BLTM'
      return `${formatUnits(given, TOKEN_DECIMALS)} ${token}`
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.given
      const b = rowB.original.given
      return a < b ? -1 : a > b ? 1 : 0
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
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.received
      const b = rowB.original.received
      return a < b ? -1 : a > b ? 1 : 0
    },
  }),
  columnHelper.accessor('hash', {
    header: 'Transaction',
    cell: (info) => (
      <Link
        href={`https://amoy.polygonscan.com/tx/${info.getValue()}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-700 underline"
      >
        {`${info.getValue().slice(0, 6)}...${info.getValue().slice(-4)}`}
      </Link>
    ),
    enableSorting: false,
  }),
]

export function TransactionHistory() {
  const { transactions, fetchPastEvents } = useTransactionHistory()
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true },
  ])

  const filteredData = useMemo(() => {
    return selectedAction === 'all'
      ? transactions
      : transactions.filter((tx) => tx.action.toLowerCase() === selectedAction)
  }, [transactions, selectedAction])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchPastEvents()
      } catch (error) {
        console.error('Error fetching transactions:', error)
      }
    }

    fetchData()

    const interval = setInterval(fetchData, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Transaction History
          </h2>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="deposit">Deposits Only</option>
            <option value="withdraw">Withdrawals Only</option>
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
                        ? 'cursor-pointer hover:bg-gray-100'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getCanSort() && (
                        <span className="text-gray-400">
                          {{
                            asc: '↑',
                            desc: '↓',
                          }[header.column.getIsSorted() as string] ?? '↕'}
                        </span>
                      )}
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
