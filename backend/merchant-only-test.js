#!/usr/bin/env node

/**
 * Merchant-Only Test
 * Simulates a merchant connecting and sending messages
 * Expects a real agent (dashboard) to be connected separately
 */

const WebSocket = require('ws');

const STAGE = process.env.STAGE || 'ghayth';
const WS_BASE = process.env.WS_BASE || 'wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com';
const WS_URL = `${WS_BASE}/${STAGE}`;

console.log(`🏪 Merchant Test: Using endpoint: ${WS_URL}\n`);

// Merchant WebSocket
const merchantId = 'testBiz123';
const merchantName = 'Test Merchant';
const merchantEmail = 'test@merchant.com';
const sessionId = `test_session_${merchantId}_${Date.now()}`;

const merchantWs = new WebSocket(WS_URL);

merchantWs.on('open', () => {
    console.log('✅ Merchant CONNECTED\n');
    
    // Send merchant connect handshake
    const connectMsg = {
        action: 'chat_merchant_connect',
        type: 'chat_merchant_connect',
        merchantId,
        merchantName,
        merchantEmail,
        sessionId
    };
    
    console.log('📤 Sending handshake:', JSON.stringify(connectMsg, null, 2));
    merchantWs.send(JSON.stringify(connectMsg));
    
    // Wait 2 seconds, then send a test message
    setTimeout(() => {
        const testMsg = {
            action: 'chat_message',
            type: 'chat_message',
            sessionId,
            message: '👋 Hello from merchant! Can you see this message in the dashboard?',
            senderType: 'merchant',
            merchantId,
            merchantName,
            timestamp: new Date().toISOString()
        };
        
        console.log('\n📤 Sending message:', testMsg.message);
        merchantWs.send(JSON.stringify(testMsg));
        
        // Send another message after 3 seconds
        setTimeout(() => {
            const msg2 = {
                action: 'chat_message',
                type: 'chat_message',
                sessionId,
                message: '🔍 If you can see this, please reply!',
                senderType: 'merchant',
                merchantId,
                merchantName,
                timestamp: new Date().toISOString()
            };
            
            console.log('📤 Sending message:', msg2.message);
            merchantWs.send(JSON.stringify(msg2));
        }, 3000);
        
    }, 2000);
});

merchantWs.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('\n📥 Merchant received:', JSON.stringify(msg, null, 2));
    
    if (msg.type === 'chat_session_created') {
        console.log('\n✅ Session created:', msg.sessionId);
        console.log('📋 Status:', msg.status);
    }
    
    if (msg.type === 'chat_message') {
        console.log('\n💬 MESSAGE FROM AGENT:', msg.message.text);
        console.log('👤 Sender:', msg.message.senderType);
    }
});

merchantWs.on('error', (error) => {
    console.error('\n❌ Merchant error:', error.message);
});

merchantWs.on('close', () => {
    console.log('\n🔌 Merchant disconnected');
});

// Keep alive for 30 seconds
setTimeout(() => {
    console.log('\n⏱️  Test complete. Closing connection...');
    merchantWs.close();
    process.exit(0);
}, 30000);

console.log('⏳ Waiting for messages... (will auto-close in 30 seconds)');
console.log('📋 Session ID:', sessionId);
console.log('📧 Merchant:', merchantName, `(${merchantEmail})`);
console.log('\n👀 Now check the dashboard at http://localhost:3000/pages/support.html');
console.log('   - You should see a new session appear');
console.log('   - You should see the merchant messages');
console.log('   - Try replying from the dashboard!\n');
