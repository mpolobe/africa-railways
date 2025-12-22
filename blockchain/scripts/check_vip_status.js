import hre from "hardhat";

async function main() {
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [user] = await hre.ethers.getSigners();
  
  const afriCoin = await hre.ethers.getContractAt("AfriCoin", CONTRACT_ADDRESS);
  const balance = await afriCoin.balanceOf(user.address);
  
  const balanceEth = parseFloat(hre.ethers.formatUnits(balance, 18));
  
  console.log("--- Loyalty Status Check ---");
  console.log("Current Balance:", balanceEth, "AFRC");

  if (balanceEth > 500000) {
    console.log("STATUS: GOLD MEMBER (VIP)");
    console.log("Benefit: 10% Discount on all Railway Fares enabled.");
  } else {
    console.log("STATUS: STANDARD MEMBER");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
