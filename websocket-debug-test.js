#!/usr/bin/env node

/**
 * WebSocket Debug Test - Production Environment
 * Tests the live chat WebSocket connection and message flow
 */

const WebSocket = require('ws');
const https = require('https');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const API_ENDPOINT = 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send';
const API_KEY = 'wizz-central-api-key-2024';

console.log('🚀 Starting WebSocket Debug Test for Live Chat System');
console.log('=' .repeat(60));

async function testWebSocketConnection() {
    return new Promise((resolve, reject) => {
        console.log('🔌 Connecting to WebSocket:', WEBSOCKET_URL);
        
        const ws = new WebSocket(WEBSOCKET_URL);
        let connected = false;
        let messagesReceived = 0;
        
        const timeout = setTimeout(() => {
            if (!connected) {
                console.log('❌ WebSocket connection timeout');
                ws.close();
                resolve({ success: false, error: 'Connection timeout' });
            }
        }, 10000);
        
        ws.on('open', () => {
            connected = true;
            clearTimeout(timeout);
            console.log('✅ WebSocket connected successfully');
            
            // Register as support agent
            const agentConnect = {
                type: 'chat_agent_connect',
                agentId: 'debug_agent_' + Date.now(),
                agentName: 'Debug Support Agent'
            };
            
            console.log('📤 Sending agent connect message:', JSON.stringify(agentConnect, null, 2));
            ws.send(JSON.stringify(agentConnect));
            
            // Wait for messages
            setTimeout(() => {
                console.log(`📊 Total messages received: ${messagesReceived}`);
                ws.close();
                resolve({ 
                    success: true, 
                    messagesReceived,
                    connection: 'successful'
                });
            }, 5000);
        });
        
        ws.on('message', (data) => {
            messagesReceived++;
            console.log(`📨 Message ${messagesReceived} received:`, data.toString());
            
            try {
                const parsed = JSON.parse(data.toString());
                console.log('📋 Parsed message:', JSON.stringify(parsed, null, 2));
                
                if (parsed.type === 'driver_message') {
                    console.log('🚗 DRIVER MESSAGE DETECTED!');
                    console.log('   SessionId:', parsed.sessionId);
                    console.log('   Message:', parsed.messageText || parsed.text);
                    console.log('   Sender:', parsed.senderName || parsed.metadata?.senderName);
                }
            } catch (e) {
                console.log('   Raw message (not JSON)');
            }
        });
        
        ws.on('error', (error) => {
            console.log('❌ WebSocket error:', error.message);
            clearTimeout(timeout);
            resolve({ success: false, error: error.message });
        });
        
        ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
            clearTimeout(timeout);
        });
    });
}

async function testAPIEndpoint() {
    console.log('\n🔧 Testing API Endpoint...');
    console.log('📡 Endpoint:', API_ENDPOINT);
    
    const testMessage = {
        sessionId: 'debug_session_' + Date.now(),
        messageText: 'Debug test message from WebSocket test script',
        senderType: 'driver',
        senderName: 'Debug Driver',
        metadata: {
            source: 'debug_test',
            timestamp: new Date().toISOString()
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
                console.log('📤 API Response Status:', res.statusCode);
                console.log('📤 API Response:', data);
                resolve({
                    success: res.statusCode === 200,
                    status: res.statusCode,
                    response: data,
                    testMessage
                });
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ API Error:', error.message);
            resolve({
                success: false,
                error: error.message
            });
        });
        
        console.log('📤 Sending test message:', JSON.stringify(testMessage, null, 2));
        req.write(postData);
        req.end();
    });
}

async function runFullTest() {
    console.log('🧪 PHASE 1: WebSocket Connection Test');
    console.log('-'.repeat(40));
    
    const wsResult = await testWebSocketConnection();
    
    console.log('\n🧪 PHASE 2: API Endpoint Test');
    console.log('-'.repeat(40));
    
    const apiResult = await testAPIEndpoint();
    
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log('WebSocket Connection:', wsResult.success ? '✅ SUCCESS' : '❌ FAILED');
    if (!wsResult.success) {
        console.log('   Error:', wsResult.error);
    } else {
        console.log('   Messages Received:', wsResult.messagesReceived);
    }
    
    console.log('API Endpoint:', apiResult.success ? '✅ SUCCESS' : '❌ FAILED');
    if (!apiResult.success) {
        console.log('   Error:', apiResult.error);
    } else {
        console.log('   Status Code:', apiResult.status);
    }
    
    if (wsResult.success && apiResult.success) {
        console.log('\n🎯 NEXT STEPS:');
        console.log('1. Both WebSocket and API are working');
        console.log('2. Check if messages from API are being broadcast to WebSocket');
        console.log('3. Verify message routing in AWS Lambda handlers');
        console.log('4. Test real-time message delivery in support dashboard');
    } else {
        console.log('\n⚠️  ISSUES DETECTED:');
        if (!wsResult.success) {
            console.log('- WebSocket connection failed');
        }
        if (!apiResult.success) {
            console.log('- API endpoint failed');
        }
    }
}

// Run the test
runFullTest().catch(console.error);
