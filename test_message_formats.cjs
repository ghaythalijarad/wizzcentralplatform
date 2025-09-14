#!/usr/bin/env node

const WebSocket = require('ws');

console.log('🔄 Testing different message formats to find working driver message format...');

const WS_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

let ws;

function connectAndTest() {
    ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
        console.log('✅ WebSocket connected for format testing');
        
        // First authenticate as agent
        const authMessage = {
            type: 'chat_agent_connect',
            businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
        };
        
        console.log('🔐 Authenticating as chat agent...');
        ws.send(JSON.stringify(authMessage));
    });
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('📥 WebSocket Response:', JSON.stringify(message, null, 2));
            
            if (message.type === 'agent_connected') {
                console.log('✅ Agent authenticated successfully');
                
                // Wait a moment then start testing different message formats
                setTimeout(() => {
                    testMessageFormats();
                }, 1000);
            }
            
            if (message.type === 'error') {
                console.error('❌ WebSocket Error:', message.message || message.error);
            }
            
            if (message.type === 'message_sent' || message.type === 'message_delivered') {
                console.log('✅ Message was accepted and processed!');
            }
            
        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error.message);
            console.log('Raw message:', data.toString());
        }
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
    });
    
    ws.on('close', () => {
        console.log('🔌 WebSocket disconnected');
    });
}

function testMessageFormats() {
    const sessionId = 'session_04d8a438-1081-70fb-0692-58167201d24d';
    const testMessage = 'Test message format validation';
    
    // Test Format 1: Original driver_message format
    console.log('\n🧪 Testing Format 1: driver_message');
    const format1 = {
        type: 'driver_message',
        sessionId: sessionId,
        message: testMessage,
        driverId: 'test_driver_123',
        driverName: 'Test Driver',
        businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
        timestamp: new Date().toISOString()
    };
    
    setTimeout(() => {
        console.log('📤 Sending Format 1:', JSON.stringify(format1, null, 2));
        ws.send(JSON.stringify(format1));
    }, 1000);
    
    // Test Format 2: chat_message with senderType
    console.log('\n🧪 Testing Format 2: chat_message with senderType');
    const format2 = {
        type: 'chat_message',
        sessionId: sessionId,
        message: testMessage,
        content: testMessage,
        senderType: 'driver',
        senderId: 'test_driver_123',
        senderName: 'Test Driver',
        businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
        timestamp: new Date().toISOString()
    };
    
    setTimeout(() => {
        console.log('📤 Sending Format 2:', JSON.stringify(format2, null, 2));
        ws.send(JSON.stringify(format2));
    }, 3000);
    
    // Test Format 3: send_message format
    console.log('\n🧪 Testing Format 3: send_message');
    const format3 = {
        type: 'send_message',
        sessionId: sessionId,
        message: testMessage,
        senderId: 'test_driver_123',
        senderName: 'Test Driver',
        senderType: 'driver',
        businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
        timestamp: new Date().toISOString()
    };
    
    setTimeout(() => {
        console.log('📤 Sending Format 3:', JSON.stringify(format3, null, 2));
        ws.send(JSON.stringify(format3));
    }, 5000);
    
    // Test Format 4: message format (simple)
    console.log('\n🧪 Testing Format 4: message');
    const format4 = {
        type: 'message',
        sessionId: sessionId,
        message: testMessage,
        from: 'driver',
        fromId: 'test_driver_123',
        fromName: 'Test Driver',
        businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
        timestamp: new Date().toISOString()
    };
    
    setTimeout(() => {
        console.log('📤 Sending Format 4:', JSON.stringify(format4, null, 2));
        ws.send(JSON.stringify(format4));
    }, 7000);
    
    // Close connection after tests
    setTimeout(() => {
        console.log('\n🏁 All message format tests completed');
        ws.close();
    }, 10000);
}

// Start the test
connectAndTest();
