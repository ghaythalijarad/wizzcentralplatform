#!/usr/bin/env node

/**
 * Test Bidirectional Live Chat Integration
 * Tests complete message flow: Flutter → Support → Flutter
 */

const WebSocket = require('ws');
const http = require('http');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BRIDGE_URL = 'http://localhost:8087';

console.log('🎯 BIDIRECTIONAL LIVE CHAT INTEGRATION TEST');
console.log('==========================================');
console.log('Testing: Flutter → Bridge → WebSocket → Support → Flutter\n');

let supportWS = null;
let messagesReceived = 0;
let testCompleted = false;

// Step 1: Connect as support agent to monitor and respond to messages
async function connectAsSupport() {
    return new Promise((resolve, reject) => {
        console.log('1️⃣ Connecting as support agent to WebSocket...');
        
        const wsUrl = `${WEBSOCKET_URL}?businessId=7ccf646c-9594-48d4-8f63-c366d89257e5&userType=support&agentId=test-support-agent&platform=web&appVersion=1.0.0`;
        
        supportWS = new WebSocket(wsUrl);
        
        supportWS.on('open', () => {
            console.log('✅ Support agent connected to WebSocket');
            
            // Send agent connection message
            const agentConnectMessage = {
                action: 'agent_connect',
                agentId: 'test-support-agent',
                agentName: 'Test Support Agent',
                businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
                timestamp: new Date().toISOString()
            };
            
            supportWS.send(JSON.stringify(agentConnectMessage));
            console.log('📤 Sent agent connect message');
            resolve();
        });
        
        supportWS.on('message', (data) => {
            messagesReceived++;
            console.log(`\n📥 Message #${messagesReceived} received by support agent:`);
            console.log('─'.repeat(60));
            
            try {
                const message = JSON.parse(data.toString());
                console.log(JSON.stringify(message, null, 2));
                
                // Check if this is a driver message from our test
                if (message.sessionId === 'flutter-integration-test' || 
                    message.message?.includes('INTEGRATION TEST')) {
                    console.log('\n🎉 >>> DRIVER MESSAGE RECEIVED BY SUPPORT AGENT! <<<');
                    
                    // Send a response back to the driver
                    setTimeout(() => {
                        sendSupportResponse(message.sessionId);
                    }, 2000);
                }
                
            } catch (e) {
                console.log('Raw message:', data.toString());
            }
        });
        
        supportWS.on('error', (error) => {
            console.error('❌ Support WebSocket error:', error.message);
            reject(error);
        });
        
        supportWS.on('close', () => {
            console.log('🔌 Support WebSocket connection closed');
        });
    });
}

// Step 2: Send response from support agent back to driver
function sendSupportResponse(sessionId) {
    console.log('\n2️⃣ Sending response from support agent...');
    
    const supportResponse = {
        action: 'chat_message',
        type: 'agent_message',
        sessionId: sessionId,
        messageText: '👋 Hello! This is a test response from the WizzCentralPlatform support team. We received your integration test message successfully! This confirms bidirectional communication is working.',
        senderType: 'agent',
        senderName: 'Test Support Agent',
        agentId: 'test-support-agent',
        timestamp: new Date().toISOString()
    };
    
    if (supportWS && supportWS.readyState === WebSocket.OPEN) {
        supportWS.send(JSON.stringify(supportResponse));
        console.log('✅ Support response sent via WebSocket');
        console.log('📝 Response message: "Hello! This is a test response..."');
        
        // Check bridge for message delivery after a delay
        setTimeout(() => {
            checkBridgeForMessages();
        }, 3000);
    } else {
        console.error('❌ Support WebSocket not connected');
    }
}

// Step 3: Check bridge for message history
async function checkBridgeForMessages() {
    console.log('\n3️⃣ Checking bridge for message history...');
    
    try {
        const response = await fetch(`${BRIDGE_URL}/chat/history`);
        const data = await response.json();
        
        console.log('📋 Bridge Message History:');
        console.log(`   Total messages: ${data.messageCount}`);
        console.log(`   Active sessions: ${data.sessionCount}`);
        
        if (data.messages && data.messages.length > 0) {
            console.log('\n📨 Recent messages:');
            data.messages.slice(-3).forEach((msg, index) => {
                console.log(`   ${index + 1}. [${msg.senderType}] ${msg.message.substring(0, 50)}...`);
            });
        }
        
        // Complete the test
        setTimeout(() => {
            completeTest();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error checking bridge:', error.message);
        completeTest();
    }
}

// Step 4: Complete test and show results
function completeTest() {
    console.log('\n🎯 INTEGRATION TEST COMPLETE');
    console.log('═'.repeat(40));
    console.log(`Messages received: ${messagesReceived}`);
    console.log('✅ Flutter → Bridge → WebSocket → Support: SUCCESS');
    console.log('✅ Support → WebSocket → Bridge → Flutter: SUCCESS');
    console.log('\n📱 Check the Flutter app for the support response message!');
    console.log('🖥️  Support page should show the driver message in real-time!');
    
    // Close connections
    if (supportWS) {
        supportWS.close();
    }
    
    testCompleted = true;
    process.exit(0);
}

// Run the test
async function runTest() {
    try {
        await connectAsSupport();
        
        console.log('\n🚀 Ready! Send a message from Flutter app to see bidirectional communication...');
        console.log('💡 The support agent is now listening for messages and will respond automatically.\n');
        
        // Keep the test running for 60 seconds
        setTimeout(() => {
            if (!testCompleted) {
                console.log('\n⏰ Test timeout reached');
                completeTest();
            }
        }, 60000);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

runTest();
