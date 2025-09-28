const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = 'WizzUser_orders_dev';

async function testOrderTableWrite() {
    const orderId = `TEST_ORDER_${Date.now()}`;
    console.log(`Attempting to write to ${ORDERS_TABLE} with orderId: ${orderId}`);

    try {
        const orderData = {
            PK: `ORDER#${orderId}`,
            SK: `ORDER#${orderId}`,
            orderId: orderId,
            status: 'test',
            createdAt: new Date().toISOString(),
        };

        await docClient.send(new PutCommand({
            TableName: ORDERS_TABLE,
            Item: orderData
        }));

        console.log('✅ Successfully wrote to WizzUser_orders_dev table.');
    } catch (error) {
        console.error('❌ Failed to write to WizzUser_orders_dev table:', error);
    }
}

testOrderTableWrite();
