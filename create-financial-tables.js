#!/usr/bin/env node
/**
 * Create DynamoDB tables for Financial Management
 * Run: node create-financial-tables.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
    CreateTableCommand, 
    DescribeTableCommand,
    waitUntilTableExists 
} = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
});

const tables = [
    {
        TableName: 'WizzCentral_Commission_Rules',
        KeySchema: [
            { AttributeName: 'ruleId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'ruleId', AttributeType: 'S' },
            { AttributeName: 'merchantId', AttributeType: 'S' },
            { AttributeName: 'priority', AttributeType: 'N' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'merchantId-priority-index',
                KeySchema: [
                    { AttributeName: 'merchantId', KeyType: 'HASH' },
                    { AttributeName: 'priority', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },
    {
        TableName: 'WizzCentral_Delivery_Fee_Rules',
        KeySchema: [
            { AttributeName: 'ruleId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'ruleId', AttributeType: 'S' },
            { AttributeName: 'regionId', AttributeType: 'S' },
            { AttributeName: 'priority', AttributeType: 'N' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'regionId-priority-index',
                KeySchema: [
                    { AttributeName: 'regionId', KeyType: 'HASH' },
                    { AttributeName: 'priority', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },
    {
        TableName: 'WizzCentral_Financial_Transactions',
        KeySchema: [
            { AttributeName: 'transactionId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'transactionId', AttributeType: 'S' },
            { AttributeName: 'createdAt', AttributeType: 'N' },
            { AttributeName: 'merchantId', AttributeType: 'S' },
            { AttributeName: 'orderId', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'merchantId-createdAt-index',
                KeySchema: [
                    { AttributeName: 'merchantId', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' }
            },
            {
                IndexName: 'orderId-index',
                KeySchema: [
                    { AttributeName: 'orderId', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },
    {
        TableName: 'WizzCentral_Financial_Audit',
        KeySchema: [ { AttributeName: 'auditId', KeyType: 'HASH' }, { AttributeName: 'createdAt', KeyType: 'RANGE' } ],
        AttributeDefinitions: [
            { AttributeName: 'auditId', AttributeType: 'S' },
            { AttributeName: 'createdAt', AttributeType: 'N' },
            { AttributeName: 'entityType', AttributeType: 'S' },
            { AttributeName: 'actionType', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'entityType-createdAt-index',
                KeySchema: [ { AttributeName: 'entityType', KeyType: 'HASH' }, { AttributeName: 'createdAt', KeyType: 'RANGE' } ],
                Projection: { ProjectionType: 'ALL' }
            },
            {
                IndexName: 'actionType-createdAt-index',
                KeySchema: [ { AttributeName: 'actionType', KeyType: 'HASH' }, { AttributeName: 'createdAt', KeyType: 'RANGE' } ],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },
    {
        TableName: 'WizzCentral_Financial_Settings',
        KeySchema: [ { AttributeName: 'settingsId', KeyType: 'HASH' } ],
        AttributeDefinitions: [ { AttributeName: 'settingsId', AttributeType: 'S' } ],
        BillingMode: 'PAY_PER_REQUEST'
    }
];

async function tableExists(tableName) {
    try {
        const command = new DescribeTableCommand({ TableName: tableName });
        await client.send(command);
        return true;
    } catch (error) {
        if (error.name === 'ResourceNotFoundException') {
            return false;
        }
        throw error;
    }
}

async function createTable(tableConfig) {
    const { TableName } = tableConfig;
    
    console.log(`\n📋 Checking table: ${TableName}...`);
    
    const exists = await tableExists(TableName);
    if (exists) {
        console.log(`✅ Table ${TableName} already exists`);
        return;
    }
    
    console.log(`🔨 Creating table: ${TableName}...`);
    const command = new CreateTableCommand(tableConfig);
    await client.send(command);
    
    console.log(`⏳ Waiting for table ${TableName} to be active...`);
    await waitUntilTableExists(
        { client, maxWaitTime: 120 },
        { TableName }
    );
    
    console.log(`✅ Table ${TableName} created successfully!`);
}

async function main() {
    console.log('🚀 Creating Financial Management DynamoDB Tables');
    console.log('===============================================\n');
    console.log(`Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`Profile: ${process.env.AWS_PROFILE || 'default'}\n`);
    
    try {
        const existing = [];
        for (const tableConfig of tables) {
            const exists = await tableExists(tableConfig.TableName);
            if (exists) existing.push(tableConfig.TableName);
            await createTable(tableConfig);
        }
        console.log('\nℹ️ Existing tables skipped:', existing.length ? existing.join(', ') : 'none');
        
        console.log('\n✅ All tables created successfully!');
        console.log('\n📊 Summary:');
        console.log('   • WizzCentral_Commission_Rules');
        console.log('   • WizzCentral_Delivery_Fee_Rules');
        console.log('   • WizzCentral_Financial_Transactions');
        console.log('   • WizzCentral_Financial_Audit');
        console.log('   • WizzCentral_Financial_Settings');
        console.log('\n🎯 Next Steps:');
        console.log('   1. Restart local dev server: npm run local');
        console.log('   2. Open http://localhost:3000/financial-management.html');
        console.log('   3. Create your first commission rule!');
        console.log('   4. Query audit: GET /api/financial-audit?entityType=commission_rule');
        
    } catch (error) {
        console.error('\n❌ Error creating tables:', error);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Ensure AWS credentials are configured');
        console.error('   2. Run: aws sso login --profile wizz-drivers-ghayth-dev');
        console.error('   3. Check IAM permissions for DynamoDB');
        process.exit(1);
    }
}

main();
