import {
  useAccount,
  useBalance,
  useReadContract,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { formatUnits, parseUnits } from 'viem'
import { polygonAmoy } from 'viem/chains'
import { useState } from 'react'

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`
const BLTM_ADDRESS = process.env.NEXT_PUBLIC_BLTM_ADDRESS as `0x${string}`
const LIQUIDITY_POOL_ADDRESS = process.env
  .NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS as `0x${string}`

const erc20Abi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

const liquidityPoolAbi = [
  {
    name: 'exchangeRate',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'swapUSDCForBLTM',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'usdcAmount', type: 'uint256' }],
    outputs: [],
  },
] as const

export default function IndexPage() {
  const { address, isConnected } = useAccount()
  const { open } = useWeb3Modal()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [depositAmount, setDepositAmount] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>()
  const [depositHash, setDepositHash] = useState<`0x${string}` | undefined>()

  const isWrongNetwork = isConnected && chainId !== polygonAmoy.id

  const { data: polBalance } = useBalance({
    address: isWrongNetwork ? undefined : address,
  })

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: !isWrongNetwork && address ? [address] : undefined,
  })

  const { data: bltmBalance } = useReadContract({
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

  const { data: usdcAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, LIQUIDITY_POOL_ADDRESS] : undefined,
  })

  const { writeContractAsync: approveUsdc } = useWriteContract()
  const { writeContractAsync: deposit } = useWriteContract()

  // Wait for transactions
  const { isLoading: isWaitingForApproval } = useWaitForTransactionReceipt({
    hash: approvalHash,
  })

  const { isLoading: isWaitingForDeposit } = useWaitForTransactionReceipt({
    hash: depositHash,
  })

  const handleApproveUsdc = async () => {
    if (!depositAmount || !address) return
    setIsApproving(true)
    try {
      const amount = parseUnits(depositAmount, 6)
      const hash = await approveUsdc({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [LIQUIDITY_POOL_ADDRESS, amount],
        chain: polygonAmoy,
        account: address,
      })
      setApprovalHash(hash)
    } catch (error) {
      console.error('Error approving USDC:', error)
    }
    setIsApproving(false)
  }

  const handleDeposit = async () => {
    if (!depositAmount || !address) return
    
    // Convert amounts to BigInt for accurate comparison
    const amount = parseUnits(depositAmount, 6)
    
    // Check USDC balance
    if (!usdcBalance || amount > usdcBalance) {
      alert('Insufficient USDC balance')
      return
    }

    // Check allowance
    if (!usdcAllowance || amount > usdcAllowance) {
      alert('Please approve USDC first')
      return
    }

    setIsDepositing(true)
    try {

      const hash = await deposit({
        address: LIQUIDITY_POOL_ADDRESS,
        abi: liquidityPoolAbi,
        functionName: 'swapUSDCForBLTM',
        args: [amount],
        chain: polygonAmoy,
        account: address,
      }).catch((error) => {
        console.error('Error depositing:', error)
      }).then(hash => hash as `0x${string}`)
      setDepositHash(hash)
      setDepositAmount('')
    } catch (error: any) {
      console.error('Error depositing:', error)
      if (error.message) {
        alert(`Error: ${error.message}`)
      } else {
        alert('Failed to swap USDC for BLTM. Please try again.')
      }
    }
    setIsDepositing(false)
  }

  // Check if the current input amount is approved
  const hasApprovedAmount = depositAmount && usdcAllowance 
    ? parseUnits(depositAmount, 6) <= usdcAllowance
    : false

  // Check if user has enough balance
  const hasEnoughBalance = depositAmount && usdcBalance
    ? parseUnits(depositAmount, 6) <= usdcBalance
    : false

  const isTransactionPending = isWaitingForApproval || isWaitingForDeposit

  // Format balances for display
  const formattedUsdcBalance = usdcBalance ? formatUnits(usdcBalance, 6) : '0'
  const formattedUsdcAllowance = usdcAllowance ? formatUnits(usdcAllowance, 6) : '0'

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

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Exchange Rate</p>
                <p className="text-xl font-bold text-blue-700">
                  1 USDC = {exchangeRate ? Number(exchangeRate) : '0'} BLTM
                </p>
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

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Swap USDC for BLTM
                </p>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter USDC amount"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    {!hasApprovedAmount ? (
                      <button
                        onClick={handleApproveUsdc}
                        disabled={isApproving || isTransactionPending || !depositAmount || !hasEnoughBalance}
                        className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
                      >
                        {isApproving
                          ? 'Approving...'
                          : isWaitingForApproval
                          ? 'Confirming Approval...'
                          : 'Approve USDC'}
                      </button>
                    ) : (
                      <button
                        onClick={handleDeposit}
                        disabled={isDepositing || isTransactionPending || !depositAmount || !hasEnoughBalance}
                        className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        {isDepositing
                          ? 'Swapping...'
                          : isWaitingForDeposit
                          ? 'Confirming Swap...'
                          : 'Swap USDC for BLTM'}
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p>Your USDC Balance: {Number(formattedUsdcBalance).toFixed(2)} USDC</p>
                    <p>Approved Amount: {Number(formattedUsdcAllowance).toFixed(2)} USDC</p>
                    {depositAmount && exchangeRate && (
                      <p>
                        You will receive approximately{' '}
                        {(Number(depositAmount) * Number(formatUnits(exchangeRate, 18))).toFixed(2)}{' '}
                        BLTM
                      </p>
                    )}
                    {depositAmount && !hasEnoughBalance && (
                      <p className="text-red-500">Insufficient USDC balance</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
