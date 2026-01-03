# 🚂 ARAIL USSD Passenger Simulator

## Quick Start

Simulate your first passenger booking a train ticket on ARAIL from Lusaka to Dar es Salaam!

### Prerequisites

1. ✅ Railway deployment running at: `https://africa-railways-production.up.railway.app`
2. ✅ `.env` file configured with:
   - `PACKAGE_ID` or `AFC_PACKAGE_ID` (Sui Package ID)
   - `SUI_RPC_URL` (defaults to Sui Mainnet)
   - `RAILWAY_URL` (optional, defaults to production)

### Run the Simulation

```bash
# From the root folder:
python simulate_passenger.py
```

### What It Does

The script simulates a real Africa's Talking USSD session:

1. **📱 Initial Dial**: Passenger dials `*384*26621#`
2. **📋 Main Menu**: Displays ARAIL service options
3. **🎫 Book Ticket**: Selects "Book Train Ticket"
4. **🚂 Select Route**: Chooses "Lusaka → Dar es Salaam"
5. **⏰ Select Train**: Picks "Express - 06:00 (K450)"
6. **✅ Confirm**: Confirms booking and receives ticket ID
7. **🌐 Sui Check**: Verifies blockchain integration with Sui Mainnet

### Expected Output

```
============================================================
       🚂 ARAIL USSD Passenger Simulation
============================================================

Passenger Details:
  📱 Phone: +260977123456
  📍 Location: Lusaka, Zambia
  🌍 Network: MTN Zambia (62001)
  🔗 Server: https://africa-railways-production.up.railway.app
  ⏰ Time: 2026-01-03 14:30:00

Environment:
  Package ID: 0xc68c4cfb63d702227db09c28837...
  Sui RPC: https://fullnode.mainnet.sui.io:443

Press Enter to start simulation...

[Step 1] Passenger dials *384*26621#

┌────────────────────────────────────────┐
│  Welcome to ARAIL 🚂                   │
│  Africa's Digital Railway              │
│                                        │
│  1. Book Train Ticket                  │
│  2. Invest in $SENT Pre-Seed           │
│  3. Check My Wallet                    │
│  4. Help & Support                     │
└────────────────────────────────────────┘

[Step 2] Passenger selects: 1. Book Train Ticket
...
✅ TICKET BOOKING SUCCESSFUL! 🎉

============================================================
🎫 First passenger successfully booked on ARAIL!
============================================================
```

### Test Different Flows

You can modify the script to test:

- **Investment Flow**: Change steps to select `2` (Invest in $SENT)
- **Wallet Check**: Select `3` (Check My Wallet)
- **Different Routes**: Try Dar → Lusaka, Kapiri routes
- **Different Phone Numbers**: Update `TEST_PHONE` in the script

### Troubleshooting

**Connection Failed?**
- Verify Railway URL: `https://africa-railways-production.up.railway.app`
- Check Railway logs: `railway logs --service=app`
- Ensure server is deployed and running

**Sui Check Fails?**
- Verify `PACKAGE_ID` in `.env`
- Check Sui RPC URL is accessible
- Confirm package exists on Sui Mainnet

**Timeout Errors?**
- Server might be cold-starting (first request takes longer)
- Check Railway dashboard for service status
- Verify no rate limiting is blocking requests

### Customization

Edit `simulate_passenger.py` to customize:

```python
# Line 28-32: Passenger details
TEST_PHONE = "+260977123456"  # Change phone number
NETWORK_CODE = "62001"         # Change network operator

# Line 24-25: Server endpoint
RAILWAY_URL = "https://your-custom-domain.up.railway.app"
```

### Real World Usage

Once tested, real passengers will:

1. Dial `*384*26621#` from any phone in Zambia/Tanzania
2. See the same USSD menus
3. Book tickets paid via mobile money
4. Receive SMS confirmations
5. Show ticket QR code to conductor

### Next Steps

1. ✅ Run simulation and verify success
2. 📊 Check Railway logs for server activity
3. 📱 Test SMS notifications (if configured)
4. 🌐 Verify Sui blockchain transactions
5. 🎯 Deploy to production with real AT credentials

---

**Made with ❤️ for Africa's Digital Railway Revolution**
