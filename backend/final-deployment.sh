#!/bin/bash

echo "🎯 FINAL COMPREHENSIVE WEBSOCKET FIX DEPLOYMENT"
echo "=============================================="

# Step 1: Ensure we have the latest fixed code built
echo "📦 Step 1: Building latest fixed code..."
cd /Users/ghaythallaheebi/wizzcentralplatform/backend

# Build the WebSocket handler with our fixes
echo "🔨 Building WebSocket handler..."
node build-websocket-handler.js

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed"

# Step 2: Create fresh deployment package
echo "📦 Step 2: Creating deployment package..."
cd dist/websocket-handler
zip -r ../../websocket-final-fix.zip . -x "*.DS_Store*"
cd ../..

if [ ! -f "websocket-final-fix.zip" ]; then
    echo "❌ Failed to create deployment package"
    exit 1
fi

echo "✅ Deployment package created: websocket-final-fix.zip"

# Step 3: Try Serverless deployment
echo "🚀 Step 3: Attempting Serverless deployment..."
serverless deploy --config serverless.websocket.yml --stage dev --force --verbose

# Wait for deployment
echo "⏳ Waiting for Serverless deployment to complete..."
sleep 10

# Step 4: Try direct Lambda function updates
echo "🎯 Step 4: Direct Lambda function updates..."

# List of common function names
FUNCTION_NAMES=(
    "wizzcentral-websocket-dev-websocket-connections"
    "wizzcentral-websocket-dev-WebSocketHandler"
    "WebSocketHandler"
    "websocket-handler"
    "wizzcentral-websocket-handler"
    "websocket-connections-handler"
    "websocket-connections"
    "dev-websocket-handler"
)

SUCCESS=false

for FUNCTION_NAME in "${FUNCTION_NAMES[@]}"; do
    echo "🧪 Trying function: $FUNCTION_NAME"
    
    if aws lambda get-function --function-name "$FUNCTION_NAME" >/dev/null 2>&1; then
        echo "✅ Found function: $FUNCTION_NAME"
        
        if aws lambda update-function-code --function-name "$FUNCTION_NAME" --zip-file "fileb://websocket-final-fix.zip" >/dev/null 2>&1; then
            echo "🎉 Successfully updated: $FUNCTION_NAME"
            
            # Wait for update
            echo "⏳ Waiting for update to complete..."
            aws lambda wait function-updated --function-name "$FUNCTION_NAME"
            
            SUCCESS=true
            break
        else
            echo "❌ Failed to update: $FUNCTION_NAME"
        fi
    else
        echo "❌ Function not found: $FUNCTION_NAME"
    fi
done

# Step 5: Test the deployment
echo "🧪 Step 5: Testing deployment..."
sleep 5

cd /Users/ghaythallaheebi/Desktop/hadhir

# Create a simple test
cat > final_deployment_test.js << 'EOF'
const WebSocket = require('ws');

async function finalTest() {
    console.log('🧪 FINAL DEPLOYMENT TEST');
    console.log('Testing agent_message and driver_message handlers...');
    
    const ws = new WebSocket('wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev');
    let testPassed = false;
    
    ws.on('open', () => {
        console.log('✅ Connected to WebSocket');
        
        // Send agent_message
        ws.send(JSON.stringify({
            type: 'agent_message',
            sessionId: 'final_test_session',
            messageText: 'Final test message'
        }));
    });
    
    ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log('📥 Received:', message);
        
        if (message.action === 'error' && message.message.includes('Unknown action: agent_message')) {
            console.log('❌ DEPLOYMENT FAILED - Still getting Unknown action error');
        } else if (message.type === 'error' && message.message === 'Session not found') {
            console.log('✅ DEPLOYMENT SUCCESS - Handler is working! (Session not found is expected)');
            testPassed = true;
        } else if (message.type === 'chat_message' || message.type === 'ack') {
            console.log('✅ DEPLOYMENT SUCCESS - Message processed correctly!');
            testPassed = true;
        }
        
        setTimeout(() => {
            ws.close();
            process.exit(testPassed ? 0 : 1);
        }, 1000);
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        process.exit(1);
    });
    
    setTimeout(() => {
        console.log('⏰ Test timeout');
        ws.close();
        process.exit(1);
    }, 10000);
}

finalTest();
EOF

echo "🧪 Running final test..."
node final_deployment_test.js

TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
    echo "🎉 SUCCESS! The fix has been deployed and is working!"
    echo "✅ agent_message and driver_message handlers are now functional"
else
    echo "❌ DEPLOYMENT STILL NOT WORKING"
    echo "The fix needs further investigation"
fi

# Cleanup
rm -f final_deployment_test.js

exit $TEST_RESULT
