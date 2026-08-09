import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // 1. Deploy Tokens
    console.log("Deploying Carbon (CRB)...");
    const MockETH = await hre.ethers.getContractFactory("MockToken");
    const mockEth = await MockETH.deploy("Carbon", "CRB", deployer.address);
    await mockEth.waitForDeployment();
    const mockEthAddress = await mockEth.getAddress();
    console.log("Carbon deployed at:", mockEthAddress);

    console.log("Deploying USDT...");
    const MockUSDC = await hre.ethers.getContractFactory("MockToken");
    const mockUsdc = await MockUSDC.deploy("Tether USD", "USDT", deployer.address);
    await mockUsdc.waitForDeployment();
    const mockUsdcAddress = await mockUsdc.getAddress();
    console.log("USDT deployed at:", mockUsdcAddress);

    // Mint a large supply to deployer (1,000,000 tokens with 18 decimals)
    const mintAmount = hre.ethers.parseUnits("1000000", 18);
    const txMint1 = await mockEth.mint(deployer.address, mintAmount);
    await txMint1.wait();
    const txMint2 = await mockUsdc.mint(deployer.address, mintAmount);
    await txMint2.wait();
    console.log("Minted 1,000,000 tokens of each to deployer");

    // 2. Deploy Liquidity Pool
    console.log("Deploying Liquidity Pool...");
    const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
    const pool = await LiquidityPool.deploy(mockEthAddress, mockUsdcAddress);
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();
    console.log("Liquidity Pool deployed at:", poolAddress);

    // 3. Seed Initial Liquidity (1 CRB = 5 USDT)
    const ethToProvide = hre.ethers.parseUnits("1000", 18); // 1000 CRB
    const usdcToProvide = hre.ethers.parseUnits("5000", 18); // 5000 USDT (5x ratio)

    console.log("Approving tokens for liquidity pool...");
    const txApp1 = await mockEth.approve(poolAddress, ethToProvide);
    await txApp1.wait();
    const txApp2 = await mockUsdc.approve(poolAddress, usdcToProvide);
    await txApp2.wait();

    console.log("Adding initial liquidity...");
    const txAdd = await pool.addLiquidity(ethToProvide, usdcToProvide);
    await txAdd.wait();
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
