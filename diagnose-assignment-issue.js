#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function diagnoseDriverAssignmentIssue() {
    console.log('🔍 DIAGNOSING DRIVER ASSIGNMENT ISSUE');
    console.log('=' .repeat(50));
    
    try {
        // Step 1: Check if any drivers are connected
        console.log('\n1️⃣ Checking WebSocket Connections...');
        
        let driverConnectionsCount = 0;
        try {
            const result = await docClient.send(new ScanCommand({
                TableName: 'WizzUser_websocket_connections_dev',
                Select: 'COUNT'
            }));
            
            const totalConnections = result.Count || 0;
            console.log(`📊 Total WebSocket connections: ${totalConnections}`);
            
            if (totalConnections === 0) {
                console.log('❌ NO WEBSOCKET CONNECTIONS FOUND');
                console.log('💡 This is the main issue - no drivers are connected!');
            }
            
        } catch (error) {
            console.log('❌ Error checking connections:', error.message);
        }
        
        // Step 2: Check orders ready for assignment
        console.log('\n2️⃣ Checking Orders Ready for Assignment...');
        
        try {
            const ordersResult = await docClient.send(new ScanCommand({
                TableName: 'WizzOrders',
                FilterExpression: '#status IN (:confirmed, :ready)',
                ExpressionAttributeNames: {
                    '#status': 'status'
                },
                ExpressionAttributeValues: {
                    ':confirmed': 'confirmed',
                    ':ready': 'ready_for_pickup'
                }
            }));
            
            const readyOrders = ordersResult.Items || [];
            console.log(`📦 Orders ready for assignment: ${readyOrders.length}`);
            
            readyOrders.forEach(order => {
                console.log(`   📋 Order: ${order.PK} - Status: ${order.status} - Driver: ${order.driverId || 'None'}`);
            });
            
        } catch (error) {
            console.log('❌ Error checking orders:', error.message);
        }
        
        // Step 3: Provide solutions
        console.log('\n3️⃣ SOLUTIONS TO FIX THE ISSUE:');
        console.log('═' .repeat(50));
        
        console.log('\n🔧 SOLUTION 1: Connect WizzDriver App to WebSocket');
        console.log('   1. Open WizzDriver Flutter app');
        console.log('   2. Make sure driver is logged in');
        console.log('   3. App should auto-connect to WebSocket service');
        console.log('   4. Driver status should show as "online"');
        
        console.log('\n🔧 SOLUTION 2: Test Assignment with Connected Driver');
        console.log('   1. After driver connects, update an order status:');
        console.log('   2. Run: aws dynamodb update-item --table-name WizzOrders \\');
        console.log('      --key \'{"PK":{"S":"ORDER#[ORDER_ID]"},"SK":{"S":"ORDER#[ORDER_ID]"}}\' \\');
        console.log('      --update-expression "SET #status = :status" \\');
        console.log('      --expression-attribute-names \'{"#status":"status"}\' \\');
        console.log('      --expression-attribute-values \'{"status":{"S":"ready_for_pickup"}}\'');
        
        console.log('\n🔧 SOLUTION 3: Check System Components');
        console.log('   ✅ WebSocket Endpoint: wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev');
        console.log('   ✅ Lambda Functions: order-receiver-stream-processor-dev-v1');
        console.log('   ✅ DynamoDB Tables: WizzOrders, WizzUser_websocket_connections_dev');
        
        console.log('\n🎯 NEXT STEPS:');
        console.log('   1. Start WizzDriver Flutter app');
        console.log('   2. Verify driver connects to WebSocket');
        console.log('   3. Change order status to trigger assignment');
        console.log('   4. Driver should receive assignment notification');
        
    } catch (error) {
        console.error('❌ Diagnosis error:', error);
    }
}

// Run diagnosis
diagnoseDriverAssignmentIssue();
