#!/bin/bash

# Simple test for cross-platform authentication
echo "🧪 Testing Cross-Platform Authentication"
echo "======================================"

# Test 1: Valid API Key
echo "📡 Test 1: Valid API Key"
curl -X POST \
  https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/public/chat/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wizzdriver_mobile_app_v1" \
  -d '{
    "message": "Test message from WizzDriver Flutter app",
    "metadata": {
      "driverId": "test-driver-123",
      "businessId": "dev-business-123",
      "platform": "flutter",
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
    }
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n" 

# Test 2: Invalid API Key
echo "📡 Test 2: Invalid API Key (should fail)"
curl -X POST \
  https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/public/chat/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: invalid_key" \
  -d '{
    "message": "This should fail",
    "metadata": {}
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n"

# Test 3: No API Key
echo "📡 Test 3: No API Key (should fail)"
curl -X POST \
  https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/public/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "This should also fail",
    "metadata": {}
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n"

# Test 4: CORS Preflight
echo "📡 Test 4: CORS Preflight"
curl -X OPTIONS \
  https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/public/chat/send \
  -H "Origin: https://flutter-app.example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, X-API-Key" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n🎯 Testing Complete!"
echo "Expected Results:"
echo "• Test 1: Status 200 with success: true, bridged: true"
echo "• Test 2: Status 401 with error message"
echo "• Test 3: Status 401 with error message"
echo "• Test 4: Status 200 with CORS headers"
