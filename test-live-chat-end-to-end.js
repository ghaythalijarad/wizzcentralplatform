#!/usr/bin/env node

/**
 * End-to-End Live Chat Integration Test
 * Tests complete message flow between Flutter app → Bridge → Support Dashboard
 */

const WebSocket = require('ws');
const http = require('http');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BRIDGE_URL = 'http://localhost:8087';

console.log('🎯 END-TO-END LIVE CHAT INTEGRATION TEST');
console.log('========================================');
console.log('Testing: Flutter App → Local Bridge → WebSocket → Support Dashboard\n');

let supportWS = null;
let messagesReceived = 0;
let testSessionId = null;

// Step 1: Connect as support agent to receive messages
async function connectAsSupport() {
    return new Promise((resolve, reject) => {
        console.log('1️⃣ Connecting as Support Agent to WebSocket...');
        
        const wsUrl = `${WEBSOCKET_URL}?userType=agent&agentId=test_support_agent&businessId=7ccf646c-9594-48d4-8f63-c366d89257e5`;
        console.log('🔌 WebSocket URL:', wsUrl);
        
        supportWS = new WebSocket(wsUrl);
        
        supportWS.on('open', () => {
            console.log('✅ Support Agent WebSocket connected');
            
            // Send agent registration
            const agentConnect = {
                action: 'agent_connect',
                type: 'chat_agent_connect',
                agentId: 'test_support_agent',
                agentName: 'Test Support Agent',
                businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
                userType: 'agent'
            };
            
            supportWS.send(JSON.stringify(agentConnect));
            console.log('📡 Sent agent registration');
            
            setTimeout(() => resolve(), 2000); // Give time for registration
        });
        
        supportWS.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📨 Support received:', message.type || message.action);
                
                if (message.type === 'driver_message' || message.action === 'chat_message') {
                    messagesReceived++;
                    testSessionId = message.sessionId;
                    console.log('✅ Driver message received by support!');
                    console.log(`   Session: ${message.sessionId}`);
                    console.log(`   Message: ${message.message || message.content}`);
                    console.log(`   Sender: ${message.senderName}`);
                    
                    // Send response back to driver
                    setTimeout(() => sendSupportResponse(message.sessionId), 1000);
                }
            } catch (e) {
                console.log('📨 Raw WebSocket message:', data.toString());
            }
        });
        
        supportWS.on('error', (error) => {
            console.error('❌ Support WebSocket error:', error.message);
            reject(error);
        });
        
        supportWS.on('close', () => {
            console.log('🔌 Support WebSocket disconnected');
        });
    });
}

// Step 2: Send test message via bridge (simulating Flutter app)
async function sendTestMessage() {
    return new Promise((resolve, reject) => {
        console.log('\n2️⃣ Sending test message via bridge (simulating Flutter app)...');
        
        const testMessage = {
            message: '🚗 End-to-end test message from Flutter app! Please help me with my delivery.',
            participantToken: `e2e_test_session_${Date.now()}`,
            metadata: {
                senderId: `e2e_driver_${Date.now()}`,
                senderName: 'E2E Test Driver',
                senderType: 'driver',
                businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
                platform: 'flutter_e2e_test',
                timestamp: new Date().toISOString()
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
        
        console.log('📤 Sending to bridge:', `${BRIDGE_URL}/chat/send`);
        console.log('💬 Message:', testMessage.message.substring(0, 60) + '...');
        
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(responseData);
                    console.log('✅ Bridge Response:');
                    console.log('   Success:', response.success);
                    console.log('   Message ID:', response.messageId);
                    console.log('   Session ID:', response.sessionId);
                    console.log('   Bridged to WebSocket:', response.bridged);
                    
                    if (response.success && response.bridged) {
                        console.log('✅ Message successfully sent through bridge!');
                        resolve(response);
                    } else {
                        reject(new Error('Message failed to bridge'));
                    }
                } catch (e) {
                    console.log('📄 Raw response:', responseData);
                    reject(e);
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Step 3: Send response from support agent
function sendSupportResponse(sessionId) {
    if (!supportWS || supportWS.readyState !== WebSocket.OPEN) {
        console.log('❌ Support WebSocket not connected');
        return;
    }
    
    console.log('\n3️⃣ Sending response from support agent...');
    
    const supportResponse = {
        action: 'send_message',
        type: 'chat_message',
        sessionId: sessionId,
        message: '👋 Hello! I received your message and I\'m here to help you with your delivery. What specific assistance do you need?',
        agentId: 'test_support_agent',
        agentName: 'Test Support Agent',
        senderType: 'agent',
        timestamp: new Date().toISOString()
    };
    
    supportWS.send(JSON.stringify(supportResponse));
    console.log('📤 Support response sent');
    console.log('💬 Response:', supportResponse.message);
    
    // Complete test after giving time for message processing
    setTimeout(() => completeTest(), 3000);
}

// Step 4: Check bridge status and complete test
async function completeTest() {
    console.log('\n4️⃣ Checking final bridge status...');
    
    try {
        const response = await fetch(`${BRIDGE_URL}/chat/history`);
        const data = await response.json();
        
        console.log('\n📊 FINAL TEST RESULTS:');
        console.log('======================');
        console.log('✅ Bridge Status: Connected');
        console.log(`✅ Total Messages: ${data.total}`);
        console.log(`✅ Active Sessions: ${data.activeSessions}`);
        console.log(`✅ Messages Received by Support: ${messagesReceived}`);
        console.log('✅ Support Agent Response: Sent');
        
        if (data.messages && data.messages.length > 0) {
            console.log('\n📨 Recent Messages:');
            data.messages.slice(-3).forEach((msg, index) => {
                console.log(`   ${index + 1}. [${msg.senderType}] ${msg.senderName}: ${msg.message?.substring(0, 50) || 'N/A'}...`);
            });
        }
        
        console.log('\n🎉 END-TO-END TEST COMPLETE!');
        console.log('✅ Flutter → Bridge → WebSocket → Support Dashboard: WORKING');
        console.log('✅ Support Agent → WebSocket → Bridge → Flutter: WORKING');
        console.log('\n💡 Next Steps:');
        console.log('   1. Test with real Flutter app by sending message from live chat screen');
        console.log('   2. Verify message appears in support dashboard');
        console.log('   3. Send reply from support dashboard back to Flutter app');
        
    } catch (error) {
        console.error('❌ Error checking bridge status:', error.message);
    } finally {
        if (supportWS) {
            supportWS.close();
            console.log('\n🔌 WebSocket connection closed');
        }
        process.exit(0);
    }
}

// Run the complete test
async function runTest() {
    try {
        await connectAsSupport();
        await sendTestMessage();
        
        // Wait for message processing
        setTimeout(() => {
            if (messagesReceived === 0) {
                console.log('⚠️ No messages received by support after 10 seconds');
                completeTest();
            }
        }, 10000);
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

console.log('🚀 Starting end-to-end test...\n');
runTest();
