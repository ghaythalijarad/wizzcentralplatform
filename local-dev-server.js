#!/usr/bin/env node
/**
 * WizzCentral Platform - Local Development Server
 * Integrates frontend, backend APIs, and condition engine
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Use specific AWS SDK v3 clients instead of full v2 SDK to avoid conflicts
const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand, PutCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

// Configure AWS SDK v3 client
const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_PROFILE ? undefined : {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

// Cache for table key schemas
const tableKeySchemaCache = new Map();

async function getTableKeySchema(tableName) {
    if (tableKeySchemaCache.has(tableName)) return tableKeySchemaCache.get(tableName);
    const cmd = new DescribeTableCommand({ TableName: tableName });
    const res = await ddbClient.send(cmd);
    const ks = res?.Table?.KeySchema || [];
    tableKeySchemaCache.set(tableName, ks);
    return ks;
}

function buildKeyFromItem(item, keySchema) {
    const key = {};
    for (const k of keySchema) {
        const attr = k.AttributeName;
        if (!(attr in item)) {
            throw new Error(`Missing key attribute '${attr}' in item`);
        }
        key[attr] = item[attr];
    }
    return key;
}

// Import condition engine handler
const { handler: conditionEngineHandler } = require('./backend/lambda/condition-engine-api.js');

const app = express();
const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 3001;

// Set AWS environment variables for local development
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
process.env.AWS_PROFILE = process.env.AWS_PROFILE || 'wizz-drivers-ghayth-dev';
process.env.AWS_SDK_LOAD_CONFIG = process.env.AWS_SDK_LOAD_CONFIG || '1';

console.log('🔧 AWS Configuration:');
console.log(`   Region: ${process.env.AWS_REGION}`);
console.log(`   Profile: ${process.env.AWS_PROFILE}`);
console.log('');

// Add flag to guard debug routes in non-dev environments
const ENABLE_REGIONS_DEBUG = process.env.ENABLE_REGIONS_DEBUG === 'true';

// ============================================
// MIDDLEWARE SETUP
// ============================================

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// STATIC FILE SERVING
// ============================================
const frontendPath = path.join(__dirname, 'frontend');
console.log(`📂 Serving static files from: ${frontendPath}`);
app.use(express.static(frontendPath));

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n🔄 [${timestamp}] ${req.method} ${req.path}`);
    if (Object.keys(req.body).length > 0) {
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// ============================================
// LAMBDA TRANSFORMER MIDDLEWARE
// ============================================

const lambdaMiddleware = (req, res, next) => {
    const event = {
        httpMethod: req.method,
        resource: req.route?.path || req.path,
        pathParameters: req.params,
        queryStringParameters: req.query,
        headers: req.headers,
        body: Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : null,
        requestContext: {
            requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            authorizer: {
                claims: {
                    sub: req.headers['x-user-id'] || req.headers['user-id'] || 'dev-user-123',
                    email: req.headers['x-user-email'] || req.headers['user-email'] || 'dev@wizz.com',
                    'custom:roles': req.headers['x-user-roles'] || 'admin,user',
                    'custom:businessId': req.headers['x-business-id'] || 'dev-business-123'
                }
            }
        }
    };
    
    req.lambdaEvent = event;
    next();
};

app.use(lambdaMiddleware);

// ============================================
// HELPER FUNCTIONS
// ============================================

const handleLambdaResponse = async (handler, req, res) => {
    try {
        const result = await handler(req.lambdaEvent);
        const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
        
        // Set CORS headers
        Object.keys(result.headers || {}).forEach(key => {
            res.setHeader(key, result.headers[key]);
        });
        
        res.status(result.statusCode).json(body);
    } catch (error) {
        console.error('❌ Lambda Handler Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Helper: Detect AWS credential/auth issues and respond with 401 + guidance
function isAwsCredentialsError(error) {
    const code = error?.name || error?.Code || error?.code;
    const msg = (error?.message || '').toLowerCase();
    const credentialCodes = new Set([
        'UnrecognizedClientException',
        'CredentialsProviderError',
        'ExpiredToken',
        'ExpiredTokenException',
        'AccessDeniedException',
        'AuthFailure',
        'SignatureDoesNotMatch',
        'InvalidSignatureException'
    ]);
    if (code && credentialCodes.has(code)) return true;
    return (
        msg.includes('could not load credentials') ||
        msg.includes('no credentials') ||
        msg.includes('expired') ||
        msg.includes('sso') ||
        msg.includes('not authorized') ||
        msg.includes('access denied')
    );
}

function sendAwsAuthError(res, context, error) {
    const profile = process.env.AWS_PROFILE || 'default';
    const region = process.env.AWS_REGION || 'us-east-1';
    return res.status(401).json({
        success: false,
        error: 'aws-credentials',
        message: 'AWS credentials missing or expired for DynamoDB access',
        context,
        profile,
        region,
        howToFix: `Run: aws sso login --profile ${profile}`,
        source: 'dynamodb-auth',
        details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
    });
}

// ============================================
// REAL DYNAMODB DATA ACCESS (AWS SDK v3)
// ============================================

// Table names (matching your existing configuration)
const USERS_TABLE = 'WizzUser_users_dev';
const TRANSACTIONS_TABLE = 'WizzUser_transactions_dev';
const BUSINESSES_TABLE = 'WhizzMerchants_Businesses';
const CONDITIONS_TABLE = 'WizzCentral_Campaign_Conditions';
const CAMPAIGNS_TABLE = 'WizzCentral_Campaigns';
const ORDERS_TABLE = 'WizzOrders_dev';
// Add regions table for regions management (DynamoDB exclusive source)
const REGIONS_TABLE = 'WizzCentral_Regions';

// Real DynamoDB helper functions (updated for AWS SDK v3)
const getUserFromDynamoDB = async (userId) => {
    try {
        const command = new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId }
        });
        
        const result = await dynamoDB.send(command);
        return result.Item || null;
    } catch (error) {
        console.error('❌ Error fetching user from DynamoDB:', error);
        throw error;
    }
};

const getUserTransactions = async (userId) => {
    try {
        const command = new QueryCommand({
            TableName: TRANSACTIONS_TABLE,
            IndexName: 'userId-index',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false, // Latest first
            Limit: 100
        });
        
        const result = await dynamoDB.send(command);
        return result.Items || [];
    } catch (error) {
        console.error('❌ Error fetching transactions from DynamoDB:', error);
        return [];
    }
};

const getCampaignsFromDynamoDB = async () => {
    try {
        const command = new ScanCommand({
            TableName: CAMPAIGNS_TABLE,
            Limit: 50
        });
        
        const result = await dynamoDB.send(command);
        return result.Items || [];
    } catch (error) {
        console.error('❌ Error fetching campaigns from DynamoDB:', error);
        return [];
    }
};

const getBusinessFromDynamoDB = async (businessId) => {
    try {
        const command = new GetCommand({
            TableName: BUSINESSES_TABLE,
            Key: { businessId }
        });
        
        const result = await dynamoDB.send(command);
        return result.Item || null;
    } catch (error) {
        console.error('❌ Error fetching business from DynamoDB:', error);
        return null;
    }
};

const getOrdersFromDynamoDB = async (limit = 50) => {
    try {
        const command = new ScanCommand({
            TableName: ORDERS_TABLE,
            Limit: limit
        });
        
        const result = await dynamoDB.send(command);
        return result.Items || [];
    } catch (error) {
        console.error('❌ Error fetching orders from DynamoDB:', error);
        return [];
    }
};

const getOrderFromDynamoDB = async (orderId) => {
    try {
        // Orders in WizzOrders_dev use PK as the primary key and SK as sort key
        const command = new GetCommand({
            TableName: ORDERS_TABLE,
            Key: { 
                PK: orderId,
                SK: 'META'  // Based on your table structure
            }
        });
        
        console.log(`🔍 Looking up order with PK: ${orderId}, SK: META`);
        const result = await dynamoDB.send(command);
        console.log(`📊 Order lookup result:`, result.Item ? 'Found' : 'Not found');
        
        return result.Item || null;
    } catch (error) {
        console.error('❌ Error fetching order from DynamoDB:', error);
        return null;
    }
};

// ============================================
// CONDITION ENGINE API ROUTES
// ============================================

app.post('/conditions/evaluate', async (req, res) => {
    req.lambdaEvent.resource = '/conditions/evaluate';
    await handleLambdaResponse(conditionEngineHandler, req, res);
});

app.post('/conditions/validate', async (req, res) => {
    req.lambdaEvent.resource = '/conditions/validate';
    await handleLambdaResponse(conditionEngineHandler, req, res);
});

app.get('/conditions/:campaignId', async (req, res) => {
    req.lambdaEvent.resource = '/conditions/{campaignId}';
    req.lambdaEvent.pathParameters = { campaignId: req.params.campaignId };
    await handleLambdaResponse(conditionEngineHandler, req, res);
});

app.post('/conditions/:campaignId', async (req, res) => {
    req.lambdaEvent.resource = '/conditions/{campaignId}';
    req.lambdaEvent.pathParameters = { campaignId: req.params.campaignId };
    await handleLambdaResponse(conditionEngineHandler, req, res);
});

app.post('/conditions/test', async (req, res) => {
    req.lambdaEvent.resource = '/conditions/test';
    await handleLambdaResponse(conditionEngineHandler, req, res);
});

// ============================================
// PLATFORM API ROUTES
// ============================================

// Public endpoints
app.get('/public', (req, res) => {
    res.json({
        service: 'WizzCentral Platform',
        version: '2.0.0',
        status: 'running',
        environment: 'development',
        timestamp: new Date().toISOString(),
        features: ['condition-engine', 'campaigns', 'analytics', 'live-chat']
    });
});

app.post('/public', (req, res) => {
    res.json({
        message: 'Public data received',
        data: req.body,
        timestamp: new Date().toISOString()
    });
});

// Analytics endpoints - Real data from DynamoDB
app.get('/analytics', async (req, res) => {
    try {
        // Get real campaign count
        const campaigns = await getCampaignsFromDynamoDB();
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
        const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
        
        // Get user count (sample scan)
        const userScanCommand = new ScanCommand({
            TableName: USERS_TABLE,
            Select: 'COUNT'
        });
        const userScan = await dynamoDB.send(userScanCommand);
        
        res.json({
            success: true,
            data: {
                campaigns: {
                    active: activeCampaigns,
                    completed: completedCampaigns,
                    total: campaigns.length,
                    pending: campaigns.filter(c => c.status === 'draft').length
                },
                users: {
                    total: userScan.Count || 0,
                    scannedAt: new Date().toISOString()
                },
                conditions: {
                    totalEvaluations: 'real-time-data',
                    successRate: 'calculated-from-logs',
                    avgProcessingTime: 'monitoring-metrics'
                }
            },
            timestamp: new Date().toISOString(),
            source: 'real-dynamodb'
        });
    } catch (error) {
        console.error('❌ Error fetching analytics from DynamoDB:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/analytics', error);
        res.status(500).json({
            error: 'Failed to fetch analytics',
            message: error.message
        });
    }
});

app.post('/analytics', (req, res) => {
    console.log('📊 Analytics Event:', req.body);
    res.json({
        success: true,
        message: 'Analytics event recorded',
        eventId: `evt_${Date.now()}`,
        data: req.body
    });
});

// Campaign endpoints - Real data from DynamoDB
app.get('/campaigns', async (req, res) => {
    try {
        const campaigns = await getCampaignsFromDynamoDB();
        
        res.json({
            success: true,
            campaigns: campaigns,
            count: campaigns.length,
            source: 'real-dynamodb',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching campaigns from DynamoDB:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/campaigns', error);
        res.status(500).json({
            error: 'Failed to fetch campaigns',
            message: error.message
        });
    }
});

app.post('/campaigns', async (req, res) => {
    try {
        const campaign = {
            campaignId: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: req.body.status || 'draft',
            createdBy: req.headers['x-user-id'] || 'dev-user'
        };
        
        // Save to DynamoDB
        const putCommand = new PutCommand({
            TableName: CAMPAIGNS_TABLE,
            Item: campaign
        });
        await dynamoDB.send(putCommand);
        
        res.json({
            success: true,
            message: 'Campaign created successfully',
            campaign,
            source: 'real-dynamodb'
        });
    } catch (error) {
        console.error('❌ Error creating campaign in DynamoDB:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/campaigns', error);
        res.status(500).json({
            error: 'Failed to create campaign',
            message: error.message
        });
    }
});

// Orders endpoints - Real data from DynamoDB
app.get('/orders', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const orders = await getOrdersFromDynamoDB(limit);
        
        // Transform data to include computed fields
        const transformedOrders = orders.map(order => ({
            ...order,
            orderId: order.PK,
            // Extract order ID from PK (ORDER#uuid format)
            cleanOrderId: order.PK ? order.PK.replace('ORDER#', '') : 'unknown',
            // Format dates
            createdAtFormatted: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
            confirmedAtFormatted: order.confirmedAt ? new Date(order.confirmedAt).toLocaleDateString() : 'N/A',
            // Status determination
            status: order.canceledAt ? 'cancelled' : 
                   order.confirmedAt ? 'confirmed' : 
                   'pending',
            // Customer info
            customer: {
                name: order.customerName || 'Unknown Customer',
                email: order.customerEmail || 'No email'
            }
        }));

        res.json({
            success: true,
            orders: transformedOrders,
            count: transformedOrders.length,
            source: 'real-dynamodb',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching orders from DynamoDB:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/orders', error);
        res.status(500).json({
            error: 'Failed to fetch orders',
            message: error.message
        });
    }
});

app.get('/orders/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        // Add ORDER# prefix if not present
        const fullOrderId = orderId.startsWith('ORDER#') ? orderId : `ORDER#${orderId}`;
        
        const order = await getOrderFromDynamoDB(fullOrderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                orderId: orderId
            });
        }

        // Transform the order data
        const transformedOrder = {
            ...order,
            orderId: order.PK,
            cleanOrderId: order.PK ? order.PK.replace('ORDER#', '') : 'unknown',
            createdAtFormatted: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
            status: order.canceledAt ? 'cancelled' : 
                   order.confirmedAt ? 'confirmed' : 
                   'pending'
        };

        res.json({
            success: true,
            order: transformedOrder,
            source: 'real-dynamodb'
        });
    } catch (error) {
        console.error('❌ Error fetching order:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/orders/:orderId', error);
        res.status(500).json({
            error: 'Failed to fetch order',
            message: error.message
        });
    }
});

// ============================================
// DEVELOPMENT UTILITIES - Real DynamoDB Data
// ============================================

// Real user data endpoint
app.get('/dev/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await getUserFromDynamoDB(userId);
        const transactions = await getUserTransactions(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found in DynamoDB',
                userId: userId
            });
        }
        
        res.json({
            success: true,
            user,
            transactions,
            source: 'real-dynamodb',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching user data:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/dev/users/:userId', error);
        res.status(500).json({
            error: 'Failed to fetch user data',
            message: error.message
        });
    }
});

// List all users (development only - with pagination)
app.get('/dev/users', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const lastKey = req.query.lastKey ? JSON.parse(decodeURIComponent(req.query.lastKey)) : undefined;
        
        const params = {
            TableName: USERS_TABLE,
            Limit: limit
        };
        
        if (lastKey) {
            params.ExclusiveStartKey = lastKey;
        }
        
        const command = new ScanCommand(params);
        const result = await dynamoDB.send(command);
        
        res.json({
            success: true,
            users: result.Items || [],
            count: result.Items?.length || 0,
            lastEvaluatedKey: result.LastEvaluatedKey,
            nextPageUrl: result.LastEvaluatedKey ? 
                `/dev/users?limit=${limit}&lastKey=${encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))}` : 
                null,
            source: 'real-dynamodb'
        });
    } catch (error) {
        console.error('❌ Error listing users:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/dev/users', error);
        res.status(500).json({
            error: 'Failed to list users',
            message: error.message
        });
    }
});

// Get business data
app.get('/dev/businesses/:businessId', async (req, res) => {
    try {
        const business = await getBusinessFromDynamoDB(req.params.businessId);
        
        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found in DynamoDB',
                businessId: req.params.businessId
            });
        }
        
        res.json({
            success: true,
            business,
            source: 'real-dynamodb'
        });
    } catch (error) {
        console.error('❌ Error fetching business data:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/dev/businesses/:businessId', error);
        res.status(500).json({
            error: 'Failed to fetch business data',
            message: error.message
        });
    }
});

// Get all businesses data
app.get('/businesses', async (req, res) => {
    try {
        console.log('📊 Fetching all businesses from WhizzMerchants_Businesses table...');
        
        const command = new ScanCommand({
            TableName: BUSINESSES_TABLE,
            Limit: 100 // Reasonable limit for development
        });
        
        const result = await dynamoDB.send(command);
        const businesses = result.Items || [];
        
        console.log(`✅ Found ${businesses.length} businesses in DynamoDB`);
        
        // Log sample business for debugging
        if (businesses.length > 0) {
            console.log('📋 Sample business:', JSON.stringify(businesses[0], null, 2));
        }
        
        res.json({
            success: true,
            businesses: businesses,
            count: businesses.length,
            source: 'real-dynamodb',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching businesses from DynamoDB:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/businesses', error);
        res.status(500).json({
            error: 'Failed to fetch businesses',
            message: error.message,
            table: BUSINESSES_TABLE
        });
    }
});

// Test condition evaluation with real DynamoDB data
app.post('/dev/test-conditions', async (req, res) => {
    try {
        const { userId = 'dev-user-123', conditions, campaignId = 'test-campaign' } = req.body;
        
        // Get real user data from DynamoDB
        const user = await getUserFromDynamoDB(userId);
        const transactions = await getUserTransactions(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found in DynamoDB',
                userId: userId,
                suggestion: 'Try /dev/users to see available users'
            });
        }
        
        const testPayload = {
            campaignId: campaignId,
            userId: userId,
            conditions: conditions || [
                {
                    type: 'userAttribute',
                    field: 'age',
                    operator: 'greaterThan',
                    value: 18
                }
            ],
            orderData: {
                total: 150,
                businessId: 'test-business'
            }
        };

        // Create event for Lambda handler with real data context
        const mockEvent = {
            httpMethod: 'POST',
            resource: '/conditions/evaluate',
            pathParameters: {},
            queryStringParameters: {},
            headers: req.headers,
            body: JSON.stringify(testPayload),
            requestContext: {
                requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                authorizer: {
                    claims: {
                        sub: userId,
                        email: user.email || 'test@wizz.com',
                        'custom:roles': 'admin,user',
                        'custom:businessId': 'dev-business-123'
                    }
                }
            }
        };

        const result = await conditionEngineHandler(mockEvent);
        const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
        
        // Add debug information
        body.debugInfo = {
            realUserData: user,
            transactionCount: transactions.length,
            source: 'real-dynamodb',
            testNote: 'Using real DynamoDB data for condition evaluation'
        };
        
        res.status(result.statusCode).json(body);
    } catch (error) {
        console.error('❌ Test Condition Error:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/dev/test-conditions', error);
        res.status(500).json({ 
            error: 'Test condition evaluation failed',
            message: error.message,
            source: 'real-dynamodb-error'
        });
    }
});

// ============================================
// REGIONS MANAGEMENT API - DYNAMODB INTEGRATION
// ============================================

// DEBUG routes guarded by flag
if (ENABLE_REGIONS_DEBUG) {
    // DEBUG: Inspect regions table key schema
    app.get('/api/regions/_schema', async (req, res) => {
        try {
            const schema = await getTableKeySchema(REGIONS_TABLE);
            res.json({ success: true, table: REGIONS_TABLE, keySchema: schema });
        } catch (e) {
            if (isAwsCredentialsError(e)) return sendAwsAuthError(res, '/api/regions/_schema', e);
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // DEBUG: Find a region item by id/regionId and show its keys
    app.get('/api/regions/_find/:id', async (req, res) => {
        try {
            const requestedId = req.params.id;
            const scan = await dynamoDB.send(new ScanCommand({
                TableName: REGIONS_TABLE,
                FilterExpression: '#rid = :v OR #id = :v',
                ExpressionAttributeNames: { '#rid': 'regionId', '#id': 'id' },
                ExpressionAttributeValues: { ':v': requestedId }
            }));
            const item = scan.Items?.[0];
            const keySchema = await getTableKeySchema(REGIONS_TABLE);
            res.json({
                success: true,
                requestedId,
                found: !!item,
                item,
                itemKeys: item ? Object.keys(item) : [],
                keySchema
            });
        } catch (e) {
            if (isAwsCredentialsError(e)) return sendAwsAuthError(res, '/api/regions/_find/:id', e);
            res.status(500).json({ success: false, error: e.message });
        }
    });
}

// GET /api/regions - Fetch all regions from DynamoDB
app.get('/api/regions', async (req, res) => {
    try {
        const { level, parent_id, active, search, limit = 50, offset = 0 } = req.query;
        console.log('📍 API: Getting regions from DynamoDB with filters:', { level, parent_id, active, search });

        const scanCommand = new ScanCommand({ TableName: REGIONS_TABLE });
        const result = await dynamoDB.send(scanCommand);
        let regions = result.Items || [];

        // Filters
        if (level !== undefined && level !== '') {
            const levelNum = Number(level);
            regions = regions.filter(r => Number(r.level) === levelNum);
        }
        if (parent_id) {
            regions = regions.filter(r => r.parent_id === parent_id);
        }
        if (active !== undefined && active !== '') {
            const isActive = active === 'true' || active === true;
            regions = regions.filter(r => Boolean(r.is_active) === isActive);
        }
        if (search) {
            const searchLower = String(search).toLowerCase();
            regions = regions.filter(r => (
                (r.name && String(r.name).toLowerCase().includes(searchLower)) ||
                (r.name_ar && String(r.name_ar).toLowerCase().includes(searchLower)) ||
                (r.regionId && String(r.regionId).toLowerCase().includes(searchLower))
            ));
        }

        // Level breakdown by numeric levels
        const levelBreakdown = {
            country: regions.filter(r => Number(r.level) === 0).length,
            governorates: regions.filter(r => Number(r.level) === 1).length,
            districts: regions.filter(r => Number(r.level) === 2).length,
            neighborhoods: regions.filter(r => Number(r.level) === 3).length
        };

        // Pagination
        const total = regions.length;
        const start = parseInt(offset);
        const end = start + parseInt(limit);
        const paginatedRegions = regions.slice(start, end);

        res.json({
            success: true,
            data: paginatedRegions,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: start,
                hasMore: end < total
            },
            filters: { level, parent_id, active, search },
            source: 'dynamodb',
            summary: { ...levelBreakdown, total },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting regions from DynamoDB:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/api/regions', error);
        res.status(500).json({ success: false, error: 'Failed to load regions from DynamoDB', message: error.message, source: 'dynamodb-error' });
    }
});

// POST /api/regions - Create or update region (persist to DynamoDB)
app.post('/api/regions', async (req, res) => {
    try {
        const b = req.body || {};
        // Normalize to table schema
        const now = new Date().toISOString();
        const regionId = b.regionId || b.id || `region_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Level normalization
        let level = b.level;
        if (typeof level === 'string') {
            const map = { country: 0, governorate: 1, district: 2, neighborhood: 3 };
            level = map[level.toLowerCase()] ?? b.level;
        } else if (typeof b.region_type === 'string') {
            const mapType = { COUNTRY: 0, GOVERNORATE: 1, DISTRICT: 2, NEIGHBORHOOD: 3 };
            level = mapType[b.region_type.toUpperCase()] ?? level;
        }

        // Coordinates normalization
        let coordinates = b.coordinates?.center || b.gps_coordinates || b.coordinates || {};
        const normCoords = {
            lat: Number(coordinates.lat) || 33.3152,
            lng: Number(coordinates.lng) || 44.3661,
            radius: coordinates.radius || b.coordinates?.radius || 50000
        };

        const isActive = typeof b.is_active === 'boolean' ? b.is_active : (typeof b.isActive === 'boolean' ? b.isActive : (b.status ? String(b.status).toLowerCase() === 'active' : true));

        const item = {
            // PK
            regionId,
            // Names
            name: b.name || b.regionName || `Region ${regionId}`,
            name_ar: b.name_ar || b.regionNameArabic || '',
            // Hierarchy
            level: (typeof level === 'number' ? level : 3),
            parent_id: b.parent_id || null,
            // Status
            is_active: isActive,
            // Optional business fields
            governorate_id: b.governorate_id || b.governorate || undefined,
            service_config: b.service_config || b.serviceTypes || undefined,
            delivery_config: b.delivery_config || (b.deliveryFee || b.minimumOrder || b.estimatedDeliveryTime ? {
                base_fee: b.deliveryFee,
                minimum_order: b.minimumOrder,
                estimated_time_minutes: b.estimatedDeliveryTime
            } : undefined),
            statistics: b.statistics || (typeof b.activeDrivers === 'number' || typeof b.totalOrders === 'number' ? {
                active_drivers: b.activeDrivers || 0,
                total_orders: b.totalOrders || 0
            } : undefined),
            // Geo
            coordinates: normCoords,
            boundary: b.boundary,
            // Timestamps
            createdAt: b.createdAt || b.created_at || now,
            updatedAt: now,
            updated_at: now
        };

        // Persist
        await dynamoDB.send(new PutCommand({ TableName: REGIONS_TABLE, Item: item }));

        res.json({ success: true, message: 'Region saved to DynamoDB', region: item, source: 'dynamodb' });
    } catch (error) {
        console.error('❌ Error saving region to DynamoDB:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/api/regions', error);
        res.status(500).json({ error: 'Failed to save region', message: error.message, source: 'dynamodb-error' });
    }
});

// PATCH /api/regions/:id/toggle - Toggle region active status using regionId PK
app.patch('/api/regions/:id/toggle', async (req, res) => {
    try {
        const requestedId = req.params.id;
        console.log(`🔄 Toggling region status (regionId PK): ${requestedId}`);

        // Fetch current item
        const { Item } = await dynamoDB.send(new GetCommand({
            TableName: REGIONS_TABLE,
            Key: { regionId: requestedId }
        }));
        if (!Item) {
            return res.status(404).json({ success: false, error: 'Region not found', regionId: requestedId, source: 'dynamodb' });
        }

        const previous = Boolean(Item.is_active);
        const newStatus = !previous;
        const now = new Date().toISOString();

        const updateRes = await dynamoDB.send(new UpdateCommand({
            TableName: REGIONS_TABLE,
            Key: { regionId: requestedId },
            UpdateExpression: 'SET is_active = :s, updated_at = :u, updatedAt = :u',
            ExpressionAttributeValues: { ':s': newStatus, ':u': now },
            ReturnValues: 'ALL_NEW'
        }));

        res.json({
            success: true,
            data: {
                regionId: requestedId,
                previousStatus: previous,
                newStatus: Boolean(updateRes.Attributes?.is_active),
                region: updateRes.Attributes
            },
            source: 'dynamodb',
            timestamp: now
        });
    } catch (error) {
        console.error('❌ Error toggling region status:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/api/regions/:id/toggle', error);
        res.status(500).json({ success: false, error: 'Failed to toggle region status', message: error.message, source: 'dynamodb-error' });
    }
});

// GET /api/regions/statistics - Get regions statistics from DynamoDB
app.get('/api/regions/statistics', async (req, res) => {
    try {
        console.log('📍 Calculating regions statistics from DynamoDB...');
        
        // Fetch all regions from DynamoDB
        const scanCommand = new ScanCommand({
            TableName: REGIONS_TABLE
        });
        
        const result = await dynamoDB.send(scanCommand);
        const regions = result.Items || [];
        
        const stats = {
            totalRegions: regions.length,
            activeRegions: regions.filter(r => r.is_active).length,
            inactiveRegions: regions.filter(r => !r.is_active).length,
            levelBreakdown: {
                country: regions.filter(r => Number(r.level) === 0).length,
                governorates: regions.filter(r => Number(r.level) === 1).length,
                districts: regions.filter(r => Number(r.level) === 2).length,
                neighborhoods: regions.filter(r => Number(r.level) === 3).length
            },
            serviceStats: {
                totalDrivers: regions.reduce((sum, r) => sum + (r.statistics?.active_drivers || 0), 0),
                totalOrders: regions.reduce((sum, r) => sum + (r.statistics?.total_orders || 0), 0),
                avgPopulation: regions.length > 0 ? Math.round(regions.reduce((sum, r) => sum + (r.statistics?.population || 0), 0) / regions.length) : 0,
                totalPopulation: regions.reduce((sum, r) => sum + (r.statistics?.population || 0), 0)
            },
            coverage: {
                serviceTypes: {
                    delivery: regions.filter(r => r.service_config?.delivery).length,
                    pickup: regions.filter(r => r.service_config?.pickup).length,
                    express: regions.filter(r => r.service_config?.express).length,
                    standard: regions.filter(r => r.service_config?.standard).length
                },
                totalArea: regions.reduce((sum, r) => sum + (r.statistics?.area_km2 || 0), 0)
            }
        };

        res.json({
            success: true,
            data: stats,
            message: `Regions statistics from DynamoDB - ${regions.length} regions found`,
            generatedAt: new Date().toISOString(),
            source: 'dynamodb'
        });
    } catch (error) {
        console.error('❌ Error calculating regions statistics from DynamoDB:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/api/regions/statistics', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate regions statistics from DynamoDB',
            message: error.message,
            source: 'dynamodb-error'
        });
    }
});

// GET /api/regions/:id - Get individual region details from DynamoDB using regionId PK
app.get('/api/regions/:id', async (req, res) => {
    try {
        const requestedId = req.params.id;
        console.log(`🔍 Looking up region by PK regionId: ${requestedId}`);
        const result = await dynamoDB.send(new GetCommand({
            TableName: REGIONS_TABLE,
            Key: { regionId: requestedId }
        }));
        const region = result.Item;
        if (!region) {
            return res.status(404).json({ success: false, error: 'Region not found', message: `Region '${requestedId}' not found`, regionId: requestedId, source: 'dynamodb' });
        }
        res.json({ success: true, data: region, message: `Region details for ${region.name || region.regionName || requestedId}`, timestamp: new Date().toISOString(), source: 'dynamodb' });
    } catch (error) {
        console.error('❌ Error fetching region details from DynamoDB:', error);
        if (isAwsCredentialsError(error)) return sendAwsAuthError(res, '/api/regions/:id', error);
        res.status(500).json({ success: false, error: 'Failed to fetch region details from DynamoDB', message: error.message, source: 'dynamodb-error' });
    }
});

// Redirect for old regions management URLs
app.get('/frontend/regions-management-iraq.html', (req, res) => {
    console.log('📍 Redirecting old regions URL to new location...');
    res.redirect('/pages/regions.html');
});

app.get('/regions-management-iraq.html', (req, res) => {
    console.log('📍 Redirecting old regions URL to new location...');
    res.redirect('/pages/regions.html');
});

// Health check
app.get('/health', async (req, res) => {
    try {
        // Get region count from DynamoDB for health check
        const scanCommand = new ScanCommand({
            TableName: REGIONS_TABLE,
            Select: 'COUNT'
        });
        
        const result = await dynamoDB.send(scanCommand);
        const regionsCount = result.Count || 0;
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            features: ['condition-engine', 'regions-management', 'real-dynamodb'],
            dataSource: 'dynamodb',
            regionsCount: regionsCount,
            tableName: REGIONS_TABLE
        });
    } catch (error) {
        console.error('❌ Health check error:', error);
        res.status(200).json({
            status: 'healthy-with-warnings',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            features: ['condition-engine', 'regions-management', 'real-dynamodb'],
            dataSource: 'dynamodb',
            warning: 'Cannot connect to DynamoDB',
            error: error.message
        });
    }
});

// ============================================
// FRONTEND STATIC FILE SERVING
// ============================================

// Serve frontend pages
app.use('/pages', express.static(path.join(__dirname, 'frontend/pages')));
app.use('/css', express.static(path.join(__dirname, 'frontend/css')));
app.use('/js', express.static(path.join(__dirname, 'frontend/js')));
app.use('/assets', express.static(path.join(__dirname, 'frontend/assets')));

// Serve main frontend from root
app.use(express.static(path.join(__dirname, 'frontend')));

// Default route - serve main dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('');
    console.log('🚀 WizzCentral Platform - Development Server Started');
    console.log('===============================================');
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 DynamoDB: Real AWS connection (${process.env.AWS_REGION})`);
    console.log(`📍 Data Source: DynamoDB (${REGIONS_TABLE})`);
    console.log('');
    console.log('🔗 Available Endpoints:');
    console.log(`   Dashboard: http://localhost:${PORT}/`);
    console.log(`   Conditions: http://localhost:${PORT}/pages/conditions.html`);
    console.log(`   Analytics: http://localhost:${PORT}/pages/analytics.html`);
    console.log(`   Regions: http://localhost:${PORT}/pages/regions.html`);
    console.log(`   API Health: http://localhost:${PORT}/health`);
    console.log('');
    console.log('🔄 DynamoDB Integration:');
    console.log(`   ✅ Regions API: Connected to ${REGIONS_TABLE}`);
    console.log(`   ✅ Toggle API: PATCH /api/regions/:id/toggle`);
    console.log(`   ✅ Statistics API: Real-time from DynamoDB`);
    console.log('===============================================');
});