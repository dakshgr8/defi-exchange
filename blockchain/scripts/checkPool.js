import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../../frontend/src/config/addresses.json")));

async function main() {
  const Pool = await hre.ethers.getContractFactory("LiquidityPool");
  const pool = Pool.attach(addresses.poolAddress);

  const reserve0 = await pool.reserve0();
  const reserve1 = await pool.reserve1();
  const kLast = await pool.price0CumulativeLast();
  const ts = await pool.blockTimestampLast();

  console.log("Reserve0 (CRB):", hre.ethers.formatUnits(reserve0, 18));
  console.log("Reserve1 (USDC):", hre.ethers.formatUnits(reserve1, 18));
  console.log("KLast:", kLast.toString());
  console.log("Timestamp:", ts.toString());
}
main().catch(console.error);
