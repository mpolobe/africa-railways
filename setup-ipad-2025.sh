#!/bin/bash

# Log all output to startup.log while still showing in terminal
mkdir -p /tmp/africa-railways/logs
exec > >(tee -a /tmp/africa-railways/logs/startup.log) 2>&1

# Clear terminal for a clean iPad view
clear
echo -e "\033[0;32m📱 Africa Railways - 2025 iPad Pro Suite\033[0m"
echo "=============================================="

# 1. Ensure Ports are Public for iPad access
echo "🔓 Making ports public for iPad Safari..."
gp ports visibility 8082:public 3000:public 8080:public 9000:public > /dev/null 2>&1

# 2. Check and install Go if needed
if ! command -v go &> /dev/null; then
    echo "📦 Installing Go..."
    sudo apt update > /dev/null 2>&1
    sudo apt install -y golang-go > /dev/null 2>&1
    if command -v go &> /dev/null; then
        echo "✅ Go installed: $(go version)"
    else
        echo "⚠️  Go installation skipped (may require sudo)"
        echo "   You can still use the shell version: ./simulate_ticket.sh"
    fi
else
    echo "✅ Go already installed: $(go version)"
fi

# 3. Generate/Update .env for the Go Backend
echo "📝 Syncing Environment Variables..."
cat << ENV_EOF > /workspaces/africa-railways/backend/.env
SUI_RPC_URL=http://localhost:9000
SUI_FAUCET_URL=http://localhost:9123
BACKEND_PORT=8080
SPINE_ENGINE_PORT=8081
ENV_EOF

# 4. Start the Engines
echo "🚀 Launching Parallel Services..."
make dev &

# 5. Wait for the iPad Control Center to be ready
echo -n "⏳ Waiting for Control Center..."
until $(curl -s -f http://localhost:8082 > /dev/null); do
    echo -n "."
    sleep 1
done
echo -e "\033[0;32m READY!\033[0m"

# 6. Final Output Optimized for iPad Copy-Paste
IPAD_URL=$(gp url 8082)

echo ""
echo "🎉 SUCCESS: AFRICA RAILWAYS IS LIVE"
echo "===================================="
echo -e "🔗 \033[1;34mIPAD CONTROL CENTER:\033[0m $IPAD_URL"
echo ""
echo "💡 IPAD TIP: Long-press the link above and 'Open in New Tab'"
echo "   Then, tap the Share icon -> 'Add to Home Screen' for an App-like feel."
echo ""
echo "🎟️  SIMULATE TICKET: ./backend/cmd/spine_engine/simulate_ticket.sh"
echo "===================================="
