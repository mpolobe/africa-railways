# $SENT Tokenomics

## Token Overview

| Property | Value |
|----------|-------|
| **Name** | SENTINEL |
| **Symbol** | SENT |
| **Network** | Polygon (POL) |
| **Standard** | ERC-20 |
| **Total Supply** | 10,000,000,000 SENT (fixed, no inflation) |
| **Decimals** | 18 |

## Contract Addresses

| Contract | Address | PolygonScan |
|----------|---------|-------------|
| SENT Token | `0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5` | [View](https://polygonscan.com/token/0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5) |
| SENTStaking | `0x70A3Ebf1423EF6a9020EcC3e0A00c76cB1CF8883` | [View](https://polygonscan.com/address/0x70A3Ebf1423EF6a9020EcC3e0A00c76cB1CF8883) |
| SENTGovernance | `0x2803C2b4F291F6288984720A6481f03C2018DC1F` | [View](https://polygonscan.com/address/0x2803C2b4F291F6288984720A6481f03C2018DC1F) |
| SENTVesting | `0xA49cabC015C8Fe058bD0EB91DeBBA0A1F37532FD` | [View](https://polygonscan.com/address/0xA49cabC015C8Fe058bD0EB91DeBBA0A1F37532FD) |
| PinkSale Pool | `0xf366e3aaCC54C99E50c90B7C57625776f88D8d08` | [View](https://polygonscan.com/address/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08) |

## Token Distribution

| Allocation | Percentage | Amount | Vesting | On-Chain Verification |
|------------|-----------|--------|---------|----------------------|
| Presale (PinkSale) | 30% | 3,000,000,000 | 10% TGE, 12mo linear | PinkSale contract |
| Liquidity | 14.5% | 1,453,500,000 | Locked 720 days | QuickSwap LP lock |
| Community & Sentinels | 25% | 2,500,000,000 | 36mo, 6mo cliff | Vesting contract |
| Team & Advisors | 10% | 1,000,000,000 | 24mo, 6mo cliff | Vesting contract |
| Treasury | 15% | 1,500,000,000 | Multi-sig controlled | Gnosis Safe |
| Ecosystem Fund | 5.5% | 546,500,000 | 48mo linear | Vesting contract |

**Total: 100% = 10,000,000,000 SENT**

## Investor Value Mechanisms

### 1. Revenue Share (Staking)

SENT holders can stake tokens to receive 50% of platform transaction fees:

```
Platform Fee Flow:
AFC Transaction (ticket/freight) 
  → 2% platform fee collected
  → 50% converted to POL → distributed to stakers
  → 50% to treasury (operations + buyback)
```

**Staking Tiers:**

| Lock Period | Bonus Multiplier | Example APY* |
|-------------|------------------|--------------|
| 30 days | 1.0x | 5% |
| 90 days | 1.1x | 5.5% |
| 180 days | 1.25x | 6.25% |
| 365 days | 1.5x | 7.5% |

*APY varies based on total staked and platform volume

**Contract:** `SENTStaking.sol` - Auditable on-chain revenue distribution

### 2. Governance Rights

SENT holders vote on protocol decisions:

- Railway corridor expansions (which countries to add)
- Fee structure changes (platform commission rates)
- Treasury allocation (how to deploy reserves)
- Partnership approvals (new railway operators)
- Protocol upgrades

**Voting Power:** 1 SENT = 1 vote (linear)

**Proposal Threshold:** 0.1% of supply (10M SENT) to create proposals

**Quorum:** 4% of supply must participate for vote to be valid

**Contract:** `SENTGovernance.sol` - On-chain voting with transparent results

### 3. Buyback Mechanism

Treasury uses 25% of its fee allocation for quarterly SENT buybacks:

```
Treasury Fee Allocation:
  → 50% operations (development, partnerships)
  → 25% buyback (market purchases, then burn or redistribute)
  → 25% reserve (emergency fund)
```

Buyback transactions are executed on-chain and publicly verifiable.

### 4. Platform Discounts

SENT holders receive:
- 10% discount on AFC ticket purchases
- Priority access to new railway routes
- Reduced freight shipping rates

## Security Features

| Feature | Implementation |
|---------|---------------|
| Liquidity Lock | 720 days via PinkSale |
| Multi-sig Treasury | 3-of-5 Gnosis Safe |
| Vesting Contracts | On-chain, immutable schedules |
| Audit Status | Pending (CertiK/Hacken) |

## Risk Disclosure

**This is a high-risk investment. Consider these factors:**

1. **Early Stage:** Platform is operational on TAZARA but expanding to other railways is not guaranteed
2. **Regulatory Risk:** African railway regulations may change
3. **Market Risk:** Cryptocurrency prices are volatile
4. **Execution Risk:** Team must deliver on roadmap
5. **Liquidity Risk:** Trading volume may be limited initially

**Only invest what you can afford to lose.**

## Verification Checklist

Before investing, verify:

- [ ] Token contract on PolygonScan matches address above
- [ ] Liquidity lock visible on PinkSale
- [ ] Staking contract deployed and verified
- [ ] Governance contract deployed and verified
- [ ] Vesting contracts deployed with correct schedules
- [ ] Treasury multi-sig address published
- [ ] Audit report published (when complete)

## Links

- **Litepaper:** [SENT_LITEPAPER.md](./SENT_LITEPAPER.md)
- **Staking Contract:** [SENTStaking.sol](./blockchain/contracts/SENTStaking.sol)
- **Governance Contract:** [SENTGovernance.sol](./blockchain/contracts/SENTGovernance.sol)
- **Vesting Contract:** [SENTVesting.sol](./blockchain/contracts/SENTVesting.sol)
- **GitHub:** [github.com/mpolobe/africa-railways](https://github.com/mpolobe/africa-railways)

---

**Last Updated:** January 18, 2026  
**Version:** 2.0
