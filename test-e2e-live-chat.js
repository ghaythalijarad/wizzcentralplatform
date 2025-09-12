#!/usr/bin/env node

/**
 * Comprehensive End-to-End Live Chat Test
 * Tests the complete flow from Flutter message to Support Interface
 */

const https = require('https');
const WebSocket = require('ws');

class LiveChatE2ETest {
    constructor() {
        this.agentWS = null;
        this.connected = false;
        this.sessionsReceived = [];
        this.messagesReceived = [];
        this.testResults = {
            agentConnection: false,
            messageDelivery: false,
            sessionCreation: false
        };
    }

    async runTest() {
        console.log('🧪 Starting End-to-End Live Chat Test...');
        console.log('====================================\n');

        try {
            // Step 1: Connect as support agent
            await this.connectAsAgent();
            
            // Step 2: Wait for initial active sessions
            await this.waitForConnection();
            
            // Step 3: Send test message from driver
            await this.sendDriverMessage();
            
            // Step 4: Wait for message delivery
            await this.waitForMessage();
            
            // Step 5: Display results
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        } finally {
            if (this.agentWS) {
                this.agentWS.close();
            }
            process.exit(this.testResults.messageDelivery ? 0 : 1);
        }
    }

    async connectAsAgent() {
        console.log('🔌 Step 1: Connecting as support agent...');
        
        const wsUrl = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev' +
                     '?userType=support&agentId=e2e-test-agent&businessId=7ccf646c-9594-48d4-8f63-c366d89257e5';
        
        console.log('📡 WebSocket URL:', wsUrl);
        
        return new Promise((resolve, reject) => {
            this.agentWS = new WebSocket(wsUrl);
            
            this.agentWS.on('open', () => {
                console.log('✅ WebSocket connected');
                this.connected = true;
                
                // Send agent connect message
                const connectMsg = {
                    type: 'chat_agent_connect',
                    agentId: 'e2e-test-agent-' + Date.now(),
                    agentName: 'E2E Test Agent',
                    timestamp: new Date().toISOString()
                };
                
                console.log('📤 Sending agent connect:', connectMsg.type);
                this.agentWS.send(JSON.stringify(connectMsg));
                
                this.testResults.agentConnection = true;
                resolve();
            });
            
            this.agentWS.on('message', (data) => {
                this.handleAgentMessage(data);
            });
            
            this.agentWS.on('error', (error) => {
                console.error('❌ WebSocket error:', error.message);
                reject(error);
            });
            
            this.agentWS.on('close', (code, reason) => {
                console.log(`🔌 WebSocket closed: ${code} ${reason}`);
                this.connected = false;
            });
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!this.connected) {
                    reject(new Error('WebSocket connection timeout'));
                }
            }, 10000);
        });
    }

    handleAgentMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log(`📨 Received: ${message.type}`);
            
            switch (message.type) {
                case 'agent_connected':
                    console.log('✅ Agent successfully connected');
                    break;
                    
                case 'active_sessions':
                    console.log(`📋 Active sessions: ${message.sessions?.length || 0}`);
                    this.sessionsReceived.push(...(message.sessions || []));
                    break;
                    
                case 'new_chat_session':
                    console.log(`✨ New session: ${message.sessionId}`);
                    this.sessionsReceived.push(message);
                    this.testResults.sessionCreation = true;
                    break;
                    
                case 'chat_message':
                    console.log('💬 CHAT MESSAGE RECEIVED!');
                    console.log(`   Session: ${message.sessionId}`);
                    console.log(`   Message: ${message.message?.text || message.messageText}`);
                    console.log('   🎉 SUCCESS! End-to-end flow is working!');
                    this.messagesReceived.push(message);
                    this.testResults.messageDelivery = true;
                    break;
                    
                case 'heartbeat_response':
                    // Ignore heartbeat responses
                    break;
                    
                default:
                    console.log(`📄 Other message: ${message.type}`, Object.keys(message));
            }
        } catch (e) {
            console.log('📄 Raw message:', data.toString().substring(0, 100) + '...');
        }
    }

    async waitForConnection() {
        console.log('\n🕐 Step 2: Waiting for agent connection to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    async sendDriverMessage() {
        console.log('\n🚗 Step 3: Sending test message from driver...');
        
        const driverMessage = {
            participantToken: 'e2e_test_driver',
            message: `🚗 E2E TEST MESSAGE: This is a comprehensive test message sent at ${new Date().toLocaleTimeString()}. If you can see this in the support interface, the end-to-end integration is working perfectly!`,
            contentType: 'text/plain',
            metadata: {
                senderId: 'e2e_test_driver_' + Date.now(),
                senderType: 'driver',
                senderName: 'E2E Test Driver',
                platform: 'flutter',
                source: 'http_api',
                timestamp: new Date().toISOString()
            }
        };
        
        console.log('📱 Driver ID:', driverMessage.metadata.senderId);
        console.log('📨 Message:', driverMessage.message.substring(0, 50) + '...');
        
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(driverMessage);
            
            const options = {
                hostname: 'yt0j2cdbe5.execute-api.us-east-1.amazonaws.com',
                port: 443,
                path: '/dev/chat/send',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log(`📊 HTTP Response: ${res.statusCode}`);
                    try {
                        const response = JSON.parse(data);
                        console.log('📄 Response:', response);
                        if (response.success) {
                            console.log('✅ Message sent successfully');
                            console.log('📋 Session ID:', response.sessionId);
                            resolve(response);
                        } else {
                            reject(new Error(response.error || 'Message failed'));
                        }
                    } catch (e) {
                        console.log('📄 Raw response:', data);
                        reject(e);
                    }
                });
            });
            
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    async waitForMessage() {
        console.log('\n⏰ Step 4: Waiting for message delivery (10 seconds)...');
        
        return new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (this.testResults.messageDelivery) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500);
            
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 10000);
        });
    }

    displayResults() {
        console.log('\n📊 TEST RESULTS');
        console.log('================');
        console.log(`🔌 Agent Connection: ${this.testResults.agentConnection ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📋 Session Creation: ${this.testResults.sessionCreation ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`💬 Message Delivery: ${this.testResults.messageDelivery ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📨 Messages Received: ${this.messagesReceived.length}`);
        console.log(`📋 Sessions Seen: ${this.sessionsReceived.length}`);
        
        if (this.testResults.messageDelivery) {
            console.log('\n🎉 SUCCESS! End-to-end live chat integration is working!');
            console.log('👀 Check your WizzCentral Support interface - you should see the test message!');
        } else {
            console.log('\n⚠️ Message delivery failed. Check the logs above for issues.');
        }
    }
}

// Run the test
const test = new LiveChatE2ETest();
test.runTest();
