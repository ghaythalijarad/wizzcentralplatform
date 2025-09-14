#!/usr/bin/env node

/**
 * End-to-End Live Chat Integration Test
 * Tests the complete flow: Flutter → HTTP Bridge → WebSocket → Central Platform
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';
const BRIDGE_URL = 'http://localhost:8087';
const SESSION_ID = 'session_04d8a438-1081-70fb-0692-58167201d24d';

// Test parameters
const agentParams = {
    businessId: BUSINESS_ID,
    userId: 'integration-test-agent',
    userType: 'support',
    agentId: 'integration-test-001',
    platform: 'web',
    appVersion: '1.0.0'
};

function buildAgentWebSocketUrl() {
    const params = new URLSearchParams(agentParams);
    return `${WEBSOCKET_URL}?${params.toString()}`;
}

async function sendFlutterMessage(messageText) {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${BRIDGE_URL}/chat/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: SESSION_ID,
                message: messageText,
                metadata: {
                    senderType: 'driver',
                    senderId: '04d8a438-1081-70fb-0692-58167201d24d',
                    senderName: 'Ghayth Ali',
                    platform: 'Flutter-iPhone-IntegrationTest',
                    timestamp: new Date().toISOString(),
                }
            })
        });

        const result = await response.json();
        console.log('📱 Flutter Message Response:', JSON.stringify(result, null, 2));
        return result.success;
    } catch (error) {
        console.error('❌ Failed to send Flutter message:', error);
        return false;
    }
}

async function testLiveChatIntegration() {
    console.log('🚀 Live Chat Integration Test Started');
    console.log('=====================================');
    console.log('🔗 Bridge URL:', BRIDGE_URL);
    console.log('📍 WebSocket URL:', WEBSOCKET_URL);
    console.log('🆔 Session ID:', SESSION_ID);
    console.log('🏢 Business ID:', BUSINESS_ID);
    
    // Step 1: Connect as support agent to monitor
    console.log('\n📞 Step 1: Connecting as support agent...');
    
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(buildAgentWebSocketUrl());
        let messagesReceived = [];
        let testCompleted = false;
        
        const timeout = setTimeout(() => {
            if (!testCompleted) {
                console.log('⏰ Test timeout after 30 seconds');
                ws.close();
                resolve({
                    success: false,
                    error: 'timeout',
                    messagesReceived: messagesReceived.length
                });
            }
        }, 30000);
        
        ws.on('open', async () => {
            console.log('✅ Agent WebSocket connected successfully!');
            
            // Send agent connect message
            const agentConnectMsg = {
                type: 'chat_agent_connect',
                agentId: 'integration-test-agent',
                agentName: 'Integration Test Agent'
            };
            
            ws.send(JSON.stringify(agentConnectMsg));
            console.log('📤 Sent agent connect message');
            
            // Wait for initial messages, then send test message
            setTimeout(async () => {
                console.log('\n📱 Step 2: Sending test message from Flutter...');
                const testMessage = `🧪 INTEGRATION TEST - ${new Date().toISOString()} - This message tests Flutter → Bridge → WebSocket → Central Platform flow!`;
                
                const messageSent = await sendFlutterMessage(testMessage);
                if (messageSent) {
                    console.log('✅ Test message sent successfully from Flutter');
                    console.log('🔍 Monitoring for real-time reception...');
                } else {
                    console.log('❌ Failed to send test message from Flutter');
                }
            }, 3000);
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                messagesReceived.push(message);
                
                console.log('📨 Received WebSocket message:', {
                    type: message.type,
                    timestamp: new Date().toISOString()
                });
                
                // Log specific message types
                if (message.type === 'active_sessions') {
                    const ourSession = message.sessions?.find(s => 
                        s.sessionId.includes('session_04d8a438-1081-70fb-0692-58167201d24d')
                    );
                    if (ourSession) {
                        console.log('📋 Our Session Status:', {
                            driverName: ourSession.driverName,
                            unreadAgent: ourSession.unreadAgent,
                            lastMessageAt: ourSession.lastMessageAt
                        });
                    }
                } else if (message.type === 'chat_message' || message.type === 'driver_message') {
                    console.log('💬 Chat message received:', {
                        content: message.content || message.message,
                        senderType: message.senderType,
                        sessionId: message.sessionId
                    });
                    
                    // Check if this is our test message
                    const content = message.content || message.message || '';
                    if (content.includes('INTEGRATION TEST')) {
                        console.log('🎉 SUCCESS! Our test message was received in real-time!');
                        testCompleted = true;
                        clearTimeout(timeout);
                        ws.close();
                        resolve({
                            success: true,
                            messagesReceived: messagesReceived.length,
                            testMessage: content
                        });
                    }
                }
            } catch (e) {
                console.log('📨 Raw message:', data.toString());
            }
        });
        
        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
            clearTimeout(timeout);
            reject(error);
        });
        
        ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
            clearTimeout(timeout);
            if (!testCompleted) {
                resolve({
                    success: false,
                    error: 'connection_closed',
                    messagesReceived: messagesReceived.length,
                    code,
                    reason: reason.toString()
                });
            }
        });
    });
}

// Run the integration test
async function main() {
    try {
        const result = await testLiveChatIntegration();
        
        console.log('\n🏁 Integration Test Results:');
        console.log('============================');
        console.log('Success:', result.success ? '✅ PASSED' : '❌ FAILED');
        console.log('Messages Received:', result.messagesReceived);
        
        if (result.success) {
            console.log('Test Message:', result.testMessage);
            console.log('\n🎉 INTEGRATION COMPLETE!');
            console.log('✅ Flutter app can successfully send messages to Central Platform via HTTP bridge');
            console.log('✅ Messages are delivered in real-time to support agents');
            console.log('✅ End-to-end live chat integration is working!');
        } else {
            console.log('Error:', result.error);
            if (result.code) console.log('Close Code:', result.code);
            if (result.reason) console.log('Close Reason:', result.reason);
            console.log('\n❌ Integration test failed - need to investigate further');
        }
        
        process.exit(result.success ? 0 : 1);
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

main();
