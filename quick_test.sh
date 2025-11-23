#!/bin/bash
# One-Command Push Notification Test
# Run this after adding FCM_SERVER_KEY to .env file

set -e  # Exit on any error

echo "🚀 Push Notification Quick Test"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "   Create it first: cp .env.example .env"
    exit 1
fi

# Check if FCM key is set
FCM_KEY=$(grep "^FCM_SERVER_KEY=" .env | cut -d'=' -f2-)
if [ -z "$FCM_KEY" ] || [ "$FCM_KEY" = "YOUR_FCM_SERVER_KEY_HERE" ]; then
    echo "❌ Error: FCM_SERVER_KEY not configured in .env file!"
    echo ""
    echo "📋 To fix:"
    echo "   1. Open: nano .env"
    echo "   2. Add your FCM Server Key"
    echo "   3. Save and run this script again"
    echo ""
    echo "🔥 Get key from:"
    echo "   https://console.firebase.google.com/project/wizz-business-app/settings/cloudmessaging"
    exit 1
fi

echo "✅ FCM_SERVER_KEY found in .env"
echo ""

# Check if server is running
if pgrep -f "node.*local-dev-server.js" > /dev/null; then
    echo "🔄 Server is running, restarting to load new .env..."
    pkill -f "node.*local-dev-server.js"
    sleep 2
else
    echo "🔄 Starting server..."
fi

# Start server
node local-dev-server.js > server.log 2>&1 &
SERVER_PID=$!

echo "⏳ Waiting for server to start..."
sleep 4

# Check if server started successfully
if ! pgrep -f "node.*local-dev-server.js" > /dev/null; then
    echo "❌ Error: Server failed to start!"
    echo ""
    echo "📋 Check logs:"
    echo "   tail -50 server.log"
    exit 1
fi

echo "✅ Server started (PID: $SERVER_PID)"
echo ""

# Check server health
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server health check passed"
else
    echo "⚠️  Server health check failed (continuing anyway...)"
fi
echo ""

# Reminder about app state
echo "📱 IMPORTANT: Make sure WhizzMerchants app is in BACKGROUND!"
echo "   (Press Home button on iPhone to minimize the app)"
echo ""
echo "⏳ Waiting 3 seconds for you to minimize the app..."
sleep 3
echo ""

# Run test
echo "🧪 Running push notification test..."
echo "================================"
echo ""

node test_backend_notification.js

echo ""
echo "================================"
echo "🎯 Test Complete!"
echo ""
echo "📊 Check Results:"
echo "   1. Did terminal show 'Sent: 6' (not 'simulating')?"
echo "   2. Did your iPhone receive notification?"
echo "   3. Did you hear notification sound?"
echo ""
echo "📝 View server logs:"
echo "   tail -50 server.log"
echo ""
echo "🌐 Test in browser:"
echo "   open http://localhost:3000/frontend/pages/promotions.html"
echo ""
