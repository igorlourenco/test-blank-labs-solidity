# Igor Lourenco's Basic dApp for RWA Investing

A decentralized application (dApp) that enables investing in Real World Assets (RWA) through tokenization. This project demonstrates a basic implementation of a token and liquidity pool system for RWA investments.

Live application: [https://test-blank-labs-solidity.vercel.app/](https://test-blank-labs-solidity.vercel.app/)

## Technologies Used

- **Frontend:**
  - **Next.js** - for server-side rendering and routing
  - **React** - for component-based UI
  - **TypeScript** - for static typing and modern JavaScript
  - **Tailwind CSS** - for styling
  - **react-table** - for table functionality
  - **date-fns** - for date formatting
  - **react-hot-toast** - for toast notifications
  - **viem** - for wallet connection and blockchain interaction
  - **wagmi** - for wallet connection and blockchain interaction
  - **eslint and prettier** - for code formatting

- **Smart Contracts:**
  - **Solidity** - for writing smart contracts
  - **Hardhat** - for testing and deployment automation
  - **@openzeppelin/contracts** - for standard smart contracts implementations
  - **@ethereum-waffle/mock-contract** - for creating mock contracts for testing

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask or any Web3 wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/igorlourenco/test-blank-labs-solidity.git
cd test-blank-labs-solidity
```

2. Install dependencies:
```bash
# Install smart contract dependencies
cd smart-contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure environment variables:

Copy the .env.example files to .env and fill in the values.

> Note: the .env.example are filled with the values and addresses I used for testing, even the deployer account, which is one that I created for this purpose. It can be used for this project, so you can just copy the .env.example files to .env without changing the values and it will work.

> Also, go to [cloud.reown.com/](https://cloud.reown.com/) and create a free account. Then, create a new project. Copy the project id to the .env.local file NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID variable.

```bash
# considering that you are in the frontend folder of the project
cp .env.example .env.local

cd ../smart-contracts
cp .env.example .env
```

4. Test the smart contracts:
```bash
# considering that you are in the smart-contracts folder of the project
npx hardhat compile
npx hardhat test
```

5. Deploy the smart contracts:

Deploy BLTM token:
```bash
# considering that you are in the smart-contracts folder of the project
npx hardhat compile
npm run deploy-bltm
```

> Copy the BLTM token address returned by the deploy-bltm script to the .env file:

Deploy BLTMLiquidityPool:
```bash
# considering that you are in the smart-contracts folder of the project
npx hardhat compile
npm run deploy-lp
```

5. Start the frontend application:
```bash
cd ../frontend
npm run dev
```

> If needed, update the .env.local file with the new addresses

Access the application at [http://localhost:3000](http://localhost:3000)

## Contract Addresses (Polygon Amoy)

- BLTM Token: [0xd701F3e62Cb4D8aa2c54d87C460a9c94162B05DF](https://amoy.polygonscan.com/address/0xd701F3e62Cb4D8aa2c54d87C460a9c94162B05DF)
- BLTMLiquidityPool: [0x0F74d6DEAdAcb40290927D18C8fBAD7da6f9E77c](https://amoy.polygonscan.com/address/0x0F74d6DEAdAcb40290927D18C8fBAD7da6f9E77c)
- USDC: [0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582](https://amoy.polygonscan.com/address/0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582)

## Approach and Challenges

### Architecture
- Implemented a basic ERC20 token (BLTM) to represent RWA investments
- Created a liquidity pool contract to handle token swaps and liquidity provision
- Built a responsive frontend interface for wallet connection and token interactions
- All the items above are implemented according to the requirements of the project (checklist below in this file)

### Challenges and Solutions

The approach was straightforward since the requirements were very simple. First, I created the smart contracts, starting with the BLTM Token, then moving on to the Liquidity Pool. After that, I made the tests to validate each point of the logic I implemented. In this part, I saw that some implementations were pending, such as the rioyalties one, for example, so I went back and made the necessary adjustments to the smart contracts. After that, I deployed them and moved on to the frontend.

I started on the frontend with the wallet connection part, then the interaction with the contracts. So far, it was easy. When it came time to create the transaction history table, I found the real challenge, because I had never done anything like that before. I broke the application a few times trying to query in real time, because I was making too many calls to the blockchain and the network's RPC didn't support it. I solved this by making a call every 10 seconds, to update "in real time" as soon as the user makes a transaction. Other than that, nothing too complicated.

* The additional features or improvements that could be implemented are:
  - Enable the user to fill the input field in the lower part of the page, making it editable just as in exchanges.
  - Add and "Admin Area", so the contract owner can manage the token and the liquidity pool, such as updating the exchange rate and withdrawing royalties.
  - Add one more token to the liquidity pool, so the users can invest in more than one token (out of scope, but would be fun).
  - Enable the user to fill the input field in the lower part of the page, make it editable just as in exchanges, so the user can see the real-time value of the investment.


## **Project Checklist**

#### **BLTM Token Smart Contract**

- [x] Token name set to **BLTM** with a symbol of **BLTM**.
- [x] Token decimal places set to **6** to match USDC.
- [x] Minting and burning restricted to addresses with the **minter role**.
- [x] Deployer address assigned the **minter role** by default.
- [x] Minting and burning **pausable** by addresses with the **pauser role**.
- [x] Deployer address assigned the **pauser role** by default.


#### **BLTMLiquidityPool Smart Contract**

- [x] Contract assigned the **minter role** for BLTM.
- [x] Constructor accepts the **USDC contract address** and stores it.
- [x] Constructor accepts an integer for the **exchange rate** (defaulting to 1).
- [x] Exchange rate determines how much BLTM is minted per USDC.
- [x] Constructor assigns the **owner role** to the deployer wallet address.
- [x] Method to **update the exchange rate**.
- [x] Method to **accept USDC** and mint BLTM tokens to the caller's wallet
- [x] Takes a **2% royalty** on the USDC sent to the exchange.
- [x] Method to **accept ERC-20 tokens**:
- [x] Burns the tokens.
- [x] Sends the appropriate amount of USDC back to the caller's wallet.
- [x] Method to **transfer USDC** from the contract to the caller only callable by addresses with the **owner role**.


#### **Frontend**

- [x] Allow users to **connect their EOA wallet** via a library like **WalletConnect**.
- [x] Display the **user's BLTM balance**.
- [x] Display the **current exchange rate** for USDC and BLTM tokens.
- [x] Provide buttons for **depositing and withdrawing** from the liquidity pool contract.
- [x] Display a **transaction history table**:
- [x] Columns include **date**, **action**, and **number of tokens** minted or burned.
 - [x] Include basic **sort** and **filter** functions.
