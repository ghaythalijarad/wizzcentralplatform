#!/usr/bin/env node

console.log('🔄 SECOND LIVE TEST - Real-time Verification');
console.log('===========================================');

const https = require('https');

const testMessage2 = {
  participantToken: `flutter_realtime_test_${Date.now()}`,
  message: '🚀 REAL-TIME TEST #2: This message should appear INSTANTLY in the Amplify support dashboard. Testing live WebSocket delivery!',
  contentType: 'text/plain',
  metadata: {
    senderId: `realtime_driver_${Date.now()}`,
    senderName: 'Real-time Test Driver',
    senderPhone: '+964771234999',
    senderType: 'driver',
    platform: 'flutter',
    businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
    timestamp: new Date().toISOString(),
    source: 'wizzdriver_app',
    testType: 'realtime_verification'
  }
};

console.log('📱 Sending real-time test message...');
console.log('🚗 Driver:', testMessage2.metadata.senderName);
console.log('📞 Phone:', testMessage2.metadata.senderPhone);

const postData = JSON.stringify(testMessage2);

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
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('\n📡 Status:', res.statusCode);
    
    try {
      const response = JSON.parse(data);
      console.log('📨 Response:', JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200 && response.success) {
        console.log('\n✅ SUCCESS! Message sent to AWS at', new Date().toISOString());
        console.log('📋 Message ID:', response.messageId);
        console.log('🎯 Session ID:', response.sessionId);
        
        console.log('\n🔍 Check Support Dashboard NOW:');
        console.log('   - Look for new session: "Real-time Test Driver"');
        console.log('   - Phone: "+964771234999"');
        console.log('   - Message: "🚀 REAL-TIME TEST #2..."');
        console.log('   - Should appear INSTANTLY');
      }
    } catch (e) {
      console.log('📨 Raw response:', data);
    }
  });
});

req.on('error', (err) => console.log('❌ ERROR:', err.message));
req.write(postData);
req.end();

console.log('\n⏰ Message sent at:', new Date().toISOString());
console.log('🎯 Watch the support dashboard for real-time delivery!');
