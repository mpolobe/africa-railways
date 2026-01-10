#!/bin/bash

# Facebook Integration Setup Script
# This script helps configure Facebook integration for the Sentinel Dashboard

echo "📘 Facebook Integration Setup"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env file..."
    touch backend/.env
fi

echo "This script will help you configure Facebook integration."
echo ""
echo "You'll need:"
echo "1. Facebook Page ID for facebook.com/afrcsentinel"
echo "2. Facebook Page Access Token"
echo ""
echo "See FACEBOOK_INTEGRATION_GUIDE.md for detailed instructions."
echo ""

# Get Page ID
read -p "Enter Facebook Page ID: " PAGE_ID

if [ -z "$PAGE_ID" ]; then
    echo "❌ Page ID is required"
    exit 1
fi

# Get Page Access Token
read -p "Enter Facebook Page Access Token: " PAGE_TOKEN

if [ -z "$PAGE_TOKEN" ]; then
    echo "❌ Page Access Token is required"
    exit 1
fi

# Update .env file
echo "" >> backend/.env
echo "# Facebook Integration" >> backend/.env
echo "FACEBOOK_PAGE_ID=$PAGE_ID" >> backend/.env
echo "FACEBOOK_PAGE_ACCESS_TOKEN=$PAGE_TOKEN" >> backend/.env

echo ""
echo "✅ Configuration saved to backend/.env"
echo ""

# Test the configuration
echo "Testing Facebook integration..."
echo ""

# Start backend in background
cd backend
if [ -f "bin/backend" ]; then
    ./bin/backend &
    BACKEND_PID=$!
    sleep 2
    
    # Test status endpoint
    echo "Checking Facebook status..."
    RESPONSE=$(curl -s http://localhost:8080/api/facebook/status)
    echo "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"configured":true'; then
        echo ""
        echo "✅ Facebook integration is configured correctly!"
        echo ""
        echo "You can now:"
        echo "1. Open sentinel-dashboard.html"
        echo "2. Create a post in the newsfeed"
        echo "3. Click 'Share to Facebook' button"
        echo "4. Check facebook.com/afrcsentinel for the post"
    else
        echo ""
        echo "⚠️  Facebook integration may not be configured correctly"
        echo "Please check the values and try again"
    fi
    
    # Stop backend
    kill $BACKEND_PID 2>/dev/null
else
    echo "⚠️  Backend binary not found. Please build it first:"
    echo "cd backend && go build -o bin/backend main.go reports.go newsfeed.go notifications.go sentinel_api.go facebook.go"
fi

echo ""
echo "For detailed setup instructions, see:"
echo "  FACEBOOK_INTEGRATION_GUIDE.md"
echo ""
