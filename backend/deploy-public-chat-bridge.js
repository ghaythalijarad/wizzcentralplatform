const AWS = require('aws-sdk');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

// Configure AWS
AWS.config.update({
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const lambda = new AWS.Lambda();

// Function configuration
const FUNCTION_NAME = 'wizzcentral-platform-dev-publicChatBridge';

async function deployPublicChatBridge() {
    console.log('🚀 Starting deployment of public chat bridge...');
    
    try {
        // Create deployment package
        console.log('📦 Creating deployment package...');
        const zipBuffer = await createDeploymentPackage();
        
        // Check if function exists
        console.log('🔍 Checking if function exists...');
        const functionExists = await checkFunctionExists();
        
        if (functionExists) {
            // Update existing function
            console.log('🔄 Updating existing function...');
            await updateFunctionCode(zipBuffer);
        } else {
            // Create new function
            console.log('🆕 Creating new function...');
            await createFunction(zipBuffer);
        }
        
        console.log('✅ Public chat bridge deployment completed successfully!');
        console.log(`🔗 Function Name: ${FUNCTION_NAME}`);
        console.log('📡 API Gateway endpoint: https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/public/chat');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

async function createDeploymentPackage() {
    return new Promise((resolve, reject) => {
        const output = [];
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.on('data', chunk => output.push(chunk));
        archive.on('end', () => resolve(Buffer.concat(output)));
        archive.on('error', reject);
        
        // Add the handler file
        const handlerContent = `const AWS = require('aws-sdk');

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
        const messageId = \`msg_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
        const sessionId = \`session_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
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
            console.log(\`📡 Found \${connections.Items.length} WebSocket connections\`);
            
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
                        console.log(\`✅ Message sent to connection: \${connection.connectionId}\`);
                    } catch (wsError) {
                        console.error(\`❌ Failed to send to connection \${connection.connectionId}:\`, wsError);
                        
                        // Remove stale connection
                        if (wsError.statusCode === 410) {
                            try {
                                await dynamodb.delete({
                                    TableName: 'wizzcentral-platform-dev-WebSocketConnections',
                                    Key: { connectionId: connection.connectionId }
                                }).promise();
                                console.log(\`🗑️ Removed stale connection: \${connection.connectionId}\`);
                            } catch (deleteError) {
                                console.error(\`❌ Failed to remove stale connection:\`, deleteError);
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
};`;
        
        archive.append(handlerContent, { name: 'index.js' });
        
        // Add package.json
        const packageJson = {
            name: 'public-chat-bridge',
            version: '1.0.0',
            main: 'index.js',
            dependencies: {
                'aws-sdk': '^2.1000.0'
            }
        };
        
        archive.append(JSON.stringify(packageJson, null, 2), { name: 'package.json' });
        
        archive.finalize();
    });
}

async function checkFunctionExists() {
    try {
        await lambda.getFunction({ FunctionName: FUNCTION_NAME }).promise();
        return true;
    } catch (error) {
        if (error.code === 'ResourceNotFoundException') {
            return false;
        }
        throw error;
    }
}

async function updateFunctionCode(zipBuffer) {
    const params = {
        FunctionName: FUNCTION_NAME,
        ZipFile: zipBuffer
    };
    
    await lambda.updateFunctionCode(params).promise();
    console.log('✅ Function code updated successfully');
}

async function createFunction(zipBuffer) {
    const params = {
        FunctionName: FUNCTION_NAME,
        Runtime: 'nodejs18.x',
        Role: 'arn:aws:iam::117073071895:role/wizzcentral-platform-dev-us-east-1-lambdaRole',
        Handler: 'index.handler',
        Code: { ZipFile: zipBuffer },
        Description: 'Public chat bridge with API key authentication for cross-platform support',
        Timeout: 30,
        MemorySize: 256,
        Environment: {
            Variables: {
                WEBSOCKET_API_ENDPOINT: 'https://f8gv5mj2v7.execute-api.us-east-1.amazonaws.com/dev',
                SUPPORT_MESSAGES_TABLE: 'wizzcentral-platform-dev-SupportMessages',
                WEBSOCKET_CONNECTIONS_TABLE: 'wizzcentral-platform-dev-WebSocketConnections'
            }
        }
    };
    
    await lambda.createFunction(params).promise();
    console.log('✅ Function created successfully');
}

// Run deployment
deployPublicChatBridge();
