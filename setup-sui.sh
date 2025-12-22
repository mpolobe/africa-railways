#!/bin/bash

# --- CONFIGURATION ---
SUI_BIN="/workspaces/africa-railways/sui/target/release/sui"
CONFIG_DIR="$HOME/.sui/sui_config"
LOG_FILE="/tmp/sui-network.log"
DEFAULT_ADDR="0x924d232a567fd2972e3623444c790d263c6513b9e2077ce25dd97c0bca098b0e"

echo "=== 🚀 Initializing African Railways Sui Node ==="

# 1. Build if binary doesn't exist (Saves time on reruns)
if [ ! -f "$SUI_BIN" ]; then
    echo "1. Building sui binary (this may take a few mins)..."
    cd /workspaces/africa-railways/sui && cargo build --release --bin sui
else
    echo "1. Sui binary found, skipping build."
fi

# 2. Kill existing processes to prevent port conflicts
echo "2. Cleaning up existing Sui processes..."
pkill -f "sui start" || true
sleep 2

# 3. Start Local Network
echo "3. Starting local network with faucet..."
$SUI_BIN start --with-faucet --force-regenesis > "$LOG_FILE" 2>&1 &

echo "4. Waiting for RPC to wake up (30s)..."
# Loop to check if RPC is up instead of hard sleep
for i in {1..30}; do
    if curl -s -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"sui_getChainIdentifier","id":1}' http://localhost:9000 | grep -q "result"; then
        echo "✅ RPC is live!"
        break
    fi
    echo -n "."
    sleep 1
done

# 5. Configure Client Environment
echo -e "\n5. Configuring Sui Client..."
# Clear old configs to ensure fresh start
rm -rf "$CONFIG_DIR"
$SUI_BIN client << 'ANSWERS'
y
http://localhost:9000
localnet
0
ANSWERS

# 6. Fund the Admin Wallet
echo "6. Requesting SUI tokens from Faucet for: $DEFAULT_ADDR"
curl --silent --location --request POST 'http://localhost:9123/gas' \
  --header 'Content-Type: application/json' \
  --data-raw "{\"FixedAmountRequest\":{\"recipient\":\"$DEFAULT_ADDR\"}}"

echo -e "\n7. Verification:"
$SUI_BIN client envs
$SUI_BIN client gas

echo -e "\n✅ SETUP COMPLETE!"
echo "Package Deploy Ready: 'sui client publish --gas-budget 100000000'"
