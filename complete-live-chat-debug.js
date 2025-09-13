#!/usr/bin/env node

/**
 * Complete Flutter App Live Chat Debugging Script
 * Tests the entire flow from Flutter app authentication to Central Platform message reception
 */

const WebSocket = require('ws');
const https = require('https');

// Configuration
const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const CENTRAL_PLATFORM_URL = 'https://main.d2f5oacwil9cbi.amplifyapp.com';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

console.log('🔍 COMPREHENSIVE FLUTTER APP LIVE CHAT DEBUG');
console.log('===========================================');
console.log('Date:', new Date().toISOString());
console.log('');

// Test 1: Verify Central Platform is accessible
async function testCentralPlatform() {
    console.log('1️⃣ Testing Central Platform accessibility...');
    
    return new Promise((resolve) => {
        https.get(CENTRAL_PLATFORM_URL, (res) => {
            console.log(`✅ Central Platform HTTP Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log('✅ Central Platform is online and accessible');
                resolve(true);
            } else {
                console.log(`❌ Central Platform returned: ${res.statusCode}`);
                resolve(false);
            }
        }).on('error', (err) => {
            console.log('❌ Central Platform connection error:', err.message);
            resolve(false);
        });
    });
}

// Test 2: Verify WebSocket authentication requirement
async function testWebSocketAuth() {
    console.log('2️⃣ Testing WebSocket authentication requirement...');
    
    return new Promise((resolve) => {
        const ws = new WebSocket(WEBSOCKET_URL);
        
        ws.on('open', () => {
            console.log('❌ SECURITY ISSUE: WebSocket opened without authentication!');
            ws.close();
            resolve(false);
        });
        
        ws.on('error', (error) => {
            if (error.message.includes('401')) {
                console.log('✅ WebSocket correctly requires authentication (401 error)');
                resolve(true);
            } else {
                console.log('❌ Unexpected WebSocket error:', error.message);
                resolve(false);
            }
        });
        
        setTimeout(() => {
            ws.close();
            resolve(false);
        }, 3000);
    });
}

// Test 3: Connect as support agent to listen for messages
async function connectSupportAgent() {
    console.log('3️⃣ Connecting as support agent to monitor messages...');
    
    return new Promise((resolve) => {
        const supportWsUrl = `${WEBSOCKET_URL}?userType=agent_dashboard&agentId=debug-agent-001&businessId=${BUSINESS_ID}&platform=dashboard&version=1.0.0`;
        
        const ws = new WebSocket(supportWsUrl);
        let messageReceived = false;
        
        ws.on('open', () => {
            console.log('✅ Support agent connected successfully');
            
            // Send agent authentication
            const agentAuth = {
                type: 'chat_agent_connect',
                agentId: 'debug-agent-001',
                agentName: 'Debug Agent',
                timestamp: new Date().toISOString()
            };
            
            ws.send(JSON.stringify(agentAuth));
            console.log('📤 Agent authentication sent');
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📥 Support agent received:', message.type || message.action);
                
                if (message.type === 'driver_message' || message.type === 'chat_message') {
                    console.log('🎉 SUCCESS! Driver message received by support agent:');
                    console.log('   Message:', message.content || message.messageText);
                    console.log('   Sender:', message.senderName || message.senderId);
                    messageReceived = true;
                }
            } catch (e) {
                console.log('📥 Support agent received (raw):', data.toString());
            }
        });
        
        ws.on('error', (error) => {
            console.log('❌ Support agent connection error:', error.message);
        });
        
        // Keep listening for messages for 30 seconds
        setTimeout(() => {
            ws.close();
            resolve(messageReceived);
        }, 30000);
    });
}

// Main test function
async function runDiagnosis() {
    console.log('🧪 Starting comprehensive diagnosis...');
    console.log('');
    
    // Test Central Platform
    const centralOk = await testCentralPlatform();
    console.log('');
    
    // Test WebSocket auth
    const authOk = await testWebSocketAuth();
    console.log('');
    
    // Start support agent listener
    console.log('🎧 Starting support agent listener...');
    console.log('   Will listen for 30 seconds for any driver messages');
    console.log('');
    
    const supportPromise = connectSupportAgent();
    
    // Give user instructions
    console.log('📱 INSTRUCTIONS FOR TESTING:');
    console.log('============================');
    console.log('1. Open the Flutter app on your iPhone');
    console.log('2. Make sure you are LOGGED IN with a valid account');
    console.log('3. Go to Support → Live Chat');
    console.log('4. Send a message like "Test message from Flutter app"');
    console.log('5. Watch this script for incoming messages');
    console.log('');
    console.log('⏰ Listening for messages (30 seconds)...');
    
    const messageReceived = await supportPromise;
    
    console.log('');
    console.log('🏁 DIAGNOSIS COMPLETE');
    console.log('====================');
    console.log(`Central Platform Online: ${centralOk ? '✅' : '❌'}`);
    console.log(`WebSocket Auth Working: ${authOk ? '✅' : '❌'}`);
    console.log(`Driver Message Received: ${messageReceived ? '✅' : '❌'}`);
    console.log('');
    
    if (!messageReceived) {
        console.log('❌ NO MESSAGE RECEIVED - POSSIBLE CAUSES:');
        console.log('=========================================');
        console.log('1. Driver is not logged in to Flutter app');
        console.log('2. Driver does not have valid Cognito account');
        console.log('3. JWT token is not being obtained properly');
        console.log('4. WebSocket connection from Flutter app is failing');
        console.log('5. Message is not being sent from Flutter app');
        console.log('');
        console.log('🔧 RECOMMENDED FIXES:');
        console.log('=====================');
        console.log('1. Check Flutter app console logs for authentication errors');
        console.log('2. Ensure driver is logged in with valid credentials');
        console.log('3. Verify AWS Cognito integration is working in Flutter');
        console.log('4. Test with the updated debugging version we just created');
    } else {
        console.log('🎉 SUCCESS! The live chat system is working correctly!');
        console.log('Messages are flowing from Flutter app to Central Platform.');
    }
}

// Run the diagnosis
runDiagnosis().catch(console.error);
