#!/usr/bin/env node
/**
 * Real-time Order Monitoring for Driver Assignment
 * Monitors WizzOrders table for new orders and tracks driver assignment process
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

// Initialize DynamoDB client
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

const ORDERS_TABLE = 'WizzOrders';
const WEBSOCKET_CONNECTIONS_TABLE = 'WizzUser_websocket_connections_dev';

// Store known orders to detect new ones
let knownOrders = new Set();

/**
 * Get current timestamp for logging
 */
function getTimestamp() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Baghdad',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Log with timestamp
 */
function log(message, type = 'INFO') {
    const timestamp = getTimestamp();
    const prefix = type === 'INFO' ? '📊' : type === 'NEW' ? '🆕' : type === 'ASSIGN' ? '🎯' : '⚠️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Check for connected drivers
 */
async function getConnectedDriversCount() {
    try {
        const result = await dynamoDB.send(new ScanCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            FilterExpression: 'attribute_exists(driverId) AND connectionStatus = :status',
            ExpressionAttributeValues: {
                ':status': 'connected'
            },
            Select: 'COUNT'
        }));
        
        return result.Count || 0;
    } catch (error) {
        return 0;
    }
}

/**
 * Scan for orders and detect changes
 */
async function scanOrders() {
    try {
        const result = await dynamoDB.send(new ScanCommand({
            TableName: ORDERS_TABLE,
            FilterExpression: 'attribute_exists(PK) AND begins_with(PK, :prefix)',
            ExpressionAttributeValues: {
                ':prefix': 'ORDER#'
            }
        }));

        const orders = result.Items || [];
        const currentOrderIds = new Set();

        for (const order of orders) {
            const orderId = order.PK.replace('ORDER#', '');
            currentOrderIds.add(orderId);

            // Check if this is a new order
            if (!knownOrders.has(orderId)) {
                log(`NEW ORDER DETECTED!`, 'NEW');
                log(`  Order ID: ${orderId}`);
                log(`  Status: ${order.status}`);
                log(`  Customer: ${order.customerName || 'N/A'}`);
                log(`  Restaurant: ${order.storeName || 'N/A'}`);
                log(`  Total: ${order.total || 0} ${order.currency || 'IQD'}`);
                log(`  Created: ${order.createdAt || 'N/A'}`);
                log(`  Driver: ${order.driverId || 'NOT ASSIGNED'}`);
                
                if (order.driverId) {
                    log(`  ✅ Driver already assigned: ${order.driverId}`, 'ASSIGN');
                }
                
                console.log(''); // Empty line for readability
            } else {
                // Check for status changes on existing orders
                const existingOrder = orders.find(o => o.PK.replace('ORDER#', '') === orderId);
                if (existingOrder) {
                    // Log driver assignment changes
                    if (order.driverId && order.status === 'assigned_to_driver') {
                        log(`DRIVER ASSIGNED to order ${orderId}!`, 'ASSIGN');
                        log(`  Driver ID: ${order.driverId}`);
                        log(`  Assigned At: ${order.assignedAt || 'N/A'}`);
                        log(`  Status: ${order.status}`);
                        console.log('');
                    }
                    
                    // Log status changes
                    if (order.status === 'confirmed') {
                        log(`Order ${orderId} CONFIRMED by merchant - Ready for assignment!`, 'INFO');
                    } else if (order.status === 'ready_for_pickup') {
                        log(`Order ${orderId} READY FOR PICKUP - Triggering driver assignment!`, 'ASSIGN');
                    }
                }
            }
        }

        // Update known orders
        knownOrders = currentOrderIds;

        // Summary stats
        const totalOrders = orders.length;
        const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
        const readyOrders = orders.filter(o => o.status === 'ready_for_pickup').length;
        const assignedOrders = orders.filter(o => o.driverId).length;
        const connectedDrivers = await getConnectedDriversCount();

        log(`📈 STATS: ${totalOrders} total | ${confirmedOrders} confirmed | ${readyOrders} ready | ${assignedOrders} assigned | ${connectedDrivers} drivers online`);

    } catch (error) {
        log(`Error scanning orders: ${error.message}`, 'ERROR');
    }
}

/**
 * Start monitoring
 */
async function startMonitoring() {
    console.log('🚀 Starting Real-time Order Monitoring System');
    console.log('==============================================');
    console.log('📱 Make sure WizzDriver app is running to receive notifications!');
    console.log('🛒 Place orders through customer app and confirm through merchant app');
    console.log('👀 Monitoring for order status changes and driver assignments...');
    console.log('');

    // Initial scan to populate known orders
    log('Performing initial scan...');
    await scanOrders();
    console.log('');

    // Start monitoring loop
    log('🔄 Starting continuous monitoring (checking every 3 seconds)...');
    console.log('');

    setInterval(async () => {
        await scanOrders();
    }, 3000); // Check every 3 seconds
}

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', () => {
    console.log('\n');
    log('🛑 Monitoring stopped. Goodbye!');
    process.exit(0);
});

// Start the monitoring system
startMonitoring().catch(error => {
    console.error('❌ Failed to start monitoring:', error);
    process.exit(1);
});
