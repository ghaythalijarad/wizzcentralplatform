#!/bin/bash

echo "🚀 WizzCentral Platform Deployment Status Check"
echo "=============================================="
echo ""

AMPLIFY_URL="https://main.d2f5oacwil9cbi.amplifyapp.com"

echo "📅 Current time: $(date)"
echo "🔗 Testing URL: $AMPLIFY_URL"
echo ""

# Test 1: Basic connectivity
echo "1️⃣ Testing basic connectivity..."
if curl -s --max-time 10 --head "$AMPLIFY_URL" > /dev/null 2>&1; then
    echo "✅ Site is reachable"
else
    echo "❌ Site is not reachable"
    exit 1
fi

# Test 2: Get HTTP status
echo ""
echo "2️⃣ Checking HTTP status..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$AMPLIFY_URL")
echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ HTTP 200 OK"
elif [ "$HTTP_STATUS" = "202" ]; then
    echo "⏳ HTTP 202 - Deployment in progress"
elif [ "$HTTP_STATUS" = "404" ]; then
    echo "❌ HTTP 404 - Not found"
else
    echo "⚠️ HTTP $HTTP_STATUS"
fi

# Test 3: Check content
echo ""
echo "3️⃣ Analyzing content..."
CONTENT=$(curl -s --max-time 15 "$AMPLIFY_URL" 2>/dev/null)
CONTENT_LENGTH=${#CONTENT}

echo "Content length: $CONTENT_LENGTH bytes"

if echo "$CONTENT" | grep -q "WizzCentral Platform - Login"; then
    echo "✅ Login page detected"
    LOGIN_PAGE=true
elif echo "$CONTENT" | grep -q "If you are not redirected"; then
    echo "❌ Still showing redirect page"
    LOGIN_PAGE=false
elif echo "$CONTENT" | grep -q "<!DOCTYPE html>"; then
    echo "⚠️ HTML page but not login page"
    LOGIN_PAGE=false
else
    echo "❓ Unknown content type"
    LOGIN_PAGE=false
fi

# Test 4: Check for key resources
echo ""
echo "4️⃣ Checking key resources..."
if echo "$CONTENT" | grep -q "config.js"; then
    echo "✅ Config.js reference found"
else
    echo "❌ Config.js reference missing"
fi

if echo "$CONTENT" | grep -q "dashboard.css"; then
    echo "✅ CSS reference found"
else
    echo "❌ CSS reference missing"
fi

# Summary
echo ""
echo "📊 SUMMARY"
echo "=========="

if [ "$HTTP_STATUS" = "200" ] && [ "$LOGIN_PAGE" = true ]; then
    echo "🎉 SUCCESS: Platform is deployed and working!"
    echo ""
    echo "🔗 Access your platform: $AMPLIFY_URL"
    echo "👤 Test login: g87_a@yahoo.com / Gha@551987"
    echo ""
    echo "✅ Ready for testing:"
    echo "   - Login functionality"
    echo "   - Dashboard navigation"
    echo "   - Mobile responsiveness"
    echo "   - Live chat features"
    exit 0
elif [ "$HTTP_STATUS" = "200" ]; then
    echo "⚠️ PARTIAL: Site is up but showing wrong content"
    echo "💡 This might be a caching issue or deployment in progress"
    echo "🔄 Wait 2-3 minutes and try again"
    exit 1
elif [ "$HTTP_STATUS" = "202" ]; then
    echo "⏳ IN PROGRESS: Deployment is still building"
    echo "🔄 Check again in 2-3 minutes"
    exit 1
else
    echo "❌ FAILURE: Deployment has issues"
    echo "🛠️ Check Amplify console for build logs"
    echo "🔗 https://console.aws.amazon.com/amplify/home"
    exit 1
fi
