# 📱 SMS Notifications - Africa Railways

## Overview

SMS notification system supporting both Africa's Talking (for African markets) and Twilio (for global reach).

---

## 🚀 Installation

### Install Dependencies

```bash
cd backend
go get github.com/tech-kenya/africastalkingsms
go get github.com/twilio/twilio-go
```

### Environment Variables

Create or update `backend/.env`:

```bash
# Africa's Talking Configuration
AT_USERNAME=your_username
AT_API_KEY=your_api_key
AT_SENDER_ID=AFRICARAIL

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

# SMS Provider Selection
SMS_PROVIDER=africastalking  # or 'twilio'
```

---

## 📋 Supported Providers

### 1. Africa's Talking

**Best for:**
- Kenya, Uganda, Tanzania, Rwanda, Nigeria, Ghana
- Mobile Money integration
- Local phone numbers
- Cost-effective for African markets

**Setup:**
1. Sign up at [africastalking.com](https://africastalking.com)
2. Get API credentials
3. Register sender ID
4. Add credits to account

**Pricing:**
- Kenya: ~$0.008 per SMS
- Nigeria: ~$0.015 per SMS
- Other markets: Check pricing page

### 2. Twilio

**Best for:**
- Global reach
- Advanced features (MMS, WhatsApp)
- Reliable delivery
- International numbers

**Setup:**
1. Sign up at [twilio.com](https://twilio.com)
2. Get Account SID and Auth Token
3. Purchase phone number
4. Add credits

**Pricing:**
- USA: $0.0079 per SMS
- Kenya: $0.0550 per SMS
- Global: Varies by country

---

## 💻 Usage

### Initialize Service

```go
import "github.com/mpolobe/africa-railways/backend/sms"

// Using Africa's Talking
notifier := sms.NewNotificationService("africastalking")

// Using Twilio
notifier := sms.NewNotificationService("twilio")
```

### Send Notifications

#### Ticket Confirmation
```go
err := notifier.SendTicketConfirmation(
    "+254712345678",           // Phone number
    "Lusaka → Dar es Salaam",  // Route
    50,                         // Amount in AFRC
)
```

#### Wallet Top-Up
```go
err := notifier.SendWalletTopUp(
    "+254712345678",  // Phone number
    500,              // Top-up amount
    1750,             // New balance
)
```

#### Low Balance Alert
```go
err := notifier.SendLowBalanceAlert(
    "+254712345678",  // Phone number
    30,               // Current balance
)
```

#### Welcome Message
```go
err := notifier.SendWelcomeSMS(
    "+254712345678",  // Phone number
    "John Doe",       // User name
)
```

#### Daily Digest
```go
err := notifier.SendDailyDigest(
    "+254712345678",  // Phone number
    5,                // Tickets purchased
    250,              // Total spent
    1000,             // Current balance
)
```

---

## 🔧 Integration with Backend

### Update Main Server

```go
// backend/main.go
package main

import (
    "github.com/mpolobe/africa-railways/backend/sms"
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
}

func handleTicketPurchase(w http.ResponseWriter, r *http.Request) {
    // ... existing ticket purchase logic ...
    
    // Send SMS notification
    go func() {
        err := notifier.SendTicketConfirmation(
            user.PhoneNumber,
            ticket.Route,
            ticket.Amount,
        )
        if err != nil {
            log.Printf("Failed to send SMS: %v", err)
        }
    }()
    
    // ... rest of handler ...
}

func handleWalletTopUp(w http.ResponseWriter, r *http.Request) {
    // ... existing top-up logic ...
    
    // Send SMS notification
    go func() {
        err := notifier.SendWalletTopUp(
            user.PhoneNumber,
            topUpAmount,
            newBalance,
        )
        if err != nil {
            log.Printf("Failed to send SMS: %v", err)
        }
    }()
    
    // ... rest of handler ...
}
```

---

## 📱 Message Templates

### Ticket Confirmation
```
🎟️ Africa Railways Ticket Confirmed!
Route: Lusaka → Dar es Salaam
Amount: 50 AFRC
Thank you for traveling with us!
```

### Wallet Top-Up
```
💳 Wallet Top-Up Successful!
Amount: +500 AFRC
New Balance: 1750 AFRC
Africa Railways
```

### Low Balance Alert
```
⚠️ Low Balance Alert!
Current Balance: 30 AFRC
Top up now to continue booking tickets.
Africa Railways
```

### Welcome Message
```
🚂 Welcome to Africa Railways, John!
Your sovereign wallet is ready with 1,250 AFRC.
Book your first ticket today!
```

### Daily Digest
```
📊 Daily Summary - Africa Railways
Tickets: 5
Spent: 250 AFRC
Balance: 1000 AFRC
Safe travels!
```

---

## 🧪 Testing

### Test Script

```go
// backend/sms/test_sms.go
package main

import (
    "log"
    "github.com/mpolobe/africa-railways/backend/sms"
)

func main() {
    // Initialize service
    notifier := sms.NewNotificationService("africastalking")
    
    // Test phone number (use your own)
    testPhone := "+254712345678"
    
    // Test ticket confirmation
    log.Println("Testing ticket confirmation...")
    err := notifier.SendTicketConfirmation(testPhone, "Nairobi → Mombasa", 50)
    if err != nil {
        log.Printf("❌ Failed: %v", err)
    } else {
        log.Println("✅ Success")
    }
    
    // Test wallet top-up
    log.Println("Testing wallet top-up...")
    err = notifier.SendWalletTopUp(testPhone, 500, 1750)
    if err != nil {
        log.Printf("❌ Failed: %v", err)
    } else {
        log.Println("✅ Success")
    }
}
```

Run test:
```bash
cd backend/sms
go run test_sms.go
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
Never commit API keys to version control:
```bash
# .gitignore
.env
*.env
```

### 2. Rate Limiting
Implement rate limiting to prevent abuse:
```go
// Limit to 10 SMS per user per hour
if userSMSCount > 10 {
    return errors.New("SMS rate limit exceeded")
}
```

### 3. Phone Number Validation
Validate phone numbers before sending:
```go
import "github.com/nyaruka/phonenumbers"

func validatePhoneNumber(number string) bool {
    num, err := phonenumbers.Parse(number, "")
    if err != nil {
        return false
    }
    return phonenumbers.IsValidNumber(num)
}
```

### 4. Opt-Out Mechanism
Allow users to opt out of SMS notifications:
```go
type User struct {
    PhoneNumber     string
    SMSEnabled      bool
    NotificationPrefs map[string]bool
}
```

---

## 💰 Cost Optimization

### 1. Batch Notifications
Send daily digests instead of per-transaction SMS:
```go
// Send once per day instead of per transaction
func sendDailyDigest() {
    // Aggregate transactions
    // Send single SMS with summary
}
```

### 2. Critical Notifications Only
Only send SMS for important events:
- Ticket purchases
- Large top-ups (>500 AFRC)
- Security alerts
- Low balance warnings

### 3. Use Africa's Talking for African Numbers
Route based on phone number prefix:
```go
func selectProvider(phoneNumber string) string {
    if strings.HasPrefix(phoneNumber, "+254") || // Kenya
       strings.HasPrefix(phoneNumber, "+256") || // Uganda
       strings.HasPrefix(phoneNumber, "+255") {  // Tanzania
        return "africastalking"
    }
    return "twilio"
}
```

---

## 📊 Monitoring

### Log SMS Activity
```go
type SMSLog struct {
    Timestamp   time.Time
    PhoneNumber string
    MessageType string
    Provider    string
    Status      string
    Cost        float64
}

func logSMS(log SMSLog) {
    // Save to database
    // Track costs
    // Monitor delivery rates
}
```

### Delivery Reports
```go
// Africa's Talking callback
func handleDeliveryReport(w http.ResponseWriter, r *http.Request) {
    // Parse delivery report
    // Update SMS status
    // Track failed deliveries
}
```

---

## 🚀 Production Deployment

### 1. Load Environment Variables
```bash
# Production .env
AT_USERNAME=production_username
AT_API_KEY=prod_api_key_here
SMS_PROVIDER=africastalking
```

### 2. Configure Webhooks
Set up delivery report webhooks:
- Africa's Talking: Dashboard → SMS → Delivery Reports
- Twilio: Console → Messaging → Settings → Webhooks

### 3. Monitor Costs
Track SMS spending:
```go
func trackSMSCost(provider, country string) float64 {
    costs := map[string]map[string]float64{
        "africastalking": {
            "KE": 0.008,
            "UG": 0.010,
            "TZ": 0.012,
        },
        "twilio": {
            "US": 0.0079,
            "KE": 0.0550,
        },
    }
    return costs[provider][country]
}
```

---

## 🔄 Fallback Strategy

```go
func sendSMSWithFallback(phoneNumber, message string) error {
    // Try primary provider
    err := primaryProvider.SendSMS(phoneNumber, message)
    if err == nil {
        return nil
    }
    
    log.Printf("Primary provider failed: %v, trying fallback", err)
    
    // Try fallback provider
    err = fallbackProvider.SendSMS(phoneNumber, message)
    if err != nil {
        return fmt.Errorf("both providers failed: %w", err)
    }
    
    return nil
}
```

---

## 📚 Additional Resources

### Africa's Talking
- [Documentation](https://developers.africastalking.com/docs/sms/overview)
- [Go SDK](https://github.com/tech-kenya/africastalkingsms)
- [Pricing](https://africastalking.com/pricing)

### Twilio
- [Documentation](https://www.twilio.com/docs/sms)
- [Go SDK](https://github.com/twilio/twilio-go)
- [Pricing](https://www.twilio.com/sms/pricing)

---

**Last Updated**: 2025-12-22  
**Version**: 1.0  
**Maintained By**: Africa Railways Team
