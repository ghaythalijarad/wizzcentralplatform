#!/usr/bin/env node

/**
 * Complete End-to-End Production Test
 * Tests Flutter → AWS API → WebSocket → Amplify Support Dashboard
 */

const https = require('https');

console.log('🎯 COMPLETE END-TO-END PRODUCTION TEST');
console.log('=====================================');
console.log('Testing: Flutter → AWS API → WebSocket → Amplify Support');
console.log('');

// Production endpoints
const CHAT_BRIDGE_API = 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send';
const AMPLIFY_SUPPORT_URL = 'https://main.d2f5oacwil9cbi.amplifyapp.com/pages/support.html';
const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

// Test message matching Flutter app format
const testMessage = {
  participantToken: `flutter_prod_test_${Date.now()}`,
  message: '🚗 PRODUCTION TEST: Flutter app message to Amplify support dashboard. Can you see this in real-time?',
  contentType: 'text/plain',
  metadata: {
    senderId: `prod_driver_${Date.now()}`,
    senderName: 'Production Test Driver',
    senderPhone: '+964771234567',
    senderType: 'driver',
    platform: 'flutter',
    businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
    timestamp: new Date().toISOString(),
    source: 'wizzdriver_app'
  }
};

console.log('📱 Simulating Flutter App Message:');
console.log('   API:', CHAT_BRIDGE_API);
console.log('   Message:', testMessage.message.substring(0, 50) + '...');
console.log('   Driver:', testMessage.metadata.senderName);
console.log('');

// Send test message
const postData = JSON.stringify(testMessage);
const url = new URL(CHAT_BRIDGE_API);

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'wizzdriver_mobile_app_v1',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Sending message to AWS Chat Bridge API...');

const req = https.request(options, (res) => {
  let responseData = '';
  
  console.log(`📡 Response Status: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(responseData);
      
      console.log('');
      console.log('📨 AWS API Response:');
      console.log('   Success:', response.success);
      console.log('   Message ID:', response.messageId);
      console.log('   Session ID:', response.sessionId);
      console.log('   Bridged:', response.bridged);
      console.log('   Status:', response.message);
      
      if (res.statusCode === 200 && response.success) {
        console.log('');
        console.log('✅ SUCCESS: Message sent to AWS infrastructure!');
        
        if (response.bridged) {
          console.log('✅ Message was bridged to WebSocket successfully');
          console.log('');
          console.log('🎯 NEXT STEPS:');
          console.log('1. Open Amplify Support Dashboard: ' + AMPLIFY_SUPPORT_URL);
          console.log('2. Look for new session from: ' + testMessage.metadata.senderName);
          console.log('3. Verify message appears in real-time');
          console.log('4. Test reply from support agent back to Flutter app');
        } else {
          console.log('⚠️ Message sent but not bridged to WebSocket');
          console.log('   This could mean no support agents are connected');
        }
      } else {
        console.log('');
        console.log('❌ FAILED: AWS API returned error');
        console.log('   Status:', res.statusCode);
        console.log('   Error:', response.error || 'Unknown error');
      }
      
    } catch (e) {
      console.log('');
      console.log('❌ FAILED: Invalid JSON response');
      console.log('📄 Raw response:', responseData);
    }
  });
});

req.on('error', (err) => {
  console.log('');
  console.log('❌ REQUEST FAILED:', err.message);
});

req.write(postData);
req.end();

// Instructions
console.log('');
console.log('📋 Manual Verification Steps:');
console.log('1. Wait for API response above');
console.log('2. Open: ' + AMPLIFY_SUPPORT_URL);
console.log('3. Check if new driver session appears');
console.log('4. Verify real-time message delivery');
console.log('');
console.log('🔍 Expected in Support Dashboard:');
console.log('   - New session for: "Production Test Driver"');
console.log('   - Message starting with: "🚗 PRODUCTION TEST"');
console.log('   - Session should appear in real-time');
console.log('');
