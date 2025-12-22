# 🔧 Backend Deployment Guide - Separate Engines

## Overview

Deploy two separate backend engines for complete isolation:

1. **Railways Sovereign Engine** → `africa-railways.vercel.app`
2. **Africoin Sovereign Engine** → `africoin-wallet.vercel.app`

---

## 🚂 Railways Backend Deployment

### Option 1: Vercel (Recommended)

#### Step 1: Create Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from backend directory
cd backend
vercel --prod
```

#### Step 2: Configure Project

**Project Name:** `africa-railways`

**vercel.json:**
```json
{
  "version": 2,
  "name": "africa-railways",
  "builds": [
    {
      "src": "main.go",
      "use": "@vercel/go"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/main.go"
    },
    {
      "src": "/ws",
      "dest": "/main.go"
    },
    {
      "src": "/health",
      "dest": "/main.go"
    }
  ],
  "env": {
    "GO_ENV": "production",
    "APP_NAME": "Railways Sovereign Engine"
  }
}
```

#### Step 3: Deploy

```bash
cd backend
vercel --prod
```

**Result:** `https://africa-railways.vercel.app`

### Option 2: Custom Server

#### Docker Deployment

**Dockerfile:**
```dockerfile
FROM golang:1.21-alpine

WORKDIR /app

COPY backend/ .

RUN go mod download
RUN go build -o railways-engine main.go

EXPOSE 8080

CMD ["./railways-engine"]
```

**Deploy:**
```bash
docker build -t railways-engine .
docker run -p 8080:8080 railways-engine
```

#### Direct Deployment

```bash
cd backend
go build -o railways-engine main.go
./railways-engine
```

---

## 💰 Africoin Backend Deployment

### Option 1: Vercel (Recommended)

#### Step 1: Create Separate Backend

Create `backend-africoin/` directory:

```bash
mkdir -p backend-africoin
cp -r backend/* backend-africoin/
```

#### Step 2: Customize for Africoin

**backend-africoin/main.go:**
```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "sync"
    "time"

    "github.com/gorilla/websocket"
)

// Africoin-specific structures
type Transaction struct {
    ID        int64     `json:"id"`
    Type      string    `json:"type"`
    Amount    float64   `json:"amount"`
    Timestamp time.Time `json:"timestamp"`
}

type WalletStats struct {
    mu           sync.Mutex
    Transactions []Transaction `json:"transactions"`
    Balance      float64       `json:"balance"`
    TotalTx      int           `json:"total_tx"`
}

var (
    stats    = &WalletStats{Transactions: []Transaction{}, Balance: 0}
    upgrader = websocket.Upgrader{
        CheckOrigin: func(r *http.Request) bool { return true },
    }
)

// CORS Middleware
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-App-Name")
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }
        next.ServeHTTP(w, r)
    })
}

// WebSocket Handler
func wsHandler(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println("Upgrade error:", err)
        return
    }
    defer conn.Close()

    log.Println("💰 Africoin WebSocket client connected")

    for {
        stats.mu.Lock()
        payload, _ := json.Marshal(stats)
        stats.mu.Unlock()

        if err := conn.WriteMessage(websocket.TextMessage, payload); err != nil {
            log.Println("💰 WebSocket client disconnected")
            break
        }
        time.Sleep(2 * time.Second)
    }
}

// Add transaction handler
func addTransactionHandler(w http.ResponseWriter, r *http.Request) {
    var tx Transaction
    if err := json.NewDecoder(r.Body).Decode(&tx); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    tx.Timestamp = time.Now()
    tx.ID = time.Now().UnixNano()

    stats.mu.Lock()
    stats.Transactions = append([]Transaction{tx}, stats.Transactions...)
    if len(stats.Transactions) > 10 {
        stats.Transactions = stats.Transactions[:10]
    }
    stats.Balance += tx.Amount
    stats.TotalTx++
    stats.mu.Unlock()

    log.Printf("💰 Transaction added: %s [%.2f AFRC]", tx.Type, tx.Amount)
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status": "success",
        "id":     tx.ID,
    })
}

// Get wallet info
func walletHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    stats.mu.Lock()
    defer stats.mu.Unlock()
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "balance":    stats.Balance,
        "total_tx":   stats.TotalTx,
        "recent_tx":  len(stats.Transactions),
        "timestamp":  time.Now(),
    })
}

// Health check
func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    stats.mu.Lock()
    txCount := len(stats.Transactions)
    balance := stats.Balance
    stats.mu.Unlock()
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status":     "ok",
        "engine":     "Africoin Sovereign Engine",
        "tx_count":   txCount,
        "balance":    balance,
        "timestamp":  time.Now(),
    })
}

// Reports handler (for compatibility)
func reportsHandler(w http.ResponseWriter, r *http.Request) {
    reports := []map[string]interface{}{
        {"id": "1", "wallet": "Main Wallet", "balance": 1420.50, "status": "Active"},
        {"id": "2", "wallet": "Savings", "balance": 890.25, "status": "Active"},
        {"id": "3", "wallet": "Trading", "balance": 0.00, "status": "Inactive"},
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(reports)
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/ws", wsHandler)
    mux.HandleFunc("/api/transaction", addTransactionHandler)
    mux.HandleFunc("/api/wallet", walletHandler)
    mux.HandleFunc("/api/reports", reportsHandler)
    mux.HandleFunc("/api/health", healthHandler)

    log.Println("💰 Africoin Sovereign Engine Live on :8080")
    log.Println("📡 WebSocket endpoint: /ws")
    log.Println("💳 Transaction endpoint: /api/transaction")
    log.Println("👛 Wallet endpoint: /api/wallet")
    log.Println("💚 Health check: /api/health")
    log.Fatal(http.ListenAndServe(":8080", corsMiddleware(mux)))
}
```

#### Step 3: Configure Vercel

**backend-africoin/vercel.json:**
```json
{
  "version": 2,
  "name": "africoin-wallet",
  "builds": [
    {
      "src": "main.go",
      "use": "@vercel/go"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/main.go"
    },
    {
      "src": "/ws",
      "dest": "/main.go"
    }
  ],
  "env": {
    "GO_ENV": "production",
    "APP_NAME": "Africoin Sovereign Engine"
  }
}
```

#### Step 4: Deploy

```bash
cd backend-africoin
vercel --prod
```

**Result:** `https://africoin-wallet.vercel.app`

---

## 📁 Project Structure

```
africa-railways/
├── backend/                    # Railways Engine
│   ├── main.go                # Railways-specific logic
│   ├── vercel.json            # Vercel config
│   └── go.mod
│
├── backend-africoin/          # Africoin Engine
│   ├── main.go                # Africoin-specific logic
│   ├── vercel.json            # Vercel config
│   └── go.mod
│
└── mobile/
    └── src/logic/
        └── reporting_tool.js  # Auto-switches between backends
```

---

## 🔄 Deployment Scripts

### deploy-railways.sh

```bash
#!/bin/bash

echo "🚂 Deploying Railways Sovereign Engine..."

cd backend

# Build and test locally
echo "Building..."
go build -o railways-engine main.go

echo "Testing..."
go test ./...

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "✅ Railways Engine deployed!"
echo "URL: https://africa-railways.vercel.app"
```

### deploy-africoin.sh

```bash
#!/bin/bash

echo "💰 Deploying Africoin Sovereign Engine..."

cd backend-africoin

# Build and test locally
echo "Building..."
go build -o africoin-engine main.go

echo "Testing..."
go test ./...

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "✅ Africoin Engine deployed!"
echo "URL: https://africoin-wallet.vercel.app"
```

### deploy-all.sh

```bash
#!/bin/bash

echo "🚀 Deploying Both Sovereign Engines..."

# Deploy Railways
./deploy-railways.sh

echo ""

# Deploy Africoin
./deploy-africoin.sh

echo ""
echo "✅ All engines deployed!"
echo ""
echo "Railways: https://africa-railways.vercel.app"
echo "Africoin: https://africoin-wallet.vercel.app"
```

---

## 🧪 Testing Deployments

### Test Railways Engine

```bash
# Health check
curl https://africa-railways.vercel.app/api/health

# Get reports
curl https://africa-railways.vercel.app/api/reports

# Send report
curl -X POST https://africa-railways.vercel.app/api/report \
  -H "Content-Type: application/json" \
  -d '{"type":"track_inspection","location":"Lusaka","status":"active"}'
```

### Test Africoin Engine

```bash
# Health check
curl https://africoin-wallet.vercel.app/api/health

# Get wallet info
curl https://africoin-wallet.vercel.app/api/wallet

# Send transaction
curl -X POST https://africoin-wallet.vercel.app/api/transaction \
  -H "Content-Type: application/json" \
  -d '{"type":"deposit","amount":100.50}'
```

---

## 🔐 Environment Variables

### Railways Engine

```bash
# Vercel Dashboard → Settings → Environment Variables
GO_ENV=production
APP_NAME=Railways Sovereign Engine
DATABASE_URL=postgresql://...
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
```

### Africoin Engine

```bash
# Vercel Dashboard → Settings → Environment Variables
GO_ENV=production
APP_NAME=Africoin Sovereign Engine
DATABASE_URL=postgresql://...
BLOCKCHAIN_RPC=https://...
WALLET_PRIVATE_KEY=...
```

---

## 📊 Monitoring

### Vercel Dashboard

**Railways:**
- https://vercel.com/[your-account]/africa-railways

**Africoin:**
- https://vercel.com/[your-account]/africoin-wallet

### Health Checks

```bash
# Monitor both engines
watch -n 5 'curl -s https://africa-railways.vercel.app/api/health && \
             curl -s https://africoin-wallet.vercel.app/api/health'
```

---

## 🔄 CI/CD Integration

### GitHub Actions

**.github/workflows/deploy-backends.yml:**

```yaml
name: Deploy Backends

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'backend-africoin/**'

jobs:
  deploy-railways:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      
      - name: Deploy Railways Engine
        run: |
          cd backend
          npm i -g vercel
          vercel --token ${{ secrets.VERCEL_TOKEN }} --prod
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_RAILWAYS_PROJECT_ID }}

  deploy-africoin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      
      - name: Deploy Africoin Engine
        run: |
          cd backend-africoin
          npm i -g vercel
          vercel --token ${{ secrets.VERCEL_TOKEN }} --prod
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_AFRICOIN_PROJECT_ID }}
```

---

## 🎯 Summary

### Separate Backends

**Railways Engine:**
- URL: `https://africa-railways.vercel.app`
- Focus: Railway operations, tracking, ticketing
- Endpoints: `/api/report`, `/api/reports`, `/api/health`

**Africoin Engine:**
- URL: `https://africoin-wallet.vercel.app`
- Focus: Wallet, transactions, blockchain
- Endpoints: `/api/transaction`, `/api/wallet`, `/api/health`

### Benefits

- ✅ Complete isolation
- ✅ Independent scaling
- ✅ Separate databases
- ✅ Different configurations
- ✅ Easier maintenance

### Mobile Apps

Apps automatically connect to correct backend:
- Railways app → Railways engine
- Africoin app → Africoin engine

---

## 📚 Next Steps

1. **Create backend-africoin directory**
2. **Customize Africoin backend code**
3. **Deploy both to Vercel**
4. **Test endpoints**
5. **Update mobile apps**
6. **Monitor deployments**

---

**Your backends are now properly isolated!** 🔧✨
