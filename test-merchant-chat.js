#!/usr/bin/env node
/**
 * Test Merchant Chat Connection
 * Simulates a merchant connecting to the support chat system
 */

const WebSocket = require('ws');

// Test configuration
const WEBSOCKET_URL = 'ws://localhost:3000/ws';
const TEST_MERCHANT = {
    merchantId: 'test_merchant_12345',
    merchantName: 'Test Merchant Store',
    merchantEmail: 'test@merchant.com',
    sessionId: `test_session_${Date.now()}`
};

console.log('🧪 Testing Merchant Chat Connection');
console.log('====================================');
console.log('');
console.log('📡 Connecting to:', WEBSOCKET_URL);
console.log('👤 Merchant:', TEST_MERCHANT.merchantName);
console.log('📧 Email:', TEST_MERCHANT.merchantEmail);
console.log('');

// Create WebSocket connection
const ws = new WebSocket(WEBSOCKET_URL);

ws.on('open', () => {
    console.log('✅ WebSocket connected!');
    console.log('');
    
    // Send merchant handshake
    console.log('📤 Sending merchant handshake...');
    const handshake = {
        action: 'chat_merchant_connect',
        type: 'chat_merchant_connect',
        sessionId: TEST_MERCHANT.sessionId,
        merchantId: TEST_MERCHANT.merchantId,
        merchantName: TEST_MERCHANT.merchantName,
        merchantEmail: TEST_MERCHANT.merchantEmail,
        timestamp: new Date().toISOString()
    };
    
    console.log('Handshake data:', JSON.stringify(handshake, null, 2));
    ws.send(JSON.stringify(handshake));
    
    // Wait 2 seconds, then send a test message
    setTimeout(() => {
        console.log('');
        console.log('📤 Sending test message...');
        const message = {
            action: 'chat_message',
            type: 'chat_message',
            sessionId: TEST_MERCHANT.sessionId,
            message: 'Hello! This is a test message from the merchant app. Can you see this?',
            senderType: 'merchant',
            merchantId: TEST_MERCHANT.merchantId,
            merchantName: TEST_MERCHANT.merchantName,
            timestamp: new Date().toISOString()
        };
        
        console.log('Message data:', JSON.stringify(message, null, 2));
        ws.send(JSON.stringify(message));
        
        console.log('');
        console.log('✅ Test message sent!');
        console.log('');
        console.log('🔍 Check the support dashboard at: http://localhost:3000/pages/support.html');
        console.log('   You should see:');
        console.log('   1. Session appear in "ACTIVE CONVERSATIONS"');
        console.log('   2. Message: "Hello! This is a test message..."');
        console.log('');
        console.log('⏳ Keeping connection open for 30 seconds...');
        console.log('   (Press Ctrl+C to exit)');
        console.log('');
        
        // Keep alive for 30 seconds
        setTimeout(() => {
            console.log('⏰ 30 seconds elapsed. Closing connection...');
            ws.close();
        }, 30000);
        
    }, 2000);
});

ws.on('message', (data) => {
    console.log('');
    console.log('📨 Received message from server:');
    try {
        const parsed = JSON.parse(data.toString());
        console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
        console.log(data.toString());
    }
    console.log('');
});

ws.on('error', (error) => {
    console.error('');
    console.error('❌ WebSocket error:');
    console.error(error.message);
    console.error('');
    console.error('💡 Make sure the local dev server is running:');
    console.error('   cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform');
    console.error('   npm run local');
    console.error('');
    process.exit(1);
});

ws.on('close', () => {
    console.log('');
    console.log('🔌 WebSocket connection closed');
    console.log('');
    process.exit(0);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('');
    console.log('👋 Closing connection...');
    ws.close();
});
