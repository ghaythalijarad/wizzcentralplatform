#!/usr/bin/env node

/**
 * Complete End-to-End LiveChat Test
 * 1. Register agent using correct WebSocket format
 * 2. Send message via HTTP API  
 * 3. Check if message is received by agent
 */

const WebSocket = require('ws');
const https = require('https');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const API_ENDPOINT = 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send';
const API_KEY = 'wizz-central-api-key-2024';

let agentWs = null;
let agentConnected = false;
let agentSessionId = null;
let messagesReceived = [];

async function connectAgent() {
    return new Promise((resolve, reject) => {
        console.log('🔌 Connecting agent to WebSocket...');
        
        agentWs = new WebSocket(WEBSOCKET_URL);
        
        agentWs.on('open', () => {
            console.log('✅ Agent WebSocket connected');
            
            // Register agent using the working chat_init action
            const agentRegistration = {
                action: 'chat_init',
                userType: 'agent',
                agentId: 'e2e_test_agent_' + Date.now(),
                agentName: 'E2E Test Support Agent',
                businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
            };
            
            console.log('📤 Registering agent:', JSON.stringify(agentRegistration, null, 2));
            agentWs.send(JSON.stringify(agentRegistration));
        });
        
        agentWs.on('message', (data) => {
            const timestamp = new Date().toISOString();
            const message = data.toString();
            messagesReceived.push({ timestamp, message });
            
            console.log(`\\n📨 [${timestamp}] Agent received:`);
            console.log(message);
            
            try {
                const parsed = JSON.parse(message);
                
                if (parsed.action === 'session_created') {
                    agentSessionId = parsed.sessionId;
                    agentConnected = true;
                    console.log('🎯 AGENT SESSION CREATED!');
                    console.log('   Session ID:', agentSessionId);
                    resolve(true);
                } else if (parsed.action === 'driver_message' || parsed.type === 'driver_message') {
                    console.log('🚗 DRIVER MESSAGE RECEIVED BY AGENT!');
                    console.log('   Session:', parsed.sessionId);
                    console.log('   Message:', parsed.messageText || parsed.message);
                    console.log('   From:', parsed.senderName);
                } else if (parsed.message && parsed.message.includes('driver')) {
                    console.log('🚗 POSSIBLE DRIVER MESSAGE DETECTED!');
                }
            } catch (e) {
                console.log('   Raw message (not JSON)');
            }
        });
        
        agentWs.on('error', (error) => {
            console.log('❌ Agent WebSocket error:', error.message);
            reject(error);
        });
        
        agentWs.on('close', (code, reason) => {
            console.log(`🔌 Agent WebSocket closed: ${code} - ${reason}`);
            agentConnected = false;
        });
    });
}

async function sendDriverMessage() {
    console.log('\\n📤 Sending driver message via HTTP API...');
    
    const testMessage = {
        participantToken: 'e2e_driver_session_' + Date.now(),
        message: 'E2E TEST: Hello from driver! This should reach the agent via WebSocket.',
        contentType: 'text/plain',
        metadata: {
            senderId: 'e2e_test_driver',
            senderName: 'E2E Test Driver',
            senderType: 'driver',
            platform: 'e2e_test',
            businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
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
                console.log('📡 API Response Status:', res.statusCode);
                console.log('📡 API Response:', data);
                
                try {
                    const response = JSON.parse(data);
                    resolve({
                        success: res.statusCode === 200,
                        status: res.statusCode,
                        response: response,
                        testMessage
                    });
                } catch (e) {
                    resolve({
                        success: res.statusCode === 200,
                        status: res.statusCode,
                        response: data,
                        testMessage
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ API Error:', error.message);
            resolve({ success: false, error: error.message });
        });
        
        req.write(postData);
        req.end();
    });
}

async function runCompleteTest() {
    console.log('🧪 COMPLETE END-TO-END LIVE CHAT TEST');
    console.log('=' .repeat(60));
    
    try {
        // Step 1: Connect agent
        console.log('\\n1️⃣ STEP 1: Agent Registration');
        console.log('-'.repeat(30));
        await connectAgent();
        
        // Wait for connection to stabilize  
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 2: Send driver message
        console.log('\\n2️⃣ STEP 2: Driver Message via API');
        console.log('-'.repeat(30));
        const apiResult = await sendDriverMessage();
        
        if (!apiResult.success) {
            throw new Error('API call failed: ' + apiResult.error);
        }
        
        console.log('\\n📊 API Broadcast Results:', JSON.stringify(apiResult.response.broadcastResults, null, 2));
        
        // Step 3: Monitor for message delivery
        console.log('\\n3️⃣ STEP 3: Monitoring for Message Delivery');
        console.log('-'.repeat(30));
        console.log('⏱️  Waiting 10 seconds for message delivery...');
        
        const initialMessageCount = messagesReceived.length;
        let messageReceived = false;
        
        for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const newMessages = messagesReceived.length - initialMessageCount;
            process.stdout.write(`\\r⏱️  ${i + 1}/10 seconds - New messages: ${newMessages}  `);
            
            // Check for driver message
            const recentMessages = messagesReceived.slice(initialMessageCount);
            for (const msg of recentMessages) {
                if (msg.message.toLowerCase().includes('driver') || 
                    msg.message.includes('e2e_test_driver') ||
                    msg.message.includes('E2E TEST')) {
                    messageReceived = true;
                    break;
                }
            }
        }
        
        console.log('\\n\\n📋 FINAL RESULTS:');
        console.log('=' .repeat(40));
        console.log('Agent Connected:', agentConnected ? '✅ SUCCESS' : '❌ FAILED');
        console.log('Agent Session ID:', agentSessionId || 'None');
        console.log('API Call Success:', apiResult.success ? '✅ SUCCESS' : '❌ FAILED');
        console.log('API Broadcast Count:', apiResult.response?.broadcastResults?.total || 0);
        console.log('Message Delivered to Agent:', messageReceived ? '✅ SUCCESS' : '❌ FAILED');
        console.log('Total Agent Messages:', messagesReceived.length);
        
        if (apiResult.response?.broadcastResults?.total === 0) {
            console.log('\\n⚠️  ISSUE: API shows 0 agents to broadcast to');
            console.log('This means the agent WebSocket connection is not being registered properly for broadcasting.');
        }
        
        if (messageReceived) {
            console.log('\\n🎉 SUCCESS: End-to-end message delivery working!');
        } else {
            console.log('\\n❌ FAILURE: Message not delivered to agent');
            console.log('\\n🔍 Recent agent messages:');
            messagesReceived.slice(-3).forEach((msg, i) => {
                console.log(`   ${i + 1}. [${msg.timestamp}] ${msg.message.substring(0, 100)}...`);
            });
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    } finally {
        if (agentWs) {
            agentWs.close();
        }
        console.log('\\n✅ Test completed');
    }
}

// Run the complete test
runCompleteTest().catch(console.error);
