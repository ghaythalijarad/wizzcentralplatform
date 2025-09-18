#!/usr/bin/env node

/**
 * Test Support Agent WebSocket Connection
 * Tests the updated support dashboard connectivity using join_channel action
 */

const WebSocket = require('ws');

console.log('🧪 Testing Support Agent WebSocket Connection');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

let testCompleted = false;

// Build WebSocket URL with query parameters
const wsUrl = `${WEBSOCKET_URL}?businessId=${BUSINESS_ID}&userType=agent&userId=support_agent_test`;

console.log(`🔌 Connecting to: ${wsUrl}`);

const ws = new WebSocket(wsUrl);

// Timeout after 10 seconds
setTimeout(() => {
    if (!testCompleted) {
        console.log('⏰ Test timeout - closing connection');
        ws.close();
        process.exit(1);
    }
}, 10000);

ws.on('open', () => {
    console.log('✅ WebSocket connected successfully');
    
    // Join as support agent using the updated format
    const joinMessage = {
        action: 'join_channel',
        userType: 'agent',
        userId: 'support_agent_test',
        userName: 'Support Agent',
        channel: 'live_chat_support',
        timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(joinMessage));
    console.log('📤 Sent agent join message:', joinMessage.action);
});

ws.on('message', (data) => {
    try {
        const msg = JSON.parse(data.toString());
        console.log('📨 Received message:', {
            action: msg.action,
            channel: msg.channel || 'no channel',
            message: msg.message || 'no message'
        });
        
        if (msg.action === 'channel_joined') {
            console.log('🎉 SUCCESS: Support agent successfully joined live chat channel!');
            console.log('✅ The support dashboard can now connect and receive driver messages');
            console.log('🔗 Support page URL: file:///Users/ghaythallaheebi/wizzcentralplatform/frontend/pages/support.html');
            testCompleted = true;
            ws.close();
            process.exit(0);
        } else if (msg.action === 'error') {
            console.error('❌ Server error:', msg.message);
            testCompleted = true;
            ws.close();
            process.exit(1);
        }
    } catch (e) {
        console.log('📨 Raw message:', data.toString());
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
    testCompleted = true;
    process.exit(1);
});

ws.on('close', (code, reason) => {
    console.log(`🔌 Connection closed: ${code} ${reason || 'No reason provided'}`);
    if (!testCompleted) {
        process.exit(1);
    }
});
