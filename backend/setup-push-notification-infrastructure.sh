#!/bin/zsh

echo "🚀 Setting up Push Notification Infrastructure"
echo "=============================================="
echo ""

# Configuration
FUNCTION_NAME="whizz-central-send-promotion-notification"
ROLE_NAME="whizz-central-lambda-role"
REGION="us-east-1"
RUNTIME="nodejs20.x"
HANDLER="send-promotion-push-notification.handler"
DEVICE_TOKENS_TABLE="WhizzMerchants_DeviceTokens"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get AWS Account ID
echo "${BLUE}Getting AWS Account ID...${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --no-cli-pager)
if [ -z "$ACCOUNT_ID" ]; then
    echo "${RED}❌ Failed to get AWS Account ID. Are you logged in?${NC}"
    exit 1
fi
echo "${GREEN}✅ Account ID: $ACCOUNT_ID${NC}"
echo ""

# Step 1: Create IAM Role
echo "${YELLOW}📝 Step 1: Creating IAM Role...${NC}"
ROLE_EXISTS=$(aws iam get-role --role-name $ROLE_NAME --no-cli-pager 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ IAM role already exists${NC}"
    ROLE_ARN=$(echo $ROLE_EXISTS | jq -r '.Role.Arn')
else
    echo "Creating new IAM role..."
    
    # Create trust policy
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create role
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "IAM role for WhizzCentral Lambda functions" \
        --no-cli-pager
    
    if [ $? -ne 0 ]; then
        echo "${RED}❌ Failed to create IAM role${NC}"
        exit 1
    fi
    
    echo "${GREEN}✅ IAM role created${NC}"
    
    # Wait a bit for role to be available
    sleep 3
    
    ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
fi

echo ""

# Step 2: Attach Policies to Role
echo "${YELLOW}📝 Step 2: Attaching policies to role...${NC}"

# Attach basic Lambda execution policy
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
    --no-cli-pager \
    2>/dev/null

echo "Attached AWSLambdaBasicExecutionRole"

# Create custom policy for DynamoDB access
cat > /tmp/dynamodb-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${DEVICE_TOKENS_TABLE}",
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${DEVICE_TOKENS_TABLE}/index/*"
      ]
    }
  ]
}
EOF

# Check if policy already exists
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/WhizzCentral-DynamoDB-Policy"
POLICY_EXISTS=$(aws iam get-policy --policy-arn $POLICY_ARN --no-cli-pager 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "Creating DynamoDB policy..."
    aws iam create-policy \
        --policy-name WhizzCentral-DynamoDB-Policy \
        --policy-document file:///tmp/dynamodb-policy.json \
        --no-cli-pager
    
    sleep 2
fi

# Attach the policy
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn $POLICY_ARN \
    --no-cli-pager \
    2>/dev/null

echo "${GREEN}✅ Policies attached${NC}"
echo ""

# Wait for IAM role to propagate
echo "${YELLOW}⏳ Waiting for IAM role to propagate (10 seconds)...${NC}"
sleep 10
echo ""

# Step 3: Create Lambda deployment package
echo "${YELLOW}📦 Step 3: Creating Lambda deployment package...${NC}"
cd lambda
npm install --production 2>/dev/null
cd ..

rm -f promotion-push-notification.zip
cd lambda
zip -r ../promotion-push-notification.zip send-promotion-push-notification.js 2>/dev/null
cd ..
echo "${GREEN}✅ Deployment package created${NC}"
echo ""

# Step 4: Create Lambda Function
echo "${YELLOW}🔧 Step 4: Creating Lambda function...${NC}"
FUNCTION_EXISTS=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --no-cli-pager 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "${YELLOW}Function already exists, updating...${NC}"
    
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://promotion-push-notification.zip \
        --region $REGION \
        --no-cli-pager
    
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --environment "Variables={DEVICE_TOKENS_TABLE=${DEVICE_TOKENS_TABLE}}" \
        --region $REGION \
        --no-cli-pager
    
    echo "${GREEN}✅ Lambda function updated${NC}"
else
    echo "Creating new Lambda function..."
    
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://promotion-push-notification.zip \
        --timeout 30 \
        --memory-size 512 \
        --environment "Variables={DEVICE_TOKENS_TABLE=${DEVICE_TOKENS_TABLE}}" \
        --region $REGION \
        --no-cli-pager
    
    if [ $? -eq 0 ]; then
        echo "${GREEN}✅ Lambda function created${NC}"
    else
        echo "${RED}❌ Failed to create Lambda function${NC}"
        exit 1
    fi
fi

echo ""

# Step 5: Test Lambda Function
echo "${YELLOW}🧪 Step 5: Testing Lambda function...${NC}"

TEST_PAYLOAD='{
  "httpMethod": "POST",
  "body": "{\"title\":\"🧪 Test Notification\",\"message\":\"Testing push notification system\",\"campaignId\":\"test_123\"}"
}'

aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload "$TEST_PAYLOAD" \
    --region $REGION \
    --no-cli-pager \
    /tmp/lambda-test-response.json > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Lambda invocation successful${NC}"
    echo ""
    echo "Response:"
    cat /tmp/lambda-test-response.json | jq '.' 2>/dev/null || cat /tmp/lambda-test-response.json
    rm -f /tmp/lambda-test-response.json
else
    echo "${YELLOW}⚠️ Lambda test failed (this is OK if FCM_SERVER_KEY is not configured)${NC}"
fi

echo ""

# Cleanup temp files
rm -f /tmp/trust-policy.json
rm -f /tmp/dynamodb-policy.json
rm -f promotion-push-notification.zip

# Step 6: Summary
echo "${GREEN}=====================================${NC}"
echo "${GREEN}✅ Setup Complete!${NC}"
echo "${GREEN}=====================================${NC}"
echo ""
echo "📋 Summary:"
echo "  • IAM Role: ${ROLE_NAME}"
echo "  • Lambda Function: ${FUNCTION_NAME}"
echo "  • DynamoDB Table: ${DEVICE_TOKENS_TABLE}"
echo "  • Region: ${REGION}"
echo ""
echo "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "1. Configure FCM Server Key:"
echo "   ${BLUE}Get your FCM Server Key from Firebase Console:${NC}"
echo "   https://console.firebase.google.com/ → Project Settings → Cloud Messaging"
echo ""
echo "   ${BLUE}Then run:${NC}"
echo "   aws lambda update-function-configuration \\"
echo "     --function-name ${FUNCTION_NAME} \\"
echo "     --environment Variables={DEVICE_TOKENS_TABLE=${DEVICE_TOKENS_TABLE},FCM_SERVER_KEY=YOUR_ACTUAL_KEY} \\"
echo "     --region ${REGION}"
echo ""
echo "2. Set up API Gateway endpoint:"
echo "   See: PROMOTION_PUSH_NOTIFICATION_GUIDE.md"
echo ""
echo "3. Test from WhizzCentralPlatform:"
echo "   open http://localhost:8080/frontend/pages/promotions.html"
echo ""
echo "${GREEN}🎉 You're ready to send push notifications!${NC}"
