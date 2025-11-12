#!/bin/zsh

# Deploy Backend Fix for Merchant Chat Support
# This adds merchant fields to sendActiveSessions() function

set -e

echo "🚀 DEPLOYING BACKEND FIX FOR MERCHANT CHAT SUPPORT"
echo "===================================================="
echo ""
echo "What this fixes:"
echo "  • Adds userType, merchantId, merchantName, merchantEmail"
echo "  • Support dashboard will now show merchant sessions"
echo ""

cd "$(dirname "$0")/backend"

# Step 1: Clean up
echo "🧹 Step 1/4: Cleaning up previous deployment..."
rm -rf temp-deploy chat-websocket-handler-deployment.zip 2>/dev/null || true
echo "   ✅ Cleanup complete"
echo ""

# Step 2: Copy files
echo "📁 Step 2/4: Copying files..."
mkdir -p temp-deploy/src/handlers
cp src/handlers/chat-websocket-handler.js temp-deploy/src/handlers/
cp package.json temp-deploy/
echo "   ✅ Files copied"
echo ""

# Step 3: Install dependencies
echo "📦 Step 3/4: Installing production dependencies..."
cd temp-deploy
npm install --production --quiet
cd ..
echo "   ✅ Dependencies installed"
echo ""

# Step 4: Create ZIP
echo "🗜️  Step 4/4: Creating deployment package..."
cd temp-deploy
zip -r -q ../chat-websocket-handler-deployment.zip .
cd ..
FILE_SIZE=$(ls -lh chat-websocket-handler-deployment.zip | awk '{print $5}')
echo "   ✅ Package created: $FILE_SIZE"
echo ""

# Step 5: Deploy to AWS
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
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🧪 TEST NOW:"
echo "   1. Refresh support dashboard (already open)"
echo "   2. Send message from merchant app"
echo "   3. Session should appear within 2 seconds"
echo ""
