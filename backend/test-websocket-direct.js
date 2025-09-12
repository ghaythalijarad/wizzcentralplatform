const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

async function testWebSocketConnection() {
    // Test connection IDs from the database scan
    const testConnections = [
        'Quj5NdwioAMCJ2A=',
        'Qulmue8kIAMCEEA=', 
        'QulTGeRVoAMCI-A='
    ];

    const wsEndpoint = 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev';
    const apiGatewayEndpoint = wsEndpoint.replace('wss://', 'https://').replace('/dev', '');

    console.log('🔧 Testing WebSocket connections...');
    console.log('📡 Endpoint:', `${apiGatewayEndpoint}/dev`);

    const apiGatewayClient = new ApiGatewayManagementApiClient({
        endpoint: `${apiGatewayEndpoint}/dev`
    });

    const testMessage = {
        type: 'chat_message',
        sessionId: 'test_session_websocket_check',
        messageText: '🔧 TEST: Direct WebSocket message to verify connection',
        senderType: 'driver',
        metadata: {
            senderId: 'test_driver_direct_ws',
            senderName: 'WebSocket Test Driver',
            timestamp: new Date().toISOString(),
            messageId: `test_${Date.now()}`,
            source: 'direct_test'
        }
    };

    for (const connectionId of testConnections) {
        try {
            console.log(`\n📡 Testing connection: ${connectionId}`);
            
            await apiGatewayClient.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: JSON.stringify(testMessage)
            }));
            
            console.log(`✅ Message sent successfully to: ${connectionId}`);
            
        } catch (error) {
            console.error(`❌ Failed to send to ${connectionId}:`, error.message);
            
            if (error.statusCode === 410) {
                console.log(`🗑️ Connection ${connectionId} is stale (gone)`);
            }
        }
    }
}

testWebSocketConnection().catch(console.error);
