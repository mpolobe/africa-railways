import hre from "hardhat";

async function main() {
  const addr = "0xfcfa02A852551618f544fbcE52908A0F941abEf9";
  const balance = await hre.ethers.provider.getBalance(addr);
  console.log("Deployer:", addr);
  console.log("Balance:", hre.ethers.formatEther(balance), "POL");
}

main().catch(console.error);
