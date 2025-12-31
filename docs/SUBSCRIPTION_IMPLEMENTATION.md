# Subscription Management Implementation Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install flutterwave-node-v3 node-cron
```

### 2. Environment Setup

```bash
# .env
FLW_PUBLIC_KEY=FLWPUBK-xxxxx
FLW_SECRET_KEY=FLWSECK-xxxxx
FLW_SECRET_HASH=your_webhook_secret
```

### 3. API Routes

```javascript
// backend/routes/subscriptions.js
const express = require('express');
const router = express.Router();
const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

// Initiate subscription
router.post('/initiate', async (req, res) => {
  const { plan_id, phone_number } = req.body;
  
  const payload = {
    tx_ref: `sub_${Date.now()}`,
    amount: 50,
    currency: "ZMW",
    payment_type: "mobilemoneyzambia",
    phone_number: phone_number
  };
  
  const response = await flw.MobileMoney.zambia(payload);
  res.json(response);
});

module.exports = router;
```

### 4. Mobile App Integration

```javascript
// SmartphoneApp/services/subscriptionService.js
export async function subscribeToplan(planId, phoneNumber) {
  const response = await fetch(`${API_URL}/subscriptions/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: planId, phone_number: phoneNumber })
  });
  return response.json();
}
```

## Testing Checklist

- [ ] Sandbox payment successful
- [ ] Webhook receives callback
- [ ] Subscription activated
- [ ] SMS sent
- [ ] Recurring billing works

## Production Deployment

1. Switch to production keys
2. Set up monitoring
3. Test with real ZMW 1 payment
4. Launch to beta users
