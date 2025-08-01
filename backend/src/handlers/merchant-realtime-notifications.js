// Real-time order notification system for merchant apps
// This enhances the existing merchant integration with WebSocket support

const AWS = require('aws-sdk');
const WebSocket = require('ws');

class MerchantNotificationService {
  constructor() {
    this.connections = new Map(); // Store WebSocket connections by businessId
    this.dynamodb = new AWS.DynamoDB.DocumentClient();
  }

  // Initialize WebSocket server
  initializeWebSocketServer(server) {
    const wss = new WebSocket.Server({ server, path: '/merchant-notifications' });
    
    wss.on('connection', (ws, req) => {
      console.log('New merchant WebSocket connection');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'authenticate') {
            const { businessId, jwtToken } = data;
            
            // Validate JWT token here
            if (this.validateJWT(jwtToken)) {
              this.connections.set(businessId, ws);
              console.log(`Merchant ${businessId} connected via WebSocket`);
              
              ws.send(JSON.stringify({
                type: 'authenticated',
                businessId,
                message: 'Connected successfully'
              }));
            } else {
              ws.close(1008, 'Invalid authentication');
            }
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
      
      ws.on('close', () => {
        // Remove connection from map
        for (const [businessId, connection] of this.connections.entries()) {
          if (connection === ws) {
            this.connections.delete(businessId);
            console.log(`Merchant ${businessId} disconnected`);
            break;
          }
        }
      });
    });
  }

  // Send real-time notification to specific merchant
  async notifyMerchant(businessId, notification) {
    const connection = this.connections.get(businessId);
    
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify({
        type: 'new_order',
        businessId,
        ...notification
      }));
      console.log(`Real-time notification sent to merchant ${businessId}`);
      return true;
    } else {
      console.log(`No active connection for merchant ${businessId}, storing notification`);
      await this.storeNotification(businessId, notification);
      return false;
    }
  }

  // Store notification for offline merchants
  async storeNotification(businessId, notification) {
    const params = {
      TableName: process.env.MERCHANT_NOTIFICATIONS_TABLE || 'merchant-notifications-dev',
      Item: {
        notificationId: `merchant_${businessId}_${Date.now()}`,
        businessId,
        type: 'new_order',
        data: notification,
        read: false,
        createdAt: new Date().toISOString()
      }
    };

    await this.dynamodb.put(params).promise();
  }

  // Enhanced order notification
  async notifyNewOrder(orderData) {
    const { businessId } = orderData;
    
    const notification = {
      orderId: orderData.orderId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      deliveryAddress: orderData.deliveryAddress,
      estimatedDeliveryTime: orderData.estimatedDeliveryTime,
      timestamp: new Date().toISOString(),
      message: `New order from ${orderData.customerName}`
    };

    // Try WebSocket first, fallback to stored notification
    const sent = await this.notifyMerchant(businessId, notification);
    
    if (!sent) {
      // Also try FCM push notification as fallback
      await this.sendFCMNotification(businessId, notification);
    }
  }

  // FCM Push notification fallback
  async sendFCMNotification(businessId, notification) {
    try {
      // Get merchant's FCM token from database
      const merchantTokens = await this.getMerchantFCMTokens(businessId);
      
      if (merchantTokens.length > 0) {
        const admin = require('firebase-admin');
        
        const message = {
          notification: {
            title: '🆕 New Order!',
            body: `Order from ${notification.customerName} - $${notification.totalAmount}`
          },
          data: {
            type: 'new_order',
            orderId: notification.orderId,
            businessId,
            orderData: JSON.stringify(notification)
          },
          tokens: merchantTokens
        };

        const response = await admin.messaging().sendMulticast(message);
        console.log(`FCM notifications sent: ${response.successCount}/${merchantTokens.length}`);
      }
    } catch (error) {
      console.error('FCM notification error:', error);
    }
  }

  // Get merchant FCM tokens
  async getMerchantFCMTokens(businessId) {
    try {
      const params = {
        TableName: process.env.MERCHANT_FCM_TOKENS_TABLE || 'merchant-fcm-tokens-dev',
        KeyConditionExpression: 'businessId = :businessId',
        ExpressionAttributeValues: {
          ':businessId': businessId
        }
      };

      const result = await this.dynamodb.query(params).promise();
      return result.Items?.map(item => item.fcmToken) || [];
    } catch (error) {
      console.error('Error getting FCM tokens:', error);
      return [];
    }
  }

  validateJWT(token) {
    // Implement JWT validation logic
    // For now, return true (implement proper validation in production)
    return true;
  }
}

// Enhanced merchant integration handler with real-time notifications
const notificationService = new MerchantNotificationService();

// Modified sendOrderToMerchant function with real-time notifications
async function sendOrderToMerchantEnhanced(orderData) {
  try {
    // Send to merchant backend API (existing functionality)
    const response = await fetch(`${MERCHANT_BACKEND_URL}/webhooks/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (response.ok) {
      // Store in database (existing functionality)
      await storeOrderInDatabase(orderData);
      
      // NEW: Send real-time notification to merchant app
      await notificationService.notifyNewOrder(orderData);
      
      console.log('✅ Order sent to merchant with real-time notification');
      return { success: true, data: result };
    } else {
      throw new Error(`Merchant backend error: ${result.message}`);
    }
  } catch (error) {
    console.error('Error sending order to merchant:', error);
    throw error;
  }
}

module.exports = {
  MerchantNotificationService,
  notificationService,
  sendOrderToMerchantEnhanced
};
