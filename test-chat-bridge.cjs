#!/usr/bin/env node

/**
 * Test Chat Bridge Comprehensive Validation
 * Tests the full flow: HTTP -> Bridge -> WebSocket -> Backend
 */

const http = require('http');

const BRIDGE_URL = 'http://localhost:8087';

// Test scenarios
const testScenarios = [
    {
        name: 'Driver Connect',
        endpoint: '/chat/send',
        data: {
            type: 'chat_driver_connect',
            driverId: 'test_driver_456',
            driverName: 'Jane Driver',
            businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
        }
    },
    {
        name: 'Chat Init',
        endpoint: '/chat/send',
        data: {
            type: 'chat_init',
            driverId: 'test_driver_456',
            businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
        }
    },
    {
        name: 'Send Message',
        endpoint: '/chat/send',
        data: {
            type: 'chat_message',
            message: 'Hello, I need help with my delivery!',
            driverId: 'test_driver_456',
            sessionId: 'session_test_driver_456',
            businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
        }
    },
    {
        name: 'Heartbeat',
        endpoint: '/chat/send',
        data: {
            type: 'heartbeat',
            driverId: 'test_driver_456',
            sessionId: 'session_test_driver_456'
        }
    }
];

async function makeRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: 'localhost',
            port: 8087,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(responseBody);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseBody });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

async function testBridge() {
    console.log('🧪 Testing Chat Message Bridge...\n');

    // Test health endpoint first
    try {
        const healthResponse = await makeRequest('/health', {});
        console.log('✅ Health Check:', healthResponse.data);
    } catch (e) {
        console.log('❌ Health Check Failed:', e.message);
        return;
    }

    // Run test scenarios
    for (const scenario of testScenarios) {
        try {
            console.log(`\n🔄 Testing: ${scenario.name}`);
            console.log(`📤 Sending:`, JSON.stringify(scenario.data, null, 2));
            
            const response = await makeRequest(scenario.endpoint, scenario.data);
            
            if (response.status === 200) {
                console.log(`✅ Success:`, response.data);
            } else {
                console.log(`❌ Failed (${response.status}):`, response.data);
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (e) {
            console.log(`❌ Error in ${scenario.name}:`, e.message);
        }
    }

    // Test status endpoint
    try {
        console.log(`\n🔍 Testing Status Endpoint`);
        const statusResponse = await makeRequest('/chat/status', {});
        console.log('📊 Bridge Status:', statusResponse.data);
    } catch (e) {
        console.log('❌ Status Check Failed:', e.message);
    }

    console.log('\n🏁 Bridge testing complete!');
}

testBridge().catch(console.error);
