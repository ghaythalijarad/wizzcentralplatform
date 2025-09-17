#!/usr/bin/env node

/**
 * Production Live Chat Test - Flutter App to Deployed Amplify Platform
 * Tests the end-to-end message flow using production endpoints
 */

const WebSocket = require('ws');
const https = require('https');

console.log('🚀 PRODUCTION LIVE CHAT TEST');
console.log('===========================');
console.log('Testing: Flutter App → Production HTTP Bridge → WebSocket → Deployed Amplify Platform');
console.log('Date:', new Date().toISOString());
console.log('');

// Production endpoints
const PRODUCTION_WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const PRODUCTION_HTTP_BRIDGE = 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send';
const AMPLIFY_PLATFORM_URL = 'https://main.d2f5oacwil9cbi.amplifyapp.com';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

let supportAgent = null;
let testCompleted = false;
let messageReceived = false;

// Step 1: Connect as support agent to monitor incoming messages
async function connectSupportAgent() {
    return new Promise((resolve, reject) => {
        console.log('1️⃣ Connecting as support agent to production WebSocket...');
        
        const agentUrl = `${PRODUCTION_WEBSOCKET_URL}?userType=support&agentId=production-test-agent&businessId=${BUSINESS_ID}`;
        console.log('🔗 WebSocket URL:', agentUrl);
        
        supportAgent = new WebSocket(agentUrl);
        
        const timeout = setTimeout(() => {
            console.log('⏰ Connection timeout after 10 seconds');
            reject(new Error('WebSocket connection timeout'));
        }, 10000);
        
        supportAgent.on('open', () => {
            clearTimeout(timeout);
            console.log('✅ Support agent connected to production WebSocket');
            
            // Send agent connect message
            const connectMsg = {
                action: 'agent_connect',
                type: 'agent_connect',
                payload: {
                    agentId: 'production-test-agent',
                    agentName: 'Production Test Agent',
                    status: 'available',
                    timestamp: new Date().toISOString()
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
                    const messageContent = message.content || message.payload?.content || message.messageText || message.message || '';
                    
                    if (messageContent.includes('PRODUCTION TEST')) {
                        console.log('🎉 SUCCESS! Production test message received!');
                        console.log('📝 Message content:', messageContent);
                        console.log('👤 From:', message.senderName || message.payload?.senderName || 'Unknown');
                        console.log('🆔 Session:', message.sessionId || message.payload?.sessionId || 'Unknown');
                        messageReceived = true;
                        completeTest();
                    } else {
                        console.log('📨 Other message received:', messageContent.substring(0, 50) + '...');
                    }
                }
            } catch (e) {
                console.log('📨 Raw WebSocket message:', data.toString().substring(0, 100));
            }
        });
        
        supportAgent.on('error', (error) => {
            clearTimeout(timeout);
            console.error('❌ Support agent WebSocket error:', error.message);
            reject(error);
        });
        
        supportAgent.on('close', (code, reason) => {
            console.log(`🔌 Support agent disconnected: ${code} ${reason}`);
        });
    });
}

// Step 2: Send test message via production HTTP bridge
async function sendProductionTestMessage() {
    return new Promise((resolve, reject) => {
        console.log('\\n2️⃣ Sending test message via production HTTP bridge...');
        
        const testMessage = {
            participantToken: 'flutter-production-test',
            message: '🚀 PRODUCTION TEST: This message is sent from Flutter app to deployed Amplify platform! Testing end-to-end live chat integration. الرسالة العربية للاختبار.',
            contentType: 'text/plain',
            metadata: {
                senderId: 'flutter-production-test',
                senderType: 'driver',
                senderName: 'Flutter Production Test Driver',
                timestamp: new Date().toISOString(),
                driverId: 'flutter-production-test',
                driverName: 'Flutter Production Test Driver',
                driverPhone: '+9647801234567',
                platform: 'flutter',
                source: 'production_test',
                context: {
                    testType: 'production_deployment',
                    amplifyPlatform: AMPLIFY_PLATFORM_URL,
                    testDate: new Date().toISOString()
                }
            }
        };

        const postData = JSON.stringify(testMessage);
        const url = new URL(PRODUCTION_HTTP_BRIDGE);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log('🎯 Target:', PRODUCTION_HTTP_BRIDGE);
        console.log('📝 Message preview:', testMessage.message.substring(0, 50) + '...');

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(responseData);
                    console.log('✅ Production HTTP Bridge Response:');
                    console.log('   Status:', res.statusCode);
                    console.log('   Success:', response.success);
                    console.log('   Message ID:', response.messageId);
                    console.log('   Session ID:', response.sessionId);
                    
                    if (response.success) {
                        console.log('✅ Message successfully sent via production HTTP bridge!');
                        resolve(response);
                    } else {
                        reject(new Error('Production HTTP bridge failed: ' + response.error));
                    }
                } catch (e) {
                    console.log('📄 Raw HTTP response:', responseData);
                    reject(e);
                }
            });
        });

        req.on('error', (err) => {
            console.error('❌ Production HTTP request error:', err.message);
            reject(err);
        });

        req.write(postData);
        req.end();
    });
}

// Step 3: Complete test and show results
function completeTest() {
    if (testCompleted) return;
    testCompleted = true;
    
    console.log('\\n🎉 PRODUCTION LIVE CHAT TEST COMPLETED!');
    console.log('========================================');
    console.log('✅ Support agent connected to production WebSocket');
    console.log('✅ Production HTTP bridge received Flutter message');
    console.log('✅ Message forwarded to production WebSocket');
    console.log('✅ Support agent received live message on Amplify platform');
    console.log('');
    console.log('🎯 PRODUCTION INTEGRATION STATUS: WORKING PERFECTLY!');
    console.log('');
    console.log('🌐 Deployed Platform URLs:');
    console.log('   Main Platform:', AMPLIFY_PLATFORM_URL);
    console.log('   Support Dashboard:', AMPLIFY_PLATFORM_URL + '/pages/support.html');
    console.log('   Live Chat Test:', AMPLIFY_PLATFORM_URL + '/live-chat-test.html');
    console.log('');
    console.log('📱 Flutter App Ready for Live Testing!');
    console.log('   1. Open Flutter app on simulator/device');
    console.log('   2. Navigate to "More" → "Support" → "Live Chat"');
    console.log('   3. Send a message to support');
    console.log('   4. Check deployed support dashboard for real-time delivery');
    
    // Clean up
    if (supportAgent) {
        supportAgent.close();
    }
    
    process.exit(0);
}

// Main test execution
async function runProductionTest() {
    try {
        console.log('🔍 Testing production endpoints...');
        console.log('   WebSocket:', PRODUCTION_WEBSOCKET_URL);
        console.log('   HTTP Bridge:', PRODUCTION_HTTP_BRIDGE);
        console.log('   Amplify Platform:', AMPLIFY_PLATFORM_URL);
        console.log('');
        
        // Step 1: Connect support agent
        await connectSupportAgent();
        
        // Wait for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 2: Send test message
        await sendProductionTestMessage();
        
        // Wait for message to be received
        console.log('\\n⏳ Waiting for message reception...');
        setTimeout(() => {
            if (!messageReceived) {
                console.log('\\n⚠️ Test timeout - Message not received within 15 seconds');
                console.log('🔍 This might indicate:');
                console.log('   • Production WebSocket authentication required');
                console.log('   • HTTP bridge not properly forwarding to WebSocket');
                console.log('   • Support dashboard not connected to WebSocket');
                console.log('\\n💡 Try:');
                console.log('   • Open support dashboard manually and check console');
                console.log('   • Test with Flutter app directly');
                console.log('   • Check AWS CloudWatch logs');
                
                if (supportAgent) {
                    supportAgent.close();
                }
                process.exit(1);
            }
        }, 15000);
        
    } catch (error) {
        console.error('\\n❌ Production test failed:', error.message);
        console.log('\\n🔍 Troubleshooting:');
        console.log('   • Check AWS API Gateway status');
        console.log('   • Verify WebSocket Lambda functions are deployed');
        console.log('   • Check Amplify deployment status');
        console.log('   • Verify HTTP bridge Lambda function');
        
        if (supportAgent) {
            supportAgent.close();
        }
        process.exit(1);
    }
}

// Run the production test
console.log('🚀 Starting production live chat test...\\n');
runProductionTest();
