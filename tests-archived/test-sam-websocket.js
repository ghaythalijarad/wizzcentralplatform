#!/usr/bin/env node

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev?userType=support&agentId=test-agent-001';

console.log('🔗 Testing SAM WebSocket API...');
console.log('📍 URL:', WEBSOCKET_URL);

const ws = new WebSocket(WEBSOCKET_URL, {
    headers: {
        'User-Agent': 'SAM-Test-Client/1.0'
    }
});

let connected = false;

ws.on('open', function open() {
    connected = true;
    console.log('✅ WebSocket connection opened successfully!');
    
    // Test heartbeat
    console.log('📡 Sending heartbeat...');
    ws.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
    }));
    
    // Test support agent connection
    setTimeout(() => {
        console.log('👩‍💼 Testing support agent connection...');
        ws.send(JSON.stringify({
            type: 'chat_agent_connect',
            agentId: 'test-agent-001',
            agentName: 'Test Agent',
            timestamp: new Date().toISOString()
        }));
    }, 2000);
    
    // Close after testing
    setTimeout(() => {
        console.log('🔚 Closing connection...');
        ws.close();
    }, 5000);
});

ws.on('message', function message(data) {
    try {
        const parsed = JSON.parse(data.toString());
        console.log('📥 Received:', parsed);
    } catch (e) {
        console.log('📥 Received (raw):', data.toString());
    }
});

ws.on('close', function close(code, reason) {
    console.log('🔌 Connection closed:', code, reason.toString());
    if (connected) {
        console.log('✅ Test completed successfully!');
        process.exit(0);
    } else {
        console.log('❌ Connection failed');
        process.exit(1);
    }
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err.message);
    if (err.code === 'ENOTFOUND') {
        console.error('   DNS resolution failed - check the URL');
    } else if (err.code === 'ECONNREFUSED') {
        console.error('   Connection refused - server might be down');
    } else if (err.message.includes('401') || err.message.includes('403')) {
        console.error('   Authentication/Authorization failed');
    }
    process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
    if (!connected) {
        console.log('⏰ Test timeout - connection never established');
        process.exit(1);
    }
}, 10000);
