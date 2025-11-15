#!/bin/bash

# Kill any existing Chrome instances to get a fresh start
# pkill -f "Google Chrome" 2>/dev/null || true
# sleep 1

# Start server if not running
if ! lsof -i:8080 > /dev/null 2>&1; then
    echo "🚀 Starting server on port 8080..."
    cd "$(dirname "$0")"
    nohup python3 -m http.server 8080 > server.log 2>&1 &
    sleep 2
fi

# Generate unique timestamp to bust cache
TIMESTAMP=$(date +%s)

# Full URL to the support page
URL="http://localhost:8080/frontend/pages/support.html?nocache=${TIMESTAMP}"

echo "🌐 Opening support page in Chrome..."
echo "📍 URL: $URL"

# Open in Chrome with cache disabled
open -na "Google Chrome" --args \
    --new-window \
    --disable-application-cache \
    --disable-cache \
    --disk-cache-size=1 \
    "${URL}"

echo "✅ Done! Check Chrome for the support page."
echo ""
echo "📊 Connection Status:"
echo "   - Server: http://localhost:8080"
echo "   - Support Page: ${URL}"
echo "   - WebSocket: wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth"
echo ""
echo "🔍 To verify WebSocket connection, open DevTools (F12) and check:"
echo "   - Console for: '✅ Merchant chat WebSocket connected'"
echo "   - Run: window.checkConnectionStatus()"
