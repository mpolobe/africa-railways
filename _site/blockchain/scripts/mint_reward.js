import hre from "hardhat";

async function main() {
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [owner] = await hre.ethers.getSigners();
  
  const afriCoin = await hre.ethers.getContractAt("AfriCoin", CONTRACT_ADDRESS);
  
  console.log("Minting 1,000 AFRC to traveler:", owner.address);
  const tx = await afriCoin.rewardTraveler(owner.address, hre.ethers.parseUnits("1000", 18));
  await tx.wait();
  
  const balance = await afriCoin.balanceOf(owner.address);
  console.log("Success! Traveler Balance:", hre.ethers.formatUnits(balance, 18), "AFRC");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
