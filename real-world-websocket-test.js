#!/usr/bin/env node
/**
 * Real-World WebSocket Integration Test
 * Tests actual notification delivery from WizzCentralPlatform to WizzDriver
 * using the enhanced WebSocket handler
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev';
const TEST_ORDER_ID = 'ORDER_1758753546091';

console.log('🌍 Real-World WebSocket Integration Test');
console.log('=====================================');
console.log(`🔗 WebSocket URL: ${WEBSOCKET_URL}`);
console.log(`📋 Test Order ID: ${TEST_ORDER_ID}`);
console.log('=====================================');

// Simulate WizzDriver connection
function simulateDriverConnection() {
    return new Promise((resolve, reject) => {
        console.log('\n🚗 Simulating WizzDriver Connection...');
        
        const driverWs = new WebSocket(WEBSOCKET_URL);
        let testResults = {
            connection: false,
            subscription: false,
            orderReceived: false,
            orderAccepted: false,
            statusUpdated: false
        };

        driverWs.on('open', () => {
            console.log('✅ Driver WebSocket connected successfully');
            testResults.connection = true;
            
            // Subscribe as driver
            const subscribeMessage = {
                action: 'subscribe',
                userType: 'driver',
                userId: 'driver_test_123',
                region: 'baghdad',
                latitude: 33.3085,
                longitude: 44.3937
            };
            
            console.log('📤 Driver subscribing:', JSON.stringify(subscribeMessage, null, 2));
            driverWs.send(JSON.stringify(subscribeMessage));
        });

        driverWs.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📥 Driver received:', JSON.stringify(message, null, 2));
                
                switch (message.type) {
                    case 'subscription_confirmed':
                        console.log('✅ Driver subscription confirmed');
                        testResults.subscription = true;
                        
                        // After subscription, simulate order assignment
                        setTimeout(() => {
                            simulateOrderAssignment(driverWs, testResults, resolve);
                        }, 2000);
                        break;
                        
                    case 'new_order':
                    case 'order_assignment':
                        console.log('🎯 NEW ORDER RECEIVED!');
                        console.log(`   Order ID: ${message.orderId || message.data?.orderId}`);
                        testResults.orderReceived = true;
                        
                        // Accept the order
                        setTimeout(() => {
                            const acceptMessage = {
                                action: 'order_accept',
                                orderId: message.orderId || message.data?.orderId,
                                driverId: 'driver_test_123',
                                timestamp: new Date().toISOString()
                            };
                            
                            console.log('📤 Driver accepting order:', JSON.stringify(acceptMessage, null, 2));
                            driverWs.send(JSON.stringify(acceptMessage));
                        }, 1000);
                        break;
                        
                    case 'order_accept_ack':
                        console.log('✅ ORDER ACCEPTANCE CONFIRMED!');
                        testResults.orderAccepted = true;
                        
                        // Update order status
                        setTimeout(() => {
                            const statusUpdate = {
                                action: 'order_status_update',
                                orderId: TEST_ORDER_ID,
                                driverId: 'driver_test_123',
                                status: 'picked_up',
                                location: {
                                    lat: 33.3085,
                                    lng: 44.3937
                                },
                                timestamp: new Date().toISOString()
                            };
                            
                            console.log('📤 Driver updating status:', JSON.stringify(statusUpdate, null, 2));
                            driverWs.send(JSON.stringify(statusUpdate));
                        }, 1000);
                        break;
                        
                    case 'order_status_update_ack':
                        console.log('✅ STATUS UPDATE CONFIRMED!');
                        testResults.statusUpdated = true;
                        
                        // Complete the test
                        setTimeout(() => {
                            driverWs.close();
                            resolve(testResults);
                        }, 1000);
                        break;
                        
                    default:
                        console.log(`📝 Other message type: ${message.type}`);
                }
                
            } catch (error) {
                console.error('❌ Error parsing message:', error);
            }
        });

        driverWs.on('error', (error) => {
            console.error('❌ Driver WebSocket error:', error);
            reject(error);
        });

        driverWs.on('close', () => {
            console.log('🔌 Driver WebSocket connection closed');
        });
    });
}

// Simulate order assignment from WizzCentral
function simulateOrderAssignment(driverWs, testResults, resolve) {
    console.log('\n🏢 Simulating Order Assignment from WizzCentral...');
    
    // Simulate central platform assigning order to driver
    const centralWs = new WebSocket(WEBSOCKET_URL);
    
    centralWs.on('open', () => {
        console.log('✅ Central platform connected');
        
        // Subscribe as business
        const businessSubscribe = {
            action: 'subscribe',
            userType: 'business',
            userId: 'central_platform',
            region: 'baghdad'
        };
        
        centralWs.send(JSON.stringify(businessSubscribe));
        
        // Send order assignment after brief delay
        setTimeout(() => {
            const orderAssignment = {
                action: 'new_order',
                orderId: TEST_ORDER_ID,
                targetUserId: 'driver_test_123',
                customerName: 'أحمد محمد التجريبي',
                customerPhone: '+964 771 123 4567',
                restaurantName: 'مطعم التجربة',
                totalAmount: 43000,
                currency: 'IQD',
                pickupLocation: {
                    lat: 33.3085,
                    lng: 44.3937,
                    address: 'الكرادة الداخل'
                },
                deliveryLocation: {
                    lat: 33.3152,
                    lng: 44.3661,
                    address: 'منطقة الجادرية'
                },
                estimatedDeliveryTime: 30,
                priority: 'high',
                timestamp: new Date().toISOString()
            };
            
            console.log('📤 Central assigning order:', JSON.stringify(orderAssignment, null, 2));
            centralWs.send(JSON.stringify(orderAssignment));
            
            // Close central connection after sending
            setTimeout(() => {
                centralWs.close();
            }, 2000);
        }, 1000);
    });
}

// Run the comprehensive test
async function runRealWorldTest() {
    try {
        console.log('\n🚀 Starting Real-World Integration Test...');
        
        const results = await simulateDriverConnection();
        
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('=====================');
        console.log(`🔌 WebSocket Connection: ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📡 Driver Subscription: ${results.subscription ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📥 Order Notification: ${results.orderReceived ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`✅ Order Acceptance: ${results.orderAccepted ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📝 Status Update: ${results.statusUpdated ? '✅ PASS' : '❌ FAIL'}`);
        
        const passCount = Object.values(results).filter(Boolean).length;
        const totalTests = Object.keys(results).length;
        const successRate = Math.round((passCount / totalTests) * 100);
        
        console.log(`\n🎯 Overall Success Rate: ${successRate}% (${passCount}/${totalTests})`);
        
        if (successRate === 100) {
            console.log('\n🎉 PERFECT! Real-world WebSocket integration is working flawlessly!');
            console.log('   Enhanced WebSocket handler successfully replaced unknown_message_ack');
            console.log('   Your Flutter driver app should work perfectly with the deployed system!');
        } else if (successRate >= 80) {
            console.log('\n✅ EXCELLENT! Real-world integration is working well with minor issues');
        } else {
            console.log('\n⚠️  Some issues detected in real-world integration');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
    }
}

// Check Flutter app status
async function checkFlutterAppStatus() {
    console.log('\n📱 Checking Flutter App Status...');
    console.log('================================');
    console.log('ℹ️  Make sure your Flutter WizzDriver app is running and connected');
    console.log('ℹ️  The app should be able to receive the test notifications');
    console.log('ℹ️  Check the app logs for WebSocket connection status');
}

// Run everything
console.log('🎬 Initializing Real-World Test Environment...');
setTimeout(async () => {
    await checkFlutterAppStatus();
    await runRealWorldTest();
}, 2000);
