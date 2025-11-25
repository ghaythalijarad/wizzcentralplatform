#!/bin/bash
set -e

echo "🚀 Deploying WhizzCentralPlatform WebSocket Service"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Configuration:"
echo "  - Service: wizzcentral-websocket"
echo "  - API ID: 7ysrz3rspi"
echo "  - Stage: dev"
echo "  - Region: us-east-1"
echo ""

export AWS_PROFILE=wizz-drivers-ghayth-dev
export AWS_SDK_LOAD_CONFIG=1

echo "🔐 Verifying AWS credentials..."
aws sts get-caller-identity --profile wizz-drivers-ghayth-dev || {
    echo "❌ AWS credentials not valid. Please run: aws sso login --profile wizz-drivers-ghayth-dev"
    exit 1
}

echo "✅ AWS credentials verified"
echo ""

echo "📦 Deploying WebSocket service (this will take 2-3 minutes)..."
echo ""

npx serverless deploy \
    --config serverless.websocket.yml \
    --stage dev \
    --region us-east-1 \
    --verbose

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ WebSocket Service Deployed Successfully!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 Functions deployed:"
    echo "  - wizzcentral-websocket-dev-websocketConnect"
    echo "  - wizzcentral-websocket-dev-websocketDisconnect"
    echo "  - wizzcentral-websocket-dev-websocketDefault"
    echo "  - wizzcentral-websocket-dev-liveChatConnect (✨ includes merchant support)"
    echo "  - wizzcentral-websocket-dev-liveChatMessage"
    echo "  - wizzcentral-websocket-dev-chatBridge"
    echo ""
    echo "🔗 WebSocket endpoint: wss://7ysrz3rspi.execute-api.us-east-1.amazonaws.com/dev"
    echo ""
    echo "🧪 Next steps:"
    echo "1. Test merchant chat from Flutter app"
    echo "2. Monitor logs: aws logs tail /aws/lambda/wizzcentral-websocket-dev-liveChatConnect --follow --profile wizz-drivers-ghayth-dev"
    echo "3. Check support dashboard for merchant sessions"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Check the error messages above."
    exit 1
fi
