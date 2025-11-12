#!/usr/bin/env node

/**
 * Test Merchant WebSocket Connection
 * Tests the entire merchant chat flow from connection to message delivery
 */

const WebSocket = require('ws');

const WS_URL = 'wss://7ysrz3rspi.execute-api.us-east-1.amazonaws.com/dev';
const TEST_MERCHANT_ID = 'test_merchant_123';
const TEST_MERCHANT_NAME = 'Test Merchant Store';
const TEST_MERCHANT_EMAIL = 'test@merchant.com';

console.log('🧪 Testing Merchant WebSocket Connection...\n');
console.log(`📡 Connecting to: ${WS_URL}\n`);

// Create WebSocket connection with query parameters
const wsUrl = `${WS_URL}?businessId=${TEST_MERCHANT_ID}&userType=merchant&app=whizzMerchants`;
const ws = new WebSocket(wsUrl);

let sessionId = `test_session_${Date.now()}`;

ws.on('open', () => {
    console.log('✅ WebSocket connection established!\n');
    
    // Send merchant handshake
    const handshake = {
        action: 'chat_merchant_connect',
        type: 'chat_merchant_connect',
        sessionId: sessionId,
        merchantId: TEST_MERCHANT_ID,
        merchantName: TEST_MERCHANT_NAME,
        merchantEmail: TEST_MERCHANT_EMAIL
    };
    
    console.log('📤 Sending handshake:');
    console.log(JSON.stringify(handshake, null, 2));
    console.log('');
    
    ws.send(JSON.stringify(handshake));
    
    // Send a test message after 2 seconds
    setTimeout(() => {
        const testMessage = {
            action: 'chat_message',
            type: 'chat_message',
            sessionId: sessionId,
            message: 'Test merchant message from Node.js script',
            senderType: 'merchant',
            merchantId: TEST_MERCHANT_ID,
            merchantName: TEST_MERCHANT_NAME
        };
        
        console.log('📤 Sending test message:');
        console.log(JSON.stringify(testMessage, null, 2));
        console.log('');
        
        ws.send(JSON.stringify(testMessage));
    }, 2000);
    
    // Close connection after 5 seconds
    setTimeout(() => {
        console.log('🔌 Closing connection...\n');
        ws.close();
    }, 5000);
});

ws.on('message', (data) => {
    console.log('📨 Received message:');
    try {
        const parsed = JSON.parse(data.toString());
        console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
        console.log(data.toString());
    }
    console.log('');
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
    console.error('');
});

ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket closed with code ${code}`);
    if (reason) {
        console.log(`   Reason: ${reason.toString()}`);
    }
    console.log('');
    console.log('🏁 Test completed!');
    process.exit(0);
});

// Timeout safety
setTimeout(() => {
    console.log('⏱️ Test timeout - closing...');
    ws.close();
    process.exit(1);
}, 10000);
