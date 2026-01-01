import hre from "hardhat";

async function main() {
  console.log("Deploying AfriCoin (AFRC)...");
  
  // getContractFactory is the standard way to load your compiled AfriCoin.sol
  const AfriCoin = await hre.ethers.getContractFactory("AfriCoin");
  const afriCoin = await AfriCoin.deploy();

  await afriCoin.waitForDeployment();

  const address = await afriCoin.getAddress();
  console.log("-----------------------------------------------");
  console.log("AfriCoin (AFRC) deployed to:", address);
  console.log("-----------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
