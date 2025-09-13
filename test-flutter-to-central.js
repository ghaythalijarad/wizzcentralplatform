#!/usr/bin/env node

// Test script to verify Flutter -> Chat Bridge -> Central Platform message flow
const WebSocket = require('ws');
const http = require('http');

console.log('🧪 Testing Flutter to Central Platform message flow');
console.log('================================================');

// Step 1: Connect as a support agent to see incoming messages
const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

console.log('1️⃣ Connecting as support agent...');
const agentWS = new WebSocket(`${WEBSOCKET_URL}?userType=support&agentId=test-agent&businessId=${BUSINESS_ID}`);

agentWS.on('open', () => {
    console.log('✅ Connected as support agent');
    
    // Send agent connect message
    agentWS.send(JSON.stringify({
        type: 'agent_connect',
        agentId: 'test-agent',
        agentName: 'Test Support Agent',
        businessId: BUSINESS_ID
    }));
});

agentWS.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        console.log('📨 Agent received message:', message.type || 'unknown');
        
        if (message.type === 'driver_message') {
            console.log('🚗 DRIVER MESSAGE RECEIVED!');
            console.log(`   Driver: ${message.driverName} (${message.driverId})`);
            console.log(`   Message: ${message.content}`);
            console.log(`   Session: ${message.sessionId}`);
            console.log('   ✅ SUCCESS: Message delivered from Flutter to Central Platform!');
        }
    } catch (e) {
        console.log('📨 Raw message from WebSocket:', data.toString().substring(0, 100));
    }
});

agentWS.on('error', (error) => {
    console.log('❌ Agent WebSocket error:', error.message);
});

// Step 2: Wait a moment, then send a test message via chat bridge
setTimeout(() => {
    console.log('\n2️⃣ Sending test message via chat bridge...');
    
    const testPayload = {
        participantToken: 'test-driver-e2e',
        message: 'END-TO-END TEST: This message should appear in Central Platform support dashboard!',
        contentType: 'text/plain',
        metadata: {
            senderId: 'test-driver-e2e',
            senderType: 'driver',
            senderName: 'E2E Test Driver',
            timestamp: new Date().toISOString(),
            driverId: 'test-driver-e2e',
            driverName: 'E2E Test Driver',
            platform: 'flutter',
            source: 'flutter_http_bridge'
        }
    };

    const postData = JSON.stringify(testPayload);
    const options = {
        hostname: 'localhost',
        port: 8087,
        path: '/chat/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('📡 Chat bridge response:', data);
            
            // Wait a moment for message to propagate, then exit
            setTimeout(() => {
                console.log('\n🏁 Test complete. Check the logs above for success/failure.');
                process.exit(0);
            }, 2000);
        });
    });

    req.on('error', (e) => {
        console.log('❌ Error sending to chat bridge:', e.message);
        process.exit(1);
    });

    req.write(postData);
    req.end();
}, 2000);

// Cleanup after 10 seconds
setTimeout(() => {
    console.log('\n⏰ Test timeout reached');
    process.exit(0);
}, 10000);
