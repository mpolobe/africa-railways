import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying remaining contracts...");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "POL");
  console.log("");

  const SENT_TOKEN = "0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5";
  const STAKING_ADDRESS = "0x70A3Ebf1423EF6a9020EcC3e0A00c76cB1CF8883";
  
  console.log("Already deployed:");
  console.log("  SENT Token:", SENT_TOKEN);
  console.log("  SENTStaking:", STAKING_ADDRESS);
  console.log("");

  // Deploy SENTGovernance
  console.log("Deploying SENTGovernance...");
  const SENTGovernance = await hre.ethers.getContractFactory("SENTGovernance");
  const proposalThreshold = hre.ethers.parseEther("10000000");
  const votingDelay = 8640;
  const votingPeriod = 60480;
  const quorumPercentage = 4;
  
  const governance = await SENTGovernance.deploy(
    SENT_TOKEN,
    proposalThreshold,
    votingDelay,
    votingPeriod,
    quorumPercentage
  );
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("  SENTGovernance deployed to:", governanceAddress);

  // Wait a bit to avoid rate limiting
  console.log("Waiting 5 seconds...");
  await new Promise(r => setTimeout(r, 5000));

  // Deploy SENTVesting
  console.log("Deploying SENTVesting...");
  const SENTVesting = await hre.ethers.getContractFactory("SENTVesting");
  const vesting = await SENTVesting.deploy(SENT_TOKEN);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("  SENTVesting deployed to:", vestingAddress);

  console.log("");
  console.log("=".repeat(60));
  console.log("ALL CONTRACTS DEPLOYED");
  console.log("=".repeat(60));
  console.log("");
  console.log("SENT Token:      ", SENT_TOKEN);
  console.log("SENTStaking:     ", STAKING_ADDRESS);
  console.log("SENTGovernance:  ", governanceAddress);
  console.log("SENTVesting:     ", vestingAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
