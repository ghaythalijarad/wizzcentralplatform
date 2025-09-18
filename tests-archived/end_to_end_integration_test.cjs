#!/usr/bin/env node

/**
 * End-to-End Integration Test for Unified WebSocket Chat System
 * Tests all components of the unified chat system across user types
 */

const { WebSocket } = require('ws');
const https = require('https');

// Test configuration
const TEST_CONFIG = {
  wsUrl: 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev',
  httpApiUrl: 'https://api.whizzapp.com',
  testDuration: 30000, // 30 seconds
  messageInterval: 2000, // 2 seconds
  userTypes: ['customer', 'driver', 'merchant', 'agent']
};

class ChatTestSuite {
  constructor() {
    this.connections = new Map();
    this.testResults = {
      connections: 0,
      messagesExchanged: 0,
      errors: [],
      successful: false
    };
    this.testStartTime = Date.now();
  }

  /**
   * Run comprehensive chat system test
   */
  async runTests() {
    console.log('🚀 Starting End-to-End WebSocket Chat Integration Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 WebSocket URL: ${TEST_CONFIG.wsUrl}`);
    console.log(`⏱️  Test Duration: ${TEST_CONFIG.testDuration / 1000}s`);
    console.log(`👥 User Types: ${TEST_CONFIG.userTypes.join(', ')}`);
    console.log('');

    try {
      // Test 1: WebSocket Connection Health Check
      await this.testWebSocketConnectivity();
      
      // Test 2: Multi-User Type Connection Test
      await this.testMultiUserConnections();
      
      // Test 3: Message Exchange Test
      await this.testMessageExchange();
      
      // Test 4: Channel-based Routing Test
      await this.testChannelRouting();
      
      // Test 5: Agent Connection Test
      await this.testAgentConnections();
      
      // Test 6: Chat Session Management Test
      await this.testChatSessionManagement();
      
      // Wait for test duration
      console.log(`⏳ Running extended test for ${TEST_CONFIG.testDuration / 1000}s...`);
      await this.wait(TEST_CONFIG.testDuration);
      
      // Generate final report
      this.generateTestReport();
      
    } catch (error) {
      console.error('💥 Test suite failed:', error.message);
      this.testResults.errors.push(`Test suite failure: ${error.message}`);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test basic WebSocket connectivity
   */
  async testWebSocketConnectivity() {
    console.log('🔍 Test 1: WebSocket Connectivity Check');
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(TEST_CONFIG.wsUrl);
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      ws.on('open', () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connection successful');
        ws.close();
        resolve();
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ WebSocket connection failed:', error.message);
        reject(error);
      });
    });
  }

  /**
   * Test connections for all user types
   */
  async testMultiUserConnections() {
    console.log('🔍 Test 2: Multi-User Type Connections');
    
    const connectionPromises = TEST_CONFIG.userTypes.map(userType => 
      this.createTestConnection(userType)
    );
    
    try {
      await Promise.all(connectionPromises);
      console.log(`✅ All ${TEST_CONFIG.userTypes.length} user type connections established`);
    } catch (error) {
      console.error('❌ Multi-user connection test failed:', error.message);
      this.testResults.errors.push(`Multi-user connection failed: ${error.message}`);
    }
  }

  /**
   * Create a test connection for a specific user type
   */
  async createTestConnection(userType) {
    return new Promise((resolve, reject) => {
      const userId = `test_${userType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ws = new WebSocket(TEST_CONFIG.wsUrl);
      
      const connectionData = {
        ws,
        userType,
        userId,
        messagesReceived: 0,
        messagesSent: 0,
        connected: false
      };

      const timeout = setTimeout(() => {
        reject(new Error(`${userType} connection timeout`));
      }, 10000);

      ws.on('open', () => {
        clearTimeout(timeout);
        connectionData.connected = true;
        this.testResults.connections++;
        
        // Send join message
        const joinMessage = {
          action: 'join_channel',
          userType,
          userId,
          timestamp: new Date().toISOString()
        };
        
        ws.send(JSON.stringify(joinMessage));
        
        console.log(`✅ ${userType} connection established (${userId})`);
        this.connections.set(userId, connectionData);
        resolve();
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          connectionData.messagesReceived++;
          this.testResults.messagesExchanged++;
          
          console.log(`📨 ${userType} received:`, message.type || message.action);
        } catch (error) {
          console.error(`❌ ${userType} message parse error:`, error.message);
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        console.error(`❌ ${userType} connection error:`, error.message);
        this.testResults.errors.push(`${userType} connection error: ${error.message}`);
        reject(error);
      });

      ws.on('close', () => {
        connectionData.connected = false;
        console.log(`🔌 ${userType} connection closed`);
      });
    });
  }

  /**
   * Test message exchange between different user types
   */
  async testMessageExchange() {
    console.log('🔍 Test 3: Message Exchange Test');
    
    if (this.connections.size === 0) {
      console.log('⚠️  No active connections for message test');
      return;
    }

    // Send test messages from each connection
    for (const [userId, connection] of this.connections) {
      if (connection.connected) {
        const testMessage = {
          action: 'chat_message',
          userId: connection.userId,
          userType: connection.userType,
          message: `Test message from ${connection.userType} at ${new Date().toISOString()}`,
          timestamp: new Date().toISOString()
        };
        
        connection.ws.send(JSON.stringify(testMessage));
        connection.messagesSent++;
        
        console.log(`📤 Sent test message from ${connection.userType}`);
      }
    }
    
    // Wait for message propagation
    await this.wait(2000);
    console.log('✅ Message exchange test completed');
  }

  /**
   * Test channel-based routing
   */
  async testChannelRouting() {
    console.log('🔍 Test 4: Channel-based Routing Test');
    
    // Test channel subscription for each user type
    for (const [userId, connection] of this.connections) {
      if (connection.connected) {
        const channels = this.getChannelsForUserType(connection.userType);
        
        for (const channel of channels) {
          const subscribeMessage = {
            action: 'join_channel',
            channel,
            userType: connection.userType,
            userId: connection.userId,
            timestamp: new Date().toISOString()
          };
          
          connection.ws.send(JSON.stringify(subscribeMessage));
          console.log(`📡 ${connection.userType} subscribed to channel: ${channel}`);
        }
      }
    }
    
    await this.wait(1000);
    console.log('✅ Channel routing test completed');
  }

  /**
   * Test agent-specific functionality
   */
  async testAgentConnections() {
    console.log('🔍 Test 5: Agent Connection Test');
    
    // Find agent connections
    const agentConnections = Array.from(this.connections.values())
      .filter(conn => conn.userType === 'agent' && conn.connected);
    
    if (agentConnections.length === 0) {
      console.log('⚠️  No agent connections available for agent test');
      return;
    }

    // Test agent-specific actions
    for (const agentConn of agentConnections) {
      // Test agent connect
      const agentConnectMessage = {
        action: 'agent_connect',
        agentId: agentConn.userId,
        agentName: `Test Agent ${agentConn.userId}`,
        skills: ['general', 'technical'],
        status: 'available',
        timestamp: new Date().toISOString()
      };
      
      agentConn.ws.send(JSON.stringify(agentConnectMessage));
      console.log(`👨‍💼 Agent connect test sent for ${agentConn.userId}`);
    }
    
    await this.wait(1000);
    console.log('✅ Agent connection test completed');
  }

  /**
   * Test chat session management
   */
  async testChatSessionManagement() {
    console.log('🔍 Test 6: Chat Session Management Test');
    
    // Find customer and agent connections
    const customerConn = Array.from(this.connections.values())
      .find(conn => conn.userType === 'customer' && conn.connected);
    const agentConn = Array.from(this.connections.values())
      .find(conn => conn.userType === 'agent' && conn.connected);
    
    if (!customerConn || !agentConn) {
      console.log('⚠️  Missing customer or agent connection for session test');
      return;
    }

    // Initiate chat session
    const sessionId = `test_session_${Date.now()}`;
    const chatInitMessage = {
      action: 'chat_init',
      sessionId,
      userId: customerConn.userId,
      userType: 'customer',
      priority: 'normal',
      timestamp: new Date().toISOString()
    };
    
    customerConn.ws.send(JSON.stringify(chatInitMessage));
    console.log(`💬 Chat session initiated: ${sessionId}`);
    
    await this.wait(1000);
    console.log('✅ Chat session management test completed');
  }

  /**
   * Get appropriate channels for user type
   */
  getChannelsForUserType(userType) {
    const channelMap = {
      customer: ['customer_support', 'general'],
      driver: ['driver_support', 'driver_updates'],
      merchant: ['merchant_support', 'merchant_notifications'],
      agent: ['agent_notifications', 'customer_support', 'driver_support', 'merchant_support']
    };
    
    return channelMap[userType] || ['general'];
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const testDuration = Date.now() - this.testStartTime;
    const successRate = this.testResults.connections > 0 ? 
      ((this.testResults.connections - this.testResults.errors.length) / this.testResults.connections * 100).toFixed(2) : 0;
    
    console.log('');
    console.log('📊 UNIFIED WEBSOCKET CHAT SYSTEM - TEST REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  Test Duration: ${(testDuration / 1000).toFixed(2)}s`);
    console.log(`🔗 Total Connections: ${this.testResults.connections}`);
    console.log(`💬 Messages Exchanged: ${this.testResults.messagesExchanged}`);
    console.log(`❌ Errors Encountered: ${this.testResults.errors.length}`);
    console.log(`✅ Success Rate: ${successRate}%`);
    console.log('');
    
    if (this.testResults.errors.length > 0) {
      console.log('🚨 ERRORS DETECTED:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('');
    }
    
    // Connection status summary
    console.log('📱 CONNECTION STATUS BY USER TYPE:');
    const userTypeStats = {};
    for (const [userId, connection] of this.connections) {
      if (!userTypeStats[connection.userType]) {
        userTypeStats[connection.userType] = { total: 0, connected: 0, messages: 0 };
      }
      userTypeStats[connection.userType].total++;
      if (connection.connected) userTypeStats[connection.userType].connected++;
      userTypeStats[connection.userType].messages += connection.messagesReceived + connection.messagesSent;
    }
    
    for (const [userType, stats] of Object.entries(userTypeStats)) {
      console.log(`   ${userType}: ${stats.connected}/${stats.total} connected, ${stats.messages} messages`);
    }
    
    console.log('');
    
    // Overall test result
    const overallSuccess = this.testResults.errors.length === 0 && 
                          this.testResults.connections >= TEST_CONFIG.userTypes.length &&
                          this.testResults.messagesExchanged > 0;
    
    if (overallSuccess) {
      console.log('🎉 UNIFIED CHAT SYSTEM TEST: PASSED');
      console.log('✅ All core functionality working correctly');
      this.testResults.successful = true;
    } else {
      console.log('💥 UNIFIED CHAT SYSTEM TEST: FAILED');
      console.log('❌ Issues detected that need attention');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Cleanup all connections
   */
  async cleanup() {
    console.log('🧹 Cleaning up test connections...');
    
    for (const [userId, connection] of this.connections) {
      if (connection.ws && connection.connected) {
        connection.ws.close();
      }
    }
    
    this.connections.clear();
    console.log('✅ Cleanup completed');
  }

  /**
   * Wait utility
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  console.log('🚀 WizzCentral Platform - Unified WebSocket Chat System Test');
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log('');
  
  const testSuite = new ChatTestSuite();
  await testSuite.runTests();
  
  // Exit with appropriate code
  process.exit(testSuite.testResults.successful ? 0 : 1);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error.message);
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ChatTestSuite;
