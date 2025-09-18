#!/bin/bash

# WizzCentral Campaign API - AWS CLI Direct Deployment
# Author: WizzCentral Dev Team

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGION="us-east-1"
PROFILE="wizz-drivers-ghayth-dev"
ROLE_NAME="WizzCentral-Campaign-Lambda-Role"
FUNCTION_PREFIX="wizzcentral-campaign"

echo -e "${BLUE}🚀 WizzCentral Campaign API - Direct AWS Deployment${NC}"
echo -e "${BLUE}=================================================${NC}"
echo -e "Region: ${YELLOW}$REGION${NC}"
echo -e "Profile: ${YELLOW}$PROFILE${NC}"
echo ""

# Step 1: Create IAM Role for Lambda functions
echo -e "${BLUE}🔧 Step 1: Creating IAM Role for Lambda functions...${NC}"

# Check if role exists
if aws iam get-role --role-name $ROLE_NAME --profile $PROFILE --region $REGION &>/dev/null; then
    echo -e "${GREEN}✅ IAM Role already exists: $ROLE_NAME${NC}"
else
    echo "Creating IAM Role..."
    
    # Create trust policy
    cat > lambda-trust-policy.json << EOF
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
        --assume-role-policy-document file://lambda-trust-policy.json \
        --profile $PROFILE \
        --region $REGION

    # Attach basic Lambda execution policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --profile $PROFILE \
        --region $REGION

    # Create and attach DynamoDB policy
    cat > dynamodb-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:$REGION:*:table/WizzCentral_*",
        "arn:aws:dynamodb:$REGION:*:table/WizzUser_*",
        "arn:aws:dynamodb:$REGION:*:table/WhizzMerchants_*"
      ]
    }
  ]
}
EOF

    aws iam put-role-policy \
        --role-name $ROLE_NAME \
        --policy-name DynamoDBAccess \
        --policy-document file://dynamodb-policy.json \
        --profile $PROFILE \
        --region $REGION

    echo -e "${GREEN}✅ IAM Role created: $ROLE_NAME${NC}"
    
    # Wait for role propagation
    echo "Waiting for role propagation..."
    sleep 10
fi

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --profile $PROFILE --region $REGION --query 'Role.Arn' --output text)
echo -e "Role ARN: ${GREEN}$ROLE_ARN${NC}"
echo ""

# Step 2: Package and deploy Lambda functions
echo -e "${BLUE}📦 Step 2: Packaging and deploying Lambda functions...${NC}"

# Lambda functions to deploy
FUNCTIONS=(
    "campaign-api"
    "condition-engine-api" 
    "analytics-api"
    "campaign-public-api"
)

for func in "${FUNCTIONS[@]}"; do
    echo -e "${YELLOW}Deploying function: $func${NC}"
    
    # Create deployment package
    TEMP_DIR="temp-$func"
    mkdir -p $TEMP_DIR
    
    # Copy Lambda function
    cp lambda/${func}.js $TEMP_DIR/index.js
    
    # Create package.json for dependencies
    cat > $TEMP_DIR/package.json << EOF
{
  "name": "$func",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "aws-sdk": "^2.1691.0"
  }
}
EOF

    # Install dependencies
    cd $TEMP_DIR
    npm install --production
    
    # Create ZIP package
    zip -r ../${func}.zip .
    cd ..
    
    # Deploy or update function
    FUNCTION_NAME="${FUNCTION_PREFIX}-${func}"
    
    if aws lambda get-function --function-name $FUNCTION_NAME --profile $PROFILE --region $REGION &>/dev/null; then
        echo "Updating existing function..."
        aws lambda update-function-code \
            --function-name $FUNCTION_NAME \
            --zip-file fileb://${func}.zip \
            --profile $PROFILE \
            --region $REGION
    else
        echo "Creating new function..."
        aws lambda create-function \
            --function-name $FUNCTION_NAME \
            --runtime nodejs18.x \
            --role $ROLE_ARN \
            --handler index.handler \
            --zip-file fileb://${func}.zip \
            --timeout 30 \
            --memory-size 256 \
            --environment Variables='{
                CAMPAIGNS_TABLE=WizzCentral_Campaigns,
                CONDITIONS_TABLE=WizzCentral_Campaign_Conditions,
                USAGE_TABLE=WizzCentral_Campaign_Usage,
                ANALYTICS_TABLE=WizzCentral_Campaign_Analytics,
                USERS_TABLE=WizzUser_users_dev,
                TRANSACTIONS_TABLE=WizzUser_transactions_dev,
                BUSINESSES_TABLE=WhizzMerchants_Businesses
            }' \
            --profile $PROFILE \
            --region $REGION
    fi
    
    # Clean up
    rm -rf $TEMP_DIR ${func}.zip
    
    echo -e "${GREEN}✅ Function deployed: $FUNCTION_NAME${NC}"
done

echo ""

# Step 3: Create API Gateway
echo -e "${BLUE}🌐 Step 3: Creating API Gateway...${NC}"

API_NAME="wizzcentral-campaign-api"

# Check if API exists
API_ID=$(aws apigateway get-rest-apis --profile $PROFILE --region $REGION --query "items[?name=='$API_NAME'].id" --output text)

if [ "$API_ID" = "" ] || [ "$API_ID" = "None" ]; then
    echo "Creating new API Gateway..."
    API_ID=$(aws apigateway create-rest-api \
        --name $API_NAME \
        --description "WizzCentral Campaign Management API" \
        --profile $PROFILE \
        --region $REGION \
        --query 'id' \
        --output text)
    echo -e "${GREEN}✅ API Gateway created: $API_ID${NC}"
else
    echo -e "${GREEN}✅ API Gateway already exists: $API_ID${NC}"
fi

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --profile $PROFILE \
    --region $REGION \
    --query 'items[?path==`/`].id' \
    --output text)

echo -e "API ID: ${GREEN}$API_ID${NC}"
echo -e "Root Resource ID: ${GREEN}$ROOT_RESOURCE_ID${NC}"
echo ""

# Step 4: Test one function
echo -e "${BLUE}🧪 Step 4: Testing Lambda function...${NC}"

TEST_FUNCTION="${FUNCTION_PREFIX}-campaign-api"
echo "Testing function: $TEST_FUNCTION"

TEST_PAYLOAD='{"httpMethod": "GET", "resource": "/campaigns/health", "pathParameters": null}'

aws lambda invoke \
    --function-name $TEST_FUNCTION \
    --payload "$TEST_PAYLOAD" \
    --profile $PROFILE \
    --region $REGION \
    test-response.json

if [ -f test-response.json ]; then
    echo "Function response:"
    cat test-response.json
    echo ""
    rm test-response.json
fi

echo -e "${GREEN}✅ Basic function test completed${NC}"
echo ""

# Summary
echo -e "${BLUE}🎉 Deployment Summary${NC}"
echo -e "${BLUE}===================${NC}"
echo -e "Region: ${GREEN}$REGION${NC}"
echo -e "Profile: ${GREEN}$PROFILE${NC}"
echo -e "IAM Role: ${GREEN}$ROLE_ARN${NC}"
echo -e "API Gateway ID: ${GREEN}$API_ID${NC}"
echo ""
echo -e "${BLUE}Deployed Functions:${NC}"
for func in "${FUNCTIONS[@]}"; do
    echo -e "• ${GREEN}${FUNCTION_PREFIX}-${func}${NC}"
done
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Configure API Gateway endpoints"
echo "2. Set up authentication"
echo "3. Test all endpoints"
echo "4. Update frontend configuration"
echo ""
echo -e "${GREEN}✅ Campaign Lambda functions deployed successfully!${NC}"

# Clean up temporary files
rm -f lambda-trust-policy.json dynamodb-policy.json
