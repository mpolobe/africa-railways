# Verification Guide

This document provides independently verifiable information about Africa Railways and the SENT token. We encourage due diligence before any investment.

## Team Verification

### Founder: Benjamin Mpolokoso

| Platform | Link | Verification |
|----------|------|--------------|
| GitHub | [github.com/mpolobe](https://github.com/mpolobe) | Code commits, contribution history |
| LinkedIn | Search "Benjamin Mpolokoso" | Professional background |
| Twitter/X | [@AfricaRailways](https://twitter.com/AfricaRailways) | Public communications |
| Email | ben.mpolokoso@gmail.com | Direct contact |

**Background Claims:**
- Electrical Engineering degree - *Request verification directly*
- IT systems experience in African railways - *Request references*
- Zambian national - *Verifiable through public records*

### Advisory Board

Advisory relationships should be verified directly with named individuals. We will publish signed advisory agreements when formalized.

## On-Chain Verification

### Token Contract

**SENT Token:** `0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5`

Verify on PolygonScan:
1. Go to [PolygonScan](https://polygonscan.com/token/0xF379f21Af5967F26c358568Bb60408DB8B4F7fE5)
2. Check "Contract" tab for verified source code
3. Verify total supply matches 10,000,000,000
4. Check holder distribution

### Liquidity Lock

**PinkSale Pool:** `0xf366e3aaCC54C99E50c90B7C57625776f88D8d08`

Verify on PinkSale:
1. Visit [PinkSale Launchpad](https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08)
2. Confirm 720-day liquidity lock
3. Verify 51% of raised funds go to liquidity

### Vesting Contracts

After deployment, all vesting schedules will be verifiable:

```solidity
// Call these view functions on the vesting contract:
getScheduleCount()           // Total number of vesting schedules
getScheduleInfo(scheduleId)  // Details of each schedule
getGlobalStats()             // Total locked, released, remaining
```

Each allocation (Team, Advisors, Community, Ecosystem) will have separate, publicly viewable vesting schedules.

### Treasury Multi-Sig

Treasury will be controlled by a Gnosis Safe multi-sig:
- **Signers:** 5 (to be published)
- **Threshold:** 3-of-5 required for transactions
- **Address:** TBD (will be published before launch)

All treasury transactions are publicly visible on PolygonScan.

## Partnership Verification

### TAZARA Railway

**Claim:** AFC payment system operational on TAZARA

**How to Verify:**
1. TAZARA is a real railway: [Wikipedia](https://en.wikipedia.org/wiki/TAZARA_Railway)
2. Route: Dar es Salaam (Tanzania) to Kapiri Mposhi (Zambia), 1,860 km
3. Contact TAZARA directly for partnership confirmation
4. Request demonstration of live system

**Note:** We do not claim an official government partnership. We claim our technology is being piloted/used on the railway network. The distinction matters.

### Zambia Railways Limited (ZRL)

**Claim:** Signaling modernization pilot integration

**How to Verify:**
1. ZRL is a real entity: Government of Zambia railway operator
2. EU Railway Sector Support Programme is real: [EU External Action](https://www.eeas.europa.eu/)
3. Contact ZRL directly for confirmation

### Track Worker Network

**Claim:** 2,000+ track workers using the system

**How to Verify:**
1. Request access to anonymized usage data
2. Ask for demonstration of mobile app with real users
3. This claim should be independently audited

## Code Verification

All smart contracts are open source:

| Contract | Location | Purpose |
|----------|----------|---------|
| AfriCoin.sol | `/blockchain/contracts/` | ERC-20 reward token |
| SENTStaking.sol | `/blockchain/contracts/` | Staking with revenue share |
| SENTGovernance.sol | `/blockchain/contracts/` | On-chain voting |
| SENTVesting.sol | `/blockchain/contracts/` | Transparent vesting |
| africoin.move | `/move/africoin/sources/` | Sui payment token |
| ticket.move | `/contracts/sources/` | NFT ticketing |

**Audit Status:** Pending. We are seeking audits from CertiK, Hacken, or equivalent firms. Audit reports will be published in this repository.

## Community Verification

| Platform | Handle | Members | Purpose |
|----------|--------|---------|---------|
| Telegram (Africoin Official) | [Africoin_Official](https://t.me/+66xT4R4T1s5hMTYx) | ~466 | AFC announcements |
| Telegram (Sentinel) | [@AFRCsentinel](https://t.me/AFRCsentinel) | ~165 | SENT community chat |
| Twitter | [@AfricaRailways](https://twitter.com/AfricaRailways) | Check follower count | Public updates |
| GitHub | [mpolobe/africa-railways](https://github.com/mpolobe/africa-railways) | Check stars, forks, commits | Source code |

**Token Distinction:**
- **$AFC (Africoin):** Payment token for tickets, freight, and settlement
- **$SENT (SENTINEL):** Governance/reward token for rail safety workers and investors

## Red Flags We Acknowledge

In the interest of transparency, here are concerns investors may have:

1. **Small Team:** Currently founder-led with contractors. We are building the team.

2. **Early Stage:** Platform is operational but not at scale. Revenue projections are estimates.

3. **Partnership Documentation:** We have not published signed partnership agreements. This is common for early-stage projects but reduces verifiability.

4. **Audit Pending:** Smart contracts have not been professionally audited yet.

5. **Regulatory Uncertainty:** Cryptocurrency regulations in African countries are evolving.

## What We Commit To

1. **Transparency:** All token allocations verifiable on-chain via vesting contracts
2. **Open Source:** All code publicly available on GitHub
3. **Communication:** Regular updates via Telegram and Twitter
4. **Accountability:** Founder is publicly identified, not anonymous
5. **Security:** Professional audit before mainnet launch of new contracts

## How to Report Concerns

If you discover inaccuracies or have concerns:

- **Email:** ben.mpolokoso@gmail.com
- **Telegram:** Message admins in [@AFRCsentinel](https://t.me/AFRCsentinel)
- **GitHub:** Open an issue in this repository

We take all concerns seriously and will respond within 48 hours.

---

**Disclaimer:** This document is for informational purposes only. It does not constitute financial advice. Cryptocurrency investments are high-risk. Always do your own research and consult with a financial advisor before investing.

**Last Updated:** January 18, 2026
