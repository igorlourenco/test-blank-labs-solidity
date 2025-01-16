import { useAccount } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'

export default function IndexPage() {
  const { address, isConnected } = useAccount()
  const { open } = useWeb3Modal()

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
          ) : (
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
          )}
        </div>
      </div>
    </div>
  )
}
