import hre from "hardhat";

async function main() {
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [traveler, treasury] = await hre.ethers.getSigners();
  
  const afriCoin = await hre.ethers.getContractAt("AfriCoin", CONTRACT_ADDRESS);
  const fareAmount = hre.ethers.parseUnits("50", 18); 
  
  console.log("--- Africa Railways Payment System ---");
  console.log("Processing payment from Traveler to Treasury...");

  const tx = await afriCoin.transfer(treasury.address, fareAmount);
  await tx.wait();
  
  const balance = await afriCoin.balanceOf(traveler.address);
  console.log("-----------------------------------------------");
  console.log("Payment Successful!");
  console.log("Remaining Traveler Balance:", hre.ethers.formatUnits(balance, 18), "AFRC");
  console.log("-----------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
