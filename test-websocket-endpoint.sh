#!/bin/bash

# WebSocket Endpoint Diagnostic Tool
# Tests the AWS WebSocket API Gateway directly

WS_ENDPOINT="wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth"

echo "=================================================="
echo "🔍 WebSocket Endpoint Diagnostic"
echo "=================================================="
echo ""
echo "Testing endpoint: $WS_ENDPOINT"
echo ""

# Test 1: Check if endpoint is reachable via HTTPS
echo "1️⃣ Testing HTTPS endpoint reachability..."
HTTP_URL="https://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HTTP_URL" 2>&1)

if [ "$HTTP_STATUS" = "426" ]; then
    echo "   ✅ Endpoint returns 426 (Upgrade Required) - this is EXPECTED for WebSocket"
elif [ "$HTTP_STATUS" = "403" ]; then
    echo "   ❌ Endpoint returns 403 Forbidden - AUTHENTICATION ISSUE"
elif [ "$HTTP_STATUS" = "000" ]; then
    echo "   ⚠️  Cannot reach endpoint - network issue or wrong URL"
else
    echo "   ⚠️  Unexpected status: $HTTP_STATUS"
fi
echo ""

# Test 2: Try WebSocket upgrade (will fail but shows what happens)
echo "2️⃣ Attempting WebSocket upgrade handshake..."
WS_TEST=$(curl -s -i -N \
    -H "Connection: Upgrade" \
    -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Version: 13" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    "$HTTP_URL" 2>&1 | head -20)

if echo "$WS_TEST" | grep -q "101 Switching Protocols"; then
    echo "   ✅ WebSocket upgrade successful!"
elif echo "$WS_TEST" | grep -q "403"; then
    echo "   ❌ 403 Forbidden - Check AWS API Gateway authorization settings"
    echo ""
    echo "   📝 ACTION REQUIRED:"
    echo "      1. Go to AWS Console > API Gateway"
    echo "      2. Select your WebSocket API (bx4snzqxpd)"
    echo "      3. Go to Routes > \$connect"
    echo "      4. Check 'Authorization' is set to NONE"
    echo "      5. Deploy the stage: Actions > Deploy API > Stage: ghayth"
elif echo "$WS_TEST" | grep -q "426"; then
    echo "   ℹ️  426 Upgrade Required (expected for curl, browser WebSocket should work)"
else
    echo "   ⚠️  Unexpected response:"
    echo "$WS_TEST" | head -5
fi
echo ""

# Test 3: Check AWS API Gateway configuration (requires AWS CLI)
echo "3️⃣ Checking AWS API Gateway configuration..."
if command -v aws &> /dev/null; then
    echo "   Fetching WebSocket API details..."
    
    # Get API details
    API_INFO=$(aws apigatewayv2 get-api --api-id bx4snzqxpd --region us-east-1 2>&1)
    
    if echo "$API_INFO" | grep -q "ApiEndpoint"; then
        echo "   ✅ API exists and is accessible"
        
        # Check $connect route authorization
        ROUTE_AUTH=$(aws apigatewayv2 get-route \
            --api-id bx4snzqxpd \
            --route-id $(aws apigatewayv2 get-routes --api-id bx4snzqxpd --region us-east-1 | jq -r '.Items[] | select(.RouteKey == "$connect") | .RouteId') \
            --region us-east-1 2>&1 | jq -r '.AuthorizationType // "NONE"')
        
        if [ "$ROUTE_AUTH" = "NONE" ]; then
            echo "   ✅ \$connect route has Authorization: NONE (correct)"
        else
            echo "   ⚠️  \$connect route has Authorization: $ROUTE_AUTH"
            echo "      This may require authentication tokens"
        fi
    else
        echo "   ❌ Cannot access API details"
    fi
else
    echo "   ⚠️  AWS CLI not installed - skipping AWS configuration check"
    echo "      Install: brew install awscli"
fi
echo ""

echo "=================================================="
echo "📋 SUMMARY"
echo "=================================================="
echo ""
echo "If you see 403 errors, the WebSocket endpoint requires authentication."
echo "To fix:"
echo "  1. AWS Console > API Gateway > WebSocket API (bx4snzqxpd)"
echo "  2. Routes > \$connect > Edit"
echo "  3. Set Authorization to 'NONE'"
echo "  4. Actions > Deploy API > Select stage 'ghayth'"
echo ""
echo "Then test locally with: ./test-local.sh"
echo "=================================================="
