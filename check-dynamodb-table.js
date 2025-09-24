const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function checkTable() {
    try {
        console.log('🔍 Checking DynamoDB table status...');
        
        const command = new ScanCommand({
            TableName: 'WizzCentral_Regions',
            Select: 'COUNT'
        });
        const result = await docClient.send(command);
        console.log(`📊 Total items in DynamoDB table: ${result.Count}`);
        
        // Get sample items by level
        const fullScanCommand = new ScanCommand({
            TableName: 'WizzCentral_Regions'
        });
        const fullResult = await docClient.send(fullScanCommand);
        
        const levelBreakdown = fullResult.Items.reduce((acc, item) => {
            const level = item.level;
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});
        
        console.log('\n📈 Level breakdown:');
        console.log(`   Level 0 (Country): ${levelBreakdown[0] || 0}`);
        console.log(`   Level 1 (Governorates): ${levelBreakdown[1] || 0}`);
        console.log(`   Level 2 (Districts): ${levelBreakdown[2] || 0}`);
        console.log(`   Level 3 (Neighborhoods): ${levelBreakdown[3] || 0}`);
        
        console.log('\n📋 Sample regions:');
        fullResult.Items.slice(0, 10).forEach(item => {
            console.log(`   - ${item.regionName} (${item.regionNameArabic}) - Level ${item.level}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkTable();
