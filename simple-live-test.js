#!/usr/bin/env node

console.log('🎯 LIVE PRODUCTION TEST - Flutter to Amplify');
console.log('=============================================');

const https = require('https');

const testMessage = {
  participantToken: `flutter_live_test_${Date.now()}`,
  message: '🚗 LIVE TEST: Testing real-time message from Flutter to Amplify support dashboard',
  contentType: 'text/plain',
  metadata: {
    senderId: `live_driver_${Date.now()}`,
    senderName: 'Live Test Driver',
    senderPhone: '+964771234567',
    senderType: 'driver',
    platform: 'flutter',
    businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
    timestamp: new Date().toISOString(),
    source: 'wizzdriver_app'
  }
};

console.log('📱 Sending message:', testMessage.message);
console.log('🚗 Driver:', testMessage.metadata.senderName);

const postData = JSON.stringify(testMessage);
const url = new URL('https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send');

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

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('\n📡 Status:', res.statusCode);
    console.log('📨 Response:', data);
    
    if (res.statusCode === 200) {
      console.log('\n✅ SUCCESS! Message sent to AWS');
      console.log('\n🎯 Now check Amplify Support Dashboard:');
      console.log('   URL: https://main.d2f5oacwil9cbi.amplifyapp.com/pages/support.html');
      console.log('   Look for: "Live Test Driver"');
      console.log('   Message: "🚗 LIVE TEST: Testing real-time..."');
    } else {
      console.log('\n❌ FAILED with status:', res.statusCode);
    }
  });
});

req.on('error', (err) => {
  console.log('\n❌ ERROR:', err.message);
});

req.write(postData);
req.end();
