#!/usr/bin/env node

/**
 * Real-time Message Test
 * This test sends a message via the HTTP API and monitors the WebSocket for the message
 */

const WebSocket = require('ws');
const https = require('https');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const API_ENDPOINT = 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send';
const API_KEY = 'wizz-central-api-key-2024';

let wsConnection = null;
let messagesReceived = [];

async function connectWebSocket() {
    return new Promise((resolve, reject) => {
        console.log('🔌 Connecting to WebSocket...');
        
        wsConnection = new WebSocket(WEBSOCKET_URL);
        
        wsConnection.on('open', () => {
            console.log('✅ WebSocket connected');
            
            // Register as support agent
            const agentConnect = {
                type: 'chat_agent_connect',
                agentId: 'test_agent_' + Date.now(),
                agentName: 'Test Support Agent'
            };
            
            console.log('📤 Registering as support agent...');
            wsConnection.send(JSON.stringify(agentConnect));
            resolve(true);
        });
        
        wsConnection.on('message', (data) => {
            const timestamp = new Date().toISOString();
            const message = data.toString();
            messagesReceived.push({ timestamp, message });
            
            console.log(`\n📨 [${timestamp}] WebSocket Message:`);
            console.log(message);
            
            try {
                const parsed = JSON.parse(message);
                if (parsed.type === 'driver_message' || parsed.type === 'chat_message') {
                    console.log('🎯 CHAT MESSAGE DETECTED!');
                    console.log('   Type:', parsed.type);
                    console.log('   Session:', parsed.sessionId);
                    console.log('   Text:', parsed.messageText || parsed.text);
                }
            } catch (e) {
                // Not JSON, ignore
            }
        });
        
        wsConnection.on('error', (error) => {
            console.log('❌ WebSocket error:', error.message);
            reject(error);
        });
        
        wsConnection.on('close', (code, reason) => {
            console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
        });
    });
}

async function sendTestMessage() {
    console.log('\n📤 Sending test message via HTTP API...');
    
    const sessionId = 'realtime_test_' + Date.now();
    const testMessage = {
        sessionId: sessionId,
        messageText: 'Real-time test message - checking WebSocket delivery at ' + new Date().toISOString(),
        senderType: 'driver',
        senderName: 'Test Driver',
        metadata: {
            source: 'realtime_test',
            timestamp: new Date().toISOString(),
            testId: 'rt_' + Math.random().toString(36).substr(2, 9)
        }
    };
    
    const postData = JSON.stringify(testMessage);
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'ru65nhlwhc.execute-api.us-east-1.amazonaws.com',
            path: '/dev/api/chat/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'x-api-key': API_KEY
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('📡 API Status:', res.statusCode);
                console.log('📡 API Response:', data);
                
                resolve({
                    success: res.statusCode === 200,
                    status: res.statusCode,
                    response: data,
                    sessionId: sessionId,
                    testMessage: testMessage
                });
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ API Error:', error.message);
            resolve({ success: false, error: error.message });
        });
        
        console.log('📋 Message details:');
        console.log('   Session ID:', sessionId);
        console.log('   Message Text:', testMessage.messageText);
        
        req.write(postData);
        req.end();
    });
}

async function runTest() {
    console.log('🧪 Real-time Message Delivery Test');
    console.log('=' .repeat(50));
    
    try {
        // Connect to WebSocket
        await connectWebSocket();
        
        // Wait a moment for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n📊 Initial messages received:', messagesReceived.length);
        
        // Send test message
        const result = await sendTestMessage();
        
        if (!result.success) {
            console.log('❌ Failed to send message via API');
            return;
        }
        
        // Monitor for the message for 10 seconds
        console.log('\n⏱️  Monitoring WebSocket for 10 seconds...');
        const startTime = Date.now();
        const initialCount = messagesReceived.length;
        let found = false;
        
        const checkInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newMessages = messagesReceived.length - initialCount;
            
            process.stdout.write(`\r⏱️  ${(elapsed/1000).toFixed(1)}s - New messages: ${newMessages}  `);
            
            // Check if we received our test message
            const recentMessages = messagesReceived.slice(initialCount);
            for (const msg of recentMessages) {
                if (msg.message.includes(result.sessionId) || msg.message.includes('realtime_test')) {
                    found = true;
                    console.log('\n🎯 TEST MESSAGE FOUND IN WEBSOCKET!');
                    console.log('   Time to delivery:', elapsed + 'ms');
                    clearInterval(checkInterval);
                    break;
                }
            }
            
            if (elapsed > 10000) {
                clearInterval(checkInterval);
            }
        }, 100);
        
        // Wait for test to complete
        await new Promise(resolve => setTimeout(resolve, 10500));
        
        console.log('\n\n📊 TEST RESULTS:');
        console.log('=' .repeat(30));
        console.log('Messages sent via API: ✅ SUCCESS');
        console.log('Message found in WebSocket:', found ? '✅ SUCCESS' : '❌ FAILED');
        console.log('Total WebSocket messages:', messagesReceived.length);
        console.log('New messages during test:', messagesReceived.length - initialCount);
        
        if (!found) {
            console.log('\n🔍 DEBUG: Recent WebSocket messages:');
            messagesReceived.slice(-5).forEach((msg, i) => {
                console.log(`   ${i + 1}. [${msg.timestamp}] ${msg.message.substring(0, 100)}...`);
            });
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    } finally {
        if (wsConnection) {
            wsConnection.close();
        }
    }
}

// Run the test
runTest().catch(console.error);
