# 📱 SMS Notifications Setup Guide

## Quick Start

### Step 1: Install Go Dependencies

```bash
cd /workspaces/africa-railways/backend
go get github.com/tech-kenya/africastalkingsms
go get github.com/twilio/twilio-go
```

### Step 2: Configure Environment

Add to `backend/.env`:

```bash
# Choose your SMS provider
SMS_PROVIDER=africastalking  # or 'twilio'

# Africa's Talking (Recommended for African markets)
AT_USERNAME=sandbox  # or your production username
AT_API_KEY=your_api_key_here
AT_SENDER_ID=AFRICARAIL

# Twilio (For global reach)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

### Step 3: Test SMS Integration

```bash
cd backend/sms
go run test_sms.go
```

---

## 🌍 Provider Selection Guide

### Use Africa's Talking When:
- ✅ Targeting African markets (Kenya, Uganda, Tanzania, Nigeria, Ghana)
- ✅ Need cost-effective SMS ($0.008 - $0.015 per SMS)
- ✅ Want Mobile Money integration
- ✅ Prefer local support and infrastructure

### Use Twilio When:
- ✅ Need global reach beyond Africa
- ✅ Require advanced features (MMS, WhatsApp, Voice)
- ✅ Want enterprise-grade reliability
- ✅ Need extensive API features

### Hybrid Approach (Recommended):
```go
// Route based on phone number
func selectProvider(phoneNumber string) string {
    africanPrefixes := []string{"+254", "+256", "+255", "+234", "+233"}
    
    for _, prefix := range africanPrefixes {
        if strings.HasPrefix(phoneNumber, prefix) {
            return "africastalking"
        }
    }
    
    return "twilio"
}
```

---

## 🎯 Notification Triggers

### Automatic SMS Notifications

**1. Ticket Purchase**
```
Trigger: User books ticket
Message: "🎟️ Ticket Confirmed! Route: X → Y, Amount: 50 AFRC"
```

**2. Wallet Top-Up**
```
Trigger: User adds funds
Message: "💳 Top-Up Successful! +500 AFRC, Balance: 1750 AFRC"
```

**3. Low Balance Warning**
```
Trigger: Balance < 100 AFRC
Message: "⚠️ Low Balance: 50 AFRC. Top up to continue booking."
```

**4. Welcome Message**
```
Trigger: New user registration
Message: "🚂 Welcome! Your wallet is ready with 1,250 AFRC."
```

**5. Daily Digest**
```
Trigger: End of day (scheduled)
Message: "📊 Today: 5 tickets, 250 AFRC spent, Balance: 1000 AFRC"
```

---

## 💻 Backend Integration

### Update Main Server

```go
// backend/main.go
package main

import (
    "github.com/mpolobe/africa-railways/backend/sms"
    "log"
    "net/http"
    "os"
)

var notifier *sms.NotificationService

func init() {
    // Initialize SMS service
    provider := os.Getenv("SMS_PROVIDER")
    if provider == "" {
        provider = "africastalking"
    }
    notifier = sms.NewNotificationService(provider)
    log.Printf("📱 SMS service initialized with provider: %s", provider)
}

func main() {
    http.HandleFunc("/add-event", handleAddEvent)
    http.HandleFunc("/wallet/topup", handleWalletTopUp)
    
    log.Println("🚀 Server starting on :8080")
    http.ListenAndServe(":8080", nil)
}

func handleAddEvent(w http.ResponseWriter, r *http.Request) {
    // Parse request
    var event struct {
        Message     string `json:"message"`
        PhoneNumber string `json:"phone_number,omitempty"`
    }
    
    json.NewDecoder(r.Body).Decode(&event)
    
    // Broadcast event (existing logic)
    hub.Broadcast(event.Message)
    
    // Send SMS if phone number provided
    if event.PhoneNumber != "" {
        go func() {
            // Extract route and amount from message
            if strings.Contains(event.Message, "Ticket Confirmed") {
                err := notifier.SendTicketConfirmation(
                    event.PhoneNumber,
                    "Lusaka → Dar es Salaam", // Parse from message
                    50,
                )
                if err != nil {
                    log.Printf("❌ SMS failed: %v", err)
                } else {
                    log.Printf("✅ SMS sent to %s", event.PhoneNumber)
                }
            }
        }()
    }
    
    w.WriteHeader(http.StatusOK)
}
```

---

## 🧪 Testing

### Test with Sandbox

**Africa's Talking Sandbox:**
```bash
AT_USERNAME=sandbox
AT_API_KEY=your_sandbox_key
```
- Free testing environment
- No real SMS sent
- Check delivery in dashboard

**Twilio Trial:**
```bash
TWILIO_ACCOUNT_SID=your_trial_sid
TWILIO_AUTH_TOKEN=your_trial_token
```
- $15 free credit
- Can only send to verified numbers
- Real SMS delivery

### Test Script

```bash
# Create test file
cat > backend/sms/test_sms.go << 'EOF'
package main

import (
    "log"
    "os"
    "github.com/joho/godotenv"
    "github.com/mpolobe/africa-railways/backend/sms"
)

func main() {
    // Load environment
    godotenv.Load("../.env")
    
    // Initialize service
    provider := os.Getenv("SMS_PROVIDER")
    notifier := sms.NewNotificationService(provider)
    
    // Your test phone number
    testPhone := "+254712345678" // Replace with your number
    
    // Test 1: Ticket Confirmation
    log.Println("📱 Test 1: Ticket Confirmation")
    err := notifier.SendTicketConfirmation(testPhone, "Nairobi → Mombasa", 50)
    if err != nil {
        log.Printf("❌ Failed: %v", err)
    } else {
        log.Println("✅ Success")
    }
    
    // Test 2: Wallet Top-Up
    log.Println("📱 Test 2: Wallet Top-Up")
    err = notifier.SendWalletTopUp(testPhone, 500, 1750)
    if err != nil {
        log.Printf("❌ Failed: %v", err)
    } else {
        log.Println("✅ Success")
    }
    
    log.Println("🎉 All tests complete!")
}
EOF

# Run tests
cd backend/sms
go run test_sms.go
```

---

## 📊 Cost Estimation

### Africa's Talking Pricing

| Country | Cost per SMS | 1000 SMS | 10,000 SMS |
|---------|-------------|----------|------------|
| Kenya   | $0.008      | $8       | $80        |
| Uganda  | $0.010      | $10      | $100       |
| Tanzania| $0.012      | $12      | $120       |
| Nigeria | $0.015      | $15      | $150       |

### Twilio Pricing

| Country | Cost per SMS | 1000 SMS | 10,000 SMS |
|---------|-------------|----------|------------|
| USA     | $0.0079     | $7.90    | $79        |
| Kenya   | $0.0550     | $55      | $550       |
| UK      | $0.0400     | $40      | $400       |

### Monthly Cost Estimate

**Scenario: 1000 active users**
- 2 SMS per user per day (ticket + top-up)
- 2000 SMS/day × 30 days = 60,000 SMS/month

**Using Africa's Talking (Kenya):**
- 60,000 × $0.008 = **$480/month**

**Using Twilio (Kenya):**
- 60,000 × $0.055 = **$3,300/month**

**Savings: $2,820/month with Africa's Talking**

---

## 🔐 Security Checklist

- [ ] API keys stored in environment variables
- [ ] `.env` file in `.gitignore`
- [ ] Rate limiting implemented (10 SMS/hour per user)
- [ ] Phone number validation
- [ ] Opt-out mechanism for users
- [ ] SMS logs for audit trail
- [ ] Webhook signature verification
- [ ] HTTPS for all API calls

---

## 🚀 Production Deployment

### 1. Get Production Credentials

**Africa's Talking:**
1. Sign up at [africastalking.com](https://africastalking.com)
2. Verify your account
3. Add credits ($10 minimum)
4. Get production API key
5. Register sender ID (takes 1-2 days)

**Twilio:**
1. Sign up at [twilio.com](https://twilio.com)
2. Verify your account
3. Add credits ($20 minimum)
4. Purchase phone number ($1/month)
5. Get Account SID and Auth Token

### 2. Update Production Environment

```bash
# Production .env
SMS_PROVIDER=africastalking
AT_USERNAME=your_production_username
AT_API_KEY=prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AT_SENDER_ID=AFRICARAIL
```

### 3. Configure Webhooks

**Africa's Talking:**
- Dashboard → SMS → Delivery Reports
- Set callback URL: `https://your-domain.com/sms/delivery`

**Twilio:**
- Console → Messaging → Settings → Webhooks
- Status Callback URL: `https://your-domain.com/sms/status`

### 4. Monitor and Scale

```go
// Add monitoring
func sendSMSWithMonitoring(phone, message string) error {
    start := time.Now()
    err := notifier.SendSMS(phone, message)
    duration := time.Since(start)
    
    // Log metrics
    metrics.RecordSMS(err == nil, duration)
    
    return err
}
```

---

## 🔄 Maintenance

### Daily Tasks
- [ ] Check SMS delivery rates
- [ ] Monitor costs
- [ ] Review failed deliveries

### Weekly Tasks
- [ ] Analyze SMS patterns
- [ ] Optimize message templates
- [ ] Update phone number database

### Monthly Tasks
- [ ] Review provider performance
- [ ] Negotiate better rates
- [ ] Update documentation

---

## 📞 Support

### Africa's Talking
- Email: support@africastalking.com
- Slack: [africastalking.slack.com](https://africastalking.slack.com)
- Docs: [developers.africastalking.com](https://developers.africastalking.com)

### Twilio
- Email: help@twilio.com
- Support Portal: [support.twilio.com](https://support.twilio.com)
- Docs: [twilio.com/docs](https://www.twilio.com/docs)

---

**Last Updated**: 2025-12-22  
**Version**: 1.0  
**Maintained By**: Africa Railways Team
