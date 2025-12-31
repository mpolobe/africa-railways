# Sentinel Webhook Server

Webhook server that automatically activates user subscriptions when they complete mobile money payments.

## Features

- ✅ Real-time payment confirmation
- ✅ Automatic subscription activation
- ✅ SMS notifications
- ✅ Support for Flutterwave, MTN MoMo, Airtel Money
- ✅ Secure signature verification
- ✅ Database transaction safety
- ✅ Comprehensive logging

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/africa_railways

# Payment Gateway
PAYMENT_SECRET_HASH=your_flutterwave_secret_hash
FLW_SECRET_HASH=your_flutterwave_secret_hash
MTN_MOMO_API_KEY=your_mtn_api_key
AIRTEL_CLIENT_SECRET=your_airtel_secret

# SMS Provider (Africa's Talking)
SMS_PROVIDER=africas_talking
VITE_AFRICAS_TALKING_API_KEY=your_api_key
VITE_AFRICAS_TALKING_USERNAME=your_username

# OR Twilio
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_phone

# Server
PORT=3000
NODE_ENV=development
```

### 3. Run Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

### 4. Test Webhook

```bash
npm test
```

Or manually:
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
        "user_id": "user_123",
        "plan_id": "sentinel_trader"
      }
    }
  }'
```

## Endpoints

### POST /api/webhooks/sentinel-pay
Main webhook for Flutterwave payments

**Headers:**
- `verif-hash`: Your Flutterwave secret hash

**Body:**
```json
{
  "event": "charge.completed",
  "data": {
    "status": "successful",
    "tx_ref": "unique_transaction_id",
    "amount": 50,
    "currency": "ZMW",
    "customer": {
      "phone_number": "+260977123456",
      "email": "user@example.com"
    },
    "meta": {
      "user_id": "user_123",
      "plan_id": "sentinel_trader"
    }
  }
}
```

### POST /api/webhooks/mtn-momo
MTN Mobile Money direct webhook

### POST /api/webhooks/airtel-money
Airtel Money direct webhook

### GET /health
Health check endpoint

## Deployment

### Railway.app

1. Create new project on Railway
2. Connect GitHub repository
3. Set environment variables
4. Deploy

```bash
railway up
```

### Vercel (Serverless)

```bash
vercel --prod
```

### Docker

```bash
docker build -t sentinel-webhook .
docker run -p 3000:3000 --env-file .env sentinel-webhook
```

## Configure Payment Gateway

### Flutterwave

1. Go to [Flutterwave Dashboard](https://dashboard.flutterwave.com)
2. Navigate to Settings → Webhooks
3. Add webhook URL: `https://your-domain.com/api/webhooks/sentinel-pay`
4. Copy Secret Hash to `.env`

### MTN MoMo

1. Register at [MTN MoMo Developer Portal](https://momodeveloper.mtn.com)
2. Create API User
3. Subscribe to Collections API
4. Configure webhook URL
5. Add credentials to `.env`

### Airtel Money

1. Register at [Airtel Developer Portal](https://developers.airtel.africa)
2. Create application
3. Configure webhook URL
4. Add credentials to `.env`

## How It Works

```
┌─────────────┐
│   User      │
│  Enters PIN │
│  on Phone   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Payment    │
│  Gateway    │
│ (Flutterwave)│
└──────┬──────┘
       │ Webhook
       ▼
┌─────────────┐
│  Webhook    │
│  Server     │
│ (This App)  │
└──────┬──────┘
       │
       ├─► Verify Signature
       ├─► Update Database
       ├─► Activate Subscription
       └─► Send SMS
```

## Security

- ✅ Signature verification on all webhooks
- ✅ HTTPS required in production
- ✅ Database transactions for data integrity
- ✅ Rate limiting (recommended)
- ✅ IP whitelisting (optional)

## Monitoring

View logs:
```bash
tail -f logs/webhook.log
```

Check database:
```sql
SELECT * FROM subscriptions WHERE status = 'active' ORDER BY created_at DESC LIMIT 10;
SELECT * FROM transactions WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 10;
```

## Troubleshooting

### Webhook not receiving requests

1. Check firewall settings
2. Verify webhook URL in payment gateway dashboard
3. Check server logs: `npm run dev`
4. Test with curl command above

### Signature verification failing

1. Verify `PAYMENT_SECRET_HASH` matches gateway dashboard
2. Check header name: `verif-hash` for Flutterwave
3. Ensure no trailing spaces in environment variable

### Database connection issues

1. Verify `DATABASE_URL` is correct
2. Check database is running
3. Verify SSL settings for production

### SMS not sending

1. Check SMS provider credentials
2. Verify phone number format: `+260977123456`
3. Check SMS provider balance
4. Review logs for SMS errors

## Support

For issues or questions:
- Check logs: `npm run dev`
- Test webhook: `npm test`
- Review documentation: `/docs/PAYMENT_INTEGRATION_SPECS.md`
