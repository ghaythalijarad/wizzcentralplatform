#!/usr/bin/env node

/**
 * Test Flutter Message to Support Dashboard
 * This simulates the Flutter app sending a message via HTTP bridge
 */

const http = require('http');

console.log('🧪 Testing Flutter App → Support Dashboard Message Flow');
console.log('====================================================');

// Test message mimicking what Flutter app would send
const testMessage = {
    participantToken: 'test-driver-001',
    message: '🚗 Hello from Flutter Driver App! I need assistance with my current delivery order. The customer address seems incorrect.',
    contentType: 'text/plain',
    metadata: {
        senderId: 'test-driver-flutter-001',
        senderType: 'driver',
        senderName: 'أحمد الشامي (Test Driver)',
        timestamp: new Date().toISOString(),
        driverId: 'test-driver-flutter-001',
        driverName: 'أحمد الشامي (Test Driver)',
        driverPhone: '+9647801234567',
        platform: 'flutter',
        source: 'wizzcentral_support_chat_service',
        context: {
            currentLocation: {
                latitude: 33.3152,
                longitude: 44.3661,
                address: 'Baghdad, Iraq'
            },
            currentOrder: {
                orderId: 'ORD-2025-001',
                customerName: 'فاطمة علي',
                deliveryAddress: 'شارع الصدر، بغداد'
            }
        }
    }
};

const postData = JSON.stringify(testMessage);

const options = {
    hostname: 'localhost',
    port: 8087,
    path: '/chat/send',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('📱 Sending test message from Flutter driver...');
console.log('🎯 Target: http://localhost:8087/chat/send');
console.log('👤 Driver: أحمد الشامي (Test Driver)');
console.log('📝 Message preview:', testMessage.message.substring(0, 50) + '...');
console.log('');

const req = http.request(options, (res) => {
    console.log(`📊 HTTP Status: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(responseData);
            console.log('✅ Response received:');
            console.log('   Success:', response.success);
            console.log('   Message ID:', response.messageId);
            console.log('   Session ID:', response.sessionId);
            console.log('   Bridged to WebSocket:', response.bridged);
            console.log('   Response:', response.message);
            console.log('');
            
            if (response.success) {
                console.log('🎉 SUCCESS! Message sent to support dashboard!');
                console.log('');
                console.log('👀 CHECK YOUR SUPPORT DASHBOARD:');
                console.log('🔗 http://localhost:5173/pages/support.html');
                console.log('');
                console.log('You should see the Arabic driver message appear in real-time!');
            } else {
                console.log('❌ FAILED! Message was not sent successfully.');
                console.log('Error:', response.error);
            }
        } catch (e) {
            console.log('📄 Raw response:');
            console.log(responseData);
        }
    });
});

req.on('error', (err) => {
    console.error('❌ Request error:', err.message);
    console.log('');
    console.log('💡 Make sure the chat message bridge is running:');
    console.log('cd /Users/ghaythallaheebi/wizzcentralplatform');
    console.log('node chat-message-bridge.cjs');
});

req.write(postData);
req.end();
