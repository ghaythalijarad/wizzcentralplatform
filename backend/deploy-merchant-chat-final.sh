#!/bin/zsh

# WhizzCentralPlatform WebSocket Deployment Script
# This deploys the Lambda functions with merchant chat support to API 7ysrz3rspi

set -e

echo "\n╔═══════════════════════════════════════════════════════════════╗"
echo "║  WhizzCentralPlatform WebSocket Deployment                    ║"
echo "║  Merchant Chat Support - API 7ysrz3rspi                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝\n"

# Configuration
export AWS_PROFILE=wizz-drivers-ghayth-dev
export AWS_SDK_LOAD_CONFIG=1
SERVICE_NAME="wizzcentral-websocket"
API_ID="7ysrz3rspi"
STAGE="dev"
REGION="us-east-1"

# Step 1: Verify AWS credentials
echo "🔐 Step 1/5: Verifying AWS credentials..."
if aws sts get-caller-identity --profile $AWS_PROFILE > /dev/null 2>&1; then
    ACCOUNT=$(aws sts get-caller-identity --profile $AWS_PROFILE --query 'Account' --output text)
    echo "   ✅ Authenticated to AWS Account: $ACCOUNT"
else
    echo "   ❌ AWS authentication failed!"
    echo "   Run: aws sso login --profile $AWS_PROFILE"
    exit 1
fi

# Step 2: Check serverless configuration
echo "\n📋 Step 2/5: Checking serverless configuration..."
if [ -f "serverless.websocket.yml" ]; then
    echo "   ✅ Found serverless.websocket.yml"
    echo "   📍 Service: $SERVICE_NAME"
    echo "   📍 API ID: $API_ID"
    echo "   📍 Stage: $STAGE"
else
    echo "   ❌ serverless.websocket.yml not found!"
    exit 1
fi

# Step 3: Check handler file
echo "\n📝 Step 3/5: Verifying handler code..."
if grep -q "handleMerchantChatConnect" src/handlers/websocket-connections.js; then
    echo "   ✅ Merchant chat handler found in websocket-connections.js"
    if grep -q "🏪 Merchant connecting" src/handlers/websocket-connections.js; then
        echo "   ✅ Merchant connection logging present"
    fi
else
    echo "   ❌ Merchant chat handler NOT found!"
    exit 1
fi

# Step 4: Deploy the service
echo "\n🚀 Step 4/5: Deploying WebSocket service..."
echo "   ⏳ This will take 2-3 minutes...\n"

npx serverless deploy \
    --config serverless.websocket.yml \
    --stage $STAGE \
    --region $REGION \
    --verbose

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo "\n   ✅ Deployment successful!"
else
    echo "\n   ❌ Deployment failed with status $DEPLOY_STATUS"
    exit 1
fi

# Step 5: Verify deployment
echo "\n🔍 Step 5/5: Verifying deployment..."

# Check if functions exist
FUNCTION_NAME="${SERVICE_NAME}-${STAGE}-liveChatConnect"
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --profile $AWS_PROFILE > /dev/null 2>&1; then
    LAST_MODIFIED=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --profile $AWS_PROFILE --query 'Configuration.LastModified' --output text)
    echo "   ✅ Function exists: $FUNCTION_NAME"
    echo "   📅 Last modified: $LAST_MODIFIED"
else
    echo "   ⚠️  Could not verify function (might still be deploying)"
fi

# Verify API Gateway routes
echo "\n   Checking API Gateway routes..."
if aws apigatewayv2 get-routes --api-id $API_ID --region $REGION --profile $AWS_PROFILE --query 'Items[?RouteKey==`chat_merchant_connect`].RouteKey' --output text | grep -q "chat_merchant_connect"; then
    echo "   ✅ Route 'chat_merchant_connect' exists"
else
    echo "   ⚠️  Route verification pending (check API Gateway console)"
fi

echo "\n╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT COMPLETE                                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

echo "\n📝 Next Steps:"
echo "   1. Test merchant chat from WhizzMerchants Flutter app"
echo "   2. Monitor logs:"
echo "      aws logs tail /aws/lambda/$FUNCTION_NAME --follow --profile $AWS_PROFILE"
echo "\n   3. Expected logs:"
echo "      🏪 Merchant connecting to live chat: <connectionId>"
echo "      ✅ Chat session created"
echo "      ✅ Notified agents of new merchant session"
echo "\n   4. Check support dashboard:"
echo "      whizzCentralPlatform/frontend/pages/support.html"
echo "      Should see merchant session in 'ACTIVE CONVERSATIONS'\n"

echo "🌐 WebSocket Endpoint:"
echo "   wss://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE\n"

echo "📊 Deployed Functions:"
aws lambda list-functions \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query "Functions[?contains(FunctionName, '$SERVICE_NAME-$STAGE')].FunctionName" \
    --output table 2>/dev/null || echo "   (Function list temporarily unavailable)"

echo "\n✨ Ready to test merchant chat!\n"
