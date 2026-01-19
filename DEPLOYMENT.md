# SENT Ecosystem Deployment Guide

This guide covers deploying the SENT staking, governance, and vesting contracts to Polygon.

## Prerequisites

1. **Wallet with POL:** You need a wallet with POL tokens for gas fees (~0.5 POL should be sufficient)
2. **Private Key:** Export your wallet's private key
3. **Node.js:** v18+ installed
4. **PolygonScan API Key:** For contract verification (optional but recommended)

## Environment Setup

1. Create a `.env` file in the project root:

```bash
# Polygon Mainnet
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_RELAYER_PRIVATE_KEY=your_private_key_here

# For contract verification (optional)
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

⚠️ **NEVER commit your private key to git!**

2. Install dependencies:

```bash
npm install
```

3. Compile contracts:

```bash
npx hardhat compile
```

## Deployment

### Option 1: Automated Deployment Script

Run the deployment script:

```bash
npx hardhat run blockchain/scripts/deploy-sent-ecosystem.js --network polygon
```

This will deploy:
- SENTStaking
- SENTGovernance  
- SENTVesting

### Option 2: Manual Deployment via Hardhat Console

```bash
npx hardhat console --network polygon
```

Then in the console:

```javascript
const SENT_TOKEN = "0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5";

// Deploy Staking
const Staking = await ethers.getContractFactory("SENTStaking");
const staking = await Staking.deploy(SENT_TOKEN);
await staking.waitForDeployment();
console.log("Staking:", await staking.getAddress());

// Deploy Governance
const Governance = await ethers.getContractFactory("SENTGovernance");
const governance = await Governance.deploy(
  SENT_TOKEN,
  ethers.parseEther("10000000"), // 10M SENT threshold
  8640,   // ~1 day voting delay
  60480,  // ~7 day voting period
  4       // 4% quorum
);
await governance.waitForDeployment();
console.log("Governance:", await governance.getAddress());

// Deploy Vesting
const Vesting = await ethers.getContractFactory("SENTVesting");
const vesting = await Vesting.deploy(SENT_TOKEN);
await vesting.waitForDeployment();
console.log("Vesting:", await vesting.getAddress());
```

## Contract Verification

After deployment, verify contracts on PolygonScan:

```bash
# Staking
npx hardhat verify --network polygon <STAKING_ADDRESS> 0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5

# Governance
npx hardhat verify --network polygon <GOVERNANCE_ADDRESS> \
  0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5 \
  10000000000000000000000000 \
  8640 \
  60480 \
  4

# Vesting
npx hardhat verify --network polygon <VESTING_ADDRESS> 0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5
```

## Post-Deployment Setup

### 1. Set TGE Timestamp (Vesting Contract)

```javascript
const vesting = await ethers.getContractAt("SENTVesting", "<VESTING_ADDRESS>");
const tgeTimestamp = Math.floor(Date.now() / 1000); // Current time, or future date
await vesting.setTGE(tgeTimestamp);
```

### 2. Create Vesting Schedules

Example for Team allocation (10% = 1B SENT, 24mo vesting, 6mo cliff):

```javascript
const SENT = await ethers.getContractAt("IERC20", "0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5");
const vesting = await ethers.getContractAt("SENTVesting", "<VESTING_ADDRESS>");

// Approve vesting contract to spend SENT
const teamAmount = ethers.parseEther("1000000000"); // 1B SENT
await SENT.approve(await vesting.getAddress(), teamAmount);

// Create vesting schedule
await vesting.createVestingSchedule(
  "0xTEAM_WALLET_ADDRESS",     // beneficiary
  "Team",                       // allocation name
  teamAmount,                   // total amount
  15552000,                     // cliff: 6 months (180 days in seconds)
  47304000,                     // vesting: 18 months after cliff (24mo total)
  0,                            // TGE percentage (0 = no immediate release)
  true                          // revocable
);
```

### 3. Vesting Schedule Reference

| Allocation | Amount | Cliff | Vesting | TGE % |
|------------|--------|-------|---------|-------|
| Team & Advisors | 1,000,000,000 | 6 months | 24 months total | 0% |
| Community & Sentinels | 2,500,000,000 | 6 months | 36 months total | 0% |
| Ecosystem Fund | 546,500,000 | 0 | 48 months linear | 0% |

### 4. Set Up Gnosis Safe (Treasury Multi-Sig)

1. Go to [Gnosis Safe](https://app.safe.global/)
2. Connect to Polygon network
3. Create new Safe with 3-of-5 threshold
4. Add 5 signers (team members)
5. Transfer treasury tokens to Safe address
6. Update TOKENOMICS.md with Safe address

## Update Documentation

After deployment, update these files with contract addresses:

1. **TOKENOMICS.md** - Add deployed addresses
2. **VERIFICATION.md** - Add contract links
3. **SENT_LITEPAPER.md** - Update contract section

## Security Checklist

- [ ] Private key stored securely (not in repo)
- [ ] Contracts verified on PolygonScan
- [ ] Vesting schedules created correctly
- [ ] Treasury transferred to multi-sig
- [ ] Test all functions on testnet first (optional)
- [ ] Schedule security audit

## Testnet Deployment (Optional)

To test on Polygon Amoy testnet first:

1. Get testnet POL from [Polygon Faucet](https://faucet.polygon.technology/)
2. Deploy a test SENT token
3. Run deployment script with `--network polygonAmoy`

Add to hardhat.config.js:

```javascript
polygonAmoy: {
  url: "https://rpc-amoy.polygon.technology",
  accounts: process.env.POLYGON_RELAYER_PRIVATE_KEY ? [process.env.POLYGON_RELAYER_PRIVATE_KEY] : [],
  chainId: 80002
}
```

## Troubleshooting

### "Insufficient funds"
- Ensure wallet has enough POL for gas (~0.5 POL)

### "Nonce too low"
- Wait for pending transactions or reset nonce in wallet

### "Contract verification failed"
- Ensure compiler settings match (Solidity 0.8.20, optimizer enabled, viaIR: true)
- Check constructor arguments are correct

## Contract Addresses (Update After Deployment)

| Contract | Address | PolygonScan |
|----------|---------|-------------|
| SENT Token | `0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5` | [View](https://polygonscan.com/token/0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5) |
| SENTStaking | `TBD` | TBD |
| SENTGovernance | `TBD` | TBD |
| SENTVesting | `TBD` | TBD |
| Treasury (Gnosis Safe) | `TBD` | TBD |

---

**Last Updated:** January 18, 2026
