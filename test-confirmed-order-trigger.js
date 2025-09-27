const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function testConfirmedOrderTrigger() {
    const testOrderId = `TEST_CONFIRMED_${Date.now()}`;
    
    console.log('🧪 Testing Order Status Change to "confirmed"');
    console.log('=' * 50);
    console.log(`📦 Order ID: ${testOrderId}`);
    
    try {
        // First, create a test order with "pending" status
        console.log('\n1️⃣ Creating test order with "pending" status...');
        
        const orderData = {
            PK: `ORDER#${testOrderId}`,
            SK: `ORDER#${testOrderId}`,
            orderId: testOrderId,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            customerName: 'أحمد محمد - اختبار',
            customerEmail: 'test@wizz.com',
            customerPhone: '+9647901234567',
            totalAmount: 25000,
            currency: 'IQD',
            pickupLatitude: 33.3152,
            pickupLongitude: 44.3661,
            deliveryLatitude: 33.3200,
            deliveryLongitude: 44.3700,
            pickupAddress: 'مطعم بغداد المركزي، الكرادة',
            deliveryAddress: 'شارع الرشيد، بغداد',
            restaurantName: 'مطعم بغداد المركزي',
            paymentMethod: 'CASH',
            channel: 'WIZZ_CONFIRMED_TEST',
            governorate: 'Baghdad',
            entityType: 'order'
        };

        await docClient.send(new PutCommand({
            TableName: 'WizzOrders',
            Item: orderData
        }));

        console.log('✅ Test order created successfully!');
        console.log(`   Status: ${orderData.status}`);
        console.log(`   Location: ${orderData.governorate}`);
        
        // Wait a moment
        console.log('\n⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Now update the status to "confirmed"
        console.log('\n2️⃣ Updating order status to "confirmed"...');
        
        await docClient.send(new UpdateCommand({
            TableName: 'WizzOrders',
            Key: {
                PK: `ORDER#${testOrderId}`,
                SK: `ORDER#${testOrderId}`
            },
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'confirmed',
                ':updatedAt': new Date().toISOString()
            }
        }));

        console.log('✅ Order status updated to "confirmed"!');
        console.log('\n🔍 Expected behavior:');
        console.log('   - DynamoDB Stream should trigger');
        console.log('   - order-stream-processor Lambda should process the change');
        console.log('   - Status "confirmed" is in ASSIGNABLE_STATUSES');
        console.log('   - Driver assignment process should start');
        console.log('   - WebSocket notifications should be sent');
        
        console.log('\n📊 Monitor CloudWatch logs for:');
        console.log('   - order-receiver-stream-processor-dev-v1');
        console.log('   - WebSocket connection handler');
        console.log('   - Driver assignment service');
        
        console.log('\n🎯 Test completed successfully!');
        return testOrderId;
        
    } catch (error) {
        console.error('❌ Error during test:', error);
        throw error;
    }
}

// Run the test
testConfirmedOrderTrigger()
    .then(orderId => {
        console.log(`\n🏁 Test order ${orderId} ready for monitoring`);
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
