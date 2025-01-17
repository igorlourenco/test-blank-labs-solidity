import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'

export const Account = () => {
  const { open } = useWeb3Modal()
  const { address } = useAccount()

  return (
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
    </div>
  )
}
