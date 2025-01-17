import { useWeb3Modal } from '@web3modal/wagmi/react'

export const ConnectWallet = () => {
  const { open } = useWeb3Modal()

  return (
    <div className="text-center">
      <button
        onClick={() => open()}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Connect Wallet
      </button>
    </div>
  )
}
