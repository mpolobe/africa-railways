#!/bin/bash
# Filename: scripts/setup_subscription_api.sh
# Setup script for subscription payment integration

set -e

echo "🚂 Africa Railways - Subscription API Setup"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env from template${NC}"
    else
        echo -e "${RED}❌ .env.example not found. Creating new .env...${NC}"
        touch .env
    fi
fi

# Function to add or update env variable
add_or_update_env() {
    local key=$1
    local value=$2
    local file=".env"
    
    if grep -q "^${key}=" "$file" 2>/dev/null; then
        # Update existing
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
        else
            sed -i "s|^${key}=.*|${key}=${value}|" "$file"
        fi
        echo -e "${YELLOW}Updated: ${key}${NC}"
    else
        # Add new
        echo "${key}=${value}" >> "$file"
        echo -e "${GREEN}Added: ${key}${NC}"
    fi
}

echo ""
echo "📱 Configuring Mobile Money Integration..."
echo "-------------------------------------------"

# Flutterwave (Recommended - handles MTN, Airtel, Zamtel)
add_or_update_env "FLW_PUBLIC_KEY" "FLWPUBK-test-XXXXXXXXXXXXXXXXXXXX-X"
add_or_update_env "FLW_SECRET_KEY" "FLWSECK-test-XXXXXXXXXXXXXXXXXXXX-X"
add_or_update_env "FLW_ENCRYPTION_KEY" "FLWSECK_TEST-XXXXXXXXXXXXXXXXXXXX-X"
add_or_update_env "FLW_SECRET_HASH" "your_webhook_secret_hash"

# Direct MTN MoMo API (Alternative)
add_or_update_env "MTN_MOMO_API_URL" "https://sandbox.momodeveloper.mtn.com"
add_or_update_env "MTN_MOMO_SUBSCRIPTION_KEY" "your_mtn_subscription_key"
add_or_update_env "MTN_MOMO_API_USER" "your_mtn_api_user_uuid"
add_or_update_env "MTN_MOMO_API_KEY" "your_mtn_api_key"

# Airtel Money API (Alternative)
add_or_update_env "AIRTEL_MONEY_URL" "https://openapi.airtel.africa/standard/v1"
add_or_update_env "AIRTEL_CLIENT_ID" "your_airtel_client_id"
add_or_update_env "AIRTEL_CLIENT_SECRET" "your_airtel_client_secret"

echo ""
echo "💰 Configuring Subscription Plans (ZMW)..."
echo "-------------------------------------------"

# Subscription plan pricing
add_or_update_env "PLAN_TRADER_PRO_PRICE" "50"
add_or_update_env "PLAN_COMMUTER_PRICE" "50"
add_or_update_env "PLAN_TOURIST_PRICE" "80"
add_or_update_env "PLAN_PAY_PER_USE_FEE" "15"

# Commission rates
add_or_update_env "RAILWAY_COMMISSION_RATE" "0.10"
add_or_update_env "CONVENIENCE_FEE" "5"

echo ""
echo "🔗 Configuring API Endpoints..."
echo "-------------------------------------------"

# API URLs
add_or_update_env "API_BASE_URL" "https://api.africorailways.com"
add_or_update_env "WEBHOOK_BASE_URL" "https://api.africorailways.com/webhooks"
add_or_update_env "APP_URL" "https://africorailways.com"

echo ""
echo "💾 Configuring Database..."
echo "-------------------------------------------"

# Check if DATABASE_URL exists
if ! grep -q "^DATABASE_URL=" .env 2>/dev/null; then
    add_or_update_env "DATABASE_URL" "postgresql://user:password@localhost:5432/africa_railways"
    echo -e "${YELLOW}⚠️  Please update DATABASE_URL with your actual database credentials${NC}"
fi

echo ""
echo "📧 Configuring Notifications..."
echo "-------------------------------------------"

# SMS notifications (already configured in .env.example)
if ! grep -q "^VITE_AFRICAS_TALKING_API_KEY=" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  SMS credentials not found. Using existing Twilio/Africa's Talking config${NC}"
fi

echo ""
echo "🔐 Security Configuration..."
echo "-------------------------------------------"

# Generate webhook secret if not exists
if ! grep -q "^WEBHOOK_SECRET=" .env 2>/dev/null; then
    WEBHOOK_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "CHANGE_ME_$(date +%s)")
    add_or_update_env "WEBHOOK_SECRET" "$WEBHOOK_SECRET"
fi

# JWT secret for API authentication
if ! grep -q "^JWT_SECRET=" .env 2>/dev/null; then
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "CHANGE_ME_JWT_$(date +%s)")
    add_or_update_env "JWT_SECRET" "$JWT_SECRET"
fi

echo ""
echo "📊 Creating Database Schema..."
echo "-------------------------------------------"

# Check if database schema file exists
SCHEMA_FILE="backend/migrations/001_subscription_schema.sql"
mkdir -p backend/migrations

cat > "$SCHEMA_FILE" <<'EOF'
-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZMW',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    features JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan_id VARCHAR(50) REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    start_date TIMESTAMP NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP,
    next_billing_date TIMESTAMP NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    failed_attempts INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZMW',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(20) NOT NULL,
    payment_provider VARCHAR(50),
    provider_reference VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_subscription_id ON transactions(subscription_id);

-- Insert default plans
INSERT INTO subscription_plans (id, name, description, price, features) VALUES
('trader_pro', 'Trader Pro', 'For cross-border traders - unlimited bookings', 50.00, 
    '{"unlimited_bookings": true, "priority_support": true, "sms_notifications": true, "savings_per_month": 10}'::jsonb),
('commuter', 'Commuter', 'For daily commuters - unlimited bookings', 50.00,
    '{"unlimited_bookings": true, "quick_booking": true, "sms_notifications": true, "savings_per_month": 250}'::jsonb),
('tourist', 'Tourist', 'For travelers - premium features', 80.00,
    '{"unlimited_bookings": true, "travel_insurance": true, "hotel_discounts": true, "priority_boarding": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;
EOF

echo -e "${GREEN}✅ Database schema created: $SCHEMA_FILE${NC}"

echo ""
echo "📝 Creating API Documentation..."
echo "-------------------------------------------"

# Create API documentation
DOC_FILE="docs/SUBSCRIPTION_API.md"
mkdir -p docs

cat > "$DOC_FILE" <<'EOF'
# Subscription API Documentation

## Base URL
```
Production: https://api.africorailways.com
Sandbox: https://sandbox-api.africorailways.com
```

## Authentication
All requests require Bearer token:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Endpoints

### 1. Get Available Plans
```http
GET /api/subscriptions/plans
```

**Response:**
```json
{
  "plans": [
    {
      "id": "trader_pro",
      "name": "Trader Pro",
      "price": 50.00,
      "currency": "ZMW",
      "features": {...}
    }
  ]
}
```

### 2. Initiate Subscription
```http
POST /api/subscriptions/initiate
```

**Request:**
```json
{
  "plan_id": "trader_pro",
  "payment_method": "mtn_momo",
  "phone_number": "+260977123456"
}
```

**Response:**
```json
{
  "status": "pending",
  "transaction_id": "txn_abc123",
  "message": "Check your phone for payment prompt"
}
```

### 3. Check Subscription Status
```http
GET /api/subscriptions/status
```

**Response:**
```json
{
  "subscription": {
    "id": "sub_123",
    "plan_id": "trader_pro",
    "status": "active",
    "next_billing_date": "2025-01-30T00:00:00Z"
  }
}
```

### 4. Cancel Subscription
```http
POST /api/subscriptions/cancel
```

**Response:**
```json
{
  "status": "cancelled",
  "message": "Subscription cancelled successfully"
}
```

## Webhooks

### Payment Confirmation
```http
POST /webhooks/flutterwave
```

**Headers:**
```
verif-hash: YOUR_SECRET_HASH
```

**Payload:**
```json
{
  "event": "charge.completed",
  "data": {
    "tx_ref": "txn_abc123",
    "status": "successful",
    "amount": 50.00
  }
}
```
EOF

echo -e "${GREEN}✅ API documentation created: $DOC_FILE${NC}"

echo ""
echo "🧪 Creating Test Script..."
echo "-------------------------------------------"

# Create test script
TEST_SCRIPT="scripts/test_subscription.sh"

cat > "$TEST_SCRIPT" <<'EOF'
#!/bin/bash
# Test subscription API endpoints

API_URL="${API_BASE_URL:-http://localhost:8080}"
TOKEN="${TEST_JWT_TOKEN:-test_token}"

echo "Testing Subscription API..."
echo "API URL: $API_URL"

# Test 1: Get plans
echo ""
echo "1. Getting available plans..."
curl -s -X GET "$API_URL/api/subscriptions/plans" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test 2: Initiate subscription (sandbox)
echo ""
echo "2. Initiating test subscription..."
curl -s -X POST "$API_URL/api/subscriptions/initiate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "trader_pro",
    "payment_method": "mtn_momo",
    "phone_number": "+260763456789"
  }' | jq .

echo ""
echo "✅ Tests complete"
EOF

chmod +x "$TEST_SCRIPT"
echo -e "${GREEN}✅ Test script created: $TEST_SCRIPT${NC}"

echo ""
echo "📋 Setup Summary"
echo "==========================================="
echo -e "${GREEN}✅ Environment variables configured${NC}"
echo -e "${GREEN}✅ Database schema created${NC}"
echo -e "${GREEN}✅ API documentation generated${NC}"
echo -e "${GREEN}✅ Test scripts ready${NC}"

echo ""
echo "⚠️  Next Steps:"
echo "-------------------------------------------"
echo "1. Update .env with your actual API keys:"
echo "   - Flutterwave: https://dashboard.flutterwave.com"
echo "   - MTN MoMo: https://momodeveloper.mtn.com"
echo "   - Airtel Money: https://developers.airtel.africa"
echo ""
echo "2. Run database migrations:"
echo "   psql \$DATABASE_URL -f backend/migrations/001_subscription_schema.sql"
echo ""
echo "3. Test the API:"
echo "   ./scripts/test_subscription.sh"
echo ""
echo "4. Review documentation:"
echo "   - docs/SUBSCRIPTION_API.md"
echo "   - docs/PAYMENT_INTEGRATION_SPECS.md"
echo "   - docs/SUBSCRIPTION_UI_MOCKUP.md"
echo ""
echo -e "${YELLOW}⚠️  Remember to switch to production keys before launch!${NC}"
echo ""
echo "🚀 Ready to build the subscription system!"
