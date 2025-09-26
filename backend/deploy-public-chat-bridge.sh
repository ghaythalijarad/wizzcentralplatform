#!/bin/bash

# Deploy Public Chat Bridge Lambda Function
# Direct AWS CLI deployment to update existing functions

set -e

echo "🚀 Deploying Public Chat Bridge Lambda Function..."
echo "=================================================="

# Configuration
REGION="us-east-1"
TEMP_DIR="temp-public-chat-bridge"

# Clean up any existing temp directory
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "📦 Creating deployment package..."

# Copy the public chat bridge handler
cat > "$TEMP_DIR/index.js" << 'EOF'
const AWS = require('aws-sdk');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const apigatewaymanagementapi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: 'https://f8gv5mj2v7.execute-api.us-east-1.amazonaws.com/dev'
});

// Valid API keys for cross-platform access
const VALID_API_KEYS = [
    'wizzdriver_mobile_app_v1',
    'wizzcentral_platform_v1'
];

// Validate API key
function validateApiKey(event) {
    console.log('🔐 Validating API key...');
    const apiKey = event.headers?.['X-API-Key'] || event.headers?.['x-api-key'] || 
                  event.queryStringParameters?.apiKey;
    
    if (!apiKey) {
        console.log('❌ No API key provided');
        return { valid: false, error: 'API key required' };
    }
    
    if (!VALID_API_KEYS.includes(apiKey)) {
        console.log('❌ Invalid API key:', apiKey);
        return { valid: false, error: 'Invalid API key' };
    }
    
    console.log('✅ Valid API key:', apiKey);
    return { valid: true, apiKey };
}

exports.handler = async (event) => {
    console.log('🎯 Public Chat Bridge triggered:', JSON.stringify(event, null, 2));
    
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'Access-Control-Max-Age': '86400'
    };
    
    try {
        // Handle preflight request
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: ''
            };
        }
        
        // Validate API key
        const apiValidation = validateApiKey(event);
        if (!apiValidation.valid) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: false,
                    error: apiValidation.error,
                    timestamp: new Date().toISOString()
                })
            };
        }
        
        // Parse request body
        let requestBody;
        try {
            requestBody = JSON.parse(event.body || '{}');
        } catch (parseError) {
            console.error('❌ Invalid JSON in request body:', parseError);
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid JSON in request body',
                    timestamp: new Date().toISOString()
                })
            };
        }
        
        console.log('📝 Parsed request body:', JSON.stringify(requestBody, null, 2));
        
        // Extract required fields
        const { message, metadata } = requestBody;
        
        if (!message) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: false,
                    error: 'Message is required',
                    timestamp: new Date().toISOString()
                })
            };
        }
        
        // Generate IDs and timestamp
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const nowIso = new Date().toISOString();
        
        // Prepare support message data
        const supportMessage = {
            id: messageId,
            sessionId: sessionId,
            message: message,
            sender: 'driver', // Cross-platform sender identification
            timestamp: nowIso,
            platform: 'wizzdriver', // Source platform
            apiKey: apiValidation.apiKey,
            metadata: {
                ...metadata,
                crossPlatform: true,
                authenticationType: 'api_key'
            }
        };
        
        console.log('💬 Prepared support message:', JSON.stringify(supportMessage, null, 2));
        
        // Store message in DynamoDB
        const dynamoParams = {
            TableName: 'wizzcentral-platform-dev-SupportMessages',
            Item: {
                ...supportMessage,
                ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
            }
        };
        
        try {
            await dynamodb.put(dynamoParams).promise();
            console.log('✅ Message stored in DynamoDB');
        } catch (dynamoError) {
            console.error('❌ Failed to store message in DynamoDB:', dynamoError);
            // Continue processing even if DynamoDB fails
        }
        
        // Forward to WebSocket connections
        try {
            const connectionsParams = {
                TableName: 'wizzcentral-platform-dev-WebSocketConnections'
            };
            
            const connections = await dynamodb.scan(connectionsParams).promise();
            console.log(`📡 Found ${connections.Items.length} WebSocket connections`);
            
            if (connections.Items.length > 0) {
                const messagePayload = {
                    type: 'support_message',
                    data: supportMessage
                };
                
                const sendPromises = connections.Items.map(async (connection) => {
                    try {
                        await apigatewaymanagementapi.postToConnection({
                            ConnectionId: connection.connectionId,
                            Data: JSON.stringify(messagePayload)
                        }).promise();
                        console.log(`✅ Message sent to connection: ${connection.connectionId}`);
                    } catch (wsError) {
                        console.error(`❌ Failed to send to connection ${connection.connectionId}:`, wsError);
                        
                        // Remove stale connection
                        if (wsError.statusCode === 410) {
                            try {
                                await dynamodb.delete({
                                    TableName: 'wizzcentral-platform-dev-WebSocketConnections',
                                    Key: { connectionId: connection.connectionId }
                                }).promise();
                                console.log(`🗑️ Removed stale connection: ${connection.connectionId}`);
                            } catch (deleteError) {
                                console.error(`❌ Failed to remove stale connection:`, deleteError);
                            }
                        }
                    }
                });
                
                await Promise.allSettled(sendPromises);
            }
        } catch (wsError) {
            console.error('❌ WebSocket forwarding error:', wsError);
            // Continue processing even if WebSocket fails
        }
        
        // Return success response
        const response = {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                messageId,
                sessionId,
                bridged: true, // Flutter expects this field
                message: 'Message sent to Live Chat support',
                timestamp: nowIso,
                platform: 'cross-platform',
                authentication: 'api_key'
            })
        };
        
        console.log('✅ Returning response:', JSON.stringify(response, null, 2));
        return response;
        
    } catch (error) {
        console.error('❌ Handler error:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString()
            })
        };
    }
};
EOF

# Create package.json
cat > "$TEMP_DIR/package.json" << 'EOF'
{
    "name": "public-chat-bridge",
    "version": "1.0.0",
    "main": "index.js",
    "dependencies": {
        "aws-sdk": "^2.1000.0"
    }
}
EOF

# Create deployment zip
cd "$TEMP_DIR"
zip -r ../public-chat-bridge.zip . > /dev/null
cd ..

echo "✅ Deployment package created: public-chat-bridge.zip"

# Try to find existing chat bridge function to update
echo "🔍 Looking for existing chat bridge function..."

CHAT_FUNCTIONS=(
    "wizzcentral-platform-dev-publicChatBridge"
    "wizzcentral-support-dev-publicChatBridge"
    "wizzcentral-support-dev-sendChatMessage"
    "wizzcentral-chat-bridge-dev-sendChatMessage"
    "publicChatBridge"
    "sendChatMessage"
)

FUNCTION_FOUND=""

for func in "${CHAT_FUNCTIONS[@]}"; do
    if aws lambda get-function --function-name "$func" --region "$REGION" >/dev/null 2>&1; then
        echo "✅ Found function: $func"
        FUNCTION_FOUND="$func"
        break
    fi
done

if [ -n "$FUNCTION_FOUND" ]; then
    echo "🚀 Updating existing function: $FUNCTION_FOUND"
    
    aws lambda update-function-code \
        --function-name "$FUNCTION_FOUND" \
        --zip-file fileb://public-chat-bridge.zip \
        --region "$REGION"
    
    if [ $? -eq 0 ]; then
        echo "✅ Function updated successfully!"
        
        # Update environment variables
        echo "🔧 Updating environment variables..."
        aws lambda update-function-configuration \
            --function-name "$FUNCTION_FOUND" \
            --environment Variables='{
                "SUPPORT_MESSAGES_TABLE":"wizzcentral-platform-dev-SupportMessages",
                "WEBSOCKET_CONNECTIONS_TABLE":"wizzcentral-platform-dev-WebSocketConnections",
                "WEBSOCKET_API_ENDPOINT":"https://f8gv5mj2v7.execute-api.us-east-1.amazonaws.com/dev"
            }' \
            --region "$REGION" >/dev/null
        
        echo "✅ Environment variables updated!"
        echo ""
        echo "🎉 Deployment completed successfully!"
        echo "📡 Function: $FUNCTION_FOUND"
        echo "🔗 API Gateway: https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/public/chat/send"
        echo "🔑 API Key: wizzdriver_mobile_app_v1"
        
    else
        echo "❌ Failed to update function"
        exit 1
    fi
else
    echo "⚠️ No existing chat bridge function found. Available functions:"
    aws lambda list-functions --region "$REGION" --query 'Functions[?contains(FunctionName, `chat`) || contains(FunctionName, `Chat`) || contains(FunctionName, `support`) || contains(FunctionName, `Support`)].FunctionName' --output table
    
    echo ""
    echo "💡 You may need to:"
    echo "1. Deploy the serverless configuration first"
    echo "2. Or manually create the function via AWS Console"
fi

# Cleanup
rm -rf "$TEMP_DIR" public-chat-bridge.zip

echo ""
echo "🧪 Next Steps:"
echo "1. Test the API endpoint with API key"
echo "2. Verify messages appear in WizzCentral support dashboard"
echo "3. Check WebSocket message forwarding"
