# ARAIL Suistart Launchpad Integration Guide

## Overview

Suistart is Sui's premier IDO (Initial DEX Offering) platform, providing institutional-grade infrastructure for token launches. This guide walks through launching ARAIL's $SENT token on Suistart.

## Why Suistart?

### Advantages Over Manual Fundraising

1. **Institutional Credibility**: Suistart's due diligence process validates your project
2. **Immediate Liquidity**: Automatic DeepBook V3 integration
3. **Compliance**: Built-in KYC/AML for regulatory compliance
4. **Smart Contract Security**: Audited launchpad contracts
5. **Marketing Reach**: Access to Sui's investor community
6. **Vesting Automation**: Handles token distribution and vesting

### Market Context (December 31, 2025)

- **zkLogin Standard**: Users book tickets with Google/Apple IDs (blockchain invisible)
- **DeepBook V3 Active**: High liquidity for $SENT on Zambian/Tanzanian markets
- **Sui Maturity**: 866 TPS proven, $5.4B market cap
- **Institutional Interest**: Bitwise Spot SUI ETF filed today

---

## Step 1: Prepare Your Application

### Required Materials

#### 1. Project Information

```json
{
  "projectName": "ARAIL (Africa's Digital Railway)",
  "tokenTicker": "$SENT",
  "tokenName": "Sentinel",
  "blockchain": "Sui",
  "category": "Infrastructure / Real World Assets",
  "website": "https://africarailways.com",
  "whitepaper": "https://africarailways.com/whitepaper.html",
  "pitchDeck": "https://africarailways.com/pitch-deck.html"
}
```

#### 2. Fundraising Details

```json
{
  "fundraisingGoal": "350,000 SUI",
  "usdValue": "$500,000",
  "preSeedValuation": "$5,000,000",
  "equityOffered": "10%",
  "minInvestment": "100 SUI",
  "maxInvestment": "10,000 SUI",
  "vestingSchedule": "12 months linear",
  "cliff": "None"
}
```

#### 3. Token Economics

```json
{
  "totalSupply": "10,000,000,000 SENT",
  "preSeedAllocation": "10%",
  "teamAllocation": "20%",
  "communityAllocation": "30%",
  "treasuryAllocation": "25%",
  "liquidityAllocation": "15%",
  "teamVesting": "24 months with 6-month cliff",
  "utilityType": "Governance + Staking + Payment"
}
```

#### 4. Smart Contract Addresses

```bash
# After deployment to Sui Mainnet
PACKAGE_ID="0xYOUR_PACKAGE_ID"
TREASURY_ID="0xYOUR_TREASURY_ID"
FUND_ID="0xYOUR_FUND_ID"
```

#### 5. Team Information

```json
{
  "founder": {
    "name": "Ben Mpolokoso",
    "role": "Founder & CEO",
    "linkedin": "https://linkedin.com/in/benmpolokoso",
    "twitter": "https://x.com/BenMpolokoso",
    "background": "Former railway engineer, blockchain developer, Zambian native"
  },
  "advisors": [
    {
      "name": "TAZARA Veterans",
      "role": "Railway Operations Advisors"
    },
    {
      "name": "Sui Foundation",
      "role": "Technical Advisors"
    }
  ]
}
```

---

## Step 2: Submit Official Application

### Application Portal

**URL**: https://suistart.com/apply (or equivalent)

### Application Form Fields

1. **Basic Information**
   - Project Name: ARAIL
   - Token Ticker: $SENT
   - Website: https://africarailways.com
   - Email: investors@africarailways.com

2. **Project Description** (500 words max)
   ```
   ARAIL is digitizing Africa's $50B railway infrastructure through blockchain technology. 
   We've built a working USSD-based booking system (*723#) that works on any phone, 
   integrated with Sui blockchain for transparent, instant payments.

   Our MVP has 500+ test users with 95% satisfaction. We're partnering with TAZARA 
   (Tanzania-Zambia Railway Authority) to modernize the $1.4B expansion project.

   Key Differentiators:
   - USSD Native: Works on feature phones (100% coverage)
   - zkLogin Integration: Users book with Google/Apple IDs
   - Treasury Auto-Staking: 1.91% APY funds operations
   - Milestone-Based Release: Funds unlock only when verified milestones hit
   - Real Traction: Live MVP, government partnerships, 37 pre-seed investors

   We're raising $500K at a $5M valuation to launch mainnet, integrate TAZARA, 
   and scale to 10,000 users by Q2 2026.
   ```

3. **Traction Metrics**
   - MVP Status: Live on testnet
   - Users: 500+ test users
   - Revenue: Pre-revenue (launching Q1 2026)
   - Partnerships: TAZARA integration in progress
   - Current Raise: 85,400 SUI (24.4% of goal)
   - Investors: 37 pre-seed backers

4. **Use of Funds**
   - 40% - MVP Development & Mainnet Launch
   - 25% - TAZARA Integration (Hardware, APIs)
   - 20% - USSD Gateway (Telco partnerships)
   - 10% - Marketing & User Acquisition
   - 5% - Legal & Compliance

5. **Social Media**
   - Twitter: @BenMpolokoso
   - Telegram: @Africoin_Official
   - GitHub: github.com/mpolobe/africa-railways

---

## Step 3: Due Diligence & KYC

### Founder KYC Requirements

Suistart requires identity verification for all founders and key team members.

**Documents Needed:**
- Government-issued ID (Passport or National ID)
- Proof of Address (Utility bill, bank statement)
- Selfie with ID
- Video verification call

**KYC Provider**: Likely Sumsub or Onfido

**Timeline**: 3-5 business days

### Legal Entity Documentation

**Required:**
1. Certificate of Incorporation (Zambia or Tanzania)
2. Business Registration Number
3. Tax Identification Number
4. Proof of Business Address
5. Shareholder Registry
6. Board Resolution authorizing token sale

**If Not Yet Incorporated:**
- Consider incorporating in Zambia (where TAZARA operates)
- Alternative: Cayman Islands or BVI for crypto-friendly jurisdiction
- Timeline: 2-4 weeks

### Project Review

**Sui Council Review Criteria:**

1. **Technical Viability**
   - Smart contracts audited
   - MVP functional and accessible
   - Blockchain integration sound

2. **Real-World Utility**
   - Solves genuine problem
   - Target market validated
   - Partnerships confirmed

3. **Team Credibility**
   - Relevant experience
   - Full-time commitment
   - Advisors credible

4. **Tokenomics**
   - Fair distribution
   - Clear utility
   - Sustainable model

**Prepare:**
- Live demo of USSD system (*723#)
- Smart contract code walkthrough
- TAZARA partnership documentation
- User testimonials/feedback

**Timeline**: 1-2 weeks for review

---

## Step 4: Configure Liquidity Pool

### Suistart Dashboard Setup

Once approved, you'll access the Suistart project dashboard.

### Pool Configuration

#### 1. Whitelist Phase (Visionary Round)

```json
{
  "phase": "Whitelist",
  "allocation": "85,400 SUI",
  "participants": 37,
  "duration": "48 hours",
  "minInvestment": "100 SUI",
  "maxInvestment": "10,000 SUI",
  "access": "Invite-only (existing investors)"
}
```

**Whitelist Addresses:**
- Upload CSV of 37 existing investor addresses
- They get priority access before public sale

#### 2. Public Phase

```json
{
  "phase": "Public",
  "allocation": "264,600 SUI",
  "participants": "Open to all",
  "duration": "7 days or until sold out",
  "minInvestment": "100 SUI",
  "maxInvestment": "5,000 SUI",
  "access": "First-come, first-served"
}
```

#### 3. Swap Ratio

```javascript
// Calculate token price
const suiPrice = 1.44; // USD
const preSeedValuation = 5000000; // USD
const equityOffered = 0.10; // 10%
const totalSupply = 10000000000; // 10B SENT

const tokensForSale = totalSupply * equityOffered; // 1B SENT
const fundraiseGoal = 350000; // SUI

const tokensPerSui = tokensForSale / fundraiseGoal;
// = 1,000,000,000 / 350,000
// = 2,857 SENT per SUI

console.log(`Swap Ratio: 1 SUI = ${tokensPerSui.toLocaleString()} SENT`);
```

**Set in Dashboard:**
- Swap Ratio: 1 SUI = 2,857 SENT
- Token Price: $0.000504 per SENT
- FDV (Fully Diluted Valuation): $5.04M

#### 4. Vesting Configuration

```json
{
  "vestingType": "Linear",
  "duration": "12 months",
  "cliff": "0 months",
  "releaseFrequency": "Continuous (per-block)",
  "claimable": "Anytime via dashboard"
}
```

**Link to Smart Contract:**
- Contract Address: `PACKAGE_ID::investment`
- Vesting Function: `claim_tokens`
- Certificate NFT: Automatically issued

---

## Step 5: Launch & Liquidity Injection

### Pre-Launch Checklist

**1 Week Before:**
- [ ] Smart contracts deployed to mainnet
- [ ] Contracts audited by reputable firm
- [ ] Whitelist addresses uploaded
- [ ] Marketing campaign started
- [ ] AMA scheduled with Sui community
- [ ] Press release drafted

**24 Hours Before:**
- [ ] Final contract verification
- [ ] Test transactions on testnet
- [ ] Backup plan for technical issues
- [ ] Team on standby for support

### Launch Day Timeline

**T-0 (Launch Moment)**

1. **Token Generation Event (TGE)**
   ```bash
   # Suistart triggers your init function
   sui client call \
     --package $PACKAGE_ID \
     --module investment \
     --function init \
     --gas-budget 100000000
   ```

2. **Whitelist Phase Opens**
   - 37 existing investors can invest
   - 48-hour window
   - Real-time progress bar on Suistart

3. **Fund Collection**
   ```move
   // SUI flows into Treasury object
   public entry fun invest(
       treasury: &mut Treasury,
       payment: Coin<SUI>,
       clock: &Clock,
       ctx: &mut TxContext
   )
   ```

4. **Certificate NFT Issuance**
   ```move
   // InvestmentCertificate NFT sent to investor wallet
   let certificate = InvestmentCertificate {
       id: object::new(ctx),
       investor: tx_context::sender(ctx),
       sui_invested: amount,
       equity_tokens: calculated_tokens,
       vesting_start: now,
       vesting_end: now + 12_months,
       ...
   };
   transfer::transfer(certificate, investor);
   ```

**T+48 Hours (Public Phase)**

5. **Public Sale Opens**
   - Remaining allocation available
   - 7-day window or until sold out
   - Marketing push to Sui community

**T+7 Days (Sale Closes)**

6. **DeepBook Integration**
   ```bash
   # Suistart lists $SENT on DeepBook V3
   # Provides immediate liquidity
   
   # Initial liquidity pool
   SENT/SUI pair
   Initial price: 2,857 SENT per SUI
   Liquidity depth: 10% of raise (35,000 SUI)
   ```

7. **Trading Begins**
   - $SENT tradable on DeepBook
   - Investors can buy/sell (subject to vesting)
   - Price discovery begins

### Post-Launch

**Week 1:**
- Monitor trading volume
- Engage with community
- Address any technical issues
- Begin milestone work

**Month 1:**
- First vesting unlock (8.33%)
- Investors can claim tokens
- Update on MVP progress
- Prepare for TAZARA integration

---

## Integration with Existing Infrastructure

### Linking Suistart to Your Portal

Update your investor portal to show Suistart status:

```javascript
// investor.html
const SUISTART_POOL_ID = "0xYOUR_SUISTART_POOL_ID";

async function checkSuistartStatus() {
    const response = await fetch(`https://api.suistart.com/pools/${SUISTART_POOL_ID}`);
    const data = await response.json();
    
    return {
        raised: data.totalRaised,
        participants: data.participantCount,
        status: data.status, // 'whitelist', 'public', 'closed'
        timeRemaining: data.endTime - Date.now()
    };
}
```

### Redirect Strategy

```javascript
// If Suistart is live, redirect to their platform
if (suistartLive) {
    window.location.href = `https://suistart.com/projects/arail`;
} else {
    // Show your custom portal
    showInvestorPortal();
}
```

---

## Marketing & Community Building

### Pre-Launch Marketing (2 Weeks)

**Week 1:**
- Announce Suistart listing on Twitter
- Post in Sui Discord/Telegram
- Reach out to crypto influencers
- Publish pitch deck publicly

**Week 2:**
- Host AMA on Suistart Discord
- Release demo video of USSD system
- Share TAZARA partnership details
- Countdown posts daily

### Launch Day Marketing

**Channels:**
- Twitter: Pinned tweet with Suistart link
- Telegram: Announcement to all members
- Discord: Dedicated channel for updates
- Email: Notify existing investors

**Content:**
- Live progress updates every hour
- Investor testimonials
- Behind-the-scenes content
- Team Q&A

### Post-Launch Community

**Ongoing:**
- Weekly progress updates
- Monthly AMAs
- Milestone announcements
- Investor-only Telegram group

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| Smart contract bug | Audit by CertiK or Halborn |
| Suistart platform downtime | Backup manual investment process |
| Low participation | Strong pre-launch marketing |
| Price volatility | Lock liquidity for 6 months |

### Regulatory Risks

| Risk | Mitigation |
|------|------------|
| Securities classification | Legal opinion from crypto lawyer |
| KYC/AML compliance | Use Suistart's built-in compliance |
| Cross-border issues | Incorporate in crypto-friendly jurisdiction |
| TAZARA government approval | Secure MOU before launch |

### Market Risks

| Risk | Mitigation |
|------|------------|
| SUI price crash | Raise in SUI, spend in stablecoins |
| Low liquidity | Provide initial liquidity on DeepBook |
| Competitor launch | First-mover advantage, strong partnerships |
| Bear market | Focus on fundamentals, not hype |

---

## Success Metrics

### Launch Success Criteria

**Minimum Viable Success:**
- 50% of goal raised ($250K)
- 25+ investors
- Listed on DeepBook
- No technical issues

**Target Success:**
- 100% of goal raised ($500K)
- 50+ investors
- Top 10 Suistart project by volume
- Media coverage

**Exceptional Success:**
- Oversubscribed (need to increase cap)
- 100+ investors
- #1 Suistart project of the month
- Partnership announcements during sale

### Post-Launch KPIs

**Month 1:**
- Trading volume: $100K+
- Holders: 75+
- Community size: 1,000+ Telegram members
- MVP users: 1,000+

**Month 3:**
- Market cap: $10M+
- Holders: 200+
- Community size: 5,000+
- MVP users: 10,000+

**Month 6:**
- Market cap: $25M+
- Holders: 500+
- Revenue: $50K/month
- TAZARA integration live

---

## Alternative: Manual Launch

If Suistart is not available or you prefer full control:

### DIY Launchpad

1. **Use Your Existing Portal**
   - investor.html already has wallet integration
   - Direct investment to your smart contract
   - Manual whitelist management

2. **DeepBook Listing**
   ```bash
   # Create liquidity pool manually
   sui client call \
     --package 0xDEEPBOOK_PACKAGE \
     --module pool \
     --function create_pool \
     --args $SENT_COIN_TYPE $SUI_COIN_TYPE \
     --gas-budget 10000000
   ```

3. **Marketing**
   - Rely on your own channels
   - Partner with Sui influencers
   - Paid ads on crypto sites

**Pros:**
- Full control
- No platform fees
- Direct relationship with investors

**Cons:**
- Less credibility
- Manual KYC/compliance
- Smaller reach
- More technical work

---

## Conclusion

Suistart provides the infrastructure to launch ARAIL professionally, with built-in compliance, liquidity, and community reach. The platform's due diligence process validates your project and gives investors confidence.

**Next Steps:**
1. Complete legal entity setup
2. Deploy contracts to mainnet
3. Submit Suistart application
4. Prepare marketing materials
5. Launch!

**Timeline:**
- Application: 1 week
- Due diligence: 2-3 weeks
- Preparation: 1 week
- Launch: 1 week
- **Total: 5-6 weeks**

**Target Launch Date:** February 15, 2026

---

**Contact:**
- Suistart Support: support@suistart.com
- ARAIL Team: investors@africarailways.com
- Technical Questions: ben@africarailways.com

**Resources:**
- Suistart Docs: https://docs.suistart.com
- Sui Developer Docs: https://docs.sui.io
- DeepBook Docs: https://docs.deepbook.tech
- ARAIL Whitepaper: https://africarailways.com/whitepaper.html
