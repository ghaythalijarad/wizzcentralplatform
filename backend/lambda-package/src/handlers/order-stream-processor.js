/**
 * Order Status Monitoring and Driver Assignment Stream Processor
 * Automatically assigns drivers to orders when status changes to 'ready_for_pickup'
 * Integrates with the existing driver assignment service and WebSocket system
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { ApiGatewayManagementApiClient } = require("@aws-sdk/client-apigatewaymanagementapi");

// Import the existing driver assignment service
const { assignDriverToOrder } = require('../services/driver-assignment-service');

// Initialize DynamoDB client
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

// Table names
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'WizzOrders';
const WEBSOCKET_CONNECTIONS_TABLE = process.env.WEBSOCKET_CONNECTIONS_TABLE || 'WizzUser_websocket_connections_dev';
const WEBSOCKET_SUBSCRIPTIONS_TABLE = process.env.WEBSOCKET_SUBSCRIPTIONS_TABLE || 'WizzUser_websocket_subscriptions_dev';

// WebSocket endpoint
const WEBSOCKET_ENDPOINT = process.env.WEBSOCKET_ENDPOINT || 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev';

// Order statuses that trigger driver assignment
const ASSIGNABLE_STATUSES = ['ready'];

/**
 * Main Lambda handler for DynamoDB Stream events
 */
exports.handler = async (event) => {
    console.log('🔄 Order Stream Processor started');
    console.log(`Processing ${event.Records.length} stream records`);

    const apiGatewayClient = new ApiGatewayManagementApiClient({
        endpoint: WEBSOCKET_ENDPOINT
    });

    const processedRecords = [];
    const errors = [];

    for (const record of event.Records) {
        try {
            const result = await processOrderRecord(record, apiGatewayClient);
            processedRecords.push(result);
        } catch (error) {
            console.error('❌ Error processing record:', error);
            console.error('Record details:', JSON.stringify(record, null, 2));
            errors.push({
                recordId: record.eventID,
                error: error.message
            });
        }
    }

    console.log(`✅ Successfully processed ${processedRecords.length} records`);
    if (errors.length > 0) {
        console.log(`❌ Failed to process ${errors.length} records`);
    }

    return {
        statusCode: 200,
        processedRecords: processedRecords.length,
        totalRecords: event.Records.length,
        errors: errors.length,
        errorDetails: errors
    };
};

/**
 * Process individual DynamoDB stream record
 */
async function processOrderRecord(record, apiGatewayClient) {
    const { eventName, dynamodb: recordData } = record;
    
    console.log(`📋 Processing ${eventName} event for order record`);

    // Only process INSERT and MODIFY events
    if (!['INSERT', 'MODIFY'].includes(eventName)) {
        return { eventName, status: 'skipped', reason: 'Not INSERT or MODIFY event' };
    }

    const newImage = recordData.NewImage;
    const oldImage = recordData.OldImage;

    if (!newImage) {
        return { eventName, status: 'skipped', reason: 'No new image data' };
    }

    // Extract order data from DynamoDB format
    const orderData = unmarshallDynamoDBItem(newImage);
    const oldOrderData = oldImage ? unmarshallDynamoDBItem(oldImage) : {};

    const orderId = extractOrderId(orderData.PK);
    if (!orderId) {
        return { eventName, status: 'skipped', reason: 'Not an order record' };
    }

    console.log(`🔍 Processing order: ${orderId}, status: ${orderData.status}`);

    // Check if this is a status change that requires driver assignment
    const statusChanged = orderData.status !== oldOrderData.status;
    const isAssignableStatus = ASSIGNABLE_STATUSES.includes(orderData.status);
    const hasNoDriver = !orderData.driverId;

    if (statusChanged && isAssignableStatus && hasNoDriver) {
        console.log(`🎯 Order ${orderId} status changed to ${orderData.status} - triggering driver assignment`);
        
        try {
            // Log the assignment trigger
            await logAssignmentTrigger(orderId, orderData.status, 'status_change');

            // Trigger driver assignment using the existing service
            const assignmentResult = await assignDriverToOrder(orderId, orderData);

            if (assignmentResult.success) {
                console.log(`✅ Successfully assigned driver ${assignmentResult.driverName} to order ${orderId}`);
                
                // Notify stakeholders about the assignment
                await notifyOrderAssignment(orderId, assignmentResult, apiGatewayClient);
                
                return {
                    eventName,
                    status: 'assignment_triggered',
                    orderId,
                    assignedDriver: assignmentResult.driverId,
                    assignmentAttempt: assignmentResult.assignmentAttempt
                };
            } else {
                console.log(`❌ Failed to assign driver to order ${orderId}: ${assignmentResult.reason}`);
                
                // Handle assignment failure
                await handleAssignmentFailure(orderId, assignmentResult, apiGatewayClient);
                
                return {
                    eventName,
                    status: 'assignment_failed',
                    orderId,
                    reason: assignmentResult.reason,
                    attemptsMade: assignmentResult.attemptsMade || 0
                };
            }
        } catch (assignmentError) {
            console.error(`❌ Error during driver assignment for order ${orderId}:`, assignmentError);
            
            // Mark order with assignment error
            await markOrderAssignmentError(orderId, assignmentError.message);
            
            return {
                eventName,
                status: 'assignment_error',
                orderId,
                error: assignmentError.message
            };
        }
    }

    // Check for other relevant order changes
    if (statusChanged) {
        await handleOrderStatusChange(orderId, oldOrderData.status, orderData.status, apiGatewayClient);
        
        return {
            eventName,
            status: 'status_updated',
            orderId,
            oldStatus: oldOrderData.status,
            newStatus: orderData.status
        };
    }

    return { eventName, status: 'no_action_required', orderId };
}

/**
 * Extract order ID from DynamoDB PK
 */
function extractOrderId(pk) {
    if (!pk || typeof pk !== 'string') return null;
    const match = pk.match(/^ORDER#(.+)$/);
    return match ? match[1] : null;
}

/**
 * Unmarshal DynamoDB item from stream record
 */
function unmarshallDynamoDBItem(dynamoItem) {
    const result = {};
    
    for (const [key, value] of Object.entries(dynamoItem)) {
        if (value.S !== undefined) {
            result[key] = value.S;
        } else if (value.N !== undefined) {
            result[key] = Number(value.N);
        } else if (value.BOOL !== undefined) {
            result[key] = value.BOOL;
        } else if (value.L !== undefined) {
            result[key] = value.L.map(item => unmarshallDynamoDBItem({ temp: item }).temp);
        } else if (value.M !== undefined) {
            result[key] = unmarshallDynamoDBItem(value.M);
        } else if (value.SS !== undefined) {
            result[key] = value.SS;
        } else if (value.NS !== undefined) {
            result[key] = value.NS.map(Number);
        } else if (value.NULL !== undefined) {
            result[key] = null;
        }
    }
    
    return result;
}

/**
 * Log assignment trigger for analytics
 */
async function logAssignmentTrigger(orderId, status, trigger) {
    try {
        await dynamoDB.send(new UpdateCommand({
            TableName: ORDERS_TABLE,
            Key: {
                PK: `ORDER#${orderId}`,
                SK: `ASSIGNMENT_LOG#${Date.now()}`
            },
            UpdateExpression: 'SET orderId = :orderId, #status = :status, trigger_type = :trigger, triggered_at = :timestamp, event_type = :eventType',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':orderId': orderId,
                ':status': status,
                ':trigger': trigger,
                ':timestamp': new Date().toISOString(),
                ':eventType': 'assignment_trigger'
            },
            ConditionExpression: 'attribute_not_exists(PK)'
        }));
    } catch (error) {
        console.warn(`⚠️ Failed to log assignment trigger for order ${orderId}:`, error.message);
    }
}

/**
 * Handle general order status changes
 */
async function handleOrderStatusChange(orderId, oldStatus, newStatus, apiGatewayClient) {
    console.log(`📊 Order ${orderId} status changed: ${oldStatus} → ${newStatus}`);

    // Get order details for notifications
    try {
        const orderResult = await dynamoDB.send(new GetCommand({
            TableName: ORDERS_TABLE,
            Key: {
                PK: `ORDER#${orderId}`,
                SK: `ORDER#${orderId}`
            }
        }));

        if (orderResult.Item) {
            const order = orderResult.Item;
            
            // Notify relevant parties about status change
            await notifyOrderStatusChange(orderId, newStatus, order, apiGatewayClient);
            
            // Handle specific status transitions
            await handleSpecificStatusTransitions(orderId, oldStatus, newStatus, order, apiGatewayClient);
        }
    } catch (error) {
        console.error(`❌ Error handling status change for order ${orderId}:`, error);
    }
}

/**
 * Handle specific status transitions
 */
async function handleSpecificStatusTransitions(orderId, oldStatus, newStatus, order, apiGatewayClient) {
    switch (newStatus) {
        case 'confirmed':
            await handleOrderConfirmed(orderId, order, apiGatewayClient);
            break;
        case 'preparing':
            await handleOrderPreparing(orderId, order, apiGatewayClient);
            break;
        case 'ready_for_pickup':
            await handleOrderReadyForPickup(orderId, order, apiGatewayClient);
            break;
        case 'picked_up':
            await handleOrderPickedUp(orderId, order, apiGatewayClient);
            break;
        case 'delivered':
            await handleOrderDelivered(orderId, order, apiGatewayClient);
            break;
        case 'cancelled':
            await handleOrderCancelled(orderId, order, apiGatewayClient);
            break;
    }
}

/**
 * Handle order confirmed
 */
async function handleOrderConfirmed(orderId, order, apiGatewayClient) {
    console.log(`✅ Order ${orderId} confirmed`);
    
    // Notify restaurant to start preparation
    await notifyStakeholder(order.restaurantId, 'restaurant', {
        type: 'order_confirmed',
        orderId,
        message: 'Order confirmed - please start preparation',
        order: order
    }, apiGatewayClient);
}

/**
 * Handle order preparing
 */
async function handleOrderPreparing(orderId, order, apiGatewayClient) {
    console.log(`👨‍🍳 Order ${orderId} being prepared`);
    
    // Notify customer about preparation
    await notifyStakeholder(order.customerId, 'customer', {
        type: 'order_preparing',
        orderId,
        message: 'Your order is being prepared',
        estimatedTime: order.estimatedPreparationTime || 20
    }, apiGatewayClient);
}

/**
 * Handle order ready for pickup
 */
async function handleOrderReadyForPickup(orderId, order, apiGatewayClient) {
    console.log(`📦 Order ${orderId} ready for pickup`);
    
    // If driver already assigned, notify them
    if (order.driverId) {
        await notifyStakeholder(order.driverId, 'driver', {
            type: 'order_ready_for_pickup',
            orderId,
            message: 'Order is ready for pickup',
            restaurant: {
                name: order.restaurantName,
                address: order.restaurantAddress,
                location: order.restaurantLocation
            }
        }, apiGatewayClient);
    }
}

/**
 * Handle order picked up
 */
async function handleOrderPickedUp(orderId, order, apiGatewayClient) {
    console.log(`🚚 Order ${orderId} picked up`);
    
    // Notify customer about pickup
    await notifyStakeholder(order.customerId, 'customer', {
        type: 'order_picked_up',
        orderId,
        message: 'Your order has been picked up and is on the way',
        driver: {
            name: order.driverName,
            phone: order.driverPhone
        },
        estimatedDeliveryTime: order.estimatedDeliveryTime
    }, apiGatewayClient);
}

/**
 * Handle order delivered
 */
async function handleOrderDelivered(orderId, order, apiGatewayClient) {
    console.log(`🎉 Order ${orderId} delivered`);
    
    // Notify all parties about completion
    const deliveryMessage = {
        type: 'order_delivered',
        orderId,
        message: 'Order has been successfully delivered',
        deliveredAt: new Date().toISOString()
    };
    
    if (order.customerId) {
        await notifyStakeholder(order.customerId, 'customer', deliveryMessage, apiGatewayClient);
    }
    
    if (order.restaurantId) {
        await notifyStakeholder(order.restaurantId, 'restaurant', deliveryMessage, apiGatewayClient);
    }
    
    if (order.driverId) {
        await notifyStakeholder(order.driverId, 'driver', {
            ...deliveryMessage,
            earnings: order.driverEarnings
        }, apiGatewayClient);
    }
}

/**
 * Handle order cancelled
 */
async function handleOrderCancelled(orderId, order, apiGatewayClient) {
    console.log(`❌ Order ${orderId} cancelled`);
    
    const cancellationMessage = {
        type: 'order_cancelled',
        orderId,
        message: 'Order has been cancelled',
        reason: order.cancellationReason,
        cancelledAt: new Date().toISOString()
    };
    
    // Notify all relevant parties
    if (order.customerId) {
        await notifyStakeholder(order.customerId, 'customer', cancellationMessage, apiGatewayClient);
    }
    
    if (order.restaurantId) {
        await notifyStakeholder(order.restaurantId, 'restaurant', cancellationMessage, apiGatewayClient);
    }
    
    if (order.driverId) {
        await notifyStakeholder(order.driverId, 'driver', cancellationMessage, apiGatewayClient);
    }
}

/**
 * Notify order assignment to stakeholders
 */
async function notifyOrderAssignment(orderId, assignmentResult, apiGatewayClient) {
    try {
        // Get full order details
        const orderResult = await dynamoDB.send(new GetCommand({
            TableName: ORDERS_TABLE,
            Key: {
                PK: `ORDER#${orderId}`,
                SK: `ORDER#${orderId}`
            }
        }));

        if (!orderResult.Item) return;

        const order = orderResult.Item;
        const assignmentMessage = {
            type: 'driver_assigned',
            orderId,
            driver: {
                id: assignmentResult.driverId,
                name: assignmentResult.driverName
            },
            estimatedPickupTime: assignmentResult.estimatedPickupTime,
            assignedAt: new Date().toISOString()
        };

        // Notify customer
        if (order.customerId) {
            await notifyStakeholder(order.customerId, 'customer', {
                ...assignmentMessage,
                message: `Driver ${assignmentResult.driverName} has been assigned to your order`
            }, apiGatewayClient);
        }

        // Notify restaurant
        if (order.restaurantId) {
            await notifyStakeholder(order.restaurantId, 'restaurant', {
                ...assignmentMessage,
                message: `Driver ${assignmentResult.driverName} has been assigned for pickup`
            }, apiGatewayClient);
        }

        // Notify admin/support
        await notifyUsersByType('agent', {
            ...assignmentMessage,
            message: `Order ${orderId} assigned to driver ${assignmentResult.driverName}`
        }, apiGatewayClient);

    } catch (error) {
        console.error('❌ Error notifying order assignment:', error);
    }
}

/**
 * Handle assignment failure
 */
async function handleAssignmentFailure(orderId, assignmentResult, apiGatewayClient) {
    console.log(`❌ Handling assignment failure for order ${orderId}`);
    
    try {
        // Get order details
        const orderResult = await dynamoDB.send(new GetCommand({
            TableName: ORDERS_TABLE,
            Key: {
                PK: `ORDER#${orderId}`,
                SK: `ORDER#${orderId}`
            }
        }));

        if (!orderResult.Item) return;

        const order = orderResult.Item;
        const failureMessage = {
            type: 'assignment_failed',
            orderId,
            reason: assignmentResult.reason,
            attemptsMade: assignmentResult.attemptsMade || 0,
            timestamp: new Date().toISOString()
        };

        // Notify restaurant about delay
        if (order.restaurantId) {
            await notifyStakeholder(order.restaurantId, 'restaurant', {
                ...failureMessage,
                message: 'Unable to find available driver. We are working to resolve this.'
            }, apiGatewayClient);
        }

        // Notify customer about potential delay
        if (order.customerId) {
            await notifyStakeholder(order.customerId, 'customer', {
                ...failureMessage,
                message: 'We are finding the best driver for your order. There may be a slight delay.'
            }, apiGatewayClient);
        }

        // Alert admin/support team
        await notifyUsersByType('agent', {
            ...failureMessage,
            message: `URGENT: Order ${orderId} failed driver assignment after ${assignmentResult.attemptsMade || 0} attempts`,
            priority: 'high'
        }, apiGatewayClient);

    } catch (error) {
        console.error('❌ Error handling assignment failure:', error);
    }
}

/**
 * Mark order with assignment error
 */
async function markOrderAssignmentError(orderId, errorMessage) {
    try {
        await dynamoDB.send(new UpdateCommand({
            TableName: ORDERS_TABLE,
            Key: {
                PK: `ORDER#${orderId}`,
                SK: `ORDER#${orderId}`
            },
            UpdateExpression: 'SET assignmentError = :error, assignmentErrorAt = :timestamp, #status = :status',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':error': errorMessage,
                ':timestamp': new Date().toISOString(),
                ':status': 'assignment_error'
            }
        }));
    } catch (error) {
        console.warn(`⚠️ Failed to mark assignment error for order ${orderId}:`, error.message);
    }
}

/**
 * Notify order status change to stakeholders
 */
async function notifyOrderStatusChange(orderId, newStatus, order, apiGatewayClient) {
    const statusMessage = {
        type: 'order_status_change',
        orderId,
        status: newStatus,
        timestamp: new Date().toISOString()
    };

    // Notify customer
    if (order.customerId) {
        await notifyStakeholder(order.customerId, 'customer', statusMessage, apiGatewayClient);
    }

    // Notify restaurant
    if (order.restaurantId) {
        await notifyStakeholder(order.restaurantId, 'restaurant', statusMessage, apiGatewayClient);
    }

    // Notify driver
    if (order.driverId) {
        await notifyStakeholder(order.driverId, 'driver', statusMessage, apiGatewayClient);
    }

    // Notify admin/support
    await notifyUsersByType('agent', statusMessage, apiGatewayClient);
}

/**
 * Notify specific stakeholder - NOW USES SUBSCRIPTIONS TABLE!
 */
async function notifyStakeholder(userId, userType, message, apiGatewayClient) {
    if (!userId) return;

    try {
        console.log(`🔔 Notifying ${userType} ${userId} via subscriptions...`);
        
        // For drivers, check subscriptions first (pub/sub pattern)
        if (userType === 'driver' && message.type === 'driver_assigned') {
            const driverSubscriptions = await findDriverSubscriptions(userId, message.orderId);
            
            for (const subscription of driverSubscriptions) {
                try {
                    await apiGatewayClient.postToConnection({
                        ConnectionId: subscription.connectionId,
                        Data: JSON.stringify(message)
                    });
                    console.log(`✅ Sent notification to driver subscription: ${subscription.subscriptionId}`);
                } catch (connectionError) {
                    if (connectionError.statusCode === 410) {
                        await removeStaleSubscription(subscription.subscriptionId);
                    } else {
                        console.error(`❌ Error sending to subscription ${subscription.subscriptionId}:`, connectionError);
                    }
                }
            }
            
            // If no subscriptions found, fall back to direct connection lookup
            if (driverSubscriptions.length === 0) {
                console.log(`⚠️ No driver subscriptions found for ${userId}, trying direct connection...`);
                await notifyViaDirectConnection(userId, userType, message, apiGatewayClient);
            }
        } else {
            // For non-driver users or other message types, use direct connection
            await notifyViaDirectConnection(userId, userType, message, apiGatewayClient);
        }
    } catch (error) {
        console.error(`❌ Error notifying ${userType} ${userId}:`, error);
    }
}

/**
 * Notify via direct connection (fallback method)
 */
async function notifyViaDirectConnection(userId, userType, message, apiGatewayClient) {
    const connections = await findUserConnections(userId, userType);
    
    for (const connection of connections) {
        try {
            await apiGatewayClient.postToConnection({
                ConnectionId: connection.connectionId,
                Data: JSON.stringify(message)
            });
            console.log(`✅ Sent notification via direct connection: ${connection.connectionId}`);
        } catch (connectionError) {
            if (connectionError.statusCode === 410) {
                await removeStaleConnection(connection.connectionId);
            } else {
                console.error(`❌ Error sending to connection ${connection.connectionId}:`, connectionError);
            }
        }
    }
}

/**
 * Notify users by type
 */
async function notifyUsersByType(userType, message, apiGatewayClient) {
    try {
        // Find all connections of specified user type
        const result = await dynamoDB.send(new QueryCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            IndexName: 'UserTypeIndex',
            KeyConditionExpression: 'userType = :userType',
            ExpressionAttributeValues: {
                ':userType': userType
            }
        }));

        const connections = result.Items || [];
        
        for (const connection of connections) {
            try {
                await apiGatewayClient.postToConnection({
                    ConnectionId: connection.connectionId,
                    Data: JSON.stringify(message)
                });
            } catch (connectionError) {
                if (connectionError.statusCode === 410) {
                    await removeStaleConnection(connection.connectionId);
                }
            }
        }
    } catch (error) {
        console.error(`❌ Error notifying ${userType} users:`, error);
    }
}

/**
 * Find WebSocket connections for a user
 */
async function findUserConnections(userId, userType) {
    try {
        // Use GSI1 to query by entity (driver/business/agent)
        const entityType = userType === 'driver' ? 'DRIVER' : 
                          userType === 'merchant' || userType === 'business' ? 'BUSINESS' : 
                          'AGENT';
        const entityKey = `${entityType}#${userId}`;
        
        console.log(`🔍 Querying connections with GSI1PK: ${entityKey}`);
        
        const result = await dynamoDB.send(new QueryCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :entityKey',
            FilterExpression: 'isActive = :isActive AND authenticated = :authenticated',
            ExpressionAttributeValues: {
                ':entityKey': entityKey,
                ':isActive': true,
                ':authenticated': true
            }
        }));

        console.log(`✅ Found ${result.Items?.length || 0} active connections for ${entityKey}`);
        return result.Items || [];
    } catch (error) {
        console.error(`❌ Error finding connections for user ${userId}:`, error);
        return [];
    }
}

/**
 * Find driver subscriptions for order notifications
 */
async function findDriverSubscriptions(driverId, orderId) {
    try {
        console.log(`🔍 Searching subscriptions for driver: ${driverId}, order: ${orderId || 'any'}`);
        
        // Query subscriptions table for driver_orders subscriptions
        // Using userId-topic-index GSI with topic filter
        const driverTopic = `driver:${driverId}:orders`;
        
        const result = await dynamoDB.send(new QueryCommand({
            TableName: WEBSOCKET_SUBSCRIPTIONS_TABLE,
            IndexName: 'userId-topic-index',
            KeyConditionExpression: 'userId = :userId',
            FilterExpression: 'subscriptionType = :subscriptionType AND isActive = :isActive',
            ExpressionAttributeValues: {
                ':userId': driverId,
                ':subscriptionType': 'driver_orders',
                ':isActive': true
            }
        }));

        console.log(`✅ Found ${result.Items?.length || 0} driver subscriptions`);
        return result.Items || [];
    } catch (error) {
        console.error(`❌ Error finding driver subscriptions for ${driverId}:`, error);
        return [];
    }
}

/**
 * Remove stale subscription
 */
async function removeStaleSubscription(subscriptionId) {
    try {
        await dynamoDB.send(new UpdateCommand({
            TableName: WEBSOCKET_SUBSCRIPTIONS_TABLE,
            Key: { subscriptionId },
            UpdateExpression: 'SET isActive = :isActive, disconnectedAt = :disconnectedAt',
            ExpressionAttributeValues: {
                ':isActive': false,
                ':disconnectedAt': new Date().toISOString()
            }
        }));
    } catch (error) {
        console.warn(`⚠️ Error removing stale subscription ${subscriptionId}:`, error.message);
    }
}

/**
 * Remove stale WebSocket connection
 */
async function removeStaleConnection(connectionId) {
    try {
        // First, find the connection using ConnectionIdIndex to get PK and SK
        const queryResult = await dynamoDB.send(new QueryCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            IndexName: 'ConnectionIdIndex',
            KeyConditionExpression: 'connectionId = :connId',
            ExpressionAttributeValues: {
                ':connId': connectionId
            },
            Limit: 1
        }));

        if (queryResult.Items && queryResult.Items.length > 0) {
            const connection = queryResult.Items[0];
            
            // Update to mark as inactive
            await dynamoDB.send(new UpdateCommand({
                TableName: WEBSOCKET_CONNECTIONS_TABLE,
                Key: { 
                    PK: connection.PK,
                    SK: connection.SK
                },
                UpdateExpression: 'SET isActive = :isActive, disconnectedAt = :disconnectedAt',
                ExpressionAttributeValues: {
                    ':isActive': false,
                    ':disconnectedAt': new Date().toISOString()
                }
            }));
            
            console.log(`✅ Marked connection ${connectionId} as inactive`);
        }
    } catch (error) {
        console.warn(`⚠️ Error removing stale connection ${connectionId}:`, error.message);
    }
}

module.exports = {
    handler: exports.handler,
    processOrderRecord,
    extractOrderId,
    unmarshallDynamoDBItem
};
