#!/bin/bash

# Deployment Verification Script for support.html WebSocket Fix
# Version: 1763060500

PRODUCTION_URL="https://main.d3nnkgw9rvy0ew.amplifyapp.com/pages/support.html"
EXPECTED_VERSION="1763060500"

echo "=================================================="
echo "🔍 DEPLOYMENT VERIFICATION - WebSocket Fix"
echo "=================================================="
echo ""

echo "1️⃣ Testing Production URL: $PRODUCTION_URL"
echo ""

# Check if the page returns 200
echo "📡 Checking HTTP status..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ HTTP Status: $HTTP_STATUS OK"
else
    echo "❌ HTTP Status: $HTTP_STATUS FAILED"
    exit 1
fi
echo ""

# Download the page and check for version markers
echo "🔎 Checking for version markers..."
PAGE_CONTENT=$(curl -s "$PRODUCTION_URL")

# Check for version in title
if echo "$PAGE_CONTENT" | grep -q "v$EXPECTED_VERSION"; then
    echo "✅ Version found in page title: v$EXPECTED_VERSION"
else
    echo "⚠️  Version NOT found in page title"
fi

# Check for SUPPORT_PAGE_VERSION constant
if echo "$PAGE_CONTENT" | grep -q "SUPPORT_PAGE_VERSION.*$EXPECTED_VERSION"; then
    echo "✅ SUPPORT_PAGE_VERSION constant found: $EXPECTED_VERSION"
else
    echo "❌ SUPPORT_PAGE_VERSION constant NOT found or wrong version"
fi

# Check for checkConnectionStatus function
if echo "$PAGE_CONTENT" | grep -q "window.checkConnectionStatus"; then
    echo "✅ window.checkConnectionStatus function found"
else
    echo "❌ window.checkConnectionStatus function NOT found"
fi

# Check for connection timeout logic
if echo "$PAGE_CONTENT" | grep -q "connectionTimeout.*setTimeout"; then
    echo "✅ Connection timeout logic found"
else
    echo "❌ Connection timeout logic NOT found"
fi

# Check for enhanced error handlers
if echo "$PAGE_CONTENT" | grep -q "Close code 1006"; then
    echo "✅ Enhanced close code handler found"
else
    echo "❌ Enhanced close code handler NOT found"
fi

echo ""
echo "2️⃣ Checking Cache-Control Headers..."
HEADERS=$(curl -s -I "$PRODUCTION_URL")

if echo "$HEADERS" | grep -i "cache-control" | grep -q "no-cache"; then
    echo "✅ Cache-Control header contains 'no-cache'"
else
    echo "⚠️  Cache-Control header may not prevent caching"
fi

if echo "$HEADERS" | grep -iq "X-Version.*$EXPECTED_VERSION"; then
    echo "✅ X-Version header found: $EXPECTED_VERSION"
else
    echo "⚠️  X-Version header not found (may not be configured yet)"
fi

echo ""
echo "3️⃣ Testing WebSocket Endpoint..."
WS_ENDPOINT="wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth"
echo "📡 WebSocket URL: $WS_ENDPOINT"

# Test with curl (will fail to upgrade but shows if endpoint is reachable)
WS_TEST=$(curl -s -o /dev/null -w "%{http_code}" --http1.1 \
    -H "Connection: Upgrade" \
    -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Version: 13" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    "$WS_ENDPOINT" 2>&1 || echo "000")

if [ "$WS_TEST" = "101" ] || [ "$WS_TEST" = "426" ] || [ "$WS_TEST" = "200" ]; then
    echo "✅ WebSocket endpoint is reachable (HTTP $WS_TEST)"
elif [ "$WS_TEST" = "403" ]; then
    echo "❌ WebSocket endpoint returns 403 Forbidden - AUTH ISSUE"
else
    echo "⚠️  WebSocket endpoint status: $WS_TEST"
fi

echo ""
echo "=================================================="
echo "📋 VERIFICATION SUMMARY"
echo "=================================================="
echo ""
echo "🌐 Open this URL in an incognito/private window to test:"
echo "   $PRODUCTION_URL?nocache=$(date +%s)"
echo ""
echo "🛠️  In browser console, run these commands:"
echo "   > window.checkConnectionStatus()"
echo "   > merchantChatWS.readyState  // Should be 1 for OPEN"
echo ""
echo "Expected values:"
echo "   - window.SUPPORT_PAGE_VERSION = '$EXPECTED_VERSION'"
echo "   - merchantChatWS.readyState = 1 (WebSocket.OPEN)"
echo "   - Status indicator should show 'متصل' (Connected)"
echo ""
echo "=================================================="
