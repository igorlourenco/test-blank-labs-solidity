import { ethers } from "hardhat";
import { BLTM } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // get the deployed BLTM token address
  const bltmAddress = process.env.BLTM_ADDRESS;
  if (!bltmAddress) {
    throw new Error("BLTM_ADDRESS not set in environment");
  }

  const usdcAddress = process.env.USDC_ADDRESS;
  if (!usdcAddress) {
    throw new Error("USDC_ADDRESS not set in environment");
  }

  // default exchange rate: 1 USDC = 1 BLTM
  const exchangeRate = process.env.EXCHANGE_RATE ? parseInt(process.env.EXCHANGE_RATE) : 1;

  console.log("Using BLTM address:", bltmAddress);
  console.log("Using USDC address:", usdcAddress);
  console.log("Using exchange rate:", exchangeRate);

  // deploy liquidity pool
  const BLTMLiquidityPool = await ethers.getContractFactory("BLTMLiquidityPool");
  const liquidityPool = await BLTMLiquidityPool.deploy(usdcAddress, bltmAddress, exchangeRate);

  await liquidityPool.waitForDeployment();

  const liquidityPoolAddress = await liquidityPool.getAddress();
  console.log("BLTMLiquidityPool deployed to:", liquidityPoolAddress);

  // get BLTM contract instance
  const bltm = await ethers.getContractAt("BLTM", bltmAddress) as unknown as BLTM;

  // grant minter role to liquidity pool
  const minterRole = await bltm.MINTER_ROLE();
  const tx = await bltm.grantRole(minterRole, liquidityPoolAddress);
  await tx.wait();
  console.log("Granted minter role to liquidity pool");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 