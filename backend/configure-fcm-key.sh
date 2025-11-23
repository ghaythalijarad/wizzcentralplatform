#!/bin/zsh

# Script to configure FCM Server Key for the push notification Lambda function

echo "🔑 Configure FCM Server Key"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FUNCTION_NAME="whizz-central-send-promotion-notification"
DEVICE_TOKENS_TABLE="WhizzMerchants_DeviceTokens"
REGION="us-east-1"

# Check if FCM key is provided
if [ -z "$1" ]; then
    echo "${YELLOW}Usage: ./configure-fcm-key.sh YOUR_FCM_SERVER_KEY${NC}"
    echo ""
    echo "${BLUE}To get your FCM Server Key:${NC}"
    echo "1. Go to Firebase Console: https://console.firebase.google.com/"
    echo "2. Select your WhizzMerchants project"
    echo "3. Go to Project Settings (gear icon) → Cloud Messaging"
    echo "4. Copy the 'Server key' under Cloud Messaging API (Legacy)"
    echo ""
    echo "${YELLOW}Note: If you don't see the Server key, you may need to enable Cloud Messaging API (Legacy)${NC}"
    exit 1
fi

FCM_KEY="$1"

echo "${BLUE}Configuring FCM Server Key for Lambda function...${NC}"
echo ""

# Update Lambda function environment variables
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment "Variables={DEVICE_TOKENS_TABLE=${DEVICE_TOKENS_TABLE},FCM_SERVER_KEY=${FCM_KEY}}" \
    --region $REGION \
    --no-cli-pager > /dev/null

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ FCM Server Key configured successfully!${NC}"
    echo ""
    echo "Lambda function: $FUNCTION_NAME"
    echo "Region: $REGION"
    echo ""
    echo "${YELLOW}Next step: Set up API Gateway endpoint${NC}"
    echo "Run: ./setup-api-gateway.sh"
else
    echo "${RED}❌ Failed to configure FCM Server Key${NC}"
    exit 1
fi
