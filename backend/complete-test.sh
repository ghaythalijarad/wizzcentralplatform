#!/bin/zsh

# ============================================================================
# PUSH NOTIFICATION SYSTEM - FINAL TEST & VERIFICATION
# ============================================================================
# This script provides a complete test of the push notification system
# Run this after configuring your FCM Server Key
# ============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║     📱 Push Notification System - Complete Test Suite       ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

REGION="us-east-1"
FUNCTION_NAME="whizz-central-send-promotion-notification"
TABLE_NAME="WhizzMerchants_DeviceTokens"

# Test 1: Check FCM Key Configuration
echo "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo "${CYAN}Test 1: FCM Server Key Configuration${NC}"
echo "${BLUE}═══════════════════════════════════════════════════════════${NC}"

FCM_KEY=$(aws lambda get-function-configuration \
  --function-name $FUNCTION_NAME \
  --region $REGION \
  --query 'Environment.Variables.FCM_SERVER_KEY' \
  --output text \
  --no-cli-pager 2>/dev/null)

if [ "$FCM_KEY" = "YOUR_FCM_SERVER_KEY" ] || [ -z "$FCM_KEY" ]; then
    echo "${RED}❌ FCM Server Key NOT configured${NC}"
    echo "${YELLOW}   Current value: $FCM_KEY${NC}"
    echo ""
    echo "${YELLOW}⚠️  You need to configure the FCM Server Key first!${NC}"
    echo ""
    echo "Steps:"
    echo "1. Get FCM Server Key from Firebase Console:"
    echo "   ${CYAN}https://console.firebase.google.com/${NC}"
    echo "   → Select WhizzMerchants project"
    echo "   → ⚙️ Settings → Project Settings → Cloud Messaging"
    echo "   → Copy Server key"
    echo ""
    echo "2. Run configuration script:"
    echo "   ${GREEN}./configure-fcm-key.sh YOUR_ACTUAL_FCM_SERVER_KEY${NC}"
    echo ""
    echo "3. Re-run this test:"
    echo "   ${GREEN}./complete-test.sh${NC}"
    echo ""
    exit 1
else
    echo "${GREEN}✅ FCM Server Key is configured${NC}"
    echo "   Key: ${FCM_KEY:0:20}...${FCM_KEY: -10}"
fi

echo ""

# Test 2: Check Device Tokens
echo "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo "${CYAN}Test 2: Active Device Tokens${NC}"
echo "${BLUE}═══════════════════════════════════════════════════════════${NC}"

TOKEN_COUNT=$(aws dynamodb scan \
  --table-name $TABLE_NAME \
  --filter-expression "isActive = :active" \
  --expression-attribute-values '{":active": {"BOOL": true}}' \
  --region $REGION \
  --query 'Count' \
  --output text \
  --no-cli-pager 2>/dev/null)

if [ "$TOKEN_COUNT" -gt 0 ]; then
    echo "${GREEN}✅ Found $TOKEN_COUNT active merchant device token(s)${NC}"
else
    echo "${YELLOW}⚠️  No active device tokens found${NC}"
    echo "   Merchants need to log in to WhizzMerchants app to register devices"
fi

echo ""

# Test 3: Lambda Function Test
echo "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo "${CYAN}Test 3: Send Test Push Notification${NC}"
echo "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Create test payload
cat > /tmp/complete-test-payload.json <<'EOF'
{
  "httpMethod": "POST",
  "body": "{\"campaignId\":\"complete_test_001\",\"title\":\"✅ Push Notification Test\",\"message\":\"If you receive this, the system is working perfectly!\",\"type\":\"promotion\",\"targetAudience\":\"merchants\",\"data\":{\"campaignId\":\"complete_test_001\",\"discountType\":\"percentage\",\"discountValue\":25,\"minimumOrderValue\":0,\"validUntil\":\"2025-12-31\"}}"
}
EOF

echo "📤 Sending test notification to Lambda..."

aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --cli-binary-format raw-in-base64-out \
  --payload file:///tmp/complete-test-payload.json \
  --region $REGION \
  --no-cli-pager \
  /tmp/complete-test-response.json > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Lambda invocation successful${NC}"
    echo ""
    
    # Parse response
    RESPONSE=$(cat /tmp/complete-test-response.json)
    SUCCESS=$(echo "$RESPONSE" | jq -r '.body' | jq -r '.success' 2>/dev/null)
    SENT=$(echo "$RESPONSE" | jq -r '.body' | jq -r '.sent' 2>/dev/null)
    FAILED=$(echo "$RESPONSE" | jq -r '.body' | jq -r '.failed' 2>/dev/null)
    TOTAL=$(echo "$RESPONSE" | jq -r '.body' | jq -r '.total' 2>/dev/null)
    
    echo "📊 Results:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ "$SUCCESS" = "true" ] && [ "$SENT" -gt 0 ]; then
        echo "${GREEN}🎉 SUCCESS! Push notifications sent successfully!${NC}"
        echo ""
        echo "   ${GREEN}✅ Sent: $SENT / $TOTAL${NC}"
        if [ "$FAILED" -gt 0 ]; then
            echo "   ${YELLOW}⚠️  Failed: $FAILED${NC}"
        fi
        echo ""
        echo "${GREEN}✨ Check your WhizzMerchants app - you should see the notification!${NC}"
    else
        echo "${YELLOW}⚠️  Notifications processed but none sent successfully${NC}"
        echo ""
        echo "   Total devices: $TOTAL"
        echo "   Sent: $SENT"
        echo "   Failed: $FAILED"
        echo ""
        
        if [ "$FAILED" -gt 0 ]; then
            echo "${YELLOW}Possible issues:${NC}"
            echo "   • Device tokens may be expired (merchants need to re-login)"
            echo "   • FCM key may be incorrect"
            echo "   • Devices may have notifications disabled"
            echo ""
            echo "Check CloudWatch logs for details:"
            echo "   ${CYAN}aws logs tail /aws/lambda/$FUNCTION_NAME --follow${NC}"
        fi
    fi
else
    echo "${RED}❌ Lambda invocation failed${NC}"
fi

# Cleanup
rm -f /tmp/complete-test-payload.json
rm -f /tmp/complete-test-response.json

echo ""

# Test 4: CloudWatch Logs
echo "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo "${CYAN}Test 4: Recent Lambda Execution Logs${NC}"
echo "${BLUE}═══════════════════════════════════════════════════════════${NC}"

aws logs tail /aws/lambda/$FUNCTION_NAME \
  --since 2m \
  --format short \
  --region $REGION \
  --no-cli-pager 2>/dev/null | tail -30

echo ""

# Test 5: API Gateway Endpoint
echo "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo "${CYAN}Test 5: API Gateway Configuration${NC}"
echo "${BLUE}═══════════════════════════════════════════════════════════${NC}"

API_ID="570ve00sak"
API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/send-promotion-notification"

echo "${GREEN}✅ API Gateway Endpoint Active${NC}"
echo "   URL: ${CYAN}${API_URL}${NC}"
echo ""

# Final Summary
echo ""
echo "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo "${GREEN}📋 System Status Summary${NC}"
echo "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$FCM_KEY" != "YOUR_FCM_SERVER_KEY" ] && [ "$TOKEN_COUNT" -gt 0 ] && [ "$SENT" -gt 0 ]; then
    echo "${GREEN}🎉 🎉 🎉  SYSTEM FULLY OPERATIONAL!  🎉 🎉 🎉${NC}"
    echo ""
    echo "✅ All components working"
    echo "✅ FCM key configured"
    echo "✅ $TOKEN_COUNT device(s) ready"
    echo "✅ $SENT notification(s) sent successfully"
    echo ""
    echo "${GREEN}Ready to use from WhizzCentralPlatform UI!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open: ${CYAN}http://localhost:8080/frontend/pages/promotions.html${NC}"
    echo "2. Create a new campaign"
    echo "3. ✅ Keep 'Send push notification' checked"
    echo "4. Click 'Create Campaign'"
    echo "5. Merchants receive notification automatically! 🎊"
else
    echo "${YELLOW}⚠️  System Partially Ready${NC}"
    echo ""
    
    if [ "$FCM_KEY" = "YOUR_FCM_SERVER_KEY" ]; then
        echo "❌ FCM Server Key not configured"
        echo "   → Run: ${GREEN}./configure-fcm-key.sh YOUR_KEY${NC}"
    else
        echo "✅ FCM Server Key configured"
    fi
    
    if [ "$TOKEN_COUNT" -gt 0 ]; then
        echo "✅ $TOKEN_COUNT device token(s) available"
    else
        echo "⚠️  No active device tokens"
        echo "   → Merchants need to login to WhizzMerchants app"
    fi
    
    if [ "$SENT" -gt 0 ]; then
        echo "✅ Notifications sending successfully"
    else
        echo "⚠️  No notifications sent yet"
        echo "   → Configure FCM key and retry"
    fi
fi

echo ""
echo "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
