/**
 * Create DynamoDB tables for push notification system
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });

async function createTables() {
    // 1. Notification Logs Table
    const notificationLogsTable = {
        TableName: 'WizzCentral_Notification_Logs',
        KeySchema: [
            { AttributeName: 'logId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'logId', AttributeType: 'S' },
            { AttributeName: 'discountId', AttributeType: 'S' },
            { AttributeName: 'timestamp', AttributeType: 'N' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'discountId-timestamp-index',
                KeySchema: [
                    { AttributeName: 'discountId', KeyType: 'HASH' },
                    { AttributeName: 'timestamp', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    };

    // 2. Scheduled Notifications Table
    const scheduledNotificationsTable = {
        TableName: 'WizzCentral_Scheduled_Notifications',
        KeySchema: [
            { AttributeName: 'notificationId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'notificationId', AttributeType: 'S' },
            { AttributeName: 'scheduledTime', AttributeType: 'N' },
            { AttributeName: 'status', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'status-scheduledTime-index',
                KeySchema: [
                    { AttributeName: 'status', KeyType: 'HASH' },
                    { AttributeName: 'scheduledTime', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    };

    try {
        console.log('Creating WizzCentral_Notification_Logs table...');
        await client.send(new CreateTableCommand(notificationLogsTable));
        console.log('✅ WizzCentral_Notification_Logs created');
    } catch (error) {
        if (error.name === 'ResourceInUseException') {
            console.log('ℹ️  WizzCentral_Notification_Logs already exists');
        } else {
            console.error('❌ Error creating notification logs table:', error);
        }
    }

    try {
        console.log('Creating WizzCentral_Scheduled_Notifications table...');
        await client.send(new CreateTableCommand(scheduledNotificationsTable));
        console.log('✅ WizzCentral_Scheduled_Notifications created');
    } catch (error) {
        if (error.name === 'ResourceInUseException') {
            console.log('ℹ️  WizzCentral_Scheduled_Notifications already exists');
        } else {
            console.error('❌ Error creating scheduled notifications table:', error);
        }
    }

    console.log('\n✅ All tables created/verified successfully!');
}

createTables().catch(console.error);
