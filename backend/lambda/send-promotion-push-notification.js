/**
 * Send Promotion Push Notifications to Merchants
 * Lambda function to send FCM push notifications to WhizzMerchants app
 * when a new promotion/campaign is created
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const https = require('https');

// Initialize AWS SDK clients
const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamoDbClient);

// Configuration
const DEVICE_TOKENS_TABLE = process.env.DEVICE_TOKENS_TABLE || 'WhizzMerchants_DeviceTokens';
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY; // Firebase Cloud Messaging Server Key

// CORS headers
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

exports.handler = async (event) => {
    console.log('📱 Promotion Push Notification Request:', JSON.stringify(event, null, 2));

    try {
        // Handle CORS preflight
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'CORS preflight successful' })
            };
        }

        // Parse request body
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        
        const {
            campaignId,
            title,
            message,
            type = 'promotion',
            targetAudience = 'merchants',
            data = {}
        } = body;

        // Validate required fields
        if (!title || !message) {
            return createResponse(400, {
                success: false,
                message: 'Missing required fields: title and message are required'
            });
        }

        console.log('📱 Sending promotion notification:', { campaignId, title, message });

        // Get all active merchant device tokens
        const deviceTokens = await getMerchantDeviceTokens();
        console.log(`📱 Found ${deviceTokens.length} active merchant devices`);

        if (deviceTokens.length === 0) {
            return createResponse(200, {
                success: true,
                message: 'No active merchant devices found',
                sent: 0
            });
        }

        // Send notifications in batches
        const results = await sendNotificationsBatch(deviceTokens, {
            title,
            message,
            type,
            data: {
                ...data,
                campaignId,
                type: 'promotion',
                notificationType: 'promotion',
                timestamp: new Date().toISOString()
            }
        });

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`✅ Notification results: ${successful} sent, ${failed} failed`);

        return createResponse(200, {
            success: true,
            message: `Push notifications sent to ${successful} merchants`,
            sent: successful,
            failed: failed,
            total: deviceTokens.length
        });

    } catch (error) {
        console.error('❌ Error sending promotion notifications:', error);
        return createResponse(500, {
            success: false,
            message: 'Failed to send push notifications',
            error: error.message
        });
    }
};

/**
 * Get all active merchant device tokens from DynamoDB
 */
async function getMerchantDeviceTokens() {
    try {
        const params = {
            TableName: DEVICE_TOKENS_TABLE,
            FilterExpression: 'isActive = :active',
            ExpressionAttributeValues: {
                ':active': true
            }
        };

        const result = await dynamodb.send(new ScanCommand(params));
        console.log(`📱 Found ${result.Items?.length || 0} active device tokens`);

        return (result.Items || []).map(item => ({
            tokenId: item.tokenId,
            merchantId: item.merchantId,
            deviceToken: item.deviceToken,
            platform: item.platform,
            deviceId: item.deviceId
        }));

    } catch (error) {
        console.error('❌ Error querying device tokens:', error);
        return [];
    }
}

/**
 * Send notifications to multiple devices in batch
 */
async function sendNotificationsBatch(deviceTokens, notificationData) {
    const results = [];

    // Send to each device (Firebase can handle multicast, but we'll send individually for better error tracking)
    for (const device of deviceTokens) {
        try {
            const result = await sendFCMNotification(device.deviceToken, notificationData, device.platform);
            results.push({
                success: result.success,
                deviceId: device.deviceId,
                merchantId: device.merchantId
            });
        } catch (error) {
            console.error(`❌ Failed to send to device ${device.deviceId}:`, error.message);
            results.push({
                success: false,
                deviceId: device.deviceId,
                merchantId: device.merchantId,
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Send FCM notification to a single device
 */
async function sendFCMNotification(deviceToken, notificationData, platform) {
    return new Promise((resolve, reject) => {
        // Check if FCM_SERVER_KEY is configured
        if (!FCM_SERVER_KEY) {
            console.warn('⚠️ FCM_SERVER_KEY not configured, simulating notification send');
            // Simulate successful send for testing
            resolve({
                success: true,
                messageId: 'simulated-' + Date.now()
            });
            return;
        }

        const payload = {
            to: deviceToken,
            priority: 'high',
            notification: {
                title: notificationData.title,
                body: notificationData.message,
                sound: 'default',
                badge: 1,
                ...(platform === 'ios' && {
                    mutable_content: true,
                    content_available: true
                })
            },
            data: notificationData.data
        };

        const payloadString = JSON.stringify(payload);

        const options = {
            hostname: 'fcm.googleapis.com',
            port: 443,
            path: '/fcm/send',
            method: 'POST',
            headers: {
                'Authorization': `key=${FCM_SERVER_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payloadString)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (res.statusCode === 200 && response.success === 1) {
                        console.log('✅ FCM notification sent successfully');
                        resolve({
                            success: true,
                            messageId: response.results[0].message_id
                        });
                    } else {
                        console.error('❌ FCM notification failed:', response);
                        reject(new Error(response.results?.[0]?.error || 'FCM send failed'));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse FCM response: ' + error.message));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ FCM request error:', error);
            reject(error);
        });

        req.write(payloadString);
        req.end();
    });
}

/**
 * Create HTTP response
 */
function createResponse(statusCode, body) {
    return {
        statusCode,
        headers,
        body: JSON.stringify(body)
    };
}
