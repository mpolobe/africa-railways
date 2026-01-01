# ARAIL Testing Quick Start Guide

## USSD Testing (*384*26621#)

### Prerequisites

```bash
# Install Python 3.7+
python3 --version

# Install required packages
pip install requests
```

### Running the Tests

#### 1. Quick Test (Single Request)

```bash
python3 test_ussd.py
# Select option 1 for quick test
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════╗
║          ARAIL USSD Testing Suite v1.0.0                  ║
║          Service Code: *384*26621#                        ║
╚════════════════════════════════════════════════════════════╝

Select Test Mode:
1. Quick Test (Initial dial only)
...

Request Details:
  Session ID: AT_Mock_1735689600
  Phone: +260975190740
  Input: '' (Level 0)
  Timestamp: 2025-12-31 20:00:00

Response:
  Status Code: 200
  Response Time: 245.32ms
  Content Length: 89 bytes
✅ Valid CON response (session continues)

Response Content:
------------------------------------------------------------
CON Welcome to ARAIL 🚂
1. Book Ticket
2. View Routes
3. My Bookings
4. Check Balance
5. Help
------------------------------------------------------------
✅ Fast response time: 245.32ms
```

#### 2. Full Booking Flow Test

```bash
python3 test_ussd.py
# Select option 2
```

This simulates a complete booking from start to finish:
1. Initial dial
2. Select "Book Ticket"
3. Choose route (Lusaka → Dar es Salaam)
4. Select train
5. Choose seat
6. Confirm booking

#### 3. Interactive Mode

```bash
python3 test_ussd.py
# Select option 6
```

Allows you to manually test any USSD flow:
```
USSD Input > 1
USSD Input > 1*1
USSD Input > 1*1*2
```

### Test Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| 1 | Quick Test | Verify server is responding |
| 2 | Full Booking Flow | Test complete user journey |
| 3 | All Menu Options | Validate all menu items |
| 4 | Invalid Input Handling | Test error handling |
| 5 | Performance Test | Measure response times |
| 6 | Interactive Mode | Manual exploration |
| 7 | Run All Tests | Comprehensive validation |

### Configuration

Edit `test_ussd.py` to customize:

```python
# Line 10-12
CALLBACK_URL = "https://africa-railways-production.up.railway.app/ussd"
SERVICE_CODE = "*384*26621#"
PHONE_NUMBER = "+260975190740"  # Your test number
```

### Troubleshooting

#### Connection Error

```
❌ CONNECTION ERROR: Cannot reach https://...
```

**Solution:**
- Check Railway.app deployment status
- Verify callback URL is correct
- Ensure server is running

#### Invalid Response Format

```
❌ Invalid response format (must start with CON or END)
```

**Solution:**
- Check server logs on Railway.app
- Verify USSD handler is returning correct format
- Test with curl first

#### Timeout

```
❌ Request timed out after 10 seconds
```

**Solution:**
- Check database connection
- Optimize slow queries
- Increase timeout in test script

### Manual Testing with curl

```bash
# Test initial dial
curl -X POST https://africa-railways-production.up.railway.app/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=*384*26621#&phoneNumber=%2B260977123456&text="

# Test menu selection
curl -X POST https://africa-railways-production.up.railway.app/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=*384*26621#&phoneNumber=%2B260977123456&text=1"
```

---

## Smart Contract Testing (Sui)

### Prerequisites

```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui

# Verify installation
sui --version
```

### Deploy to Testnet

```bash
cd move/arail_fundraising

# Build contracts
sui move build

# Deploy
./deploy.sh testnet
```

### Test Investment Flow

```bash
# Set environment variables
export PACKAGE_ID="0xYOUR_PACKAGE_ID"
export TREASURY_ID="0xYOUR_TREASURY_ID"

# Test investment (100 SUI)
sui client call \
  --package $PACKAGE_ID \
  --module investment \
  --function invest \
  --args $TREASURY_ID 100000000000 0x6 \
  --gas-budget 10000000

# Check your certificate NFT
sui client objects
```

---

## Frontend Testing

### Local Development

```bash
# Start local server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000/invest.html
```

### Test Pages

| Page | URL | Purpose |
|------|-----|---------|
| Investor Portal | /investor.html | Main investment interface |
| Investment Calculator | /invest.html | Calculate equity & returns |
| Pitch Deck | /pitch-deck.html | Interactive presentation |
| Vesting Dashboard | /investor-vesting-dashboard.html | Track vested tokens |

### Browser Testing Checklist

- [ ] Wallet connection works
- [ ] Investment calculator updates correctly
- [ ] Progress bar shows real-time data
- [ ] Links navigate properly
- [ ] Mobile responsive
- [ ] No console errors

---

## Integration Testing

### End-to-End Flow

1. **User dials USSD**
   ```bash
   python3 test_ussd.py
   # Select option 2 (Full Booking Flow)
   ```

2. **Payment processed**
   - Mobile money deducted
   - AFC minted on Sui
   - Ticket NFT created

3. **Verify on blockchain**
   ```bash
   sui client object $TICKET_NFT_ID
   ```

4. **Check database**
   ```sql
   SELECT * FROM bookings WHERE phone_number = '+260975190740';
   ```

### Monitoring

```bash
# Railway.app logs
railway logs

# Sui transaction
sui client tx $TX_DIGEST

# Database queries
psql $DATABASE_URL -c "SELECT COUNT(*) FROM bookings;"
```

---

## Performance Benchmarks

### Expected Response Times

| Endpoint | Target | Acceptable | Slow |
|----------|--------|------------|------|
| USSD Initial | < 500ms | < 1000ms | > 3000ms |
| USSD Menu | < 300ms | < 800ms | > 2000ms |
| Sui Transaction | < 2s | < 5s | > 10s |
| AFC Mint | < 3s | < 7s | > 15s |

### Load Testing

```bash
# Run performance test
python3 test_ussd.py
# Select option 5

# Expected output:
# Average: 245.32ms
# Min: 198.45ms
# Max: 412.67ms
```

---

## CI/CD Testing

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test USSD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: pip install requests
      - name: Run USSD tests
        run: python3 test_ussd.py
        env:
          CALLBACK_URL: ${{ secrets.CALLBACK_URL }}
```

---

## Production Checklist

### Before Launch

- [ ] All tests passing
- [ ] USSD code registered with ZICTA/TCRA
- [ ] Smart contracts audited
- [ ] Railway.app environment variables set
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Error logging enabled
- [ ] Rate limiting configured
- [ ] IP whitelist active

### Launch Day

- [ ] Test USSD with real phone
- [ ] Monitor Railway.app logs
- [ ] Watch Sui transactions
- [ ] Track user feedback
- [ ] Have support team ready

### Post-Launch

- [ ] Daily health checks
- [ ] Weekly performance reviews
- [ ] Monthly security audits
- [ ] Quarterly load testing

---

## Support

**Technical Issues:**
- Email: tech@africarailways.com
- GitHub: https://github.com/mpolobe/africa-railways/issues

**USSD Testing:**
- Documentation: USSD_INTEGRATION_GUIDE.md
- Test Script: test_ussd.py

**Smart Contracts:**
- Documentation: INVESTOR_PORTAL_SETUP.md
- Deployment: move/arail_fundraising/deploy.sh

---

**Last Updated:** December 31, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
