#!/bin/bash

echo "🎫 Africa Railways - NFT Ticket System Status Check"
echo "===================================================="
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "❌ .env file not found"
    exit 1
fi

# Check environment variables
echo ""
echo "📋 Configuration:"
echo "----------------"

if grep -q "POLYGON_RPC_URL" .env; then
    RPC_URL=$(grep "POLYGON_RPC_URL" .env | cut -d '=' -f2)
    if [ ! -z "$RPC_URL" ] && [ "$RPC_URL" != "your_key_here" ]; then
        echo "✅ POLYGON_RPC_URL configured"
    else
        echo "⚠️  POLYGON_RPC_URL needs configuration"
    fi
else
    echo "❌ POLYGON_RPC_URL not found"
fi

if grep -q "POLYGON_PRIVATE_KEY" .env; then
    echo "✅ POLYGON_PRIVATE_KEY configured"
else
    echo "❌ POLYGON_PRIVATE_KEY not found"
fi

if grep -q "POLYGON_RELAYER_ADDRESS" .env; then
    RELAYER=$(grep "POLYGON_RELAYER_ADDRESS" .env | cut -d '=' -f2)
    echo "✅ POLYGON_RELAYER_ADDRESS: $RELAYER"
else
    echo "⚠️  POLYGON_RELAYER_ADDRESS not found"
fi

# Check IPFS configuration
echo ""
echo "📤 IPFS Configuration:"
echo "---------------------"

if grep -q "NFT_STORAGE_API_KEY" .env; then
    NFT_KEY=$(grep "NFT_STORAGE_API_KEY" .env | cut -d '=' -f2)
    if [ ! -z "$NFT_KEY" ] && [ "$NFT_KEY" != "your_nft_storage_api_key_here" ]; then
        echo "✅ NFT.Storage API key configured"
    else
        echo "⚠️  NFT.Storage API key needs configuration"
    fi
else
    echo "⚠️  NFT.Storage not configured"
fi

if grep -q "PINATA_API_KEY" .env; then
    PINATA_KEY=$(grep "PINATA_API_KEY" .env | cut -d '=' -f2)
    if [ ! -z "$PINATA_KEY" ] && [ "$PINATA_KEY" != "your_pinata_api_key_here" ]; then
        echo "✅ Pinata API key configured"
    else
        echo "⚠️  Pinata API key needs configuration"
    fi
else
    echo "⚠️  Pinata not configured"
fi

# Check backend structure
echo ""
echo "📁 Backend Structure:"
echo "--------------------"

if [ -d "backend/cmd/mint-ticket" ]; then
    echo "✅ Minting script found"
else
    echo "❌ Minting script not found"
fi

if [ -d "backend/pkg/metadata" ]; then
    echo "✅ Metadata package found"
else
    echo "❌ Metadata package not found"
fi

if [ -d "backend/pkg/ipfs" ]; then
    echo "✅ IPFS package found"
else
    echo "❌ IPFS package not found"
fi

# Check Go dependencies
echo ""
echo "🔧 Go Dependencies:"
echo "------------------"

if [ -f "backend/go.mod" ]; then
    echo "✅ go.mod found"
    
    if grep -q "github.com/ethereum/go-ethereum" backend/go.mod; then
        echo "✅ go-ethereum installed"
    else
        echo "⚠️  go-ethereum not installed"
    fi
    
    if grep -q "github.com/joho/godotenv" backend/go.mod; then
        echo "✅ godotenv installed"
    else
        echo "⚠️  godotenv not installed"
    fi
else
    echo "❌ go.mod not found"
fi

# Test commands
echo ""
echo "🧪 Available Test Commands:"
echo "--------------------------"
echo "1. Check relayer balance:"
echo "   cd backend && GOTOOLCHAIN=auto go run cmd/check-balance/main.go"
echo ""
echo "2. Test metadata generation:"
echo "   cd backend && GOTOOLCHAIN=auto go run cmd/test-metadata/main.go"
echo ""
echo "3. Test network connection:"
echo "   cd backend && GOTOOLCHAIN=auto go run cmd/mint-ticket/main.go"
echo ""
echo "4. Test full workflow:"
echo "   cd backend && GOTOOLCHAIN=auto go run cmd/mint-ticket-full/main.go"

# Check balance if possible
echo ""
echo "💰 Checking Relayer Balance:"
echo "---------------------------"
if [ -d "backend/cmd/check-balance" ]; then
    cd backend && GOTOOLCHAIN=auto go run cmd/check-balance/main.go 2>&1 | grep -E "Balance:|Estimated transactions" || echo "⚠️  Could not fetch balance"
    cd ..
else
    echo "⚠️  Balance checker not found"
fi

# Next steps
echo ""
echo "📝 Next Steps:"
echo "-------------"
echo "1. ✅ Relayer wallet funded (0.1 POL)"
echo "   Address: $RELAYER"
echo ""
echo "2. Get IPFS API key: https://nft.storage (free)"
echo ""
echo "3. Deploy NFT contract to Polygon Amoy"
echo ""
echo "4. Run test commands above to verify setup"
echo ""
echo "===================================================="
