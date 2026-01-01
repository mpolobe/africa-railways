# 📱 Twilio SMS Setup Guide

## Overview

Complete guide to setting up Twilio SMS for the Africa Railways onboarding system.

---

## 🎯 Your Twilio Credentials

```bash
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_MESSAGING_SERVICE_SID="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="[Your Auth Token - Keep Secret!]"
```

---

## 🚀 Quick Setup (Gitpod)

### Option 1: Automated Setup Script

```bash
# Run the setup script
./setup-twilio.sh

# Follow the prompts to enter your Auth Token
```

### Option 2: Manual Setup

```bash
# Set Account SID
gp env TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Set Messaging Service SID
gp env TWILIO_MESSAGING_SERVICE_SID="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Set Auth Token (run this manually to paste your token)
gp env TWILIO_AUTH_TOKEN="your_actual_auth_token_here"

# Set Phone Number (if you have one)
gp env TWILIO_NUMBER="+15551234567"
```

### Restart Terminal

```bash
# After setting environment variables, restart terminal or run:
source ~/.bashrc
```

---

## 📝 Update Backend Configuration

### Create/Update `backend/.env`

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_NUMBER=+15551234567  # Optional if using Messaging Service

# SMS Provider Selection
SMS_PROVIDER=twilio

# Africa's Talking (Optional - for fallback)
AT_USERNAME=sandbox
AT_API_KEY=your_api_key_here
AT_SENDER_ID=SOVEREIGN
```

---

## 🧪 Test Your Setup

### Step 1: Install Dependencies

```bash
cd backend
go get github.com/twilio/twilio-go
go get github.com/joho/godotenv
```

### Step 2: Run Test Script

```bash
cd backend
go run test_twilio.go

# Follow prompts:
# 1. Enter test phone number (e.g., +254712345678)
# 2. Check your phone for test message
```

### Expected Output

```
🧪 Testing Twilio SMS Configuration
==================================================

📋 Configuration Check:
==================================================
✅ Account SID: AC683da1...8f4c3
✅ Auth Token: abcd...xyz
✅ Messaging Service SID: MG9457cb...8f1c1
✅ From Number: +15551234567

📱 Enter test phone number (e.g., +254712345678): +254712345678
✅ Phone number validated: +254****78

🔧 Initializing Twilio Client...

📤 Sending Test SMS...
==================================================
To: +254****78
Message: 🧪 Test from Africa Railways!
Your Twilio SMS integration is working correctly.
Welcome to Sovereign Hub!
Using Messaging Service: MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

✅ SMS Sent Successfully!
==================================================
Message SID: SM1234567890abcdef
Status: queued
To: +254712345678
Price: -0.0550 USD

📊 Delivery Status:
==================================================
📬 Message queued for delivery

💰 Cost Information:
==================================================
Provider: twilio
Estimated Cost: $0.0550
Actual Cost: -0.0550 USD

🎉 Test Complete!
==================================================
✅ Twilio SMS integration is working correctly

📋 Next Steps:
1. Check your phone for the test message
2. View delivery details in Twilio Console:
   https://console.twilio.com/us1/monitor/logs/sms/SM1234567890abcdef
3. Start the onboarding server: make dev
4. Test the complete flow at: http://localhost:8082/onboarding.html
```

---

## 🔧 Twilio Console Setup

### 1. Get Your Auth Token

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Account → API Keys & Tokens**
3. Find your **Auth Token** (click "Show" to reveal)
4. Copy and save securely

### 2. Messaging Service (Recommended)

**Why use Messaging Service?**
- No need to purchase phone numbers
- Better deliverability
- Automatic number pool management
- Easier scaling

**Your Messaging Service:**
```
SID: MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**To view/configure:**
1. Go to **Messaging → Services**
2. Click on your service
3. Verify it's active and has sender pool configured

### 3. Phone Number (Alternative)

If not using Messaging Service:

1. Go to **Phone Numbers → Manage → Buy a number**
2. Select country and capabilities (SMS)
3. Purchase number (~$1/month)
4. Set `TWILIO_NUMBER` environment variable

---

## 💻 Code Integration

### Using Messaging Service (Recommended)

```go
package main

import (
    "os"
    "github.com/twilio/twilio-go"
    openapi "github.com/twilio/twilio-go/rest/api/v2010"
)

func sendSMS(to, message string) error {
    client := twilio.NewRestClient()
    
    params := &openapi.CreateMessageParams{}
    params.SetTo(to)
    params.SetBody(message)
    params.SetMessagingServiceSid(os.Getenv("TWILIO_MESSAGING_SERVICE_SID"))
    
    resp, err := client.Api.CreateMessage(params)
    if err != nil {
        return err
    }
    
    log.Printf("✅ SMS sent: %s", *resp.Sid)
    return nil
}
```

### Using Phone Number

```go
func sendSMS(to, message string) error {
    client := twilio.NewRestClient()
    
    params := &openapi.CreateMessageParams{}
    params.SetTo(to)
    params.SetFrom(os.Getenv("TWILIO_NUMBER"))
    params.SetBody(message)
    
    resp, err := client.Api.CreateMessage(params)
    if err != nil {
        return err
    }
    
    log.Printf("✅ SMS sent: %s", *resp.Sid)
    return nil
}
```

---

## 🔍 Troubleshooting

### Error: "Authenticate"

**Problem:** Invalid Auth Token

**Solution:**
```bash
# Verify Auth Token is correct
echo $TWILIO_AUTH_TOKEN

# Update if needed
gp env TWILIO_AUTH_TOKEN="correct_token_here"
```

### Error: "The 'To' number is not a valid phone number"

**Problem:** Invalid phone format

**Solution:**
- Use E.164 format: `+[country code][number]`
- Example: `+254712345678` (Kenya)
- Example: `+15551234567` (USA)

### Error: "Trial account"

**Problem:** Trial accounts can only send to verified numbers

**Solution:**
1. Go to **Phone Numbers → Manage → Verified Caller IDs**
2. Add and verify your test number
3. Or upgrade to paid account

### Error: "Insufficient funds"

**Problem:** No credits in account

**Solution:**
1. Go to **Billing → Add Funds**
2. Add at least $20
3. Retry sending

### Error: "Messaging Service not found"

**Problem:** Invalid Messaging Service SID

**Solution:**
```bash
# Verify Messaging Service SID
gp env TWILIO_MESSAGING_SERVICE_SID="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Or use phone number instead
gp env TWILIO_NUMBER="+15551234567"
```

---

## 💰 Pricing

### SMS Costs by Country

| Country | Cost per SMS | 1000 SMS |
|---------|-------------|----------|
| USA     | $0.0079     | $7.90    |
| Kenya   | $0.0550     | $55.00   |
| Nigeria | $0.0550     | $55.00   |
| UK      | $0.0400     | $40.00   |
| India   | $0.0070     | $7.00    |

### Monthly Estimate

**Scenario: 1000 users/month, 2 SMS each**
- 2000 SMS × $0.055 (Kenya) = **$110/month**

**Cost Optimization:**
- Use Africa's Talking for African numbers (85% cheaper)
- Implement fallback to Twilio for global reach

---

## 🔐 Security Best Practices

### 1. Never Commit Credentials

```bash
# .gitignore
.env
*.env
.env.*
```

### 2. Use Environment Variables

```bash
# Good ✅
TWILIO_AUTH_TOKEN=$(gp env TWILIO_AUTH_TOKEN)

# Bad ❌
TWILIO_AUTH_TOKEN="hardcoded_token"
```

### 3. Rotate Tokens Regularly

1. Generate new Auth Token in Twilio Console
2. Update environment variables
3. Delete old token

### 4. Monitor Usage

1. Set up usage alerts in Twilio Console
2. Monitor for unusual activity
3. Review logs regularly

---

## 📊 Monitoring & Logs

### View SMS Logs

1. Go to [Twilio Console → Monitor → Logs → SMS](https://console.twilio.com/us1/monitor/logs/sms)
2. Filter by date, status, or phone number
3. Click message SID for details

### Webhook for Delivery Reports

```go
// Setup webhook endpoint
http.HandleFunc("/sms/status", func(w http.ResponseWriter, r *http.Request) {
    messageSID := r.FormValue("MessageSid")
    status := r.FormValue("MessageStatus")
    
    log.Printf("SMS %s: %s", messageSID, status)
    
    // Update database
    // Send notifications
})
```

**Configure in Twilio:**
1. Go to **Messaging → Settings → Webhooks**
2. Set Status Callback URL: `https://your-domain.com/sms/status`

---

## 🚀 Production Deployment

### Checklist

- [ ] Auth Token secured in environment variables
- [ ] Messaging Service configured
- [ ] Webhooks set up for delivery reports
- [ ] Usage alerts configured
- [ ] Billing alerts set
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Rate limiting enabled
- [ ] Cost monitoring active

### Environment Variables

```bash
# Production
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_MESSAGING_SERVICE_SID="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="production_token_here"
export SMS_PROVIDER="twilio"
```

---

## 📚 Additional Resources

### Twilio Documentation
- [SMS Quickstart](https://www.twilio.com/docs/sms/quickstart)
- [Go SDK](https://github.com/twilio/twilio-go)
- [Messaging Services](https://www.twilio.com/docs/messaging/services)
- [Error Codes](https://www.twilio.com/docs/api/errors)

### Support
- [Twilio Support](https://support.twilio.com)
- [Community Forum](https://www.twilio.com/community)
- [Status Page](https://status.twilio.com)

---

## 🎉 Success!

Your Twilio SMS integration is now ready for:
- ✅ User onboarding with OTP
- ✅ Ticket confirmations
- ✅ Wallet notifications
- ✅ Low balance alerts
- ✅ Welcome messages

**Next Steps:**
1. Test the complete onboarding flow
2. Configure Africa's Talking for cost savings
3. Set up monitoring and alerts
4. Deploy to production

---

**Last Updated**: 2025-12-22  
**Version**: 1.0  
**Maintained By**: Africa Railways Team
