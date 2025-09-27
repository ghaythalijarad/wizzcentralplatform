#!/usr/bin/env node
/**
 * Manual Driver Assignment Script
 * Assigns a driver to the confirmed order in WizzOrders table
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

// Initialize DynamoDB client
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

const ORDERS_TABLE = 'WizzOrders';
const WEBSOCKET_CONNECTIONS_TABLE = 'WizzUser_websocket_connections_dev';

// Your confirmed order ID - will be updated dynamically
const ORDER_ID = process.argv[2] || '7652780b-ce26-44c2-8825-c15b8c5d3308';

/**
 * Get available drivers
 */
async function getAvailableDrivers() {
    try {
        console.log('🔍 Looking for available drivers...');
        
        // Scan websocket connections to find online drivers
        const result = await dynamoDB.send(new ScanCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            FilterExpression: 'attribute_exists(driverId) AND connectionStatus = :status',
            ExpressionAttributeValues: {
                ':status': 'connected'
            }
        }));

        const onlineDrivers = result.Items || [];
        console.log(`Found ${onlineDrivers.length} online drivers`);
        
        if (onlineDrivers.length > 0) {
            console.log('Available drivers:');
            onlineDrivers.forEach((driver, index) => {
                console.log(`  ${index + 1}. Driver ID: ${driver.driverId}, Connection: ${driver.connectionId}`);
            });
        }

        return onlineDrivers;
    } catch (error) {
        console.error('❌ Error finding drivers:', error);
        return [];
    }
}

/**
 * Get order details
 */
async function getOrder(orderId) {
    try {
        const result = await dynamoDB.send(new GetCommand({
            TableName: ORDERS_TABLE,
            Key: {
                PK: `ORDER#${orderId}`,
                SK: 'META'
            }
        }));

        return result.Item;
    } catch (error) {
        console.error(`❌ Error getting order ${orderId}:`, error);
        return null;
    }
}

/**
 * Assign driver to order
 */
async function assignDriverToOrder(orderId, driverId) {
    try {
        console.log(`🎯 Assigning driver ${driverId} to order ${orderId}...`);

        const result = await dynamoDB.send(new UpdateCommand({
            TableName: ORDERS_TABLE,
            Key: {
                PK: `ORDER#${orderId}`,
                SK: 'META'
            },
            UpdateExpression: `
                SET driverId = :driverId, 
                    #status = :status, 
                    assignedAt = :assignedAt,
                    updatedAt = :updatedAt
            `,
            ConditionExpression: 'attribute_exists(PK) AND attribute_not_exists(driverId)',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':driverId': driverId,
                ':status': 'assigned_to_driver',
                ':assignedAt': new Date().toISOString(),
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        }));

        console.log('✅ Driver assignment successful!');
        console.log('Updated order:', JSON.stringify(result.Attributes, null, 2));
        return result.Attributes;

    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            console.log('⚠️ Order already has a driver assigned');
        } else {
            console.error('❌ Error assigning driver:', error);
        }
        return null;
    }
}

/**
 * Send WebSocket notification to driver
 */
async function notifyDriver(driverId, order) {
    const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");
    
    try {
        console.log(`📱 Sending notification to driver ${driverId}...`);

        // Find driver's connection
        const connections = await dynamoDB.send(new ScanCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            FilterExpression: 'driverId = :driverId AND connectionStatus = :status',
            ExpressionAttributeValues: {
                ':driverId': driverId,
                ':status': 'connected'
            }
        }));

        if (!connections.Items || connections.Items.length === 0) {
            console.log('⚠️ No active connection found for driver');
            return;
        }

        const connection = connections.Items[0];
        const apiGatewayClient = new ApiGatewayManagementApiClient({
            endpoint: 'https://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev'
        });

        // Create assignment message
        const assignmentMessage = {
            action: 'driver_assigned',
            order_id: order.PK.replace('ORDER#', ''),
            assignment_id: `ASSIGN_${Date.now()}`,
            timeout: 30,
            customer_name: order.customerName || 'عميل',
            restaurant_name: order.storeName || 'مطعم',
            delivery_address: order.deliveryAddress || 'عنوان التسليم',
            total_amount: order.total || 0,
            currency: order.currency || 'IQD',
            estimated_distance: '2.5',
            pickup_location: {
                latitude: 33.3128,
                longitude: 44.3615,
                address: order.storeName || 'المطعم'
            },
            delivery_location: {
                latitude: 33.3057,
                longitude: 44.3838,
                address: order.deliveryAddress || 'عنوان التسليم'
            }
        };

        await apiGatewayClient.send(new PostToConnectionCommand({
            ConnectionId: connection.connectionId,
            Data: JSON.stringify(assignmentMessage)
        }));

        console.log('✅ Notification sent to driver successfully!');

    } catch (error) {
        console.error('❌ Error sending notification:', error);
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 Starting manual driver assignment...');
    console.log(`📦 Order ID: ${ORDER_ID}`);

    // Get order details
    const order = await getOrder(ORDER_ID);
    if (!order) {
        console.error('❌ Order not found');
        return;
    }

    console.log('📋 Order details:');
    console.log(`  Status: ${order.status}`);
    console.log(`  Customer: ${order.customerName}`);
    console.log(`  Store: ${order.storeName}`);
    console.log(`  Total: ${order.total} ${order.currency}`);
    console.log(`  Current driver: ${order.driverId || 'None'}`);

    if (order.driverId) {
        console.log('⚠️ Order already has a driver assigned');
        return;
    }

    // Get available drivers
    const availableDrivers = await getAvailableDrivers();
    if (availableDrivers.length === 0) {
        console.log('❌ No available drivers found');
        console.log('💡 Make sure drivers are connected to the WebSocket service');
        return;
    }

    // Use the first available driver
    const selectedDriver = availableDrivers[0];
    const driverId = selectedDriver.driverId;

    console.log(`🎯 Selected driver: ${driverId}`);

    // Assign driver to order
    const updatedOrder = await assignDriverToOrder(ORDER_ID, driverId);
    if (updatedOrder) {
        // Send notification to driver
        await notifyDriver(driverId, updatedOrder);
        
        console.log('\n🎉 Driver assignment completed successfully!');
        console.log('📱 The driver should receive a notification in the WizzDriver app');
    }
}

// Run the script
main().catch(console.error);
