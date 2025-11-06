#!/usr/bin/env node
/**
 * Quick test to verify DynamoDB connection and scan regions
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamoDB = DynamoDBDocumentClient.from(client);

async function testConnection() {
    console.log('Testing DynamoDB connection...');
    
    try {
        const result = await dynamoDB.send(new ScanCommand({
            TableName: 'WizzCentral_Regions',
            Limit: 3
        }));
        
        console.log(`✅ Successfully connected to DynamoDB`);
        console.log(`✅ Found ${result.Items.length} items (limited to 3)`);
        console.log('\nSample item fields:');
        if (result.Items[0]) {
            console.log(Object.keys(result.Items[0]).join(', '));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testConnection();
