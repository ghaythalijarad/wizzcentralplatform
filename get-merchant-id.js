#!/usr/bin/env node
/**
 * Quick test to get a merchant ID from DynamoDB
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

require('dotenv').config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = DynamoDBDocumentClient.from(client);

async function getFirstMerchant() {
    const tableName = process.env.BUSINESSES_TABLE || 'WhizzMerchants_Businesses';
    
    console.log(`📋 Scanning table: ${tableName}`);
    
    const result = await dynamodb.send(new ScanCommand({
        TableName: tableName,
        Limit: 5
    }));
    
    if (!result.Items || result.Items.length === 0) {
        console.log('❌ No merchants found in the database');
        return null;
    }
    
    console.log(`\n✅ Found ${result.Items.length} merchants:\n`);
    result.Items.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.id || item.businessId || 'N/A'} - ${item.name || 'Unnamed'}`);
    });
    
    return result.Items[0].id || result.Items[0].businessId;
}

getFirstMerchant()
    .then(id => {
        if (id) {
            console.log(`\n💡 Use this merchant ID for testing:`);
            console.log(`   node test-bulk-upload.js ${id}`);
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
