const WebSocket = require('ws');

async function connectSupportAgent() {
    // Add query parameters for support agent registration
    const wsEndpoint = 'wss://3g9xqhaxic.execute-api.us-east-1.amazonaws.com/dev';
    const queryParams = new URLSearchParams({
        userType: 'support',
        agentId: 'support-agent-001',
        businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
        platform: 'web',
        appVersion: '1.0.0'
    });
    
    const wsUrl = `${wsEndpoint}?${queryParams.toString()}`;
    
    console.log('🔄 Connecting support agent to WebSocket...');
    console.log('📡 Endpoint:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', function() {
        console.log('✅ WebSocket connected successfully');
        
        // Send registration message to identify as support agent
        const registerMessage = {
            action: 'register',
            userType: 'agent',
            userId: 'support-agent-001',
            agentId: 'support-agent-001',
            businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
            email: 'support@wizzcentral.com',
            groups: ['support'],
            platform: 'web',
            appVersion: '1.0.0',
            timestamp: new Date().toISOString()
        };
        
        ws.send(JSON.stringify(registerMessage));
        console.log('📝 Registered as support agent:', registerMessage.userId);
        
        // Send a test heartbeat message to trigger Lambda
        setTimeout(() => {
            const heartbeatMessage = {
                action: 'heartbeat',
                timestamp: new Date().toISOString()
            };
            ws.send(JSON.stringify(heartbeatMessage));
            console.log('💓 Sent heartbeat to trigger Lambda');
        }, 1000);
        
        console.log('⏰ Keeping connection alive...');
        
        // Keep connection alive and listen for messages
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            }
        }, 30000); // Heartbeat every 30 seconds
    });
    
    ws.on('message', function(data) {
        try {
            const message = JSON.parse(data.toString());
            console.log('📨 Received message:', JSON.stringify(message, null, 2));
            
            if (message.type === 'chat_message') {
                console.log('💬 CHAT MESSAGE FROM DRIVER:');
                console.log('   Driver:', message.metadata?.senderName || 'Unknown');
                console.log('   Message:', message.messageText);
                console.log('   Session:', message.sessionId);
                
                // Auto-respond to driver messages for testing
                setTimeout(() => {
                    const responseMessage = {
                        action: 'send_message',
                        sessionId: message.sessionId,
                        messageText: `Hello ${message.metadata?.senderName || 'Driver'}! I'm a WizzCentral support agent and I received your message: "${message.messageText}". How can I assist you today?`,
                        messageType: 'text',
                        timestamp: new Date().toISOString()
                    };
                    
                    ws.send(JSON.stringify(responseMessage));
                    console.log('🤖 Sent auto-response to driver');
                }, 2000); // Wait 2 seconds before responding
            }
        } catch (error) {
            console.log('📨 Raw message:', data.toString());
        }
    });
    
    ws.on('close', function(code, reason) {
        console.log(`🔌 WebSocket closed. Code: ${code}, Reason: ${reason}`);
    });
    
    ws.on('error', function(error) {
        console.error('❌ WebSocket error:', error.message);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🔌 Closing WebSocket connection...');
        ws.close();
        process.exit(0);
    });
}

connectSupportAgent().catch(console.error);
