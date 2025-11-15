#!/bin/bash

echo "🔄 Updating Lambda Function Code..."

# Zip only the src directory
cd src
zip -r ../lambda-update.zip . -q
cd ..

# Update Lambda function
echo "📤 Uploading to AWS..."
aws lambda update-function-code \
  --function-name whizzme-chat-dev \
  --zip-file fileb://lambda-update.zip \
  --region us-east-1 \
  --no-cli-pager

echo ""
echo "⏳ Waiting for deployment..."
sleep 5

# Test the endpoint
echo ""
echo "🧪 Testing endpoint..."
curl -X POST https://utqr95jjx4.execute-api.us-east-1.amazonaws.com/dev/whizzme/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Hello, I need help with my account",
    "sessionId": "test-session-123",
    "merchantId": "test-merchant",
    "category": "account_issues"
  }'

echo ""
echo ""
echo "✅ Update complete!"

# Cleanup
rm lambda-update.zip
