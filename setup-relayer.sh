#!/bin/bash

# Africa Railways - Relayer Setup Script

set -e

echo "🔐 Africa Railways - Relayer Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Creating .env from template..."
    cp .env.example .env 2>/dev/null || touch .env
    echo "✅ .env file created"
    echo ""
fi

# Check if RELAYER_PRIVATE_KEY is set
if ! grep -q "RELAYER_PRIVATE_KEY=" .env || grep -q "RELAYER_PRIVATE_KEY=your_private_key_here" .env; then
    echo "⚠️  RELAYER_PRIVATE_KEY not configured in .env"
    echo ""
    echo "📋 To set up your relayer:"
    echo "   1. Get your wallet private key (64 hex characters, no 0x prefix)"
    echo "   2. Edit .env and set: RELAYER_PRIVATE_KEY=your_key_here"
    echo "   3. Run this script again"
    echo ""
    echo "💡 Need a new wallet? Run: cast wallet new"
    echo ""
    exit 1
fi

# Derive address from private key
echo "🔍 Deriving relayer address from private key..."
echo ""

# Check if get_address.go exists
if [ ! -f "get_address.go" ]; then
    echo "❌ get_address.go not found!"
    exit 1
fi

# Install dependencies if needed
if ! go list github.com/joho/godotenv >/dev/null 2>&1; then
    echo "📦 Installing Go dependencies..."
    go get github.com/joho/godotenv
    echo ""
fi

# Run the address derivation script
ADDRESS=$(go run get_address.go 2>&1)

if echo "$ADDRESS" | grep -q "0x"; then
    echo "$ADDRESS"
    echo ""
    
    # Extract just the address
    ADDR=$(echo "$ADDRESS" | grep -oP '0x[a-fA-F0-9]{40}')
    
    # Update .env with the address
    if grep -q "RELAYER_ADDRESS=" .env; then
        sed -i "s|RELAYER_ADDRESS=.*|RELAYER_ADDRESS=$ADDR|" .env
    else
        echo "RELAYER_ADDRESS=$ADDR" >> .env
    fi
    
    echo "✅ RELAYER_ADDRESS updated in .env"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Next Steps:"
    echo ""
    echo "1. Fund your relayer wallet:"
    echo "   Visit: https://faucet.polygon.technology/"
    echo "   Address: $ADDR"
    echo "   Network: Polygon Amoy"
    echo ""
    echo "2. Set up Alchemy Gas Manager:"
    echo "   - Go to https://dashboard.alchemy.com/"
    echo "   - Create a Gas Policy"
    echo "   - Add $ADDR as authorized signer"
    echo "   - Update GAS_POLICY_ID in .env"
    echo ""
    echo "3. Restart the OCC Dashboard:"
    echo "   cd dashboard && ./occ-dashboard"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "❌ Failed to derive address"
    echo "$ADDRESS"
    exit 1
fi
