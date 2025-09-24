#!/usr/bin/env node
/**
 * Setup Commission and Delivery Fee Tables in DynamoDB
 * Creates tables and populates with default rules
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { 
    defaultCommissionRules, 
    defaultDeliveryFeeRules,
    COMMISSION_TABLE,
    DELIVERY_FEE_TABLE
} = require('./commission-fee-management.js');

// Configure AWS SDK
const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_PROFILE ? undefined : {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

async function createCommissionTable() {
    const tableParams = {
        TableName: COMMISSION_TABLE,
        KeySchema: [
            { AttributeName: 'ruleId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'ruleId', AttributeType: 'S' },
            { AttributeName: 'ruleType', AttributeType: 'S' },
            { AttributeName: 'isActive', AttributeType: 'S' },
            { AttributeName: 'priority', AttributeType: 'N' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'TypeIndex',
                KeySchema: [
                    { AttributeName: 'ruleType', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                BillingMode: 'PAY_PER_REQUEST'
            },
            {
                IndexName: 'ActiveIndex',
                KeySchema: [
                    { AttributeName: 'isActive', KeyType: 'HASH' },
                    { AttributeName: 'priority', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                BillingMode: 'PAY_PER_REQUEST'
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    };

    try {
        await ddbClient.send(new DescribeTableCommand({ TableName: COMMISSION_TABLE }));
        console.log(`✅ Commission table ${COMMISSION_TABLE} already exists`);
        return;
    } catch (error) {
        if (error.name !== 'ResourceNotFoundException') {
            throw error;
        }
    }

    await ddbClient.send(new CreateTableCommand(tableParams));
    console.log(`✅ Created commission table ${COMMISSION_TABLE}`);
    await waitForTableActive(COMMISSION_TABLE);
}

async function createDeliveryFeeTable() {
    const tableParams = {
        TableName: DELIVERY_FEE_TABLE,
        KeySchema: [
            { AttributeName: 'ruleId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'ruleId', AttributeType: 'S' },
            { AttributeName: 'ruleType', AttributeType: 'S' },
            { AttributeName: 'isActive', AttributeType: 'S' },
            { AttributeName: 'regionId', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'TypeIndex',
                KeySchema: [
                    { AttributeName: 'ruleType', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                BillingMode: 'PAY_PER_REQUEST'
            },
            {
                IndexName: 'RegionIndex',
                KeySchema: [
                    { AttributeName: 'regionId', KeyType: 'HASH' },
                    { AttributeName: 'isActive', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                BillingMode: 'PAY_PER_REQUEST'
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    };

    try {
        await ddbClient.send(new DescribeTableCommand({ TableName: DELIVERY_FEE_TABLE }));
        console.log(`✅ Delivery fee table ${DELIVERY_FEE_TABLE} already exists`);
        return;
    } catch (error) {
        if (error.name !== 'ResourceNotFoundException') {
            throw error;
        }
    }

    await ddbClient.send(new CreateTableCommand(tableParams));
    console.log(`✅ Created delivery fee table ${DELIVERY_FEE_TABLE}`);
    await waitForTableActive(DELIVERY_FEE_TABLE);
}

async function waitForTableActive(tableName) {
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
        try {
            const result = await ddbClient.send(new DescribeTableCommand({ TableName: tableName }));
            if (result.Table.TableStatus === 'ACTIVE') {
                console.log(`✅ Table ${tableName} is now active`);
                return;
            }
            console.log(`⏳ Table ${tableName} status: ${result.Table.TableStatus}, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
        } catch (error) {
            console.error(`❌ Error checking table status for ${tableName}:`, error);
            throw error;
        }
    }
    throw new Error(`Table ${tableName} did not become active within timeout period`);
}

async function populateCommissionRules() {
    console.log(`📝 Populating ${defaultCommissionRules.length} commission rules...`);
    
    const writeRequests = defaultCommissionRules.map(rule => ({
        PutRequest: {
            Item: {
                ...rule,
                isActive: rule.isActive ? 'true' : 'false' // Convert boolean to string for GSI
            }
        }
    }));

    const batchParams = {
        RequestItems: {
            [COMMISSION_TABLE]: writeRequests
        }
    };

    await dynamoDB.send(new BatchWriteCommand(batchParams));
    console.log(`✅ Successfully populated ${defaultCommissionRules.length} commission rules`);
}

async function populateDeliveryFeeRules() {
    console.log(`📝 Populating ${defaultDeliveryFeeRules.length} delivery fee rules...`);
    
    const writeRequests = defaultDeliveryFeeRules.map(rule => ({
        PutRequest: {
            Item: {
                ...rule,
                isActive: rule.isActive ? 'true' : 'false', // Convert boolean to string for GSI
                regionId: rule.conditions.regionId || 'all'
            }
        }
    }));

    const batchParams = {
        RequestItems: {
            [DELIVERY_FEE_TABLE]: writeRequests
        }
    };

    await dynamoDB.send(new BatchWriteCommand(batchParams));
    console.log(`✅ Successfully populated ${defaultDeliveryFeeRules.length} delivery fee rules`);
}

async function main() {
    console.log('💰 Setting up Commission and Delivery Fee Management in DynamoDB...');
    console.log(`📋 AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`👤 AWS Profile: ${process.env.AWS_PROFILE || 'default'}`);
    
    try {
        // Create tables
        await createCommissionTable();
        await createDeliveryFeeTable();
        
        // Populate with default rules
        await populateCommissionRules();
        await populateDeliveryFeeRules();
        
        console.log('');
        console.log('🎉 Commission and Delivery Fee setup completed successfully!');
        console.log(`📊 Commission Table: ${COMMISSION_TABLE}`);
        console.log(`📊 Delivery Fee Table: ${DELIVERY_FEE_TABLE}`);
        console.log(`💸 Commission Rules: ${defaultCommissionRules.length}`);
        console.log(`🚚 Delivery Fee Rules: ${defaultDeliveryFeeRules.length}`);
        console.log('');
        console.log('🔧 Best Practices Implemented:');
        console.log('   ✅ Tiered commission structure for volume-based pricing');
        console.log('   ✅ Distance-based delivery fees with peak hour multipliers');
        console.log('   ✅ Zone-based delivery pricing for urban areas');
        console.log('   ✅ Free delivery thresholds to encourage larger orders');
        console.log('   ✅ Weather-based fee adjustments for delivery safety');
        console.log('   ✅ Merchant type-based commission rates');
        console.log('   ✅ Regional pricing flexibility');
        console.log('   ✅ Hybrid commission models (percentage + flat fee)');
        console.log('');
        console.log('📈 Financial Features:');
        console.log('   💼 Commission calculation engine');
        console.log('   🚛 Delivery fee calculation engine');
        console.log('   📊 Financial reporting and analytics');
        console.log('   ⚙️  Rule-based pricing management');
        console.log('   🔄 Dynamic fee adjustments');
        console.log('   📋 Merchant agreement tracking');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
