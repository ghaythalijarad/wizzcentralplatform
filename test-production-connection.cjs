#!/usr/bin/env node

/**
 * Test production connection from Flutter app to hosted Central Platform
 * This simulates what the Flutter app should do when sending messages
 */

const WebSocket = require('ws');

console.log('🧪 Testing Flutter App → Hosted Central Platform Connection');
console.log('==========================================================');
console.log('Date:', new Date().toISOString());
console.log('');

// Production configuration (same as what Flutter app uses)
const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

console.log('📋 Configuration:');
console.log('  WebSocket URL:', WEBSOCKET_URL);
console.log('  Business ID:', BUSINESS_ID);
console.log('  Central Platform:', 'https://main.d2f5oacwil9cbi.amplifyapp.com');
console.log('');

// Step 1: Connect as a support agent to monitor incoming messages
console.log('1️⃣ Connecting as support agent to monitor messages...');
const agentWS = new WebSocket(`${WEBSOCKET_URL}?userType=support&agentId=production-test-agent&businessId=${BUSINESS_ID}`);

agentWS.on('open', () => {
    console.log('✅ Support agent connected');
    
    // Send agent connect message
    agentWS.send(JSON.stringify({
        type: 'agent_connect',
        agentId: 'production-test-agent',
        agentName: 'Production Test Agent',
        businessId: BUSINESS_ID
    }));
    
    console.log('📡 Agent authentication sent');
});

agentWS.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        console.log(`📨 Agent received: ${message.type || 'unknown'}`);
        
        if (message.type === 'driver_message') {
            console.log('');
            console.log('🎉 SUCCESS! Driver message received by Central Platform!');
            console.log(`   Driver: ${message.driverName} (${message.driverId})`);
            console.log(`   Message: "${message.content}"`);
            console.log(`   Session: ${message.sessionId}`);
            console.log(`   Platform: ${message.metadata?.platform || 'unknown'}`);
            console.log('');
            console.log('✅ End-to-end connection working! Flutter → Central Platform ✅');
        }
    } catch (e) {
        console.log(`📨 Raw message: ${data.toString().substring(0, 100)}...`);
    }
});

agentWS.on('error', (error) => {
    console.log('❌ Agent WebSocket error:', error.message);
});

// Step 2: Connect as a driver (simulating Flutter app)
setTimeout(() => {
    console.log('2️⃣ Connecting as driver (simulating Flutter app)...');
    
    const driverWS = new WebSocket(`${WEBSOCKET_URL}?userType=driver&driverId=production-test-driver&businessId=${BUSINESS_ID}`);
    
    driverWS.on('open', () => {
        console.log('✅ Driver connected (Flutter app simulation)');
        
        // Send driver message (same format as Flutter app would send)
        const driverMessage = {
            type: 'driver_message',
            sessionId: `production-session-${Date.now()}`,
            content: 'Hello! This is a test message from the Flutter app to the Central Platform support team. Can you see this?',
            driverId: 'production-test-driver',
            driverName: 'Production Test Driver',
            businessId: BUSINESS_ID,
            timestamp: new Date().toISOString(),
            metadata: {
                platform: 'flutter',
                source: 'flutter_app'
            }
        };
        
        driverWS.send(JSON.stringify(driverMessage));
        console.log('📤 Driver message sent (simulating Flutter app)');
        console.log(`   Message: "${driverMessage.content}"`);
    });
    
    driverWS.on('error', (error) => {
        console.log('❌ Driver WebSocket error:', error.message);
    });
    
}, 2000);

// Step 3: Wait and then exit
setTimeout(() => {
    console.log('');
    console.log('🏁 Test completed. Check above for success/failure results.');
    console.log('');
    console.log('💡 If you saw "SUCCESS! Driver message received", then:');
    console.log('   ✅ Flutter app can send messages to Central Platform');
    console.log('   ✅ Support agents can receive messages from drivers');
    console.log('   ✅ End-to-end communication is working');
    console.log('');
    console.log('📱 Now test with the actual Flutter app:');
    console.log('   1. Open live chat in Flutter app');
    console.log('   2. Send a message');
    console.log('   3. Check Central Platform support page for incoming messages');
    
    process.exit(0);
}, 8000);
