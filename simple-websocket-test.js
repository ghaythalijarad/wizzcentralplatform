#!/usr/bin/env node
/**
 * Simple WebSocket Connection Test
 * Tests basic connection to the WebSocket endpoint
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0w1co6qmi4.execute-api.us-east-1.amazonaws.com/dev';

console.log('🌍 Simple WebSocket Connection Test');
console.log('==================================');
console.log(`🔗 Testing: ${WEBSOCKET_URL}`);

const ws = new WebSocket(WEBSOCKET_URL);

ws.on('open', () => {
    console.log('✅ WebSocket connected successfully!');
    
    // Send a simple test message
    const testMessage = {
        action: 'ping',
        timestamp: new Date().toISOString(),
        testId: 'simple-connection-test'
    };
    
    console.log('📤 Sending test message:', JSON.stringify(testMessage));
    ws.send(JSON.stringify(testMessage));
    
    // Close after 5 seconds
    setTimeout(() => {
        console.log('🔌 Closing connection...');
        ws.close();
    }, 5000);
});

ws.on('message', (data) => {
    console.log('📥 Received:', data.toString());
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
    console.log(`🔌 Connection closed (${code}): ${reason || 'No reason'}`);
    process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.log('⏱️ Test timeout - closing connection');
    ws.close();
    process.exit(0);
}, 10000);
