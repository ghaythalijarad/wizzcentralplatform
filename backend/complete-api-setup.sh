#!/bin/bash
echo "🚀 Setting up API Gateway integrations..."

API_ID="qaetu0jvgi"
AWS_REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "API ID: $API_ID"
echo "Account: $ACCOUNT_ID"

# Create integration for register_device
echo "Creating register_device integration..."
aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:lambda:$AWS_REGION:$ACCOUNT_ID:function:register_device" \
    --payload-format-version 2.0 \
    --region $AWS_REGION
