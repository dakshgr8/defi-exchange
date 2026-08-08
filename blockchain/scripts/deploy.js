import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // 1. Deploy Mock Tokens
    console.log("Deploying MockETH...");
    const MockETH = await hre.ethers.getContractFactory("MockToken");
    const mockEth = await MockETH.deploy("Mock Ethereum", "mETH", deployer.address);
    await mockEth.waitForDeployment();
    const mockEthAddress = await mockEth.getAddress();
    console.log("MockETH deployed at:", mockEthAddress);

    console.log("Deploying MockUSDC...");
    const MockUSDC = await hre.ethers.getContractFactory("MockToken");
    const mockUsdc = await MockUSDC.deploy("Mock USDC", "mUSDC", deployer.address);
    await mockUsdc.waitForDeployment();
    const mockUsdcAddress = await mockUsdc.getAddress();
    console.log("MockUSDC deployed at:", mockUsdcAddress);

    // Mint a large supply to deployer (1,000,000 tokens with 18 decimals)
    const mintAmount = hre.ethers.parseUnits("1000000", 18);
    await mockEth.mint(deployer.address, mintAmount);
    await mockUsdc.mint(deployer.address, mintAmount);
    console.log("Minted 1,000,000 tokens of each to deployer");

    // 2. Deploy Liquidity Pool
    console.log("Deploying Liquidity Pool...");
    const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
    const pool = await LiquidityPool.deploy(mockEthAddress, mockUsdcAddress);
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();
    console.log("Liquidity Pool deployed at:", poolAddress);

    // 3. Seed Initial Liquidity (1 ETH = 2000 USDC)
    const ethToProvide = hre.ethers.parseUnits("10", 18); // 10 ETH
    const usdcToProvide = hre.ethers.parseUnits("20000", 18); // 20,000 USDC (2000x ratio)

    console.log("Approving tokens for liquidity pool...");
    await mockEth.approve(poolAddress, ethToProvide);
    await mockUsdc.approve(poolAddress, usdcToProvide);

    console.log("Adding initial liquidity...");
    await pool.addLiquidity(ethToProvide, usdcToProvide);
    console.log("Liquidity seeded successfully!");

    // 4. Export Addresses & ABIs to Frontend
    const frontendConfigDir = path.resolve(process.cwd(), "../frontend/src/config");
    if (!fs.existsSync(frontendConfigDir)) {
        fs.mkdirSync(frontendConfigDir, { recursive: true });
    }

    const config = {
        mockEthAddress,
        mockUsdcAddress,
        poolAddress
    };

    fs.writeFileSync(
        path.join(frontendConfigDir, "addresses.json"),
        JSON.stringify(config, null, 2)
    );

    // Copy ABIs
    const poolArtifact = await hre.artifacts.readArtifact("LiquidityPool");
    const mockTokenArtifact = await hre.artifacts.readArtifact("MockToken");

    const abis = {
        LiquidityPool: poolArtifact.abi,
        MockToken: mockTokenArtifact.abi
    };

    fs.writeFileSync(
        path.join(frontendConfigDir, "abis.json"),
        JSON.stringify(abis, null, 2)
    );

    console.log("Exported addresses and ABIs to frontend/config/");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
