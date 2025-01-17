import { expect } from "chai";
import { ethers } from "hardhat";
import { BLTM, BLTMLiquidityPool, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BLTMLiquidityPool", function () {
  let bltm: BLTM;
  let liquidityPool: BLTMLiquidityPool;
  let mockUSDC: MockERC20;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  const initialExchangeRate = 2; // 1 USDC = 2 BLTM

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // deploy BLTM token
    const BLTM = await ethers.getContractFactory("BLTM");
    bltm = await BLTM.deploy(owner.address);
    await bltm.waitForDeployment();

    // deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // deploy Liquidity Pool
    const BLTMLiquidityPool = await ethers.getContractFactory("BLTMLiquidityPool");
    liquidityPool = await BLTMLiquidityPool.deploy(
      await mockUSDC.getAddress(),
      await bltm.getAddress(),
      initialExchangeRate
    );
    await liquidityPool.waitForDeployment();

    // grant minter role to liquidity pool
    await bltm.grantRole(await bltm.MINTER_ROLE(), await liquidityPool.getAddress());

    // setup mock USDC for testing
    await mockUSDC.mint(user1.address, ethers.parseUnits("1000", 6));
    await mockUSDC.connect(user1).approve(await liquidityPool.getAddress(), ethers.MaxUint256);
  });

  describe("Deployment", function () {
    it("Should set the correct USDC and BLTM addresses", async function () {
      expect(await liquidityPool.usdc()).to.equal(await mockUSDC.getAddress());
      expect(await liquidityPool.bltm()).to.equal(await bltm.getAddress());
    });

    it("Should set the correct exchange rate", async function () {
      expect(await liquidityPool.exchangeRate()).to.equal(initialExchangeRate);
    });

    it("Should assign owner role to deployer", async function () {
      const ownerRole = await liquidityPool.OWNER_ROLE();
      expect(await liquidityPool.hasRole(ownerRole, owner.address)).to.be.true;
    });

    it("Should initialize royalties balance to zero", async function () {
      expect(await liquidityPool.royaltiesBalance()).to.equal(0);
    });
  });

  describe("Exchange Rate Management", function () {
    it("Should allow owner to update exchange rate", async function () {
      const newRate = 3;
      await liquidityPool.updateExchangeRate(newRate);
      expect(await liquidityPool.exchangeRate()).to.equal(newRate);
    });

    it("Should not allow non-owner to update exchange rate", async function () {
      const newRate = 3;
      await expect(
        liquidityPool.connect(user1).updateExchangeRate(newRate)
      ).to.be.revertedWithCustomError(liquidityPool, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow setting exchange rate to zero", async function () {
      await expect(liquidityPool.updateExchangeRate(0)).to.be.revertedWith(
        "Invalid exchange rate"
      );
    });
  });

  describe("Token Swapping and Royalties", function () {
    const usdcAmount = ethers.parseUnits("100", 6); // 100 USDC
    const royaltyPercentage = 2;
    const royaltyAmount = (usdcAmount * BigInt(royaltyPercentage)) / BigInt(100);
    const netUsdcAmount = usdcAmount - royaltyAmount;
    const expectedBLTMAmount = usdcAmount * BigInt(initialExchangeRate);

    it("Should swap USDC for BLTM correctly and track royalties", async function () {
      const initialUSDCBalance = await mockUSDC.balanceOf(user1.address);
      const initialBLTMBalance = await bltm.balanceOf(user1.address);

      await liquidityPool.connect(user1).swapUSDCForBLTM(usdcAmount);
      
      // check balances
      expect(await mockUSDC.balanceOf(user1.address)).to.equal(initialUSDCBalance - usdcAmount);
      expect(await bltm.balanceOf(user1.address)).to.equal(initialBLTMBalance + expectedBLTMAmount);
      
      // check royalties
      expect(await liquidityPool.royaltiesBalance()).to.equal(royaltyAmount);
      expect(await liquidityPool.getAvailableUSDC()).to.equal(netUsdcAmount);
    });

    it("Should swap BLTM for USDC correctly and track royalties", async function () {
      // do a USDC to BLTM swap to ensure the pool has USDC
      await liquidityPool.connect(user1).swapUSDCForBLTM(usdcAmount);
      const initialRoyalties = await liquidityPool.royaltiesBalance();
      
      // do the BLTM to USDC swap
      await bltm.connect(user1).approve(await liquidityPool.getAddress(), expectedBLTMAmount);

      const initialUSDCBalance = await mockUSDC.balanceOf(user1.address);
      const initialBLTMBalance = await bltm.balanceOf(user1.address);
      
      await liquidityPool.connect(user1).swapBLTMForUSDC(expectedBLTMAmount);
      
      // calculate expected values for the second swap
      const secondSwapUsdcAmount = expectedBLTMAmount / BigInt(initialExchangeRate);
      const secondSwapRoyalty = (secondSwapUsdcAmount * BigInt(royaltyPercentage)) / BigInt(100);
      const secondSwapNetAmount = secondSwapUsdcAmount - secondSwapRoyalty;
      
      // check balances
      expect(await bltm.balanceOf(user1.address)).to.equal(initialBLTMBalance - expectedBLTMAmount);
      expect(await mockUSDC.balanceOf(user1.address)).to.equal(initialUSDCBalance + secondSwapNetAmount);
      
      // check royalties - should include both swaps
      expect(await liquidityPool.royaltiesBalance()).to.equal(initialRoyalties + secondSwapRoyalty);
    });

    it("Should prevent BLTM to USDC swap if insufficient non-royalty USDC in pool", async function () {
      // mint BLTM to user1
      await bltm.mint(user1.address, expectedBLTMAmount);
      await bltm.connect(user1).approve(await liquidityPool.getAddress(), expectedBLTMAmount);

      // try to swap without enough USDC in the pool
      await expect(
        liquidityPool.connect(user1).swapBLTMForUSDC(expectedBLTMAmount)
      ).to.be.revertedWith("Insufficient USDC in pool");
    });
  });

  describe("Royalties Management", function () {
    const usdcAmount = ethers.parseUnits("100", 6);
    
    beforeEach(async function () {
      // Perform a swap to generate some royalties
      await liquidityPool.connect(user1).swapUSDCForBLTM(usdcAmount);
    });

    it("Should allow owner to withdraw royalties", async function () {
      const royaltyBalance = await liquidityPool.royaltiesBalance();
      const initialOwnerBalance = await mockUSDC.balanceOf(owner.address);

      await liquidityPool.withdrawRoyalties(royaltyBalance);

      expect(await liquidityPool.royaltiesBalance()).to.equal(0);
      expect(await mockUSDC.balanceOf(owner.address)).to.equal(initialOwnerBalance + royaltyBalance);
    });

    it("Should not allow withdrawing more than available royalties", async function () {
      const royaltyBalance = await liquidityPool.royaltiesBalance();
      await expect(
        liquidityPool.withdrawRoyalties(royaltyBalance + BigInt(1))
      ).to.be.revertedWith("Amount exceeds royalties balance");
    });

    it("Should not allow non-owner to withdraw royalties", async function () {
      const royaltyBalance = await liquidityPool.royaltiesBalance();
      await expect(
        liquidityPool.connect(user1).withdrawRoyalties(royaltyBalance)
      ).to.be.revertedWithCustomError(liquidityPool, "AccessControlUnauthorizedAccount");
    });

    it("Should track royalties correctly across multiple swaps", async function () {
      const initialRoyalties = await liquidityPool.royaltiesBalance();
      
      // Perform another swap
      await liquidityPool.connect(user1).swapUSDCForBLTM(usdcAmount);
      
      const royaltyAmount = (usdcAmount * BigInt(2)) / BigInt(100);
      expect(await liquidityPool.royaltiesBalance()).to.equal(initialRoyalties + royaltyAmount);
    });

    it("Should maintain correct available USDC after royalty withdrawal", async function () {
      const totalUSDC = await mockUSDC.balanceOf(await liquidityPool.getAddress());
      const royaltyBalance = await liquidityPool.royaltiesBalance();
      const availableUSDC = await liquidityPool.getAvailableUSDC();

      await liquidityPool.withdrawRoyalties(royaltyBalance);

      expect(await liquidityPool.getAvailableUSDC()).to.equal(availableUSDC);
      expect(await mockUSDC.balanceOf(await liquidityPool.getAddress())).to.equal(totalUSDC - royaltyBalance);
    });
  });
}); 