#!/usr/bin/env node

/**
 * Quick test to send driver message to support interface
 */

const https = require('https');

const messageData = {
    senderId: 'test-driver-final-001',
    senderName: 'Test Driver Final',
    message: `FINAL TEST MESSAGE - ${new Date().toLocaleString()}`,
    timestamp: new Date().toISOString()
};

const postData = JSON.stringify(messageData);
const url = new URL('https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send');

const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 10000 // 10 second timeout
};

console.log('📤 Sending final test message...');
console.log('📋 Message:', messageData);
console.log('🔗 Endpoint:', url.toString());

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    
    res.on('end', () => {
        console.log(`📨 Response Status: ${res.statusCode}`);
        console.log('📨 Response:', data);
        
        if (res.statusCode === 200) {
            console.log('✅ SUCCESS! Message sent. Check the support interface!');
        } else {
            console.log('⚠️ Warning: Unexpected status code');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
});

req.on('timeout', () => {
    console.error('⏰ Request timeout');
    req.destroy();
});

req.write(postData);
req.end();
