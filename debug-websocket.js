#!/usr/bin/env node

/**
 * Direct WebSocket Test - Connect as Support Agent and Listen for Messages
 * This will help us debug the WebSocket connection issue
 */

const WebSocket = require('ws');

console.log('🔌 Testing Direct WebSocket Connection to AWS');
console.log('============================================');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

// Build connection URL like the support dashboard does
const businessId = '7ccf646c-9594-48d4-8f63-c366d89257e5';
const userId = 'debug_support_agent_' + Date.now();
const agentId = 'debug_agent_' + Date.now();

const params = new URLSearchParams({
    businessId: businessId,
    userType: 'support',
    agentId: agentId,
    platform: 'web',
    appVersion: '1.0.0'
});

const fullUrl = `${WEBSOCKET_URL}?${params.toString()}`;

console.log('🔗 Connecting to:', fullUrl);
console.log('🆔 Agent ID:', agentId);
console.log('');

const ws = new WebSocket(fullUrl);

ws.on('open', () => {
    console.log('✅ WebSocket Connected Successfully!');
    console.log('⏰ Connected at:', new Date().toISOString());
    
    // Send agent connect message
    const agentConnect = {
        type: 'chat_agent_connect',
        agentId: agentId,
        agentName: 'Debug Support Agent'
    };
    
    console.log('📤 Sending agent connect message...');
    ws.send(JSON.stringify(agentConnect));
    
    // Send a test message to ensure connection is working
    setTimeout(() => {
        const testMessage = {
            type: 'heartbeat',
            timestamp: new Date().toISOString()
        };
        console.log('💓 Sending heartbeat...');
        ws.send(JSON.stringify(testMessage));
    }, 2000);
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log('📨 Message Received:', message.type || message.action);
        console.log('📋 Full Message:', JSON.stringify(message, null, 2));
        
        // Check if this is a driver message
        if (message.type === 'driver_message' || message.type === 'chat_message') {
            console.log('🚗 DRIVER MESSAGE DETECTED!');
            console.log('   Session:', message.sessionId);
            console.log('   Sender:', message.senderName);
            console.log('   Message:', message.message);
        }
        
    } catch (e) {
        console.log('📨 Raw Message:', data.toString());
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket Error:', error.message);
});

ws.on('close', (code, reason) => {
    console.log('🔌 WebSocket Closed');
    console.log('   Code:', code);
    console.log('   Reason:', reason.toString());
});

// Keep the connection alive for testing
setTimeout(() => {
    console.log('');
    console.log('🧪 Connection is active and listening for messages...');
    console.log('📱 Now send a message from the Flutter app to test!');
    console.log('');
    console.log('⏹️  Press Ctrl+C to stop');
}, 3000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Closing WebSocket connection...');
    ws.close();
    process.exit(0);
});
