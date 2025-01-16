import { createConfig, http } from 'wagmi'
import { polygonAmoy } from 'viem/chains'
import { createWeb3Modal } from '@web3modal/wagmi/react'

// Get projectId from WalletConnect Cloud - https://cloud.walletconnect.com/
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

export const config = createConfig({
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http()
  }
})

// Initialize modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  defaultChain: polygonAmoy,
  themeMode: 'light'
}) 