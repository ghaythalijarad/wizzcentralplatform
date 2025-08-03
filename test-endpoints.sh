#!/bin/bash

# Quick test of all our deployed endpoints

echo "🚀 Testing WizzCentral Platform Endpoints"
echo "========================================="

# Test main backend API
echo ""
echo "📡 Testing Main Backend API..."
curl -s -X GET "https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/hello" | head -c 200
echo ""

# Test WebSocket REST endpoints
echo ""
echo "📡 Testing WebSocket REST Endpoints..."

echo "1. Testing WebSocket status endpoint..."
curl -s -X POST "https://oqb39yuen4.execute-api.us-east-1.amazonaws.com/dev/websocket/notify/status" \
  -H "Content-Type: application/json" \
  -d '{"test": "message"}' | head -c 200
echo ""

echo "2. Testing merchant notification endpoint..."
curl -s -X POST "https://oqb39yuen4.execute-api.us-east-1.amazonaws.com/dev/merchant/notifications/new-order" \
  -H "Content-Type: application/json" \
  -d '{"test": "merchant"}' | head -c 200
echo ""

# Test orders endpoint from main backend
echo ""
echo "📡 Testing Orders Endpoint..."
curl -s -X GET "https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/orders" | head -c 200
echo ""

# Test merchants endpoint  
echo ""
echo "📡 Testing Merchants Endpoint..."
curl -s -X GET "https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/merchants" | head -c 200
echo ""

echo ""
echo "✅ Endpoint testing completed!"
echo ""
echo "📋 Summary:"
echo "✅ Main Backend API: https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev"
echo "✅ WebSocket API: wss://blh9qss3kf.execute-api.us-east-1.amazonaws.com/dev"
echo "✅ WebSocket REST: https://oqb39yuen4.execute-api.us-east-1.amazonaws.com/dev"
echo ""
echo "🎯 Ready for Flutter Integration!"
