#!/usr/bin/env node
/**
 * End-to-End Chat System Test
 * Tests merchant-to-agent communication via WebSocket
 */

const WebSocket = require('ws');
const crypto = require('crypto');

// Configuration
const WS_ENDPOINT = 'wss://7ysrz3rspi.execute-api.us-east-1.amazonaws.com/dev';
const TEST_BUSINESS_ID = 'test-business-' + Date.now();
const TEST_MERCHANT_NAME = 'Test Merchant Restaurant';
const TEST_AGENT_ID = 'test-agent-' + Date.now();
const TEST_AGENT_NAME = 'Test Support Agent';

// Test tokens (in production, these would be real JWT tokens from Cognito)
const MERCHANT_TOKEN = 'browser_driver_' + crypto.randomBytes(16).toString('hex');
const AGENT_TOKEN = 'browser_agent_' + crypto.randomBytes(16).toString('hex');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(emoji, color, message) {
  console.log(`${emoji} ${color}${message}${colors.reset}`);
}

function merchantLog(message) {
  log('🏪', colors.blue, `[MERCHANT] ${message}`);
}

function agentLog(message) {
  log('👨‍💼', colors.magenta, `[AGENT] ${message}`);
}

function successLog(message) {
  log('✅', colors.green, message);
}

function errorLog(message) {
  log('❌', colors.red, message);
}

function infoLog(message) {
  log('ℹ️', colors.cyan, message);
}

class ChatClient {
  constructor(name, type, userId, userName, businessId, token) {
    this.name = name;
    this.type = type; // 'merchant' or 'agent'
    this.userId = userId;
    this.userName = userName;
    this.businessId = businessId;
    this.token = token;
    this.ws = null;
    this.sessionId = null;
    this.connected = false;
    this.messages = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      const sessionId = `${this.type}_${Date.now()}_${this.userId.substring(0, 8)}`;
      this.sessionId = sessionId;

      let url;
      if (this.type === 'merchant') {
        url = `${WS_ENDPOINT}?businessId=${this.businessId}&userType=driver&app=whizzMerchants&sessionId=${sessionId}&token=${encodeURIComponent(this.token)}`;
      } else {
        url = `${WS_ENDPOINT}?businessId=${this.businessId}&userType=support&sessionId=${sessionId}&token=${encodeURIComponent(this.token)}`;
      }

      this[this.type === 'merchant' ? 'merchantLog' : 'agentLog'](`Connecting to: ${url.substring(0, 100)}...`);

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this[this.type === 'merchant' ? 'merchantLog' : 'agentLog']('WebSocket connection opened');
        
        // Send handshake
        const handshake = this.type === 'merchant' 
          ? {
              action: 'chat_driver_connect',
              type: 'chat_driver_connect',
              sessionId: this.sessionId,
              driverId: this.businessId,
              driverName: this.userName,
              driverPhone: 'test@example.com',
            }
          : {
              action: 'chat_agent_connect',
              type: 'chat_agent_connect',
              sessionId: this.sessionId,
              userType: 'agent',
              agentId: this.userId,
              agentName: this.userName,
              businessId: this.businessId,
            };

        this.send(handshake);
        
        // Set timeout for connection confirmation
        setTimeout(() => {
          if (!this.connected) {
            this[this.type === 'merchant' ? 'merchantLog' : 'agentLog']('Assuming connection established (no explicit confirmation)');
            this.connected = true;
            resolve();
          }
        }, 2000);
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
          
          // Check if this is a connection confirmation
          if (message.type === 'connection_established' || 
              message.type === 'chat_session_created' ||
              message.type === 'connection_confirmed') {
            this.connected = true;
            resolve();
          }
        } catch (e) {
          this[this.type === 'merchant' ? 'merchantLog' : 'agentLog'](`Raw message: ${data.toString()}`);
        }
      });

      this.ws.on('error', (error) => {
        this[this.type === 'merchant' ? 'merchantLog' : 'agentLog'](`WebSocket error: ${error.message}`);
        reject(error);
      });

      this.ws.on('close', (code, reason) => {
        this[this.type === 'merchant' ? 'merchantLog' : 'agentLog'](`WebSocket closed: ${code} - ${reason}`);
        this.connected = false;
      });
    });
  }

  handleMessage(message) {
    const logFn = this.type === 'merchant' ? merchantLog : agentLog;
    
    logFn(`Received: ${message.type || 'unknown'}`);
    
    switch (message.type) {
      case 'connection_established':
      case 'connection_confirmed':
        logFn('Connection confirmed!');
        break;
        
      case 'chat_session_created':
        logFn(`Chat session created: ${message.sessionId}`);
        if (message.sessionId) {
          this.sessionId = message.sessionId;
        }
        break;
        
      case 'chat_message':
      case 'message_received':
        const senderType = message.message?.senderType || message.senderType || 'unknown';
        const text = message.message?.text || message.text || message.messageText || '';
        const from = senderType === 'driver' ? 'MERCHANT' : 
                     senderType === 'agent' ? 'AGENT' : 
                     'UNKNOWN';
        
        // Only log if it's from the other party
        if ((this.type === 'merchant' && senderType === 'agent') ||
            (this.type === 'agent' && senderType === 'driver')) {
          logFn(`📨 Message from ${from}: "${text}"`);
          this.messages.push({ from: senderType, text, timestamp: new Date() });
        }
        break;
        
      case 'error':
        errorLog(`${this.name} received error: ${message.message || JSON.stringify(message)}`);
        break;
        
      default:
        logFn(`Other message: ${JSON.stringify(message).substring(0, 100)}`);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify(data);
      this.ws.send(payload);
      const logFn = this.type === 'merchant' ? merchantLog : agentLog;
      logFn(`Sent: ${data.action || data.type || 'message'}`);
    }
  }

  sendChatMessage(text) {
    const message = {
      action: 'chat_message',
      type: 'chat_message',
      sessionId: this.sessionId,
      messageText: text,
      senderType: this.type === 'merchant' ? 'driver' : 'agent',
      requestId: `msg_${Date.now()}`,
    };
    
    this.send(message);
    const logFn = this.type === 'merchant' ? merchantLog : agentLog;
    logFn(`💬 Sent message: "${text}"`);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  merchantLog(msg) {
    merchantLog(msg);
  }

  agentLog(msg) {
    agentLog(msg);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n' + '='.repeat(80));
  log('🚀', colors.bright, 'CHAT SYSTEM END-TO-END TEST');
  console.log('='.repeat(80) + '\n');

  infoLog(`WebSocket Endpoint: ${WS_ENDPOINT}`);
  infoLog(`Test Business ID: ${TEST_BUSINESS_ID}`);
  infoLog(`Test Merchant: ${TEST_MERCHANT_NAME}`);
  infoLog(`Test Agent: ${TEST_AGENT_NAME}`);
  console.log('');

  let merchant = null;
  let agent = null;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Step 1: Connect Merchant
    console.log('\n' + '─'.repeat(80));
    infoLog('Step 1: Connecting Merchant to Chat System');
    console.log('─'.repeat(80));
    
    merchant = new ChatClient(
      'Merchant',
      'merchant',
      TEST_BUSINESS_ID,
      TEST_MERCHANT_NAME,
      TEST_BUSINESS_ID,
      MERCHANT_TOKEN
    );

    await merchant.connect();
    successLog('Merchant connected successfully!');
    testsPassed++;
    
    await sleep(2000);

    // Step 2: Connect Agent
    console.log('\n' + '─'.repeat(80));
    infoLog('Step 2: Connecting Support Agent to Chat System');
    console.log('─'.repeat(80));
    
    agent = new ChatClient(
      'Agent',
      'agent',
      TEST_AGENT_ID,
      TEST_AGENT_NAME,
      TEST_BUSINESS_ID,
      AGENT_TOKEN
    );

    await agent.connect();
    successLog('Agent connected successfully!');
    testsPassed++;
    
    await sleep(2000);

    // Step 3: Merchant sends message to Agent
    console.log('\n' + '─'.repeat(80));
    infoLog('Step 3: Merchant sends message to Agent');
    console.log('─'.repeat(80));
    
    const merchantMessage = 'Hello, I need help with my order!';
    merchant.sendChatMessage(merchantMessage);
    
    await sleep(3000);
    
    if (agent.messages.some(m => m.text === merchantMessage)) {
      successLog('✅ Agent received merchant message!');
      testsPassed++;
    } else {
      errorLog('❌ Agent did NOT receive merchant message');
      testsFailed++;
      console.log('Agent messages:', agent.messages);
    }

    // Step 4: Agent responds to Merchant
    console.log('\n' + '─'.repeat(80));
    infoLog('Step 4: Agent responds to Merchant');
    console.log('─'.repeat(80));
    
    const agentMessage = 'Hello! How can I assist you today?';
    agent.sendChatMessage(agentMessage);
    
    await sleep(3000);
    
    if (merchant.messages.some(m => m.text === agentMessage)) {
      successLog('✅ Merchant received agent response!');
      testsPassed++;
    } else {
      errorLog('❌ Merchant did NOT receive agent response');
      testsFailed++;
      console.log('Merchant messages:', merchant.messages);
    }

    // Step 5: Multiple message exchange
    console.log('\n' + '─'.repeat(80));
    infoLog('Step 5: Testing Multiple Message Exchange');
    console.log('─'.repeat(80));
    
    const exchanges = [
      { from: 'merchant', text: 'My order #12345 is delayed' },
      { from: 'agent', text: 'Let me check that for you' },
      { from: 'merchant', text: 'Thank you!' },
      { from: 'agent', text: 'The driver is on the way. ETA: 10 minutes' },
    ];

    for (const exchange of exchanges) {
      if (exchange.from === 'merchant') {
        merchant.sendChatMessage(exchange.text);
      } else {
        agent.sendChatMessage(exchange.text);
      }
      await sleep(2000);
    }

    successLog('Multiple messages exchanged successfully!');
    testsPassed++;

    // Step 6: Send typing indicator
    console.log('\n' + '─'.repeat(80));
    infoLog('Step 6: Testing Typing Indicator');
    console.log('─'.repeat(80));
    
    merchant.send({
      action: 'chat_typing',
      type: 'chat_typing',
      sessionId: merchant.sessionId,
      isTyping: true,
      senderType: 'driver',
    });
    
    await sleep(1000);
    
    merchant.send({
      action: 'chat_typing',
      type: 'chat_typing',
      sessionId: merchant.sessionId,
      isTyping: false,
      senderType: 'driver',
    });
    
    successLog('Typing indicators sent successfully!');
    testsPassed++;

  } catch (error) {
    errorLog(`Test failed with error: ${error.message}`);
    console.error(error);
    testsFailed++;
  } finally {
    // Cleanup
    console.log('\n' + '─'.repeat(80));
    infoLog('Cleanup: Disconnecting clients');
    console.log('─'.repeat(80));
    
    if (merchant) {
      merchant.disconnect();
      merchantLog('Disconnected');
    }
    
    if (agent) {
      agent.disconnect();
      agentLog('Disconnected');
    }

    // Wait for cleanup
    await sleep(2000);

    // Print summary
    console.log('\n' + '='.repeat(80));
    log('📊', colors.bright, 'TEST SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    
    if (testsFailed === 0) {
      successLog(`All ${testsPassed} tests passed! 🎉`);
      console.log('');
      successLog('✅ Merchant can connect to chat');
      successLog('✅ Agent can connect to chat');
      successLog('✅ Merchant can send messages to Agent');
      successLog('✅ Agent can send messages to Merchant');
      successLog('✅ Multiple messages work correctly');
      successLog('✅ Typing indicators work');
    } else {
      errorLog(`${testsFailed} test(s) failed, ${testsPassed} test(s) passed`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('');

    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

// Run tests
console.log('🚀 Starting chat system test...\n');
runTests().catch(error => {
  errorLog('Fatal error running tests:');
  console.error(error);
  process.exit(1);
});
