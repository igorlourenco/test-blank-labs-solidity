export const erc20Abi = [
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

export const liquidityPoolAbi = [
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
  {
    name: 'swapBLTMForUSDC',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'bltmAmount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'TokensSwapped',
    type: 'event',
    inputs: [
      { type: 'address', name: 'user', indexed: true },
      { type: 'uint256', name: 'usdcAmount' },
      { type: 'uint256', name: 'bltmAmount' },
      { type: 'uint256', name: 'royaltyAmount' },
    ],
  },
  {
    name: 'TokensRedeemed',
    type: 'event',
    inputs: [
      { type: 'address', name: 'user', indexed: true },
      { type: 'uint256', name: 'usdcAmount' },
      { type: 'uint256', name: 'bltmAmount' },
      { type: 'uint256', name: 'royaltyAmount' },
    ],
  },
] as const
