#!/usr/bin/env node

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev?userType=support&agentId=test-driver-001';

console.log('🚗 Testing Driver Message Flow...');
console.log('📍 URL:', WEBSOCKET_URL);

const ws = new WebSocket(WEBSOCKET_URL, {
    headers: {
        'User-Agent': 'Flutter-Driver-Test/1.0'
    }
});

let connected = false;

ws.on('open', function open() {
    connected = true;
    console.log('✅ Driver WebSocket connection opened successfully!');
    
    // Simulate driver connecting to chat
    console.log('🚗 Simulating driver chat connect...');
    ws.send(JSON.stringify({
        type: 'chat_driver_connect',
        driverId: 'test-flutter-driver-001',
        driverName: 'Test Flutter Driver',
        driverPhone: '+1234567890',
        timestamp: new Date().toISOString()
    }));
    
    // Send a test message after connection
    setTimeout(() => {
        console.log('💬 Sending test message...');
        ws.send(JSON.stringify({
            type: 'chat_message',
            sessionId: 'session_test-flutter-driver-001_' + Date.now(),
            messageText: 'Hello from Flutter app! This is a test message.',
            senderType: 'driver',
            timestamp: new Date().toISOString()
        }));
    }, 3000);
    
    // Close after testing
    setTimeout(() => {
        console.log('🔚 Closing connection...');
        ws.close();
    }, 8000);
});

ws.on('message', function message(data) {
    try {
        const parsed = JSON.parse(data.toString());
        console.log('📥 Driver received:', parsed);
    } catch (e) {
        console.log('📥 Driver received (raw):', data.toString());
    }
});

ws.on('close', function close(code, reason) {
    console.log('🔌 Driver connection closed:', code, reason.toString());
    if (connected) {
        console.log('✅ Driver test completed successfully!');
        process.exit(0);
    } else {
        console.log('❌ Driver connection failed');
        process.exit(1);
    }
});

ws.on('error', function error(err) {
    console.error('❌ Driver WebSocket error:', err.message);
    process.exit(1);
});

// Timeout after 15 seconds
setTimeout(() => {
    if (!connected) {
        console.log('⏰ Driver test timeout - connection never established');
        process.exit(1);
    }
}, 15000);
