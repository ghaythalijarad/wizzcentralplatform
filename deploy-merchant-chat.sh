#!/bin/zsh

echo "🚀 Deploying Merchant Chat Support to AWS"
echo "=========================================="
echo ""

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend

echo "📋 Changes being deployed:"
echo "  ✅ Added chat_merchant_connect route in serverless.websocket.yml"
echo "  ✅ Added handleMerchantChatConnect() function"
echo "  ✅ Updated getActiveChatSessions() to include merchant fields"
echo ""

echo "🔐 Checking AWS credentials..."
aws sts get-caller-identity --profile wizz-drivers-ghayth-dev > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ AWS credentials not valid. Please run: aws sso login --profile wizz-drivers-ghayth-dev"
    exit 1
fi
echo "✅ AWS credentials valid"
echo ""

echo "📦 Installing dependencies..."
npm install --production
echo ""

echo "🚀 Deploying WebSocket service..."
echo "   This may take 2-3 minutes..."
echo ""

AWS_PROFILE=wizz-drivers-ghayth-dev npm run deploy:ws

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "📝 What was deployed:"
    echo "   • WebSocket API: wss://7ysrz3rspi.execute-api.us-east-1.amazonaws.com/dev"
    echo "   • New route: chat_merchant_connect"
    echo "   • Handler: websocket-connections.js"
    echo ""
    echo "🧪 Next steps:"
    echo "   1. Open merchant app: http://localhost:8080"
    echo "   2. Go to 'About App' → 'Chat Support'"
    echo "   3. Send a test message"
    echo "   4. Check support dashboard: http://localhost:3000/pages/support.html"
    echo ""
else
    echo ""
    echo "❌ DEPLOYMENT FAILED"
    echo "   Check the error messages above"
    echo ""
    exit 1
fi
