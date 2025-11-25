#!/bin/zsh

echo "📱 Deploying Promotion Push Notification Lambda"
echo "=============================================="

# Configuration
FUNCTION_NAME="whizz-central-send-promotion-notification"
REGION="us-east-1"
RUNTIME="nodejs20.x"
HANDLER="send-promotion-push-notification.handler"
ROLE_NAME="whizz-central-lambda-role"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${YELLOW}📦 Step 1: Installing dependencies...${NC}"
cd lambda
npm install --production 2>/dev/null || echo "No package.json found, continuing..."
cd ..

echo "${YELLOW}📦 Step 2: Creating deployment package...${NC}"
rm -f promotion-push-notification.zip
cd lambda
zip -r ../promotion-push-notification.zip send-promotion-push-notification.js node_modules/ 2>/dev/null || \
  zip ../promotion-push-notification.zip send-promotion-push-notification.js
cd ..

echo "${YELLOW}🔍 Step 3: Checking if Lambda function exists...${NC}"
FUNCTION_EXISTS=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Function exists, updating code...${NC}"
    
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://promotion-push-notification.zip \
        --region $REGION
    
    if [ $? -eq 0 ]; then
        echo "${GREEN}✅ Lambda code updated successfully${NC}"
    else
        echo "${RED}❌ Failed to update Lambda code${NC}"
        exit 1
    fi
    
    # Update environment variables
    echo "${YELLOW}🔧 Updating environment variables...${NC}"
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --environment "Variables={DEVICE_TOKENS_TABLE=WhizzMerchants_DeviceTokens,FCM_SERVER_KEY=}" \
        --region $REGION
    
else
    echo "${YELLOW}📝 Function doesn't exist, creating new function...${NC}"
    
    # Get IAM role ARN
    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null)
    
    if [ -z "$ROLE_ARN" ]; then
        echo "${RED}❌ IAM role $ROLE_NAME not found. Please create it first.${NC}"
        exit 1
    fi
    
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://promotion-push-notification.zip \
        --timeout 30 \
        --memory-size 512 \
        --environment "Variables={DEVICE_TOKENS_TABLE=WhizzMerchants_DeviceTokens,FCM_SERVER_KEY=}" \
        --region $REGION
    
    if [ $? -eq 0 ]; then
        echo "${GREEN}✅ Lambda function created successfully${NC}"
    else
        echo "${RED}❌ Failed to create Lambda function${NC}"
        exit 1
    fi
fi

echo "${YELLOW}🔗 Step 4: Setting up API Gateway integration...${NC}"
echo "You need to manually add this Lambda to your API Gateway:"
echo "  - Resource: /send-promotion-notification"
echo "  - Method: POST"
echo "  - Integration: Lambda Function"
echo "  - Function: $FUNCTION_NAME"

echo ""
echo "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📝 Next Steps:"
echo "1. Add FCM_SERVER_KEY environment variable:"
echo "   aws lambda update-function-configuration \\"
echo "     --function-name $FUNCTION_NAME \\"
echo "     --environment Variables={DEVICE_TOKENS_TABLE=WhizzMerchants_DeviceTokens,FCM_SERVER_KEY=YOUR_FCM_SERVER_KEY} \\"
echo "     --region $REGION"
echo ""
echo "2. Configure API Gateway to trigger this Lambda"
echo "3. Test the push notification from WhizzCentralPlatform promotions page"
echo ""
echo "📱 Function ARN:"
aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text

# Cleanup
rm -f promotion-push-notification.zip
