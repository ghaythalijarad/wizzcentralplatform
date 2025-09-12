#!/usr/bin/env node

/**
 * Test Production Chat Bridge
 * Send test message to verify end-to-end flow
 */

const https = require('https');

async function testProductionChat() {
    console.log('🧪 Testing Production Chat Bridge...');
    
    const testMessage = {
        participantToken: 'driver_test_123',
        message: `Hello WizzCentral Support! This is a test message from WizzDriver at ${new Date().toLocaleTimeString()}. I need assistance with my delivery.`,
        contentType: 'text/plain',
        metadata: {
            senderId: 'unknown_driver_' + Date.now(),
            senderType: 'driver',
            senderName: 'Test WizzDriver',
            timestamp: new Date().toISOString(),
            driverId: 'unknown_driver_' + Date.now(),
            driverName: 'Test WizzDriver',
            platform: 'flutter',
            source: 'http_api'
        }
    };

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

    console.log('🌐 Target:', `https://${options.hostname}${options.path}`);
    console.log('📱 Driver ID:', testMessage.metadata.senderId);
    console.log('📨 Message:', testMessage.message);

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            console.log('📊 Status:', res.statusCode);
            console.log('📋 Headers:', res.headers);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    console.log('📄 Raw response:', data);
                    const response = JSON.parse(data);
                    console.log('✅ Parsed response:', response);
                    
                    if (response.success) {
                        console.log('🎉 Message successfully sent!');
                        console.log('📋 Session ID:', response.sessionId);
                        console.log('📝 Message ID:', response.messageId);
                        resolve(response);
                    } else {
                        console.log('❌ Message failed:', response.error);
                        reject(new Error(response.error || 'Unknown error'));
                    }
                } catch (e) {
                    console.log('❌ JSON parse error:', e.message);
                    console.log('📄 Raw data:', data);
                    reject(e);
                }
            });
        });

        req.on('error', (err) => {
            console.error('❌ Request error:', err.message);
            reject(err);
        });

        req.setTimeout(10000, () => {
            console.error('❌ Request timeout');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
    });
}

// Run the test
testProductionChat()
    .then((response) => {
        console.log('\n✅ Test completed successfully!');
        console.log('👀 Check the WizzCentral Support interface for the new message');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    });
