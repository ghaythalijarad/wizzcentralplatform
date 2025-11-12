#!/bin/bash

# Deploy Chat WebSocket Handler with Merchant Support
# This script deploys the updated chat-websocket-handler.js to AWS Lambda

set -e

echo "🚀 Deploying Chat WebSocket Handler with Merchant Support..."

# Navigate to backend directory
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend

# Function name
FUNCTION_NAME="chat-websocket-handler"
REGION="us-east-1"

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p deploy-temp
cp -r src deploy-temp/
cd deploy-temp

# Install dependencies if package.json exists
if [ -f "../package.json" ]; then
    echo "📥 Installing dependencies..."
    cp ../package.json .
    npm install --production
fi

# Create zip file
echo "🗜️  Creating zip file..."
zip -r ../chat-websocket-handler.zip . -x "*.git*" "*.DS_Store"

cd ..
rm -rf deploy-temp

# Deploy to Lambda
echo "☁️  Deploying to AWS Lambda..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://chat-websocket-handler.zip \
    --region $REGION \
    --no-cli-pager

# Wait for update to complete
echo "⏳ Waiting for deployment to complete..."
aws lambda wait function-updated \
    --function-name $FUNCTION_NAME \
    --region $REGION

# Cleanup
rm chat-websocket-handler.zip

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test merchant connection from app"
echo "2. Check CloudWatch logs for merchant messages"
echo "3. Verify messages route to support dashboard"
echo ""
echo "CloudWatch Logs:"
echo "aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
