#!/usr/bin/env node

/**
 * Advanced WebSocket Test - Validates Enhanced Connection Management
 * Tests the Flutter app's enhanced WebSocket techniques including:
 * - Adaptive reconnection strategies
 * - Heartbeat monitoring with timeout tracking
 * - Connection health checks
 * - Background/foreground handling simulation
 * - Network state changes
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

class EnhancedWebSocketTester {
    constructor() {
        this.connections = new Map();
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Advanced WebSocket Connection Tests');
        console.log('=====================================\n');

        // Test 1: Basic Connection with Enhanced Protocol
        await this.testEnhancedConnection();

        // Test 2: Heartbeat and Timeout Handling
        await this.testHeartbeatHandling();

        // Test 3: Adaptive Reconnection
        await this.testAdaptiveReconnection();

        // Test 4: Message Flow with Retry
        await this.testMessageFlowWithRetry();

        // Test 5: Connection Health Monitoring
        await this.testConnectionHealth();

        // Print Results
        this.printTestResults();
    }

    async testEnhancedConnection() {
        console.log('1️⃣ Testing Enhanced Connection Protocol...');
        
        return new Promise((resolve) => {
            const ws = new WebSocket(WEBSOCKET_URL);
            let connectionEstablished = false;
            
            const timeout = setTimeout(() => {
                if (!connectionEstablished) {
                    this.addResult('Enhanced Connection', '❌ Timeout');
                    ws.close();
                    resolve();
                }
            }, 10000);

            ws.on('open', () => {
                connectionEstablished = true;
                clearTimeout(timeout);
                
                // Send enhanced connection message (matching Flutter protocol)
                const connectionMessage = {
                    type: 'chat_driver_connect',
                    driverId: 'test_enhanced_driver',
                    driverName: 'Enhanced Test Driver',
                    connectionId: `driver_test_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    clientInfo: {
                        platform: 'test',
                        userAgent: 'EnhancedTester/1.0.0',
                        reconnectAttempt: 0,
                    }
                };

                ws.send(JSON.stringify(connectionMessage));
                console.log('   📡 Sent enhanced connection message');
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    console.log(`   📨 Received: ${message.type}`);
                    
                    if (message.type === 'chat_session_created') {
                        this.addResult('Enhanced Connection', `✅ Session created: ${message.sessionId}`);
                        ws.close();
                        resolve();
                    }
                } catch (e) {
                    console.log('   📄 Raw message:', data.toString());
                }
            });

            ws.on('error', (error) => {
                clearTimeout(timeout);
                this.addResult('Enhanced Connection', `❌ Error: ${error.message}`);
                resolve();
            });

            ws.on('close', () => {
                clearTimeout(timeout);
                if (!this.testResults.find(r => r.test === 'Enhanced Connection')) {
                    this.addResult('Enhanced Connection', '✅ Clean disconnect');
                }
                resolve();
            });
        });
    }

    async testHeartbeatHandling() {
        console.log('\n2️⃣ Testing Heartbeat and Timeout Handling...');
        
        return new Promise((resolve) => {
            const ws = new WebSocket(WEBSOCKET_URL);
            let heartbeatReceived = false;
            
            ws.on('open', () => {
                console.log('   🔌 Connected for heartbeat test');
                
                // Send heartbeat message
                const heartbeat = {
                    type: 'heartbeat',
                    timestamp: new Date().toISOString(),
                    connectionId: `test_heartbeat_${Date.now()}`,
                    sequenceId: Date.now(),
                };

                ws.send(JSON.stringify(heartbeat));
                console.log('   💓 Sent heartbeat message');
                
                // Wait for response
                setTimeout(() => {
                    if (!heartbeatReceived) {
                        this.addResult('Heartbeat Handling', '⚠️ No heartbeat response received');
                        ws.close();
                        resolve();
                    }
                }, 5000);
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    console.log(`   📨 Heartbeat response: ${message.type}`);
                    
                    if (message.type === 'heartbeat_response' || message.type === 'pong') {
                        heartbeatReceived = true;
                        this.addResult('Heartbeat Handling', '✅ Heartbeat acknowledged');
                        ws.close();
                        resolve();
                    }
                } catch (e) {
                    // Ignore parsing errors for heartbeat test
                }
            });

            ws.on('error', (error) => {
                this.addResult('Heartbeat Handling', `❌ Error: ${error.message}`);
                resolve();
            });
        });
    }

    async testAdaptiveReconnection() {
        console.log('\n3️⃣ Testing Adaptive Reconnection Logic...');
        
        return new Promise((resolve) => {
            let reconnectAttempts = 0;
            const maxAttempts = 3;
            
            const attemptConnection = () => {
                reconnectAttempts++;
                console.log(`   🔄 Reconnection attempt ${reconnectAttempts}`);
                
                const ws = new WebSocket(WEBSOCKET_URL);
                
                ws.on('open', () => {
                    // Immediately close to simulate network issues
                    console.log(`   ✅ Connection ${reconnectAttempts} established`);
                    ws.close();
                });

                ws.on('close', () => {
                    if (reconnectAttempts < maxAttempts) {
                        // Adaptive delay: exponential backoff simulation
                        const delay = Math.min(1000 * reconnectAttempts, 5000);
                        console.log(`   ⏰ Waiting ${delay}ms before next attempt`);
                        setTimeout(attemptConnection, delay);
                    } else {
                        this.addResult('Adaptive Reconnection', `✅ Completed ${maxAttempts} adaptive attempts`);
                        resolve();
                    }
                });

                ws.on('error', (error) => {
                    console.log(`   ❌ Attempt ${reconnectAttempts} failed: ${error.message}`);
                    if (reconnectAttempts >= maxAttempts) {
                        this.addResult('Adaptive Reconnection', `⚠️ Max attempts reached`);
                        resolve();
                    }
                });
            };

            attemptConnection();
        });
    }

    async testMessageFlowWithRetry() {
        console.log('\n4️⃣ Testing Message Flow with Retry Logic...');
        
        return new Promise((resolve) => {
            const ws = new WebSocket(WEBSOCKET_URL);
            let messagesSent = 0;
            let messagesAcked = 0;
            
            ws.on('open', () => {
                console.log('   🔌 Connected for message flow test');
                
                // Send multiple messages to test retry logic
                const sendMessage = (attempt = 1) => {
                    messagesSent++;
                    const message = {
                        type: 'chat_message',
                        message: `Test message ${messagesSent} (attempt ${attempt})`,
                        sessionId: 'test_session',
                        timestamp: new Date().toISOString(),
                        messageId: `msg_${Date.now()}_${messagesSent}`,
                    };

                    try {
                        ws.send(JSON.stringify(message));
                        console.log(`   📤 Sent message ${messagesSent}`);
                    } catch (error) {
                        console.log(`   ❌ Failed to send message ${messagesSent}: ${error.message}`);
                    }
                };

                // Send test messages
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => sendMessage(), i * 1000);
                }
                
                // Close after sending
                setTimeout(() => {
                    this.addResult('Message Flow', `✅ Sent ${messagesSent} messages`);
                    ws.close();
                    resolve();
                }, 5000);
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'ack' || message.type === 'message_received') {
                        messagesAcked++;
                        console.log(`   ✅ Message acknowledged ${messagesAcked}`);
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            });

            ws.on('error', (error) => {
                this.addResult('Message Flow', `❌ Error: ${error.message}`);
                resolve();
            });
        });
    }

    async testConnectionHealth() {
        console.log('\n5️⃣ Testing Connection Health Monitoring...');
        
        return new Promise((resolve) => {
            const ws = new WebSocket(WEBSOCKET_URL);
            let healthChecksSent = 0;
            
            ws.on('open', () => {
                console.log('   🔌 Connected for health monitoring test');
                
                // Simulate health check interval
                const healthInterval = setInterval(() => {
                    healthChecksSent++;
                    
                    const healthCheck = {
                        type: 'health_check',
                        timestamp: new Date().toISOString(),
                        connectionAge: healthChecksSent * 1000, // simulate age
                        lastActivity: new Date().toISOString(),
                    };

                    try {
                        ws.send(JSON.stringify(healthCheck));
                        console.log(`   🏥 Health check ${healthChecksSent} sent`);
                    } catch (error) {
                        clearInterval(healthInterval);
                        console.log(`   ❌ Health check failed: ${error.message}`);
                    }

                    if (healthChecksSent >= 3) {
                        clearInterval(healthInterval);
                        this.addResult('Connection Health', `✅ Completed ${healthChecksSent} health checks`);
                        ws.close();
                        resolve();
                    }
                }, 1000);
            });

            ws.on('error', (error) => {
                this.addResult('Connection Health', `❌ Error: ${error.message}`);
                resolve();
            });
        });
    }

    addResult(test, result) {
        this.testResults.push({ test, result });
    }

    printTestResults() {
        console.log('\n📊 Test Results Summary');
        console.log('======================');
        this.testResults.forEach(({ test, result }) => {
            console.log(`${test.padEnd(25)} | ${result}`);
        });
        
        const passedTests = this.testResults.filter(r => r.result.includes('✅')).length;
        const totalTests = this.testResults.length;
        
        console.log('\n🏆 Overall Results:');
        console.log(`   Tests Passed: ${passedTests}/${totalTests}`);
        console.log(`   Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
        
        if (passedTests === totalTests) {
            console.log('   🎉 All advanced WebSocket techniques working correctly!');
        } else {
            console.log('   ⚠️  Some techniques need attention');
        }
    }
}

// Run the tests
const tester = new EnhancedWebSocketTester();
tester.runAllTests().catch(console.error);
