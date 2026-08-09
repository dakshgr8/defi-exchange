import hre from "hardhat";

async function main() {
  const [signer] = await hre.ethers.getSigners();
  
  const Token = await hre.ethers.getContractFactory("MockToken");
  const token = await Token.deploy("Carbon", "CRB", signer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  const domain = {
    name: "Carbon",
    version: "1",
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
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
    nonce: 0n,
  };

  const signature = await signer.signTypedData(domain, types, value);
  console.log("Signature generated:", signature);

  try {
    const tx = await token.claim(value.amount, signature);
    const receipt = await tx.wait();
    console.log("Success!", receipt.hash);
  } catch (error) {
    console.error("Simulation failed:", error.message);
  }
}
main().catch(console.error);
