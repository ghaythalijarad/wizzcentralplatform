const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: 'us-east-1'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createConfirmedOrder() {
    const orderId = `test-order-${Date.now()}`;
    const currentTime = new Date().toISOString();
    
    const orderItem = {
        PK: `ORDER#${orderId}`,
        SK: 'META',
        orderId: orderId,
        status: 'CONFIRMED', // This is the key - CONFIRMED by merchant
        createdAt: currentTime,
        updatedAt: currentTime,
        customerEmail: 'test.customer@example.com',
        customerPhone: '+9647901234567',
        pickupAddress: 'Baghdad Mall, Al-Mansour, Baghdad, Iraq',
        deliveryAddress: 'Al-Zawra Park, Al-Karkh, Baghdad, Iraq',
        pickupLatitude: 33.3152,
        pickupLongitude: 44.3661,
        deliveryLatitude: 33.3200,
        deliveryLongitude: 44.3700,
        totalAmount: 43000,
        currency: 'IQD',
        channel: 'WIZZ_DRIVER_TEST',
        restaurantName: 'Baghdad Grill Restaurant',
        restaurantId: 'rest-baghdad-001',
        items: [
            {
                name: 'Masgouf (Grilled Carp)',
                quantity: 1,
                price: 25000,
                currency: 'IQD'
            },
            {
                name: 'Iraqi Rice with Almonds',
                quantity: 1,
                price: 12000,
                currency: 'IQD'
            },
            {
                name: 'Baklava',
                quantity: 2,
                price: 3000,
                currency: 'IQD'
            }
        ],
        estimatedDeliveryTime: '45 minutes',
        paymentMethod: 'CASH',
        specialInstructions: 'Please call when arriving at building entrance',
        governorate: 'Baghdad',
        district: 'Al-Mansour',
        driverAssignmentRadius: 5000, // 5km radius
        urgencyLevel: 'NORMAL'
    };

    const params = {
        TableName: 'WizzOrders_dev',
        Item: orderItem
    };

    try {
        console.log(`🍽️ Creating CONFIRMED test order: ${orderId}`);
        console.log(`📍 Location: Baghdad (${orderItem.pickupLatitude}, ${orderItem.pickupLongitude})`);
        console.log(`💰 Total: ${orderItem.totalAmount} ${orderItem.currency}`);
        console.log(`✅ Status: ${orderItem.status}`);
        
        await dynamodb.put(params).promise();
        
        console.log('🎉 CONFIRMED order created successfully!');
        console.log(`📱 Order ID: ${orderId}`);
        console.log(`⏰ Created at: ${currentTime}`);
        console.log('🚀 This order should now trigger driver notifications!');
        
        return orderId;
    } catch (error) {
        console.error('❌ Error creating order:', error);
        throw error;
    }
}

// Create multiple confirmed orders for testing
async function createMultipleConfirmedOrders() {
    console.log('🚀 Creating multiple CONFIRMED orders for notification testing...');
    console.log('====================================================================');
    
    for (let i = 0; i < 3; i++) {
        try {
            await createConfirmedOrder();
            console.log(`\n⏳ Waiting 2 seconds before creating next order...\n`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`Failed to create order ${i + 1}:`, error.message);
        }
    }
    
    console.log('\n✅ All CONFIRMED orders created!');
    console.log('🔔 Driver notifications should now be triggered every 60 seconds');
    console.log('📱 Check the WizzDriver app for notification dialogs');
}

if (require.main === module) {
    console.log('🚀 Starting confirmed order creation script...');
    createMultipleConfirmedOrders()
        .then(() => {
            console.log('🎯 Order creation complete - monitoring for notifications...');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Script failed:', error);
            console.error('Error details:', error.stack);
            process.exit(1);
        });
}

module.exports = { createConfirmedOrder };
