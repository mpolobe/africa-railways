import hre from "hardhat";

/**
 * Deploy SENT ecosystem contracts:
 * 1. SENTStaking - Revenue share staking
 * 2. SENTGovernance - On-chain voting
 * 3. SENTVesting - Transparent vesting schedules
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying SENT ecosystem contracts...");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "POL");
  console.log("");

  // SENT Token address (already deployed)
  const SENT_TOKEN = "0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5";
  
  console.log("Using SENT Token:", SENT_TOKEN);
  console.log("");

  // 1. Deploy SENTStaking
  console.log("1. Deploying SENTStaking...");
  const SENTStaking = await hre.ethers.getContractFactory("SENTStaking");
  const staking = await SENTStaking.deploy(SENT_TOKEN);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("   SENTStaking deployed to:", stakingAddress);

  // 2. Deploy SENTGovernance
  console.log("2. Deploying SENTGovernance...");
  const SENTGovernance = await hre.ethers.getContractFactory("SENTGovernance");
  
  // Governance parameters:
  // - proposalThreshold: 10,000,000 SENT (0.1% of 10B supply)
  // - votingDelay: 8640 blocks (~1 day at 10s blocks)
  // - votingPeriod: 60480 blocks (~7 days at 10s blocks)
  // - quorumPercentage: 4%
  const proposalThreshold = hre.ethers.parseEther("10000000"); // 10M SENT
  const votingDelay = 8640;      // ~1 day
  const votingPeriod = 60480;    // ~7 days
  const quorumPercentage = 4;    // 4%
  
  const governance = await SENTGovernance.deploy(
    SENT_TOKEN,
    proposalThreshold,
    votingDelay,
    votingPeriod,
    quorumPercentage
  );
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("   SENTGovernance deployed to:", governanceAddress);

  // 3. Deploy SENTVesting
  console.log("3. Deploying SENTVesting...");
  const SENTVesting = await hre.ethers.getContractFactory("SENTVesting");
  const vesting = await SENTVesting.deploy(SENT_TOKEN);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("   SENTVesting deployed to:", vestingAddress);

  console.log("");
  console.log("=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("");
  console.log("Contract Addresses:");
  console.log("-------------------");
  console.log("SENT Token:      ", SENT_TOKEN);
  console.log("SENTStaking:     ", stakingAddress);
  console.log("SENTGovernance:  ", governanceAddress);
  console.log("SENTVesting:     ", vestingAddress);
  console.log("");
  console.log("Next Steps:");
  console.log("-----------");
  console.log("1. Verify contracts on PolygonScan:");
  console.log(`   npx hardhat verify --network polygon ${stakingAddress} ${SENT_TOKEN}`);
  console.log(`   npx hardhat verify --network polygon ${governanceAddress} ${SENT_TOKEN} ${proposalThreshold} ${votingDelay} ${votingPeriod} ${quorumPercentage}`);
  console.log(`   npx hardhat verify --network polygon ${vestingAddress} ${SENT_TOKEN}`);
  console.log("");
  console.log("2. Set TGE timestamp on vesting contract");
  console.log("3. Create vesting schedules for Team, Advisors, Community, Ecosystem");
  console.log("4. Update TOKENOMICS.md with deployed addresses");
  console.log("5. Set up Gnosis Safe multi-sig for treasury");
  
  // Return addresses for programmatic use
  return {
    sentToken: SENT_TOKEN,
    staking: stakingAddress,
    governance: governanceAddress,
    vesting: vestingAddress
  };
}

main()
  .then((addresses) => {
    console.log("");
    console.log("Deployment addresses (JSON):");
    console.log(JSON.stringify(addresses, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
