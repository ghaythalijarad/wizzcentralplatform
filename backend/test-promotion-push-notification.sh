#!/bin/zsh

echo "🧪 Testing Promotion Push Notification System"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REGION="us-east-1"
TABLE_NAME="WhizzMerchants_DeviceTokens"
FUNCTION_NAME="whizz-central-send-promotion-notification"

echo ""
echo "${BLUE}=== Test 1: Check Device Tokens Table ===${NC}"
echo "Checking if merchant device tokens exist..."

TOKEN_COUNT=$(aws dynamodb scan \
  --table-name $TABLE_NAME \
  --filter-expression "isActive = :active" \
  --expression-attribute-values '{":active": {"BOOL": true}}' \
  --region $REGION \
  --query 'Count' \
  --output text \
  --no-cli-pager 2>/dev/null)

if [ $? -eq 0 ]; then
    if [ "$TOKEN_COUNT" -gt 0 ]; then
        echo "${GREEN}✅ Found $TOKEN_COUNT active merchant device token(s)${NC}"
    else
        echo "${YELLOW}⚠️ No active device tokens found. Merchants need to log in to the app.${NC}"
    fi
else
    echo "${RED}❌ Failed to query DynamoDB table${NC}"
fi

echo ""
echo "${BLUE}=== Test 2: Check Lambda Function ===${NC}"
echo "Checking if Lambda function exists..."

FUNCTION_EXISTS=$(aws lambda get-function \
  --function-name $FUNCTION_NAME \
  --region $REGION \
  --no-cli-pager 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Lambda function exists${NC}"
    
    # Check environment variables
    FCM_KEY=$(aws lambda get-function-configuration \
      --function-name $FUNCTION_NAME \
      --region $REGION \
      --query 'Environment.Variables.FCM_SERVER_KEY' \
      --output text \
      --no-cli-pager 2>/dev/null)
    
    if [ "$FCM_KEY" != "None" ] && [ ! -z "$FCM_KEY" ]; then
        echo "${GREEN}✅ FCM_SERVER_KEY is configured${NC}"
    else
        echo "${YELLOW}⚠️ FCM_SERVER_KEY not configured. Push notifications will be simulated.${NC}"
        echo "   Set it with:"
        echo "   aws lambda update-function-configuration \\"
        echo "     --function-name $FUNCTION_NAME \\"
        echo "     --environment Variables={DEVICE_TOKENS_TABLE=$TABLE_NAME,FCM_SERVER_KEY=YOUR_KEY} \\"
        echo "     --region $REGION"
    fi
else
    echo "${RED}❌ Lambda function not found. Run deployment script first:${NC}"
    echo "   ./deploy-promotion-push-notification.sh"
fi

echo ""
echo "${BLUE}=== Test 3: Test Lambda Function (Dry Run) ===${NC}"
echo "Sending test notification..."

TEST_PAYLOAD='{"httpMethod":"POST","body":"{\"title\":\"Test Promotion\",\"message\":\"This is a test push notification from WhizzCentralPlatform\",\"campaignId\":\"test_123\",\"type\":\"promotion\",\"data\":{\"discountValue\":25,\"discountType\":\"percentage\"}}"}'

INVOKE_RESULT=$(aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload "$TEST_PAYLOAD" \
  --region $REGION \
  --no-cli-pager \
  /tmp/lambda-test-output.json 2>&1)

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Lambda invocation successful${NC}"
    echo ""
    echo "Response:"
    cat /tmp/lambda-test-output.json | jq '.' 2>/dev/null || cat /tmp/lambda-test-output.json
    rm -f /tmp/lambda-test-output.json
else
    echo "${RED}❌ Lambda invocation failed${NC}"
    echo "$INVOKE_RESULT"
fi

echo ""
echo "${BLUE}=== Test 4: Check CloudWatch Logs ===${NC}"
echo "Recent Lambda execution logs:"

aws logs tail /aws/lambda/$FUNCTION_NAME \
  --since 5m \
  --format short \
  --region $REGION \
  --no-cli-pager 2>/dev/null | tail -20

echo ""
echo "${BLUE}=== Test Summary ===${NC}"
echo ""
echo "✓ DynamoDB Table: $TABLE_NAME"
echo "✓ Lambda Function: $FUNCTION_NAME"
echo "✓ Region: $REGION"
echo ""
echo "${YELLOW}Next Steps:${NC}"
echo "1. Ensure merchants are logged in to WhizzMerchants app"
echo "2. Configure FCM_SERVER_KEY if not already set"
echo "3. Set up API Gateway endpoint for /send-promotion-notification"
echo "4. Test from WhizzCentralPlatform promotions page"
echo ""
echo "📚 Full guide: PROMOTION_PUSH_NOTIFICATION_GUIDE.md"
