# Sentinel Subscription System - Complete Deployment Guide

## Overview

Complete subscription system for Africa Railways with:
- 3 Sentinel-branded plans (Trader, Commuter, Voyager)
- Mobile Money integration (MTN, Airtel, Zamtel)
- Real-time webhook activation
- SMS notifications
- Revenue tracking

## Architecture

```
┌──────────────┐
│ Mobile App   │ ──► Initiate Payment
│ (React Native)│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Backend API  │ ──► Create Transaction
│ (Go/Node.js) │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Flutterwave  │ ──► Send USSD/STK Push
│   Gateway    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ User's Phone │ ──► Enter PIN
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Webhook      │ ──► Activate Subscription
│  Server      │     Send SMS
└──────────────┘
```

## Step 1: Database Setup

### Run Migrations

```bash
# Navigate to backend
cd backend

# Run initial schema
psql $DATABASE_URL -f migrations/001_subscription_schema.sql

# Run Sentinel plans migration
psql $DATABASE_URL -f migrations/002_sentinel_plans.sql
```

### Verify Tables

```sql
-- Check plans
SELECT * FROM subscription_plans;

-- Should show:
-- sentinel_trader (ZMW 50)
-- sentinel_commuter (ZMW 120)
-- sentinel_voyager (ZMW 250)
```

## Step 2: Payment Gateway Setup

### Option A: Flutterwave (Recommended)

1. **Register Account**
   - Go to https://dashboard.flutterwave.com
   - Complete KYC verification
   - Enable Zambia Mobile Money

2. **Get API Keys**
   ```
   Settings → API Keys
   - Public Key: FLWPUBK-xxxxx
   - Secret Key: FLWSECK-xxxxx
   - Encryption Key: FLWSECK_TEST-xxxxx
   ```

3. **Configure Webhook**
   ```
   Settings → Webhooks
   URL: https://your-domain.com/api/webhooks/sentinel-pay
   Secret Hash: Generate and save
   ```

4. **Add to .env**
   ```bash
   FLW_PUBLIC_KEY=FLWPUBK-xxxxx
   FLW_SECRET_KEY=FLWSECK-xxxxx
   FLW_ENCRYPTION_KEY=FLWSECK_TEST-xxxxx
   FLW_SECRET_HASH=your_webhook_secret
   PAYMENT_SECRET_HASH=your_webhook_secret
   ```

### Option B: MTN MoMo Direct

1. Register at https://momodeveloper.mtn.com
2. Create API User and Key
3. Subscribe to Collections API
4. Add credentials to .env

### Option C: Airtel Money Direct

1. Register at https://developers.airtel.africa
2. Create application
3. Get client credentials
4. Add to .env

## Step 3: Webhook Server Deployment

### Local Development

```bash
cd server
npm install
npm run dev
```

### Production Deployment (Railway.app)

1. **Create Railway Project**
   ```bash
   railway login
   railway init
   ```

2. **Set Environment Variables**
   ```bash
   railway variables set DATABASE_URL="postgresql://..."
   railway variables set PAYMENT_SECRET_HASH="your_hash"
   railway variables set FLW_SECRET_HASH="your_hash"
   railway variables set VITE_AFRICAS_TALKING_API_KEY="your_key"
   railway variables set VITE_AFRICAS_TALKING_USERNAME="your_username"
   ```

3. **Deploy**
   ```bash
   railway up
   ```

4. **Get Webhook URL**
   ```bash
   railway domain
   # Returns: https://your-app.railway.app
   ```

5. **Update Flutterwave**
   - Go to Flutterwave Dashboard → Webhooks
   - Set URL: `https://your-app.railway.app/api/webhooks/sentinel-pay`

### Alternative: Vercel Deployment

```bash
cd server
vercel --prod
```

## Step 4: Mobile App Integration

### Update API Configuration

```javascript
// SmartphoneApp/services/subscriptionService.js
const API_BASE_URL = 'https://your-api-domain.com';
```

### Add Subscription Screens to Navigation

```javascript
// SmartphoneApp/navigation/AppNavigator.js
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SubscriptionCheckoutScreen from '../screens/SubscriptionCheckoutScreen';

// Add to stack
<Stack.Screen name="Subscription" component={SubscriptionScreen} />
<Stack.Screen name="SubscriptionCheckout" component={SubscriptionCheckoutScreen} />
```

### Build and Deploy

```bash
cd SmartphoneApp

# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

## Step 5: Testing

### Test Webhook Locally

```bash
cd server
npm test
```

### Test with Sandbox

```bash
curl -X POST http://localhost:3000/api/webhooks/sentinel-pay \
  -H "Content-Type: application/json" \
  -H "verif-hash: your_secret_hash" \
  -d '{
    "event": "charge.completed",
    "data": {
      "status": "successful",
      "tx_ref": "test_123",
      "amount": 50,
      "currency": "ZMW",
      "customer": {
        "phone_number": "+260977123456"
      },
      "meta": {
        "user_id": "test_user_123",
        "plan_id": "sentinel_trader"
      }
    }
  }'
```

### Test Real Payment (Sandbox)

1. Use Flutterwave test numbers:
   - MTN: +260763456789
   - Airtel: +260973456789
   - PIN: 1234

2. Initiate payment from mobile app
3. Check webhook logs
4. Verify subscription activated
5. Confirm SMS received

## Step 6: Production Launch

### Pre-Launch Checklist

- [ ] Database migrations completed
- [ ] Webhook server deployed and accessible
- [ ] Payment gateway configured (production keys)
- [ ] SMS provider configured and tested
- [ ] Mobile app updated with production API URLs
- [ ] Test payment completed successfully
- [ ] Monitoring and logging configured
- [ ] Error alerting set up

### Switch to Production

1. **Update Environment Variables**
   ```bash
   # Remove 'test' from keys
   FLW_PUBLIC_KEY=FLWPUBK-xxxxx  # Production key
   FLW_SECRET_KEY=FLWSECK-xxxxx  # Production key
   NODE_ENV=production
   ```

2. **Update Webhook URL**
   - Flutterwave Dashboard → Webhooks
   - Change to production URL
   - Verify secret hash matches

3. **Test with Real ZMW 1**
   - Make small test payment
   - Verify activation
   - Check SMS delivery
   - Confirm database update

### Launch Strategy

**Week 1: Soft Launch**
- Target: 100 users
- Focus: Dar es Salaam commuters
- Offer: 50% discount code (COMMUTER50)
- Monitor: Payment success rate, activation time

**Week 2-4: Beta Expansion**
- Target: 500 users
- Focus: Cross-border traders
- Offer: Free trial extension (60 days)
- Monitor: Churn rate, support tickets

**Month 2: Public Launch**
- Target: 2,000 users
- Marketing: Social media, station posters
- Partnerships: Trader associations
- Monitor: Growth rate, revenue

## Step 7: Monitoring

### Key Metrics to Track

```sql
-- Daily active subscriptions
SELECT COUNT(*) FROM subscriptions WHERE status = 'active';

-- Revenue today
SELECT SUM(amount) FROM transactions 
WHERE status = 'completed' 
AND DATE(completed_at) = CURRENT_DATE;

-- Payment success rate
SELECT 
  COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as success_rate
FROM transactions
WHERE created_at > NOW() - INTERVAL '7 days';

-- Top plans
SELECT 
  plan_id,
  COUNT(*) as subscribers,
  SUM(sp.price) as monthly_revenue
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.status = 'active'
GROUP BY plan_id, sp.price
ORDER BY subscribers DESC;
```

### Set Up Alerts

```bash
# Monitor webhook health
curl https://your-webhook-url.com/health

# Expected response:
{
  "status": "ok",
  "service": "sentinel-webhook-server",
  "timestamp": "2025-12-31T00:00:00.000Z"
}
```

## Step 8: Marketing Materials

### SMS Campaign Templates

**Trader Campaign:**
```
🚂 Tired of queuing? Subscribe to Sentinel Trader for ZMW 50/month. 
Unlimited bookings + priority luggage tracking. 
Download: bit.ly/sentinel-app
```

**Commuter Campaign:**
```
🚌 Daily rider? Get Sentinel Commuter for ZMW 120/month. 
Unlimited trips + Quick Scan QR bypass. Save ZMW 250/month!
Download: bit.ly/sentinel-app
```

**Tourist Campaign:**
```
✈️ Visiting Victoria Falls? Get Sentinel Voyager pass (ZMW 250). 
First Class lounge + tour discounts included!
Book: bit.ly/sentinel-app
```

### Station Posters

Create QR codes linking to:
- App download: https://africorailways.com/download
- Subscription info: https://africorailways.com/plans
- Support: https://africorailways.com/support

## Troubleshooting

### Webhook Not Receiving Requests

1. Check firewall/security groups
2. Verify URL in payment gateway
3. Test with curl command
4. Check server logs

### Payment Successful but Subscription Not Activated

1. Check webhook logs
2. Verify database connection
3. Check transaction metadata (user_id, plan_id)
4. Manually activate if needed:
   ```sql
   UPDATE transactions SET status = 'completed' WHERE transaction_id = 'xxx';
   -- Then trigger activation manually
   ```

### SMS Not Sending

1. Check SMS provider balance
2. Verify phone number format
3. Check API credentials
4. Review SMS service logs

## Support

### Documentation
- Payment Integration: `/docs/PAYMENT_INTEGRATION_SPECS.md`
- UI Mockups: `/docs/SUBSCRIPTION_UI_MOCKUP.md`
- Financial Model: `/docs/SENTINEL_FINANCIAL_MODEL.html`
- API Docs: `/docs/SUBSCRIPTION_API.md`

### Contact
- Technical Issues: Create GitHub issue
- Payment Issues: Check Flutterwave dashboard
- SMS Issues: Check Africa's Talking dashboard

## Revenue Projections

At 5% market penetration of 3.4M TAZARA users:

- **Month 1:** ~ZMW 150,000 ($7,900 USD)
- **Month 12:** ~ZMW 850,000 ($44,700 USD)
- **Year 1 Total:** ~ZMW 4.5M ($237,000 USD)

View interactive model: `open docs/SENTINEL_FINANCIAL_MODEL.html`

## Next Steps

1. ✅ Run setup script: `./scripts/setup_subscription_api.sh`
2. ✅ Deploy webhook server
3. ✅ Configure payment gateway
4. ✅ Test end-to-end flow
5. ✅ Launch beta program
6. ✅ Monitor and optimize
7. ✅ Scale marketing

---

**Ready to launch!** 🚀

For questions or support, review the documentation or create an issue on GitHub.
