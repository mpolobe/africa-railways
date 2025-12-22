#!/bin/bash

echo "🎟️  Simulating Train Ticket Purchase..."

# Get current time
TIMESTAMP=$(date +"%I:%M %p")

# Create event data
EVENT_DATA=$(cat <<JSON
{
  "message": "🪙 Africoin Minted: Passenger 0x924... received 50 AFRC at $TIMESTAMP"
}
JSON
)

# Send to backend
RESPONSE=$(curl -s -X POST http://localhost:8080/add-event \
  -H "Content-Type: application/json" \
  -d "$EVENT_DATA" 2>&1)

if [ $? -eq 0 ]; then
  echo "✅ Event pushed to Dashboard!"
  echo "Response: $RESPONSE"
else
  echo "❌ Error: Could not connect to backend"
  echo "Make sure the backend is running on port 8080"
fi
