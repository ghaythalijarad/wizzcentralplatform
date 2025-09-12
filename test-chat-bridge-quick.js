#!/usr/bin/env node

const https = require('https');

const testChatBridge = () => {
    console.log('🚨 Testing Chat Bridge API...');
    
    const payload = {
        sessionId: `test_driver_support_${Date.now()}`,
        message: 'Hello from test driver! I need help with my delivery.',
        userType: 'driver',
        userId: 'test_driver_123',
        userMetadata: {
            driverName: 'Test Driver',
            driverId: 'test_driver_123',
            platform: 'WizzDriver',
            timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
    };

    const data = JSON.stringify(payload);
    
    const options = {
        hostname: 'ru65nhlwhc.execute-api.us-east-1.amazonaws.com',
        port: 443,
        path: '/dev/api/chat/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
        },
    };

    const req = https.request(options, (res) => {
        console.log(`✅ Response status: ${res.statusCode}`);
        
        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });
        
        res.on('end', () => {
            console.log('📋 Response body:', body);
            try {
                const response = JSON.parse(body);
                if (response.success || response.statusCode === 200) {
                    console.log('🎉 Chat bridge test successful!');
                    console.log('📨 Message sent to support agents via WebSocket');
                } else {
                    console.log('❌ Chat bridge test failed:', response.message);
                }
            } catch (e) {
                console.log('⚠️ Response parsing error:', e.message);
                console.log('📄 Raw response:', body);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request error:', error);
    });

    req.write(data);
    req.end();
    
    console.log('📤 Test message sent to chat bridge...');
};

testChatBridge();
