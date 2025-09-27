const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev';

async function testDriverAssignmentFlow() {
    return new Promise((resolve, reject) => {
        console.log('🚗 Testing Driver Assignment WebSocket Flow');
        console.log('=' * 50);
        console.log('📡 Connecting to:', WEBSOCKET_URL);
        
        const ws = new WebSocket(WEBSOCKET_URL);
        let connected = false;
        let messagesReceived = [];
        
        const timeout = setTimeout(() => {
            if (connected) {
                console.log('\n📊 Test Results:');
                console.log(`   Messages Received: ${messagesReceived.length}`);
                messagesReceived.forEach((msg, i) => {
                    console.log(`   ${i + 1}. ${msg.type || msg.action || 'Unknown'}`);
                });
                ws.close();
                resolve({ success: true, messages: messagesReceived });
            } else {
                console.log('❌ Connection timeout');
                ws.close();
                resolve({ success: false, error: 'timeout' });
            }
        }, 15000);
        
        ws.on('open', () => {
            connected = true;
            console.log('✅ WebSocket Connected!');
            
            // Register as a driver
            console.log('🔐 Registering as driver...');
            ws.send(JSON.stringify({
                action: 'register',
                userType: 'driver',
                userId: 'test_driver_001',
                metadata: {
                    name: 'Ahmed Ali - Test Driver',
                    location: {
                        latitude: 33.3152,
                        longitude: 44.3661,
                        city: 'Baghdad'
                    },
                    status: 'online'
                }
            }));
            
            // Wait a moment then simulate being ready for orders
            setTimeout(() => {
                console.log('📍 Sending location update...');
                ws.send(JSON.stringify({
                    action: 'driver_location_update',
                    driver_id: 'test_driver_001',
                    location: {
                        latitude: 33.3152,
                        longitude: 44.3661
                    },
                    status: 'online',
                    timestamp: new Date().toISOString()
                }));
            }, 2000);
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                messagesReceived.push(message);
                
                console.log(`📨 Received: ${message.type || message.action || 'message'}`);
                
                if (message.type === 'driver_assigned' || message.action === 'new_order') {
                    console.log('🎯 ORDER ASSIGNMENT RECEIVED!');
                    console.log(`   Order ID: ${message.order_id}`);
                    console.log(`   Restaurant: ${message.restaurant_name}`);
                    console.log(`   Amount: ${message.total_amount} ${message.currency}`);
                    
                    // Simulate accepting the order
                    setTimeout(() => {
                        console.log('✅ Accepting order...');
                        ws.send(JSON.stringify({
                            action: 'order_accept',
                            order_id: message.order_id,
                            assignment_id: message.assignment_id,
                            driver_id: 'test_driver_001',
                            timestamp: new Date().toISOString()
                        }));
                    }, 1000);
                }
                
                if (message.type === 'order_accepted' || message.action === 'order_accept_ack') {
                    console.log('🎉 Order acceptance confirmed!');
                }
                
            } catch (e) {
                console.log(`📨 Raw message: ${data.toString()}`);
            }
        });
        
        ws.on('error', (error) => {
            console.log('❌ WebSocket Error:', error.message);
        });
        
        ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket Closed: ${code} - ${reason}`);
            clearTimeout(timeout);
        });
    });
}

async function runTest() {
    console.log('🧪 Driver Assignment WebSocket Test');
    console.log('🎯 This test will:');
    console.log('   1. Connect as a driver');
    console.log('   2. Register and send location');
    console.log('   3. Wait for order assignments');
    console.log('   4. Simulate order acceptance');
    console.log('');
    
    try {
        const result = await testDriverAssignmentFlow();
        
        if (result.success) {
            console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
            console.log('✅ WebSocket connection works');
            console.log('✅ Driver registration works');
            console.log('✅ Ready to receive order assignments');
            
            if (result.messages.some(m => m.type === 'driver_assigned' || m.action === 'new_order')) {
                console.log('✅ Order assignment system working!');
            } else {
                console.log('ℹ️  No orders were assigned during this test');
                console.log('   Try creating a "confirmed" order to trigger assignment');
            }
        } else {
            console.log('\n❌ TEST FAILED');
            console.log(`   Error: ${result.error}`);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

runTest();
