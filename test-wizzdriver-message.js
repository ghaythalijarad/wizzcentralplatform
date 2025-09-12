#!/usr/bin/env node

/**
 * Test WizzDriver Message Flow
 * Simulates a Flutter driver sending a message via HTTP bridge
 */

const http = require('http');
const https = require('https');

// Test message from WizzDriver
const testMessage = {
    participantToken: 'driver_test_123',
    message: 'Hello from WizzDriver! This is a test message from the Flutter app. I need assistance with my current delivery.',
    contentType: 'text/plain',
    metadata: {
        senderId: 'driver_test_' + Date.now(),
        senderType: 'driver',
        senderName: 'Test Driver (Flutter)',
        timestamp: new Date().toISOString(),
        driverId: 'driver_test_' + Date.now(),
        driverName: 'Test Driver (Flutter)',
        platform: 'flutter',
        source: 'wizzdriver'
    }
};

// Send to chat bridge
const postData = JSON.stringify(testMessage);

const options = {
    hostname: 'yt0j2cdbe5.execute-api.us-east-1.amazonaws.com',
    port: 443,
    path: '/dev/chat/send',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};
console.log('🧪 Testing WizzDriver message flow...');
console.log('📱 Sending test message from Flutter driver');
console.log('🌐 Target:', `https://${options.hostname}${options.path}`);
console.log('📨 Message:', testMessage.message.substring(0, 50) + '...');
console.log('📋 Metadata:', testMessage.metadata);
console.log('📨 Message:', testMessage.message.substring(0, 50) + '...');
const req = https.request(options, (res) => {
const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('✅ Response:', response);
            if (response.success) {
                console.log('🎉 Message successfully sent via HTTP bridge!');
                console.log('📋 Session ID:', response.sessionId);
            } else {
                console.log('❌ Message failed:', response.error);
            }
        } catch (e) {
            console.log('📄 Raw response:', data);
        }
    });
});

req.on('error', (err) => {
    console.error('❌ Request error:', err.message);
});

req.write(postData);
req.end();
