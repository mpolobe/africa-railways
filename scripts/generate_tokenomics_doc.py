#!/usr/bin/env python3
# /scripts/generate_tokenomics_doc.py
import json

TOKEN_DATA = {
    "name": "Sentinel",
    "symbol": "SENT",
    "total_supply": 5000000000,
    "blockchain": "Polygon (POL)",
    "contract": "0xC9c7A437D2F2992d88E3137A473c2e0bAd696477",
    "lock_period": "730 Days",
    "vibe": "Infrastructure Equity"
}

def create_markdown():
    content = f"""# 🚆 $SENT Tokenomics - The Digital Spine
Official tokenomics for the Africa Railways utility layer.

- **Total Supply:** {TOKEN_DATA['total_supply']:,} $SENT
- **Network:** {TOKEN_DATA['blockchain']}
- **Contract:** `{TOKEN_DATA['contract']}`
- **Transparency:** Verified in `mpolobe/africa-railways`

## Distribution
- **67% Presale:** Public liquidity.
- **31% Locked Liquidity:** Secured for 2 years.
- **2% Ecosystem:** Platform and security.

*SENT captures value from AFC transactions and AFRC loyalty engagement.*

## Token Utility

### 1. Governance Rights
- Vote on railway corridor expansions
- Approve fee structure changes
- Treasury management decisions
- Partnership approvals

### 2. Staking Rewards
- Earn from platform transaction fees
- 1.91% APY from treasury auto-staking
- Bonus rewards for long-term stakers

### 3. Platform Access
- Discounted railway tickets
- Priority boarding and seat selection
- Access to freight services
- Premium features

### 4. Value Capture
- 50% of platform fees distributed to stakers
- Quarterly buyback from revenue
- Deflationary pressure from vesting

## Network Details

**Blockchain:** Polygon (POL)  
**Standard:** ERC-20  
**Decimals:** 18  
**Liquidity Lock:** {TOKEN_DATA['lock_period']}  
**Audit Status:** Pending CertiK/Hacken

## Vesting Schedule

| Allocation | Percentage | Amount | Vesting |
|------------|-----------|---------|---------|
| PinkSale IDO | 20% | 1,000,000,000 | 10% TGE, 12mo linear |
| Community & Sentinels | 30% | 1,500,000,000 | 36mo, 6mo cliff |
| Team & Advisors | 15% | 750,000,000 | 24mo, 6mo cliff |
| Treasury | 20% | 1,000,000,000 | Unlocked |
| Ecosystem Fund | 10% | 500,000,000 | 48mo linear |
| Liquidity | 5% | 250,000,000 | Unlocked |

## Links

- **Website:** [africa-railways.vercel.app](https://africa-railways.vercel.app)
- **Litepaper:** [SENT_LITEPAPER.md](./SENT_LITEPAPER.md)
- **PinkSale Config:** [PINKSALE_CONFIGURATION.md](./PINKSALE_CONFIGURATION.md)
- **GitHub:** [github.com/mpolobe/africa-railways](https://github.com/mpolobe/africa-railways)
- **Contract:** [PolygonScan](https://polygonscan.com/token/{TOKEN_DATA['contract']})

## Investment Thesis

### Why $SENT?

1. **Working Product**: AFC payment system live on TAZARA railway
2. **Real Traction**: 2,000+ track workers already using the system
3. **Massive Market**: 54 African countries, 200M+ annual railway passengers
4. **Clear Revenue**: 2% platform fees from every ticket sold
5. **Public Team**: Verified founder with railway and blockchain expertise

### Value Proposition

```
More Railways → More Passengers → More Fees → Higher Staking APY → More Demand → Higher Price
```

### Comparable Valuations

| Project | Market Cap | Revenue | Multiple |
|---------|-----------|---------|----------|
| Helium | $1.2B | $2M/year | 600x |
| Render | $3.5B | $5M/year | 700x |
| **$SENT (Target)** | $5M | $2.4M/year | 2x |

**Upside**: 50-100x potential as network expands to 54 countries.

## Risk Factors

- Cryptocurrency market volatility
- Regulatory changes in African countries
- Railway partnership delays
- Competition from traditional payment systems

**Disclaimer**: High-risk investment. Only invest what you can afford to lose.

## Community

- **Telegram:** [@AfricoinCommunity](https://t.me/AfricoinCommunity)
- **Twitter:** [@AfricaRailways](https://twitter.com/AfricaRailways)
- **Medium:** [@africarailways](https://medium.com/@africarailways)
- **Email:** contact@africarailways.com

---

**Last Updated:** January 11, 2026  
**Version:** 1.0  
**Status:** Pre-Launch (PinkSale Pending)

© 2026 Africa Railways. All rights reserved.
"""
    with open("TOKENOMICS.md", "w") as f:
        f.write(content)
    print("✅ SUCCESS: TOKENOMICS.md generated for GitHub sync.")
    print(f"📊 Token: {TOKEN_DATA['symbol']}")
    print(f"🔗 Contract: {TOKEN_DATA['contract']}")
    print(f"💰 Supply: {TOKEN_DATA['total_supply']:,}")
    print(f"🔒 Lock: {TOKEN_DATA['lock_period']}")

if __name__ == "__main__":
    create_markdown()
