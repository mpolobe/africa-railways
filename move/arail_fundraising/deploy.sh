#!/bin/bash

# ARAIL Fundraising Contract Deployment Script
# Usage: ./deploy.sh [testnet|mainnet]

set -e

NETWORK=${1:-testnet}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚂 ARAIL Fundraising Contract Deployment"
echo "========================================"
echo "Network: $NETWORK"
echo ""

# Check if sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo "❌ Error: Sui CLI not found"
    echo "Install with: cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui"
    exit 1
fi

echo "✅ Sui CLI found: $(sui --version)"
echo ""

# Switch to correct network
echo "📡 Switching to $NETWORK..."
sui client switch --env $NETWORK

# Check balance
echo ""
echo "💰 Checking balance..."
BALANCE=$(sui client gas --json | jq -r '.[0].balance' 2>/dev/null || echo "0")
echo "Balance: $BALANCE MIST"

if [ "$BALANCE" -lt "100000000" ]; then
    echo "⚠️  Warning: Low balance. You may need more SUI for deployment."
    if [ "$NETWORK" = "testnet" ]; then
        echo "Get testnet SUI from faucet: sui client faucet"
    fi
fi

# Build the contract
echo ""
echo "🔨 Building contract..."
cd "$SCRIPT_DIR"
sui move build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Deploy
echo "🚀 Deploying to $NETWORK..."
echo "This will cost approximately 0.1 SUI in gas fees."
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

DEPLOY_OUTPUT=$(sui client publish --gas-budget 100000000 --json)

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

# Parse deployment output
PACKAGE_ID=$(echo "$DEPLOY_OUTPUT" | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
FUND_OBJECT_ID=$(echo "$DEPLOY_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("Fund")) | .objectId')
TX_DIGEST=$(echo "$DEPLOY_OUTPUT" | jq -r '.digest')

echo ""
echo "✅ Deployment Successful!"
echo "========================="
echo ""
echo "📦 Package ID: $PACKAGE_ID"
echo "💰 Fund Object ID: $FUND_OBJECT_ID"
echo "🔗 Transaction: $TX_DIGEST"
echo ""

# Save to config file
CONFIG_FILE="$SCRIPT_DIR/deployment_${NETWORK}.json"
cat > "$CONFIG_FILE" << EOF
{
  "network": "$NETWORK",
  "packageId": "$PACKAGE_ID",
  "fundObjectId": "$FUND_OBJECT_ID",
  "txDigest": "$TX_DIGEST",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "target": "350000000000000",
  "targetSUI": "350000",
  "equityOffered": "10%"
}
EOF

echo "💾 Configuration saved to: $CONFIG_FILE"
echo ""

# Generate frontend config
echo "📝 Frontend Configuration:"
echo "=========================="
echo ""
echo "Update investor.html with these values:"
echo ""
echo "const PACKAGE_ID = \"$PACKAGE_ID\";"
echo "const FUND_OBJECT_ID = \"$FUND_OBJECT_ID\";"
echo ""

# Explorer links
if [ "$NETWORK" = "testnet" ]; then
    EXPLORER_URL="https://suiexplorer.com/object/$FUND_OBJECT_ID?network=testnet"
else
    EXPLORER_URL="https://suiexplorer.com/object/$FUND_OBJECT_ID?network=mainnet"
fi

echo "🔍 View on Explorer:"
echo "$EXPLORER_URL"
echo ""

# Test investment instructions
if [ "$NETWORK" = "testnet" ]; then
    echo "🧪 Test Investment:"
    echo "=================="
    echo ""
    echo "sui client call \\"
    echo "  --package $PACKAGE_ID \\"
    echo "  --module fundraising \\"
    echo "  --function invest \\"
    echo "  --args $FUND_OBJECT_ID 100000000000 \\"
    echo "  --gas-budget 10000000"
    echo ""
fi

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Update investor.html with Package ID and Fund Object ID"
echo "2. Test the investment flow on $NETWORK"
echo "3. Monitor investments via Sui Explorer"
if [ "$NETWORK" = "testnet" ]; then
    echo "4. When ready, deploy to mainnet: ./deploy.sh mainnet"
fi
