#!/usr/bin/env node
/**
 * Complete Test for Automatic Driver Assignment on Order Confirmation
 * 
 * This test verifies the complete flow:
 * 1. Driver connects to WebSocket and goes online
 * 2. Create an order with "confirmed" status
 * 3. Verify driver receives assignment notification automatically
 * 4. Driver accepts the order
 * 5. Verify order is updated with driver assignment
 */

const WebSocket = require('ws');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

// Configuration
const WEBSOCKET_URL = 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev';
const ORDERS_TABLE = 'WizzOrders_dev';
const TEST_DRIVER_ID = `test_driver_${Date.now()}`;
const TEST_ORDER_ID = `ORDER_${Date.now()}`;

// Initialize DynamoDB
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

// Test state
let ws = null;
let testResults = {
    driverConnected: false,
    orderCreated: false,
    assignmentReceived: false,
    assignmentData: null,
    errors: []
};

console.log('🚀 AUTOMATIC DRIVER ASSIGNMENT TEST');
console.log('=' .repeat(70));
console.log(`📍 Test Driver ID: ${TEST_DRIVER_ID}`);
console.log(`📦 Test Order ID: ${TEST_ORDER_ID}`);
console.log('');

/**
 * Step 1: Connect driver to WebSocket
 */
async function connectDriver() {
    return new Promise((resolve, reject) => {
        console.log('📱 Step 1: Connecting driver to WebSocket...');
        
        ws = new WebSocket(WEBSOCKET_URL);
        
        const timeout = setTimeout(() => {
            testResults.errors.push('Driver connection timeout');
            reject(new Error('Connection timeout'));
        }, 15000);
        
        ws.on('open', () => {
            console.log('   ✅ WebSocket connected');
            
            // Register as driver
            const registrationMessage = {
                action: 'driver_connect',
                type: 'driver_connect',
                driverId: TEST_DRIVER_ID,
                userId: TEST_DRIVER_ID,
                userType: 'driver',
                status: 'online',
                connectionStatus: 'connected',
                location: {
                    latitude: 33.3152,
                    longitude: 44.3661,
                    city: 'Baghdad'
                },
                timestamp: new Date().toISOString()
            };
            
            console.log('   📤 Registering driver...');
            ws.send(JSON.stringify(registrationMessage));
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                const messageType = message.type || message.action;
                
                if (messageType === 'driver_connect_ack') {
                    console.log('   ✅ Driver registered successfully');
                    testResults.driverConnected = true;
                    clearTimeout(timeout);
                    resolve();
                }
            } catch (e) {
                console.log('   📨 Raw message:', data.toString().substring(0, 100));
            }
        });
        
        ws.on('error', (error) => {
            testResults.errors.push(`WebSocket error: ${error.message}`);
            clearTimeout(timeout);
            reject(error);
        });
    });
}

/**
 * Step 2: Create order with "confirmed" status
 */
async function createConfirmedOrder() {
    console.log('\n📦 Step 2: Creating order with "confirmed" status...');
    
    try {
        const orderData = {
            PK: `ORDER#${TEST_ORDER_ID}`,
            SK: `ORDER#${TEST_ORDER_ID}`,
            orderId: TEST_ORDER_ID,
            status: 'confirmed', // This should trigger automatic assignment
            customerId: 'test_customer_001',
            customerName: 'Ahmed Ali',
            customerPhone: '+9647901234567',
            restaurantId: 'restaurant_001',
            restaurantName: 'Baghdad Restaurant',
            restaurantLocation: {
                latitude: 33.3152,
                longitude: 44.3661,
                address: 'Baghdad, Iraq'
            },
            deliveryAddress: {
                latitude: 33.3252,
                longitude: 44.3761,
                address: 'Al-Mansour, Baghdad'
            },
            items: [
                {
                    name: 'Mixed Grill',
                    quantity: 1,
                    price: 25000
                }
            ],
            totalAmount: 25000,
            currency: 'IQD',
            estimatedEarnings: 5000,
            paymentMethod: 'cash',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await dynamoDB.send(new PutCommand({
            TableName: ORDERS_TABLE,
            Item: orderData
        }));
        
        console.log('   ✅ Order created with "confirmed" status');
        console.log(`   📍 Order ID: ${TEST_ORDER_ID}`);
        testResults.orderCreated = true;
        
    } catch (error) {
        console.error('   ❌ Error creating order:', error.message);
        testResults.errors.push(`Order creation failed: ${error.message}`);
        throw error;
    }
}

/**
 * Step 3: Wait for assignment notification
 */
async function waitForAssignment() {
    return new Promise((resolve, reject) => {
        console.log('\n🔔 Step 3: Waiting for automatic driver assignment notification...');
        console.log('   ⏳ Waiting up to 30 seconds...');
        
        const timeout = setTimeout(() => {
            if (!testResults.assignmentReceived) {
                testResults.errors.push('No assignment received within 30 seconds');
                console.log('   ❌ Timeout: No assignment notification received');
                resolve(false);
            }
        }, 30000);
        
        // Listen for assignment messages
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                const messageType = message.type || message.action;
                
                console.log(`   📨 Received: ${messageType}`);
                
                // Check for assignment notification
                if (messageType === 'driver_assigned' || 
                    messageType === 'order_assignment' || 
                    messageType === 'new_order') {
                    
                    console.log('   🎉 ASSIGNMENT RECEIVED!');
                    console.log('   📋 Assignment Details:');
                    console.log(`      Order ID: ${message.order_id || message.orderId}`);
                    console.log(`      Customer: ${message.customer_name || message.customerName}`);
                    console.log(`      Restaurant: ${message.restaurant_name || message.restaurantName}`);
                    console.log(`      Amount: ${message.total_amount || message.totalAmount} ${message.currency || 'IQD'}`);
                    
                    testResults.assignmentReceived = true;
                    testResults.assignmentData = message;
                    clearTimeout(timeout);
                    resolve(true);
                }
            } catch (e) {
                // Ignore parse errors
            }
        });
    });
}

/**
 * Step 4: Accept the order
 */
async function acceptOrder() {
    console.log('\n✅ Step 4: Accepting the order...');
    
    const acceptMessage = {
        action: 'driver_assignment_response',
        type: 'driver_assignment_response',
        orderId: TEST_ORDER_ID,
        driverId: TEST_DRIVER_ID,
        response: 'accept',
        estimatedPickupTime: 15,
        timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(acceptMessage));
    console.log('   ✅ Acceptance message sent');
    
    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
}

/**
 * Step 5: Verify order assignment in database
 */
async function verifyOrderAssignment() {
    console.log('\n🔍 Step 5: Verifying order assignment in database...');
    
    try {
        const result = await dynamoDB.send(new GetCommand({
            TableName: ORDERS_TABLE,
            Key: {
                PK: `ORDER#${TEST_ORDER_ID}`,
                SK: `ORDER#${TEST_ORDER_ID}`
            }
        }));
        
        if (result.Item && result.Item.driverId === TEST_DRIVER_ID) {
            console.log('   ✅ Order successfully assigned to driver in database');
            console.log(`      Driver ID: ${result.Item.driverId}`);
            console.log(`      Order Status: ${result.Item.status}`);
            return true;
        } else {
            console.log('   ❌ Order assignment not found in database');
            testResults.errors.push('Order not assigned in database');
            return false;
        }
    } catch (error) {
        console.error('   ❌ Error verifying assignment:', error.message);
        testResults.errors.push(`Verification failed: ${error.message}`);
        return false;
    }
}

/**
 * Cleanup test data
 */
async function cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
        // Update order to mark as test
        await dynamoDB.send(new UpdateCommand({
            TableName: ORDERS_TABLE,
            Key: {
                PK: `ORDER#${TEST_ORDER_ID}`,
                SK: `ORDER#${TEST_ORDER_ID}`
            },
            UpdateExpression: 'SET #status = :status, testOrder = :test',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'test_completed',
                ':test': true
            }
        }));
        
        console.log('   ✅ Test order marked as completed');
    } catch (error) {
        console.log('   ⚠️ Cleanup warning:', error.message);
    }
    
    if (ws) {
        ws.close();
        console.log('   ✅ WebSocket connection closed');
    }
}

/**
 * Print test summary
 */
function printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    
    console.log(`\n✓ Driver Connected: ${testResults.driverConnected ? '✅' : '❌'}`);
    console.log(`✓ Order Created: ${testResults.orderCreated ? '✅' : '❌'}`);
    console.log(`✓ Assignment Received: ${testResults.assignmentReceived ? '✅' : '❌'}`);
    
    if (testResults.errors.length > 0) {
        console.log('\n❌ ERRORS:');
        testResults.errors.forEach((error, i) => {
            console.log(`   ${i + 1}. ${error}`);
        });
    }
    
    const allPassed = testResults.driverConnected && 
                      testResults.orderCreated && 
                      testResults.assignmentReceived &&
                      testResults.errors.length === 0;
    
    if (allPassed) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ Automatic driver assignment is working correctly!');
        console.log('\n📋 FLOW CONFIRMED:');
        console.log('   1. ✅ Driver connects and goes online');
        console.log('   2. ✅ Order created with "confirmed" status');
        console.log('   3. ✅ System automatically assigns driver');
        console.log('   4. ✅ Driver receives notification');
        console.log('   5. ✅ Driver can accept/reject order');
    } else {
        console.log('\n⚠️ SOME TESTS FAILED');
        console.log('Please check the errors above and review the configuration.');
    }
    
    console.log('\n' + '='.repeat(70));
}

/**
 * Run the complete test
 */
async function runTest() {
    try {
        // Step 1: Connect driver
        await connectDriver();
        
        // Wait a moment for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 2: Create confirmed order
        await createConfirmedOrder();
        
        // Step 3: Wait for assignment
        const assignmentReceived = await waitForAssignment();
        
        // Step 4: If assignment received, accept it
        if (assignmentReceived) {
            await acceptOrder();
            
            // Step 5: Verify in database
            await verifyOrderAssignment();
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        testResults.errors.push(error.message);
    } finally {
        await cleanup();
        printSummary();
        process.exit(testResults.errors.length === 0 ? 0 : 1);
    }
}

// Run the test
console.log('Starting test in 2 seconds...\n');
setTimeout(runTest, 2000);
