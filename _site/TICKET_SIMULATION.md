# 🎟️ Ticket Purchase Simulation

## Overview

Simulate train ticket purchases that trigger Africoin minting events.

---

## Files

### Go Version
**File**: `backend/cmd/spine_engine/simulate_ticket.go`  
**Requires**: Go installed

### Shell Version  
**File**: `backend/cmd/spine_engine/simulate_ticket.sh`  
**Requires**: curl (always available)

---

## Usage

### Option 1: Shell Script (Recommended)
```bash
# From anywhere
./backend/cmd/spine_engine/simulate_ticket.sh

# Or from the spine_engine directory
cd backend/cmd/spine_engine
./simulate_ticket.sh
```

### Option 2: Go Script
```bash
# Requires Go to be installed
go run backend/cmd/spine_engine/simulate_ticket.go
```

### Option 3: Direct curl
```bash
curl -X POST http://localhost:8080/add-event \
  -H "Content-Type: application/json" \
  -d '{"message":"🪙 Africoin Minted: Passenger 0x924... received 50 AFRC"}'
```

---

## What It Does

1. Creates an Africoin mint event
2. Sends it to the backend API at `http://localhost:8080/add-event`
3. Simulates a passenger receiving 50 AFRC tokens
4. Displays success/error message

---

## Expected Output

### Success
```
🎟️  Simulating Train Ticket Purchase...
✅ Event pushed to Dashboard!
Response: {"status":"success"}
```

### Error (Backend Not Running)
```
🎟️  Simulating Train Ticket Purchase...
❌ Error: Could not connect to backend
Make sure the backend is running on port 8080
```

---

## Prerequisites

### Backend Must Be Running
```bash
# Start the backend
make dev

# Or manually
cd backend/cmd/spine_engine
go run main.go
```

### Check Backend Status
```bash
# Check if port 8080 is listening
make status

# Or
curl http://localhost:8080/health
```

---

## Integration with iPad Control Center

The simulation can be triggered from the iPad Control Center:

1. Open Control Center at `http://localhost:8082/ipad-control-center.html`
2. Click "Run Command"
3. Enter: `./backend/cmd/spine_engine/simulate_ticket.sh`
4. View results in Command Output panel

---

## Event Flow

```
simulate_ticket.sh
    ↓
POST /add-event
    ↓
Backend API (Port 8080)
    ↓
Event Logged
    ↓
Dashboard Updated
    ↓
Real-time Display
```

---

## Customization

### Change Amount
Edit the script to modify the AFRC amount:

```bash
# In simulate_ticket.sh
"message": "🪙 Africoin Minted: Passenger 0x924... received 100 AFRC at $TIMESTAMP"
```

### Change Recipient
```bash
"message": "🪙 Africoin Minted: Passenger 0xABC... received 50 AFRC at $TIMESTAMP"
```

### Add More Fields
```json
{
  "message": "🪙 Africoin Minted",
  "recipient": "0x924...",
  "amount": 50,
  "timestamp": "2025-12-22T01:00:00Z",
  "route": "Lusaka-Johannesburg"
}
```

---

## Troubleshooting

### Backend Not Responding
```bash
# Check if backend is running
ps aux | grep "go run"

# Check port
lsof -i :8080

# Restart backend
make stop
make dev
```

### Permission Denied
```bash
# Make script executable
chmod +x backend/cmd/spine_engine/simulate_ticket.sh
```

### curl Not Found
```bash
# Install curl (if needed)
sudo apt install -y curl
```

---

## Testing

### Test Backend Endpoint
```bash
# Health check
curl http://localhost:8080/health

# Test add-event endpoint
curl -X POST http://localhost:8080/add-event \
  -H "Content-Type: application/json" \
  -d '{"message":"Test event"}'
```

### Automated Testing
```bash
# Run multiple simulations
for i in {1..5}; do
  ./backend/cmd/spine_engine/simulate_ticket.sh
  sleep 2
done
```

---

## Integration with Makefile

Add to Makefile:

```makefile
simulate:
	@echo "$(GREEN)🎟️ Simulating ticket purchase...$(NC)"
	@./backend/cmd/spine_engine/simulate_ticket.sh
```

Then run:
```bash
make simulate
```

---

## Future Enhancements

- [ ] Add WebSocket support for real-time updates
- [ ] Integrate with actual Sui blockchain
- [ ] Add passenger authentication
- [ ] Store transactions in database
- [ ] Create transaction history view
- [ ] Add QR code generation for tickets

---

**Status**: ✅ Ready to use  
**Version**: 1.0.0  
**Last Updated**: 2025-12-22
