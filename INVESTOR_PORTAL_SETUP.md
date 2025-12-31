# ARAIL Investor Portal - Complete Setup Guide

## Overview

The ARAIL Investor Portal is a blockchain-powered fundraising platform built on Sui Network, featuring:

- **$500,000 USD Pre-Seed Round** (~350,000 SUI at $1.44/SUI)
- **10% Equity Distribution** via NFT certificates
- **12-Month Vesting Schedule** with linear unlock
- **Real-Time Updates** via Sui event listeners
- **Milestone-Based Fund Release** for TAZARA project phases

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Investor Portal (React)                   │
│  - Wallet Connection (Sui Wallet, Suiet)                    │
│  - Investment Calculator                                     │
│  - Real-Time Progress Bar                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Sui Blockchain (Mainnet)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Smart Contracts (Move)                              │   │
│  │  - investment.move (Vesting + Safety Rails)         │   │
│  │  - fundraising_v2.move (Milestone-Based Release)    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Event Listener Service (Node.js)                │
│  - Monitors InvestEvent, MilestoneVerifiedEvent             │
│  - Updates fund-updates.json for frontend polling           │
│  - WebSocket/SSE for real-time updates                      │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Deploy Smart Contracts

```bash
cd /workspaces/africa-railways/move/arail_fundraising

# Build contracts
sui move build

# Deploy to testnet
./deploy.sh testnet

# Save the output:
# - PACKAGE_ID
# - TREASURY_OBJECT_ID (for investment.move)
# - FUND_OBJECT_ID (for fundraising_v2.move)
```

### 2. Configure Frontend

Update `/workspaces/africa-railways/investor.html`:

```javascript
// Line ~15-17
const PACKAGE_ID = "0xYOUR_PACKAGE_ID_HERE";
const FUND_OBJECT_ID = "0xYOUR_FUND_OBJECT_ID_HERE";
```

### 3. Start Event Listener

```bash
cd /workspaces/africa-railways

# Install dependencies
npm install @mysten/sui.js

# Set environment variables
export SUI_NETWORK=testnet
export PACKAGE_ID=0xYOUR_PACKAGE_ID
export FUND_OBJECT_ID=0xYOUR_FUND_OBJECT_ID

# Run listener
node scripts/sui-event-listener.js
```

### 4. Test the Portal

```bash
# Start local server
python3 -m http.server 8000

# Open browser
open http://localhost:8000/investor.html
```

## Smart Contract Comparison

### Option 1: `investment.move` (Recommended for Production)

**Features:**
- ✅ Linear vesting over 12 months
- ✅ Precision guards (SCALING_FACTOR = 100,000,000)
- ✅ Reentrancy protection
- ✅ Clock-based timestamps
- ✅ Claimable equity tokens
- ✅ Admin fund withdrawal

**Best For:** Production deployment with investor protection

**Usage:**
```bash
# Invest
sui client call \
  --package $PACKAGE_ID \
  --module investment \
  --function invest \
  --args $TREASURY_ID $COIN_ID $CLOCK_ID \
  --gas-budget 10000000

# Claim vested tokens (after time passes)
sui client call \
  --package $PACKAGE_ID \
  --module investment \
  --function claim_tokens \
  --args $CERTIFICATE_ID $CLOCK_ID \
  --gas-budget 10000000
```

### Option 2: `fundraising_v2.move` (Milestone-Based)

**Features:**
- ✅ 5 TAZARA project milestones
- ✅ Milestone verification by owner
- ✅ Percentage-based fund release
- ✅ Transparent milestone tracking
- ✅ Emergency withdrawal

**Best For:** Demonstrating project accountability to investors

**Milestones:**
1. MVP Launch (20%)
2. TAZARA Integration (25%)
3. USSD Gateway Live (20%)
4. 10,000 Active Users (20%)
5. Revenue Positive (15%)

**Usage:**
```bash
# Verify milestone
sui client call \
  --package $PACKAGE_ID \
  --module fundraising_v2 \
  --function verify_milestone \
  --args $FUND_ID 1 \
  --gas-budget 10000000

# Release milestone funds
sui client call \
  --package $PACKAGE_ID \
  --module fundraising_v2 \
  --function release_milestone_funds \
  --args $FUND_ID 1 \
  --gas-budget 10000000
```

## Real-Time Updates Implementation

### Method 1: Polling (Simple)

Frontend polls `fund-updates.json` every 5 seconds:

```javascript
async function pollFundUpdates() {
  const response = await fetch('/fund-updates.json');
  const data = await response.json();
  
  updateProgressBar(data.raised, data.target);
  updateInvestorCount(data.investorCount);
}

setInterval(pollFundUpdates, 5000);
```

### Method 2: WebSocket (Real-Time)

Event listener broadcasts via WebSocket:

```javascript
// Server (Node.js)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify(fundState));
});

// Broadcast on new investment
function broadcastUpdate(update) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(update));
    }
  });
}

// Client (React)
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  setFundState(data);
};
```

### Method 3: Server-Sent Events (SSE)

```javascript
// Server
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const sendUpdate = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  eventEmitter.on('investment', sendUpdate);
});

// Client
const eventSource = new EventSource('/events');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateUI(data);
};
```

## Testing Checklist

### Testnet Testing

- [ ] Deploy contracts to testnet
- [ ] Connect Sui Wallet to testnet
- [ ] Get testnet SUI from faucet
- [ ] Make test investment (100 SUI minimum)
- [ ] Verify Receipt NFT received
- [ ] Check event listener logs
- [ ] Verify progress bar updates
- [ ] Test vesting claim (if using investment.move)
- [ ] Test milestone verification (if using fundraising_v2.move)

### Mainnet Preparation

- [ ] Audit smart contracts
- [ ] Test with multiple investors
- [ ] Verify gas costs
- [ ] Set up monitoring/alerts
- [ ] Prepare investor communications
- [ ] Legal compliance review
- [ ] Deploy to mainnet
- [ ] Announce to investors

## Security Considerations

### Smart Contract Security

1. **Reentrancy Protection**: State updates before external calls
2. **Integer Overflow**: Sui Move has built-in overflow protection
3. **Access Control**: Admin-only functions properly gated
4. **Precision Loss**: SCALING_FACTOR prevents rounding errors
5. **Clock Manipulation**: Uses Sui's immutable Clock object

### Frontend Security

1. **Wallet Connection**: Use official Sui Wallet adapters
2. **Transaction Validation**: Verify amounts before signing
3. **HTTPS Only**: Deploy portal with SSL certificate
4. **Input Sanitization**: Validate all user inputs
5. **Rate Limiting**: Prevent spam investments

## Monitoring & Analytics

### Key Metrics to Track

```javascript
{
  "totalRaised": 85400000000000,      // MIST
  "totalRaisedSUI": 85400,            // SUI
  "totalRaisedUSD": 122976,           // USD at $1.44/SUI
  "investorCount": 37,
  "averageInvestment": 2308.11,       // SUI
  "progressPercentage": 24.4,
  "daysRemaining": 13,
  "investmentsToday": 5,
  "lastInvestment": {
    "investor": "0x72...f3",
    "amount": 500,
    "timestamp": 1735689600000
  }
}
```

### Dashboard Queries

```bash
# Get current fund state
sui client object $FUND_OBJECT_ID

# Query all investments
sui client events \
  --module investment \
  --event-type InvestmentEvent \
  --limit 100

# Get specific investor's certificate
sui client objects --owner $INVESTOR_ADDRESS
```

## Troubleshooting

### Common Issues

**Issue: Wallet won't connect**
```
Solution: Ensure Sui Wallet extension is installed and on correct network
```

**Issue: Transaction fails with "Insufficient gas"**
```
Solution: Increase gas budget to 10000000 MIST
```

**Issue: Investment below minimum**
```
Solution: Minimum investment is 100 SUI (100000000000 MIST)
```

**Issue: Event listener not receiving events**
```
Solution: Verify PACKAGE_ID and FUND_OBJECT_ID are correct
```

**Issue: Progress bar not updating**
```
Solution: Check event listener is running and writing to fund-updates.json
```

## Production Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add SUI_NETWORK production
vercel env add PACKAGE_ID production
vercel env add FUND_OBJECT_ID production
```

### Railway Deployment (Event Listener)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up

# Set environment variables
railway variables set SUI_NETWORK=mainnet
railway variables set PACKAGE_ID=0x...
railway variables set FUND_OBJECT_ID=0x...
```

## Support & Resources

- **Documentation**: https://docs.sui.io
- **Sui Explorer**: https://suiexplorer.com
- **Wallet**: https://chrome.google.com/webstore/detail/sui-wallet
- **Faucet**: https://discord.gg/sui (testnet)
- **ARAIL Support**: investors@africarailways.com

## Next Steps

1. ✅ Deploy smart contracts to testnet
2. ✅ Test investment flow end-to-end
3. ✅ Set up event listener service
4. ✅ Integrate real-time updates
5. ⏳ Audit smart contracts
6. ⏳ Deploy to mainnet
7. ⏳ Launch investor portal
8. ⏳ Monitor and support investors

---

**Last Updated**: December 31, 2025  
**Version**: 1.0.0  
**Network**: Sui Mainnet  
**Status**: Ready for Deployment
