#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "🚀 Opening Support Page"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if server is running
if ! lsof -i:8080 > /dev/null 2>&1; then
    echo "❌ Server not running on port 8080"
    echo "Starting server..."
    cd "$(dirname "$0")"
    nohup python3 -m http.server 8080 > server.log 2>&1 &
    sleep 3
    echo "✅ Server started"
else
    echo "✅ Server already running on port 8080"
fi

echo ""
echo "📋 Copy this URL and paste it into your browser:"
echo ""
echo "    http://localhost:8080/frontend/pages/support.html"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🔍 Quick Test - Run this to verify server is working:"
echo "    curl http://localhost:8080/frontend/pages/support.html | head -10"
echo ""

# Try to open in default browser
open "http://localhost:8080/frontend/pages/support.html?t=$(date +%s)"

echo "✅ Browser should open automatically"
echo "   If you see a 404 error, you're looking at an old tab"
echo "   Close that tab and manually paste the URL above"
echo ""
