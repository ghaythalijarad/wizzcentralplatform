// Create WizzCentral_RegionLogs table for audit trail
// Phase 6: Audit logging table creation script

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({ region: 'us-east-1' });

const LOGS_TABLE_SCHEMA = {
    TableName: 'WizzCentral_RegionLogs',
    KeySchema: [
        {
            AttributeName: 'logId',
            KeyType: 'HASH'
        }
    ],
    AttributeDefinitions: [
        {
            AttributeName: 'logId',
            AttributeType: 'S'
        },
        {
            AttributeName: 'regionId',
            AttributeType: 'S'
        },
        {
            AttributeName: 'timestamp',
            AttributeType: 'S'
        }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'RegionIdIndex',
            KeySchema: [
                {
                    AttributeName: 'regionId',
                    KeyType: 'HASH'
                },
                {
                    AttributeName: 'timestamp',
                    KeyType: 'RANGE'
                }
            ],
            Projection: {
                ProjectionType: 'ALL'
            },
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    },
    TimeToLiveSpecification: {
        AttributeName: 'ttl',
        Enabled: true
    }
};

/**
 * Create the RegionLogs table
 */
async function createLogsTable() {
    console.log('🔨 Creating WizzCentral_RegionLogs table...');
    
    try {
        // Check if table already exists
        try {
            await dynamoDB.describeTable({ TableName: 'WizzCentral_RegionLogs' }).promise();
            console.log('ℹ️  Table already exists');
            return;
        } catch (error) {
            if (error.code !== 'ResourceNotFoundException') {
                throw error;
            }
        }
        
        // Create table
        const result = await dynamoDB.createTable(LOGS_TABLE_SCHEMA).promise();
        console.log('✅ Table created successfully:', result.TableDescription.TableArn);
        
        // Wait for table to be active
        console.log('⏳ Waiting for table to be active...');
        await dynamoDB.waitFor('tableExists', { TableName: 'WizzCentral_RegionLogs' }).promise();
        console.log('✅ Table is now active');
        
    } catch (error) {
        console.error('❌ Error creating logs table:', error);
        throw error;
    }
}

/**
 * Sample log entry structure
 */
const SAMPLE_LOG_ENTRY = {
    logId: 'LOG_1699099200000_REG_001',
    regionId: 'REG_001',
    timestamp: '2025-11-04T10:00:00.000Z',
    action: 'DEACTIVATE',
    oldStatus: 'ACTIVE',
    newStatus: 'INACTIVE',
    adminUserId: 'admin123',
    adminEmail: 'admin@wizz.com',
    adminName: 'Ahmed Hassan',
    affectedRegions: ['REG_001', 'REG_002', 'REG_003'],
    affectedCount: 3,
    cascaded: true,
    reason: 'Scheduled maintenance',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    ttl: 1730635200 // Unix timestamp for expiration
};

// Run if executed directly
if (require.main === module) {
    createLogsTable()
        .then(() => {
            console.log('\n📊 Sample log entry structure:');
            console.log(JSON.stringify(SAMPLE_LOG_ENTRY, null, 2));
            process.exit(0);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = {
    LOGS_TABLE_SCHEMA,
    SAMPLE_LOG_ENTRY,
    createLogsTable
};
