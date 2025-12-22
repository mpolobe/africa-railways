#!/bin/bash

# Twilio Configuration Setup Script
# Run this in Gitpod to configure Twilio environment variables

echo "🔧 Setting up Twilio Configuration..."
echo "======================================"

# Set Twilio Account SID
gp env TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "✅ TWILIO_ACCOUNT_SID set"

# Set Twilio Messaging Service SID
gp env TWILIO_MESSAGING_SERVICE_SID="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "✅ TWILIO_MESSAGING_SERVICE_SID set"

# Prompt for Auth Token (secure input)
echo ""
echo "⚠️  IMPORTANT: Enter your Twilio Auth Token"
echo "This will be stored securely in Gitpod environment variables"
echo ""
read -sp "Twilio Auth Token: " TWILIO_AUTH_TOKEN
echo ""

if [ -z "$TWILIO_AUTH_TOKEN" ]; then
    echo "❌ Auth Token cannot be empty"
    exit 1
fi

gp env TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN"
echo "✅ TWILIO_AUTH_TOKEN set (hidden)"

# Prompt for Twilio Phone Number
echo ""
echo "Enter your Twilio Phone Number (e.g., +15551234567):"
read -p "Phone Number: " TWILIO_NUMBER

if [ -z "$TWILIO_NUMBER" ]; then
    echo "⚠️  No phone number provided, skipping..."
else
    gp env TWILIO_NUMBER="$TWILIO_NUMBER"
    echo "✅ TWILIO_NUMBER set: $TWILIO_NUMBER"
fi

# Update backend .env file
echo ""
echo "📝 Updating backend/.env file..."

cat > backend/.env << EOF
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
TWILIO_NUMBER=${TWILIO_NUMBER:-+15551234567}

# Africa's Talking Configuration (Optional)
AT_USERNAME=${AT_USERNAME:-sandbox}
AT_API_KEY=${AT_API_KEY:-your_api_key_here}
AT_SENDER_ID=${AT_SENDER_ID:-SOVEREIGN}

# SMS Provider Selection
SMS_PROVIDER=twilio

# Backend Configuration
BACKEND_PORT=8080
SPINE_ENGINE_PORT=8081
EOF

echo "✅ backend/.env updated"

# Verify configuration
echo ""
echo "🔍 Verifying Configuration..."
echo "======================================"
echo "TWILIO_ACCOUNT_SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "TWILIO_MESSAGING_SERVICE_SID: MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "TWILIO_AUTH_TOKEN: [HIDDEN]"
echo "TWILIO_NUMBER: ${TWILIO_NUMBER:-Not set}"
echo ""

echo "✅ Twilio configuration complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Restart your terminal or run: source ~/.bashrc"
echo "2. Test SMS: cd backend && go run test_twilio.go"
echo "3. Start server: make dev"
echo ""
echo "💡 To update Auth Token later, run:"
echo "   gp env TWILIO_AUTH_TOKEN=\"your_new_token\""
