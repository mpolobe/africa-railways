#!/bin/bash

# Test script to simulate sentinel mobile app submitting an alert

echo "🧪 Testing Sentinel Mobile App Integration"
echo "=========================================="
echo ""

# Start backend server in background if not running
if ! pgrep -f "backend/bin/backend" > /dev/null; then
    echo "Starting backend server..."
    cd /workspaces/africa-railways/backend
    ./bin/backend &
    BACKEND_PID=$!
    sleep 3
    echo "Backend started with PID: $BACKEND_PID"
    echo ""
fi

# Test 1: Submit a high-priority alert
echo "Test 1: Submitting high-priority safety alert..."
curl -X POST http://localhost:8080/api/sentinel/alert \
  -H "Content-Type: application/json" \
  -d '{
    "sentinel_id": "sentinel-001",
    "sentinel_name": "John Mwamba",
    "type": "safety",
    "priority": "high",
    "title": "Track Obstruction Detected",
    "description": "Large debris on track at KM 45. Immediate attention required.",
    "location": "Kapiri Mposhi Station",
    "route": "Lusaka-Livingstone",
    "latitude": -13.9714,
    "longitude": 28.6821
  }'
echo -e "\n"

# Test 2: Submit a maintenance alert
echo "Test 2: Submitting maintenance alert..."
curl -X POST http://localhost:8080/api/sentinel/alert \
  -H "Content-Type: application/json" \
  -d '{
    "sentinel_id": "sentinel-002",
    "sentinel_name": "Sarah Banda",
    "type": "maintenance",
    "priority": "medium",
    "title": "Signal Light Malfunction",
    "description": "Signal light at junction not functioning properly.",
    "location": "Choma Junction",
    "route": "TAZARA Line",
    "latitude": -16.8089,
    "longitude": 26.9869
  }'
echo -e "\n"

# Test 3: Submit a shift report
echo "Test 3: Submitting shift start report..."
curl -X POST http://localhost:8080/api/sentinel/report \
  -H "Content-Type: application/json" \
  -d '{
    "sentinel_id": "sentinel-001",
    "sentinel_name": "John Mwamba",
    "report_type": "shift_start",
    "location": "Kapiri Mposhi Station",
    "route": "Lusaka-Livingstone",
    "notes": "Starting morning shift. All systems operational.",
    "metrics": {
      "temperature": 24,
      "visibility": "good",
      "passenger_count": 45
    }
  }'
echo -e "\n"

# Test 4: Update sentinel status
echo "Test 4: Updating sentinel status..."
curl -X POST http://localhost:8080/api/sentinel/status \
  -H "Content-Type: application/json" \
  -d '{
    "sentinel_id": "sentinel-001",
    "sentinel_name": "John Mwamba",
    "status": "online",
    "location": "Kapiri Mposhi Station",
    "route": "Lusaka-Livingstone",
    "on_duty": true
  }'
echo -e "\n"

# Test 5: Update sentinel location
echo "Test 5: Updating sentinel location..."
curl -X POST http://localhost:8080/api/sentinel/location \
  -H "Content-Type: application/json" \
  -d '{
    "sentinel_id": "sentinel-001",
    "sentinel_name": "John Mwamba",
    "latitude": -13.9714,
    "longitude": 28.6821,
    "location": "Kapiri Mposhi Station",
    "route": "Lusaka-Livingstone",
    "status": "online"
  }'
echo -e "\n"

# Test 6: Get all alerts
echo "Test 6: Fetching all pending alerts..."
curl -X GET "http://localhost:8080/api/sentinel/alert?status=pending"
echo -e "\n\n"

# Test 7: Get notification count
echo "Test 7: Fetching notification count..."
curl -X GET "http://localhost:8080/api/notifications/count?user_id=admin-1"
echo -e "\n\n"

# Test 8: Get all notifications
echo "Test 8: Fetching all notifications..."
curl -X GET "http://localhost:8080/api/notifications?user_id=admin-1&filter=all"
echo -e "\n\n"

echo "=========================================="
echo "✅ All tests completed!"
echo ""
echo "You can now:"
echo "1. Open the Sentinel Dashboard: sentinel-dashboard.html"
echo "2. Check the Notifications page: sentinel-pages/notifications.html"
echo "3. View alerts in the activity feed"
echo ""
