import hre from "hardhat";
import addresses from "../../frontend/src/config/addresses.json" assert { type: "json" };

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const tokenAddress = addresses.mockEthAddress;
  
  const domain = {
    name: "Carbon",
    version: "1",
    chainId: 11155111,
    verifyingContract: tokenAddress,
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
    amount: hre.ethers.parseUnits("500", 18),
    nonce: 0,
  };

  const signature = await signer.signTypedData(domain, types, value);
  console.log("Signature generated:", signature);

  const recovered = hre.ethers.verifyTypedData(domain, types, value, signature);
  console.log("Recovered by Ethers:", recovered);
  console.log("Expected:", signer.address);
}
main().catch(console.error);
