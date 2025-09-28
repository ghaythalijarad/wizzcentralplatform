
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Configure the AWS SDK
const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = 'WizzOrders';

async function testDynamoDBConnection() {
    const testId = `TEST_${Date.now()}`;
    console.log(`🚀 Attempting to write to DynamoDB table: ${ORDERS_TABLE}`);
    console.log(`   Region: us-east-1`);
    console.log(`   Test Item ID: ${testId}`);

    try {
        const command = new PutCommand({
            TableName: ORDERS_TABLE,
            Item: {
                PK: `TEST#${testId}`,
                SK: `TEST#${testId}`,
                testId: testId,
                createdAt: new Date().toISOString(),
                message: 'This is a connection test.'
            }
        });

        console.log('   ⏳ Sending PutCommand to DynamoDB...');
        await docClient.send(command);
        console.log('   ✅ Successfully wrote item to DynamoDB!');
        console.log('🎉 DynamoDB connection test PASSED.');

    } catch (error) {
        console.error('   ❌ Error writing to DynamoDB:', error.name);
        console.error('   Message:', error.message);
        console.error('   Stack:', error.stack);
        console.log('🔥 DynamoDB connection test FAILED.');
    }
}

testDynamoDBConnection();
