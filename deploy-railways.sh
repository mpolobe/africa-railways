#!/bin/bash

# 🚂 Deploy Railways Sovereign Engine

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚂 Deploying Railways Sovereign Engine                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd backend

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Build locally first
echo "📦 Building locally..."
if command -v go &> /dev/null; then
    go build -o railways-engine main.go
    echo "✅ Build successful"
    
    # Run tests if they exist
    if [ -f "main_test.go" ]; then
        echo "🧪 Running tests..."
        go test ./...
        echo "✅ Tests passed"
    fi
else
    echo "⚠️  Go not installed, skipping local build"
fi

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ Railways Engine Deployed!                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 URL: https://africa-railways.vercel.app"
echo "💚 Health: https://africa-railways.vercel.app/api/health"
echo "📊 Reports: https://africa-railways.vercel.app/api/reports"
echo ""
