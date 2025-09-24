#!/usr/bin/env node
/**
 * Simple deployment script for Driver Assignment System testing
 * Creates only the assignment history table for testing purposes
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, waitUntilTableExists } = require('@aws-sdk/client-dynamodb');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');

// AWS Configuration
const dynamoDB = new DynamoDBClient({ region: 'us-east-1' });
const sts = new STSClient({ region: 'us-east-1' });

async function createAssignmentHistoryTable() {
    console.log('📊 Creating driver assignment history table...');
    
    const tableName = 'WizzUser_driver_assignments_dev';
    
    try {
        // Check if table exists
        await dynamoDB.send(new DescribeTableCommand({ TableName: tableName }));
        console.log(`✅ Table ${tableName} already exists`);
        return;
    } catch (error) {
        if (error.name !== 'ResourceNotFoundException') {
            throw error;
        }
    }

    const tableParams = {
        TableName: tableName,
        KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'SK', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'PK', AttributeType: 'S' },
            { AttributeName: 'SK', AttributeType: 'S' },
            { AttributeName: 'orderId', AttributeType: 'S' },
            { AttributeName: 'driverId', AttributeType: 'S' },
            { AttributeName: 'timestamp', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'OrderIdIndex',
                KeySchema: [
                    { AttributeName: 'orderId', KeyType: 'HASH' },
                    { AttributeName: 'timestamp', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'DriverIdIndex',
                KeySchema: [
                    { AttributeName: 'driverId', KeyType: 'HASH' },
                    { AttributeName: 'timestamp', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
        }
    };

    try {
        await dynamoDB.send(new CreateTableCommand(tableParams));
        console.log(`✅ Table ${tableName} created successfully`);
        
        // Wait for table to be active
        await waitUntilTableExists(
            { client: dynamoDB, maxWaitTime: 300 },
            { TableName: tableName }
        );
        console.log(`✅ Table ${tableName} is now active`);
    } catch (error) {
        console.error(`❌ Error creating table ${tableName}:`, error);
        throw error;
    }
}

async function deploy() {
    console.log('🎯 Setting up Driver Assignment System for testing...\n');
    
    try {
        console.log('🔑 AWS Credentials check...');
        const identity = await sts.send(new GetCallerIdentityCommand({}));
        console.log(`✅ Connected as: ${identity.Arn}`);
        
        await createAssignmentHistoryTable();
        
        console.log('\n🎉 Driver Assignment System setup complete!');
        console.log('\n📝 Next steps:');
        console.log('1. Run tests: node test-driver-assignment.js');
        console.log('2. Integrate with existing WebSocket infrastructure');
        console.log('3. Test with real driver connections');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run deployment if script is executed directly
if (require.main === module) {
    deploy();
}

module.exports = { deploy, createAssignmentHistoryTable };
