#!/bin/bash

# Deploy Merchant Chat Support Fix
# This deploys the updated chat-websocket-handler with merchant session support

set -e

echo "🚀 Deploying Merchant Chat Support Fix"
echo "======================================="
echo ""

cd "$(dirname "$0")/backend"

# Clean up previous deployment
echo "🧹 Cleaning up previous deployment..."
rm -rf temp-deploy
rm -f chat-websocket-handler-deployment.zip

# Create deployment directory
echo "📁 Creating deployment structure..."
mkdir -p temp-deploy/src/handlers

# Copy handler file
echo "📄 Copying handler file..."
cp src/handlers/chat-websocket-handler.js temp-deploy/src/handlers/

# Copy package.json
echo "📦 Copying package.json..."
cp package.json temp-deploy/

# Install dependencies
echo "⬇️  Installing production dependencies..."
cd temp-deploy
npm install --production --quiet

# Create ZIP file
echo "🗜️  Creating deployment package..."
zip -r ../chat-websocket-handler-deployment.zip . -q -x "*.DS_Store"
cd ..

# Get file size
FILE_SIZE=$(ls -lh chat-websocket-handler-deployment.zip | awk '{print $5}')
echo "✅ Deployment package created: $FILE_SIZE"
echo ""

# Deploy to AWS Lambda
echo "☁️  Deploying to AWS Lambda..."
echo "   Function: chat-websocket-handler"
echo "   Region: us-east-1"
echo ""

aws lambda update-function-code \
    --function-name chat-websocket-handler \
    --zip-file fileb://chat-websocket-handler-deployment.zip \
    --region us-east-1 \
    --no-cli-pager

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 What was fixed:"
echo "   • Added userType, merchantId, merchantName, merchantEmail to sendActiveSessions"
echo "   • Support dashboard can now properly display merchant sessions"
echo "   • Merchant sessions will appear alongside driver sessions"
echo ""
echo "🧪 Next steps:"
echo "   1. Refresh the support dashboard (http://localhost:3000/pages/support.html)"
echo "   2. Send a message from the merchant app"
echo "   3. Verify the session appears on the dashboard"
echo ""
