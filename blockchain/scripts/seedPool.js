import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../../frontend/src/config/addresses.json")));

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Seeding pool from:", deployer.address);

  const CRB = await hre.ethers.getContractAt("MockToken", addresses.mockEthAddress);
  const USDT = await hre.ethers.getContractAt("MockToken", addresses.mockUsdcAddress);
  const Pool = await hre.ethers.getContractAt("LiquidityPool", addresses.poolAddress);

  const amountCRB = hre.ethers.parseUnits("10000", 18);
  const amountUSDT = hre.ethers.parseUnits("10000", 18);

  console.log("Minting tokens...");
  await (await CRB.mint(deployer.address, amountCRB)).wait();
  await (await USDT.mint(deployer.address, amountUSDT)).wait();

  console.log("Approving tokens...");
  await (await CRB.approve(addresses.poolAddress, amountCRB)).wait();
  await (await USDT.approve(addresses.poolAddress, amountUSDT)).wait();

  console.log("Adding liquidity...");
  await (await Pool.addLiquidity(amountCRB, amountUSDT)).wait();

  const reserve0 = await Pool.reserve0();
  const reserve1 = await Pool.reserve1();
  
  console.log("Pool Seeded!");
  console.log("Reserve0 (CRB):", hre.ethers.formatUnits(reserve0, 18));
  console.log("Reserve1 (USDT):", hre.ethers.formatUnits(reserve1, 18));
}
main().catch(console.error);
