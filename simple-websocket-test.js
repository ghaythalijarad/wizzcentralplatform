#!/usr/bin/env node

const WebSocket = require('ws');

console.log('🧪 Testing WebSocket Connection...');

const businessId = '7ccf646c-9594-48d4-8f63-c366d89257e5';
const wsUrl = `wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev?userType=driver&businessId=${businessId}&platform=flutter`;

console.log(`Connecting to: ${wsUrl}`);

const ws = new WebSocket(wsUrl);

const timeout = setTimeout(() => {
    console.log('❌ Connection timeout after 10 seconds');
    ws.close();
    process.exit(1);
}, 10000);

ws.on('open', () => {
    clearTimeout(timeout);
    console.log('✅ WebSocket connected successfully!');
    
    const message = {
        type: 'driver_connect',
        sessionId: `test-${Date.now()}`,
        businessId: businessId,
        driverId: 'test-driver',
        timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(message));
    console.log('📤 Sent authentication message');
    
    setTimeout(() => {
        ws.close();
        console.log('✅ Test completed successfully');
        process.exit(0);
    }, 3000);
});

ws.on('error', (error) => {
    clearTimeout(timeout);
    console.log('❌ WebSocket error:', error.message);
    if (error.message.includes('401')) {
        console.log('🔑 Authentication issue detected - need to fix Lambda authorizer');
    }
    process.exit(1);
});

ws.on('message', (data) => {
    console.log('📥 Received:', data.toString());
});

ws.on('close', (code, reason) => {
    clearTimeout(timeout);
    console.log(`🔌 Connection closed: ${code} - ${reason}`);
});
