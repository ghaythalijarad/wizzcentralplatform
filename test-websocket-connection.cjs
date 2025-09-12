#!/usr/bin/env node

const WebSocket = require('ws');

const WS_URL = 'wss://3g9xqhaxic.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

console.log('🧪 Testing WebSocket Connection for Live Chat...');
console.log(`📡 Connecting to: ${WS_URL}`);
console.log(`🏢 Business ID: ${BUSINESS_ID}`);

// Test Support Agent Connection
const supportUrl = `${WS_URL}?businessId=${BUSINESS_ID}&userType=support&agentId=support-agent-001`;

console.log('\n👩‍💼 Testing Support Agent Connection...');
console.log(`URL: ${supportUrl}`);

const ws = new WebSocket(supportUrl);

ws.on('open', function open() {
    console.log('✅ Support Agent WebSocket Connected!');
    
    // Send agent online message automatically
    const message = {
        type: 'agent_online',
        agentId: 'support-agent-001',
        agentName: 'Support Agent',
        businessId: BUSINESS_ID,
        status: 'online',
        autoOnline: true,
        timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(message));
    console.log('📨 Sent auto-online message:', message);
});

ws.on('message', function message(data) {
    try {
        const parsed = JSON.parse(data);
        console.log('📨 Received message:', parsed);
    } catch (e) {
        console.log('📨 Received raw message:', data.toString());
    }
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket Error:', err.message);
    process.exit(1);
});

ws.on('close', function close(code, reason) {
    console.log(`🔌 WebSocket Closed: ${code} - ${reason}`);
    process.exit(code === 1000 ? 0 : 1);
});

// Test timeout
setTimeout(() => {
    console.log('⏰ Test timeout - closing connection');
    ws.close();
}, 10000);
