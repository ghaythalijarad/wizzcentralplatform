#!/bin/bash

# Deploy WebSocket Connections Handler
# This script deploys the updated websocket-connections.js handler with agent_message support

set -e

echo "🚀 Deploying WebSocket Connections Handler with agent_message support"
echo "================================================================="

# Configuration - try common WebSocket function names
POSSIBLE_FUNCTIONS=(
    "WizzUser-WebSocketDefault-dev"
    "wizzuser-websocket-default-dev"
    "WizzUser_WebSocket_Default"
    "websocket-default"
    "live-chat-websocket-handler"
)

REGION="us-east-1"
DIST_DIR="dist/websocket-handler"

# Check if the built file exists
if [ ! -f "$DIST_DIR/index.js" ]; then
    echo "❌ Error: Built file not found at $DIST_DIR/index.js"
    echo "Please run 'node build-websocket-handler.js' first"
    exit 1
fi

echo "📦 Creating deployment package..."

# Create temporary directory for deployment
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# Copy the built handler
cp "$DIST_DIR/index.js" "$TEMP_DIR/"

# Create the deployment zip
cd "$TEMP_DIR"
zip -r function.zip . > /dev/null

echo "🔍 Searching for WebSocket Lambda function..."

# Try to find the correct function name
FUNCTION_NAME=""
for func in "${POSSIBLE_FUNCTIONS[@]}"; do
    if aws lambda get-function --function-name "$func" --region "$REGION" &>/dev/null; then
        FUNCTION_NAME="$func"
        echo "✅ Found function: $FUNCTION_NAME"
        break
    fi
done

if [ -z "$FUNCTION_NAME" ]; then
    echo "❌ Could not find WebSocket Lambda function"
    echo "Available functions:"
    aws lambda list-functions --region "$REGION" --query 'Functions[].FunctionName' --output table
    exit 1
fi

echo "☁️  Updating Lambda function: $FUNCTION_NAME"

# Update the function code
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://function.zip \
    --region "$REGION" \
    --output table

echo "⚡ Function updated successfully!"

# Clean up
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo "🎉 WebSocket handler deployment complete!"
echo "📡 The handler now supports agent_message and driver_message actions"
