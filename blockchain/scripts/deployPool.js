import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const addressesPath = path.join(__dirname, "../../frontend/src/config/addresses.json");
const addresses = JSON.parse(fs.readFileSync(addressesPath));

async function main() {
  console.log("Deploying new LiquidityPool...");
  const Pool = await hre.ethers.getContractFactory("LiquidityPool");
  const pool = await Pool.deploy(addresses.mockEthAddress, addresses.mockUsdcAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  
  console.log("New LiquidityPool deployed to:", poolAddress);
  
  addresses.poolAddress = poolAddress;
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("Updated addresses.json");
}
main().catch(console.error);
