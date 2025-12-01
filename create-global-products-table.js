#!/usr/bin/env node
/**
 * Create WhizzMerchants_GlobalProducts DynamoDB Table
 * Week 3 Implementation - Canonical Product Catalog
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

require('dotenv').config();

console.log('🚀 Starting GlobalProducts table creation script...');

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
});

const TABLE_NAME = 'WhizzMerchants_GlobalProducts';

const tableSchema = {
    TableName: TABLE_NAME,
    BillingMode: 'PAY_PER_REQUEST', // On-demand pricing
    
    AttributeDefinitions: [
        { AttributeName: 'globalProductId', AttributeType: 'S' },
        { AttributeName: 'sku', AttributeType: 'S' },
        { AttributeName: 'barcode', AttributeType: 'S' },
        { AttributeName: 'searchableName', AttributeType: 'S' },
        { AttributeName: 'categoryId', AttributeType: 'S' }
    ],
    
    KeySchema: [
        { AttributeName: 'globalProductId', KeyType: 'HASH' }
    ],
    
    GlobalSecondaryIndexes: [
        {
            IndexName: 'SkuIndex',
            KeySchema: [
                { AttributeName: 'sku', KeyType: 'HASH' }
            ],
            Projection: { ProjectionType: 'ALL' }
        },
        {
            IndexName: 'BarcodeIndex',
            KeySchema: [
                { AttributeName: 'barcode', KeyType: 'HASH' }
            ],
            Projection: { ProjectionType: 'ALL' }
        },
        {
            IndexName: 'SearchableNameCategoryIndex',
            KeySchema: [
                { AttributeName: 'searchableName', KeyType: 'HASH' },
                { AttributeName: 'categoryId', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' }
        }
    ],
    
    Tags: [
        { Key: 'Environment', Value: 'production' },
        { Key: 'Service', Value: 'WhizzMerchants' },
        { Key: 'Purpose', Value: 'GlobalProductCatalog' },
        { Key: 'Week', Value: '3' }
    ]
};

async function tableExists() {
    try {
        await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
        return true;
    } catch (error) {
        if (error.name === 'ResourceNotFoundException') {
            return false;
        }
        throw error;
    }
}

async function createTable() {
    console.log('🏗️  Creating WhizzMerchants_GlobalProducts Table');
    console.log('=' .repeat(60));
    console.log('');
    
    // Check if table already exists
    const exists = await tableExists();
    if (exists) {
        console.log('⚠️  Table already exists!');
        console.log('   Table: ' + TABLE_NAME);
        console.log('   Status: Active');
        console.log('');
        console.log('✅ No action needed - table is ready to use.');
        return;
    }
    
    console.log('📋 Table Configuration:');
    console.log('   Name: ' + TABLE_NAME);
    console.log('   Billing: PAY_PER_REQUEST (on-demand)');
    console.log('   Primary Key: globalProductId (String)');
    console.log('');
    console.log('📊 Global Secondary Indexes:');
    console.log('   1. SkuIndex - Fast lookup by SKU');
    console.log('   2. BarcodeIndex - Fast lookup by barcode');
    console.log('   3. SearchableNameCategoryIndex - Fuzzy matching');
    console.log('');
    
    try {
        console.log('⏳ Creating table...');
        const result = await client.send(new CreateTableCommand(tableSchema));
        
        console.log('✅ Table created successfully!');
        console.log('');
        console.log('📊 Table Details:');
        console.log('   ARN: ' + result.TableDescription.TableArn);
        console.log('   Status: ' + result.TableDescription.TableStatus);
        console.log('   Creation Time: ' + result.TableDescription.CreationDateTime);
        console.log('');
        console.log('⏳ Table is being provisioned...');
        console.log('   This may take 30-60 seconds.');
        console.log('   Status will change from CREATING → ACTIVE');
        console.log('');
        console.log('🔍 Check status with:');
        console.log('   aws dynamodb describe-table --table-name ' + TABLE_NAME);
        console.log('');
        console.log('📝 Next Steps:');
        console.log('   1. Wait for table to become ACTIVE');
        console.log('   2. Run migration script: node migrate-to-global-products.js');
        console.log('   3. Update bulk upload handler');
        console.log('');
        
    } catch (error) {
        console.error('❌ Error creating table:', error.message);
        console.error('');
        console.error('Troubleshooting:');
        console.error('   • Check AWS credentials are configured');
        console.error('   • Verify you have DynamoDB CreateTable permissions');
        console.error('   • Check if table name conflicts with existing resource');
        throw error;
    }
}

async function main() {
    try {
        await createTable();
    } catch (error) {
        console.error('');
        console.error('❌ Failed to create table');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { createTable, tableExists };
