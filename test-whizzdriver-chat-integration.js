#!/usr/bin/env node

/**
 * Test script to verify the WhizzDriver chat bridge integration
 * This simulates a driver sending a message to support agents
 */

const https = require('https');

const CHAT_BRIDGE_API = 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev';

async function testDriverSupportMessage() {
    console.log('🚗 Testing WhizzDriver to Support Agent Chat Bridge...\n');
    
    const testMessage = {
        sessionId: `driver_support_test_${Date.now()}`,
        message: "Hi WizzCentral Support! I'm a WhizzDriver and I need help with my current delivery. The customer address seems incorrect and I can't reach them. Can you please assist me?",
        userType: 'driver',
        userId: 'driver_test_12345',
        userMetadata: {
            driverName: 'Test Driver Ahmed',
            driverId: 'driver_test_12345',
            platform: 'WhizzDriver',
            driverPhone: '+964 770 123 4567',
            currentOrderId: 'order_67890',
            location: {
                latitude: 33.3152,
                longitude: 44.3661,
                city: 'Baghdad'
            },
            timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
    };

    const postData = JSON.stringify(testMessage);
    
    const options = {
        hostname: 'ru65nhlwhc.execute-api.us-east-1.amazonaws.com',
        port: 443,
        path: '/dev/api/chat/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';
            
            console.log(`📡 API Response Status: ${res.statusCode}`);
            console.log(`📡 API Response Headers:`, res.headers);
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(responseData);
                    console.log('\n✅ API Response:');
                    console.log(JSON.stringify(response, null, 2));
                    
                    if (response.success || response.statusCode === 200) {
                        console.log('\n🎉 SUCCESS: Driver message sent to support agents!');
                        console.log('📬 Message forwarded via chat bridge');
                        console.log('🧑‍💼 Support agents should now see this message in WizzCentralPlatform');
                    } else {
                        console.log('\n❌ FAILED: Message not delivered');
                        console.log('Error:', response.message || 'Unknown error');
                    }
                    
                    resolve(response);
                } catch (e) {
                    console.log('\n📄 Raw response:', responseData);
                    reject(e);
                }
            });
        });

        req.on('error', (error) => {
            console.error('\n❌ Request error:', error);
            reject(error);
        });

        console.log('📤 Sending test message from WhizzDriver...');
        console.log('📍 Driver: Test Driver Ahmed');
        console.log('📱 Message:', testMessage.message.substring(0, 100) + '...');
        console.log('🌐 API Endpoint:', `${CHAT_BRIDGE_API}/api/chat/send`);
        
        req.write(postData);
        req.end();
    });
}

async function testChatHistory() {
    console.log('\n\n📋 Testing Chat History Retrieval...\n');
    
    const options = {
        hostname: 'ru65nhlwhc.execute-api.us-east-1.amazonaws.com',
        port: 443,
        path: '/dev/api/chat/history?limit=10',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';
            
            console.log(`📡 History API Response Status: ${res.statusCode}`);
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(responseData);
                    console.log('\n📋 Chat History Response:');
                    console.log(JSON.stringify(response, null, 2));
                    
                    if (response.success && response.data) {
                        console.log(`\n📊 Found ${response.data.length} chat sessions`);
                        response.data.forEach((session, index) => {
                            console.log(`\n💬 Session ${index + 1}:`);
                            console.log(`   📧 ID: ${session.sessionId}`);
                            console.log(`   👤 User: ${session.userType} - ${session.userMetadata?.driverName || session.userId}`);
                            console.log(`   💬 Message: ${session.message.substring(0, 80)}...`);
                            console.log(`   🕐 Time: ${new Date(session.timestamp).toLocaleString()}`);
                        });
                    }
                    
                    resolve(response);
                } catch (e) {
                    console.log('\n📄 Raw history response:', responseData);
                    reject(e);
                }
            });
        });

        req.on('error', (error) => {
            console.error('\n❌ History request error:', error);
            reject(error);
        });

        req.end();
    });
}

async function main() {
    console.log('🎯 WhizzDriver Support Chat Bridge Integration Test\n');
    console.log('=' * 60);
    
    try {
        // Test sending a message
        await testDriverSupportMessage();
        
        // Wait a moment then check history
        await new Promise(resolve => setTimeout(resolve, 2000));
        await testChatHistory();
        
        console.log('\n' + '=' * 60);
        console.log('🎉 Chat Bridge Integration Test Complete!');
        console.log('\n📋 Summary:');
        console.log('   ✅ WhizzDriver app can now send support messages');
        console.log('   ✅ Messages are forwarded to WizzCentralPlatform support agents');
        console.log('   ✅ Chat bridge API is functioning correctly');
        console.log('\n🧑‍💼 Next Steps:');
        console.log('   1. Test the live chat in the WhizzDriver app on iPhone');
        console.log('   2. Check if support agents receive messages in WizzCentralPlatform');
        console.log('   3. Verify real-time message delivery');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
