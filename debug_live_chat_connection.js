/**
 * Debug script to test live chat WebSocket connection and message flow
 * This will help identify why Flutter messages aren't appearing in Central Platform
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

// Test agent connection parameters
const testAgentParams = {
    businessId: BUSINESS_ID,
    userId: 'test-support-agent',
    userType: 'agent_dashboard',
    platform: 'dashboard',
    version: '1.0.0'
};

// Build WebSocket URL with parameters
function buildAgentWebSocketUrl() {
    const params = new URLSearchParams(testAgentParams);
    return `${WEBSOCKET_URL}?${params.toString()}`;
}

// Test agent WebSocket connection
async function testAgentConnection() {
    console.log('🔌 Testing agent WebSocket connection...');
    console.log('📍 URL:', buildAgentWebSocketUrl());
    
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(buildAgentWebSocketUrl());
        let connected = false;
        
        const timeout = setTimeout(() => {
            if (!connected) {
                console.log('⏰ Connection timeout after 10 seconds');
                ws.close();
                reject(new Error('Connection timeout'));
            }
        }, 10000);
        
        ws.on('open', () => {
            connected = true;
            clearTimeout(timeout);
            console.log('✅ Agent WebSocket connected successfully!');
            
            // Send agent connect message
            const agentConnectMsg = {
                type: 'chat_agent_connect',
                agentId: 'test-support-agent',
                agentName: 'Test Support Agent'
            };
            
            ws.send(JSON.stringify(agentConnectMsg));
            console.log('📤 Sent agent connect message:', agentConnectMsg);
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📨 Received message:', JSON.stringify(message, null, 2));
                
                // Check if this is a driver message
                if (message.type === 'driver_message' || message.type === 'chat_message') {
                    console.log('🎯 FOUND DRIVER MESSAGE! This should appear in live chat UI');
                    console.log('   Session ID:', message.sessionId);
                    console.log('   Message Text:', message.message);
                    console.log('   Sender:', message.senderName);
                }
            } catch (e) {
                console.log('📨 Received raw data:', data.toString());
            }
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            console.error('❌ WebSocket error:', error);
            reject(error);
        });
        
        ws.on('close', (code, reason) => {
            clearTimeout(timeout);
            console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
            if (connected) {
                resolve({ success: true, connected: true });
            } else {
                reject(new Error(`Connection closed: ${code} - ${reason}`));
            }
        });
        
        // Keep connection alive for 30 seconds to monitor messages
        setTimeout(() => {
            if (connected) {
                console.log('⏰ Test complete after 30 seconds, closing connection...');
                ws.close();
                resolve({ success: true, connected: true });
            }
        }, 30000);
    });
}

// Test by sending a Flutter message and monitoring for reception
async function testFlutterMessageFlow() {
    console.log('\n🚀 Testing Flutter message flow...');
    
    // First establish agent connection
    console.log('📞 Establishing agent connection...');
    const agentConnection = testAgentConnection();
    
    // Wait a bit for connection to establish
    setTimeout(async () => {
        console.log('\n📱 Simulating Flutter message via HTTP bridge...');
        
        const testMessage = {
            participantToken: 'test-session-123',
            message: 'Hello from debug test! This message should appear in live chat.',
            contentType: 'text/plain',
            metadata: {
                senderId: 'test-driver-456',
                senderType: 'driver',
                senderName: 'Test Driver',
                platform: 'Flutter-Debug'
            }
        };
        
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch('https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testMessage)
            });
            
            const result = await response.json();
            console.log('📤 HTTP bridge response:', JSON.stringify(result, null, 2));
            
            if (response.ok) {
                console.log('✅ Message sent successfully via HTTP bridge');
                console.log('🔍 Agent should receive this message if connection is working...');
            } else {
                console.log('❌ HTTP bridge failed:', result);
            }
        } catch (error) {
            console.error('❌ Failed to send test message:', error);
        }
    }, 5000);
    
    return agentConnection;
}

// Main test execution
async function main() {
    console.log('🎯 Live Chat Debug Test Started');
    console.log('=====================================');
    console.log('📍 WebSocket URL:', WEBSOCKET_URL);
    console.log('🏢 Business ID:', BUSINESS_ID);
    console.log('🔧 Agent URL:', buildAgentWebSocketUrl());
    
    try {
        await testFlutterMessageFlow();
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
