const AWS = require('aws-sdk');

// Configure AWS with explicit region
const dynamodb = new AWS.DynamoDB({
    region: 'us-east-1'
});

const orderId = `ORDER_${Date.now()}`;
console.log(`Creating CONFIRMED order: ${orderId}`);

const params = {
    TableName: 'WizzOrders_dev',
    Item: {
        'PK': { S: `ORDER#${orderId}` },
        'SK': { S: 'META' },
        'orderId': { S: orderId },
        'status': { S: 'CONFIRMED' },
        'createdAt': { S: new Date().toISOString() },
        'updatedAt': { S: new Date().toISOString() },
        'customerName': { S: 'أحمد محمد البغدادي' },
        'customerEmail': { S: 'test@example.com' },
        'customerPhone': { S: '+9647901234567' },
        'totalAmount': { N: '43000' },
        'currency': { S: 'IQD' },
        'pickupLatitude': { N: '33.3152' },
        'pickupLongitude': { N: '44.3661' },
        'deliveryLatitude': { N: '33.3200' },
        'deliveryLongitude': { N: '44.3700' },
        'pickupAddress': { S: 'Baghdad Mall, Al-Mansour, Baghdad' },
        'deliveryAddress': { S: 'Al-Zawra Park, Baghdad' },
        'restaurantName': { S: 'مطعم بغداد الأصيل' },
        'paymentMethod': { S: 'CASH' },
        'channel': { S: 'WIZZ_DRIVER_TEST' },
        'governorate': { S: 'Baghdad' }
    }
};

dynamodb.putItem(params, (err, data) => {
    if (err) {
        console.error('Error creating order:', err);
    } else {
        console.log('✅ CONFIRMED order created successfully!');
        console.log('Order ID:', orderId);
        console.log('Status: CONFIRMED');
        console.log('Location: Baghdad (33.3152, 44.3661)');
        console.log('💡 This order should now appear in the Flutter app notifications');
    }
});
