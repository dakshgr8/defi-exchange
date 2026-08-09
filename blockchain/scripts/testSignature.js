import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../../frontend/src/config/addresses.json")));

async function main() {
  const [signer] = await hre.ethers.getSigners();
  
  const Token = await hre.ethers.getContractFactory("MockToken");
  const token = Token.attach(addresses.mockEthAddress);

  const amount = hre.ethers.parseUnits("500", 18);
  const nonce = await token.nonces(signer.address);

  const domain = {
    name: "Carbon",
    version: "1",
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    verifyingContract: addresses.mockEthAddress,
  };

  const types = {
    Claim: [
      { name: "user", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };

  const value = {
    user: signer.address,
    amount: amount,
    nonce: nonce,
  };

  const signature = await signer.signTypedData(domain, types, value);
  console.log("Signature:", signature);

  try {
    const tx = await token.claim(amount, signature);
    console.log("Tx sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Mined!");
  } catch (error) {
    console.error("Simulation failed:", error.message);
  }
}

main().catch(console.error);
