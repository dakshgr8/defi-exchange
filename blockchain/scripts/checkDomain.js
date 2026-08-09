import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../../frontend/src/config/addresses.json")));

async function main() {
  const Token = await hre.ethers.getContractFactory("MockToken");
  const token = Token.attach(addresses.mockEthAddress);

  const domain = await token.eip712Domain();
  console.log("Domain from Contract:");
  console.log("fields:", domain.fields);
  console.log("name:", domain.name);
  console.log("version:", domain.version);
  console.log("chainId:", domain.chainId.toString());
  console.log("verifyingContract:", domain.verifyingContract);
  console.log("salt:", domain.salt);
  console.log("extensions:", domain.extensions);
}
main().catch(console.error);
