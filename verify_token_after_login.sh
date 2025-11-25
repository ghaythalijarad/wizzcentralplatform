#!/bin/bash

# Verify FCM Token Registration After Login
# This script checks if the device token was successfully uploaded to DynamoDB

echo "🔍 Verifying FCM Token Registration After Login"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_PROFILE="wizz-drivers-ghayth-dev"
TABLE_NAME="WhizzMerchants_DeviceTokens"
MERCHANT_TABLE="WhizzMerchants_Businesses"

# Check AWS credentials
echo -e "${BLUE}1. Checking AWS credentials...${NC}"
if aws sts get-caller-identity --profile $AWS_PROFILE &>/dev/null; then
    echo -e "${GREEN}✅ AWS credentials valid${NC}"
    aws sts get-caller-identity --profile $AWS_PROFILE --query 'Account' --output text
else
    echo -e "${RED}❌ AWS credentials expired. Running 'aws sso login'...${NC}"
    aws sso login --profile $AWS_PROFILE
fi

echo ""
echo -e "${BLUE}2. Checking merchants in database...${NC}"
MERCHANT_COUNT=$(aws dynamodb scan \
    --table-name $MERCHANT_TABLE \
    --select "COUNT" \
    --filter-expression "attribute_exists(#status) AND #status = :approved" \
    --expression-attribute-names '{"#status":"status"}' \
    --expression-attribute-values '{":approved":{"S":"approved"}}' \
    --profile $AWS_PROFILE \
    --output json | jq -r '.Count')

echo -e "${GREEN}✅ Found $MERCHANT_COUNT approved merchants${NC}"

echo ""
echo -e "${BLUE}3. Checking device tokens table...${NC}"
TOKEN_COUNT=$(aws dynamodb scan \
    --table-name $TABLE_NAME \
    --select "COUNT" \
    --profile $AWS_PROFILE \
    --output json | jq -r '.Count')

if [ "$TOKEN_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ NO TOKENS FOUND - Table is empty!${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
    echo "   1. Open the WhizzMerchants app on your iPhone"
    echo "   2. Log in with your merchant account"
    echo "   3. Wait for the dashboard to load completely"
    echo "   4. Run this script again to verify token was saved"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Found $TOKEN_COUNT device token(s)${NC}"
    echo ""
    
    # Show token details
    echo -e "${BLUE}4. Token Details:${NC}"
    aws dynamodb scan \
        --table-name $TABLE_NAME \
        --profile $AWS_PROFILE \
        --output json | jq -r '.Items[] | "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 Token ID:     \(.tokenId.S)
👤 Merchant ID:  \(.merchantId.S // "N/A")
📱 Device ID:    \(.deviceId.S // "N/A")
🖥️  Platform:     \(.platform.S // "N/A")
📦 App Version:  \(.appVersion.S // "N/A")
✅ Enabled:      \(.enabled.BOOL // "N/A")
📅 Created:      \(.createdAt.S // "N/A")
📅 Updated:      \(.updatedAt.S // "N/A")
🔐 Token:        \(.token.S[0:50])...\(.token.S[-10:])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"'
    
    echo ""
    echo -e "${GREEN}✅ SUCCESS! Device token registered successfully!${NC}"
    echo ""
    echo -e "${BLUE}📊 Summary:${NC}"
    echo "   • Merchants: $MERCHANT_COUNT"
    echo "   • Tokens: $TOKEN_COUNT"
    echo "   • Status: READY TO SEND NOTIFICATIONS 🎉"
    echo ""
fi
