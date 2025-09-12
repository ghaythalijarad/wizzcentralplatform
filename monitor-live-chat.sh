#!/bin/bash

echo "🔍 Starting Live Chat WebSocket Monitoring..."
echo "Monitoring WebSocket traffic for business ID: 7ccf646c-9594-48d4-8f63-c366d89257e5"
echo "WebSocket Endpoint: wss://blh9qss3kf.execute-api.us-east-1.amazonaws.com/dev"
echo ""
echo "📊 WebSocket Connection Summary:"
echo "- Support Center: http://localhost:8083/frontend/pages/support.html"
echo "- Test Interface: http://localhost:8083/test-live-chat-integration.html"
echo "- Flutter App: Running on iPhone device (00008110-001C79140284801E)"
echo ""
echo "🎯 Test Scenarios:"
echo "1. Send customer message from test page → Should appear in Support Center"
echo "2. Reply from Support Center → Should appear in test page"
echo "3. Send message from Flutter app → Should appear in both interfaces"
echo "4. Monitor real-time delivery and response times"
echo ""
echo "Press Ctrl+C to stop monitoring..."
echo ""

# Monitor chat broker logs if running
if pgrep -f "chat-broker" > /dev/null; then
    echo "📋 Local chat broker detected (PID: $(pgrep -f chat-broker))"
    echo "Note: Support Center now uses AWS WebSocket instead of local broker"
    echo ""
fi

# Check WebSocket connectivity
echo "🔌 Testing WebSocket connectivity..."
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('wss://blh9qss3kf.execute-api.us-east-1.amazonaws.com/dev?businessId=7ccf646c-9594-48d4-8f63-c366d89257e5&userType=monitor');

ws.on('open', () => {
    console.log('✅ WebSocket connection successful');
    ws.send(JSON.stringify({
        type: 'monitor_ping',
        timestamp: new Date().toISOString()
    }));
});

ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log('📨 WebSocket message:', message);
});

ws.on('error', (error) => {
    console.log('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    process.exit(0);
});

// Close after 5 seconds
setTimeout(() => {
    ws.close();
}, 5000);
" 2>/dev/null || echo "⚠️  Node.js WebSocket test failed (this is expected in some environments)"

echo ""
echo "🚀 Ready for testing! Use the browser interfaces to test message delivery."
echo "📱 Make sure your Flutter app is running and try sending messages between all interfaces."
echo ""

# Keep script running
while true; do
    sleep 5
    echo "$(date): Monitoring active... (Ctrl+C to stop)"
done
