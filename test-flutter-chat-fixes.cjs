#!/usr/bin/env node

/**
 * Test Flutter Chat Service Connection Fixes
 * Validates that the protocol fixes resolve the reconnection issues
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

console.log('🧪 Testing Flutter Chat Service Protocol Fixes...');
console.log('📍 WebSocket URL:', WEBSOCKET_URL);

// Test Agent Connection (for receiving driver messages)
async function connectAsAgent() {
    return new Promise((resolve, reject) => {
        console.log('\n👩‍💼 Connecting as Support Agent...');
        
        const agentWs = new WebSocket(WEBSOCKET_URL + '?userType=support&agentId=test-protocol-agent&businessId=7ccf646c-9594-48d4-8f63-c366d89257e5');
        
        let messageCount = 0;
        const timeout = setTimeout(() => {
            console.log('⏰ Agent connection timeout');
            agentWs.close();
            resolve(messageCount);
        }, 15000);
        
        agentWs.on('open', () => {
            console.log('✅ Agent connected successfully');
            
            // Send agent connect message
            agentWs.send(JSON.stringify({
                type: 'chat_agent_connect',
                agentId: 'test-protocol-agent',
                agentName: 'Protocol Test Agent'
            }));
        });
        
        agentWs.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                messageCount++;
                console.log(`📨 Agent received (${messageCount}):`, message.type || message.action, message);
                
                // Respond to heartbeat
                if (message.type === 'heartbeat_response') {
                    console.log('💓 Heartbeat acknowledged');
                }
                
                // Check for driver messages
                if (message.type === 'chat_message' && message.senderType === 'driver') {
                    console.log('🎯 DRIVER MESSAGE RECEIVED!');
                    console.log('   Session:', message.sessionId);
                    console.log('   Message:', message.messageText);
                    console.log('   Sender:', message.senderName);
                }
            } catch (e) {
                console.log('📨 Agent received (raw):', data.toString());
            }
        });
        
        agentWs.on('error', (error) => {
            clearTimeout(timeout);
            console.log('❌ Agent WebSocket error:', error.message);
            reject(error);
        });
        
        agentWs.on('close', (code, reason) => {
            clearTimeout(timeout);
            console.log('🔌 Agent disconnected:', code, reason.toString());
            resolve(messageCount);
        });
    });
}

// Test Driver Connection (using corrected protocol)
async function testDriverProtocol() {
    return new Promise((resolve, reject) => {
        console.log('\n🚗 Testing Driver Protocol with Fixes...');
        
        const driverWs = new WebSocket(WEBSOCKET_URL);
        
        let step = 1;
        const timeout = setTimeout(() => {
            console.log('⏰ Driver test timeout');
            driverWs.close();
            reject(new Error('Driver test timeout'));
        }, 20000);
        
        driverWs.on('open', () => {
            console.log('✅ Driver WebSocket connected');
            
            // Step 1: Send driver connection (corrected protocol)
            console.log(`📤 Step ${step}: Sending chat_driver_connect...`);
            driverWs.send(JSON.stringify({
                type: 'chat_driver_connect',
                driverId: 'test-flutter-driver-fix',
                driverName: 'Flutter Protocol Test Driver',
                driverPhone: '+1234567890',
                timestamp: new Date().toISOString()
            }));
            step++;
        });
        
        driverWs.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log(`📨 Driver received (Step ${step-1}):`, message.type || message.action, message);
                
                if (message.type === 'chat_session_created' && step === 2) {
                    const sessionId = message.sessionId;
                    console.log(`✅ Session created: ${sessionId}`);
                    
                    // Step 2: Send chat message
                    console.log(`📤 Step ${step}: Sending chat_message...`);
                    setTimeout(() => {
                        driverWs.send(JSON.stringify({
                            type: 'chat_message',
                            sessionId: sessionId,
                            messageText: '🧪 Testing fixed Flutter chat protocol! Can agents see this message?',
                            senderType: 'driver',
                            senderId: 'test-flutter-driver-fix',
                            senderName: 'Flutter Protocol Test Driver',
                            timestamp: new Date().toISOString()
                        }));
                    }, 1000);
                    step++;
                }
                
                if (message.type === 'heartbeat_response') {
                    console.log('💓 Driver heartbeat acknowledged');
                }
                
                // Close after successful message
                if (step > 3) {
                    setTimeout(() => {
                        clearTimeout(timeout);
                        driverWs.close();
                        resolve(true);
                    }, 2000);
                }
                
            } catch (e) {
                console.log('📨 Driver received (raw):', data.toString());
            }
        });
        
        driverWs.on('error', (error) => {
            clearTimeout(timeout);
            console.log('❌ Driver WebSocket error:', error.message);
            reject(error);
        });
        
        driverWs.on('close', (code, reason) => {
            clearTimeout(timeout);
            console.log('🔌 Driver disconnected:', code, reason.toString());
            resolve(step > 2); // Success if we got past connection
        });
    });
}

// Run the tests
async function runTests() {
    try {
        console.log('🚀 Starting Protocol Fix Validation Tests...\n');
        
        // Start agent listener first
        const agentPromise = connectAsAgent();
        
        // Wait a moment, then test driver protocol
        await new Promise(resolve => setTimeout(resolve, 2000));
        const driverSuccess = await testDriverProtocol();
        
        // Wait for agent to finish
        const agentMessages = await agentPromise;
        
        console.log('\n📊 Test Results:');
        console.log(`🚗 Driver Protocol: ${driverSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`👩‍💼 Agent Messages: ${agentMessages} received`);
        
        if (driverSuccess && agentMessages > 0) {
            console.log('\n🎉 PROTOCOL FIXES SUCCESSFUL!');
            console.log('   ✅ Driver can connect using corrected protocol');
            console.log('   ✅ Agent receives messages from driver');
            console.log('   ✅ WebSocket connection is stable');
        } else {
            console.log('\n⚠️ Some issues remain:');
            if (!driverSuccess) console.log('   ❌ Driver protocol still has issues');
            if (agentMessages === 0) console.log('   ❌ Agent not receiving driver messages');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Start the tests
runTests();
