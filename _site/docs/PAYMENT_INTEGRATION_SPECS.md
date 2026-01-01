# Payment Integration Technical Specifications

## Overview
Integration specifications for MTN Mobile Money and Airtel Money payment gateways for subscription and one-time payments in Zambia.

## MTN Mobile Money (MoMo) API Integration

### API Provider Options

#### Option 1: MTN MoMo API (Direct)
**Endpoint:** `https://momodeveloper.mtn.com/`

**Authentication:**
- OAuth 2.0
- API User ID and API Key required
- Subscription Key (Primary/Secondary)

**Environment:**
- Sandbox: `https://sandbox.momodeveloper.mtn.com`
- Production: `https://momodeveloper.mtn.com`

**Required Credentials:**
```json
{
  "mtn_api_user": "UUID",
  "mtn_api_key": "string",
  "mtn_subscription_key": "string",
  "mtn_callback_url": "https://your-domain.com/api/mtn/callback"
}
```

#### Option 2: Flutterwave (Aggregator - RECOMMENDED)
**Why Flutterwave:**
- Single integration for MTN, Airtel, Zamtel
- Better error handling
- Automatic reconciliation
- Lower technical complexity
- Production-ready webhooks

**Endpoint:** `https://api.flutterwave.com/v3`

**Authentication:**
```bash
Authorization: Bearer YOUR_SECRET_KEY
```

**Required Credentials:**
```json
{
  "flutterwave_public_key": "FLWPUBK-xxxxx",
  "flutterwave_secret_key": "FLWSECK-xxxxx",
  "flutterwave_encryption_key": "FLWSECK_TESTxxxxx"
}
```

### Payment Flow Architecture

```
┌─────────────┐
│   Mobile    │
│     App     │
└──────┬──────┘
       │ 1. Initiate Payment
       ▼
┌─────────────┐
│   Backend   │
│   Server    │
└──────┬──────┘
       │ 2. Create Payment Request
       ▼
┌─────────────┐
│ Flutterwave │
│     API     │
└──────┬──────┘
       │ 3. Send USSD/STK Push
       ▼
┌─────────────┐
│ MTN/Airtel  │
│   Gateway   │
└──────┬──────┘
       │ 4. User Approves
       ▼
┌─────────────┐
│   Webhook   │
│  Callback   │
└──────┬──────┘
       │ 5. Update Subscription
       ▼
┌─────────────┐
│  Database   │
└─────────────┘
```

## Implementation Details

### 1. Initiate Subscription Payment (Mobile App)

**Endpoint:** `POST /api/subscriptions/initiate`

**Request:**
```json
{
  "user_id": "user_123",
  "plan_id": "trader_pro",
  "payment_method": "mtn_momo",
  "phone_number": "+260977123456",
  "amount": 50.00,
  "currency": "ZMW"
}
```

**Response:**
```json
{
  "status": "pending",
  "transaction_id": "txn_abc123",
  "payment_url": "https://checkout.flutterwave.com/...",
  "message": "Check your phone for payment prompt"
}
```

### 2. Backend Payment Processing (Node.js/Express)

```javascript
// backend/routes/subscriptions.js

const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

async function initiateSubscriptionPayment(req, res) {
  const { user_id, plan_id, payment_method, phone_number, amount } = req.body;
  
  try {
    // Create payment payload
    const payload = {
      tx_ref: `sub_${Date.now()}_${user_id}`,
      amount: amount,
      currency: "ZMW",
      payment_type: "mobilemoneyzambia",
      phone_number: phone_number,
      email: req.user.email || `${user_id}@africorailways.com`,
      redirect_url: `${process.env.APP_URL}/payment/callback`,
      meta: {
        user_id: user_id,
        plan_id: plan_id,
        subscription: true
      },
      customer: {
        email: req.user.email,
        phonenumber: phone_number,
        name: req.user.name
      },
      customizations: {
        title: "Africa Railways Subscription",
        description: `${plan_id} Monthly Subscription`,
        logo: "https://africorailways.com/logo.png"
      }
    };

    // Initiate payment
    const response = await flw.MobileMoney.zambia(payload);
    
    // Store transaction in database
    await db.transactions.create({
      transaction_id: response.data.tx_ref,
      user_id: user_id,
      amount: amount,
      status: 'pending',
      payment_method: payment_method,
      plan_id: plan_id,
      created_at: new Date()
    });

    res.json({
      status: 'pending',
      transaction_id: response.data.tx_ref,
      message: 'Check your phone for payment prompt'
    });
    
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
}
```

### 3. Webhook Handler (Payment Confirmation)

```javascript
// backend/routes/webhooks.js

const crypto = require('crypto');

async function handleFlutterwaveWebhook(req, res) {
  // Verify webhook signature
  const secretHash = process.env.FLW_SECRET_HASH;
  const signature = req.headers["verif-hash"];
  
  if (!signature || signature !== secretHash) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const payload = req.body;
  
  // Handle successful payment
  if (payload.event === "charge.completed" && payload.data.status === "successful") {
    const { tx_ref, amount, customer, meta } = payload.data;
    
    try {
      // Update transaction status
      await db.transactions.update({
        transaction_id: tx_ref,
        status: 'completed',
        completed_at: new Date()
      });
      
      // Activate subscription
      await db.subscriptions.create({
        user_id: meta.user_id,
        plan_id: meta.plan_id,
        status: 'active',
        start_date: new Date(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        payment_method: 'mtn_momo',
        phone_number: customer.phone_number
      });
      
      // Send confirmation SMS
      await sendSMS(customer.phone_number, 
        `Your ${meta.plan_id} subscription is now active! Next billing: ${formatDate(nextBillingDate)}`
      );
      
      // Send push notification
      await sendPushNotification(meta.user_id, {
        title: 'Subscription Active',
        body: 'Your subscription payment was successful!'
      });
      
      res.status(200).json({ status: 'success' });
      
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Processing failed' });
    }
  }
  
  res.status(200).json({ status: 'received' });
}
```

### 4. Recurring Billing (Cron Job)

```javascript
// backend/jobs/recurring-billing.js

const cron = require('node-cron');

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running recurring billing check...');
  
  // Find subscriptions due for renewal
  const dueSubscriptions = await db.subscriptions.findAll({
    where: {
      status: 'active',
      next_billing_date: {
        lte: new Date()
      }
    }
  });
  
  for (const subscription of dueSubscriptions) {
    try {
      // Get plan details
      const plan = await db.plans.findById(subscription.plan_id);
      
      // Initiate payment
      const payload = {
        tx_ref: `renewal_${Date.now()}_${subscription.user_id}`,
        amount: plan.price,
        currency: "ZMW",
        payment_type: "mobilemoneyzambia",
        phone_number: subscription.phone_number,
        email: subscription.user.email,
        meta: {
          user_id: subscription.user_id,
          plan_id: subscription.plan_id,
          subscription_id: subscription.id,
          renewal: true
        }
      };
      
      const response = await flw.MobileMoney.zambia(payload);
      
      // Update subscription status
      await subscription.update({
        status: 'pending_renewal',
        last_billing_attempt: new Date()
      });
      
      // Send SMS reminder
      await sendSMS(subscription.phone_number,
        `Your ${plan.name} subscription renewal of ZMW ${plan.price} is being processed. Check your phone to approve.`
      );
      
    } catch (error) {
      console.error(`Renewal failed for subscription ${subscription.id}:`, error);
      
      // Handle failed renewal
      await subscription.update({
        status: 'payment_failed',
        failed_attempts: subscription.failed_attempts + 1
      });
      
      // Suspend after 3 failed attempts
      if (subscription.failed_attempts >= 3) {
        await subscription.update({ status: 'suspended' });
        await sendSMS(subscription.phone_number,
          `Your subscription has been suspended due to payment failure. Please update your payment method.`
        );
      }
    }
  }
});
```

## Airtel Money Integration

### Using Flutterwave (Same as MTN)

Flutterwave handles both MTN and Airtel Money with the same API:

```javascript
const payload = {
  tx_ref: `txn_${Date.now()}`,
  amount: 50,
  currency: "ZMW",
  payment_type: "mobilemoneyzambia", // Same for both
  phone_number: "+260977123456", // Flutterwave auto-detects network
  // ... rest of payload
};

const response = await flw.MobileMoney.zambia(payload);
```

**Network Detection:**
- MTN: 096, 076, 077
- Airtel: 097, 077
- Zamtel: 095

## Database Schema

```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  plan_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- active, suspended, cancelled, pending_renewal
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  next_billing_date TIMESTAMP NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZMW',
  status VARCHAR(20) NOT NULL, -- pending, completed, failed
  payment_method VARCHAR(20) NOT NULL,
  payment_provider VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Plans table
CREATE TABLE subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZMW',
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  features JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (id, name, description, price, features) VALUES
('trader_pro', 'Trader Pro', 'For cross-border traders', 50.00, 
  '{"unlimited_bookings": true, "priority_support": true, "sms_notifications": true}'::jsonb),
('commuter', 'Commuter', 'For daily commuters', 50.00,
  '{"unlimited_bookings": true, "quick_booking": true, "sms_notifications": true}'::jsonb),
('tourist', 'Tourist', 'For occasional travelers', 80.00,
  '{"unlimited_bookings": true, "travel_insurance": true, "hotel_discounts": true}'::jsonb);
```

## Environment Variables

```bash
# Flutterwave
FLW_PUBLIC_KEY=FLWPUBK-xxxxx
FLW_SECRET_KEY=FLWSECK-xxxxx
FLW_ENCRYPTION_KEY=FLWSECK_TESTxxxxx
FLW_SECRET_HASH=your_webhook_secret

# App URLs
APP_URL=https://africorailways.com
API_URL=https://api.africorailways.com

# SMS (Twilio/Africa's Talking)
SMS_API_KEY=xxxxx
SMS_SENDER_ID=AfricaRail

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

## Testing

### Sandbox Test Numbers (Flutterwave)

**MTN Mobile Money:**
- Phone: +260763456789
- PIN: 1234
- OTP: 123456

**Airtel Money:**
- Phone: +260973456789
- PIN: 1234

### Test Scenarios

1. **Successful Payment:**
```bash
curl -X POST https://api.africorailways.com/api/subscriptions/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "plan_id": "trader_pro",
    "payment_method": "mtn_momo",
    "phone_number": "+260763456789",
    "amount": 50.00
  }'
```

2. **Failed Payment:**
- Use invalid phone number
- Verify error handling

3. **Webhook Testing:**
```bash
curl -X POST https://api.africorailways.com/api/webhooks/flutterwave \
  -H "Content-Type: application/json" \
  -H "verif-hash: YOUR_SECRET_HASH" \
  -d @webhook-payload.json
```

## Security Considerations

1. **Webhook Verification:**
   - Always verify webhook signatures
   - Use HTTPS only
   - Implement rate limiting

2. **PCI Compliance:**
   - Never store card details
   - Use tokenization for recurring payments
   - Log all transactions

3. **Phone Number Validation:**
   - Verify Zambian format (+260...)
   - Detect network provider
   - Validate before payment

4. **Idempotency:**
   - Use unique transaction IDs
   - Handle duplicate webhooks
   - Implement retry logic

## Error Handling

```javascript
const ERROR_CODES = {
  'INSUFFICIENT_FUNDS': 'Insufficient balance. Please top up and try again.',
  'INVALID_PHONE': 'Invalid phone number. Please check and try again.',
  'NETWORK_ERROR': 'Network error. Please try again.',
  'PAYMENT_DECLINED': 'Payment declined. Please contact your provider.',
  'TIMEOUT': 'Payment timeout. Please try again.'
};

function handlePaymentError(error) {
  const userMessage = ERROR_CODES[error.code] || 'Payment failed. Please try again.';
  
  // Log for debugging
  console.error('Payment error:', {
    code: error.code,
    message: error.message,
    timestamp: new Date()
  });
  
  // Send user-friendly message
  return {
    status: 'error',
    message: userMessage
  };
}
```

## Monitoring & Analytics

Track these metrics:

1. **Payment Success Rate:** Target >95%
2. **Average Payment Time:** Target <30 seconds
3. **Failed Renewal Rate:** Target <5%
4. **Churn Rate:** Track monthly
5. **Revenue Per User:** Track by plan

## Next Steps

1. Register for Flutterwave account
2. Complete KYC verification
3. Get API credentials
4. Set up webhook endpoint
5. Test in sandbox
6. Deploy to production
7. Monitor first 100 transactions closely
