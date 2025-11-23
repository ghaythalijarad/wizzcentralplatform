#!/bin/zsh

echo "🧪 Quick Push Notification Test"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FUNCTION_NAME="whizz-central-send-promotion-notification"
REGION="us-east-1"

# Simple test payload without emojis
TEST_PAYLOAD='{"title":"Test Notification","message":"Testing push notification system from WhizzCentral","campaignId":"test_123","type":"promotion"}'

echo "${BLUE}📱 Testing Lambda function...${NC}"
echo "Payload: $TEST_PAYLOAD"
echo ""

# Invoke Lambda
aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload "$TEST_PAYLOAD" \
    --region $REGION \
    --no-cli-pager \
    /tmp/test-response.json > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Lambda invoked successfully!${NC}"
    echo ""
    echo "${BLUE}Response:${NC}"
    cat /tmp/test-response.json | jq '.' 2>/dev/null || cat /tmp/test-response.json
    echo ""
    rm -f /tmp/test-response.json
else
    echo "${RED}❌ Lambda invocation failed${NC}"
    exit 1
fi

echo ""
echo "${BLUE}📊 Recent logs:${NC}"
aws logs tail /aws/lambda/$FUNCTION_NAME \
    --since 2m \
    --format short \
    --region $REGION \
    --no-cli-pager 2>/dev/null | tail -30

echo ""
echo "${GREEN}✅ Test complete!${NC}"
