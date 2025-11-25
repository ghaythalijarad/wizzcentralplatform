#!/bin/zsh

# Script to set up API Gateway endpoint for promotion push notifications

echo "🌐 Setting up API Gateway Endpoint"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FUNCTION_NAME="whizz-central-send-promotion-notification"
REGION="us-east-1"
API_NAME="whizz-central-api"
RESOURCE_PATH="send-promotion-notification"

# Get AWS Account ID
echo "${BLUE}Getting AWS Account ID...${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --no-cli-pager)
echo "Account ID: $ACCOUNT_ID"
echo ""

# Check if API Gateway already exists
echo "${BLUE}Checking for existing API Gateway...${NC}"
API_ID=$(aws apigateway get-rest-apis --region $REGION --no-cli-pager --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ]; then
    echo "${YELLOW}Creating new API Gateway...${NC}"
    
    # Create API
    API_ID=$(aws apigateway create-rest-api \
        --name $API_NAME \
        --description "WhizzCentral Platform API" \
        --region $REGION \
        --no-cli-pager \
        --query 'id' \
        --output text)
    
    echo "${GREEN}✅ API Gateway created: $API_ID${NC}"
else
    echo "${GREEN}✅ Found existing API Gateway: $API_ID${NC}"
fi

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --no-cli-pager \
    --query 'items[?path==`/`].id' \
    --output text)

echo "Root resource ID: $ROOT_ID"
echo ""

# Check if resource already exists
RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --no-cli-pager \
    --query "items[?pathPart=='$RESOURCE_PATH'].id" \
    --output text)

if [ -z "$RESOURCE_ID" ]; then
    echo "${YELLOW}Creating resource: /$RESOURCE_PATH${NC}"
    
    RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_ID \
        --path-part $RESOURCE_PATH \
        --region $REGION \
        --no-cli-pager \
        --query 'id' \
        --output text)
    
    echo "${GREEN}✅ Resource created: $RESOURCE_ID${NC}"
else
    echo "${GREEN}✅ Resource already exists: $RESOURCE_ID${NC}"
fi

echo ""

# Create POST method
echo "${YELLOW}Setting up POST method...${NC}"

aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --authorization-type AWS_IAM \
    --region $REGION \
    --no-cli-pager > /dev/null 2>&1

# Set up Lambda integration
echo "${YELLOW}Integrating with Lambda function...${NC}"

LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}"

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" \
    --region $REGION \
    --no-cli-pager > /dev/null 2>&1

echo "${GREEN}✅ Lambda integration configured${NC}"
echo ""

# Add Lambda permission for API Gateway
echo "${YELLOW}Adding Lambda permission for API Gateway...${NC}"

aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-invoke-$(date +%s) \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*" \
    --region $REGION \
    --no-cli-pager > /dev/null 2>&1

echo "${GREEN}✅ Lambda permission added${NC}"
echo ""

# Enable CORS
echo "${YELLOW}Enabling CORS...${NC}"

aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region $REGION \
    --no-cli-pager > /dev/null 2>&1

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\":200}"}' \
    --region $REGION \
    --no-cli-pager > /dev/null 2>&1

aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'GET,POST,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' \
    --region $REGION \
    --no-cli-pager > /dev/null 2>&1

aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' \
    --region $REGION \
    --no-cli-pager > /dev/null 2>&1

echo "${GREEN}✅ CORS enabled${NC}"
echo ""

# Deploy API
echo "${YELLOW}Deploying API to 'prod' stage...${NC}"

aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION \
    --no-cli-pager > /dev/null 2>&1

echo "${GREEN}✅ API deployed${NC}"
echo ""

# Summary
echo "${GREEN}=====================================${NC}"
echo "${GREEN}✅ API Gateway Setup Complete!${NC}"
echo "${GREEN}=====================================${NC}"
echo ""
echo "📋 API Details:"
echo "  • API ID: $API_ID"
echo "  • API Name: $API_NAME"
echo "  • Region: $REGION"
echo "  • Endpoint: https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/${RESOURCE_PATH}"
echo ""
echo "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "1. Update your WhizzCentralPlatform frontend config:"
echo "   Edit: frontend/pages/promotions.html"
echo "   Update apiEndpoint to: https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"
echo ""
echo "2. Test the endpoint:"
echo "   ./test-promotion-push-notification.sh"
echo ""
echo "3. Test from WhizzCentralPlatform UI:"
echo "   open http://localhost:8080/frontend/pages/promotions.html"
echo ""
echo "${GREEN}🎉 Ready to send push notifications!${NC}"
