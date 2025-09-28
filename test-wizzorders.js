const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function checkWizzOrders() {
    try {
        console.log('📊 Scanning WizzOrders table...');
        
        const params = {
            TableName: 'WizzOrders',
            Limit: 10
        };
        
        const result = await dynamodb.scan(params).promise();
        
        console.log(`✅ Found ${result.Items.length} items in WizzOrders table`);
        
        if (result.Items.length > 0) {
            console.log('📋 Sample orders:');
            result.Items.forEach((item, index) => {
                console.log(`${index + 1}. ${JSON.stringify(item, null, 2)}`);
            });
        } else {
            console.log('📭 No orders found in table');
        }
        
    } catch (error) {
        console.error('❌ Error scanning WizzOrders table:', error);
    }
}

checkWizzOrders();
