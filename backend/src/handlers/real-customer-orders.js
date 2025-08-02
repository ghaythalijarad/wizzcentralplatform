// Real Customer Order Handler
// Processes orders from the customer app and forwards to merchants

const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const { successResponse, errorResponse } = require('../utils/response');

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Configuration
const MERCHANT_BACKEND_URL = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
const ORDERS_TABLE = process.env.ORDERS_TABLE;
const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE;
const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE;

/**
 * Process real customer order from the customer app
 * This replaces the old test order simulators
 */
exports.processCustomerOrder = async (event) => {
    try {
        console.log('🛒 Processing real customer order:', JSON.stringify(event.body, null, 2));

        const orderData = JSON.parse(event.body);

        // Validate required fields
        const requiredFields = [
            'customerId', 'businessId', 'customerName', 'customerPhone',
            'items', 'totalAmount', 'deliveryAddress', 'paymentMethod'
        ];

        for (const field of requiredFields) {
            if (!orderData[field]) {
                return errorResponse(`Missing required field: ${field}`, 400);
            }
        }

        // Generate unique order ID
        const orderId = uuidv4();
        const timestamp = new Date().toISOString();

        // Validate customer exists
        const customer = await getCustomerDetails(orderData.customerId);
        if (!customer) {
            return errorResponse('Customer not found', 404);
        }

        // Validate merchant exists and is active
        const merchant = await getMerchantDetails(orderData.businessId);
        if (!merchant || !merchant.isActive) {
            return errorResponse('Merchant not available', 400);
        }

        // Calculate order totals
        const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = merchant.deliveryFee || 3.99;
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + deliveryFee + tax;

        // Create complete order object
        const completeOrder = {
            orderId,
            customerId: orderData.customerId,
            businessId: orderData.businessId,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            customerEmail: orderData.customerEmail || customer.email,
            deliveryAddress: orderData.deliveryAddress,
            items: orderData.items.map(item => ({
                ...item,
                productId: item.productId || `PROD_${Date.now()}`,
                specialInstructions: item.specialInstructions || ''
            })),
            subtotal: Math.round(subtotal * 100) / 100,
            deliveryFee: Math.round(deliveryFee * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            totalAmount: Math.round(total * 100) / 100,
            paymentMethod: orderData.paymentMethod,
            notes: orderData.notes || '',
            status: 'pending',
            orderSource: 'customer_app', // Mark as real customer order
            createdAt: timestamp,
            updatedAt: timestamp,
            estimatedDeliveryTime: new Date(Date.now() + 45 * 60000).toISOString(), // 45 minutes
            centralPlatformCallback: `${process.env.API_GATEWAY_URL}/api/merchant-status-updates`
        };

        // Store order in Central Platform database
        await dynamodb.put({
            TableName: ORDERS_TABLE,
            Item: completeOrder
        }).promise();

        console.log('✅ Order stored in Central Platform database');

        // Forward order to merchant backend
        const merchantResponse = await forwardOrderToMerchant(completeOrder);

        if (!merchantResponse.success) {
            // If merchant backend fails, mark order as failed but keep it in system
            await updateOrderStatus(orderId, 'failed', 'Merchant system unavailable');
            return errorResponse('Order placed but merchant notification failed', 500);
        }

        // Send real-time notification to merchant app (if WebSocket is deployed)
        await sendRealtimeNotification(orderData.businessId, {
            type: 'new_order',
            orderId,
            customerName: orderData.customerName,
            totalAmount: completeOrder.totalAmount,
            items: completeOrder.items.length
        });

        console.log('🎉 Real customer order processed successfully');

        return successResponse({
            success: true,
            orderId,
            orderNumber: `WZ${Date.now().toString().slice(-6)}`,
            status: 'pending',
            totalAmount: completeOrder.totalAmount,
            estimatedDeliveryTime: completeOrder.estimatedDeliveryTime,
            message: 'Order placed successfully and sent to merchant'
        }, 201);

    } catch (error) {
        console.error('❌ Error processing customer order:', error);
        return errorResponse('Failed to process order: ' + error.message, 500);
    }
};

/**
 * Get customer details from database
 */
async function getCustomerDetails(customerId) {
    try {
        const result = await dynamodb.get({
            TableName: CUSTOMERS_TABLE,
            Key: { userId: customerId }
        }).promise();

        return result.Item;
    } catch (error) {
        console.error('Error fetching customer:', error);
        return null;
    }
}

/**
 * Get merchant details from database
 */
async function getMerchantDetails(businessId) {
    try {
        const result = await dynamodb.get({
            TableName: MERCHANTS_TABLE,
            Key: { businessId }
        }).promise();

        return result.Item;
    } catch (error) {
        console.error('Error fetching merchant:', error);
        return null;
    }
}

/**
 * Forward order to merchant backend system
 */
async function forwardOrderToMerchant(orderData) {
    try {
        const response = await fetch(`${MERCHANT_BACKEND_URL}/webhooks/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const responseData = await response.json();

        if (response.ok) {
            console.log('✅ Order forwarded to merchant backend successfully');
            return { success: true, data: responseData };
        } else {
            console.log('❌ Failed to forward order to merchant backend:', responseData);
            return { success: false, error: responseData };
        }
    } catch (error) {
        console.error('❌ Network error forwarding to merchant:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update order status in database
 */
async function updateOrderStatus(orderId, status, notes = null) {
    try {
        const updateParams = {
            TableName: ORDERS_TABLE,
            Key: { orderId },
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':status': status,
                ':updatedAt': new Date().toISOString()
            }
        };

        if (notes) {
            updateParams.UpdateExpression += ', notes = :notes';
            updateParams.ExpressionAttributeValues[':notes'] = notes;
        }

        await dynamodb.update(updateParams).promise();
        console.log(`Order ${orderId} status updated to: ${status}`);
    } catch (error) {
        console.error('Error updating order status:', error);
    }
}

/**
 * Send real-time notification to merchant app
 */
async function sendRealtimeNotification(businessId, notificationData) {
    try {
        // This will be implemented when WebSocket is deployed
        // For now, just log the notification
        console.log(`📱 Real-time notification for business ${businessId}:`, notificationData);

        // TODO: Implement WebSocket notification sending
        // await websocketService.sendToMerchant(businessId, notificationData);

    } catch (error) {
        console.error('Error sending real-time notification:', error);
    }
}

/**
 * Get customer order history
 */
exports.getCustomerOrderHistory = async (event) => {
    try {
        const { customerId } = event.pathParameters;
        const { limit = 20, lastEvaluatedKey } = event.queryStringParameters || {};

        const params = {
            TableName: ORDERS_TABLE,
            IndexName: 'customerId-createdAt-index',
            KeyConditionExpression: 'customerId = :customerId',
            ExpressionAttributeValues: {
                ':customerId': customerId
            },
            ScanIndexForward: false, // Latest orders first
            Limit: parseInt(limit)
        };

        if (lastEvaluatedKey) {
            params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
        }

        const result = await dynamodb.query(params).promise();

        return successResponse({
            orders: result.Items,
            lastEvaluatedKey: result.LastEvaluatedKey ?
                encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
            count: result.Items.length
        });

    } catch (error) {
        console.error('Error fetching customer order history:', error);
        return errorResponse('Failed to fetch order history', 500);
    }
};

/**
 * Get real-time order status for customer app
 */
exports.getOrderStatus = async (event) => {
    try {
        const { orderId } = event.pathParameters;

        const result = await dynamodb.get({
            TableName: ORDERS_TABLE,
            Key: { orderId }
        }).promise();

        if (!result.Item) {
            return errorResponse('Order not found', 404);
        }

        return successResponse({
            orderId: result.Item.orderId,
            status: result.Item.status,
            estimatedDeliveryTime: result.Item.estimatedDeliveryTime,
            driverInfo: result.Item.driverId ? {
                driverId: result.Item.driverId,
                driverName: result.Item.driverName,
                driverPhone: result.Item.driverPhone
            } : null,
            lastUpdate: result.Item.updatedAt
        });

    } catch (error) {
        console.error('Error fetching order status:', error);
        return errorResponse('Failed to fetch order status', 500);
    }
};

module.exports = {
    processCustomerOrder: exports.processCustomerOrder,
    getCustomerOrderHistory: exports.getCustomerOrderHistory,
    getOrderStatus: exports.getOrderStatus
};
