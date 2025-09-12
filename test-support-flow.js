#!/usr/bin/env node

/**
 * Test Support Flow - Complete end-to-end testing
 * Tests the flow: HTTP Message → Chat Bridge → WebSocket → Support Interface
 */

import https from 'https';
import WebSocket from 'ws';

console.log('🧪 WizzCentral Support Flow Test');
console.log('================================');

const CHAT_BRIDGE_URL = 'https://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev/chat-bridge';
const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

let supportAgent = null;
let messageReceived = false;

class SupportFlowTest {
    constructor() {
        this.testResults = {
            agentConnection: false,
            messageDelivery: false,
            endToEndFlow: false
        };
    }

    async runTest() {
        try {
            console.log('\n📋 Step 1: Connect Support Agent to WebSocket...');
            await this.connectSupportAgent();
            
            console.log('\n📋 Step 2: Send HTTP message via Chat Bridge...');
            await this.sendHttpMessage();
            
            console.log('\n📋 Step 3: Wait for message to reach support agent...');
            await this.waitForMessage();
            
            console.log('\n📋 Step 4: Display results...');
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.displayResults();
        } finally {
            if (supportAgent) {
                supportAgent.close();
            }
        }
    }

    connectSupportAgent() {
        return new Promise((resolve, reject) => {
            const agentUrl = `${WEBSOCKET_URL}?businessId=test&userType=support&agentId=test-agent-001&platform=web`;
            console.log(`🔌 Connecting to: ${agentUrl}`);
            
            supportAgent = new WebSocket(agentUrl);
            
            supportAgent.on('open', () => {
                console.log('✅ Support agent connected successfully');
                this.testResults.agentConnection = true;
                resolve();
            });
            
            supportAgent.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    console.log('📨 Support agent received message:', message);
                    
                    if (message.type === 'chat_message' && message.senderType === 'driver') {
                        console.log('✅ Driver message received by support agent!');
                        this.testResults.messageDelivery = true;
                        messageReceived = true;
                    }
                } catch (e) {
                    console.log('📨 Support agent received raw data:', data.toString());
                }
            });
            
            supportAgent.on('error', (error) => {
                console.error('❌ Support agent connection error:', error.message);
                reject(error);
            });
            
            supportAgent.on('close', (code, reason) => {
                console.log(`🔌 Support agent disconnected. Code: ${code}, Reason: ${reason || 'Unknown'}`);
            });
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!this.testResults.agentConnection) {
                    reject(new Error('Support agent connection timeout'));
                }
            }, 10000);
        });
    }

    sendHttpMessage() {
        return new Promise((resolve, reject) => {
            const messageData = {
                senderId: 'test-driver-001',
                senderName: 'Test Driver',
                message: 'Test message from HTTP bridge to support agent',
                timestamp: new Date().toISOString()
            };

            const postData = JSON.stringify(messageData);
            const url = new URL(CHAT_BRIDGE_URL);

            const options = {
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            console.log('📤 Sending HTTP message:', messageData);
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (res.statusCode === 200 && response.success) {
                            console.log('✅ HTTP message sent successfully:', response);
                            resolve();
                        } else {
                            console.log('⚠️ HTTP message response:', response);
                            resolve(); // Continue test even if there are warnings
                        }
                    } catch (e) {
                        console.log('📨 HTTP response (raw):', data);
                        resolve();
                    }
                });
            });

            req.on('error', (error) => {
                console.error('❌ HTTP request error:', error.message);
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }

    waitForMessage() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (messageReceived) {
                    this.testResults.endToEndFlow = true;
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500);

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 10000);
        });
    }

    displayResults() {
        console.log('\n🎯 SUPPORT FLOW TEST RESULTS');
        console.log('============================');
        console.log(`🔌 Support Agent Connection: ${this.testResults.agentConnection ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📤 HTTP Message Delivery:    ${this.testResults.messageDelivery ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`🎯 End-to-End Flow:          ${this.testResults.endToEndFlow ? '✅ PASS' : '❌ FAIL'}`);
        
        const passedTests = Object.values(this.testResults).filter(Boolean).length;
        const totalTests = Object.keys(this.testResults).length;
        
        console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! Support flow is working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Check the configuration and try again.');
        }
    }
}

// Run the test
const test = new SupportFlowTest();
test.runTest().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});
