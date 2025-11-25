#!/bin/bash

echo "🚀 Deploying Merchant Chat Lambda Functions..."
echo ""

export AWS_PROFILE=wizz-drivers-ghayth-dev

echo "📦 Deploying liveChatConnect function (handles chat_merchant_connect)..."
npx serverless deploy function \
  -f liveChatConnect \
  --config serverless.websocket.yml \
  --stage dev \
  --region us-east-1

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Verifying deployment..."
aws lambda get-function \
  --function-name wizzcentral-websocket-dev-liveChatConnect \
  --region us-east-1 \
  --query 'Configuration.LastModified' \
  --output text

echo ""
echo "📊 You can now test the merchant chat feature!"
