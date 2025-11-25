#!/bin/bash

# Local Testing Script for WebSocket Fix
# This starts a local server and opens the support page for testing

echo "🚀 Starting local development server..."

# Kill any existing server on port 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Start Python HTTP server in background
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
python3 -m http.server 8080 --directory . > /dev/null 2>&1 &
SERVER_PID=$!

echo "✅ Server started on http://localhost:8080 (PID: $SERVER_PID)"
echo ""
echo "📋 Testing Checklist:"
echo "   1. Open browser to: http://localhost:8080/frontend/pages/support.html"
echo "   2. Open DevTools Console (Cmd+Option+J)"
echo "   3. Run: window.checkConnectionStatus()"
echo "   4. Check: merchantChatWS.readyState (should be 1 for OPEN)"
echo "   5. Verify UI shows 'متصل' (Connected)"
echo ""
echo "🌐 Opening browser..."
sleep 2

# Open in Chrome with cache disabled
open -na "Google Chrome" --args --new-window "http://localhost:8080/frontend/pages/support.html?nocache=$(date +%s)"

echo ""
echo "✋ Press Ctrl+C to stop the server when done testing"
echo ""

# Wait for user to stop
wait $SERVER_PID
