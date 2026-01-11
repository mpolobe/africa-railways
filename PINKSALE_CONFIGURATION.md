# $SENT PinkSale Configuration
## Complete Launchpad Setup for Polygon Network

**Last Updated**: January 11, 2026  
**Network**: Polygon (POL)  
**Contract**: 0xD267554628E954E2070D189859f13768B0424694

---

## 1. Core Token Specifications

```json
{
  "tokenName": "Sentinel",
  "tokenSymbol": "$SENT",
  "network": "Polygon",
  "contractAddress": "0xD267554628E954E2070D189859f13768B0424694",
  "standard": "ERC-20",
  "totalSupply": "5,000,000,000",
  "decimals": 18,
  "verified": true
}
```

### Contract Verification
- **PolygonScan**: [https://polygonscan.com/token/0xD267554628E954E2070D189859f13768B0424694](https://polygonscan.com/token/0xD267554628E954E2070D189859f13768B0424694)
- **Source Code**: Verified ✅
- **Audit Status**: Pending (submit to CertiK/Hacken before launch)

---

## 2. Token Distribution (5B Total Supply)

### Allocation Breakdown

| Category | Percentage | Amount (SENT) | Vesting Schedule | Unlock at TGE |
|----------|-----------|---------------|------------------|---------------|
| **PinkSale IDO** | 20% | 1,000,000,000 | 10% TGE, 90% linear over 12 months | 100,000,000 |
| **Community & Sentinels** | 30% | 1,500,000,000 | 36 months linear, 6-month cliff | 0 |
| **Team & Advisors** | 15% | 750,000,000 | 24 months linear, 6-month cliff | 0 |
| **Treasury** | 20% | 1,000,000,000 | Unlocked for operations | 1,000,000,000 |
| **Ecosystem Fund** | 10% | 500,000,000 | 48 months linear | 0 |
| **Liquidity (DEX)** | 5% | 250,000,000 | Unlocked for QuickSwap/Uniswap | 250,000,000 |
| **TOTAL** | **100%** | **5,000,000,000** | - | **1,350,000,000** |

### Circulating Supply at Launch
- **TGE Unlock**: 1,350,000,000 SENT (27%)
- **Month 1**: 1,425,000,000 SENT (28.5%)
- **Month 6**: 1,800,000,000 SENT (36%)
- **Month 12**: 2,475,000,000 SENT (49.5%)
- **Month 24**: 3,600,000,000 SENT (72%)
- **Month 48**: 5,000,000,000 SENT (100%)

---

## 3. PinkSale Launchpad Parameters

### Sale Configuration

```json
{
  "saleType": "Fair Launch",
  "network": "Polygon",
  "tokenAddress": "0xD267554628E954E2070D189859f13768B0424694",
  "currency": "POL (Polygon)",
  "presaleRate": "20,000 SENT per 1 POL",
  "listingRate": "18,000 SENT per 1 POL",
  "softCap": "25,000 POL",
  "hardCap": "50,000 POL",
  "minBuy": "100 POL",
  "maxBuy": "5,000 POL",
  "liquidityPercent": "60%",
  "liquidityLockup": "365 days",
  "startTime": "TBD",
  "endTime": "TBD (72 hours after start)"
}
```

### Pricing Breakdown

**At Current POL Price ($0.50)**:
- 1 POL = 20,000 SENT
- 1 SENT = $0.000025 (IDO price)
- Min investment: 100 POL = $50 = 2,000,000 SENT
- Max investment: 5,000 POL = $2,500 = 100,000,000 SENT

**Raise Targets**:
- Soft Cap: 25,000 POL = $12,500
- Hard Cap: 50,000 POL = $25,000
- Tokens for Sale: 1,000,000,000 SENT (20% of supply)

**Listing Price**:
- DEX Rate: 18,000 SENT per POL
- 10% premium over presale rate (anti-dump mechanism)
- Initial Market Cap: ~$125,000 (at hard cap)

### Liquidity Setup

```
Hard Cap Raised: 50,000 POL
Liquidity Allocation: 60% = 30,000 POL
Tokens for Liquidity: 540,000,000 SENT (18,000 rate)
Initial LP Value: $30,000 POL + $13,500 SENT = $43,500
Lockup Period: 365 days
```

---

## 4. Vesting Schedules (Detailed)

### PinkSale IDO Investors (1,000,000,000 SENT)

| Month | Unlock % | Tokens Unlocked | Cumulative |
|-------|----------|-----------------|------------|
| TGE | 10% | 100,000,000 | 100,000,000 |
| 1 | 7.5% | 75,000,000 | 175,000,000 |
| 2 | 7.5% | 75,000,000 | 250,000,000 |
| 3 | 7.5% | 75,000,000 | 325,000,000 |
| 4 | 7.5% | 75,000,000 | 400,000,000 |
| 5 | 7.5% | 75,000,000 | 475,000,000 |
| 6 | 7.5% | 75,000,000 | 550,000,000 |
| 7 | 7.5% | 75,000,000 | 625,000,000 |
| 8 | 7.5% | 75,000,000 | 700,000,000 |
| 9 | 7.5% | 75,000,000 | 775,000,000 |
| 10 | 7.5% | 75,000,000 | 850,000,000 |
| 11 | 7.5% | 75,000,000 | 925,000,000 |
| 12 | 7.5% | 75,000,000 | 1,000,000,000 |

### Community & Sentinels (1,500,000,000 SENT)

- **Cliff**: 6 months (no tokens released)
- **Vesting**: 36 months linear after cliff
- **Monthly Release**: 41,666,667 SENT (starting month 7)
- **Purpose**: Rewards for 2,000+ track workers, staking incentives

### Team & Advisors (750,000,000 SENT)

- **Cliff**: 6 months
- **Vesting**: 24 months linear after cliff
- **Monthly Release**: 31,250,000 SENT (starting month 7)
- **Purpose**: Long-term alignment, prevent early dumps

### Ecosystem Fund (500,000,000 SENT)

- **Cliff**: None
- **Vesting**: 48 months linear
- **Monthly Release**: 10,416,667 SENT
- **Purpose**: Partnerships, grants, railway integrations

---

## 5. PinkSale Form Inputs

### Step 1: Token Information

```
Token Address: 0xD267554628E954E2070D189859f13768B0424694
Currency: POL
Fee Options: 5% POL raised + 2% token sold
```

### Step 2: Presale Information

```
Presale Rate: 20000
Whitelist: Enabled
Soft Cap: 25000
Hard Cap: 50000
Minimum Buy: 100
Maximum Buy: 5000
Liquidity (%): 60
Listing Rate: 18000
Start Time: [Select date/time]
End Time: [Select date/time]
Liquidity Lockup: 365 days
```

### Step 3: Project Information

```
Logo URL: https://africa-railways.vercel.app/sent-logo.png
Website: https://africa-railways.vercel.app
Facebook: https://facebook.com/africarailways
Twitter: https://twitter.com/AfricaRailways
GitHub: https://github.com/mpolobe/africa-railways
Telegram: https://t.me/AfricoinCommunity
Instagram: https://instagram.com/africarailways
Discord: https://discord.gg/africarailways
Reddit: https://reddit.com/r/africarailways
Description: Africa Railways is building the digital payment infrastructure for Africa's railway system. $SENT is the equity token capturing value from AFC transactions across 54 countries.
```

### Step 4: Vesting

```
Enable Vesting: Yes
First Release (%): 10
Vesting Period (days): 30
Release Each Cycle (%): 7.5
```

---

## 6. Smart Contract Preparation

### Required Token Approvals

Before creating the PinkSale launchpad, approve token transfers:

```solidity
// Approve PinkSale Router to spend tokens
approve(
  spender: 0x[PinkSale_Router_Address],
  amount: 1,000,000,000 * 10^18  // 1B SENT for sale
)

// Approve PinkSale Locker for liquidity
approve(
  spender: 0x[PinkSale_Locker_Address],
  amount: 540,000,000 * 10^18  // 540M SENT for liquidity
)
```

### Token Deposit Calculation

```
Tokens for Presale: 1,000,000,000 SENT
Tokens for Liquidity: 540,000,000 SENT (at 18,000 rate)
PinkSale Fee (2%): 20,000,000 SENT
Total to Deposit: 1,560,000,000 SENT
```

**Action**: Transfer 1,560,000,000 SENT to your wallet before creating launchpad.

---

## 7. Marketing Materials Checklist

### Required for PinkSale Approval

- [x] Token contract deployed and verified
- [ ] Logo (512x512px PNG with transparent background)
- [ ] Banner (1200x600px for PinkSale listing)
- [ ] Whitepaper/Litepaper (PDF, max 10MB)
- [ ] Pitch Deck (PDF, 10-15 slides)
- [ ] Team KYC (submit to PinkSale)
- [ ] Audit Report (CertiK, Hacken, or similar)

### Social Media Requirements

| Platform | Requirement | Current Status |
|----------|-------------|----------------|
| Twitter | 3,000+ followers, active posts | ⚠️ Need to create/grow |
| Telegram | 5,000+ members, daily activity | ⚠️ Need to create/grow |
| Website | Professional, live, detailed | ✅ africa-railways.vercel.app |
| GitHub | Active commits, real code | ✅ github.com/mpolobe/africa-railways |
| Medium | 3+ articles published | ⚠️ Need to create |
| YouTube | 1+ explainer video | ⚠️ Need to create |

---

## 8. Financial Projections

### Scenario Analysis

#### Conservative (Soft Cap: 25,000 POL)

```
Raised: $12,500
Tokens Sold: 500,000,000 SENT
Liquidity: $7,500 (60%)
Team Receives: $5,000 (40%)
Initial Market Cap: $62,500
FDV: $125,000
```

#### Base (Hard Cap: 50,000 POL)

```
Raised: $25,000
Tokens Sold: 1,000,000,000 SENT
Liquidity: $15,000 (60%)
Team Receives: $10,000 (40%)
Initial Market Cap: $125,000
FDV: $125,000
```

### Post-Launch Price Targets

| Milestone | Market Cap | Price per SENT | ROI from IDO |
|-----------|-----------|----------------|--------------|
| Launch | $125K | $0.000025 | 1x |
| 1 Month | $250K | $0.00005 | 2x |
| 3 Months | $500K | $0.0001 | 4x |
| 6 Months | $1M | $0.0002 | 8x |
| 12 Months | $5M | $0.001 | 40x |
| 24 Months | $25M | $0.005 | 200x |

*Projections based on platform growth and comparable projects*

---

## 9. Risk Management

### Anti-Dump Mechanisms

1. **Vesting**: 90% of IDO tokens locked for 12 months
2. **Team Cliff**: 6-month cliff before any team tokens unlock
3. **Liquidity Lock**: 365 days on QuickSwap/Uniswap
4. **Listing Premium**: 10% higher DEX price than presale
5. **Max Buy**: 5,000 POL limit prevents whales

### Security Measures

- [ ] Smart contract audit by CertiK or Hacken
- [ ] Team KYC with PinkSale
- [ ] Multi-sig treasury (3-of-5)
- [ ] Bug bounty program ($10K)
- [ ] Regular security reviews

---

## 10. Post-Launch Roadmap

### Week 1: Immediate Actions
- List on CoinGecko and CoinMarketCap
- Activate staking portal
- Begin community rewards program
- Launch marketing campaign

### Month 1: Growth Phase
- Integrate 2nd railway (Tanzania Railways)
- Release mobile apps (iOS/Android)
- Reach 10,000 active users
- $100K monthly transaction volume

### Month 3: Expansion
- Add 3rd and 4th railways
- Launch freight payment system
- 50,000 active users
- $500K monthly volume

### Month 6: Scaling
- 5+ railways integrated
- Cross-border ticketing live
- 200,000 active users
- $2M monthly volume

### Month 12: Continental
- 10+ African countries
- 1M+ active users
- $10M+ monthly volume
- Institutional partnerships

---

## 11. Compliance and Legal

### Regulatory Considerations

**Token Classification**: Utility Token
- Provides governance rights
- Grants access to platform services
- Enables staking for rewards
- NOT marketed as investment/security

**Restricted Jurisdictions**:
- United States (unless accredited investor)
- China
- North Korea
- Iran
- Syria
- Any OFAC-sanctioned countries

**KYC/AML**:
- Required for investments >$1,000
- Provided by PinkSale's partner (Blockpass/Fractal)
- Stored securely, GDPR-compliant

### Legal Documents

- [ ] Terms of Service (updated for $SENT)
- [ ] Privacy Policy (GDPR-compliant)
- [ ] Token Purchase Agreement
- [ ] Risk Disclosure Statement
- [ ] Whitelist Terms and Conditions

---

## 12. Community Incentives

### Whitelist Tiers

| Tier | Investment | Bonus | Total SENT |
|------|-----------|-------|------------|
| Bronze | 100-500 POL | 5% | 2.1M - 10.5M |
| Silver | 500-2,000 POL | 10% | 11M - 44M |
| Gold | 2,000-5,000 POL | 15% | 46M - 115M |

### Referral Program

```
Refer a friend who invests:
- You get: 2% of their investment in SENT
- They get: 2% bonus SENT
- Max referrals: 10 per person
```

### Early Bird Bonus

```
First 24 hours: 5% bonus
First 48 hours: 3% bonus
After 48 hours: No bonus
```

---

## 13. Technical Integration

### Wallet Support

**Recommended Wallets**:
- MetaMask (most popular)
- Trust Wallet
- Coinbase Wallet
- WalletConnect (mobile)

**Network Configuration**:
```json
{
  "chainId": 137,
  "chainName": "Polygon Mainnet",
  "rpcUrls": ["https://polygon-rpc.com"],
  "nativeCurrency": {
    "name": "POL",
    "symbol": "POL",
    "decimals": 18
  },
  "blockExplorerUrls": ["https://polygonscan.com"]
}
```

### DEX Listing

**Primary DEX**: QuickSwap (Polygon's largest DEX)
- Pair: SENT/POL
- Initial Liquidity: $15,000
- Lockup: 365 days
- Fee Tier: 0.3%

**Secondary DEX**: Uniswap V3 (Polygon)
- Pair: SENT/USDC
- Liquidity: $5,000 (from treasury)
- Fee Tier: 0.3%

---

## 14. Success Metrics

### Pre-Launch KPIs (Target by Launch Day)

- [ ] Twitter: 3,000+ followers
- [ ] Telegram: 5,000+ members
- [ ] Whitelist: 1,000+ registrations
- [ ] Website: 20,000+ unique visitors
- [ ] Medium: 5+ articles, 2,000+ views
- [ ] YouTube: 1 video, 5,000+ views

### Launch Day KPIs

- [ ] Soft cap reached: Within 12 hours
- [ ] Hard cap reached: Within 48 hours
- [ ] Unique participants: 200+
- [ ] Average investment: 250 POL
- [ ] Telegram activity: 500+ messages/hour

### Post-Launch KPIs (Month 1)

- [ ] CoinGecko listing: Within 7 days
- [ ] CoinMarketCap listing: Within 14 days
- [ ] Holders: 1,000+
- [ ] Daily volume: $10,000+
- [ ] Price stability: Within 30% of launch

---

## 15. Emergency Procedures

### If Soft Cap Not Reached

- All POL automatically refunded to participants
- No tokens distributed
- Regroup and relaunch with adjusted parameters

### If Smart Contract Issue Discovered

- Pause presale immediately
- Notify PinkSale team
- Communicate transparently with community
- Fix issue and re-audit
- Resume or refund based on severity

### If Market Crash During Sale

- Continue sale as planned (long-term project)
- Communicate value proposition
- Emphasize working product and real revenue
- Offer extended vesting for stability

---

## 16. Contact and Support

### PinkSale Support

- Website: https://www.pinksale.finance
- Telegram: @PinkSaleFinance
- Email: support@pinksale.finance
- Documentation: https://docs.pinksale.finance

### Africa Railways Team

- Website: https://africa-railways.vercel.app
- Email: contact@africarailways.com
- Telegram: @AfricoinCommunity
- Twitter: @AfricaRailways
- GitHub: github.com/mpolobe/africa-railways

---

## Appendix: PinkSale Fee Structure

### Platform Fees

```
POL Fee: 5% of total raised
Token Fee: 2% of tokens sold
Listing Fee: 0 (included in above)
```

**Example at Hard Cap**:
```
Total Raised: 50,000 POL
POL Fee: 2,500 POL (5%)
Net to Project: 47,500 POL

Tokens Sold: 1,000,000,000 SENT
Token Fee: 20,000,000 SENT (2%)
Net to Investors: 980,000,000 SENT
```

---

## Final Checklist Before Launch

### Technical
- [ ] Token contract deployed: 0xD267554628E954E2070D189859f13768B0424694
- [ ] Contract verified on PolygonScan
- [ ] 1,560,000,000 SENT in wallet for deposit
- [ ] Audit completed and published
- [ ] Multi-sig treasury set up

### Marketing
- [ ] Website updated with PinkSale page
- [ ] Litepaper PDF published
- [ ] Pitch deck PDF published
- [ ] All social media accounts active
- [ ] Influencer partnerships confirmed

### Legal
- [ ] Terms of Service updated
- [ ] Privacy Policy updated
- [ ] Token Purchase Agreement drafted
- [ ] Risk disclosures added
- [ ] Restricted jurisdictions list finalized

### Community
- [ ] Telegram group at 5,000+ members
- [ ] Twitter at 3,000+ followers
- [ ] Whitelist at 1,000+ registrations
- [ ] AMA scheduled for launch day
- [ ] Moderators trained and ready

---

**Document Status**: Ready for PinkSale Submission  
**Next Action**: Complete social media growth (7-14 days)  
**Launch Target**: February 2026

---

© 2026 Africa Railways. All rights reserved.
