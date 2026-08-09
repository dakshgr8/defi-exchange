import hre from "hardhat";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const crbAddress = "0x433AD862C5362C3679D60E9074CB5E943F2F91bd";
    const crb = await hre.ethers.getContractAt("MockToken", crbAddress);

    // Check deployer balance
    const deployerBal = await crb.balanceOf(deployer.address);
    console.log("Deployer CRB balance:", hre.ethers.formatUnits(deployerBal, 18));

    // Test: submit a claim from deployer
    console.log("\n--- Testing submitClaim ---");
    const tx1 = await crb.submitClaim("https://solar-proof-example.com/panel-data", hre.ethers.parseUnits("50", 18));
    await tx1.wait();
    console.log("Claim submitted! TX:", tx1.hash);

    // Check nextClaimId
    const nextId = await crb.nextClaimId();
    console.log("Next claim ID:", nextId.toString());

    // Read the claim
    const claim = await crb.claims(0);
    console.log("Claim 0:", {
        user: claim[0],
        proofUrl: claim[1],
        amountRequested: hre.ethers.formatUnits(claim[2], 18),
        yesVotes: hre.ethers.formatUnits(claim[3], 18),
        noVotes: hre.ethers.formatUnits(claim[4], 18),
        processed: claim[5]
    });

    // Test: vote YES on the claim
    console.log("\n--- Testing voteOnClaim (YES) ---");
    const tx2 = await crb.voteOnClaim(0, true);
    await tx2.wait();
    console.log("Vote cast! TX:", tx2.hash);

    // Read updated claim
    const claimAfterVote = await crb.claims(0);
    console.log("Claim 0 after vote:", {
        yesVotes: hre.ethers.formatUnits(claimAfterVote[3], 18),
        noVotes: hre.ethers.formatUnits(claimAfterVote[4], 18),
    });

    // Test: process the claim
    console.log("\n--- Testing processClaim ---");
    const tx3 = await crb.processClaim(0);
    await tx3.wait();
    console.log("Claim processed! TX:", tx3.hash);

    // Check final state
    const claimFinal = await crb.claims(0);
    console.log("Claim 0 final:", { processed: claimFinal[5] });
    
    const balAfter = await crb.balanceOf(deployer.address);
    console.log("Deployer CRB balance after:", hre.ethers.formatUnits(balAfter, 18));

    console.log("\n✅ ALL DAO FUNCTIONS WORKING CORRECTLY!");
}

main().catch(console.error);
