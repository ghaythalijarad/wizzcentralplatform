#!/usr/bin/env node

/**
 * Test WebSocket Authentication Fix
 * Tests the updated Flutter WebSocket connection with proper authentication parameters
 */

import WebSocket from 'ws';

async function testWebSocketAuthentication() {
    console.log('🧪 Testing WebSocket Authentication Fix...\n');

    // Test 1: Driver Connection with Authentication Parameters
    console.log('📱 Test 1: Driver connection with authentication parameters');
    
    const businessId = '7ccf646c-9594-48d4-8f63-c366d89257e5';
    const driverWsUrl = `wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev?userType=driver&businessId=${businessId}&platform=flutter`;
    
    console.log(`🔗 Connecting to: ${driverWsUrl}`);
    
    try {
        const driverWs = new WebSocket(driverWsUrl);
        
        const connectTimeout = setTimeout(() => {
            console.log('❌ Driver connection timeout');
            driverWs.close();
        }, 10000);

        driverWs.on('open', () => {
            clearTimeout(connectTimeout);
            console.log('✅ Driver WebSocket connected successfully!');
            
            // Send driver authentication
            const authMessage = {
                type: 'driver_connect',
                sessionId: `test-session-${Date.now()}`,
                businessId: businessId,
                driverId: 'test-driver-001',
                driverName: 'Test Driver',
                timestamp: new Date().toISOString(),
                platform: 'flutter',
                metadata: {
                    app_version: '1.0.0',
                    platform: 'flutter',
                    userType: 'driver'
                }
            };
            
            driverWs.send(JSON.stringify(authMessage));
            console.log('📤 Sent driver authentication message');
            
            // Test sending a chat message
            setTimeout(() => {
                const chatMessage = {
                    type: 'driver_message',
                    sessionId: authMessage.sessionId,
                    content: 'Hello support team! This is a test message from the Flutter app.',
                    senderId: 'test-driver-001',
                    senderType: 'driver',
                    senderName: 'Test Driver',
                    businessId: businessId,
                    timestamp: new Date().toISOString(),
                    metadata: {
                        driverId: 'test-driver-001',
                        driverName: 'Test Driver',
                        platform: 'WizzDriver'
                    }
                };
                
                driverWs.send(JSON.stringify(chatMessage));
                console.log('💬 Sent test chat message');
            }, 2000);
            
            // Close connection after 5 seconds
            setTimeout(() => {
                driverWs.close();
                console.log('🔌 Driver connection closed\n');
                testAgentConnection();
            }, 5000);
        });

        driverWs.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📥 Driver received:', message.type || message.action, message);
            } catch (e) {
                console.log('📥 Driver received (raw):', data.toString());
            }
        });

        driverWs.on('error', (error) => {
            clearTimeout(connectTimeout);
            console.log('❌ Driver WebSocket error:', error.message);
            console.log('   This might indicate authentication issues\n');
            testAgentConnection();
        });

        driverWs.on('close', (code, reason) => {
            clearTimeout(connectTimeout);
            console.log(`🔌 Driver WebSocket closed: ${code} - ${reason}\n`);
        });
        
    } catch (error) {
        console.log('❌ Failed to create driver WebSocket:', error.message);
        testAgentConnection();
    }
}

async function testAgentConnection() {
    console.log('👨‍💼 Test 2: Agent connection for receiving messages');
    
    const businessId = '7ccf646c-9594-48d4-8f63-c366d89257e5';
    const agentWsUrl = `wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev?userType=agent&businessId=${businessId}&platform=web&agentId=test-agent-001`;
    
    console.log(`🔗 Connecting to: ${agentWsUrl}`);
    
    try {
        const agentWs = new WebSocket(agentWsUrl);
        
        const connectTimeout = setTimeout(() => {
            console.log('❌ Agent connection timeout');
            agentWs.close();
        }, 10000);

        agentWs.on('open', () => {
            clearTimeout(connectTimeout);
            console.log('✅ Agent WebSocket connected successfully!');
            
            // Send agent authentication
            const agentAuth = {
                type: 'chat_agent_connect',
                agentId: 'test-agent-001',
                agentName: 'Test Support Agent',
                businessId: businessId,
                timestamp: new Date().toISOString()
            };
            
            agentWs.send(JSON.stringify(agentAuth));
            console.log('📤 Sent agent authentication message');
            
            // Close connection after 5 seconds
            setTimeout(() => {
                agentWs.close();
                console.log('🔌 Agent connection closed\n');
                showResults();
            }, 5000);
        });

        agentWs.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📥 Agent received:', message.type || message.action, message);
            } catch (e) {
                console.log('📥 Agent received (raw):', data.toString());
            }
        });

        agentWs.on('error', (error) => {
            clearTimeout(connectTimeout);
            console.log('❌ Agent WebSocket error:', error.message);
            showResults();
        });

        agentWs.on('close', (code, reason) => {
            clearTimeout(connectTimeout);
            console.log(`🔌 Agent WebSocket closed: ${code} - ${reason}\n`);
        });
        
    } catch (error) {
        console.log('❌ Failed to create agent WebSocket:', error.message);
        showResults();
    }
}

function showResults() {
    console.log('📊 Test Results Summary:');
    console.log('================================');
    console.log('✅ If both connections succeeded: WebSocket authentication is working');
    console.log('❌ If driver connection failed with 401: Authentication parameters need adjustment');
    console.log('❌ If agent connection failed: Agent authentication needs configuration');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('1. If successful: Test Flutter app with updated WebSocket configuration');
    console.log('2. If failed: Check Lambda authorizer configuration');
    console.log('3. Verify message delivery in Central Platform dashboard');
    console.log('');
    console.log('📱 Flutter App Configuration:');
    console.log('   WebSocket URL: wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev');
    console.log('   Authentication: userType=driver&businessId=7ccf646c-9594-48d4-8f63-c366d89257e5&platform=flutter');
    console.log('');
    console.log('🎯 Expected Result: Messages from Flutter app should appear in Central Platform support dashboard');
}

// Run the test
testWebSocketAuthentication().catch(console.error);
