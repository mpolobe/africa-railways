#!/bin/bash

echo "🚀 Africa Railways - Start & Simulate"
echo "======================================"

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed"
    echo "   Install with: sudo apt install -y golang-go"
    exit 1
fi

# Start backend in background
echo "📡 Starting backend on port 8080..."
cd backend && nohup go run main.go > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -n "⏳ Waiting for backend..."
for i in {1..10}; do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo " Ready!"
        break
    fi
    echo -n "."
    sleep 1
done

# Check if backend is running
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo ""
    echo "❌ Backend failed to start"
    echo "   Check logs: tail /tmp/backend.log"
    exit 1
fi

echo ""
echo "✅ Backend is running (PID: $BACKEND_PID)"
echo ""

# Run simulation
echo "🎟️  Running ticket simulation..."
./backend/cmd/spine_engine/simulate_ticket.sh

echo ""
echo "======================================"
echo "✅ Complete!"
echo ""
echo "Services:"
echo "  Backend:  http://localhost:8080"
echo "  Live Feed: http://localhost:8082/live-feed.html"
echo "  Control Center: http://localhost:8082/ipad-control-center.html"
echo ""
echo "To stop backend: kill $BACKEND_PID"
echo "To view logs: tail -f /tmp/backend.log"
