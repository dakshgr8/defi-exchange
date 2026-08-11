import { expect } from "chai";
import hre from "hardhat";

describe("DeFi Exchange Smart Contracts", function () {
  let deployer, alice, bob, oracle;
  let mockEth, mockUsdc, pool;

  beforeEach(async function () {
    [deployer, alice, bob, oracle] = await hre.ethers.getSigners();

    // 1. Deploy Tokens
    const MockToken = await hre.ethers.getContractFactory("MockToken");
    mockEth = await MockToken.deploy("Carbon", "CRB", oracle.address);
    await mockEth.waitForDeployment();

    mockUsdc = await MockToken.deploy("Tether USD", "USDT", deployer.address);
    await mockUsdc.waitForDeployment();

    // Mint tokens
    const mintAmount = hre.ethers.parseUnits("100000", 18);
    await mockEth.connect(oracle).mint(deployer.address, mintAmount);
    await mockEth.connect(oracle).mint(alice.address, mintAmount);
    await mockEth.connect(oracle).mint(bob.address, mintAmount);

    await mockUsdc.mint(deployer.address, mintAmount);
    await mockUsdc.mint(alice.address, mintAmount);
    await mockUsdc.mint(bob.address, mintAmount);

    // 2. Deploy Liquidity Pool
    const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
    pool = await LiquidityPool.deploy(await mockEth.getAddress(), await mockUsdc.getAddress());
    await pool.waitForDeployment();
  });

  describe("MockToken & EIP-712 Claims", function () {
    it("should allow burning / retiring tokens", async function () {
      const retireAmount = hre.ethers.parseUnits("100", 18);
      const initialBal = await mockEth.balanceOf(alice.address);
      
      await mockEth.connect(alice).retire(retireAmount, "Offsetting flights");
      
      const finalBal = await mockEth.balanceOf(alice.address);
      expect(initialBal - finalBal).to.equal(retireAmount);
    });

    it("should verify EIP-712 oracle signatures and mint reward", async function () {
      const certificateId = "VERRA-2026-500-BETA";
      const amount = hre.ethers.parseUnits("50000", 18); // 500 * 100
      const nonce = await mockEth.nonces(alice.address);
      const chainId = (await hre.ethers.provider.getNetwork()).chainId;
      const tokenAddress = await mockEth.getAddress();

      const domain = {
        name: "Carbon",
        version: "1",
        chainId: chainId,
        verifyingContract: tokenAddress,
      };

      const types = {
        Claim: [
          { name: "user", type: "address" },
          { name: "certificateId", type: "string" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      };

      const value = {
        user: alice.address,
        certificateId: certificateId,
        amount: amount,
        nonce: nonce,
      };

      const signature = await oracle.signTypedData(domain, types, value);

      const aliceBalBefore = await mockEth.balanceOf(alice.address);
      await mockEth.connect(alice).claim(certificateId, amount, signature);
      const aliceBalAfter = await mockEth.balanceOf(alice.address);

      expect(aliceBalAfter - aliceBalBefore).to.equal(amount);

      // Replay attack must revert
      await expect(
        mockEth.connect(alice).claim(certificateId, amount, signature)
      ).to.be.revertedWith("Certificate already claimed");
    });
  });

  describe("DAO Peer Verification", function () {
    it("should process claims and distribute staking rewards", async function () {
      const proofUrl = "https://ipfs.io/ipfs/QmProof123";
      const requested = hre.ethers.parseUnits("500", 18);

      await mockEth.connect(alice).submitClaim(proofUrl, requested);
      const claimId = 0;

      // Bob votes YES with 50 CRB stake
      const stakeAmount = hre.ethers.parseUnits("50", 18);
      await mockEth.connect(bob).voteOnClaim(claimId, true, stakeAmount);

      // Fast forward past 5 min deadline
      await hre.ethers.provider.send("evm_increaseTime", [301]);
      await hre.ethers.provider.send("evm_mine");

      const aliceBalBefore = await mockEth.balanceOf(alice.address);
      await mockEth.finalizeClaim(claimId);
      const aliceBalAfter = await mockEth.balanceOf(alice.address);

      expect(aliceBalAfter - aliceBalBefore).to.equal(requested);
    });
  });

  describe("LiquidityPool AMM", function () {
    it("should allow adding liquidity and swapping", async function () {
      const poolAddr = await pool.getAddress();
      const ethAmount = hre.ethers.parseUnits("1000", 18);
      const usdcAmount = hre.ethers.parseUnits("5000", 18);

      await mockEth.connect(deployer).approve(poolAddr, ethAmount);
      await mockUsdc.connect(deployer).approve(poolAddr, usdcAmount);

      await pool.connect(deployer).addLiquidity(ethAmount, usdcAmount);

      expect(await pool.reserve0()).to.equal(ethAmount);
      expect(await pool.reserve1()).to.equal(usdcAmount);

      // Alice swaps 10 CRB for USDT
      const swapInput = hre.ethers.parseUnits("10", 18);
      await mockEth.connect(alice).approve(poolAddr, swapInput);
      
      const aliceUsdtBefore = await mockUsdc.balanceOf(alice.address);
      await pool.connect(alice).swap(await mockEth.getAddress(), swapInput);
      const aliceUsdtAfter = await mockUsdc.balanceOf(alice.address);

      expect(aliceUsdtAfter).to.be.gt(aliceUsdtBefore);
    });
  });
});
