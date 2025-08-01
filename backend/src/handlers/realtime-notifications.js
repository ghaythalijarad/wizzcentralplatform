/**
 * Real-Time Notification Service
 * Sends instant notifications to connected merchant apps via WebSocket
 */

const AWS = require('aws-sdk');
const { getBusinessConnections } = require('./websocket-connections');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev';
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'order-receiver-orders-dev';

/**
 * Send real-time notification to merchant app
 */
exports.sendOrderNotification = async (event) => {
    console.log('📡 Real-time notification triggered:', JSON.stringify(event, null, 2));
    
    try {
        // Parse the event (could be from SNS, Lambda trigger, or direct call)
        let orderData;
        let businessId;
        
        if (event.Records && event.Records[0]) {
            // DynamoDB Stream or SNS trigger
            const record = event.Records[0];
            if (record.eventSource === 'aws:dynamodb') {
                // DynamoDB Stream
                const dynamoRecord = record.dynamodb;
                if (dynamoRecord.NewImage) {
                    orderData = AWS.DynamoDB.Converter.unmarshall(dynamoRecord.NewImage);
                    businessId = orderData.businessId;
                }
            } else if (record.Sns) {
                // SNS Message
                orderData = JSON.parse(record.Sns.Message);
                businessId = orderData.businessId;
            }
        } else if (event.orderId && event.businessId) {
            // Direct function call
            orderData = event;
            businessId = event.businessId;
        } else {
            console.error('❌ Invalid event format');
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid event format' }) };
        }
        
        if (!orderData || !businessId) {
            console.error('❌ Missing order data or business ID');
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required data' }) };
        }
        
        console.log(`🏪 Processing notification for business: ${businessId}`);
        console.log(`📦 Order: ${orderData.orderId}`);
        
        // Get all WebSocket connections for this business
        const connections = await getBusinessConnections(businessId);
        console.log(`🔗 Found ${connections.length} active connections`);
        
        if (connections.length === 0) {
            console.log('ℹ️ No active connections found for business');
            return { statusCode: 200, body: JSON.stringify({ message: 'No active connections' }) };
        }
        
        // Prepare notification message
        const notification = {
            type: 'new_order',
            orderId: orderData.orderId,
            businessId: businessId,
            order: {
                orderId: orderData.orderId,
                customerId: orderData.customerId,
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                items: orderData.items,
                total: orderData.total,
                status: orderData.status || 'pending',
                createdAt: orderData.createdAt,
                deliveryAddress: orderData.deliveryAddress,
                paymentMethod: orderData.paymentMethod || 'cash'
            },
            timestamp: new Date().toISOString(),
            message: `New order ${orderData.orderId} received!`
        };
        
        // Send to all connected clients
        const apiGateway = new AWS.ApiGatewayManagementApi({
            endpoint: `https://${connections[0].domainName}/${connections[0].stage}`
        });
        
        const sendPromises = connections.map(async (connection) => {
            try {
                await apiGateway.postToConnection({
                    ConnectionId: connection.connectionId,
                    Data: JSON.stringify(notification)
                }).promise();
                
                console.log(`✅ Notification sent to connection: ${connection.connectionId}`);
                return { connectionId: connection.connectionId, status: 'sent' };
                
            } catch (error) {
                console.error(`❌ Failed to send to connection ${connection.connectionId}:`, error);
                
                // If connection is stale, remove it
                if (error.statusCode === 410) {
                    await removeStaleConnection(connection.connectionId);
                }
                
                return { connectionId: connection.connectionId, status: 'failed', error: error.message };
            }
        });
        
        const results = await Promise.allSettled(sendPromises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 'sent').length;
        
        console.log(`📊 Notification results: ${successful}/${connections.length} successful`);
        
        // Store notification in database for tracking
        await storeNotification(businessId, orderData.orderId, notification, successful);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Notification sent',
                businessId,
                orderId: orderData.orderId,
                connectionsSent: successful,
                totalConnections: connections.length
            })
        };
        
    } catch (error) {
        console.error('❌ Real-time notification error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send notification' })
        };
    }
};

/**
 * Send order status update notification
 */
exports.sendStatusUpdateNotification = async (businessId, orderId, oldStatus, newStatus, updatedBy) => {
    try {
        const connections = await getBusinessConnections(businessId);
        
        if (connections.length === 0) {
            console.log('No active connections for status update notification');
            return;
        }
        
        const notification = {
            type: 'order_status_update',
            orderId,
            businessId,
            oldStatus,
            newStatus,
            updatedBy,
            timestamp: new Date().toISOString(),
            message: `Order ${orderId} status changed from ${oldStatus} to ${newStatus}`
        };
        
        const apiGateway = new AWS.ApiGatewayManagementApi({
            endpoint: `https://${connections[0].domainName}/${connections[0].stage}`
        });
        
        const sendPromises = connections.map(connection =>
            apiGateway.postToConnection({
                ConnectionId: connection.connectionId,
                Data: JSON.stringify(notification)
            }).promise()
        );
        
        await Promise.allSettled(sendPromises);
        console.log(`✅ Status update notification sent for order: ${orderId}`);
        
    } catch (error) {
        console.error('Error sending status update notification:', error);
    }
};

/**
 * Remove stale WebSocket connection
 */
async function removeStaleConnection(connectionId) {
    try {
        await dynamodb.delete({
            TableName: process.env.WEBSOCKET_CONNECTIONS_TABLE || 'websocket-connections-dev',
            Key: { connectionId }
        }).promise();
        
        console.log(`🗑️ Removed stale connection: ${connectionId}`);
    } catch (error) {
        console.error('Error removing stale connection:', error);
    }
}

/**
 * Store notification for tracking and analytics
 */
async function storeNotification(businessId, orderId, notification, successfulSends) {
    try {
        await dynamodb.put({
            TableName: NOTIFICATIONS_TABLE,
            Item: {
                notificationId: `${businessId}-${orderId}-${Date.now()}`,
                businessId,
                orderId,
                type: notification.type,
                status: successfulSends > 0 ? 'sent' : 'failed',
                successfulSends,
                createdAt: new Date().toISOString(),
                notification: notification,
                ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
            }
        }).promise();
        
        console.log(`📝 Notification stored for tracking: ${businessId}-${orderId}`);
    } catch (error) {
        console.error('Error storing notification:', error);
    }
}

/**
 * Test function for manual notification sending
 */
exports.testNotification = async (event) => {
    const { businessId, message } = event;
    
    try {
        const connections = await getBusinessConnections(businessId);
        
        const testNotification = {
            type: 'test_notification',
            businessId,
            message: message || 'This is a test notification from WizzCentral',
            timestamp: new Date().toISOString()
        };
        
        if (connections.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ message: 'No active connections' }) };
        }
        
        const apiGateway = new AWS.ApiGatewayManagementApi({
            endpoint: `https://${connections[0].domainName}/${connections[0].stage}`
        });
        
        const sendPromises = connections.map(connection =>
            apiGateway.postToConnection({
                ConnectionId: connection.connectionId,
                Data: JSON.stringify(testNotification)
            }).promise()
        );
        
        await Promise.allSettled(sendPromises);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Test notification sent',
                connections: connections.length
            })
        };
        
    } catch (error) {
        console.error('Test notification error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send test notification' })
        };
    }
};
