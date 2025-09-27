#!/usr/bin/env node
/**
 * Quick Status Check for Driver Assignment
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

const ORDER_ID = '7652780b-ce26-44c2-8825-c15b8c5d3308';

async function checkStatus() {
    console.log('🔍 Checking current assignment status...\n');
    
    try {
        // Check order status
        const orderResult = await dynamoDB.send(new GetCommand({
            TableName: 'WizzOrders',
            Key: {
                PK: `ORDER#${ORDER_ID}`,
                SK: 'META'
            }
        }));

        if (orderResult.Item) {
            const order = orderResult.Item;
            console.log('📦 ORDER STATUS:');
            console.log(`   Order ID: ${ORDER_ID}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Customer: ${order.customerName}`);
            console.log(`   Store: ${order.storeName}`);
            console.log(`   Total: ${order.total} ${order.currency}`);
            console.log(`   Driver: ${order.driverId || '❌ NOT ASSIGNED'}`);
            console.log(`   Assigned At: ${order.assignedAt || 'N/A'}`);
            
            if (order.driverId) {
                console.log('\n✅ DRIVER ASSIGNMENT SUCCESSFUL!');
                console.log(`🎯 Driver ${order.driverId} has been assigned to the order`);
                console.log(`📱 WebSocket notification should have been sent to the WizzDriver app`);
            } else {
                console.log('\n⚠️ NO DRIVER ASSIGNED YET');
            }
        } else {
            console.log('❌ Order not found');
        }

        console.log('\n👥 CONNECTED DRIVERS:');
        
        // Check connected drivers
        const driversResult = await dynamoDB.send(new ScanCommand({
            TableName: 'WizzUser_websocket_connections_dev',
            FilterExpression: 'attribute_exists(driverId) AND connectionStatus = :status',
            ExpressionAttributeValues: {
                ':status': 'connected'
            }
        }));

        const connectedDrivers = driversResult.Items || [];
        console.log(`   Found ${connectedDrivers.length} connected drivers:`);
        
        if (connectedDrivers.length > 0) {
            connectedDrivers.forEach((driver, index) => {
                console.log(`   ${index + 1}. Driver: ${driver.driverId}`);
                console.log(`      Connection: ${driver.connectionId}`);
                console.log(`      Connected At: ${driver.connectedAt || 'N/A'}`);
            });
        } else {
            console.log('   ❌ No drivers currently connected');
        }

        console.log('\n📱 WIZZDRIVER APP STATUS:');
        
        // Check if Flutter is running
        const { exec } = require('child_process');
        exec('pgrep -f "flutter run"', (error, stdout, stderr) => {
            if (stdout.trim()) {
                console.log('   ✅ WizzDriver app is running and ready to receive notifications');
                console.log('   📲 Check the app screen for assignment notifications');
            } else {
                console.log('   ❌ WizzDriver app is not running');
                console.log('   💡 Start with: flutter run --debug');
            }
            
            console.log('\n🎉 STATUS CHECK COMPLETE!');
            
            if (orderResult.Item?.driverId) {
                console.log('\n📋 NEXT STEPS:');
                console.log('   1. Check WizzDriver app for assignment notification');
                console.log('   2. Driver can accept or reject the order');
                console.log('   3. Order status will update based on driver response');
                console.log('   4. Monitor the order progress in real-time');
            }
        });

    } catch (error) {
        console.error('❌ Error checking status:', error);
    }
}

checkStatus();
