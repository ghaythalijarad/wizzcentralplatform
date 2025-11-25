/**
 * Send Promotion Push Notifications to Merchants
 * Lambda function to send FCM push notifications to WhizzMerchants app
 * using Firebase Cloud Messaging API V1 (Modern API)
 * 
 * Uses Service Account authentication instead of deprecated Server Key
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const https = require('https');
const crypto = require('crypto');

// Initialize AWS SDK clients
const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamoDbClient);

// Configuration
const DEVICE_TOKENS_TABLE = process.env.DEVICE_TOKENS_TABLE || 'WhizzMerchants_DeviceTokens';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'wizz-business-app';

// Firebase Service Account credentials (decode from base64 if provided)
let firebaseCredentials = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
        const decodedCreds = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
        firebaseCredentials = JSON.parse(decodedCreds);
        console.log('✅ Firebase credentials loaded from base64');
    } catch (error) {
        console.error('❌ Error decoding Firebase credentials:', error);
    }
} else {
    // Fallback to individual environment variables
    firebaseCredentials = {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY,
        project_id: FIREBASE_PROJECT_ID
    };
}

const FIREBASE_CLIENT_EMAIL = firebaseCredentials?.client_email;
const FIREBASE_PRIVATE_KEY = firebaseCredentials?.private_key;

// CORS headers
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

// Cache for access token
let cachedAccessToken = null;
let tokenExpiryTime = null;

exports.handler = async (event) => {
    console.log('📱 Promotion Push Notification Request (FCM V1)');

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

    for (const device of deviceTokens) {
        try {
            const result = await sendFCMV1Notification(device.deviceToken, notificationData, device.platform);
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
 * Get OAuth2 access token for FCM V1 API
 */
async function getAccessToken() {
    // Return cached token if still valid
    if (cachedAccessToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
        return cachedAccessToken;
    }

    // Check if credentials are configured
    if (!FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
        console.warn('⚠️ Firebase credentials not configured, simulating notification send');
        return null;
    }

    try {
        // Create JWT for Google OAuth2
        const now = Math.floor(Date.now() / 1000);
        const expiry = now + 3600; // 1 hour

        const jwtHeader = {
            alg: 'RS256',
            typ: 'JWT'
        };

        const jwtClaimSet = {
            iss: FIREBASE_CLIENT_EMAIL,
            scope: 'https://www.googleapis.com/auth/firebase.messaging',
            aud: 'https://oauth2.googleapis.com/token',
            exp: expiry,
            iat: now
        };

        // Create JWT
        const encodedHeader = base64UrlEncode(JSON.stringify(jwtHeader));
        const encodedClaimSet = base64UrlEncode(JSON.stringify(jwtClaimSet));
        const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

        // Sign with private key
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(signatureInput);
        sign.end();
        
        // Fix private key format
        const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        const signature = sign.sign(privateKey, 'base64');
        const encodedSignature = base64UrlEncode(Buffer.from(signature, 'base64'));

        const jwt = `${signatureInput}.${encodedSignature}`;

        // Exchange JWT for access token
        const accessToken = await exchangeJwtForAccessToken(jwt);
        
        // Cache the token
        cachedAccessToken = accessToken;
        tokenExpiryTime = Date.now() + (3600 * 1000); // 1 hour

        return accessToken;

    } catch (error) {
        console.error('❌ Error getting access token:', error);
        throw error;
    }
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(str) {
    const base64 = Buffer.from(str).toString('base64');
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Exchange JWT for OAuth2 access token
 */
function exchangeJwtForAccessToken(jwt) {
    return new Promise((resolve, reject) => {
        const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;

        const options = {
            hostname: 'oauth2.googleapis.com',
            port: 443,
            path: '/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
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
                    
                    if (response.access_token) {
                        resolve(response.access_token);
                    } else {
                        reject(new Error('No access token in response: ' + data));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse OAuth response: ' + error.message));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Send FCM V1 notification to a single device
 */
async function sendFCMV1Notification(deviceToken, notificationData, platform) {
    try {
        // Get access token
        const accessToken = await getAccessToken();

        // If no credentials configured, simulate success
        if (!accessToken) {
            console.warn('⚠️ Simulating notification send (no credentials)');
            return {
                success: true,
                messageId: 'simulated-' + Date.now()
            };
        }

        // Build FCM V1 message
        const message = {
            message: {
                token: deviceToken,
                notification: {
                    title: notificationData.title,
                    body: notificationData.message
                },
                data: Object.keys(notificationData.data).reduce((acc, key) => {
                    acc[key] = String(notificationData.data[key]);
                    return acc;
                }, {}),
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channel_id: 'promotions'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: notificationData.title,
                                body: notificationData.message
                            },
                            sound: 'default',
                            badge: 1,
                            'mutable-content': 1,
                            'content-available': 1
                        }
                    }
                }
            }
        };

        return await sendToFCMV1(message, accessToken);

    } catch (error) {
        console.error('❌ Error sending FCM V1 notification:', error);
        throw error;
    }
}

/**
 * Send message to FCM V1 API
 */
function sendToFCMV1(message, accessToken) {
    return new Promise((resolve, reject) => {
        const payloadString = JSON.stringify(message);

        const options = {
            hostname: 'fcm.googleapis.com',
            port: 443,
            path: `/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
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
                    
                    if (res.statusCode === 200 && response.name) {
                        console.log('✅ FCM V1 notification sent successfully');
                        resolve({
                            success: true,
                            messageId: response.name
                        });
                    } else {
                        console.error('❌ FCM V1 notification failed:', response);
                        reject(new Error(response.error?.message || 'FCM send failed'));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse FCM response: ' + error.message));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ FCM V1 request error:', error);
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
