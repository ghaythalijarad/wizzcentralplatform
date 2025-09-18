#!/usr/bin/env node

/**
 * Test Support Agent WebSocket Connection
 * Verifies that the support center can receive live chat messages
 */

const WebSocket = require('ws');
const fetch = require('node-fetch');

console.log('🔌 Testing Support Agent WebSocket Connection');
console.log('============================================');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

let agentWS = null;
let connected = false;
let messagesReceived = [];

async function testSupportAgent() {
    try {
        console.log('👩‍💼 Connecting as Support Agent...');
        
        const agentUrl = `${WEBSOCKET_URL}?businessId=${BUSINESS_ID}&userType=support&agentId=test-support-agent&platform=web&appVersion=1.0.0`;
        console.log('📡 Agent URL:', agentUrl);
        
        agentWS = new WebSocket(agentUrl);
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 10000);
            
            agentWS.on('open', () => {
                clearTimeout(timeout);
                console.log('✅ Support Agent connected');
                connected = true;
                
                // Send a simple heartbeat/ping first to see what the server accepts
                const heartbeatMessage = {
                    action: 'ping',
                    timestamp: new Date().toISOString()
                };
                
                console.log('📤 Sending heartbeat first...');
                agentWS.send(JSON.stringify(heartbeatMessage));
                
                // Try different authentication approaches based on the handler
                setTimeout(() => {
                    // Try the approach used in the backend handlers for support agents
                    const authMessage = {
                        type: 'agent_online',
                        action: 'agent_status_update',
                        agentId: 'test-support-agent',
                        agentName: 'Test Support Agent',
                        status: 'online',
                        businessId: BUSINESS_ID,
                        timestamp: new Date().toISOString()
                    };
                    
                    console.log('📤 Sending agent online status...');
                    agentWS.send(JSON.stringify(authMessage));
                }, 1000);
                
                resolve();
            });
            
            agentWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    messagesReceived.push(message);
                    
                    console.log('📨 Agent received:', {
                        type: message.type,
                        action: message.action,
                        timestamp: new Date().toLocaleTimeString()
                    });
                    
                    // Log full message for errors and important types
                    if (['chat_message', 'chat_session_created', 'chat_driver_connect'].includes(message.type) || message.action === 'error') {
                        console.log('📋 Full message:', JSON.stringify(message, null, 2));
                    }
                    
                } catch (e) {
                    console.log('📨 Agent received (raw):', data.toString());
                }
            });
            
            agentWS.on('error', (error) => {
                clearTimeout(timeout);
                console.error('❌ Agent WebSocket error:', error.message);
                reject(error);
            });
            
            agentWS.on('close', (code, reason) => {
                console.log(`🔌 Agent connection closed: ${code} ${reason ? reason.toString() : ''}`);
                connected = false;
            });
        });
        
    } catch (error) {
        console.error('❌ Failed to test support agent:', error.message);
        throw error;
    }
}

async function simulateDriverMessage() {
    console.log('\\n🚗 Simulating driver message via direct WebSocket...');
    
    try {
        // Create a driver connection to send a message
        const driverUrl = `${WEBSOCKET_URL}?businessId=${BUSINESS_ID}&userType=driver&driverId=test_driver_789&platform=flutter&appVersion=1.0.0`;
        const driverWS = new WebSocket(driverUrl);
        
        return new Promise((resolve) => {
            driverWS.on('open', () => {
                console.log('🚗 Driver connected, sending test message...');
                
                // Send driver message
                const driverMessage = {
                    type: 'chat_message',
                    message: 'Hello from driver! I need support.',
                    sessionId: 'session_test_driver_789',
                    driverId: 'test_driver_789',
                    senderType: 'driver',
                    businessId: BUSINESS_ID,
                    timestamp: new Date().toISOString()
                };
                
                driverWS.send(JSON.stringify(driverMessage));
                console.log('📤 Driver message sent successfully');
                
                // Close driver connection after sending
                setTimeout(() => {
                    driverWS.close();
                    resolve(true);
                }, 1000);
            });
            
            driverWS.on('error', (error) => {
                console.error('❌ Driver connection error:', error.message);
                resolve(false);
            });
        });
        
    } catch (error) {
        console.error('❌ Failed to simulate driver message:', error.message);
        return false;
    }
}

async function runTest() {
    try {
        // Step 1: Connect as support agent
        await testSupportAgent();
        
        // Step 2: Wait a moment for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 3: Simulate driver message
        await simulateDriverMessage();
        
        // Step 4: Wait for message to be received
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 5: Report results
        console.log('\\n📊 Test Results:');
        console.log('================');
        console.log(`Messages received: ${messagesReceived.length}`);
        console.log(`Connection status: ${connected ? 'Connected' : 'Disconnected'}`);
        
        if (messagesReceived.length > 0) {
            console.log('\\n📨 Received message types:');
            messagesReceived.forEach((msg, index) => {
                console.log(`  ${index + 1}. ${msg.type || msg.action} - ${new Date(msg.timestamp || Date.now()).toLocaleTimeString()}`);
            });
        }
        
        // Close connection
        if (agentWS && connected) {
            agentWS.close();
        }
        
        console.log('\\n🎉 Support Agent WebSocket test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

runTest();
