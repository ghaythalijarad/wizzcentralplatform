#!/usr/bin/env node
/**
 * Manual Driver Connection Simulator
 * Creates a fake driver connection entry in DynamoDB to test assignment
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

// Initialize DynamoDB client
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

const WEBSOCKET_CONNECTIONS_TABLE = 'WizzUser_websocket_connections_dev';
const TEST_DRIVER_ID = 'test-driver-manual-' + Date.now();
const CONNECTION_ID = 'conn-' + Date.now();

async function createFakeDriverConnection() {
    try {
        console.log('🔧 Creating fake driver connection for testing...');
        console.log(`👤 Driver ID: ${TEST_DRIVER_ID}`);
        console.log(`🔌 Connection ID: ${CONNECTION_ID}`);
        
        const connectionRecord = {
            connectionId: CONNECTION_ID,
            driverId: TEST_DRIVER_ID,
            userId: TEST_DRIVER_ID,
            userType: 'driver',
            connectionStatus: 'connected',
            status: 'connected',
            businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
            platform: 'test',
            appVersion: '1.0.0',
            connectedAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            location: {
                latitude: 33.3152,
                longitude: 44.3661
            },
            ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
        };

        await dynamoDB.send(new PutCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            Item: connectionRecord
        }));

        console.log('✅ Fake driver connection created successfully!');
        console.log('📋 Connection details:');
        console.log(JSON.stringify(connectionRecord, null, 2));
        
        console.log('\n🎯 Now you can run the assignment script:');
        console.log('node assign-driver-to-order.js');
        
    } catch (error) {
        console.error('❌ Error creating fake connection:', error.message);
        console.error('Full error:', error);
    }
}

createFakeDriverConnection()
    .then(() => {
        console.log('\n✅ Fake driver setup complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    });
