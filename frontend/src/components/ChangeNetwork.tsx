import { switchChain } from 'viem/actions'
import { polygonAmoy } from 'viem/chains'
import { useSwitchChain } from 'wagmi'

export const ChangeNetwork = () => {
  const { switchChain } = useSwitchChain()

  return (
    <div className="text-center space-y-4">
      <p className="text-red-500">Please connect to Polygon Amoy network</p>
      <button
        onClick={() => switchChain({ chainId: polygonAmoy.id })}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Switch to Polygon Amoy
      </button>
    </div>
  )
}
