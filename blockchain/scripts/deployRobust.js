import hre from "hardhat";
import fs from "fs";
import path from "path";

const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying all contracts with account:", deployer.address);

    console.log("Deploying Carbon (CRB) with DAO Logic...");
    const MockToken = await hre.ethers.getContractFactory("MockToken");
    const mockEth = await MockToken.deploy("Carbon", "CRB", deployer.address);
    await mockEth.waitForDeployment();
    const mockEthAddress = await mockEth.getAddress();
    console.log("Carbon deployed at:", mockEthAddress);
    await delay(2000);

    console.log("Deploying USDT...");
    const mockUsdc = await MockToken.deploy("Tether USD", "USDT", deployer.address);
    await mockUsdc.waitForDeployment();
    const mockUsdcAddress = await mockUsdc.getAddress();
    console.log("USDT deployed at:", mockUsdcAddress);
    await delay(2000);

    const mintAmount = hre.ethers.parseUnits("1000000", 18);
    const txMint1 = await mockEth.mint(deployer.address, mintAmount);
    await txMint1.wait();
    await delay(2000);

    const txMint2 = await mockUsdc.mint(deployer.address, mintAmount);
    await txMint2.wait();
    console.log("Minted tokens");
    await delay(2000);

    console.log("Deploying Liquidity Pool...");
    const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
    const pool = await LiquidityPool.deploy(mockEthAddress, mockUsdcAddress);
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();
    console.log("Liquidity Pool deployed at:", poolAddress);
    await delay(2000);

    const ethToProvide = hre.ethers.parseUnits("1000", 18);
    const usdcToProvide = hre.ethers.parseUnits("5000", 18);

    console.log("Approving...");
    const txApp1 = await mockEth.approve(poolAddress, ethToProvide);
    await txApp1.wait();
    await delay(2000);

    const txApp2 = await mockUsdc.approve(poolAddress, usdcToProvide);
    await txApp2.wait();
    await delay(2000);

    console.log("Adding liquidity...");
    const txAdd = await pool.addLiquidity(ethToProvide, usdcToProvide);
    await txAdd.wait();
    console.log("Liquidity seeded!");
    await delay(2000);

    console.log("Doing initial swap for graph...");
    const swapAmount = hre.ethers.parseUnits("10", 18);
    const txApp3 = await mockUsdc.approve(poolAddress, swapAmount);
    await txApp3.wait();
    await delay(2000);

    const txSwap = await pool.swap(mockUsdcAddress, swapAmount);
    await txSwap.wait();
    console.log("Swap completed!");
    await delay(2000);

    const frontendConfigDir = path.resolve(process.cwd(), "../frontend/src/config");
    const config = { mockEthAddress, mockUsdcAddress, poolAddress };

    fs.writeFileSync(
        path.join(frontendConfigDir, "addresses.json"),
        JSON.stringify(config, null, 2)
    );

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
    console.log("Done!");
}

main().catch(console.error);
