# 🚀 Twilio Quick Start

## 30-Second Setup

```bash
# 1. Set environment variables in Gitpod
gp env TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
gp env TWILIO_MESSAGING_SERVICE_SID="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
gp env TWILIO_AUTH_TOKEN="your_auth_token_here"

# 2. Restart terminal
source ~/.bashrc

# 3. Test SMS
cd backend
go run test_twilio.go
```

---

## Your Credentials

```
Account SID:          ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Messaging Service:    MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token:           [Get from Twilio Console]
```

**Get Auth Token:**
1. Go to https://console.twilio.com
2. Click "Account" → "API Keys & Tokens"
3. Copy Auth Token

---

## Test Command

```bash
# Quick test
cd backend
go run test_twilio.go

# Enter your phone number when prompted
# Check your phone for test message
```

---

## Integration Code

```go
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
    params.SetMessagingServiceSid(
        os.Getenv("TWILIO_MESSAGING_SERVICE_SID"),
    )
    
    _, err := client.Api.CreateMessage(params)
    return err
}
```

---

## Common Issues

**"Authenticate" Error**
→ Check Auth Token is correct

**"Invalid phone number"**
→ Use E.164 format: +254712345678

**"Trial account" Error**
→ Verify phone number in Twilio Console

**"Insufficient funds"**
→ Add credits to account

---

## Cost

| Country | Per SMS |
|---------|---------|
| USA     | $0.0079 |
| Kenya   | $0.0550 |
| Nigeria | $0.0550 |

---

## Next Steps

1. ✅ Test SMS working
2. Configure Africa's Talking (cheaper for Africa)
3. Start onboarding server: `make dev`
4. Test at: http://localhost:8082/onboarding.html

---

**Full Guide:** See TWILIO_SETUP.md
