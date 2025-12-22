#!/bin/bash
echo "🔍 --- Sovereign Hub Service Status ---"

# Check Go
if command -v go >/dev/null 2>&1; then
    echo "✅ Go: $(go version | awk '{print $3}')"
else
    echo "❌ Go: NOT INSTALLED"
fi

# Check Backend (Port 8080)
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Backend Engine: Running on Port 8080"
else
    echo "❌ Backend Engine: DOWN"
fi

# Check Frontend 1 (Port 8082)
if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Web Server (8082): Running"
else
    echo "❌ Web Server (8082): DOWN"
fi

# Check Frontend 2 (Port 3000)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Web Server (3000): Running"
else
    echo "❌ Web Server (3000): DOWN"
fi

# Check Sui (Port 9000)
if lsof -Pi :9000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Sui Blockchain: Running on Port 9000"
else
    echo "❌ Sui Blockchain: DOWN"
fi

echo "----------------------------------------"
