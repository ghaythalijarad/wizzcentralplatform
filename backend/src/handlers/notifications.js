// Notifications Handler for Customer and Driver Apps
// Manages real-time notifications across the ecosystem

const AWS = require('aws-sdk');
const { successResponse, errorResponse } = require('../utils/response');
const { validateJWT } = require('../utils/auth');

const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Get notifications for a user (customer or driver)
 */
exports.getUserNotifications = async (event) => {
  try {
    const user = await validateJWT(event);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { userId } = event.pathParameters;
    const { limit = 50, unreadOnly = false } = event.queryStringParameters || {};

    // Verify user can access these notifications
    if (user.userId !== userId && user.role !== 'admin') {
      return errorResponse('Forbidden: Cannot access other user notifications', 403);
    }

    let filterExpression = 'userId = :userId';
    const expressionAttributeValues = {
      ':userId': userId
    };

    if (unreadOnly === 'true') {
      filterExpression += ' AND #read = :read';
      expressionAttributeValues[':read'] = false;
    }

    const params = {
      TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
      FilterExpression: filterExpression,
      ExpressionAttributeNames: unreadOnly === 'true' ? { '#read': 'read' } : {},
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: parseInt(limit),
      ScanIndexForward: false // Most recent first
    };

    const result = await dynamodb.scan(params).promise();

    return successResponse({
      notifications: result.Items,
      count: result.Count,
      unreadCount: result.Items.filter(n => !n.read).length
    });

  } catch (error) {
    console.error('Error getting user notifications:', error);
    return errorResponse('Failed to get notifications: ' + error.message, 500);
  }
};

/**
 * Mark notification as read
 */
exports.markNotificationRead = async (event) => {
  try {
    const user = await validateJWT(event);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { notificationId } = event.pathParameters;

    // Get notification to verify ownership
    const getParams = {
      TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
      Key: { notificationId }
    };

    const notification = await dynamodb.get(getParams).promise();

    if (!notification.Item) {
      return errorResponse('Notification not found', 404);
    }

    // Verify user can mark this notification as read
    if (notification.Item.userId !== user.userId && user.role !== 'admin') {
      return errorResponse('Forbidden: Cannot access this notification', 403);
    }

    // Mark as read
    const updateParams = {
      TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
      Key: { notificationId },
      UpdateExpression: 'SET #read = :read, readAt = :readAt',
      ExpressionAttributeNames: {
        '#read': 'read'
      },
      ExpressionAttributeValues: {
        ':read': true,
        ':readAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(updateParams).promise();

    return successResponse(result.Attributes);

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return errorResponse('Failed to mark notification as read: ' + error.message, 500);
  }
};

/**
 * Mark all notifications as read for a user
 */
exports.markAllNotificationsRead = async (event) => {
  try {
    const user = await validateJWT(event);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { userId } = event.pathParameters;

    // Verify user can access these notifications
    if (user.userId !== userId && user.role !== 'admin') {
      return errorResponse('Forbidden: Cannot access other user notifications', 403);
    }

    // Get all unread notifications for user
    const scanParams = {
      TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
      FilterExpression: 'userId = :userId AND #read = :read',
      ExpressionAttributeNames: {
        '#read': 'read'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':read': false
      }
    };

    const unreadNotifications = await dynamodb.scan(scanParams).promise();

    // Mark all as read
    const updatePromises = unreadNotifications.Items.map(notification => {
      const updateParams = {
        TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
        Key: { notificationId: notification.notificationId },
        UpdateExpression: 'SET #read = :read, readAt = :readAt',
        ExpressionAttributeNames: {
          '#read': 'read'
        },
        ExpressionAttributeValues: {
          ':read': true,
          ':readAt': new Date().toISOString()
        }
      };
      return dynamodb.update(updateParams).promise();
    });

    await Promise.all(updatePromises);

    return successResponse({
      success: true,
      markedAsRead: unreadNotifications.Items.length,
      message: `Marked ${unreadNotifications.Items.length} notifications as read`
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return errorResponse('Failed to mark notifications as read: ' + error.message, 500);
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (event) => {
  try {
    const user = await validateJWT(event);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { notificationId } = event.pathParameters;

    // Get notification to verify ownership
    const getParams = {
      TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
      Key: { notificationId }
    };

    const notification = await dynamodb.get(getParams).promise();

    if (!notification.Item) {
      return errorResponse('Notification not found', 404);
    }

    // Verify user can delete this notification
    if (notification.Item.userId !== user.userId && user.role !== 'admin') {
      return errorResponse('Forbidden: Cannot delete this notification', 403);
    }

    // Delete notification
    const deleteParams = {
      TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
      Key: { notificationId }
    };

    await dynamodb.delete(deleteParams).promise();

    return successResponse({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return errorResponse('Failed to delete notification: ' + error.message, 500);
  }
};

/**
 * Send custom notification to user
 * Used by admin or system for important announcements
 */
exports.sendNotification = async (event) => {
  try {
    const user = await validateJWT(event);
    if (!user || user.role !== 'admin') {
      return errorResponse('Unauthorized: Admin access required', 401);
    }

    const body = JSON.parse(event.body);
    const { userId, userType, message, type, data, title } = body;

    if (!userId || !message || !type) {
      return errorResponse('Missing required fields: userId, message, type', 400);
    }

    const notificationParams = {
      TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
      Item: {
        notificationId: `admin_${userId}_${Date.now()}`,
        userId,
        userType: userType || 'customer',
        message,
        title: title || 'System Notification',
        type,
        data: data || {},
        read: false,
        createdAt: new Date().toISOString(),
        sentBy: user.userId
      }
    };

    await dynamodb.put(notificationParams).promise();

    // TODO: Send real-time push notification
    // await sendPushNotification(userId, userType, { title, message, data });

    return successResponse({
      success: true,
      notificationId: notificationParams.Item.notificationId,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return errorResponse('Failed to send notification: ' + error.message, 500);
  }
};

/**
 * Get notification statistics for admin dashboard
 */
exports.getNotificationStats = async (event) => {
  try {
    const user = await validateJWT(event);
    if (!user || user.role !== 'admin') {
      return errorResponse('Unauthorized: Admin access required', 401);
    }

    const { timeframe = '24h' } = event.queryStringParameters || {};

    // Calculate time boundary
    const now = new Date();
    let timeBoundary;
    switch (timeframe) {
      case '1h':
        timeBoundary = new Date(now - 60 * 60 * 1000);
        break;
      case '24h':
        timeBoundary = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeBoundary = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeBoundary = new Date(now - 24 * 60 * 60 * 1000);
    }

    // Get notifications within timeframe
    const params = {
      TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
      FilterExpression: 'createdAt >= :timeBoundary',
      ExpressionAttributeValues: {
        ':timeBoundary': timeBoundary.toISOString()
      }
    };

    const result = await dynamodb.scan(params).promise();
    const notifications = result.Items;

    // Calculate statistics
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {},
      byUserType: {},
      readRate: 0
    };

    // Group by type and user type
    notifications.forEach(notification => {
      // By notification type
      if (!stats.byType[notification.type]) {
        stats.byType[notification.type] = { total: 0, unread: 0 };
      }
      stats.byType[notification.type].total++;
      if (!notification.read) {
        stats.byType[notification.type].unread++;
      }

      // By user type
      if (!stats.byUserType[notification.userType]) {
        stats.byUserType[notification.userType] = { total: 0, unread: 0 };
      }
      stats.byUserType[notification.userType].total++;
      if (!notification.read) {
        stats.byUserType[notification.userType].unread++;
      }
    });

    // Calculate read rate
    if (stats.total > 0) {
      stats.readRate = Math.round(((stats.total - stats.unread) / stats.total) * 100);
    }

    return successResponse({
      timeframe,
      stats,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting notification stats:', error);
    return errorResponse('Failed to get notification stats: ' + error.message, 500);
  }
};

/**
 * Driver-specific: Accept order assignment
 */
exports.acceptOrderAssignment = async (event) => {
  try {
    const user = await validateJWT(event);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { orderId } = event.pathParameters;
    const { estimatedPickupTime } = JSON.parse(event.body || '{}');

    // Update order with assigned driver
    const updateParams = {
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: 'SET assignedDriverId = :driverId, driverStatus = :status, estimatedPickupTime = :pickupTime, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':driverId': user.userId,
        ':status': 'assigned',
        ':pickupTime': estimatedPickupTime || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(updateParams).promise();

    // Notify customer about driver assignment
    const order = result.Attributes;
    const notificationParams = {
      TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
      Item: {
        notificationId: `driver_assigned_${order.customerId}_${Date.now()}`,
        userId: order.customerId,
        userType: 'customer',
        orderId,
        message: 'A driver has been assigned to your order',
        type: 'driver_assigned',
        data: {
          driverId: user.userId,
          estimatedPickupTime
        },
        read: false,
        createdAt: new Date().toISOString()
      }
    };

    await dynamodb.put(notificationParams).promise();

    return successResponse({
      success: true,
      orderId,
      assignedDriverId: user.userId,
      estimatedPickupTime,
      message: 'Order assignment accepted'
    });

  } catch (error) {
    console.error('Error accepting order assignment:', error);
    return errorResponse('Failed to accept order assignment: ' + error.message, 500);
  }
};

/**
 * Driver-specific: Update delivery status
 */
exports.updateDeliveryStatus = async (event) => {
  try {
    const user = await validateJWT(event);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { orderId } = event.pathParameters;
    const body = JSON.parse(event.body);
    const { status, location, notes } = body;

    if (!status) {
      return errorResponse('Status is required', 400);
    }

    // Validate status
    const validStatuses = ['en_route_to_pickup', 'arrived_at_pickup', 'picked_up', 'en_route_to_delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return errorResponse('Invalid status', 400);
    }

    // Update order with delivery status
    const updateParams = {
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: 'SET driverStatus = :status, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }
    };

    if (location) {
      updateParams.UpdateExpression += ', driverLocation = :location';
      updateParams.ExpressionAttributeValues[':location'] = location;
    }

    if (notes) {
      updateParams.UpdateExpression += ', driverNotes = :notes';
      updateParams.ExpressionAttributeValues[':notes'] = notes;
    }

    if (status === 'delivered') {
      updateParams.UpdateExpression += ', deliveredAt = :deliveredAt, #status = :completedStatus';
      updateParams.ExpressionAttributeNames = { '#status': 'status' };
      updateParams.ExpressionAttributeValues[':deliveredAt'] = new Date().toISOString();
      updateParams.ExpressionAttributeValues[':completedStatus'] = 'completed';
    }

    const result = await dynamodb.update(updateParams).promise();

    // Get order details for notifications
    const orderParams = {
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId }
    };
    const order = await dynamodb.get(orderParams).promise();

    // Send appropriate notifications
    if (order.Item) {
      const messageMap = {
        'en_route_to_pickup': 'Driver is on the way to restaurant',
        'arrived_at_pickup': 'Driver has arrived at restaurant',
        'picked_up': 'Your order has been picked up and is on the way!',
        'en_route_to_delivery': 'Driver is on the way to you',
        'delivered': 'Your order has been delivered!'
      };

      const notificationParams = {
        TableName: process.env.NOTIFICATIONS_TABLE || 'wizzcentral-backend-notifications-dev',
        Item: {
          notificationId: `delivery_update_${order.Item.customerId}_${Date.now()}`,
          userId: order.Item.customerId,
          userType: 'customer',
          orderId,
          message: messageMap[status],
          type: 'delivery_update',
          data: {
            status,
            location,
            notes,
            driverId: user.userId
          },
          read: false,
          createdAt: new Date().toISOString()
        }
      };

      await dynamodb.put(notificationParams).promise();
    }

    return successResponse({
      success: true,
      orderId,
      status,
      message: 'Delivery status updated successfully'
    });

  } catch (error) {
    console.error('Error updating delivery status:', error);
    return errorResponse('Failed to update delivery status: ' + error.message, 500);
  }
};
