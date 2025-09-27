#!/usr/bin/env node
console.log('🚀 Simple WebSocket Test Starting...');

const WebSocket = require('ws');
const WEBSOCKET_URL = 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev';

console.log(`🔗 Connecting to: ${WEBSOCKET_URL}`);

const ws = new WebSocket(WEBSOCKET_URL);

ws.on('open', function() {
    console.log('✅ WebSocket Connected!');
    
    const testMessage = {
        action: 'driver_connect',
        driverId: 'test-driver-' + Date.now(),
        userType: 'driver',
        status: 'online'
    };
    
    console.log('📤 Sending test message...');
    ws.send(JSON.stringify(testMessage));
});

ws.on('message', function(data) {
    console.log('📨 Received:', data.toString());
});

ws.on('error', function(error) {
    console.error('❌ WebSocket Error:', error.message);
});

ws.on('close', function(code, reason) {
    console.log(`🔌 WebSocket Closed: ${code} - ${reason}`);
    process.exit(0);
});

setTimeout(() => {
    console.log('⏰ Test timeout');
    ws.close();
}, 10000);
