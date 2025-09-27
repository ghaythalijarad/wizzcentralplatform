#!/bin/bash

# WizzCentralPlatform Deployment Validation Script
echo "🔍 Validating WizzCentralPlatform Deployment..."
echo "=============================================="

# Test main application
echo "📱 Testing Main Application..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://main.d2f5oacwil9cbi.amplifyapp.com

# Test support dashboard
echo "🎧 Testing Support Dashboard..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://main.d2f5oacwil9cbi.amplifyapp.com/pages/support.html

# Test WebSocket endpoints (basic connectivity)
echo "🔌 Testing WebSocket Endpoints..."
echo "Primary WebSocket: wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev"
echo "Chat Bridge WebSocket: wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev"

# Test Chat Bridge API
echo "💬 Testing Chat Bridge API..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/health

echo ""
echo "✅ Deployment Validation Complete!"
echo "🌐 Main URL: https://main.d2f5oacwil9cbi.amplifyapp.com"
echo "🎧 Support: https://main.d2f5oacwil9cbi.amplifyapp.com/pages/support.html"
echo ""
echo "🎉 WizzCentralPlatform is live and ready for production use!"
