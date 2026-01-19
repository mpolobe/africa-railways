import hre from "hardhat";

async function main() {
  const adminAddr = "0xC9c7A437D2F2992d88E3137A473c2e0bAd696477";
  const sentToken = "0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5";
  const pinkSalePool = "0xf366e3aaCC54C99E50c90B7C57625776f88D8d08";
  const stakingContract = "0x70A3Ebf1423EF6a9020EcC3e0A00c76cB1CF8883";
  const deployerAddr = "0xfcfa02A852551618f544fbcE52908A0F941abEf9";

  console.log("=".repeat(60));
  console.log("AFRICA RAILWAYS ECOSYSTEM - WALLET CHECK");
  console.log("=".repeat(60));
  console.log("");

  // Check balances
  const adminBalance = await hre.ethers.provider.getBalance(adminAddr);
  const deployerBalance = await hre.ethers.provider.getBalance(deployerAddr);

  console.log("WALLET BALANCES:");
  console.log("-".repeat(40));
  console.log("Admin Wallet:   ", adminAddr);
  console.log("  POL Balance:  ", hre.ethers.formatEther(adminBalance), "POL");
  console.log("");
  console.log("Deployer Wallet:", deployerAddr);
  console.log("  POL Balance:  ", hre.ethers.formatEther(deployerBalance), "POL");
  console.log("");

  // Check SENT token ownership
  const sentABI = [
    "function owner() view returns (address)",
    "function balanceOf(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)"
  ];
  
  try {
    const sent = new hre.ethers.Contract(sentToken, sentABI, hre.ethers.provider);
    
    console.log("SENT TOKEN (", sentToken, "):");
    console.log("-".repeat(40));
    
    try {
      const owner = await sent.owner();
      console.log("  Owner:        ", owner);
      console.log("  Is Admin Owner:", owner.toLowerCase() === adminAddr.toLowerCase() ? "YES" : "NO");
    } catch (e) {
      console.log("  Owner:         (no owner function - may be renounced)");
    }

    const totalSupply = await sent.totalSupply();
    console.log("  Total Supply: ", hre.ethers.formatEther(totalSupply), "SENT");

    const adminSentBalance = await sent.balanceOf(adminAddr);
    console.log("  Admin Balance:", hre.ethers.formatEther(adminSentBalance), "SENT");

    const deployerSentBalance = await sent.balanceOf(deployerAddr);
    console.log("  Deployer Bal: ", hre.ethers.formatEther(deployerSentBalance), "SENT");

    const pinkSaleBalance = await sent.balanceOf(pinkSalePool);
    console.log("  PinkSale Bal: ", hre.ethers.formatEther(pinkSaleBalance), "SENT");

  } catch (e) {
    console.log("  Error reading SENT token:", e.message);
  }

  console.log("");
  console.log("CONTRACT ADDRESSES:");
  console.log("-".repeat(40));
  console.log("  SENT Token:    ", sentToken);
  console.log("  PinkSale Pool: ", pinkSalePool);
  console.log("  SENTStaking:   ", stakingContract);
  console.log("");
}

main().catch(console.error);
