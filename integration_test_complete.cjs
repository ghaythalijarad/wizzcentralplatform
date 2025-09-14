#!/usr/bin/env node

/**
 * COMPLETE INTEGRATION TEST
 * Tests the full Flutter → HTTP Bridge → WebSocket → Central Platform flow
 */

const WebSocket = require('ws');

console.log('🎯 LIVE CHAT INTEGRATION TEST - Complete End-to-End Flow');
console.log('=====================================================');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';
const BRIDGE_URL = 'http://localhost:8087/chat/send';

let dashboardWS = null;
let messageReceived = false;

// Step 1: Connect as dashboard agent to monitor incoming messages
async function connectDashboard() {
    return new Promise((resolve, reject) => {
        console.log('\n📺 Step 1: Connecting Central Platform Dashboard...');
        
        const agentUrl = `${WEBSOCKET_URL}?userType=support&agentId=integration-test-dashboard&businessId=${BUSINESS_ID}&platform=web`;
        dashboardWS = new WebSocket(agentUrl);
        
        dashboardWS.on('open', () => {
            console.log('✅ Dashboard connected to WebSocket');
            
            // Send authentication
            dashboardWS.send(JSON.stringify({
                type: 'chat_agent_connect',
                agentId: 'integration-test-dashboard',
                agentName: 'Integration Test Dashboard',
                businessId: BUSINESS_ID
            }));
        });
        
        dashboardWS.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log(`📨 Dashboard received: ${message.type}`);
                
                if (message.type === 'agent_connected') {
                    console.log('✅ Dashboard authenticated successfully');
                    resolve();
                }
                
                if (message.type === 'chat_message' || message.type === 'driver_message') {
                    console.log('🎉 SUCCESS! Message received in dashboard:');
                    console.log(`   Driver: ${message.driverName || message.senderName}`);
                    console.log(`   Message: ${message.message || message.content}`);
                    console.log(`   Session: ${message.sessionId}`);
                    messageReceived = true;
                }
                
                if (message.type === 'active_sessions') {
                    const sessionCount = message.sessions ? message.sessions.length : 0;
                    console.log(`📊 Found ${sessionCount} active sessions`);
                }
                
            } catch (e) {
                console.log('📨 Raw dashboard message:', data.toString());
            }
        });
        
        dashboardWS.on('error', (error) => {
            console.error('❌ Dashboard error:', error.message);
            reject(error);
        });
        
        setTimeout(() => {
            if (!messageReceived) {
                reject(new Error('Dashboard connection timeout'));
            }
        }, 10000);
    });
}

// Step 2: Send test message through HTTP bridge (simulating Flutter app)
async function sendTestMessage() {
    console.log('\n📱 Step 2: Sending message through HTTP Bridge (Flutter simulation)...');
    
    const testMessage = {
        message: '🧪 INTEGRATION TEST - End-to-End Flow Verification!',
        sessionId: 'session_04d8a438-1081-70fb-0692-58167201d24d',
        metadata: {
            senderType: 'driver',
            senderId: 'integration_test_driver',
            senderName: 'Integration Test Driver'
        }
    };
    
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testMessage)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ Message sent through HTTP bridge successfully');
            console.log(`   Message ID: ${result.messageId}`);
            console.log(`   Session ID: ${result.sessionId}`);
            console.log(`   Bridged: ${result.bridged}`);
            return true;
        } else {
            console.error('❌ HTTP bridge failed:', result);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Failed to send message:', error.message);
        return false;
    }
}

// Step 3: Wait for message to appear in dashboard
async function waitForMessage() {
    console.log('\n⏳ Step 3: Waiting for message to appear in dashboard...');
    
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            if (!messageReceived) {
                console.log('❌ Timeout: Message did not appear in dashboard within 10 seconds');
                resolve(false);
            }
        }, 10000);
        
        const checkMessage = setInterval(() => {
            if (messageReceived) {
                clearTimeout(timeout);
                clearInterval(checkMessage);
                console.log('✅ Message successfully received in dashboard!');
                resolve(true);
            }
        }, 500);
    });
}

// Run the complete integration test
async function runIntegrationTest() {
    try {
        // Step 1: Connect dashboard
        await connectDashboard();
        
        // Step 2: Send message
        const messageSent = await sendTestMessage();
        if (!messageSent) {
            throw new Error('Failed to send message through bridge');
        }
        
        // Step 3: Wait for message
        const messageReceived = await waitForMessage();
        
        // Results
        console.log('\n🎯 INTEGRATION TEST RESULTS:');
        console.log('=============================');
        console.log(`✅ Dashboard Connection: SUCCESS`);
        console.log(`✅ HTTP Bridge: SUCCESS`);
        console.log(`${messageReceived ? '✅' : '❌'} End-to-End Flow: ${messageReceived ? 'SUCCESS' : 'FAILED'}`);
        
        if (messageReceived) {
            console.log('\n🎉 INTEGRATION TEST PASSED!');
            console.log('🚀 Live chat integration is working end-to-end!');
            console.log('📱 Flutter app messages will now appear in Central Platform dashboard');
        } else {
            console.log('\n❌ INTEGRATION TEST FAILED');
            console.log('🔍 Message was bridged but not displayed in dashboard');
        }
        
    } catch (error) {
        console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
    } finally {
        if (dashboardWS) {
            dashboardWS.close();
        }
        process.exit(0);
    }
}

// Start the test
runIntegrationTest();
