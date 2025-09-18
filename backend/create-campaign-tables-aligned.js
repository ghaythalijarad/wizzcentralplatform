/**
 * Create New Campaign Tables - Architecture Alignment
 * Creates the 3-table structure as specified in the alignment plan
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const dynamoClient = new DynamoDBClient({ 
    region: process.env.AWS_REGION || 'us-east-1' 
});

/**
 * 1. WizzCentral_Campaigns - Core campaign data with GSIs
 */
const CAMPAIGNS_TABLE_SCHEMA = {
    TableName: 'WizzCentral_Campaigns',
    KeySchema: [
        { AttributeName: 'campaignId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'campaignId', AttributeType: 'S' },
        { AttributeName: 'isActive', AttributeType: 'S' }, // Changed to string for GSI compatibility
        { AttributeName: 'status', AttributeType: 'S' },
        { AttributeName: 'startDate', AttributeType: 'S' },
        { AttributeName: 'targetRestaurants', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    GlobalSecondaryIndexes: [
        {
            IndexName: 'ActiveCampaignsIndex',
            KeySchema: [
                { AttributeName: 'isActive', KeyType: 'HASH' },
                { AttributeName: 'startDate', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' }
        },
        {
            IndexName: 'StatusIndex', 
            KeySchema: [
                { AttributeName: 'status', KeyType: 'HASH' },
                { AttributeName: 'startDate', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' }
        },
        {
            IndexName: 'RestaurantTargetingIndex',
            KeySchema: [
                { AttributeName: 'targetRestaurants', KeyType: 'HASH' },
                { AttributeName: 'isActive', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' }
        }
    ],
    Tags: [
        { Key: 'Environment', Value: 'Production' },
        { Key: 'Service', Value: 'WizzCentral' },
        { Key: 'Component', Value: 'Campaigns' }
    ]
};

/**
 * 2. WizzCentral_Campaign_Conditions - JSON-based rules
 */
const CONDITIONS_TABLE_SCHEMA = {
    TableName: 'WizzCentral_Campaign_Conditions',
    KeySchema: [
        { AttributeName: 'campaignId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'campaignId', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
        { Key: 'Environment', Value: 'Production' },
        { Key: 'Service', Value: 'WizzCentral' },
        { Key: 'Component', Value: 'Campaign-Conditions' }
    ]
};

/**
 * 3. WizzCentral_Campaign_Usage - Atomic usage tracking
 */
const USAGE_TABLE_SCHEMA = {
    TableName: 'WizzCentral_Campaign_Usage',
    KeySchema: [
        { AttributeName: 'campaignId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'campaignId', AttributeType: 'S' },
        { AttributeName: 'lastUsedAt', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    GlobalSecondaryIndexes: [
        {
            IndexName: 'UsageTrackingIndex',
            KeySchema: [
                { AttributeName: 'lastUsedAt', KeyType: 'HASH' }
            ],
            Projection: { ProjectionType: 'ALL' }
        }
    ],
    Tags: [
        { Key: 'Environment', Value: 'Production' },
        { Key: 'Service', Value: 'WizzCentral' },
        { Key: 'Component', Value: 'Campaign-Usage' }
    ]
};

async function createTable(tableSchema, tableName) {
    try {
        console.log(`🔧 Creating table: ${tableName}...`);
        const result = await dynamoClient.send(new CreateTableCommand(tableSchema));
        console.log(`✅ Table ${tableName} created successfully`);
        console.log(`📊 Table ARN: ${result.TableDescription.TableArn}`);
        return result;
    } catch (error) {
        if (error.name === 'ResourceInUseException') {
            console.log(`⚠️ Table ${tableName} already exists`);
            return { existing: true };
        } else {
            console.error(`❌ Error creating table ${tableName}:`, error.message);
            throw error;
        }
    }
}

async function createAllCampaignTables() {
    console.log('🚀 Starting Campaign Architecture Migration - Creating Tables...\n');
    
    try {
        // Create all three tables
        const results = await Promise.all([
            createTable(CAMPAIGNS_TABLE_SCHEMA, 'WizzCentral_Campaigns'),
            createTable(CONDITIONS_TABLE_SCHEMA, 'WizzCentral_Campaign_Conditions'),
            createTable(USAGE_TABLE_SCHEMA, 'WizzCentral_Campaign_Usage')
        ]);
        
        console.log('\n🎉 Campaign Table Creation Complete!');
        console.log('📋 Summary:');
        console.log('  ✅ WizzCentral_Campaigns - Core campaign data with GSIs');
        console.log('  ✅ WizzCentral_Campaign_Conditions - JSON-based condition rules');
        console.log('  ✅ WizzCentral_Campaign_Usage - Atomic usage tracking');
        console.log('\n🔍 GSI Configuration:');
        console.log('  📊 ActiveCampaignsIndex - Fast active campaign queries');
        console.log('  📊 StatusIndex - Campaign status filtering');
        console.log('  📊 RestaurantTargetingIndex - Restaurant-specific campaigns');
        console.log('  📊 UsageTrackingIndex - Usage analytics');
        
        console.log('\n⏳ Tables are being created. This may take a few minutes...');
        console.log('💡 You can check table status in AWS Console or continue with next steps.');
        
        return results;
        
    } catch (error) {
        console.error('❌ Failed to create campaign tables:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    createAllCampaignTables()
        .then(() => {
            console.log('\n🎯 Ready for Phase 1.2: Data Migration');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Table creation failed:', error);
            process.exit(1);
        });
}

module.exports = {
    createAllCampaignTables,
    CAMPAIGNS_TABLE_SCHEMA,
    CONDITIONS_TABLE_SCHEMA,
    USAGE_TABLE_SCHEMA
};
