#!/bin/bash

echo "🚀 Deploying FIXED Enhanced WebSocket Handler..."

FUNCTION_NAME="wizzcentral-websocket-sam-dev-WebSocketHandler-DOc4Cll3vGOn"
SOURCE_FILE="temp-deploy/src/handlers/enhanced-websocket-fixed.js"
TEMP_DIR="/tmp/websocket-deploy-fixed-$(date +%s)"

# Check if source file exists
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Source file not found: $SOURCE_FILE"
    exit 1
fi

# Create temporary deployment directory
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

echo "📁 Preparing deployment package..."

# Copy the fixed handler
cp "/Users/ghaythallaheebi/wizzcentralplatform/backend/$SOURCE_FILE" index.js

# Create package.json
cat > package.json << EOF
{
  "name": "websocket-handler-fixed",
  "version": "1.0.0",
  "description": "Fixed Enhanced WebSocket Handler with proper agent registration",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0",
    "@aws-sdk/client-apigatewaymanagementapi": "^3.0.0"
  }
}
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create deployment zip
echo "📦 Creating deployment package..."
zip -r function.zip . -x "*.git*" "node_modules/.cache/*"

# Check zip size
SIZE=$(stat -f%z function.zip)
echo "📊 Package size: ${SIZE} bytes"

if [ $SIZE -gt 52428800 ]; then
    echo "❌ Package too large (>50MB), cannot deploy"
    exit 1
fi

# Deploy to AWS Lambda
echo "🚀 Deploying to Lambda function: $FUNCTION_NAME"

aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://function.zip \
    --output table

if [ $? -eq 0 ]; then
    echo "✅ Lambda function code updated successfully"
    
    # Update environment variables
    echo "🔧 Updating environment variables..."
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --environment Variables='{
            "CHAT_SESSIONS_TABLE": "ChatSessions",
            "CHAT_MESSAGES_TABLE": "ChatMessages", 
            "WEBSOCKET_CONNECTIONS_TABLE": "WebSocketConnections"
        }' \
        --timeout 30 \
        --memory-size 512 \
        --output table
    
    if [ $? -eq 0 ]; then
        echo "✅ Environment variables updated successfully"
        
        # Wait for function to be ready
        echo "⏳ Waiting for function to be ready..."
        sleep 5
        
        echo ""
        echo "🎉 FIXED Enhanced WebSocket Handler deployed successfully!"
        echo "📋 Summary:"
        echo "   - Function: $FUNCTION_NAME"
        echo "   - Handler supports: agent_connect, chat_agent_connect, chat_init with userType detection"
        echo "   - Fixed agent registration issue"
        echo "   - Enhanced error handling and logging"
        echo ""
        
    else
        echo "❌ Failed to update environment variables"
        exit 1
    fi
else
    echo "❌ Failed to update Lambda function code"
    exit 1
fi

echo "✅ Deployment complete!"
