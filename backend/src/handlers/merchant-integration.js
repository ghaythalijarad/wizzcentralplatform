// Central Platform Merchant Integration Handler
// Handles communication with the Merchant App Backend

const AWS = require('aws-sdk');
const { successResponse, errorResponse } = require('../utils/response');
const { validateJWT } = require('../utils/auth');

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Merchant Backend API Configuration
const MERCHANT_BACKEND_URL = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';

/**
 * Webhook endpoint to receive status updates from Merchant Backend
 * Called by: Merchant Backend when order status changes
 */
exports.receiveStatusUpdate = async (event) => {
  try {
    console.log('Received merchant status update:', JSON.stringify(event.body, null, 2));
    
    const body = JSON.parse(event.body);
    const { orderId, businessId, status, estimatedCompletionTime, rejectionReason, timestamp, merchantNotes } = body;

    // Validate required fields
    if (!orderId || !businessId || !status) {
      return errorResponse('Missing required fields: orderId, businessId, status', 400);
    }

    // Update order status in Central Platform database
    const updateParams = {
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    // Add optional fields if provided
    if (estimatedCompletionTime) {
      updateParams.UpdateExpression += ', estimatedCompletionTime = :estimatedCompletionTime';
      updateParams.ExpressionAttributeValues[':estimatedCompletionTime'] = estimatedCompletionTime;
    }

    if (rejectionReason) {
      updateParams.UpdateExpression += ', rejectionReason = :rejectionReason';
      updateParams.ExpressionAttributeValues[':rejectionReason'] = rejectionReason;
    }

    if (merchantNotes) {
      updateParams.UpdateExpression += ', merchantNotes = :merchantNotes';
      updateParams.ExpressionAttributeValues[':merchantNotes'] = merchantNotes;
    }

    const result = await dynamodb.update(updateParams).promise();
    console.log('Order status updated in Central Platform:', result.Attributes);

    // Handle different status updates
    await handleOrderStatusUpdate(result.Attributes);

    return successResponse({
      success: true,
      received: true,
      orderId,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing merchant status update:', error);
    return errorResponse('Failed to process status update: ' + error.message, 500);
  }
};

/**
 * Send order to Merchant Backend
 * Called by: Central Platform when customer places order
 */
exports.sendOrderToMerchant = async (event) => {
  try {
    // Validate JWT token
    const user = await validateJWT(event);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = JSON.parse(event.body);
    console.log('Sending order to merchant:', JSON.stringify(body, null, 2));

    const {
      orderId,
      businessId,
      customerId,
      customerName,
      customerPhone,
      deliveryAddress,
      items,
      totalAmount,
      notes,
      estimatedDeliveryTime
    } = body;

    // Validate required fields
    if (!orderId || !businessId || !customerId || !items || !totalAmount) {
      return errorResponse('Missing required fields', 400);
    }

    // Prepare payload for Merchant Backend
    const merchantPayload = {
      orderId,
      businessId,
      customerId,
      customerName,
      customerPhone,
      deliveryAddress,
      items,
      totalAmount,
      notes: notes || '',
      estimatedDeliveryTime: estimatedDeliveryTime || new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      centralPlatformCallback: `${event.headers['X-Forwarded-Proto'] || 'https'}://${event.headers.Host}/${event.requestContext.stage}/api/merchant-status-updates`
    };

    // Get JWT token for merchant backend authentication
    const jwtToken = await generateJWTForMerchant(businessId, user.userId);

    // Send order to Merchant Backend
    const fetch = require('node-fetch');
    const response = await fetch(`${MERCHANT_BACKEND_URL}/webhooks/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(merchantPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Merchant backend error: ${result.message || 'Unknown error'}`);
    }

    console.log('Order sent to merchant successfully:', result);

    // Store order in Central Platform database with pending status
    const orderParams = {
      TableName: process.env.ORDERS_TABLE,
      Item: {
        orderId,
        businessId,
        customerId,
        customerName,
        customerPhone,
        deliveryAddress,
        items,
        totalAmount,
        notes: notes || '',
        status: 'pending',
        merchantStatus: 'pending',
        estimatedDeliveryTime,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        orderSource: 'central-platform'
      }
    };

    await dynamodb.put(orderParams).promise();
    console.log('Order stored in Central Platform database');

    // Trigger real-time notification to merchant app
    try {
      const { sendOrderNotification } = require('./realtime-notifications');
      await sendOrderNotification({
        orderId,
        businessId,
        customerId,
        customerName,
        customerPhone,
        deliveryAddress,
        items,
        total: totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
        paymentMethod: 'cash'
      });
      console.log('✅ Real-time notification sent to merchant app');
    } catch (notificationError) {
      console.error('⚠️ Failed to send real-time notification:', notificationError.message);
      // Don't fail the order creation if notification fails
    }

    return successResponse({
      success: true,
      orderId,
      status: 'pending',
      message: 'Order sent to merchant successfully',
      merchantResponse: result
    });

  } catch (error) {
    console.error('Error sending order to merchant:', error);
    return errorResponse('Failed to send order to merchant: ' + error.message, 500);
  }
};

/**
 * Get order status from Central Platform
 * Called by: Customer/Driver apps to check order status
 */
exports.getOrderStatus = async (event) => {
  try {
    const user = await validateJWT(event);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { orderId } = event.pathParameters;

    const params = {
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId }
    };

    const result = await dynamodb.get(params).promise();

    if (!result.Item) {
      return errorResponse('Order not found', 404);
    }

    return successResponse(result.Item);

  } catch (error) {
    console.error('Error getting order status:', error);
    return errorResponse('Failed to get order status: ' + error.message, 500);
  }
};

/**
 * List orders for a specific customer
 * Called by: Customer app to show order history
 */
exports.getCustomerOrderHistory = async (event) => {
  try {
    const user = await validateJWT(event);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { customerId } = event.pathParameters;

    const params = {
      TableName: process.env.ORDERS_TABLE,
      FilterExpression: 'customerId = :customerId',
      ExpressionAttributeValues: {
        ':customerId': customerId
      },
      ScanIndexForward: false // Most recent first
    };

    const result = await dynamodb.scan(params).promise();

    return successResponse({
      orders: result.Items,
      count: result.Count
    });

  } catch (error) {
    console.error('Error getting customer order history:', error);
    return errorResponse('Failed to get order history: ' + error.message, 500);
  }
};

/**
 * Handle order status updates and trigger appropriate notifications
 */
async function handleOrderStatusUpdate(order) {
  const { orderId, status, customerId, businessId } = order;

  try {
    switch (status) {
      case 'accepted':
        console.log(`Order ${orderId} accepted by merchant`);
        // Notify customer app
        await notifyCustomer(customerId, orderId, 'Your order has been accepted and is being prepared!');
        // Notify driver app for assignment
        await notifyDriversForNewOrder(orderId, businessId);
        break;

      case 'rejected':
        console.log(`Order ${orderId} rejected by merchant`);
        // Notify customer app
        await notifyCustomer(customerId, orderId, `Your order was rejected: ${order.rejectionReason || 'Reason not provided'}`);
        // Potentially suggest alternative merchants
        await suggestAlternativeMerchants(customerId, orderId, businessId);
        break;

      case 'preparing':
        console.log(`Order ${orderId} is being prepared`);
        await notifyCustomer(customerId, orderId, 'Your order is being prepared');
        break;

      case 'ready':
        console.log(`Order ${orderId} is ready for pickup`);
        await notifyCustomer(customerId, orderId, 'Your order is ready for pickup/delivery');
        await notifyDriverForPickup(orderId);
        break;

      case 'picked_up':
        console.log(`Order ${orderId} picked up by driver`);
        await notifyCustomer(customerId, orderId, 'Your order is on the way!');
        break;

      case 'completed':
        console.log(`Order ${orderId} completed`);
        await notifyCustomer(customerId, orderId, 'Your order has been delivered successfully!');
        await finalizeOrder(orderId);
        break;

      default:
        console.log(`Unknown status ${status} for order ${orderId}`);
    }
  } catch (error) {
    console.error('Error handling order status update:', error);
  }
}

/**
 * Generate JWT token for merchant backend authentication
 */
async function generateJWTForMerchant(businessId, userId) {
  const jwt = require('jsonwebtoken');
  
  const payload = {
    businessId,
    userId,
    iss: 'wizzcentral-platform',
    aud: 'merchant-backend',
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
}

/**
 * Notify customer app about order status changes
 */
async function notifyCustomer(customerId, orderId, message) {
  try {
    console.log(`Notifying customer ${customerId} about order ${orderId}: ${message}`);
    
    // This would integrate with your customer app notification system
    // For now, we'll store the notification in a table for the customer app to poll
    const notificationParams = {
      TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
      Item: {
        notificationId: `customer_${customerId}_${Date.now()}`,
        userId: customerId,
        userType: 'customer',
        orderId,
        message,
        type: 'order_status_update',
        read: false,
        createdAt: new Date().toISOString()
      }
    };

    await dynamodb.put(notificationParams).promise();
    console.log('Customer notification stored');

    // TODO: Implement real-time push notifications
    // await sendPushNotification(customerId, 'customer', message);

  } catch (error) {
    console.error('Error notifying customer:', error);
  }
}

/**
 * Notify drivers about new orders available for pickup
 */
async function notifyDriversForNewOrder(orderId, businessId) {
  try {
    console.log(`Notifying drivers about new order ${orderId} from business ${businessId}`);
    
    // Get available drivers in the area (simplified for now)
    const driverParams = {
      TableName: process.env.DRIVERS_TABLE,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'available'
      }
    };

    const drivers = await dynamodb.scan(driverParams).promise();

    // Notify all available drivers
    for (const driver of drivers.Items) {
      const notificationParams = {
        TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
        Item: {
          notificationId: `driver_${driver.driverId}_${Date.now()}`,
          userId: driver.driverId,
          userType: 'driver',
          orderId,
          businessId,
          message: 'New delivery order available',
          type: 'new_order_available',
          read: false,
          createdAt: new Date().toISOString()
        }
      };

      await dynamodb.put(notificationParams).promise();
    }

    console.log(`Notified ${drivers.Items.length} drivers about new order`);

  } catch (error) {
    console.error('Error notifying drivers:', error);
  }
}

/**
 * Notify specific driver for order pickup
 */
async function notifyDriverForPickup(orderId) {
  try {
    console.log(`Notifying assigned driver for order ${orderId} pickup`);
    
    // Get the assigned driver for this order
    const orderParams = {
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId }
    };

    const order = await dynamodb.get(orderParams).promise();
    
    if (order.Item && order.Item.assignedDriverId) {
      const notificationParams = {
        TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
        Item: {
          notificationId: `driver_pickup_${order.Item.assignedDriverId}_${Date.now()}`,
          userId: order.Item.assignedDriverId,
          userType: 'driver',
          orderId,
          message: 'Order is ready for pickup',
          type: 'pickup_ready',
          read: false,
          createdAt: new Date().toISOString()
        }
      };

      await dynamodb.put(notificationParams).promise();
      console.log('Driver pickup notification stored');
    }

  } catch (error) {
    console.error('Error notifying driver for pickup:', error);
  }
}

/**
 * Suggest alternative merchants when an order is rejected
 */
async function suggestAlternativeMerchants(customerId, orderId, originalBusinessId) {
  try {
    console.log(`Suggesting alternative merchants for customer ${customerId} after order ${orderId} rejection`);
    
    // Get similar merchants (simplified - could use categories, location, etc.)
    const merchantParams = {
      TableName: process.env.MERCHANTS_TABLE,
      FilterExpression: '#status = :status AND businessId <> :originalBusinessId',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'approved',
        ':originalBusinessId': originalBusinessId
      }
    };

    const merchants = await dynamodb.scan(merchantParams).promise();
    
    // Limit to 3 suggestions
    const suggestions = merchants.Items.slice(0, 3);

    if (suggestions.length > 0) {
      const notificationParams = {
        TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
        Item: {
          notificationId: `alternatives_${customerId}_${Date.now()}`,
          userId: customerId,
          userType: 'customer',
          orderId,
          message: 'Check out these alternative restaurants',
          type: 'merchant_suggestions',
          data: suggestions,
          read: false,
          createdAt: new Date().toISOString()
        }
      };

      await dynamodb.put(notificationParams).promise();
      console.log('Alternative merchant suggestions stored');
    }

  } catch (error) {
    console.error('Error suggesting alternative merchants:', error);
  }
}

/**
 * Finalize order after completion
 */
async function finalizeOrder(orderId) {
  try {
    console.log(`Finalizing order ${orderId}`);
    
    // Update order status to completed
    const updateParams = {
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: 'SET completedAt = :completedAt, #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':completedAt': new Date().toISOString(),
        ':status': 'completed'
      }
    };

    await dynamodb.update(updateParams).promise();
    
    // TODO: Process payment, update analytics, send receipt, etc.
    console.log(`Order ${orderId} finalized successfully`);

  } catch (error) {
    console.error('Error finalizing order:', error);
  }
}
