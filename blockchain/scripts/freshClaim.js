import hre from "hardhat";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const crbAddress = "0x433AD862C5362C3679D60E9074CB5E943F2F91bd";
    const crb = await hre.ethers.getContractAt("MockToken", crbAddress);

    // Submit a fresh claim so the user has one to vote on
    console.log("Submitting fresh test claim...");
    const tx = await crb.submitClaim(
        "https://solarpanel-api.example.com/output/2026-08-09",
        hre.ethers.parseUnits("25", 18)
    );
    await tx.wait();
    
    const nextId = await crb.nextClaimId();
    console.log("Fresh claim submitted! Claim ID:", (Number(nextId) - 1));
    
    // Read it back to confirm
    const claim = await crb.claims(Number(nextId) - 1);
    console.log("Claim details:", {
        user: claim[0],
        proofUrl: claim[1],
        amount: hre.ethers.formatUnits(claim[2], 18) + " CRB",
        processed: claim[5]
    });
    
    console.log("\n✅ Fresh unprocessed claim is ready for voting!");
}

main().catch(console.error);
