import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'dotenv/config'

const DEPLOYER_ACCOUNT = process.env.DEPLOYER_ACCOUNT ?? ''

const config: HardhatUserConfig = {
  solidity: "0.8.28",
    networks: {
    polygon_amoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts: [DEPLOYER_ACCOUNT]
    }
  }
};

export default config;
