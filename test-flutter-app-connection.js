#!/usr/bin/env node

/**
 * Test Flutter App Connection with Enhanced WebSocket Handler
 * This script simulates exactly what the Flutter app does to connect to the chat system
 */

import WebSocket from 'ws';

console.log('📱 TESTING FLUTTER APP CONNECTION TO ENHANCED HANDLER');
console.log('===================================================');
console.log('Date:', new Date().toISOString());
console.log('');

// Configuration matching Flutter app
const CONFIG = {
    wsEndpoint: 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev',
    driverId: 'test-driver-001',
    driverName: 'Test Driver',
    businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
};

console.log('📋 Configuration:');
console.log('  WebSocket Endpoint:', CONFIG.wsEndpoint);
console.log('  Driver ID:', CONFIG.driverId);
console.log('  Business ID:', CONFIG.businessId);
console.log('');

// Track test results
const testResults = {
    connection: false,
    joinChannel: false,
    chatInit: false,
    sendMessage: false,
    receiveResponse: false
};

let messages = [];

async function testFlutterAppConnection() {
    console.log('🔌 Step 1: Connecting to WebSocket...');
    
    return new Promise((resolve) => {
        const ws = new WebSocket(CONFIG.wsEndpoint);
        
        ws.on('open', () => {
            console.log('✅ WebSocket connected successfully');
            testResults.connection = true;
            
            // Step 2: Join chat channel (like Flutter app does)
            console.log('🏷️  Step 2: Joining chat channel...');
            const joinMessage = {
                action: 'join_channel',
                channelId: 'driver-support',
                userType: 'driver',
                driverId: CONFIG.driverId,
                businessId: CONFIG.businessId
            };
            
            ws.send(JSON.stringify(joinMessage));
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📥 Received:', JSON.stringify(message, null, 2));
                messages.push(message);
                
                if (message.type === 'channel_joined') {
                    testResults.joinChannel = true;
                    console.log('✅ Successfully joined chat channel');
                    
                    // Step 3: Initialize chat session
                    console.log('💬 Step 3: Initializing chat session...');
                    const chatInitMessage = {
                        action: 'chat_init',
                        driverId: CONFIG.driverId,
                        driverName: CONFIG.driverName,
                        businessId: CONFIG.businessId,
                        userType: 'driver',
                        platform: 'flutter'
                    };
                    
                    ws.send(JSON.stringify(chatInitMessage));
                } else if (message.type === 'session_created' || message.type === 'new_chat_session') {
                    testResults.chatInit = true;
                    console.log('✅ Chat session initialized successfully');
                    
                    // Step 4: Send test message
                    console.log('📤 Step 4: Sending test message...');
                    const chatMessage = {
                        action: 'chat_message',
                        sessionId: message.sessionId || 'default-session',
                        content: 'Hello from Flutter app! This is a test message.',
                        senderId: CONFIG.driverId,
                        senderName: CONFIG.driverName,
                        userType: 'driver',
                        timestamp: new Date().toISOString()
                    };
                    
                    ws.send(JSON.stringify(chatMessage));
                    testResults.sendMessage = true;
                } else if (message.type === 'message_received' || message.type === 'message_sent') {
                    testResults.receiveResponse = true;
                    console.log('✅ Message processed successfully');
                }
            } catch (error) {
                console.log('❌ Error parsing message:', error.message);
                console.log('   Raw data:', data.toString());
            }
        });
        
        ws.on('error', (error) => {
            console.log('❌ WebSocket error:', error.message);
        });
        
        ws.on('close', (code, reason) => {
            console.log(`🔌 Connection closed: ${code} - ${reason}`);
            showResults();
            resolve();
        });
        
        // Auto-close after 30 seconds
        setTimeout(() => {
            console.log('⏰ Test timeout reached');
            ws.close();
        }, 30000);
    });
}

function showResults() {
    console.log('\n📊 FLUTTER APP CONNECTION TEST RESULTS');
    console.log('=====================================');
    
    const overallSuccess = Object.values(testResults).every(result => result);
    
    console.log('Connection Results:');
    console.log(`  ✅ WebSocket Connection: ${testResults.connection ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Join Channel: ${testResults.joinChannel ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Chat Initialization: ${testResults.chatInit ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Send Message: ${testResults.sendMessage ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Receive Response: ${testResults.receiveResponse ? 'PASS' : 'FAIL'}`);
    
    console.log('');
    console.log(`📋 Overall Test Result: ${overallSuccess ? '🎉 SUCCESS' : '❌ PARTIAL'}`);
    
    if (overallSuccess) {
        console.log('');
        console.log('🎯 EXCELLENT! Flutter app can successfully:');
        console.log('   • Connect to the enhanced WebSocket handler');
        console.log('   • Join chat channels');
        console.log('   • Initialize chat sessions');
        console.log('   • Send and receive messages');
        console.log('');
        console.log('✅ Ready for Flutter app testing!');
    } else {
        console.log('');
        console.log('🔧 Issues detected. Check individual test results above.');
    }
    
    console.log('');
    console.log(`📨 Total messages exchanged: ${messages.length}`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Test actual Flutter app with these same actions');
    console.log('   2. Verify Central Platform agents can see driver messages');
    console.log('   3. Test end-to-end message flow');
}

// Run the test
testFlutterAppConnection().catch(console.error);
