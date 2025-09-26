#!/bin/bash

# Script to find and update the WebSocket Lambda function

echo "🔍 Searching for WebSocket Lambda function..."

# Common function name patterns to try
FUNCTION_NAMES=(
    "wizzcentral-websocket-dev-WebSocketHandler"
    "WebSocketHandler"
    "websocket-handler"
    "wizzcentral-websocket-handler"
    "wizzcentral-websocket-dev-websocket-handler"
    "websocket-connections-handler"
    "wizzcentral-websocket-dev-websocket-connections"
    "websocket-connections"
    "dev-websocket-handler"
    "websocket-dev-handler"
)

ZIP_FILE="websocket-handler-fresh.zip"

# Check if zip file exists
if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ Deployment package not found: $ZIP_FILE"
    echo "Creating fresh deployment package..."
    cd dist/websocket-handler
    zip -r ../../$ZIP_FILE .
    cd ../..
fi

echo "📦 Using deployment package: $ZIP_FILE"

# Try each function name
for FUNCTION_NAME in "${FUNCTION_NAMES[@]}"; do
    echo "🧪 Trying function name: $FUNCTION_NAME"
    
    # First check if function exists
    if aws lambda get-function --function-name "$FUNCTION_NAME" >/dev/null 2>&1; then
        echo "✅ Found function: $FUNCTION_NAME"
        
        # Update the function code
        echo "🚀 Updating function code..."
        if aws lambda update-function-code --function-name "$FUNCTION_NAME" --zip-file "fileb://$ZIP_FILE"; then
            echo "🎉 Successfully updated function: $FUNCTION_NAME"
            
            # Wait for update to complete
            echo "⏳ Waiting for update to complete..."
            aws lambda wait function-updated --function-name "$FUNCTION_NAME"
            
            echo "✅ Update completed!"
            exit 0
        else
            echo "❌ Failed to update function: $FUNCTION_NAME"
        fi
    else
        echo "❌ Function not found: $FUNCTION_NAME"
    fi
done

echo "💥 Could not find or update any WebSocket Lambda function"
echo "📝 Listing all Lambda functions for manual inspection:"
aws lambda list-functions --query 'Functions[].FunctionName' --output text

exit 1
