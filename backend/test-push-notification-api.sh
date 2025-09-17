#!/bin/bash
# Test script for WizzCentral Push Notification API endpoints

echo "🧪 Testing WizzCentral Push Notification API Endpoints"
echo "======================================================"

API_BASE="https://qaetu0jvgi.execute-api.us-east-1.amazonaws.com/prod"

echo ""
echo "📱 1. Testing Device Registration Endpoint..."
echo "POST $API_BASE/register-device"

curl -X POST "$API_BASE/register-device" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "test-token-12345",
    "userId": "test-user-001",
    "role": "driver",
    "platform": "android",
    "region": "Baghdad",
    "appVersion": "1.0.0"
  }' \
  -w "\nStatus Code: %{http_code}\n" \
  -s

echo ""
echo "=============================================="
echo ""

echo "🔔 2. Testing Mass Notification Endpoint..."
echo "POST $API_BASE/send-notification"

curl -X POST "$API_BASE/send-notification" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test push notification from WizzCentral",
    "data": {
      "type": "promotion",
      "promotionId": "test-promo-001"
    }
  }' \
  -w "\nStatus Code: %{http_code}\n" \
  -s

echo ""
echo "=============================================="
echo ""

echo "🎯 3. Testing Regional Promotion Endpoint..."
echo "POST $API_BASE/send-regional-promotion"

curl -X POST "$API_BASE/send-regional-promotion" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Baghdad Special Offer",
    "message": "25% off all orders in Baghdad today!",
    "targetRegion": "Baghdad",
    "promotionData": {
      "discountType": "percentage",
      "discountValue": 25,
      "validUntil": "2024-12-31T23:59:59Z"
    }
  }' \
  -w "\nStatus Code: %{http_code}\n" \
  -s

echo ""
echo "=============================================="
echo "✅ API Testing Complete!"
echo ""
echo "📊 Expected Results:"
echo "- Status Code 200: Success"
echo "- Status Code 500: Lambda function error (check CloudWatch logs)"
echo "- Status Code 403: Permission error"
echo "- Status Code 404: Route not found"
echo ""
echo "🔍 To check CloudWatch logs:"
echo "aws logs describe-log-groups --log-group-name-prefix '/aws/lambda/send' --region us-east-1"
echo ""
echo "📱 For Flutter integration, update notification_api.dart with:"
echo "baseUrl = '$API_BASE'"
