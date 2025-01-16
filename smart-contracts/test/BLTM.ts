import { expect } from "chai";
import { ethers } from "hardhat";
import { BLTM } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BLTM", function () {
  let bltm: BLTM;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const BLTM = await ethers.getContractFactory("BLTM");
    bltm = await BLTM.deploy(owner.address);
    await bltm.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await bltm.name()).to.equal("BLTM");
      expect(await bltm.symbol()).to.equal("BLTM");
    });

    it("Should set the right decimals", async function () {
      expect(await bltm.decimals()).to.equal(6);
    });

    it("Should assign roles to the deployer", async function () {
      const minterRole = await bltm.MINTER_ROLE();
      const pauserRole = await bltm.PAUSER_ROLE();
      const defaultAdminRole = await bltm.DEFAULT_ADMIN_ROLE();

      expect(await bltm.hasRole(minterRole, owner.address)).to.be.true;
      expect(await bltm.hasRole(pauserRole, owner.address)).to.be.true;
      expect(await bltm.hasRole(defaultAdminRole, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minting by minter role", async function () {
      await bltm.mint(addr1.address, 100);
      expect(await bltm.balanceOf(addr1.address)).to.equal(100);
    });

    it("Should not allow minting by non-minter role", async function () {
      await expect(
        bltm.connect(addr1).mint(addr2.address, 100)
      ).to.be.revertedWithCustomError(bltm, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await bltm.mint(addr1.address, 1000);
    });

    it("Should allow burning by minter role", async function () {
      await bltm.burn(addr1.address, 100);
      expect(await bltm.balanceOf(addr1.address)).to.equal(900);
    });

    it("Should not allow burning by non-minter role", async function () {
      await expect(
        bltm.connect(addr1).burn(addr1.address, 100)
      ).to.be.revertedWithCustomError(bltm, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Pausing", function () {
    beforeEach(async function () {
      await bltm.mint(addr1.address, 1000);
    });

    it("Should allow pausing by pauser role", async function () {
      await bltm.pause();
      expect(await bltm.paused()).to.be.true;
    });

    it("Should not allow pausing by non-pauser role", async function () {
      await expect(
        bltm.connect(addr1).pause()
      ).to.be.revertedWithCustomError(bltm, "AccessControlUnauthorizedAccount");
    });

    it("Should prevent transfers when paused", async function () {
      await bltm.pause();
      await expect(
        bltm.connect(addr1).transfer(addr2.address, 100)
      ).to.be.revertedWithCustomError(bltm, "EnforcedPause");
    });

    it("Should allow transfers after unpausing", async function () {
      await bltm.pause();
      await bltm.unpause();
      await bltm.connect(addr1).transfer(addr2.address, 100);
      expect(await bltm.balanceOf(addr2.address)).to.equal(100);
    });
  });
}); 