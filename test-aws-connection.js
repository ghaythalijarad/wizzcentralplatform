const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function testConnection() {
    console.log('Testing AWS DynamoDB connection...');
    
    try {
        // Test with a simple item
        const testItem = {
            regionId: 'TEST_REGION',
            regionName: 'Test Region',
            regionNameArabic: 'منطقة تجريبية',
            level: 0,
            countryCode: 'IQ'
        };
        
        const command = new PutCommand({
            TableName: 'WizzCentral_Regions',
            Item: testItem
        });
        
        await docClient.send(command);
        console.log('✅ Connection successful! Test item inserted.');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

testConnection();
