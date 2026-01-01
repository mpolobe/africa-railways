# 📱 Africa Railways USSD Gateway

USSD (Unstructured Supplementary Service Data) gateway for feature phone ticket purchases.

## Overview

The USSD Gateway enables passengers with feature phones (non-smartphones) to:
- Buy train tickets via USSD codes (e.g., `*123#`)
- Check ticket status
- View their tickets
- Get help and support

## Architecture

```
┌─────────────────┐
│  Feature Phone  │
│   Dials *123#   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Telecom Gateway │ (MTN, Vodacom, etc.)
│  USSD Platform  │
└────────┬────────┘
         │ HTTP POST
         ▼
┌─────────────────┐
│  USSD Gateway   │ ← This Service
│   (Port 8081)   │
└────────┬────────┘
         │
         ├──→ Polygon (Mint NFT Ticket)
         ├──→ IPFS (Store Metadata)
         ├──→ M-Pesa (Process Payment)
         └──→ SMS (Send Ticket Details)
```

## Quick Start

### 1. Start USSD Gateway

```bash
cd ussd-gateway
./ussd-gateway
```

Or with custom port:

```bash
USSD_PORT=8081 ./ussd-gateway
```

### 2. Test Locally

Simulate USSD request:

```bash
curl -X POST http://localhost:8081/ussd \
  -d "sessionId=sess_123" \
  -d "phoneNumber=+27821234567" \
  -d "text=" \
  -d "serviceCode=*123#"
```

### 3. Check Health

```bash
curl http://localhost:8081/health
```

## USSD Menu Flow

### Main Menu
```
Welcome to Africa Railways
1. Buy Ticket
2. Check Ticket
3. My Tickets
4. Help
```

### Buy Ticket Flow
```
*123#
  └─ 1 (Buy Ticket)
      └─ 1 (JHB-CPT)
          └─ 1 (Today)
              └─ 1 (Economy R150)
                  └─ 1 (Pay with M-Pesa)
                      └─ Payment initiated!
```

## API Endpoints

### USSD Webhook
```
POST /ussd
```

**Parameters:**
- `sessionId` - Unique session identifier
- `phoneNumber` - User's phone number
- `text` - User input (menu selections)
- `serviceCode` - USSD code dialed (e.g., `*123#`)

**Response:**
- `CON` - Continue session (show menu)
- `END` - End session (final message)

**Example:**
```bash
curl -X POST http://localhost:8081/ussd \
  -d "sessionId=sess_abc123" \
  -d "phoneNumber=+27821234567" \
  -d "text=1*1*1*1*1" \
  -d "serviceCode=*123#"
```

### Health Check
```
GET /health
```

Returns gateway status for OCC dashboard:

```json
{
  "connected": true,
  "active_sessions": 42,
  "total_sessions_today": 1847,
  "success_rate": 94.5,
  "average_response_time_ms": 850,
  "peak_sessions": 67,
  "failed_sessions": 102,
  "last_session_time": "2024-12-24T12:34:56Z",
  "uptime_percent": 99.7,
  "uptime_duration": "14d6h23m"
}
```

### Statistics
```
GET /stats
```

Returns detailed statistics:

```json
{
  "TotalSessionsToday": 1847,
  "SuccessfulSessions": 1745,
  "FailedSessions": 102,
  "TotalResponseTime": 1570950,
  "RequestCount": 1847,
  "StartTime": "2024-12-10T08:00:00Z"
}
```

### Active Sessions
```
GET /sessions
```

Returns list of active sessions:

```json
[
  {
    "session_id": "sess_abc123",
    "phone_number": "+27821234567",
    "state": "select_route",
    "last_command": "1",
    "start_time": "2024-12-24T12:34:56Z",
    "data": {}
  }
]
```

## Session Management

### Session States

- `main_menu` - Main menu
- `select_route` - Choosing train route
- `select_date` - Choosing travel date
- `select_class` - Choosing ticket class
- `confirm_payment` - Payment confirmation
- `payment_processing` - Processing payment
- `check_ticket` - Checking ticket status
- `my_tickets` - Viewing user's tickets

### Session Lifecycle

1. **Create**: User dials USSD code
2. **Active**: User navigates menus (max 5 minutes)
3. **Complete**: User completes purchase or exits
4. **Cleanup**: Stale sessions removed after 5 minutes

## Integration with Telecom Providers

### MTN South Africa

**Webhook URL**: `https://your-domain.com/ussd`

**Request Format**:
```
POST /ussd
Content-Type: application/x-www-form-urlencoded

sessionId=sess_123&phoneNumber=%2B27821234567&text=1*1&serviceCode=*123%23
```

### Vodacom South Africa

**Webhook URL**: `https://your-domain.com/ussd`

**Request Format**: (Similar to MTN)

### Configuration

Set webhook URL in telecom provider's USSD platform:
1. Login to provider portal
2. Navigate to USSD services
3. Register shortcode (e.g., `*123#`)
4. Set webhook URL: `https://your-domain.com/ussd`
5. Test with test numbers

## Payment Integration

### M-Pesa Integration

```go
// In production, integrate with M-Pesa API
func initiateMPesaPayment(phoneNumber string, amount float64) (string, error) {
    // 1. Generate payment request
    // 2. Send STK push to user's phone
    // 3. Wait for payment confirmation
    // 4. Return transaction ID
}
```

### Payment Flow

1. User selects "Pay with M-Pesa"
2. Gateway sends STK push to user's phone
3. User enters M-Pesa PIN
4. Payment confirmed
5. NFT ticket minted on Polygon
6. Metadata uploaded to IPFS
7. SMS sent with ticket details

## Ticket Minting

After successful payment:

```go
// 1. Generate ticket metadata
metadata := metadata.GenerateTicketMetadata(ticketInfo)

// 2. Upload to IPFS
ipfsHash := ipfs.UploadMetadata(metadata)

// 3. Mint gasless NFT ticket
mintGaslessTicket(ipfsHash, userWallet)

// 4. Send SMS with ticket details
sendSMS(phoneNumber, ticketDetails)
```

## Monitoring

### OCC Dashboard Integration

The USSD Gateway is monitored by the OCC Dashboard:

- **Active Sessions**: Real-time session count
- **Success Rate**: Percentage of completed purchases
- **Response Time**: Average response time
- **Uptime**: Gateway availability

### Metrics Tracked

- Total sessions today
- Successful purchases
- Failed sessions
- Average response time
- Peak concurrent sessions
- Last activity time

## Configuration

### Environment Variables

```bash
# USSD Gateway
USSD_PORT=8081
USSD_HEALTH_URL=http://localhost:8081/health

# Telecom Integration
USSD_SHORTCODE=*123#
USSD_WEBHOOK_SECRET=your-webhook-secret

# Payment
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PASSKEY=your-passkey

# Blockchain
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
RELAYER_ADDRESS=0xYourAddress

# Notifications
SMS_API_KEY=your-sms-api-key
SMS_SENDER_ID=RAILWAY
```

## Deployment

### Local Development

```bash
cd ussd-gateway
go run main.go
```

### Production (Railway.app)

```bash
railway up
```

Set environment variables in Railway dashboard.

### Docker

```dockerfile
FROM golang:1.22-alpine
WORKDIR /app
COPY . .
RUN go build -o ussd-gateway main.go
EXPOSE 8081
CMD ["./ussd-gateway"]
```

```bash
docker build -t africa-railways-ussd .
docker run -p 8081:8081 --env-file .env africa-railways-ussd
```

### Systemd Service

```ini
[Unit]
Description=Africa Railways USSD Gateway
After=network.target

[Service]
Type=simple
User=railways
WorkingDirectory=/opt/africa-railways/ussd-gateway
ExecStart=/opt/africa-railways/ussd-gateway/ussd-gateway
Restart=always
Environment="USSD_PORT=8081"

[Install]
WantedBy=multi-user.target
```

## Security

### Webhook Verification

Verify requests from telecom provider:

```go
func verifyWebhook(r *http.Request) bool {
    signature := r.Header.Get("X-Signature")
    secret := os.Getenv("USSD_WEBHOOK_SECRET")
    
    // Verify HMAC signature
    expectedSignature := generateHMAC(r.Body, secret)
    return signature == expectedSignature
}
```

### Rate Limiting

Prevent abuse:

```go
// Limit to 10 requests per second per phone number
rateLimiter := rate.NewLimiter(10, 20)
```

### Session Security

- Sessions expire after 5 minutes
- Session IDs are unique and unpredictable
- User data is not logged

## Testing

### Unit Tests

```bash
go test ./...
```

### Integration Tests

```bash
# Test main menu
curl -X POST http://localhost:8081/ussd \
  -d "sessionId=test_1" \
  -d "phoneNumber=+27821234567" \
  -d "text=" \
  -d "serviceCode=*123#"

# Test buy ticket flow
curl -X POST http://localhost:8081/ussd \
  -d "sessionId=test_1" \
  -d "phoneNumber=+27821234567" \
  -d "text=1*1*1*1*1" \
  -d "serviceCode=*123#"
```

### Load Testing

```bash
# Install hey
go install github.com/rakyll/hey@latest

# Test with 100 concurrent users
hey -n 1000 -c 100 -m POST \
  -d "sessionId=load_test&phoneNumber=+27821234567&text=&serviceCode=*123#" \
  http://localhost:8081/ussd
```

## Troubleshooting

### Gateway Not Responding

```bash
# Check if service is running
curl http://localhost:8081/health

# Check logs
tail -f logs/ussd-gateway.log

# Restart service
systemctl restart africa-railways-ussd
```

### Sessions Not Persisting

- Check Redis connection (if using Redis for sessions)
- Verify session cleanup is not too aggressive
- Check session timeout settings

### Payment Failures

- Verify M-Pesa credentials
- Check M-Pesa API status
- Review payment logs
- Test with M-Pesa sandbox

## Future Enhancements

1. **Multi-language Support**: Zulu, Xhosa, Afrikaans
2. **Voice USSD**: Audio prompts for accessibility
3. **Ticket Transfers**: Transfer tickets to other users
4. **Loyalty Program**: Points and rewards
5. **Group Bookings**: Book multiple tickets
6. **Schedule Notifications**: Reminders before departure

## Support

- **Documentation**: See this README
- **OCC Dashboard**: Monitor at http://localhost:8080
- **Health Check**: http://localhost:8081/health
- **Logs**: `logs/ussd-gateway.log`

## License

Part of the Africa Railways project.
