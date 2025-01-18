import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const BLTM = await ethers.getContractFactory("BLTM");
  const bltm = await BLTM.deploy(deployer.address);

  await bltm.waitForDeployment();

  const address = await bltm.getAddress();
  console.log("BLTM token deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
