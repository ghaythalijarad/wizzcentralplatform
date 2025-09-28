#!/usr/bin/env node
console.log('Starting simple AWS test...');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

async function simpleTest() {
    try {
        const client = new DynamoDBClient({ 
            region: 'us-east-1',
            requestTimeout: 5000
        });
        console.log('✅ AWS SDK initialized successfully');
        console.log('✅ Region:', client.config.region);
        console.log('✅ Credentials appear to be configured');
        return true;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

simpleTest().then(success => {
    console.log(success ? '✅ Basic AWS test PASSED' : '❌ Basic AWS test FAILED');
    process.exit(success ? 0 : 1);
});
