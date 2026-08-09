import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying Liquidity Pool with account:", deployer.address);

    const mockEthAddress = "0xcab4306626338cDee42AF46A0f0A17Fb3Ac30769";
    const mockUsdcAddress = "0x0090F8C29E16Fd6E19B75535bD9938c7dB505EA0";

    const mockEth = await hre.ethers.getContractAt("MockToken", mockEthAddress);
    const mockUsdc = await hre.ethers.getContractAt("MockToken", mockUsdcAddress);

    console.log("Deploying new Liquidity Pool...");
    const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
    const pool = await LiquidityPool.deploy(mockEthAddress, mockUsdcAddress);
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();
    console.log("Liquidity Pool deployed at:", poolAddress);

    // 3. Seed Initial Liquidity
    const ethToProvide = hre.ethers.parseUnits("1000", 18);
    const usdcToProvide = hre.ethers.parseUnits("5000", 18);

    console.log("Approving tokens for liquidity pool...");
    const txApp1 = await mockEth.approve(poolAddress, ethToProvide);
    await txApp1.wait();
    console.log("Approved CRB");
    
    const txApp2 = await mockUsdc.approve(poolAddress, usdcToProvide);
    await txApp2.wait();
    console.log("Approved USDT");

    console.log("Adding initial liquidity...");
    const txAdd = await pool.addLiquidity(ethToProvide, usdcToProvide);
    await txAdd.wait();
    console.log("Liquidity seeded successfully!");
    
    // Perform one swap so the subgraph has data immediately!
    console.log("Performing initial swap for the graph...");
    const swapAmount = hre.ethers.parseUnits("10", 18);
    const txApp3 = await mockUsdc.approve(poolAddress, swapAmount);
    await txApp3.wait();
    const txSwap = await pool.swap(mockUsdcAddress, swapAmount);
    await txSwap.wait();
    console.log("Swap completed!");

    // 4. Export Addresses & ABIs
    const frontendConfigDir = path.resolve(process.cwd(), "../frontend/src/config");
    const config = { mockEthAddress, mockUsdcAddress, poolAddress };

    fs.writeFileSync(
        path.join(frontendConfigDir, "addresses.json"),
        JSON.stringify(config, null, 2)
    );

    const poolArtifact = await hre.artifacts.readArtifact("LiquidityPool");
    const abisPath = path.join(frontendConfigDir, "abis.json");
    const abis = JSON.parse(fs.readFileSync(abisPath));
    abis.LiquidityPool = poolArtifact.abi;
    fs.writeFileSync(abisPath, JSON.stringify(abis, null, 2));

    console.log("Exported addresses and ABIs to frontend/config/");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
