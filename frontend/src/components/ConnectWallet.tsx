import { useWeb3Modal } from '@web3modal/wagmi/react'

export const ConnectWallet = () => {
  const { open } = useWeb3Modal()

  return (
    <div className="text-center space-y-4">
      <div className="space-y-2">
		 <h2 className="text-2xl font-bold">Welcome to the BLTM Exchange</h2>
      <p className="text-sm text-gray-600">
        Please connect your wallet to start swapping USDC to BLTM
      </p>
	 </div>
      <button
        onClick={() => open()}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Connect Wallet
      </button>
    </div>
  )
}
