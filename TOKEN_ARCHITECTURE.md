# ARAIL Token Architecture: The Three-Token Unicorn Model

## Executive Summary

ARAIL employs a sophisticated three-token architecture designed to separate equity, payments, and rewards. This structure maximizes value capture while providing functional utility across the railway ecosystem.

```
┌─────────────────────────────────────────────────────────────┐
│                    ARAIL Token Hierarchy                     │
├─────────────────────────────────────────────────────────────┤
│  $SENT (Sentinel) - Equity & Governance                     │
│  └─> AFC (Africoin) - Payment Rail                          │
│      └─> AFRC (Africa Rail Credits) - Loyalty/Rewards       │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. $SENT (Sentinel) - The Primary Asset

### Overview

**$SENT is your company's equity token** - the asset investors buy in the Pre-Seed round. It represents ownership in the ARAIL platform and captures value from the entire digital railway ecosystem.

### Token Details

```json
{
  "name": "Sentinel",
  "ticker": "$SENT",
  "blockchain": "Sui",
  "type": "Governance + Equity",
  "totalSupply": "10,000,000,000",
  "decimals": 9,
  "standard": "Sui Coin"
}
```

### Distribution

| Allocation | Percentage | Amount | Vesting |
|------------|-----------|---------|---------|
| Pre-Seed Investors | 10% | 1,000,000,000 | 12 months linear |
| Seed Round | 5% | 500,000,000 | 12 months linear |
| Series A | 5% | 500,000,000 | 18 months linear |
| Team & Advisors | 20% | 2,000,000,000 | 24 months, 6-month cliff |
| Community & Ecosystem | 30% | 3,000,000,000 | 48 months |
| Treasury | 25% | 2,500,000,000 | Unlocked for operations |
| Liquidity | 5% | 500,000,000 | Unlocked for DEX |

### Utility

1. **Governance Rights**
   - Vote on corridor expansions
   - Approve new railway partnerships
   - Set fee structures
   - Treasury management decisions

2. **Staking Rewards**
   - Stake $SENT to earn 1.91% APY (from treasury auto-staking)
   - Additional rewards from platform fees
   - Boosted rewards for long-term stakers

3. **Revenue Share**
   - 10% of platform fees distributed to $SENT stakers
   - Quarterly dividends from profitable operations
   - Priority access to new features

4. **Platform Access**
   - Discounted ticket prices for $SENT holders
   - Premium features (seat selection, priority boarding)
   - Access to freight services

### Value Accrual

```
Platform Revenue → Treasury → Auto-Staking (1.91% APY) → Operations
                 ↓
              Fee Buyback → $SENT Price Appreciation
                 ↓
           Staking Rewards → Holder Value
```

### Current Status (Pre-Seed)

- **Smart Contract**: `investment.move` deployed
- **Current Raise**: 85,400 SUI (24.4% of 350,000 SUI goal)
- **Investors**: 37 backers
- **Price**: 2,857 SENT per SUI ($0.000504 per SENT)
- **Valuation**: $5M (FDV: $5.04M)

---

## 2. AFC (Africoin) - The Payment Rail

### Overview

**AFC is the transactional stablecoin** used by passengers for ticket purchases. It eliminates exchange rate losses and enables seamless cross-border payments between Zambia and Tanzania.

### Token Details

```json
{
  "name": "Africoin",
  "ticker": "AFC",
  "blockchain": "Sui",
  "type": "Stablecoin (Fiat-Backed)",
  "peg": "1 AFC = 1 ZMW (Zambian Kwacha)",
  "collateral": "ZMW reserves in Zambian banks",
  "standard": "Sui Coin"
}
```

### Why AFC, Not $SENT?

**Problem**: Passengers don't want to hold volatile equity tokens for daily transactions.

**Solution**: AFC provides price stability for:
- Ticket purchases via USSD (*723#)
- Cross-border settlements (ZRL ↔ TAZARA)
- Merchant payments
- Salary disbursements

### Integration Points

#### 1. USSD Gateway

```
*723# (ARAIL Booking)
├─> 1. Book Ticket
│   ├─> Select Route
│   ├─> Choose Seat
│   └─> Pay with AFC (auto-converted from mobile money)
├─> 2. View Routes
├─> 3. My Bookings
└─> 4. Check AFC Balance
```

**Backend Flow:**
```
User dials *723# 
  → USSD Gateway (Railway.app)
  → Convert ZMW to AFC (1:1)
  → Mint AFC on Sui
  → Purchase ticket (NFT)
  → Burn AFC
  → Settle with railway operator
```

#### 2. Mobile Money Integration

```javascript
// Zambia: MTN, Airtel, Zamtel
// Tanzania: M-Pesa, Tigo Pesa, Airtel Money

async function convertToAFC(amount, phoneNumber, provider) {
    // 1. Deduct from mobile money
    await mobileMoneyAPI.deduct(phoneNumber, amount, provider);
    
    // 2. Mint equivalent AFC
    const afcAmount = amount; // 1:1 peg
    await suiContract.mintAFC(userWallet, afcAmount);
    
    // 3. Record transaction
    await database.logConversion({
        user: phoneNumber,
        zmw: amount,
        afc: afcAmount,
        timestamp: Date.now()
    });
}
```

#### 3. Cross-Border Settlement

**Problem**: ZRL (Zambia) and TAZARA (Tanzania) operate in different currencies.

**Solution**: AFC as neutral settlement layer.

```
Zambian Passenger (ZMW) 
  → Convert to AFC
  → Book TAZARA ticket
  → AFC transferred to TAZARA
  → TAZARA converts AFC to TZS
```

**Benefits:**
- No forex fees
- Instant settlement
- Transparent on-chain records
- Reduced reconciliation costs

### AFC vs $SENT: Key Differences

| Feature | $SENT | AFC |
|---------|-------|-----|
| Purpose | Equity/Governance | Payments |
| Volatility | High (market-driven) | Stable (1:1 ZMW peg) |
| Investor Appeal | Yes (value appreciation) | No (utility only) |
| User Adoption | Low (complex) | High (familiar) |
| Staking | Yes (1.91% APY) | No |
| Governance | Yes | No |

### Collateralization

**Reserve Mechanism:**
```
1 AFC = 1 ZMW held in Zambian bank account
```

**Audit:**
- Monthly attestations by local accounting firm
- On-chain proof of reserves
- Transparent reserve ratio

**Redemption:**
- Users can redeem AFC for ZMW anytime
- 1% redemption fee (covers banking costs)
- Processed within 24 hours

### Current Status

- **Status**: Design phase
- **Launch**: Q2 2026 (after $SENT raise)
- **Initial Supply**: 1,000,000 AFC (backed by 1M ZMW)
- **Partnerships**: In discussions with Zambian banks

---

## 3. AFRC (Africa Rail Credits) - The Reward Layer

### Overview

**AFRC is a loyalty and carbon-credit token** given to frequent travelers and cargo companies that reduce carbon footprints by choosing rail over road transport.

### Token Details

```json
{
  "name": "Africa Rail Credits",
  "ticker": "AFRC",
  "blockchain": "Sui",
  "type": "Utility + Loyalty",
  "totalSupply": "Unlimited (inflationary)",
  "issuance": "Earned through platform usage",
  "standard": "Sui Coin"
}
```

### Earning Mechanisms

#### 1. Passenger Loyalty

```javascript
// Earn AFRC for every trip
const afrcPerTrip = calculateRewards(distance, class, frequency);

// Example:
// - 100km trip = 10 AFRC
// - 500km trip = 50 AFRC
// - 10th trip bonus = 100 AFRC
```

#### 2. Carbon Credits

```javascript
// Cargo companies earn AFRC for choosing rail over trucks
const carbonSaved = truckEmissions - railEmissions;
const afrcReward = carbonSaved * AFRC_PER_TON_CO2;

// Example:
// - 1 ton cargo, 500km by rail vs truck
// - Carbon saved: 0.5 tons CO2
// - AFRC earned: 50 AFRC
```

#### 3. Referral Program

```javascript
// Earn AFRC for referring new users
const referralBonus = 100; // AFRC per referral
const referrerBonus = 50;  // AFRC for referrer

// Both parties earn when referee makes first booking
```

### Redemption Options

| AFRC Amount | Redemption |
|-------------|------------|
| 100 AFRC | 10% discount on next ticket |
| 500 AFRC | Free upgrade to business class |
| 1,000 AFRC | 1 free ticket (economy) |
| 5,000 AFRC | 1 free ticket (business) |
| 10,000 AFRC | Convert to 100 $SENT |

### Carbon Credit Marketplace

**Phase 2 Feature (2027):**

```
AFRC → Verified Carbon Credits → Sell to corporations
```

**Partners:**
- Verra (carbon credit registry)
- Gold Standard
- African carbon exchanges

**Value Proposition:**
- African railways generate carbon credits
- AFRC holders can sell credits
- Creates additional revenue stream

### Current Status

- **Status**: Concept phase
- **Launch**: Q4 2026 (after AFC launch)
- **Initial Distribution**: Airdrop to early $SENT holders
- **Partnerships**: Exploring carbon credit registries

---

## Token Interaction Flow

### User Journey: Booking a Ticket

```
1. User dials *723#
   ↓
2. Selects route (Lusaka → Dar es Salaam)
   ↓
3. Pays 50 ZMW via mobile money
   ↓
4. System converts 50 ZMW → 50 AFC
   ↓
5. AFC used to mint ticket NFT
   ↓
6. User receives ticket + 50 AFRC loyalty points
   ↓
7. AFC burned, revenue flows to treasury
   ↓
8. Treasury auto-stakes SUI, generates yield
   ↓
9. Yield distributed to $SENT stakers
```

### Investor Journey: Holding $SENT

```
1. Investor buys 100,000 $SENT in Pre-Seed
   ↓
2. Receives Investment Certificate NFT
   ↓
3. Tokens vest linearly over 12 months
   ↓
4. Investor stakes $SENT
   ↓
5. Earns 1.91% APY from treasury auto-staking
   ↓
6. Earns additional rewards from platform fees
   ↓
7. Participates in governance votes
   ↓
8. $SENT appreciates as platform grows
```

### Cargo Company Journey: Earning AFRC

```
1. Company ships 10 tons of goods via ARAIL
   ↓
2. Pays with AFC (converted from ZMW)
   ↓
3. System calculates carbon saved vs trucking
   ↓
4. Company earns 500 AFRC
   ↓
5. AFRC accumulated over time
   ↓
6. Company redeems AFRC for:
   - Discounted future shipments
   - Conversion to $SENT
   - Sale on carbon credit market
```

---

## Launch Sequence

### Phase 1: Pre-Seed ($SENT) - Q1 2026

**Focus**: Raise capital, build investor base

- Deploy `investment.move` smart contract
- Launch investor portal
- Raise 350,000 SUI ($500K)
- Issue Investment Certificate NFTs
- List $SENT on DeepBook

**Deliverables:**
- ✅ Smart contracts deployed
- ✅ Investor portal live
- ✅ 37 investors onboarded
- ⏳ Raise completion (24.4% done)

### Phase 2: MVP Launch + AFC Integration - Q2 2026

**Focus**: Launch mainnet, integrate AFC payments

- Deploy USSD gateway (*723#)
- Integrate mobile money (MTN, Airtel)
- Launch AFC stablecoin
- Onboard first 1,000 users
- TAZARA integration

**Deliverables:**
- USSD system live
- AFC minting/burning operational
- 1,000+ active users
- $50K monthly revenue

### Phase 3: AFRC Loyalty Program - Q4 2026

**Focus**: Retention, carbon credits

- Launch AFRC loyalty token
- Airdrop to early users
- Implement referral program
- Partner with carbon registries
- 10,000+ active users

**Deliverables:**
- AFRC token live
- Loyalty program active
- Carbon credit marketplace beta
- $200K monthly revenue

### Phase 4: Ecosystem Expansion - 2027

**Focus**: Scale across Africa

- Expand to 5 countries
- Launch freight services
- Integrate with more railways
- Series A fundraise ($10M)
- 100,000+ active users

**Deliverables:**
- Multi-country operations
- $1M monthly revenue
- Carbon credit sales
- Unicorn trajectory ($1B valuation)

---

## Technical Implementation

### Smart Contract Architecture

```
arail/
├── investment.move        # $SENT equity token
├── africoin.move         # AFC stablecoin
├── rail_credits.move     # AFRC loyalty token
├── treasury.move         # Auto-staking treasury
├── ticket_nft.move       # Ticket NFTs
└── governance.move       # DAO voting
```

### AFC Stablecoin Contract

```move
module arail::africoin {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    
    /// AFC stablecoin (1 AFC = 1 ZMW)
    public struct AFC has drop {}
    
    /// Reserve backing AFC
    public struct Reserve has key {
        id: UID,
        zmw_balance: u64,
        afc_supply: u64,
        collateral_ratio: u64, // in basis points (10000 = 100%)
    }
    
    /// Mint AFC (only authorized minters)
    public entry fun mint(
        treasury_cap: &mut TreasuryCap<AFC>,
        reserve: &mut Reserve,
        amount: u64,
        ctx: &mut TxContext
    ) {
        // Verify collateral
        assert!(reserve.zmw_balance >= amount, E_INSUFFICIENT_COLLATERAL);
        
        // Mint AFC
        let afc = coin::mint(treasury_cap, amount, ctx);
        reserve.afc_supply = reserve.afc_supply + amount;
        
        transfer::public_transfer(afc, tx_context::sender(ctx));
    }
    
    /// Burn AFC (redeem for ZMW)
    public entry fun burn(
        treasury_cap: &mut TreasuryCap<AFC>,
        reserve: &mut Reserve,
        afc: Coin<AFC>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&afc);
        coin::burn(treasury_cap, afc);
        
        reserve.afc_supply = reserve.afc_supply - amount;
        
        // Initiate ZMW withdrawal (off-chain process)
        event::emit(RedemptionEvent {
            user: tx_context::sender(ctx),
            amount,
            timestamp: tx_context::epoch(ctx),
        });
    }
}
```

### AFRC Loyalty Contract

```move
module arail::rail_credits {
    use sui::coin::{Self, Coin, TreasuryCap};
    
    /// AFRC loyalty token
    public struct AFRC has drop {}
    
    /// Reward for completing a trip
    public entry fun reward_trip(
        treasury_cap: &mut TreasuryCap<AFRC>,
        user: address,
        distance_km: u64,
        ctx: &mut TxContext
    ) {
        // Calculate reward (10 AFRC per 100km)
        let reward_amount = (distance_km / 100) * 10;
        
        // Mint AFRC
        let afrc = coin::mint(treasury_cap, reward_amount, ctx);
        
        event::emit(RewardEvent {
            user,
            amount: reward_amount,
            reason: b"trip_completion",
        });
        
        transfer::public_transfer(afrc, user);
    }
    
    /// Redeem AFRC for discount
    public entry fun redeem_for_discount(
        afrc: Coin<AFRC>,
        ticket_price: u64,
    ): u64 {
        let afrc_amount = coin::value(&afrc);
        
        // 100 AFRC = 10% discount
        let discount_percent = (afrc_amount / 100) * 10;
        let discount_amount = (ticket_price * discount_percent) / 100;
        
        discount_amount
    }
}
```

---

## Investor FAQ

### Q: Which token should I buy?

**A**: Buy **$SENT** in the Pre-Seed round. It's the equity token that captures value from the entire ecosystem. AFC and AFRC are utility tokens, not investment vehicles.

### Q: Will AFC and AFRC dilute my $SENT holdings?

**A**: No. AFC is a stablecoin (not equity), and AFRC is inflationary but separate from $SENT. Your $SENT percentage ownership remains constant.

### Q: How does AFC benefit $SENT holders?

**A**: Every AFC transaction generates fees that flow to the treasury, which auto-stakes SUI and distributes yield to $SENT stakers.

### Q: Can I convert between tokens?

**A**: Yes, with restrictions:
- $SENT ↔ AFC: Via DEX (market price)
- AFRC → $SENT: 10,000 AFRC = 100 $SENT (one-way)
- AFC → AFRC: Not directly (earn AFRC through usage)

### Q: What's the total addressable market?

**A**: 
- **$SENT**: $5M valuation → $1B target (200x)
- **AFC**: $50B African railway market
- **AFRC**: $2B carbon credit market

---

## Conclusion

The three-token model separates concerns:

1. **$SENT**: Equity and governance (investors)
2. **AFC**: Payments and stability (users)
3. **AFRC**: Loyalty and carbon credits (ecosystem)

This architecture maximizes value capture while providing functional utility. Investors buy $SENT for appreciation, users transact with AFC for stability, and the ecosystem rewards participation with AFRC.

**Current Priority**: Complete $SENT Pre-Seed raise (350,000 SUI / $500K)

**Next Steps**:
1. Close Pre-Seed round (13 days remaining)
2. Deploy to mainnet
3. Launch MVP with AFC integration
4. Scale to 10,000 users
5. Introduce AFRC loyalty program

---

**Contact:**
- Investors: investors@africarailways.com
- Technical: ben@africarailways.com
- Partnerships: partnerships@africarailways.com

**Resources:**
- Investor Portal: https://africarailways.com/investor
- Pitch Deck: https://africarailways.com/pitch-deck
- Whitepaper: https://africarailways.com/whitepaper.html
- GitHub: https://github.com/mpolobe/africa-railways
