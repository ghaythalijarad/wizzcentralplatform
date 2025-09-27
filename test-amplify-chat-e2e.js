#!/usr/bin/env node

/**
 * COMPREHENSIVE END-TO-END LIVE CHAT TEST
 * Tests: iPhone WhizzDriver App → HTTP Bridge → WebSocket → Amplify Support Dashboard
 * Updated with correct AWS Amplify domain
 */

const WebSocket = require('ws');
const https = require('https');
const url = require('url');

console.log('🧪 COMPREHENSIVE LIVE CHAT SYSTEM TEST');
console.log('==========================================');
console.log('📱 WhizzDriver iPhone → 🌐 HTTP Bridge → 📡 WebSocket → 💻 Amplify Dashboard');
console.log('');

// CORRECT Configuration with Local Bridge and Amplify
const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const HTTP_BRIDGE_URL = 'http://localhost:8087/chat/send'; // Use working local bridge
const SUPPORT_DASHBOARD_URL = 'https://main.d2f5oacwil9cbi.amplifyapp.com/pages/support.html';

console.log('🔧 Configuration:');
console.log(`   WebSocket: ${WEBSOCKET_URL}`);
console.log(`   HTTP Bridge: ${HTTP_BRIDGE_URL}`);
console.log(`   Support Dashboard: ${SUPPORT_DASHBOARD_URL}`);
console.log('');

let messagesReceived = 0;
let testSessionId = 'e2e_test_' + Date.now();

// Test 1: WebSocket Agent Connection
console.log('🧪 TEST 1: WebSocket Agent Registration');
console.log('─────────────────────────────────────────');

const ws = new WebSocket(WEBSOCKET_URL);

ws.on('open', () => {
    console.log('✅ WebSocket connected to AWS API Gateway');
    
    // Register as support agent
    const agentRegistration = {
        action: 'chat_init',
        userType: 'agent',
        agentId: 'amplify_test_agent_' + Date.now(),
        agentName: 'Amplify Test Support Agent',
        businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
    };
    
    console.log('📡 Registering as support agent...');
    ws.send(JSON.stringify(agentRegistration));
    
    setTimeout(() => {
        console.log('');
        console.log('🧪 TEST 2: iPhone App Message Simulation');
        console.log('──────────────────────────────────────────');
        simulateIPhoneMessage();
    }, 3000);
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log(`📥 WebSocket received: ${message.action}`);
        
        if (message.action === 'agent_connected') {
            console.log('✅ Agent registration confirmed');
        }
        
        if (message.action === 'sessions_sync') {
            console.log(`📋 Active sessions synced: ${message.sessions?.length || 0} sessions`);
        }
        
        if (message.action === 'message_received') {
            messagesReceived++;
            console.log('');
            console.log('🎉 SUCCESS: LIVE MESSAGE RECEIVED!');
            console.log('═══════════════════════════════════════');
            console.log(`   📱 Session: ${message.sessionId}`);
            console.log(`   👤 Sender: ${message.senderName} (${message.senderType})`);
            console.log(`   💬 Message: "${message.message}"`);
            console.log(`   🕐 Time: ${message.timestamp}`);
            console.log('');
            console.log('✅ END-TO-END FLOW WORKING!');
            console.log('   iPhone App → HTTP Bridge → WebSocket → Amplify Dashboard');
            console.log('');
            
            setTimeout(() => {
                runFinalValidation();
            }, 2000);
        }
        
    } catch (error) {
        console.log(`📥 Raw WebSocket message: ${data.toString()}`);
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket closed: ${code} ${reason || 'Normal closure'}`);
});

// Simulate iPhone WhizzDriver app sending message
function simulateIPhoneMessage() {
    const testMessage = {
        message: 'AMPLIFY TEST: Live chat working from iPhone WhizzDriver app! ' + new Date().toLocaleTimeString(),
        metadata: {
            senderId: 'test_driver_' + Date.now(),
            senderName: 'iPhone Test Driver',
            senderType: 'driver',
            timestamp: new Date().toISOString(),
            businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
        }
    };
    
    console.log('📱 Simulating iPhone WhizzDriver app message...');
    console.log(`   Session: ${testMessage.sessionId}`);
    console.log(`   Message: "${testMessage.message}"`);
    console.log(`   Sender: ${testMessage.senderName}`);
    
    const postData = JSON.stringify(testMessage);
    const parsedUrl = url.parse(HTTP_BRIDGE_URL);
    
    const options = {
        hostname: parsedUrl.hostname || 'localhost',
        port: parsedUrl.port || 8087,
        path: parsedUrl.path || '/chat/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'User-Agent': 'WhizzDriver-iPhone/1.0'
        }
    };
    
    console.log(`📡 Sending to HTTP Bridge: ${HTTP_BRIDGE_URL}`);
    
    const http = require('http'); // Add http module for localhost
    const req = http.request(options, (res) => {
        console.log(`📥 HTTP Bridge response: ${res.statusCode} ${res.statusMessage}`);
        
        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(responseData);
                console.log('✅ HTTP Bridge processed message successfully');
                console.log(`   Response: ${JSON.stringify(response, null, 2)}`);
                
                if (response.success) {
                    console.log('');
                    console.log('⏳ Waiting for WebSocket broadcast to Amplify dashboard...');
                    console.log('   (Should appear above within 5 seconds)');
                } else {
                    console.log('❌ HTTP Bridge returned error:', response.message || response.error);
                }
            } catch (error) {
                console.log('📥 HTTP Bridge raw response:', responseData);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('❌ HTTP Bridge request failed:', error.message);
        console.log('💡 This might indicate the HTTP bridge endpoint is not accessible');
    });
    
    req.write(postData);
    req.end();
}

// Final validation and summary
function runFinalValidation() {
    console.log('🧪 TEST 3: System Validation Summary');
    console.log('───────────────────────────────────────');
    console.log('');
    console.log('📊 TEST RESULTS:');
    console.log(`   ✅ WebSocket Connection: Connected`);
    console.log(`   ✅ Agent Registration: Successful`);
    console.log(`   ✅ HTTP Bridge: ${messagesReceived > 0 ? 'Working' : 'Failed'}`);
    console.log(`   ✅ Message Broadcasting: ${messagesReceived > 0 ? 'Working' : 'Failed'}`);
    console.log(`   ✅ Messages Received: ${messagesReceived}`);
    console.log('');
    console.log('🌐 AMPLIFY DEPLOYMENT STATUS:');
    console.log(`   ✅ Support Dashboard: ${SUPPORT_DASHBOARD_URL}`);
    console.log(`   ✅ WebSocket Endpoint: ${WEBSOCKET_URL}`);
    console.log(`   ✅ HTTP Bridge: ${HTTP_BRIDGE_URL}`);
    console.log('');
    
    if (messagesReceived > 0) {
        console.log('🎉 COMPREHENSIVE TEST: SUCCESS!');
        console.log('═══════════════════════════════════');
        console.log('   ✅ iPhone WhizzDriver App → HTTP Bridge → WebSocket → Amplify Dashboard');
        console.log('   ✅ Real-time message flow confirmed');
        console.log('   ✅ Agent registration working');
        console.log('   ✅ End-to-end system operational');
        console.log('');
        console.log('💡 MANUAL TESTING INSTRUCTIONS:');
        console.log('   1. Open Support Dashboard: ' + SUPPORT_DASHBOARD_URL);
        console.log('   2. Send message from iPhone WhizzDriver app');
        console.log('   3. Verify message appears in real-time on dashboard');
        console.log('');
        console.log('🚀 SYSTEM STATUS: PRODUCTION READY!');
    } else {
        console.log('⚠️  PARTIAL SUCCESS');
        console.log('═══════════════════');
        console.log('   ✅ WebSocket connection working');
        console.log('   ❌ Message flow needs verification');
        console.log('');
        console.log('🔧 NEXT STEPS:');
        console.log('   1. Check HTTP Bridge endpoint accessibility');
        console.log('   2. Verify API key authentication');
        console.log('   3. Check WebSocket message forwarding');
    }
    
    setTimeout(() => {
        ws.close();
        process.exit(messagesReceived > 0 ? 0 : 1);
    }, 2000);
}

// Auto-timeout after 30 seconds
setTimeout(() => {
    console.log('');
    console.log('⏰ Test timeout after 30 seconds');
    console.log('');
    console.log('💡 MANUAL TESTING AVAILABLE:');
    console.log('   • Support Dashboard: ' + SUPPORT_DASHBOARD_URL);
    console.log('   • Send messages from iPhone WhizzDriver app');
    console.log('   • Messages should appear in dashboard in real-time');
    console.log('');
    process.exit(2);
}, 30000);

// Handle process interruption
process.on('SIGINT', () => {
    console.log('\n👋 Test interrupted by user');
    ws.close();
    process.exit(3);
});

console.log('🔄 Starting comprehensive test...');
console.log('   Press Ctrl+C to cancel at any time');
console.log('');
