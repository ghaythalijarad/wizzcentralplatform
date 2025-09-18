#!/usr/bin/env node

/**
 * Complete End-to-End Live Chat Test
 * Tests Flutter App → HTTP Bridge → WebSocket → Support Dashboard
 */

const WebSocket = require('ws');
const http = require('http');

console.log('🎯 COMPLETE END-TO-END LIVE CHAT TEST');
console.log('====================================');
console.log('Testing: Flutter App → HTTP Bridge → WebSocket → Support Dashboard\n');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';
const BRIDGE_URL = 'http://localhost:8087';

let supportAgent = null;
let messageReceived = false;
let testCompleted = false;

// Step 1: Connect as support agent to monitor incoming messages
async function connectSupportAgent() {
    return new Promise((resolve, reject) => {
        console.log('1️⃣ Connecting as support agent...');
        
        const agentUrl = `${WEBSOCKET_URL}?userType=support&agentId=test-support-e2e&businessId=${BUSINESS_ID}`;
        console.log('🔗 WebSocket URL:', agentUrl);
        
        supportAgent = new WebSocket(agentUrl);
        
        supportAgent.on('open', () => {
            console.log('✅ Support agent connected successfully');
            
            // Send agent connect message
            const connectMsg = {
                action: 'agent_connect',
                type: 'agent_connect',
                payload: {
                    agentId: 'test-support-e2e',
                    agentName: 'End-to-End Test Agent',
                    status: 'available'
                }
            };
            
            supportAgent.send(JSON.stringify(connectMsg));
            console.log('📤 Sent agent connect message');
            resolve();
        });
        
        supportAgent.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📨 Support agent received:', message.type || message.action || 'unknown');
                
                // Check if this is our test message
                if (message.type === 'chat_message' || message.action === 'chat_message') {
                    const messageContent = message.content || message.payload?.content || message.messageText || '';
                    if (messageContent.includes('END-TO-END TEST MESSAGE')) {
                        console.log('🎉 SUCCESS! Test message received by support agent!');
                        console.log('📝 Message content:', messageContent);
                        console.log('👤 From:', message.senderName || message.payload?.senderName || 'Unknown');
                        console.log('🆔 Session:', message.sessionId || message.payload?.sessionId || 'Unknown');
                        messageReceived = true;
                        completeTest();
                    }
                }
            } catch (e) {
                console.log('📨 Raw WebSocket message:', data.toString().substring(0, 100));
            }
        });
        
        supportAgent.on('error', (error) => {
            console.error('❌ Support agent WebSocket error:', error.message);
            reject(error);
        });
        
        supportAgent.on('close', (code, reason) => {
            console.log(`🔌 Support agent disconnected: ${code} ${reason}`);
        });
    });
}

// Step 2: Send test message via HTTP bridge (simulating Flutter app)
async function sendTestMessage() {
    return new Promise((resolve, reject) => {
        console.log('\n2️⃣ Sending test message via HTTP bridge (simulating Flutter app)...');
        
        const testMessage = {
            participantToken: 'e2e-test-driver',
            message: '🧪 END-TO-END TEST MESSAGE: This message should appear in the support dashboard! Testing live chat integration between Flutter app and WizzCentral Platform.',
            contentType: 'text/plain',
            metadata: {
                senderId: 'e2e-test-driver',
                senderType: 'driver',
                senderName: 'E2E Test Driver',
                timestamp: new Date().toISOString(),
                driverId: 'e2e-test-driver',
                driverName: 'E2E Test Driver',
                driverPhone: '+9647801234567',
                platform: 'flutter',
                source: 'end_to_end_test',
                context: {
                    currentLocation: {
                        latitude: 33.3152,
                        longitude: 44.3661,
                        address: 'Baghdad, Iraq'
                    },
                    testType: 'end_to_end_integration',
                    timestamp: new Date().toISOString()
                }
            }
        };

        const postData = JSON.stringify(testMessage);
        const options = {
            hostname: 'localhost',
            port: 8087,
            path: '/chat/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log('🚀 Sending to:', `${BRIDGE_URL}/chat/send`);
        console.log('📝 Message preview:', testMessage.message.substring(0, 50) + '...');

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(responseData);
                    console.log('✅ HTTP Bridge Response:');
                    console.log('   Status:', res.statusCode);
                    console.log('   Success:', response.success);
                    console.log('   Message ID:', response.messageId);
                    console.log('   Session ID:', response.sessionId);
                    console.log('   Bridged to WebSocket:', response.bridged);
                    
                    if (response.success && response.bridged) {
                        console.log('✅ Message successfully bridged to WebSocket!');
                        resolve(response);
                    } else {
                        reject(new Error('Message failed to bridge to WebSocket'));
                    }
                } catch (e) {
                    console.log('📄 Raw HTTP response:', responseData);
                    reject(e);
                }
            });
        });

        req.on('error', (err) => {
            console.error('❌ HTTP request error:', err.message);
            reject(err);
        });

        req.write(postData);
        req.end();
    });
}

// Step 3: Wait for message reception and complete test
function completeTest() {
    if (testCompleted) return;
    testCompleted = true;
    
    console.log('\n🎉 END-TO-END TEST COMPLETED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('✅ Support agent connected to WebSocket');
    console.log('✅ HTTP bridge received Flutter message');
    console.log('✅ Message forwarded to WebSocket');
    console.log('✅ Support agent received live message');
    console.log('');
    console.log('🎯 INTEGRATION STATUS: WORKING PERFECTLY!');
    console.log('');
    console.log('📱 Next Steps:');
    console.log('   1. Test with real Flutter app');
    console.log('   2. Open support dashboard: http://localhost:5173/pages/support.html');
    console.log('   3. Send message from Flutter app live chat');
    console.log('   4. Verify real-time message delivery');
    
    // Clean up
    if (supportAgent) {
        supportAgent.close();
    }
    
    process.exit(0);
}

// Main test execution
async function runEndToEndTest() {
    try {
        // Step 1: Connect support agent
        await connectSupportAgent();
        
        // Wait a moment for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 2: Send test message
        await sendTestMessage();
        
        // Wait for message to be received (timeout after 10 seconds)
        console.log('\n⏳ Waiting for message reception...');
        setTimeout(() => {
            if (!messageReceived) {
                console.log('\n⚠️ Test timeout - Message not received within 10 seconds');
                console.log('🔍 Troubleshooting:');
                console.log('   • Check if chat-message-bridge is running on port 8087');
                console.log('   • Verify WebSocket connection to AWS API Gateway');
                console.log('   • Check browser console for errors');
                console.log('   • Open support dashboard and try again');
                
                if (supportAgent) {
                    supportAgent.close();
                }
                process.exit(1);
            }
        }, 10000);
        
    } catch (error) {
        console.error('\n❌ End-to-end test failed:', error.message);
        console.log('\n🔍 Check the following:');
        console.log('   • Chat message bridge running: node chat-message-bridge.cjs');
        console.log('   • WebSocket URL accessible: ' + WEBSOCKET_URL);
        console.log('   • HTTP bridge URL accessible: ' + BRIDGE_URL);
        
        if (supportAgent) {
            supportAgent.close();
        }
        process.exit(1);
    }
}

// Run the test
console.log('🚀 Starting end-to-end test...\n');
runEndToEndTest();
