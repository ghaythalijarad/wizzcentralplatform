const https = require('https');

const testMessage = {
  message: 'Test message from driver to support agent - Final Integration Test',
  metadata: {
    senderId: 'driver_test_123',
    senderType: 'driver',
    senderName: 'Test Driver Final',
    timestamp: new Date().toISOString()
  }
};

console.log('🧪 Testing chat bridge with updated WebSocket endpoint...');
console.log('📨 Test message:', JSON.stringify(testMessage, null, 2));

const postData = JSON.stringify(testMessage);

const options = {
  hostname: '66lrbt00z6.execute-api.us-east-1.amazonaws.com',
  port: 443,
  path: '/dev/chat/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`📡 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);

  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(responseBody);
      console.log('✅ Chat Bridge Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('🎉 SUCCESS: Message was sent successfully!');
        console.log(`📋 Session ID: ${response.sessionId}`);
        console.log(`🆔 Message ID: ${response.messageId}`);
      } else {
        console.log('⚠️ FAILED: Message was not sent successfully');
        console.log(`❌ Error: ${response.error}`);
      }
    } catch (error) {
      console.log('❌ Failed to parse response:', responseBody);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(postData);
req.end();
