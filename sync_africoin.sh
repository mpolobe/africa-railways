#!/bin/bash

# Define the Genesis IDs from our Sui Mainnet Transaction
PACKAGE_ID="0xc68c4cfb63d702227db09c28837e75abd23bbb3adc192e3bc45fecca4dd5b7e8"
TREASURY_CAP="0x9213e5a4c6fc4984e5876bc3e35e4faf06278953028f060f55fb3dbb58efbd31"
POOL_ID="0xa4ef8e1885e101d413e904420643ee583fb60e9f8ff43ed9dd0537b65cc4c2bc"
COIN_TYPE="${PACKAGE_ID}::afc::AFC"

# Check if .env exists, if not, create it
if [ ! -f .env ]; then
    touch .env
    echo "Creating new .env file in root..."
fi

# Function to update or add variables to .env
update_env() {
    local key=$1
    local value=$2
    if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=\"${value}\"|" .env
    else
        echo "${key}=\"${value}\"" >> .env
    fi
}

echo "⚙️ Syncing Africoin Digital Spine to Local Environment..."

update_env "AFC_PACKAGE_ID" "$PACKAGE_ID"
update_env "AFC_TREASURY_CAP" "$TREASURY_CAP"
update_env "AFC_POOL_ID" "$POOL_ID"
update_env "AFC_COIN_TYPE" "$COIN_TYPE"
update_env "SUI_NETWORK" "mainnet"

echo "✅ Success! Root .env updated."
echo "🚀 Your USSD Gateway is now linked to the Rail Corridor Supply."