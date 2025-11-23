/**
 * Merchant Information Push Notification Lambda Handler
 * Sends informational push notifications to merchants
 * 
 * Use Cases:
 * - Policy updates and changes
 * - New features announcements
 * - Platform maintenance notices
 * - Promotional opportunities
 * - Important system alerts
 * - Training and educational content
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const admin = require('firebase-admin');

// Initialize clients
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);
const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Table names
const BUSINESSES_TABLE = process.env.BUSINESSES_TABLE || 'WhizzMerchants_Businesses';
const MERCHANT_DEVICE_TOKENS_TABLE = process.env.MERCHANT_DEVICE_TOKENS_TABLE || 'WhizzMerchants_DeviceTokens';
const NOTIFICATION_LOG_TABLE = process.env.NOTIFICATION_LOG_TABLE || 'WizzCentral_Merchant_Notification_Logs';
const FIREBASE_SECRET_NAME = process.env.FIREBASE_SECRET_NAME || 'firebase-service-account';

// Firebase initialization flag
let firebaseApp = null;
let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK from AWS Secrets Manager
 */
async function initializeFirebase() {
    if (firebaseInitialized) {
        return firebaseApp;
    }

    try {
        console.log('🔥 Initializing Firebase Admin SDK from Secrets Manager...');
        
        // Get Firebase credentials from Secrets Manager
        const command = new GetSecretValueCommand({
            SecretId: FIREBASE_SECRET_NAME
        });
        
        const secretResponse = await secretsManager.send(command);
        const serviceAccount = JSON.parse(secretResponse.SecretString);
        
        if (!admin.apps.length) {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('✅ Firebase Admin SDK initialized successfully');
        } else {
            firebaseApp = admin.app();
            console.log('✅ Firebase Admin SDK already initialized');
        }
        
        firebaseInitialized = true;
        return firebaseApp;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error);
        throw new Error(`Firebase initialization failed: ${error.message}`);
    }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
    console.log('📢 Merchant Information Notification Handler invoked');
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        // Initialize Firebase
        await initializeFirebase();
        
        // Parse request body
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        
        const {
            notificationTitle,
            notificationBody,
            notificationType = 'info', // 'info', 'warning', 'urgent', 'feature', 'policy'
            targetAudience = 'all', // 'all', 'active', 'inactive', 'new', 'by_city', 'by_category', 'custom'
            customBusinessIds = [],
            city = null,
            businessCategory = null,
            imageUrl = null,
            actionUrl = null, // Deep link or web URL
            priority = 'normal', // 'low', 'normal', 'high'
            scheduledTime = null,
            expiresAt = null,
            metadata = {}
        } = body;

        // Validate required fields
        if (!notificationTitle || !notificationBody) {
            return buildResponse(400, {
                success: false,
                message: 'Missing required fields: notificationTitle, notificationBody'
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

        // Build notification payload with merchant-specific structure
        const notification = {
            title: notificationTitle,
            body: notificationBody,
            image: imageUrl || null,
            data: {
                type: 'merchant_info',
                notificationType,
                priority,
                actionUrl: actionUrl || '',
                expiresAt: expiresAt || '',
                timestamp: Date.now().toString(),
                ...metadata
            }
        };

        // Get target merchants based on audience type
        const targetMerchants = await getTargetMerchants({
            targetAudience,
            customBusinessIds,
            city,
            businessCategory
        });

        console.log(`🎯 Target merchants: ${targetMerchants.length}`);

        if (targetMerchants.length === 0) {
            return buildResponse(200, {
                success: true,
                message: 'No target merchants found',
                sent: 0,
                failed: 0
            });
        }

        // Get device tokens for target merchants
        const deviceTokens = await getDeviceTokensForMerchants(targetMerchants);
        console.log(`📱 Device tokens found: ${deviceTokens.length}`);

        if (deviceTokens.length === 0) {
            return buildResponse(200, {
                success: true,
                message: 'No device tokens found for target merchants',
                sent: 0,
                failed: 0
            });
        }

        // Send push notifications via FCM
        const results = await sendFCMNotifications(deviceTokens, notification, priority);

        // Log notification delivery
        await logNotification({
            notificationTitle,
            notificationBody,
            notificationType,
            targetAudience,
            totalTargeted: targetMerchants.length,
            totalTokens: deviceTokens.length,
            sent: results.success,
            failed: results.failed,
            priority,
            timestamp: Date.now()
        });

        return buildResponse(200, {
            success: true,
            message: 'Push notifications sent to merchants',
            targeted: targetMerchants.length,
            sent: results.success,
            failed: results.failed,
            details: results.details
        });

    } catch (error) {
        console.error('❌ Error sending merchant notifications:', error);
        return buildResponse(500, {
            success: false,
            message: 'Failed to send notifications',
            error: error.message
        });
    }
};

/**
 * Get target merchants based on audience type
 */
async function getTargetMerchants({ targetAudience, customBusinessIds, city, businessCategory }) {
    console.log(`🎯 Getting target merchants for audience: ${targetAudience}`);

    // Custom merchant list
    if (targetAudience === 'custom' && customBusinessIds.length > 0) {
        return customBusinessIds.map(id => ({ businessId: id }));
    }

    // Scan all merchants
    const command = new ScanCommand({
        TableName: BUSINESSES_TABLE,
        ProjectionExpression: 'businessId, businessName, #status, city, businessType, createdAt, lastOrderAt',
        ExpressionAttributeNames: {
            '#status': 'status'
        }
    });

    const result = await dynamoDB.send(command);
    let merchants = result.Items || [];

    console.log(`📊 Total merchants in database: ${merchants.length}`);

    // Apply filters based on target audience
    switch (targetAudience) {
        case 'active':
            // Merchants with orders in last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            merchants = merchants.filter(m => 
                m.status === 'approved' && m.lastOrderAt && m.lastOrderAt > thirtyDaysAgo
            );
            break;

        case 'inactive':
            // Merchants with no orders in last 30 days or inactive status
            const thirtyDaysAgo2 = Date.now() - (30 * 24 * 60 * 60 * 1000);
            merchants = merchants.filter(m => 
                (m.status === 'approved' && (!m.lastOrderAt || m.lastOrderAt <= thirtyDaysAgo2)) ||
                m.status === 'pending'
            );
            break;

        case 'new':
            // Merchants created in last 14 days
            const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
            merchants = merchants.filter(m => 
                m.createdAt && new Date(m.createdAt).getTime() > fourteenDaysAgo
            );
            break;

        case 'by_city':
            // Filter by specific city
            if (city) {
                merchants = merchants.filter(m => 
                    m.city && m.city.toLowerCase() === city.toLowerCase()
                );
            }
            break;

        case 'by_category':
            // Filter by business category/type
            if (businessCategory) {
                merchants = merchants.filter(m => 
                    m.businessType && m.businessType.toLowerCase() === businessCategory.toLowerCase()
                );
            }
            break;

        case 'all':
        default:
            // All merchants - no additional filtering (include approved merchants)
            merchants = merchants.filter(m => m.status === 'approved' || m.status === 'pending');
            break;
    }

    console.log(`✅ Filtered to ${merchants.length} merchants`);
    return merchants;
}

/**
 * Get device tokens for target merchants
 */
async function getDeviceTokensForMerchants(merchants) {
    const businessIds = merchants.map(m => m.businessId);
    const tokens = [];

    try {
        // Query device tokens table by businessId
        // Note: This assumes your table has a GSI on businessId
        // If not, we'll need to scan and filter
        
        for (const businessId of businessIds) {
            try {
                const command = new QueryCommand({
                    TableName: MERCHANT_DEVICE_TOKENS_TABLE,
                    IndexName: 'merchantId-index', // GSI name (using merchantId, not businessId)
                    KeyConditionExpression: 'merchantId = :bid',
                    FilterExpression: 'isActive = :active',
                    ExpressionAttributeValues: {
                        ':bid': businessId,
                        ':active': true
                    }
                });

                const result = await dynamoDB.send(command);
                
                if (result.Items && result.Items.length > 0) {
                    result.Items.forEach(item => {
                        tokens.push({
                            token: item.deviceToken || item.token,
                            businessId: item.merchantId || item.businessId,
                            platform: item.platform || 'unknown'
                        });
                    });
                }
            } catch (error) {
                // If GSI doesn't exist, fallback to scan
                if (error.name === 'ValidationException') {
                    console.warn('⚠️ merchantId-index not found, using scan (slower)');
                    const scanCmd = new ScanCommand({
                        TableName: MERCHANT_DEVICE_TOKENS_TABLE,
                        FilterExpression: 'merchantId = :bid AND isActive = :active',
                        ExpressionAttributeValues: {
                            ':bid': businessId,
                            ':active': true
                        }
                    });
                    const scanResult = await dynamoDB.send(scanCmd);
                    if (scanResult.Items && scanResult.Items.length > 0) {
                        scanResult.Items.forEach(item => {
                            tokens.push({
                                token: item.deviceToken || item.token,
                                businessId: item.merchantId || item.businessId,
                                platform: item.platform || 'unknown'
                            });
                        });
                    }
                } else {
                    console.error(`Error fetching tokens for ${businessId}:`, error);
                }
            }
        }

        console.log(`📱 Total device tokens collected: ${tokens.length}`);
        return tokens;
    } catch (error) {
        console.error('Error fetching device tokens:', error);
        return [];
    }
}

/**
 * Send FCM notifications to multiple devices using Firebase Admin SDK
 */
async function sendFCMNotifications(deviceTokens, notification, priority) {
    if (!firebaseApp) {
        console.warn('⚠️ Firebase Admin SDK not initialized, simulating send');
        return {
            success: deviceTokens.length,
            failed: 0,
            details: 'Firebase not initialized, simulation only'
        };
    }

    const results = {
        success: 0,
        failed: 0,
        details: [],
        errors: []
    };

    console.log(`📤 Sending notifications to ${deviceTokens.length} devices via Firebase Admin SDK`);

    // Send in batches of 500 (Firebase Admin SDK limit)
    const batchSize = 500;
    for (let i = 0; i < deviceTokens.length; i += batchSize) {
        const batch = deviceTokens.slice(i, i + batchSize);
        const tokens = batch.map(d => d.token);

        try {
            // Build multicast message
            const message = {
                tokens: tokens,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.image || undefined
                },
                data: notification.data,
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                            contentAvailable: true,
                            priority: priority === 'high' ? 10 : 5
                        }
                    }
                },
                android: {
                    priority: priority === 'high' ? 'high' : 'normal',
                    notification: {
                        sound: 'default',
                        priority: priority === 'high' ? 'high' : 'default'
                    }
                }
            };

            console.log(`📨 Sending batch ${Math.floor(i / batchSize) + 1} with ${tokens.length} tokens`);
            
            const response = await admin.messaging().sendEachForMulticast(message);
            
            console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} complete: ${response.successCount} success, ${response.failureCount} failed`);
            
            results.success += response.successCount;
            results.failed += response.failureCount;
            
            // Log any errors
            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        console.error(`❌ Token ${idx} failed:`, resp.error?.message);
                        results.errors.push({
                            token: tokens[idx].substring(0, 20) + '...',
                            error: resp.error?.message || 'Unknown error'
                        });
                    }
                });
            }

            results.details.push({
                batch: Math.floor(i / batchSize) + 1,
                tokens: tokens.length,
                success: response.successCount,
                failed: response.failureCount
            });

        } catch (error) {
            console.error(`❌ Error sending batch ${Math.floor(i / batchSize) + 1}:`, error);
            results.failed += batch.length;
            results.details.push({
                batch: Math.floor(i / batchSize) + 1,
                tokens: tokens.length,
                error: error.message
            });
        }
    }

    console.log(`📊 Final results: ${results.success} sent, ${results.failed} failed`);
    return results;
}

/**
 * Schedule notification for later delivery
 */
async function scheduleNotification(notificationData) {
    const command = new PutCommand({
        TableName: 'WizzCentral_Scheduled_Merchant_Notifications',
        Item: {
            notificationId: `SCHED_MERCH_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
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
                logId: `LOG_MERCH_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
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
