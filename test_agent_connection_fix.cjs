/**
 * Agent Connection Test - Establish a valid agent WebSocket connection
 * This will solve the core issue of no agent connections to receive Flutter messages
 */

// First, let's test if we can create a simple agent connection without full authentication
const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

// Create a mock JWT token that might pass basic validation
function createMockJWT() {
    // Create a basic JWT structure (header.payload.signature)
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        sub: 'test-agent-123',
        userType: 'agent',
        businessId: BUSINESS_ID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = 'mock-signature-for-testing';
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function testAgentConnection() {
    console.log('🎯 Testing Agent WebSocket Connection...');
    console.log('=====================================');
    
    const mockToken = createMockJWT();
    console.log('🔑 Generated mock JWT token');
    
    const agentParams = {
        businessId: BUSINESS_ID,
        userId: 'test-support-agent',
        userType: 'agent_dashboard',
        platform: 'dashboard',
        version: '1.0.0',
        token: mockToken
    };
    
    const wsUrl = `${WEBSOCKET_URL}?${new URLSearchParams(agentParams).toString()}`;
    console.log('📍 WebSocket URL:', wsUrl);
    
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        let connected = false;
        
        const timeout = setTimeout(() => {
            if (!connected) {
                console.log('⏰ Connection timeout after 15 seconds');
                ws.close();
                reject(new Error('Connection timeout'));
            }
        }, 15000);
        
        ws.on('open', () => {
            connected = true;
            clearTimeout(timeout);
            console.log('✅ Agent WebSocket connected successfully!');
            
            // Send agent registration message
            const agentConnectMsg = {
                type: 'chat_agent_connect',
                agentId: 'test-support-agent',
                agentName: 'Test Support Agent',
                businessId: BUSINESS_ID,
                timestamp: new Date().toISOString()
            };
            
            ws.send(JSON.stringify(agentConnectMsg));
            console.log('📤 Sent agent connect message');
            
            // Keep connection alive and listen for messages
            console.log('👂 Listening for incoming messages...');
            console.log('');
            console.log('🧪 Now test sending a Flutter message and see if it appears here!');
            console.log('   Use the Flutter app or run: node test_message_storage.cjs');
            console.log('');
            
            // Setup message listener
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    console.log('📨 Received message:', JSON.stringify(message, null, 2));
                    
                    if (message.type === 'driver_message' || message.type === 'chat_message') {
                        console.log('🎯 SUCCESS! Driver message received in agent connection!');
                        console.log('   This proves the message flow is working!');
                    }
                } catch (e) {
                    console.log('📨 Received raw data:', data.toString());
                }
            });
            
            resolve(ws);
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            console.error('❌ WebSocket error:', error.message);
            
            if (error.message.includes('401')) {
                console.log('🔐 Authentication failed - need valid JWT token');
                console.log('💡 Solution: Agent needs to log into Central Platform properly');
            }
            
            reject(error);
        });
        
        ws.on('close', (code, reason) => {
            clearTimeout(timeout);
            console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
            
            if (!connected) {
                reject(new Error(`Connection closed: ${code} - ${reason}`));
            }
        });
    });
}

// Keep the connection alive for testing
async function main() {
    try {
        const ws = await testAgentConnection();
        
        // Keep alive for 5 minutes to test message reception
        setTimeout(() => {
            console.log('⏰ Test completed after 5 minutes');
            ws.close();
            process.exit(0);
        }, 300000);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('');
        console.log('📋 Next Steps:');
        console.log('1. A support agent needs to log into the Central Platform');
        console.log('2. Navigate to Support Center -> Live Chat tab');
        console.log('3. This will establish the proper WebSocket connection');
        console.log('4. Then Flutter messages will appear in the live chat interface');
        process.exit(1);
    }
}

main();
