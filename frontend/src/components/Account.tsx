import { useWeb3Modal } from '@web3modal/wagmi/react'
import Link from 'next/link'
import { useAccount } from 'wagmi'

export const Account = () => {
  const { open } = useWeb3Modal()
  const { address } = useAccount()

  const smartContracts = [
    {
      name: 'BLTM',
      address: process.env.NEXT_PUBLIC_BLTM_ADDRESS,
    },
    {
      name: 'Liquidity Pool',
      address: process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {address && (
          <div>
            <p className="text-sm text-gray-600">Connected Address</p>
            <p className="font-mono">{address}</p>
          </div>
        )}
        <button
          onClick={() => open()}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>

      <p>
        USDC faucet can be found here -{' '}
        <Link
          href="https://faucet.circle.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          https://faucet.circle.com/
        </Link>
      </p>

      {smartContracts.map(({ name, address }) => (
        <p key={address}>
          {name} - {' '}
          <Link
            href={`https://amoy.polygonscan.com/address/${address}#writeContract`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            {address}
          </Link>
        </p>
      ))}
    </div>
  )
}
