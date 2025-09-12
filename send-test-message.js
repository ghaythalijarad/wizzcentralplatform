#!/usr/bin/env node

/**
 * Simple test to send a driver message and verify it appears in support interface
 */

import https from 'https';

const CHAT_BRIDGE_URL = 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send';

async function sendTestMessage() {
    console.log('🚀 Sending test driver message to support interface...');
    
    const messageData = {
        senderId: 'real-driver-test-001',
        senderName: 'Real Driver Test',
        message: `Test message from real driver at ${new Date().toLocaleString()}`,
        timestamp: new Date().toISOString()
    };

    const postData = JSON.stringify(messageData);
    
    return new Promise((resolve, reject) => {
        const url = new URL(CHAT_BRIDGE_URL);
        
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log('📤 Sending message:', messageData);
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log(`📨 Response (${res.statusCode}):`, response);
                    
                    if (res.statusCode === 200 && response.success) {
                        console.log('✅ Message sent successfully!');
                        console.log(`📋 Session ID: ${response.sessionId}`);
                        console.log(`📋 Message ID: ${response.messageId}`);
                        console.log('\n👀 Check the support interface for the message!');
                    } else {
                        console.log('⚠️ Message sent but with warnings:', response.message);
                    }
                    resolve(response);
                } catch (e) {
                    console.log('📨 Raw response:', data);
                    resolve({ raw: data });
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

sendTestMessage().then(() => {
    console.log('\n🎯 Test complete. Check the support interface browser window for the message.');
    process.exit(0);
}).catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
