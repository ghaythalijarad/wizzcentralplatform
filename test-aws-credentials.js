#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

async function testAWSCredentials() {
    console.log('🔐 Starting AWS Credentials Test...');
    console.log('🕐 Time:', new Date().toISOString());
    
    const client = new DynamoDBClient({ 
        region: 'us-east-1',
        requestTimeout: 10000,  // 10 second timeout
        connectTimeout: 5000    // 5 second connection timeout
    });
    const docClient = DynamoDBDocumentClient.from(client);

    console.log('🔐 Testing AWS Credentials...');
    console.log('=' .repeat(50));

    try {
        // Test 1: List tables (simple operation)
        console.log('1️⃣ Testing DynamoDB access...');
        
        const command = new ScanCommand({
            TableName: 'WizzUser_orders_dev',
            Limit: 1,
            Select: 'COUNT'
        });

        const result = await docClient.send(command);
        
        console.log('✅ AWS Credentials are VALID!');
        console.log(`✅ DynamoDB Access: SUCCESS`);
        console.log(`✅ Table exists: WizzUser_orders_dev`);
        console.log(`✅ Items count check: SUCCESS`);
        
        return true;

    } catch (error) {
        console.error('❌ AWS Credentials Test FAILED:');
        console.error('Error:', error.message);
        
        if (error.name === 'CredentialsProviderError') {
            console.error('🔑 Issue: Credentials expired or invalid');
            console.error('💡 Solution: Run "aws sso login --profile wizz-drivers-ghayth-dev"');
        } else if (error.name === 'ResourceNotFoundException') {
            console.error('🗃️  Issue: DynamoDB table not found');
        } else if (error.name === 'AccessDeniedException') {
            console.error('🚫 Issue: Access denied - check permissions');
        } else {
            console.error('🌐 Issue: Network or other error');
        }
        
        return false;
    }
}

// Run the test
testAWSCredentials()
    .then(success => {
        if (success) {
            console.log('\n🎉 Credentials test PASSED!');
            console.log('✅ You can now run your Flutter order test script');
            process.exit(0);
        } else {
            console.log('\n❌ Credentials test FAILED!');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    });
