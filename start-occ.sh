#!/bin/bash

# Africa Railways - Operational Control Centre Startup Script

set -e

echo "🚂 Africa Railways - Operational Control Centre"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if config.json exists
if [ ! -f "config.json" ]; then
    echo "❌ Error: config.json not found in root directory"
    echo "   Please create config.json with your credentials"
    echo "   See config.example.json for template"
    exit 1
fi

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found"
    echo "   Some features may not work without environment variables"
fi

# Build binaries if they don't exist
if [ ! -f "monitor" ]; then
    echo "🔨 Building monitor..."
    go build -o monitor monitor.go
fi

if [ ! -f "relayer" ]; then
    echo "🔨 Building relayer..."
    go build -o relayer relayer.go
fi

if [ ! -f "dashboard/occ-dashboard" ]; then
    echo "🔨 Building OCC dashboard..."
    cd dashboard && go build -o occ-dashboard main.go && cd ..
fi

if [ ! -f "ussd-gateway/ussd-gateway" ]; then
    echo "🔨 Building USSD gateway..."
    cd ussd-gateway && go build -o ussd-gateway main.go && cd ..
fi

echo "✅ Binaries ready"
echo ""

# Start relayer bridge in background
echo "🌉 Starting Relayer Bridge..."
./relayer > logs/relayer.log 2>&1 &
RELAYER_PID=$!
echo "   PID: $RELAYER_PID"
echo "   URL: http://localhost:8082"

# Wait a moment
sleep 1

# Start USSD gateway in background
echo "📱 Starting USSD Gateway..."
./ussd-gateway/ussd-gateway > logs/ussd-gateway.log 2>&1 &
USSD_PID=$!
echo "   PID: $USSD_PID"
echo "   URL: http://localhost:8081"

# Wait a moment
sleep 1

# Start monitor in background
echo "🛰️  Starting Monitor Engine..."
./monitor > logs/monitor.log 2>&1 &
MONITOR_PID=$!
echo "   PID: $MONITOR_PID"

# Wait a moment
sleep 2

# Start OCC dashboard
echo "🖥️  Starting OCC Dashboard..."
echo "   URL: http://localhost:8080"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Services Running:"
echo "  • Relayer Bridge: http://localhost:8082"
echo "  • USSD Gateway: http://localhost:8081"
echo "  • OCC Dashboard: http://localhost:8080"
echo "  • Monitor Engine: Background"
echo ""
echo "Logs:"
echo "  • tail -f logs/relayer.log"
echo "  • tail -f logs/ussd-gateway.log"
echo "  • tail -f logs/monitor.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Trap Ctrl+C to cleanup
trap "echo ''; echo '🛑 Stopping services...'; kill $RELAYER_PID $USSD_PID $MONITOR_PID 2>/dev/null; exit 0" INT TERM

# Start dashboard (foreground)
cd dashboard && ./occ-dashboard
