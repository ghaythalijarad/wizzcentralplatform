#!/bin/zsh

echo "🔍 Quick Deployment Status Check"
echo "================================="
echo ""

export AWS_PROFILE=wizz-drivers-ghayth-dev
export AWS_REGION=us-east-1
export AWS_PAGER=""

echo "1. Checking Lambda function..."
aws lambda get-function-configuration \
  --function-name wizzcentral-websocket-dev-liveChatConnect \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev 2>&1 | grep -E "FunctionName|LastModified|Runtime" | head -3

echo ""
echo "2. Checking DynamoDB tables..."
aws dynamodb list-tables \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev 2>&1 | grep -E "websocket-connections-dev|chat-sessions-dev"

echo ""
echo "3. Checking CloudFormation stack..."
aws cloudformation describe-stacks \
  --stack-name wizzcentral-websocket-dev \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev 2>&1 | grep -E "StackName|StackStatus" | head -2

echo ""
echo "Done!"
