console.log('🚀 WizzDriver Integration Test Starting...');

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const orderId = `ORDER_${Date.now()}`;
console.log(`Creating order: ${orderId}`);

const order = {
    PK: `ORDER#${orderId}`,
    SK: 'META', 
    orderId: orderId,
    customerName: 'أحمد محمد الراشد',
    customerEmail: 'ahmed.test@wizz.iq',
    status: 'CONFIRMED',
    totalAmount: 43000,
    currency: 'IQD',
    createdAt: new Date().toISOString(),
    channel: 'mobile_app',
    regionalConfig: {
        governorate: 'baghdad',
        serviceArea: 'active'
    },
    restaurantName: 'مطعم أبو نواس',
    items: ['مشاوي مشكلة', 'سلطة فتوش'],
    estimatedDistance: 3.2,
    paymentMethod: 'CASH_ON_DELIVERY'
};

docClient.send(new PutCommand({
    TableName: 'WizzOrders_dev',
    Item: order
}))
.then(() => {
    console.log('✅ Test order created successfully!');
    console.log('📋 Order Details:');
    console.log(`   ID: ${orderId}`);
    console.log(`   Customer: ${order.customerName}`);
    console.log(`   Total: ${order.totalAmount.toLocaleString()} IQD`);
    console.log(`   Status: ${order.status}`);
    console.log('');
    console.log('📱 NEXT STEPS FOR FLUTTER TESTING:');
    console.log('1. Open your WizzDriver Flutter app');
    console.log('2. Set driver status to ONLINE');
    console.log('3. Wait for notification (appears every 60 seconds)');
    console.log('4. Test Accept/Reject functionality');
    console.log('');
    console.log('🔍 The order will appear in your Flutter app as:');
    console.log(`   • Restaurant: ${order.restaurantName}`);
    console.log(`   • Distance: ${order.estimatedDistance} km`);
    console.log(`   • Payment: ${order.paymentMethod}`);
    console.log(`   • Earning: ~6,450 IQD (15% commission)`);
})
.catch(error => {
    console.error('❌ Error:', error.message);
});
