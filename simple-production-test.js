#!/usr/bin/env node

console.log('🎯 Production Test Starting...');

const https = require('https');

const testMessage = {
  participantToken: 'prod_test_' + Date.now(),
  message: '🚗 PRODUCTION: Message from Flutter to Amplify support dashboard',
  contentType: 'text/plain',
  metadata: {
    senderId: 'prod_driver_' + Date.now(),
    senderName: 'Amplify Test Driver',
    senderType: 'driver',
    platform: 'flutter',
    businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
    timestamp: new Date().toISOString()
  }
};

console.log('📱 Sending message via AWS API...');

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

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Status:', res.statusCode);
  
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ Success:', response.success);
      console.log('📋 Message ID:', response.messageId);
      console.log('🔗 Bridged:', response.bridged);
      console.log('');
      console.log('🎯 Check Amplify Dashboard:');
      console.log('https://main.d2f5oacwil9cbi.amplifyapp.com/pages/support.html');
    } catch (e) {
      console.log('❌ Response:', data);
    }
  });
});

req.on('error', err => console.log('❌ Error:', err.message));
req.write(postData);
req.end();
