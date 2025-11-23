/**
 * Discount Push Notification Lambda Handler
 * Sends push notifications to customers about discounts and promotions
 * 
 * Features:
 * - Fetch customer device tokens from DynamoDB
 * - Send via FCM (Firebase Cloud Messaging)
 * - Support targeting: all customers, specific segments, location-based
 * - Schedule notifications for later
 * - Track notification delivery status
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const https = require('https');

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

// Table names
const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE || 'WizzUser_users_dev';
const DEVICE_TOKENS_TABLE = process.env.DEVICE_TOKENS_TABLE || 'WhizzCustomers_DeviceTokens';
const NOTIFICATION_LOG_TABLE = process.env.NOTIFICATION_LOG_TABLE || 'WizzCentral_Notification_Logs';
const BUSINESSES_TABLE = process.env.BUSINESSES_TABLE || 'WhizzMerchants_Businesses';

// FCM Server Key (should be in environment variable)
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
    console.log('📱 Discount Push Notification Handler invoked');
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        // Parse request body
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        
        const {
            discountId,
            discountCode,
            merchantId,
            merchantName,
            discountType,
            discountValue,
            description,
            validUntil,
            minimumOrderValue,
            targetAudience = 'all', // 'all', 'nearby', 'loyal', 'new', 'custom'
            customUserIds = [],
            locationRadius = 5, // km for nearby targeting
            scheduledTime = null,
            notificationTitle,
            notificationBody,
            imageUrl = null
        } = body;

        // Validate required fields
        if (!discountId || !discountCode) {
            return buildResponse(400, {
                success: false,
                message: 'Missing required fields: discountId, discountCode'
            });
        }

        // If scheduled for later, store and return
        if (scheduledTime && new Date(scheduledTime) > new Date()) {
            await scheduleNotification(body);
            return buildResponse(200, {
                success: true,
                message: 'Notification scheduled successfully',
                scheduledTime
            });
        }

        // Get merchant info if needed
        let merchant = null;
        if (merchantId) {
            merchant = await getMerchantInfo(merchantId);
        }

        // Build notification payload
        const notification = {
            title: notificationTitle || buildNotificationTitle(discountCode, discountValue, discountType),
            body: notificationBody || buildNotificationBody(merchantName || merchant?.businessName, description, discountValue, discountType),
            image: imageUrl || merchant?.logoUrl || null,
            data: {
                type: 'discount_offer',
                discountId,
                discountCode,
                merchantId: merchantId || '',
                merchantName: merchantName || merchant?.businessName || '',
                discountType,
                discountValue: String(discountValue),
                validUntil: validUntil || '',
                minimumOrderValue: String(minimumOrderValue || 0),
                deepLink: `whizzcustomers://discount/${discountId}`
            }
        };

        // Get target customers based on audience type
        const targetCustomers = await getTargetCustomers({
            targetAudience,
            customUserIds,
            merchantId,
            merchant,
            locationRadius
        });

        console.log(`🎯 Target customers: ${targetCustomers.length}`);

        if (targetCustomers.length === 0) {
            return buildResponse(200, {
                success: true,
                message: 'No target customers found',
                sent: 0,
                failed: 0
            });
        }

        // Get device tokens for target customers
        const deviceTokens = await getDeviceTokensForUsers(targetCustomers);
        console.log(`📱 Device tokens found: ${deviceTokens.length}`);

        if (deviceTokens.length === 0) {
            return buildResponse(200, {
                success: true,
                message: 'No device tokens found for target customers',
                sent: 0,
                failed: 0
            });
        }

        // Send push notifications via FCM
        const results = await sendFCMNotifications(deviceTokens, notification);

        // Log notification delivery
        await logNotification({
            discountId,
            discountCode,
            merchantId,
            targetAudience,
            totalTargeted: targetCustomers.length,
            totalTokens: deviceTokens.length,
            sent: results.success,
            failed: results.failed,
            timestamp: Date.now()
        });

        return buildResponse(200, {
            success: true,
            message: 'Push notifications sent',
            targeted: targetCustomers.length,
            sent: results.success,
            failed: results.failed,
            details: results.details
        });

    } catch (error) {
        console.error('❌ Error sending discount notifications:', error);
        return buildResponse(500, {
            success: false,
            message: 'Failed to send notifications',
            error: error.message
        });
    }
};

/**
 * Get merchant information from DynamoDB
 */
async function getMerchantInfo(merchantId) {
    try {
        const command = new QueryCommand({
            TableName: BUSINESSES_TABLE,
            KeyConditionExpression: 'businessId = :id',
            ExpressionAttributeValues: {
                ':id': merchantId
            },
            Limit: 1
        });
        const result = await dynamoDB.send(command);
        return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    } catch (error) {
        console.error('Error fetching merchant info:', error);
        return null;
    }
}

/**
 * Get target customers based on audience type
 */
async function getTargetCustomers({ targetAudience, customUserIds, merchantId, merchant, locationRadius }) {
    console.log(`🎯 Getting target customers for audience: ${targetAudience}`);

    // Custom user list
    if (targetAudience === 'custom' && customUserIds.length > 0) {
        return customUserIds.map(id => ({ userId: id }));
    }

    // Get all customers and filter
    const command = new ScanCommand({
        TableName: CUSTOMERS_TABLE,
        ProjectionExpression: 'userId, #loc, orderHistory, createdAt',
        ExpressionAttributeNames: {
            '#loc': 'location'
        }
    });

    const result = await dynamoDB.send(command);
    let customers = result.Items || [];

    // Apply filters based on target audience
    switch (targetAudience) {
        case 'nearby':
            if (merchant && merchant.location) {
                customers = customers.filter(c => 
                    c.location && isWithinRadius(
                        merchant.location.latitude,
                        merchant.location.longitude,
                        c.location.latitude,
                        c.location.longitude,
                        locationRadius
                    )
                );
            }
            break;

        case 'loyal':
            // Customers with 5+ orders
            customers = customers.filter(c => 
                c.orderHistory && Array.isArray(c.orderHistory) && c.orderHistory.length >= 5
            );
            break;

        case 'new':
            // Customers created in last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            customers = customers.filter(c => 
                c.createdAt && c.createdAt > thirtyDaysAgo
            );
            break;

        case 'all':
        default:
            // All customers
            break;
    }

    return customers;
}

/**
 * Get device tokens for target users
 */
async function getDeviceTokensForUsers(users) {
    const userIds = users.map(u => u.userId);
    const tokens = [];

    // Batch query device tokens (DynamoDB limits apply)
    // For simplicity, we'll scan the device tokens table
    // In production, consider using GSI on userId
    try {
        const command = new ScanCommand({
            TableName: DEVICE_TOKENS_TABLE,
            FilterExpression: 'userId IN (:userIds) AND #status = :active',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':userIds': userIds,
                ':active': 'active'
            }
        });

        const result = await dynamoDB.send(command);
        return (result.Items || []).map(item => ({
            token: item.deviceToken || item.token,
            userId: item.userId,
            platform: item.platform || 'unknown'
        }));
    } catch (error) {
        console.error('Error fetching device tokens:', error);
        return [];
    }
}

/**
 * Send FCM notifications to multiple devices
 */
async function sendFCMNotifications(deviceTokens, notification) {
    if (!FCM_SERVER_KEY) {
        console.warn('⚠️ FCM_SERVER_KEY not configured, simulating send');
        return {
            success: deviceTokens.length,
            failed: 0,
            details: 'FCM not configured, simulation only'
        };
    }

    const results = {
        success: 0,
        failed: 0,
        details: []
    };

    // Send in batches of 100 (FCM limit is 1000, but we'll be conservative)
    const batchSize = 100;
    for (let i = 0; i < deviceTokens.length; i += batchSize) {
        const batch = deviceTokens.slice(i, i + batchSize);
        const tokens = batch.map(d => d.token);

        try {
            const response = await sendFCMBatch(tokens, notification);
            results.success += response.success || 0;
            results.failed += response.failure || 0;
            results.details.push({
                batch: Math.floor(i / batchSize) + 1,
                tokens: tokens.length,
                ...response
            });
        } catch (error) {
            console.error(`Error sending batch ${i / batchSize}:`, error);
            results.failed += batch.length;
            results.details.push({
                batch: Math.floor(i / batchSize) + 1,
                tokens: tokens.length,
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Send a batch of notifications via FCM
 */
function sendFCMBatch(tokens, notification) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            registration_ids: tokens,
            notification: {
                title: notification.title,
                body: notification.body,
                image: notification.image,
                sound: 'default',
                badge: '1'
            },
            data: notification.data,
            priority: 'high'
        });

        const options = {
            hostname: 'fcm.googleapis.com',
            path: '/fcm/send',
            method: 'POST',
            headers: {
                'Authorization': `key=${FCM_SERVER_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('FCM Response:', response);
                    resolve(response);
                } catch (e) {
                    reject(new Error('Invalid FCM response'));
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

/**
 * Schedule notification for later delivery
 */
async function scheduleNotification(notificationData) {
    // Store in DynamoDB for processing by scheduled job
    const command = new PutCommand({
        TableName: 'WizzCentral_Scheduled_Notifications',
        Item: {
            notificationId: `SCHED_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            ...notificationData,
            status: 'scheduled',
            createdAt: Date.now()
        }
    });
    await dynamoDB.send(command);
}

/**
 * Log notification delivery
 */
async function logNotification(logData) {
    try {
        const command = new PutCommand({
            TableName: NOTIFICATION_LOG_TABLE,
            Item: {
                logId: `LOG_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                ...logData,
                createdAt: Date.now()
            }
        });
        await dynamoDB.send(command);
    } catch (error) {
        console.error('Error logging notification:', error);
    }
}

/**
 * Build notification title
 */
function buildNotificationTitle(code, value, type) {
    if (type === 'percentage') {
        return `${value}% Off with ${code}! 🎉`;
    } else if (type === 'freeDelivery') {
        return `Free Delivery with ${code}! 🚚`;
    } else {
        return `Special Offer: ${code}! 🎁`;
    }
}

/**
 * Build notification body
 */
function buildNotificationBody(merchantName, description, value, type) {
    let body = '';
    if (merchantName) {
        body = `${merchantName}: `;
    }
    if (description) {
        body += description;
    } else if (type === 'percentage') {
        body += `Get ${value}% off your order!`;
    } else if (type === 'freeDelivery') {
        body += 'Enjoy free delivery on your next order!';
    } else {
        body += 'Special offer just for you!';
    }
    body += ' Tap to order now! 🛍️';
    return body;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function isWithinRadius(lat1, lon1, lat2, lon2, radiusKm) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return false;
    
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance <= radiusKm;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Build HTTP response
 */
function buildResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*'
        },
        body: JSON.stringify(body)
    };
}
