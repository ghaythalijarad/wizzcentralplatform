#!/bin/zsh

# Merchant Chat Deployment Verification Script
# This script checks all components of the merchant chat system

echo "🔍 MERCHANT CHAT DEPLOYMENT VERIFICATION"
echo "========================================"
echo ""

# Set profile
export AWS_PROFILE=wizz-drivers-ghayth-dev
export AWS_REGION=us-east-1
export AWS_PAGER=""

API_ID="7ysrz3rspi"

echo "📡 1. Checking WebSocket API..."
aws apigatewayv2 get-api --api-id $API_ID --region $AWS_REGION 2>&1 | grep -E "Name|ApiEndpoint|RouteSelectionExpression" || echo "❌ API not found"
echo ""

echo "🛣️  2. Checking Routes..."
echo "Looking for chat_merchant_connect route..."
aws apigatewayv2 get-routes --api-id $API_ID --region $AWS_REGION 2>&1 | grep -A2 -B2 "chat_merchant_connect" || echo "⚠️  Route not found or not deployed"
echo ""

echo "λ 3. Checking Lambda Functions..."
FUNCTIONS=(
  "wizzcentral-websocket-dev-websocketConnect"
  "wizzcentral-websocket-dev-liveChatConnect"
  "wizzcentral-websocket-dev-liveChatMessage"
)

for func in "${FUNCTIONS[@]}"; do
  echo "Checking $func..."
  aws lambda get-function-configuration --function-name $func --region $AWS_REGION 2>&1 | grep -E "LastModified|FunctionName|Runtime" | head -3 || echo "❌ Function not found"
  echo ""
done

echo "🗄️  4. Checking DynamoDB Tables..."
TABLES=(
  "websocket-connections-dev"
  "chat-sessions-dev"
  "chat-messages-dev"
)

for table in "${TABLES[@]}"; do
  echo "Checking $table..."
  aws dynamodb describe-table --table-name $table --region $AWS_REGION 2>&1 | grep -E "TableName|TableStatus" | head -2 || echo "❌ Table not found"
  echo ""
done

echo "☁️  5. Checking CloudFormation Stack..."
aws cloudformation describe-stacks --stack-name wizzcentral-websocket-dev --region $AWS_REGION 2>&1 | grep -E "StackName|StackStatus" | head -2 || echo "⚠️  Stack not found or deleted"
echo ""

echo "📊 6. Recent CloudWatch Logs..."
echo "Last 5 log events from liveChatConnect:"
aws logs tail /aws/lambda/wizzcentral-websocket-dev-liveChatConnect --region $AWS_REGION --since 30m --format short 2>&1 | head -10 || echo "⚠️  No recent logs or function not found"
echo ""

echo "========================================"
echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "1. If API/routes exist → run handshake test"
echo "2. If missing → run: npx serverless deploy"
echo "3. Check logs for build banner and merchant connections"
