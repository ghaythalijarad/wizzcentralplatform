#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests the complete live chat integration after AWS deployment
 */

import https from 'https';
import WebSocket from 'ws';

console.log('🚀 WizzCentral Live Chat - Deployment Verification');
console.log('================================================');
console.log('');

class DeploymentVerification {
    constructor() {
        this.results = {
            chatBridgeEndpoint: false,
            webSocketConnection: false,
            agentRegistration: false,
            messageDelivery: false,
            endToEndFlow: false
        };
        this.ws = null;
        this.testStartTime = Date.now();
    }

    async runVerification() {
        try {
            console.log('📋 Step 1: Testing Chat Bridge Endpoint...');
            await this.testChatBridge();
            
            console.log('\n📋 Step 2: Testing WebSocket Connection...');
            await this.testWebSocketConnection();
            
            console.log('\n📋 Step 3: Testing Agent Registration...');
            await this.testAgentRegistration();
            
            console.log('\n📋 Step 4: Testing Message Delivery...');
            await this.testMessageDelivery();
            
            console.log('\n📋 Step 5: Testing End-to-End Flow...');
            await this.testEndToEndFlow();
            
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
            this.displayResults();
            process.exit(1);
        } finally {
            if (this.ws) {
                this.ws.close();
            }
        }
    }

    async testChatBridge() {
        return new Promise((resolve, reject) => {
            const testData = {
                participantToken: 'verification_test',
                message: 'Deployment verification test message',
                metadata: {
                    senderId: 'verification_test_' + Date.now(),
                    senderType: 'driver',
                    senderName: 'Verification Test',
                    platform: 'flutter',
                    source: 'http_api'
                }
            };

            const postData = JSON.stringify(testData);
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
                    try {
                        const response = JSON.parse(data);
                        if (res.statusCode === 200 && response.success) {
                            console.log('   ✅ Chat bridge endpoint responding correctly');
                            console.log('   📋 Session ID:', response.sessionId);
                            this.results.chatBridgeEndpoint = true;
                            resolve();
                        } else {
                            throw new Error(`HTTP ${res.statusCode}: ${response.error || 'Unknown error'}`);
                        }
                    } catch (e) {
                        reject(new Error(`Parse error: ${e.message}, Data: ${data}`));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => reject(new Error('Request timeout')));
            req.write(postData);
            req.end();
        });
    }

    async testWebSocketConnection() {
        return new Promise((resolve, reject) => {
            const wsUrl = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev' +
                         '?userType=support&agentId=verification-agent&businessId=7ccf646c-9594-48d4-8f63-c366d89257e5';
            
            this.ws = new WebSocket(wsUrl);
            
            const timeout = setTimeout(() => {
                reject(new Error('WebSocket connection timeout'));
            }, 10000);

            this.ws.on('open', () => {
                clearTimeout(timeout);
                console.log('   ✅ WebSocket connection established');
                this.results.webSocketConnection = true;
                resolve();
            });

            this.ws.on('error', (error) => {
                clearTimeout(timeout);
                reject(new Error(`WebSocket error: ${error.message}`));
            });
        });
    }

    async testAgentRegistration() {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const connectMessage = {
                type: 'chat_agent_connect',
                agentId: 'verification-agent-' + Date.now(),
                agentName: 'Verification Agent',
                timestamp: new Date().toISOString()
            };

            let agentConnectedReceived = false;
            
            const messageHandler = (data) => {
                try {
                    const message = JSON.parse(data);
                    if (message.type === 'agent_connected') {
                        console.log('   ✅ Agent registration successful');
                        this.results.agentRegistration = true;
                        agentConnectedReceived = true;
                        this.ws.off('message', messageHandler);
                        resolve();
                    } else if (message.type === 'active_sessions') {
                        console.log(`   📋 Active sessions received: ${message.sessions?.length || 0} sessions`);
                    }
                } catch (e) {
                    // Ignore parse errors for this test
                }
            };

            this.ws.on('message', messageHandler);
            
            console.log('   📤 Sending agent connect message...');
            this.ws.send(JSON.stringify(connectMessage));

            // Timeout after 8 seconds
            setTimeout(() => {
                if (!agentConnectedReceived) {
                    this.ws.off('message', messageHandler);
                    reject(new Error('Agent registration timeout'));
                }
            }, 8000);
        });
    }

    async testMessageDelivery() {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            let messageReceived = false;
            
            const messageHandler = (data) => {
                try {
                    const message = JSON.parse(data);
                    if (message.type === 'chat_message') {
                        console.log('   ✅ Chat message received via WebSocket!');
                        console.log('   📨 Message:', message.message?.text || message.messageText || 'No text');
                        console.log('   📋 Session:', message.sessionId);
                        this.results.messageDelivery = true;
                        messageReceived = true;
                        this.ws.off('message', messageHandler);
                        resolve();
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            };

            this.ws.on('message', messageHandler);

            // Send test message via HTTP bridge
            console.log('   📤 Sending test message via HTTP bridge...');
            
            const testData = {
                participantToken: 'delivery_test',
                message: '🎯 MESSAGE DELIVERY TEST: This message tests the complete flow from HTTP bridge to WebSocket delivery!',
                metadata: {
                    senderId: 'unknown_driver_delivery_test_' + Date.now(),
                    senderType: 'driver',
                    senderName: 'Delivery Test Driver',
                    platform: 'flutter',
                    source: 'http_api',
                    timestamp: new Date().toISOString()
                }
            };

            const postData = JSON.stringify(testData);
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
                    try {
                        const response = JSON.parse(data);
                        console.log('   📋 HTTP Response:', response.success ? 'Success' : 'Failed');
                        if (response.sessionId) {
                            console.log('   📋 Session created:', response.sessionId);
                        }
                    } catch (e) {
                        console.log('   📄 HTTP Response parse error');
                    }
                });
            });

            req.on('error', (error) => {
                console.log('   ❌ HTTP request failed:', error.message);
            });

            req.write(postData);
            req.end();

            // Wait up to 15 seconds for message delivery
            setTimeout(() => {
                if (!messageReceived) {
                    this.ws.off('message', messageHandler);
                    reject(new Error('Message delivery timeout - message not received via WebSocket'));
                }
            }, 15000);
        });
    }

    async testEndToEndFlow() {
        // If message delivery worked, end-to-end flow is working
        if (this.results.messageDelivery) {
            console.log('   ✅ End-to-end flow verified!');
            this.results.endToEndFlow = true;
        } else {
            throw new Error('End-to-end flow failed - message delivery did not work');
        }
    }

    displayResults() {
        const testDuration = ((Date.now() - this.testStartTime) / 1000).toFixed(1);
        
        console.log('\n📊 DEPLOYMENT VERIFICATION RESULTS');
        console.log('=====================================');
        console.log(`⏱️  Test Duration: ${testDuration} seconds`);
        console.log('');
        console.log(`🌐 Chat Bridge Endpoint:     ${this.results.chatBridgeEndpoint ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`🔌 WebSocket Connection:     ${this.results.webSocketConnection ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`👤 Agent Registration:       ${this.results.agentRegistration ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`💬 Message Delivery:         ${this.results.messageDelivery ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`🎯 End-to-End Flow:          ${this.results.endToEndFlow ? '✅ PASS' : '❌ FAIL'}`);
        console.log('');
        
        const passedTests = Object.values(this.results).filter(Boolean).length;
        const totalTests = Object.keys(this.results).length;
        
        if (passedTests === totalTests) {
            console.log('🎉 SUCCESS! All tests passed - Live Chat integration is working!');
            console.log('');
            console.log('✅ The deployment is successful and ready for production use.');
            console.log('📱 You can now test with the Flutter WizzDriver app.');
            console.log('💻 Support agents can use the WizzCentral Support interface.');
            console.log('');
        } else {
            console.log(`⚠️  ${passedTests}/${totalTests} tests passed - Some issues detected.`);
            console.log('');
            console.log('🔧 Check the failed tests above and review the deployment.');
        }
    }
}

// Run the verification
const verification = new DeploymentVerification();
verification.runVerification();
