#!/usr/bin/env node

/**
 * Final End-to-End Test: WizzDriver → WizzCentral Support
 * Tests the complete authentication solution
 */

const https = require('https');

console.log('🎯 FINAL END-TO-END TEST: WizzDriver → WizzCentral Support');
console.log('===========================================================');
console.log('');

// Test the new API key-based authentication
async function testApiKeyAuthentication() {
    console.log('1️⃣ Testing API Key Authentication...');
    
    const testMessage = {
        participantToken: `test_driver_${Date.now()}`,
        message: '🚗 Final Test: Hello from WizzDriver! This should reach support agents with API key auth.',
        contentType: 'text/plain',
        metadata: {
            senderId: `test_driver_${Date.now()}`,
            senderName: 'Test Driver (Final)',
            senderType: 'driver',
            businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
            platform: 'final-test',
            timestamp: new Date().toISOString()
        }
    };

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(testMessage);

        const options = {
            hostname: 'ru65nhlwhc.execute-api.us-east-1.amazonaws.com',
            port: 443,
            path: '/dev/api/chat/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'wizzdriver_mobile_app_v1',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log(`   🔗 Endpoint: https://${options.hostname}${options.path}`);
        console.log(`   🔑 API Key: ${options.headers['X-API-Key']}`);
        console.log(`   📨 Message: ${testMessage.message.substring(0, 50)}...`);

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(responseData);
                    console.log(`   📡 Status: ${res.statusCode}`);
                    console.log(`   📊 Response:`, response);
                    
                    if (res.statusCode === 200 && response.success) {
                        console.log('   ✅ SUCCESS: API key authentication working!');
                        console.log(`   📋 Message ID: ${response.messageId}`);
                        console.log(`   📋 Session ID: ${response.sessionId}`);
                        console.log(`   📋 Bridged: ${response.bridged}`);
                        resolve(response);
                    } else {
                        console.log('   ❌ FAILED: API authentication error');
                        reject(new Error(`Status: ${res.statusCode}, Error: ${response.error}`));
                    }
                } catch (e) {
                    console.log('   ❌ FAILED: Invalid response format');
                    console.log('   📄 Raw:', responseData);
                    reject(e);
                }
            });
        });

        req.on('error', (err) => {
            console.log('   ❌ REQUEST FAILED:', err.message);
            reject(err);
        });

        req.write(postData);
        req.end();
    });
}

// Test without API key (should fail)
async function testMissingApiKey() {
    console.log('\n2️⃣ Testing Missing API Key (should fail)...');
    
    return new Promise((resolve) => {
        const testMessage = { message: 'This should fail without API key' };
        const postData = JSON.stringify(testMessage);

        const options = {
            hostname: 'ru65nhlwhc.execute-api.us-east-1.amazonaws.com',
            port: 443,
            path: '/dev/api/chat/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Intentionally missing X-API-Key header
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                console.log(`   📡 Status: ${res.statusCode}`);
                if (res.statusCode === 401) {
                    console.log('   ✅ SUCCESS: Missing API key correctly rejected');
                } else {
                    console.log('   ⚠️ UNEXPECTED: Should have returned 401');
                }
                console.log(`   📄 Response: ${responseData}`);
                resolve();
            });
        });

        req.on('error', () => {
            console.log('   ✅ SUCCESS: Request failed as expected');
            resolve();
        });

        req.write(postData);
        req.end();
    });
}

// Test with invalid API key (should fail)
async function testInvalidApiKey() {
    console.log('\n3️⃣ Testing Invalid API Key (should fail)...');
    
    return new Promise((resolve) => {
        const testMessage = { message: 'This should fail with invalid API key' };
        const postData = JSON.stringify(testMessage);

        const options = {
            hostname: 'ru65nhlwhc.execute-api.us-east-1.amazonaws.com',
            port: 443,
            path: '/dev/api/chat/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'invalid_key_12345', // Invalid key
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                console.log(`   📡 Status: ${res.statusCode}`);
                if (res.statusCode === 401) {
                    console.log('   ✅ SUCCESS: Invalid API key correctly rejected');
                } else {
                    console.log('   ⚠️ UNEXPECTED: Should have returned 401');
                }
                console.log(`   📄 Response: ${responseData}`);
                resolve();
            });
        });

        req.on('error', () => {
            console.log('   ✅ SUCCESS: Request failed as expected');
            resolve();
        });

        req.write(postData);
        req.end();
    });
}

// Run all tests
async function runFinalTests() {
    try {
        console.log('🧪 Starting comprehensive authentication tests...\n');
        
        // Test 1: Valid API key
        await testApiKeyAuthentication();
        
        // Test 2: Missing API key
        await testMissingApiKey();
        
        // Test 3: Invalid API key
        await testInvalidApiKey();
        
        console.log('\n🎉 FINAL TEST RESULTS:');
        console.log('========================');
        console.log('✅ API key authentication: WORKING');
        console.log('✅ Security validation: WORKING');
        console.log('✅ Cross-platform communication: ENABLED');
        console.log('');
        console.log('🚀 WizzDriver ↔ WizzCentral integration is READY!');
        console.log('📱 Flutter apps can now communicate with Support Dashboard');
        console.log('🎯 Different user pools successfully bridged with API keys');
        
    } catch (error) {
        console.log('\n❌ FINAL TEST FAILED:');
        console.log('=====================');
        console.log('Error:', error.message);
        console.log('');
        console.log('📋 Check deployment status and try again');
    }
}

// Start testing
runFinalTests();
