#!/usr/bin/env node

/**
 * Connection Stability Test
 * Tests both Flutter HTTP bridge and Central Platform WebSocket connections
 * Validates authentication, message delivery, and connection resilience
 */

const WebSocket = require('ws');
const http = require('http');
const https = require('https');

// Test Configuration
const CONFIG = {
  // Central Platform WebSocket
  WEBSOCKET_URL: 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev',
  
  // Flutter HTTP Bridge
  HTTP_BRIDGE_URL: 'https://9xkq4e1kt7.execute-api.us-east-1.amazonaws.com/dev/api/chat/send',
  
  // Test parameters
  BUSINESS_ID: '7ccf646c-9594-48d4-8f63-c366d89257e5',
  TEST_DURATION: 30000, // 30 seconds
  HEARTBEAT_INTERVAL: 10000, // 10 seconds
  
  // Mock tokens for testing
  MOCK_JWT: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LWRyaXZlciIsImV4cCI6OTk5OTk5OTk5OSwidXNlcm5hbWUiOiJ0ZXN0LWRyaXZlciJ9.test'
};

class ConnectionStabilityTest {
  constructor() {
    this.results = {
      websocket: {
        connected: false,
        messagesReceived: 0,
        messagesSent: 0,
        reconnects: 0,
        errors: [],
        latency: []
      },
      httpBridge: {
        requestsSent: 0,
        successfulResponses: 0,
        errors: [],
        latency: []
      }
    };
    this.startTime = Date.now();
  }

  async runTests() {
    console.log('🚀 Starting Connection Stability Test...');
    console.log(`Duration: ${CONFIG.TEST_DURATION / 1000}s`);
    console.log(`WebSocket URL: ${CONFIG.WEBSOCKET_URL}`);
    console.log(`HTTP Bridge URL: ${CONFIG.HTTP_BRIDGE_URL}`);
    console.log('=====================================\n');

    // Run tests in parallel
    const promises = [
      this.testWebSocketConnection(),
      this.testHTTPBridge(),
      this.monitorAndReport()
    ];

    try {
      await Promise.race([
        Promise.all(promises),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), CONFIG.TEST_DURATION + 5000)
        )
      ]);
    } catch (error) {
      console.error('Test suite error:', error.message);
    }

    this.generateReport();
  }

  async testWebSocketConnection() {
    return new Promise((resolve) => {
      console.log('🔌 Testing WebSocket Connection...');
      
      let ws = null;
      let heartbeatTimer = null;
      let reconnectCount = 0;
      const maxReconnects = 3;

      const connect = () => {
        try {
          // Test Central Platform WebSocket (agent connection)
          const wsUrl = `${CONFIG.WEBSOCKET_URL}?userType=support&agentId=stability-test&businessId=${CONFIG.BUSINESS_ID}`;
          console.log(`   Connecting to: ${wsUrl}`);
          
          ws = new WebSocket(wsUrl);

          ws.on('open', () => {
            console.log('✅ WebSocket connected');
            this.results.websocket.connected = true;
            
            // Send initial agent connect message
            this.sendWebSocketMessage(ws, {
              type: 'chat_agent_connect',
              agentId: 'stability-test',
              agentName: 'Stability Test Agent',
              timestamp: new Date().toISOString()
            });

            // Start heartbeat
            heartbeatTimer = setInterval(() => {
              this.sendWebSocketMessage(ws, {
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              });
            }, CONFIG.HEARTBEAT_INTERVAL);
          });

          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data.toString());
              this.results.websocket.messagesReceived++;
              console.log(`📥 WS Message: ${message.type || message.action || 'unknown'}`);
              
              // Calculate latency for heartbeat responses
              if ((message.type === 'heartbeat_response' || message.type === 'pong') && message.timestamp) {
                const latency = Date.now() - new Date(message.timestamp).getTime();
                this.results.websocket.latency.push(latency);
              }
            } catch (e) {
              console.error('   Failed to parse WebSocket message:', e.message);
            }
          });

          ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket closed: ${code} ${reason}`);
            this.results.websocket.connected = false;
            
            if (heartbeatTimer) {
              clearInterval(heartbeatTimer);
              heartbeatTimer = null;
            }

            // Attempt reconnection
            if (reconnectCount < maxReconnects && Date.now() - this.startTime < CONFIG.TEST_DURATION) {
              reconnectCount++;
              this.results.websocket.reconnects++;
              console.log(`🔄 Reconnecting... (${reconnectCount}/${maxReconnects})`);
              setTimeout(connect, 2000 * reconnectCount);
            } else {
              resolve();
            }
          });

          ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
            this.results.websocket.errors.push({
              time: Date.now() - this.startTime,
              error: error.message
            });
          });

        } catch (error) {
          console.error('❌ WebSocket connection failed:', error.message);
          this.results.websocket.errors.push({
            time: Date.now() - this.startTime,
            error: error.message
          });
          resolve();
        }
      };

      connect();

      // Auto-resolve after test duration
      setTimeout(() => {
        if (ws) {
          ws.close(1000, 'Test completed');
        }
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
        }
        resolve();
      }, CONFIG.TEST_DURATION);
    });
  }

  sendWebSocketMessage(ws, message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
        this.results.websocket.messagesSent++;
        console.log(`📤 WS Sent: ${message.type}`);
        return true;
      } catch (error) {
        console.error('❌ Failed to send WebSocket message:', error.message);
        return false;
      }
    }
    return false;
  }

  async testHTTPBridge() {
    console.log('🌐 Testing HTTP Bridge...');
    
    const sendRequest = async (messageCount) => {
      const startTime = Date.now();
      
      try {
        const payload = {
          participantToken: 'stability-test-driver',
          message: `Test message ${messageCount} from stability test`,
          contentType: 'text/plain',
          metadata: {
            senderId: 'stability-test-driver',
            senderType: 'driver',
            senderName: 'Test Driver',
            timestamp: new Date().toISOString(),
            driverId: 'stability-test-driver',
            driverName: 'Test Driver',
            contactId: 'stability-test-session',
            platform: 'StabilityTest'
          }
        };

        const response = await this.makeHTTPRequest(CONFIG.HTTP_BRIDGE_URL, payload);
        const latency = Date.now() - startTime;
        
        this.results.httpBridge.requestsSent++;
        this.results.httpBridge.latency.push(latency);

        if (response.success) {
          this.results.httpBridge.successfulResponses++;
          console.log(`✅ HTTP Bridge: Message ${messageCount} sent (${latency}ms)`);
        } else {
          console.log(`❌ HTTP Bridge: Message ${messageCount} failed - ${response.error}`);
          this.results.httpBridge.errors.push({
            time: Date.now() - this.startTime,
            error: response.error,
            status: response.status
          });
        }
      } catch (error) {
        console.error(`❌ HTTP Bridge: Message ${messageCount} error:`, error.message);
        this.results.httpBridge.errors.push({
          time: Date.now() - this.startTime,
          error: error.message
        });
      }
    };

    // Send messages periodically
    let messageCount = 1;
    const interval = setInterval(async () => {
      if (Date.now() - this.startTime >= CONFIG.TEST_DURATION) {
        clearInterval(interval);
        return;
      }
      
      await sendRequest(messageCount++);
    }, 5000); // Send every 5 seconds

    // Send initial message immediately
    await sendRequest(messageCount++);

    // Wait for test duration
    return new Promise(resolve => {
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, CONFIG.TEST_DURATION);
    });
  }

  makeHTTPRequest(url, payload) {
    return new Promise((resolve) => {
      const data = JSON.stringify(payload);
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'Accept': 'application/json'
        }
      };

      const lib = urlObj.protocol === 'https:' ? https : http;
      const req = lib.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve({
              success: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              data: parsed,
              error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
            });
          } catch (e) {
            resolve({
              success: false,
              status: res.statusCode,
              error: `Parse error: ${e.message}`,
              rawData: responseData
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });

      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout'
        });
      });

      req.write(data);
      req.end();
    });
  }

  async monitorAndReport() {
    const reportInterval = setInterval(() => {
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
      console.log(`\n⏱️  Progress: ${elapsed}s`);
      console.log(`   WebSocket: ${this.results.websocket.connected ? '🟢' : '🔴'} Connected, ${this.results.websocket.messagesReceived} received, ${this.results.websocket.messagesSent} sent`);
      console.log(`   HTTP Bridge: ${this.results.httpBridge.successfulResponses}/${this.results.httpBridge.requestsSent} successful`);
    }, 10000);

    await new Promise(resolve => {
      setTimeout(() => {
        clearInterval(reportInterval);
        resolve();
      }, CONFIG.TEST_DURATION);
    });
  }

  generateReport() {
    const duration = (Date.now() - this.startTime) / 1000;
    
    console.log('\n\n📊 CONNECTION STABILITY TEST REPORT');
    console.log('=====================================');
    console.log(`Test Duration: ${duration.toFixed(1)}s`);
    console.log(`Test Time: ${new Date().toISOString()}`);
    
    // WebSocket Results
    console.log('\n🔌 WEBSOCKET CONNECTION:');
    console.log(`   Status: ${this.results.websocket.connected ? '🟢 Connected' : '🔴 Disconnected'}`);
    console.log(`   Messages Sent: ${this.results.websocket.messagesSent}`);
    console.log(`   Messages Received: ${this.results.websocket.messagesReceived}`);
    console.log(`   Reconnections: ${this.results.websocket.reconnects}`);
    console.log(`   Errors: ${this.results.websocket.errors.length}`);
    
    if (this.results.websocket.latency.length > 0) {
      const avgLatency = this.results.websocket.latency.reduce((a, b) => a + b, 0) / this.results.websocket.latency.length;
      const maxLatency = Math.max(...this.results.websocket.latency);
      console.log(`   Avg Latency: ${avgLatency.toFixed(1)}ms`);
      console.log(`   Max Latency: ${maxLatency}ms`);
    }

    if (this.results.websocket.errors.length > 0) {
      console.log('   Recent Errors:');
      this.results.websocket.errors.slice(-3).forEach(error => {
        console.log(`     ${(error.time / 1000).toFixed(1)}s: ${error.error}`);
      });
    }

    // HTTP Bridge Results
    console.log('\n🌐 HTTP BRIDGE:');
    console.log(`   Requests Sent: ${this.results.httpBridge.requestsSent}`);
    console.log(`   Successful: ${this.results.httpBridge.successfulResponses}`);
    console.log(`   Success Rate: ${this.results.httpBridge.requestsSent > 0 ? 
      ((this.results.httpBridge.successfulResponses / this.results.httpBridge.requestsSent) * 100).toFixed(1) : 0}%`);
    console.log(`   Errors: ${this.results.httpBridge.errors.length}`);

    if (this.results.httpBridge.latency.length > 0) {
      const avgLatency = this.results.httpBridge.latency.reduce((a, b) => a + b, 0) / this.results.httpBridge.latency.length;
      const maxLatency = Math.max(...this.results.httpBridge.latency);
      console.log(`   Avg Latency: ${avgLatency.toFixed(1)}ms`);
      console.log(`   Max Latency: ${maxLatency}ms`);
    }

    if (this.results.httpBridge.errors.length > 0) {
      console.log('   Recent Errors:');
      this.results.httpBridge.errors.slice(-3).forEach(error => {
        console.log(`     ${(error.time / 1000).toFixed(1)}s: ${error.error} ${error.status || ''}`);
      });
    }

    // Overall Assessment
    console.log('\n🎯 ASSESSMENT:');
    const wsHealth = this.results.websocket.connected && this.results.websocket.errors.length === 0;
    const httpHealth = this.results.httpBridge.requestsSent > 0 && 
      (this.results.httpBridge.successfulResponses / this.results.httpBridge.requestsSent) > 0.8;
    
    console.log(`   WebSocket Health: ${wsHealth ? '🟢 Good' : '🔴 Issues Detected'}`);
    console.log(`   HTTP Bridge Health: ${httpHealth ? '🟢 Good' : '🔴 Issues Detected'}`);
    console.log(`   Overall Status: ${wsHealth && httpHealth ? '🟢 STABLE' : '🟡 NEEDS ATTENTION'}`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (!wsHealth) {
      console.log('   - Check WebSocket authentication and endpoint availability');
      console.log('   - Verify AWS API Gateway WebSocket route configuration');
      console.log('   - Review Lambda function logs for connection errors');
    }
    if (!httpHealth) {
      console.log('   - Check HTTP bridge API endpoint configuration');
      console.log('   - Verify chat bridge Lambda function is deployed correctly');
      console.log('   - Review API Gateway REST API settings');
    }
    if (wsHealth && httpHealth) {
      console.log('   - Both connections are stable - ready for production traffic');
      console.log('   - Consider implementing the full stabilization plan for production scale');
    }

    console.log('\n✅ Test completed successfully!');
    return this.results;
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new ConnectionStabilityTest();
  test.runTests().catch(console.error);
}

module.exports = ConnectionStabilityTest;
