#!/usr/bin/env node

/**
 * Test Public Chat Bridge API
 * Tests the new public endpoint with API key authentication
 */

const https = require('https');

console.log('🧪 Testing Public Chat Bridge API');
console.log('===================================');

const testMessage = {
  participantToken: `test_driver_${Date.now()}`,
  message: '🚗 Hello from test! This message should reach WizzCentral Support agents.',
  contentType: 'text/plain',
  metadata: {
    senderId: `test_driver_${Date.now()}`,
    senderName: 'Test Driver (Public API)',
    senderType: 'driver',
    businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
    platform: 'test-script',
    timestamp: new Date().toISOString()
  }
};

const postData = JSON.stringify(testMessage);

const options = {
  hostname: 'ru65nhlwhc.execute-api.us-east-1.amazonaws.com',
  port: 443,
  path: '/dev/api/chat/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'wizzdriver_mobile_app_v1',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Testing public endpoint:');
console.log(`   URL: https://${options.hostname}${options.path}`);
console.log(`   API Key: ${options.headers['X-API-Key']}`);
console.log(`   Message: ${testMessage.message.substring(0, 50)}...`);
console.log('');

const req = https.request(options, (res) => {
  let responseData = '';
  
  console.log(`📡 Response Status: ${res.statusCode}`);
  console.log(`📡 Response Headers:`, res.headers);
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(responseData);
      console.log('');
      console.log('📨 Response Data:');
      console.log(JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200 && response.success) {
        console.log('');
        console.log('✅ SUCCESS: Public chat bridge is working!');
        console.log(`   Message ID: ${response.messageId}`);
        console.log(`   Session ID: ${response.sessionId}`);
        console.log(`   Bridged to agents: ${response.bridged}`);
        console.log(`   Agent count: ${response.message}`);
      } else {
        console.log('');
        console.log('❌ FAILED: Public chat bridge returned error');
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Error: ${response.error || 'Unknown error'}`);
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

// Also test the chat history endpoint
setTimeout(() => {
  console.log('\n🔍 Testing chat history endpoint...');
  
  const historyOptions = {
    hostname: 'ru65nhlwhc.execute-api.us-east-1.amazonaws.com',
    port: 443,
    path: '/dev/api/chat/history?apiKey=wizzdriver_mobile_app_v1',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'wizzdriver_mobile_app_v1'
    }
  };
  
  const historyReq = https.request(historyOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const history = JSON.parse(data);
        console.log('📚 Chat History Response:');
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Sessions: ${history.sessionCount || 'N/A'}`);
        console.log('   Recent sessions:', history.sessions?.slice(0, 3) || []);
      } catch (e) {
        console.log('📚 Chat History Error:', data);
      }
    });
  });
  
  historyReq.on('error', err => console.log('❌ History request failed:', err.message));
  historyReq.end();
}, 2000);
