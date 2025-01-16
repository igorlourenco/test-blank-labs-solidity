import { AppProps } from 'next/app'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../config/wagmi'
import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'

const queryClient = new QueryClient()

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        <Toaster position="bottom-right" />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
