#!/usr/bin/env node

/**
 * Test Support Agent WebSocket Connection
 * Verify the support agent can connect to the WebSocket and receive messages
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

console.log('🧪 Testing Support Agent WebSocket Connection...');
console.log('🔗 Connecting to:', WEBSOCKET_URL);

// Connect as support agent
const ws = new WebSocket(WEBSOCKET_URL + '?userType=support&agentId=test-agent&businessId=7ccf646c-9594-48d4-8f63-c366d89257e5');

ws.on('open', () => {
    console.log('✅ WebSocket connected successfully');
    
    // Send agent connect message
    const connectMessage = {
        type: 'chat_agent_connect',
        agentId: 'test-agent-' + Date.now(),
        agentName: 'Test Support Agent',
        timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending agent connect message:', connectMessage);
    ws.send(JSON.stringify(connectMessage));
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        console.log('📨 Received message:', message.type, message);
        
        if (message.type === 'agent_connected') {
            console.log('✅ Agent successfully connected to WebSocket');
        } else if (message.type === 'active_sessions') {
            console.log('📋 Active sessions received:', message.sessions?.length || 0, 'sessions');
        } else if (message.type === 'chat_message') {
            console.log('💬 Chat message received from driver!');
            console.log('   Session:', message.sessionId);
            console.log('   Message:', message.message || message.messageText);
            console.log('   🎉 SUCCESS! Message bridge is working!');
        }
    } catch (e) {
        console.log('📄 Raw message:', data.toString());
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket disconnected: ${code} ${reason}`);
});

// Keep the connection alive and test sending a message after 5 seconds
setTimeout(() => {
    console.log('\n🧪 Testing with HTTP message in 5 seconds...');
    
    setTimeout(() => {
        const https = require('https');
        
        const testMessage = {
            participantToken: 'driver_websocket_test',
            message: '🚗 WebSocket Test: This message is sent to test the WebSocket connection. Can the agent see this?',
            metadata: {
                senderId: 'unknown_driver_websocket_test',
                senderType: 'driver',
                senderName: 'WebSocket Test Driver',
                platform: 'flutter',
                source: 'http_api',
                timestamp: new Date().toISOString()
            }
        };
        
        const postData = JSON.stringify(testMessage);
        
        const options = {
            hostname: 'yt0j2cdbe5.execute-api.us-east-1.amazonaws.com',
            port: 443,
            path: '/dev/chat/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        console.log('📤 Sending HTTP test message...');
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('📊 HTTP Response:', res.statusCode);
                try {
                    const response = JSON.parse(data);
                    console.log('📄 Response:', response);
                } catch (e) {
                    console.log('📄 Raw response:', data);
                }
            });
        });
        
        req.on('error', (err) => {
            console.error('❌ HTTP error:', err.message);
        });
        
        req.write(postData);
        req.end();
        
    }, 5000);
}, 1000);

// Exit after 30 seconds
setTimeout(() => {
    console.log('\n⏰ Test completed');
    process.exit(0);
}, 30000);
