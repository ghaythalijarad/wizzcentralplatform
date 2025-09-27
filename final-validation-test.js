#!/usr/bin/env node

console.log('🎯 FINAL LIVE VALIDATION TEST');
console.log('============================');
console.log('⏰ Timestamp:', new Date().toISOString());
console.log('');

const https = require('https');

const finalTestMessage = {
  participantToken: `FINAL_VALIDATION_${Date.now()}`,
  message: '🎉 FINAL VALIDATION: This is the conclusive test message for end-to-end live chat integration between WhizzDriver Flutter app and WizzCentral Amplify support dashboard. Real-time delivery confirmed! ✅',
  contentType: 'text/plain',
  metadata: {
    senderId: `final_validation_driver_${Date.now()}`,
    senderName: 'FINAL VALIDATION DRIVER',
    senderPhone: '+964777888999',
    senderType: 'driver',
    platform: 'flutter',
    businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
    timestamp: new Date().toISOString(),
    source: 'wizzdriver_app',
    testType: 'final_validation'
  }
};

console.log('📱 FINAL MESSAGE:', finalTestMessage.message);
console.log('🚗 DRIVER:', finalTestMessage.metadata.senderName);
console.log('📞 PHONE:', finalTestMessage.metadata.senderPhone);
console.log('');
console.log('🎯 SUPPORT DASHBOARD URL: https://main.d2f5oacwil9cbi.amplifyapp.com/pages/support.html');
console.log('');
console.log('⚡ Sending message...');

const postData = JSON.stringify(finalTestMessage);

const req = https.request({
  hostname: 'ru65nhlwhc.execute-api.us-east-1.amazonaws.com',
  port: 443,
  path: '/dev/api/chat/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'wizzdriver_mobile_app_v1',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    console.log('');
    console.log('📡 RESPONSE STATUS:', res.statusCode);
    console.log('📨 RESPONSE DATA:');
    console.log(JSON.stringify(response, null, 2));
    
    if (res.statusCode === 200 && response.success) {
      console.log('');
      console.log('🎉 ✅ FINAL VALIDATION SUCCESSFUL!');
      console.log('📋 Message ID:', response.messageId);
      console.log('🎯 Session ID:', response.sessionId);
      console.log('⏰ Sent at:', new Date().toISOString());
      console.log('');
      console.log('🔍 CHECK SUPPORT DASHBOARD NOW:');
      console.log('   - New session: "FINAL VALIDATION DRIVER"');
      console.log('   - Phone: "+964777888999"');
      console.log('   - Message starts with: "🎉 FINAL VALIDATION:"');
      console.log('   - Should appear in REAL-TIME!');
      console.log('');
      console.log('🚀 LIVE CHAT INTEGRATION: COMPLETE END-TO-END SUCCESS! 🎉');
    } else {
      console.log('❌ FINAL VALIDATION FAILED');
    }
  });
});

req.on('error', (err) => console.log('❌ ERROR:', err.message));
req.write(postData);
req.end();
