# AFRC Token Creation Guide for suilab.fun

## Token Information

### Basic Details
```
Token Name: Africa Rail Credits
Token Symbol: AFRC
Blockchain: Sui Network
Type: Utility + Loyalty Token
Decimals: 9 (standard for Sui)
```

### Token Description
```
Africa Rail Credits (AFRC) is the loyalty and rewards token for the Africa Railways ecosystem. 
Earn AFRC by traveling on TAZARA and Zambia Railways, staking subscriptions, and reducing 
carbon emissions by choosing rail over road transport. AFRC can be used for ticket discounts, 
upgrades, and staking rewards.
```

### Supply Information
```
Initial Supply: 1,000,000,000 AFRC (1 Billion)
Max Supply: Unlimited (inflationary - rewards-based)
Distribution Model: Earned through platform usage
```

## Token Logo/Image

### Recommended Design
- **Primary Color**: Gold (#FFB800)
- **Secondary Color**: Cyan (#00D4FF)
- **Icon**: 🚂 Train emoji or railway symbol
- **Background**: Navy blue (#0a0e1a)

### Logo URL (if needed)
You can use this placeholder or upload your own:
```
https://images.unsplash.com/photo-1474487024539-6633b38d3bb3?auto=format&fit=crop&w=400&q=80
```

## Social Links

```
Website: https://www.africarailways.com
Twitter/X: @AfricaRailways (or your handle)
Telegram: t.me/africarailways (or your channel)
Discord: discord.gg/africarailways (or your server)
GitHub: https://github.com/mpolobe/africa-railways
```

## Token Utility

### Primary Use Cases
1. **Loyalty Rewards**
   - Earn AFRC for every train journey
   - Distance-based rewards (10 AFRC per 100km)
   - Frequency bonuses (100 AFRC on 10th trip)

2. **Subscription Staking**
   - Stake AFRC in subscription tiers
   - Earn 5-20% APY based on tier
   - Unlock discounts and benefits

3. **Ticket Discounts**
   - Use AFRC to pay for tickets
   - Get 10-30% discount based on subscription
   - Priority booking for AFRC holders

4. **Carbon Credits**
   - Cargo companies earn AFRC for rail transport
   - 1 ton CO2 saved = 100 AFRC
   - Tradeable carbon offset credits

5. **Governance**
   - Vote on route expansions
   - Propose new features
   - Community treasury allocation

## Token Economics

### Distribution Breakdown
```
Community Rewards: 45% (450M AFRC)
- Passenger loyalty: 25%
- Carbon credits: 10%
- Referral program: 10%

Ecosystem Fund: 20% (200M AFRC)
- Partnerships: 10%
- Marketing: 5%
- Development: 5%

Team & Advisors: 15% (150M AFRC)
- 24-month vesting
- 6-month cliff

Liquidity Pool: 10% (100M AFRC)
- DEX liquidity
- Market making

Treasury: 10% (100M AFRC)
- Operations
- Emergency fund
```

### Earning Rates
```
Passenger Rewards:
- Economy class: 10 AFRC per 100km
- Business class: 15 AFRC per 100km
- First class: 20 AFRC per 100km

Subscription Staking:
- Basic ($10/mo): 5% APY
- Frequent Rider ($50/mo): 12% APY
- Unlimited ($150/mo): 20% APY

Carbon Credits:
- 1 ton CO2 saved = 100 AFRC
- Verified by blockchain oracle
- Tradeable on carbon markets
```

## Step-by-Step Creation on suilab.fun

### 1. Connect Wallet
- Visit [suilab.fun](https://suilab.fun)
- Click "Connect Wallet"
- Select your Sui wallet (Sui Wallet, Suiet, or Martian)
- Approve connection

### 2. Navigate to Token Creation
- Click "Create Token" or "Launch Token"
- Select "Create New Token"

### 3. Fill in Token Details
```
Token Name: Africa Rail Credits
Symbol: AFRC
Decimals: 9
Initial Supply: 1000000000 (1 billion)
Description: [Use description from above]
```

### 4. Upload Logo
- Upload your AFRC logo (PNG/JPG, recommended 512x512px)
- Or use URL if platform supports it

### 5. Add Social Links
- Website: https://www.africarailways.com
- Twitter: [Your Twitter handle]
- Telegram: [Your Telegram channel]
- Add any other relevant links

### 6. Set Token Properties
```
☑ Mintable: YES (for future rewards)
☑ Burnable: YES (for deflationary mechanics)
☐ Pausable: NO (decentralized)
☑ Upgradeable: YES (for future improvements)
```

### 7. Review and Deploy
- Review all information carefully
- Check gas fees (usually 0.1-0.5 SUI)
- Click "Create Token" or "Deploy"
- Approve transaction in wallet
- Wait for confirmation

### 8. Post-Deployment
- Save the token contract address
- Add to token tracking sites (CoinGecko, CoinMarketCap)
- Create liquidity pool on Sui DEX
- Announce on social media

## Contract Address Storage

After deployment, save these details:

```
Token Contract Address: 0x[YOUR_CONTRACT_ADDRESS]
Deployment Transaction: 0x[TX_HASH]
Deployment Date: [DATE]
Deployer Address: 0x[YOUR_WALLET_ADDRESS]
Network: Sui Mainnet
```

## Integration with Africa Railways

### Update Website
Add token address to:
- `book-tickets.html`
- `tazara-pilot.html`
- `investor.html`

### Update Smart Contracts
```javascript
// In your booking contracts
const AFRC_TOKEN_ADDRESS = "0x[YOUR_CONTRACT_ADDRESS]";

// For payments
async function payWithAFRC(amount) {
    const tx = new Transaction();
    tx.moveCall({
        target: `${AFRC_TOKEN_ADDRESS}::afrc::transfer`,
        arguments: [
            tx.object(TREASURY_ADDRESS),
            tx.pure.u64(amount * 1_000_000_000) // Convert to smallest unit
        ],
    });
    return await signAndExecuteTransaction({ transaction: tx });
}
```

### Update Documentation
Add token address to:
- README.md
- TOKEN_ARCHITECTURE.md
- BOOKING_SYSTEM.md
- TAZARA_STAKEHOLDER_PRESENTATION.md

## Marketing Checklist

After token creation:

- [ ] Announce on Twitter/X
- [ ] Post in Telegram/Discord
- [ ] Update website with token address
- [ ] Submit to CoinGecko
- [ ] Submit to CoinMarketCap
- [ ] Create liquidity pool on Cetus/Turbos
- [ ] Add to Sui ecosystem directory
- [ ] Create token tracker page
- [ ] Set up token analytics
- [ ] Launch airdrop campaign (optional)

## Security Considerations

### Before Deployment
- [ ] Audit token contract code
- [ ] Test on Sui Testnet first
- [ ] Verify all parameters are correct
- [ ] Ensure sufficient SUI for gas fees
- [ ] Backup wallet seed phrase

### After Deployment
- [ ] Verify contract on Sui Explorer
- [ ] Test token transfers
- [ ] Test minting/burning functions
- [ ] Monitor for unusual activity
- [ ] Set up alerts for large transfers

## Support Resources

### Sui Documentation
- Token Standard: https://docs.sui.io/standards/coin
- Move Language: https://move-book.com/
- Sui Explorer: https://suiexplorer.com/

### Community Support
- Sui Discord: https://discord.gg/sui
- Sui Forum: https://forums.sui.io/
- Sui GitHub: https://github.com/MystenLabs/sui

### Africa Railways Support
- Website: https://www.africarailways.com
- GitHub: https://github.com/mpolobe/africa-railways
- Email: support@africarailways.com

## Troubleshooting

### Common Issues

**Issue**: "Insufficient gas fees"
**Solution**: Ensure you have at least 1 SUI in your wallet

**Issue**: "Token symbol already exists"
**Solution**: Try a variation like AFRC2 or AfricaRailCredits

**Issue**: "Transaction failed"
**Solution**: Check network status, increase gas limit, try again

**Issue**: "Cannot connect wallet"
**Solution**: Refresh page, check wallet extension, try different browser

## Next Steps After Token Creation

1. **Create Liquidity Pool**
   - Pair AFRC with SUI on Cetus or Turbos DEX
   - Add initial liquidity (e.g., 100,000 AFRC + 100 SUI)
   - Set trading fees (0.3% recommended)

2. **Set Up Staking Contract**
   - Deploy staking contract for subscription tiers
   - Configure APY rates (5%, 12%, 20%)
   - Test staking/unstaking functions

3. **Integrate with Booking System**
   - Update payment functions to accept AFRC
   - Add AFRC balance display
   - Implement reward distribution

4. **Launch Marketing Campaign**
   - Airdrop to early users
   - Referral program
   - Social media campaign
   - Partnership announcements

## Important Notes

⚠️ **Before deploying to mainnet:**
1. Test thoroughly on Sui Testnet
2. Have contract audited if possible
3. Ensure you have backup of all keys
4. Double-check all parameters
5. Start with smaller initial supply if unsure

✅ **After deployment:**
1. Token address is permanent and cannot be changed
2. Keep private keys secure
3. Monitor token activity regularly
4. Engage with community
5. Provide regular updates

## Contact

For assistance with token creation or integration:
- GitHub Issues: https://github.com/mpolobe/africa-railways/issues
- Email: support@africarailways.com
- Community: [Your Discord/Telegram]

---

**Good luck with your AFRC token launch! 🚂💰**
