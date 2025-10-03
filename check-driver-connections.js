#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function checkDriverConnections() {
    console.log('🔍 Checking WebSocket connections for drivers...');
    console.log('=' .repeat(60));
    
    try {
        console.log('📡 Connecting to DynamoDB...');
        
        // Check WebSocket connections
        console.log('🔎 Scanning WebSocket connections table...');
        const connectionsResult = await docClient.send(new ScanCommand({
            TableName: 'WizzUser_websocket_connections_dev'
        }));
        
        console.log('✅ Connection scan completed');
        
        const allConnections = connectionsResult.Items || [];
        const driverConnections = allConnections.filter(conn => 
            conn.userType === 'driver' || conn.driverId
        );
        
        console.log(`📊 Total connections: ${allConnections.length}`);
        console.log(`🚗 Driver connections: ${driverConnections.length}\n`);
        
        if (driverConnections.length === 0) {
            console.log('❌ NO DRIVERS CONNECTED!');
            console.log('💡 This is why driver assignment is not working.');
            console.log('💡 You need to connect the WizzDriver Flutter app to WebSocket first.');
        } else {
            console.log('✅ Driver Connections Found:');
            driverConnections.forEach((conn, index) => {
                console.log(`   ${index + 1}. Driver ID: ${conn.userId || conn.driverId || 'unknown'}`);
                console.log(`      Connection ID: ${conn.connectionId}`);
                console.log(`      Status: ${conn.connectionStatus || 'unknown'}`);
                console.log(`      Connected At: ${conn.connectedAt || 'unknown'}`);
                console.log(`      User Type: ${conn.userType || 'unknown'}`);
                console.log('');
            });
        }
        
        // Also check if there are any orders ready for assignment
        console.log('\n🔍 Checking orders ready for assignment...');
        const ordersResult = await docClient.send(new ScanCommand({
            TableName: 'WizzOrders',
            FilterExpression: '#status = :status',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'confirmed'
            }
        }));
        
        const confirmedOrders = ordersResult.Items || [];
        console.log(`📦 Found ${confirmedOrders.length} confirmed orders ready for assignment`);
        
        if (confirmedOrders.length > 0 && driverConnections.length > 0) {
            console.log('\n🎯 SOLUTION: Both drivers and orders are available!');
            console.log('💡 You can now test the assignment by changing an order status to "ready_for_pickup"');
        } else if (confirmedOrders.length > 0 && driverConnections.length === 0) {
            console.log('\n❌ PROBLEM: Orders available but NO DRIVERS CONNECTED');
            console.log('💡 Start the WizzDriver Flutter app and connect to WebSocket');
        } else if (confirmedOrders.length === 0 && driverConnections.length > 0) {
            console.log('\n❌ PROBLEM: Drivers connected but NO ORDERS READY');
            console.log('💡 Create a test order or change an existing order status to "ready_for_pickup"');
        }
        
    } catch (error) {
        console.error('❌ Error checking connections:', error);
    }
}

// Run the check
checkDriverConnections();
