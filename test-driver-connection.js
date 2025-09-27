#!/usr/bin/env node
/**
 * Test Driver WebSocket Connection
 * Simulates a driver connecting to establish WebSocket connection for order assignment testing
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev';
const TEST_DRIVER_ID = 'test-driver-' + Date.now();

console.log('🚗 Starting Test Driver WebSocket Connection');
console.log('=' .repeat(50));
console.log(`🔗 WebSocket URL: ${WEBSOCKET_URL}`);
console.log(`👤 Driver ID: ${TEST_DRIVER_ID}`);
console.log('');

const ws = new WebSocket(WEBSOCKET_URL);

ws.on('open', function() {
    console.log('✅ Driver connected to WebSocket successfully!');
    
    // Send driver registration/connection message
    const driverConnect = {
        action: 'driver_connect',
        driver_id: TEST_DRIVER_ID,
        driverId: TEST_DRIVER_ID,
        status: 'online',
        connectionStatus: 'connected',
        location: {
            latitude: 33.3152,
            longitude: 44.3661
        },
        city: 'baghdad',
        userType: 'driver',
        businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
        timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending driver connection message...');
    ws.send(JSON.stringify(driverConnect));
    
    console.log('🎯 Driver is now online and ready for order assignments!');
    console.log('📞 Keep this connection open to receive order assignments...');
    console.log('');
    console.log('✋ Press Ctrl+C to disconnect');
});

ws.on('message', function(data) {
    try {
        const message = JSON.parse(data.toString());
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`\n📨 [${timestamp}] Message received:`);
        console.log('─'.repeat(40));
        console.log(JSON.stringify(message, null, 2));
        
        // Handle different message types
        switch (message.type) {
            case 'driver_connect_ack':
                console.log('✅ Driver registration confirmed!');
                break;
            case 'order_assignment':
            case 'new_order':
                console.log('🆕 NEW ORDER ASSIGNMENT RECEIVED!');
                console.log(`📋 Order ID: ${message.orderId || message.order_id}`);
                
                // Simulate accepting the order after 3 seconds
                setTimeout(() => {
                    const acceptMessage = {
                        action: 'order_accept',
                        orderId: message.orderId || message.order_id,
                        driverId: TEST_DRIVER_ID,
                        acceptedAt: new Date().toISOString(),
                        estimatedArrival: '10 minutes'
                    };
                    
                    console.log('\n🟢 Accepting order...');
                    ws.send(JSON.stringify(acceptMessage));
                }, 3000);
                break;
            default:
                console.log(`📩 Message type: ${message.type || 'Unknown'}`);
        }
    } catch (error) {
        console.log('📨 Raw message:', data.toString());
    }
});

ws.on('error', function(error) {
    console.error('❌ WebSocket error:', error.message);
});

ws.on('close', function(code, reason) {
    console.log(`\n🔌 Driver disconnected: ${code} - ${reason || 'Connection closed'}`);
    console.log('👋 Driver is now offline');
    process.exit(0);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n\n👋 Disconnecting driver...');
    if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Driver disconnecting');
    } else {
        process.exit(0);
    }
});
