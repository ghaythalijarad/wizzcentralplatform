const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const orderId = `ORDER_${Date.now()}`;
const testOrder = {
    PK: `ORDER#${orderId}`,
    SK: 'META',
    orderId: orderId,
    customerEmail: 'ahmed.test@wizz.iq',
    customerName: 'أحمد محمد التجريبي',
    status: 'NOT_ASSIGNED',
    totalAmount: 43000,
    currency: 'IQD',
    createdAt: new Date().toISOString(),
    channel: 'mobile_app',
    regionalConfig: {
        governorate: 'baghdad',
        serviceArea: 'active'
    }
};

docClient.send(new PutCommand({
    TableName: 'WizzOrders_dev',
    Item: testOrder
}))
.then(() => {
    console.log('✅ Test order created:', orderId);
    console.log('📋 Details:', JSON.stringify(testOrder, null, 2));
})
.catch(error => {
    console.error('❌ Error:', error.message);
});
