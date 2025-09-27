#!/usr/bin/env node
const WebSocket = require('ws');

console.log('🔌 Testing WebSocket Connection...');
const ws = new WebSocket('wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev');

let connected = false;
const driverId = `driver_${Date.now()}`;

ws.on('open', function() {
    console.log('✅ Connected Successfully!');
    connected = true;
    
    const message = {
        action: 'driver_connect',
        driverId: driverId,
        connectionStatus: 'connected',
        userType: 'driver',
        status: 'online',
        location: { latitude: 33.3152, longitude: 44.3661 },
        timestamp: new Date().toISOString()
    };
    
    console.log('📤 Registering driver:', driverId);
    ws.send(JSON.stringify(message));
});

ws.on('message', function(data) {
    const response = JSON.parse(data.toString());
    console.log('📨 Received:', response.type || 'Unknown');
    
    if (response.type === 'order_assignment' || response.type === 'new_order') {
        console.log('🎉 ORDER ASSIGNMENT RECEIVED!');
        console.log('Order details:', JSON.stringify(response, null, 2));
    }
});

ws.on('error', function(error) {
    console.error('❌ Error:', error.message);
});

ws.on('close', function() {
    console.log('🔌 Disconnected');
    process.exit(0);
});

// Keep alive for 60 seconds
setTimeout(() => {
    if (connected) {
        console.log('⏰ Test complete, disconnecting...');
        ws.close();
    }
}, 60000);
