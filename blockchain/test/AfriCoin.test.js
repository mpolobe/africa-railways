import { expect } from "chai";
import hre from "hardhat";

describe("AfriCoin", function () {
  let afriCoin;
  let owner;
  let traveler1;
  let traveler2;

  const INITIAL_SUPPLY = hre.ethers.parseEther("1000000000"); // 1 billion

  beforeEach(async function () {
    [owner, traveler1, traveler2] = await hre.ethers.getSigners();
    
    const AfriCoin = await hre.ethers.getContractFactory("AfriCoin");
    afriCoin = await AfriCoin.deploy();
    await afriCoin.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the correct name and symbol", async function () {
      expect(await afriCoin.name()).to.equal("AfriCoin");
      expect(await afriCoin.symbol()).to.equal("AFRC");
    });

    it("should mint initial supply to deployer", async function () {
      const ownerBalance = await afriCoin.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("should set deployer as owner", async function () {
      expect(await afriCoin.owner()).to.equal(owner.address);
    });

    it("should have correct total supply", async function () {
      expect(await afriCoin.totalSupply()).to.equal(INITIAL_SUPPLY);
    });
  });

  describe("Transfers", function () {
    it("should transfer tokens between accounts", async function () {
      const amount = hre.ethers.parseEther("1000");
      
      await afriCoin.transfer(traveler1.address, amount);
      expect(await afriCoin.balanceOf(traveler1.address)).to.equal(amount);
    });

    it("should fail if sender doesn't have enough tokens", async function () {
      const amount = hre.ethers.parseEther("1");
      
      await expect(
        afriCoin.connect(traveler1).transfer(traveler2.address, amount)
      ).to.be.revertedWithCustomError(afriCoin, "ERC20InsufficientBalance");
    });

    it("should update balances after transfers", async function () {
      const amount = hre.ethers.parseEther("100");
      
      await afriCoin.transfer(traveler1.address, amount);
      await afriCoin.connect(traveler1).transfer(traveler2.address, amount);
      
      expect(await afriCoin.balanceOf(traveler1.address)).to.equal(0);
      expect(await afriCoin.balanceOf(traveler2.address)).to.equal(amount);
    });
  });

  describe("Reward Traveler", function () {
    it("should allow owner to reward travelers", async function () {
      const rewardAmount = hre.ethers.parseEther("50");
      
      await afriCoin.rewardTraveler(traveler1.address, rewardAmount);
      
      expect(await afriCoin.balanceOf(traveler1.address)).to.equal(rewardAmount);
      expect(await afriCoin.totalSupply()).to.equal(INITIAL_SUPPLY + rewardAmount);
    });

    it("should reject reward from non-owner", async function () {
      const rewardAmount = hre.ethers.parseEther("50");
      
      await expect(
        afriCoin.connect(traveler1).rewardTraveler(traveler2.address, rewardAmount)
      ).to.be.revertedWithCustomError(afriCoin, "OwnableUnauthorizedAccount");
    });

    it("should allow multiple rewards to same traveler", async function () {
      const reward1 = hre.ethers.parseEther("25");
      const reward2 = hre.ethers.parseEther("75");
      
      await afriCoin.rewardTraveler(traveler1.address, reward1);
      await afriCoin.rewardTraveler(traveler1.address, reward2);
      
      expect(await afriCoin.balanceOf(traveler1.address)).to.equal(reward1 + reward2);
    });
  });

  describe("Allowances", function () {
    it("should approve and allow transferFrom", async function () {
      const amount = hre.ethers.parseEther("500");
      
      await afriCoin.approve(traveler1.address, amount);
      expect(await afriCoin.allowance(owner.address, traveler1.address)).to.equal(amount);
      
      await afriCoin.connect(traveler1).transferFrom(owner.address, traveler2.address, amount);
      expect(await afriCoin.balanceOf(traveler2.address)).to.equal(amount);
    });

    it("should fail transferFrom without approval", async function () {
      const amount = hre.ethers.parseEther("100");
      
      await expect(
        afriCoin.connect(traveler1).transferFrom(owner.address, traveler2.address, amount)
      ).to.be.revertedWithCustomError(afriCoin, "ERC20InsufficientAllowance");
    });
  });

  describe("Ownership", function () {
    it("should allow owner to transfer ownership", async function () {
      await afriCoin.transferOwnership(traveler1.address);
      expect(await afriCoin.owner()).to.equal(traveler1.address);
    });

    it("should allow new owner to reward travelers", async function () {
      await afriCoin.transferOwnership(traveler1.address);
      
      const rewardAmount = hre.ethers.parseEther("100");
      await afriCoin.connect(traveler1).rewardTraveler(traveler2.address, rewardAmount);
      
      expect(await afriCoin.balanceOf(traveler2.address)).to.equal(rewardAmount);
    });
  });

  describe("Gas Optimization", function () {
    it("should have reasonable gas cost for transfer", async function () {
      const amount = hre.ethers.parseEther("100");
      
      const tx = await afriCoin.transfer(traveler1.address, amount);
      const receipt = await tx.wait();
      
      // Standard ERC20 transfer should be under 65000 gas
      expect(receipt.gasUsed).to.be.lessThan(65000n);
    });

    it("should have reasonable gas cost for reward", async function () {
      const amount = hre.ethers.parseEther("50");
      
      const tx = await afriCoin.rewardTraveler(traveler1.address, amount);
      const receipt = await tx.wait();
      
      // Mint operation should be under 75000 gas
      expect(receipt.gasUsed).to.be.lessThan(75000n);
    });
  });
});
