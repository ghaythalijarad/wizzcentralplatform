#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function createConfirmedOrderAndTest() {
    const testOrderId = `CONFIRMED_${Date.now()}`;
    
    console.log('🚀 Creating CONFIRMED Order for Driver Assignment Test');
    console.log('=' * 60);
    console.log(`📦 Order ID: ${testOrderId}`);
    
    try {
        // Create order with CONFIRMED status directly
        const orderData = {
            PK: `ORDER#${testOrderId}`,
            SK: `ORDER#${testOrderId}`,
            orderId: testOrderId,
            status: 'confirmed', // This should trigger driver assignment
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            confirmedAt: new Date().toISOString(), // Mark when confirmed
            
            // Customer info
            customerName: 'سارة أحمد البغدادية',
            customerEmail: 'sara.ahmed@test.com',
            customerPhone: '+9647901234567',
            
            // Order details
            totalAmount: 35000,
            currency: 'IQD',
            estimatedEarnings: 10000, // Driver earnings
            
            // Locations (Baghdad coordinates)
            pickupLatitude: 33.3152,
            pickupLongitude: 44.3661,
            deliveryLatitude: 33.3200,
            deliveryLongitude: 44.3700,
            pickupAddress: 'مطعم شاورما بغداد، الكرادة الداخلية',
            deliveryAddress: 'شارع فلسطين، حي الجادرية، بغداد',
            
            // Restaurant info
            restaurantName: 'مطعم شاورما بغداد',
            restaurantId: 'restaurant_001',
            
            // Payment & delivery
            paymentMethod: 'CASH',
            deliveryType: 'delivery',
            channel: 'WIZZ_CONFIRMED_TEST',
            governorate: 'Baghdad',
            district: 'Al-Karrada',
            
            // Assignment info
            assignmentStatus: 'pending', // Ready for assignment
            validatedForAssignment: true,
            
            // Items
            items: [
                {
                    name: 'شاورما لحم كبير',
                    quantity: 2,
                    price: 15000,
                    total: 30000
                },
                {
                    name: 'بطاطس مقلية',
                    quantity: 1,
                    price: 5000,
                    total: 5000
                }
            ],
            
            entityType: 'order'
        };

        console.log('📝 Creating order in DynamoDB...');
        await docClient.send(new PutCommand({
            TableName: 'WizzOrders',
            Item: orderData
        }));

        console.log('✅ Order created successfully!');
        console.log('');
        console.log('📋 Order Details:');
        console.log(`   Status: ${orderData.status} ✅`);
        console.log(`   Customer: ${orderData.customerName}`);
        console.log(`   Restaurant: ${orderData.restaurantName}`);
        console.log(`   Amount: ${orderData.totalAmount} ${orderData.currency}`);
        console.log(`   Driver Earnings: ${orderData.estimatedEarnings} IQD`);
        console.log(`   Pickup: ${orderData.pickupAddress}`);
        console.log(`   Delivery: ${orderData.deliveryAddress}`);
        console.log('');
        
        console.log('🔍 Expected System Behavior:');
        console.log('   1. DynamoDB Stream detects the CONFIRMED status');
        console.log('   2. order-stream-processor Lambda processes the change');
        console.log('   3. Status "confirmed" is in ASSIGNABLE_STATUSES array');
        console.log('   4. Driver assignment service finds available drivers');
        console.log('   5. WebSocket notifications sent to nearby drivers');
        console.log('   6. Driver accepts/rejects the order');
        console.log('');
        
        // Wait a moment then check if anything changed
        console.log('⏳ Waiting 5 seconds to check for assignment...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if order was updated with driver assignment
        console.log('🔍 Checking for driver assignment...');
        const updatedOrder = await docClient.send(new GetCommand({
            TableName: 'WizzOrders',
            Key: {
                PK: `ORDER#${testOrderId}`,
                SK: `ORDER#${testOrderId}`
            }
        }));
        
        if (updatedOrder.Item) {
            console.log('📊 Order Status Check:');
            console.log(`   Status: ${updatedOrder.Item.status}`);
            if (updatedOrder.Item.driverId) {
                console.log(`   ✅ Driver Assigned: ${updatedOrder.Item.driverId}`);
            } else {
                console.log('   ⏳ No driver assigned yet (may still be processing)');
            }
            if (updatedOrder.Item.assignmentAttempts) {
                console.log(`   📞 Assignment Attempts: ${updatedOrder.Item.assignmentAttempts}`);
            }
        }
        
        console.log('');
        console.log('📱 Monitor these systems:');
        console.log('   • WebSocket endpoint: wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev');
        console.log('   • CloudWatch logs: /aws/lambda/order-receiver-stream-processor-dev-v1');
        console.log('   • DynamoDB table: WizzOrders');
        console.log('   • Driver connections: WizzUser_websocket_connections_dev');
        console.log('');
        console.log('🎯 Test order ready for system validation!');
        
        return testOrderId;
        
    } catch (error) {
        console.error('❌ Error creating confirmed order:', error);
        throw error;
    }
}

// Run the test
createConfirmedOrderAndTest()
    .then(orderId => {
        console.log(`\n🏁 Confirmed order ${orderId} created and ready for monitoring`);
        console.log('💡 The system should now automatically attempt driver assignment');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
