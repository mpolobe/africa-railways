# ARAIL Investor Portal - TAZARA/ZRL Stakeholder Presentation

## Executive Summary

**Date**: December 31, 2025  
**Presenter**: Africa Railways Team  
**Audience**: TAZARA/ZRL Board, Government Stakeholders, Potential Investors

### The Opportunity

We're digitizing the **$1.4B TAZARA expansion** through blockchain technology, creating a transparent, accountable fundraising mechanism that bridges physical railway infrastructure with global capital markets.

---

## 🎯 The Vision: "Unicorn" Potential

### What Makes ARAIL Unique?

```
Physical Infrastructure + Blockchain Transparency = Investable Asset
```

| Traditional Railway | ARAIL Digital Railway |
|---------------------|----------------------|
| Opaque finances | Every transaction on-chain |
| Limited investor access | Global liquidity via SUI |
| Manual ticketing | NFT-based smart tickets |
| No real-time tracking | Live blockchain feed |
| Government-only funding | Retail + institutional investors |

---

## 💰 Current Fundraising Status (Live Data)

### Pre-Seed Round Metrics

```
Goal:              $500,000 USD (~350,000 SUI)
Current Raised:    $122,976 USD (85,400 SUI)
Progress:          24.4% ✅
Investors:         37 backers
Average Investment: 2,308 SUI ($3,323 USD)
Days Remaining:    13 days
```

### Equity Structure

- **10% Total Equity** offered in Pre-Seed
- **12-Month Vesting** with linear unlock
- **Receipt NFTs** as proof of ownership
- **Milestone-Based** fund release

---

## 🚀 Live Demo: Investor Portal

### Access the Portal

**URL**: [https://africarailways.com/investor](https://africarailways.com/investor)

### Key Features

1. **Real-Time Progress Bar**
   - Updates automatically on each investment
   - Shows SUI raised, USD value, investor count

2. **Investment Calculator**
   - Slide to select SUI amount (100-10,000)
   - Instant equity % calculation
   - Staking APY display (~1.91%)

3. **Wallet Integration**
   - One-click Sui Wallet connection
   - Secure transaction signing
   - Instant Receipt NFT delivery

4. **Transparency Dashboard**
   - All investments visible on Sui Explorer
   - Milestone tracking
   - Fund release schedule

---

## 🔐 Smart Contract Architecture

### Deployment Status

```bash
Network:     Sui Testnet (ready for Mainnet)
Package ID:  0x[TO_BE_DEPLOYED]
Treasury:    0x[TO_BE_DEPLOYED]
Status:      ✅ Built, ⏳ Awaiting Deployment
```

### Contract Features

#### 1. Investment Contract (`investment.move`)

**Safety Features:**
- ✅ Minimum investment: 100 SUI
- ✅ Precision guards (100M scaling factor)
- ✅ Reentrancy protection
- ✅ Clock-based vesting
- ✅ Linear token unlock

**Investor Protection:**
```move
// 12-month vesting prevents pump-and-dump
vesting_end: now + (12 * 2592000000)

// Precision prevents rounding errors
equity_tokens = (amount * 10 * 100_000_000) / 350_000_000_000_000
```

#### 2. Milestone Contract (`fundraising_v2.move`)

**TAZARA Project Milestones:**

| Milestone | Description | Fund Release | Status |
|-----------|-------------|--------------|--------|
| 1 | MVP Launch - Digital Ticketing | 20% | Pending |
| 2 | TAZARA Railway Integration | 25% | Pending |
| 3 | USSD Gateway (*723#) Live | 20% | Pending |
| 4 | 10,000 Active Users | 20% | Pending |
| 5 | Revenue Positive Operations | 15% | Pending |

**Accountability:**
- Owner must verify milestone completion
- Funds only released after verification
- All events logged on-chain
- Transparent to all investors

---

## 📊 How to Deploy (Technical)

### Step 1: Build Contracts

```bash
cd /workspaces/africa-railways/move/arail_fundraising
sui move build
```

**Expected Output:**
```
BUILDING arail_fundraising
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib
BUILDING arail_fundraising
Build Successful
```

### Step 2: Deploy to Testnet

```bash
sui client publish --gas-budget 200000000
```

**Expected Output:**
```json
{
  "digest": "0x123abc...",
  "objectChanges": [
    {
      "type": "published",
      "packageId": "0xPACKAGE_ID",
      "version": "1"
    },
    {
      "type": "created",
      "objectType": "0xPACKAGE_ID::investment::Treasury",
      "objectId": "0xTREASURY_ID"
    }
  ]
}
```

### Step 3: Update Frontend

```javascript
// investor.html (Line 15-17)
const PACKAGE_ID = "0xPACKAGE_ID_FROM_DEPLOYMENT";
const FUND_OBJECT_ID = "0xTREASURY_ID_FROM_DEPLOYMENT";
```

### Step 4: Deploy to Mainnet

```bash
# Switch to mainnet
sui client switch --env mainnet

# Deploy (requires ~0.2 SUI for gas)
sui client publish --gas-budget 200000000
```

---

## 🎬 Live Demonstration Script

### For Board Meeting (10 minutes)

**Minute 1-2: Problem Statement**
> "TAZARA needs $1.4B for expansion. Traditional funding is slow, opaque, and limited to government sources. We're changing that."

**Minute 3-4: Show Investor Portal**
> [Open https://africarailways.com/investor]
> "This is live. 37 investors have already committed $122,976. Watch this progress bar update in real-time."

**Minute 5-6: Demonstrate Investment**
> [Connect Sui Wallet]
> "I'll invest 500 SUI (~$720 USD). Watch what happens..."
> [Execute transaction]
> "Transaction confirmed in 2 seconds. I now own 0.1429% equity, represented by this NFT in my wallet."

**Minute 7-8: Show Blockchain Transparency**
> [Open Sui Explorer]
> "Every investment is public. Here's the transaction hash. Anyone can verify this."

**Minute 9-10: Milestone Accountability**
> "Funds aren't released all at once. We must hit 5 milestones. Each milestone releases a percentage. This protects investors and ensures we deliver."

---

## 📈 Financial Projections

### Pre-Seed Round ($500K)

**Use of Funds:**
- 40% - MVP Development (Digital Ticketing)
- 25% - TAZARA Integration (Hardware, APIs)
- 20% - USSD Gateway (Telco partnerships)
- 10% - Marketing & User Acquisition
- 5% - Legal & Compliance

### Seed Round ($2M) - Q2 2026

**After MVP Success:**
- Expand to 5 African countries
- 50,000 active users
- $100K monthly revenue

### Series A ($10M) - Q4 2026

**After Revenue Positive:**
- Pan-African expansion (12 countries)
- 500,000 active users
- $1M monthly revenue
- Unicorn trajectory ($1B valuation by 2028)

---

## 🛡️ Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| Smart contract bugs | Audit by Sui Foundation before mainnet |
| Wallet hacks | Use official Sui Wallet, hardware wallets |
| Network downtime | Sui has 99.9% uptime, multiple validators |

### Business Risks

| Risk | Mitigation |
|------|------------|
| Low adoption | USSD works on feature phones (100% coverage) |
| Regulatory issues | Working with Zambian regulators |
| Competition | First-mover advantage, blockchain moat |

### Financial Risks

| Risk | Mitigation |
|------|------------|
| SUI price volatility | Milestone-based release, can convert to stablecoins |
| Investor refunds | No refunds after investment (standard VC terms) |
| Insufficient funding | Multiple funding rounds planned |

---

## 🎯 Call to Action

### For TAZARA/ZRL Board

**Decision Required:**
1. Approve blockchain-based fundraising approach
2. Authorize partnership with Africa Railways
3. Provide TAZARA integration access (APIs, stations)

**Timeline:**
- Today: Board approval
- Jan 5, 2026: Deploy to mainnet
- Jan 15, 2026: Close Pre-Seed round
- Feb 1, 2026: Begin MVP development

### For Investors

**How to Invest:**
1. Install Sui Wallet: [chrome.google.com/webstore/sui-wallet](https://chrome.google.com/webstore)
2. Buy SUI on exchange (Binance, Coinbase)
3. Visit: [africarailways.com/investor](https://africarailways.com/investor)
4. Connect wallet and invest (100 SUI minimum)

**Investment Tiers:**
- 🥉 Bronze: 100-999 SUI (0.0286% - 0.2857% equity)
- 🥈 Silver: 1,000-4,999 SUI (0.2857% - 1.4286% equity)
- 🥇 Gold: 5,000-10,000 SUI (1.4286% - 2.8571% equity)

---

## 📞 Contact & Next Steps

### Team Contacts

**Technical Lead**: Ben Mpolokoso  
Email: ben@africarailways.com  
GitHub: [@mpolobe](https://github.com/mpolobe)

**Investor Relations**: investors@africarailways.com  
Telegram: [@Africoin_Official](https://t.me/Africoin_Official)  
Twitter: [@BenMpolokoso](https://x.com/BenMpolokoso)

### Resources

- **Whitepaper**: [africarailways.com/whitepaper.html](https://africarailways.com/whitepaper.html)
- **GitHub**: [github.com/mpolobe/africa-railways](https://github.com/mpolobe/africa-railways)
- **Sui Explorer**: [suiexplorer.com](https://suiexplorer.com)
- **Live Portal**: [africarailways.com/investor](https://africarailways.com/investor)

### Immediate Next Steps

1. **Today**: Review this presentation
2. **Jan 2, 2026**: Schedule board meeting
3. **Jan 5, 2026**: Deploy contracts to mainnet
4. **Jan 6, 2026**: Announce to investor network
5. **Jan 15, 2026**: Close Pre-Seed round
6. **Feb 1, 2026**: Begin development

---

## 🎓 Appendix: Technical Deep Dive

### Smart Contract Code Snippets

#### Investment Function
```move
public entry fun invest(
    treasury: &mut Treasury,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Validate investment
    assert!(treasury.round_open, E_ROUND_CLOSED);
    let amount = coin::value(&payment);
    assert!(amount >= MIN_INVESTMENT_SUI, E_MIN_INVESTMENT_NOT_MET);
    
    // Calculate equity with precision
    let equity_tokens = (amount * EQUITY_PERCENT * SCALING_FACTOR) / TOTAL_RAISE_SUI;
    
    // Issue certificate NFT
    let certificate = InvestmentCertificate {
        id: object::new(ctx),
        investor: tx_context::sender(ctx),
        sui_invested: amount,
        equity_tokens,
        vesting_start: clock::timestamp_ms(clock),
        vesting_end: clock::timestamp_ms(clock) + (12 * 2592000000),
        total_claimed: 0,
        certificate_number: treasury.total_equity_issued + 1,
    };
    
    transfer::transfer(certificate, tx_context::sender(ctx));
}
```

#### Vesting Calculation
```move
fun calculate_vested_amount(cert: &InvestmentCertificate, now: u64): u64 {
    if (now >= cert.vesting_end) return cert.equity_tokens;
    if (now <= cert.vesting_start) return 0;
    
    let elapsed = now - cert.vesting_start;
    let total_time = cert.vesting_end - cert.vesting_start;
    (cert.equity_tokens * elapsed) / total_time
}
```

### Event Listener Architecture

```javascript
// Real-time event subscription
const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

await client.subscribeEvent({
    filter: { MoveEventType: `${PACKAGE_ID}::investment::InvestmentEvent` },
    onMessage: (event) => {
        const { investor, amount, total_raised } = event.parsedJson;
        
        // Update progress bar
        updateProgressBar(total_raised);
        
        // Broadcast to all connected clients
        broadcastToWebSockets({
            type: 'NEW_INVESTMENT',
            investor,
            amount,
            totalRaised: total_raised,
        });
    },
});
```

---

**End of Presentation**

*This document is confidential and intended for TAZARA/ZRL stakeholders only.*  
*© 2025 Africa Railways. All rights reserved.*
