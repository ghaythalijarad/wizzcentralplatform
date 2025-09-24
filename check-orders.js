const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

console.log('Checking WizzOrders_dev table...');
docClient.send(new ScanCommand({
    TableName: 'WizzOrders_dev',
    Limit: 5
}))
.then(result => {
    console.log(`Found ${result.Items.length} orders:`);
    result.Items.forEach(item => {
        console.log(`- ${item.PK} | ${item.status} | ${item.createdAt}`);
    });
})
.catch(error => {
    console.error('Error:', error.message);
});
