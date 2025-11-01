#!/usr/bin/env node
/**
 * WizzCentral Platform - Local Development Server
 * Integrates frontend, backend APIs, and condition engine
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Use specific AWS SDK v3 clients instead of full v2 SDK to avoid conflicts
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// Configure AWS SDK v3 client
const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_PROFILE ? undefined : {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

// Import condition engine handler
const { handler: conditionEngineHandler } = require('./backend/lambda/condition-engine-api.js');

const app = express();
const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 3001;

// Set AWS environment variables for local development
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
process.env.AWS_PROFILE = process.env.AWS_PROFILE || 'wizz-drivers-ghayth-dev';

console.log('🔧 AWS Configuration:');
console.log(`   Region: ${process.env.AWS_REGION}`);
console.log(`   Profile: ${process.env.AWS_PROFILE}`);
console.log(`   Using Real DynamoDB: ✅`);
console.log('');

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
        res.status(500).json({ 
            error: 'Test condition evaluation failed',
            message: error.message,
            source: 'real-dynamodb-error'
        });
    }
});

// ============================================
// REGIONS MANAGEMENT API - COMPREHENSIVE IRAQI DATASET
// ============================================

// Comprehensive Iraqi Regions Data (All 18 Governorates)
const comprehensiveIraqiRegions = [
    // Country Level
    {
        id: 'iraq',
        name: 'Iraq',
        name_ar: 'العراق',
        level: 'country',
        parent_id: null,
        governorate_id: null,
        coordinates: { lat: 33.2232, lng: 43.6793, radius: 1000000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 40222493, area_km2: 438317, total_orders: 125680, active_drivers: 456 }
    },

    // ALL 18 GOVERNORATES OF IRAQ
    {
        id: 'baghdad',
        name: 'Baghdad',
        name_ar: 'بغداد',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3152, lng: 44.3661, radius: 50000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 9000000, area_km2: 5072, total_orders: 45230, active_drivers: 234 }
    },
    {
        id: 'basra',
        name: 'Basra',
        name_ar: 'البصرة',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'basra',
        coordinates: { lat: 30.5085, lng: 47.7804, radius: 45000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 2500000, area_km2: 19070, total_orders: 12450, active_drivers: 89 }
    },
    {
        id: 'nineveh',
        name: 'Nineveh',
        name_ar: 'نينوى',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'nineveh',
        coordinates: { lat: 36.3407, lng: 43.1186, radius: 60000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 3270000, area_km2: 37323, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'erbil',
        name: 'Erbil',
        name_ar: 'أربيل',
        name_ku: 'هەولێر',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'erbil',
        coordinates: { lat: 36.1911, lng: 44.0093, radius: 35000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1612700, area_km2: 15074, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'sulaymaniyah',
        name: 'Sulaymaniyah',
        name_ar: 'السليمانية',
        name_ku: 'سلێمانی',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'sulaymaniyah',
        coordinates: { lat: 35.5650, lng: 45.4377, radius: 40000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1950000, area_km2: 17023, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'duhok',
        name: 'Duhok',
        name_ar: 'دهوك',
        name_ku: 'دهۆک',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'duhok',
        coordinates: { lat: 36.8617, lng: 42.9977, radius: 30000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1292535, area_km2: 6553, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'kirkuk',
        name: 'Kirkuk',
        name_ar: 'كركوك',
        name_ku: 'کەرکووک',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'kirkuk',
        coordinates: { lat: 35.4681, lng: 44.3922, radius: 35000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1395614, area_km2: 9679, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'anbar',
        name: 'Anbar',
        name_ar: 'الأنبار',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'anbar',
        coordinates: { lat: 33.4224, lng: 41.8818, radius: 80000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1561000, area_km2: 138501, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'najaf',
        name: 'Najaf',
        name_ar: 'النجف',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'najaf',
        coordinates: { lat: 31.9996, lng: 44.3267, radius: 30000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 1285500, area_km2: 28824, total_orders: 3240, active_drivers: 23 }
    },
    {
        id: 'karbala',
        name: 'Karbala',
        name_ar: 'كربلاء',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'karbala',
        coordinates: { lat: 32.6169, lng: 44.0252, radius: 25000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 1066600, area_km2: 5034, total_orders: 2890, active_drivers: 19 }
    },
    {
        id: 'babylon',
        name: 'Babylon',
        name_ar: 'بابل',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'babylon',
        coordinates: { lat: 32.5422, lng: 44.4267, radius: 35000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 2025500, area_km2: 5119, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'diyala',
        name: 'Diyala',
        name_ar: 'ديالى',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'diyala',
        coordinates: { lat: 33.7500, lng: 44.9300, radius: 45000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1443200, area_km2: 17685, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'saladin',
        name: 'Saladin',
        name_ar: 'صلاح الدين',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'saladin',
        coordinates: { lat: 34.2000, lng: 43.6700, radius: 50000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1408200, area_km2: 24751, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'wasit',
        name: 'Wasit',
        name_ar: 'واسط',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'wasit',
        coordinates: { lat: 32.4500, lng: 45.8300, radius: 40000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1250000, area_km2: 17153, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'maysan',
        name: 'Maysan',
        name_ar: 'ميسان',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'maysan',
        coordinates: { lat: 31.9300, lng: 47.1500, radius: 45000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1065000, area_km2: 16072, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'dhi_qar',
        name: 'Dhi Qar',
        name_ar: 'ذي قار',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'dhi_qar',
        coordinates: { lat: 31.0570, lng: 46.2580, radius: 50000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1999500, area_km2: 12900, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'muthanna',
        name: 'Muthanna',
        name_ar: 'المثنى',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'muthanna',
        coordinates: { lat: 29.7594, lng: 45.3711, radius: 55000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 734000, area_km2: 51740, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'qadisiyyah',
        name: 'Qadisiyyah',
        name_ar: 'القادسية',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'qadisiyyah',
        coordinates: { lat: 31.9833, lng: 45.0500, radius: 35000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1228000, area_km2: 8153, total_orders: 0, active_drivers: 0 }
    },

    // MAJOR DISTRICTS
    {
        id: 'al_karkh',
        name: 'Al-Karkh',
        name_ar: 'الكرخ',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3007, lng: 44.3225, radius: 15000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 2800000, area_km2: 860, total_orders: 18500, active_drivers: 95 }
    },
    {
        id: 'al_rusafa',
        name: 'Al-Rusafa',
        name_ar: 'الرصافة',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3406, lng: 44.4009, radius: 15000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 3100000, area_km2: 920, total_orders: 19800, active_drivers: 105 }
    },
    {
        id: 'basra_central',
        name: 'Basra Central',
        name_ar: 'مركز البصرة',
        level: 'district',
        parent_id: 'basra',
        governorate_id: 'basra',
        coordinates: { lat: 30.5085, lng: 47.7804, radius: 12000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 850000, area_km2: 140, total_orders: 6780, active_drivers: 42 }
    },

    // MAJOR NEIGHBORHOODS IN BAGHDAD
    {
        id: 'al_karrada',
        name: 'Al-Karrada',
        name_ar: 'الكرادة',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3089, lng: 44.4161, radius: 5000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 450000, area_km2: 25, total_orders: 5600, active_drivers: 32 }
    },
    {
        id: 'al_mansour',
        name: 'Al-Mansour',
        name_ar: 'المنصور',
        level: 'neighborhood',
        parent_id: 'al_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2930, lng: 44.3353, radius: 6000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 520000, area_km2: 32, total_orders: 6200, active_drivers: 38 }
    },
    {
        id: 'sadr_city',
        name: 'Sadr City',
        name_ar: 'مدينة الصدر',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3947, lng: 44.4658, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 2500000, area_km2: 95, total_orders: 8900, active_drivers: 45 }
    },

    // MAJOR NEIGHBORHOODS IN BASRA
    {
        id: 'basra_old_city',
        name: 'Basra Old City',
        name_ar: 'البصرة القديمة',
        level: 'neighborhood',
        parent_id: 'basra_central',
        governorate_id: 'basra',
        coordinates: { lat: 30.5085, lng: 47.7804, radius: 4000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 280000, area_km2: 15, total_orders: 2890, active_drivers: 18 }
    },
    {
        id: 'al_ashar',
        name: 'Al-Ashar',
        name_ar: 'العشار',
        level: 'neighborhood',
        parent_id: 'basra_central',
        governorate_id: 'basra',
        coordinates: { lat: 30.5200, lng: 47.7950, radius: 5000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 350000, area_km2: 28, total_orders: 3450, active_drivers: 22 }
    },

    // ==================== EXPANDED DISTRICTS ====================
    
    // BAGHDAD DISTRICTS (More detailed)
    {
        id: 'al_adhamiya',
        name: 'Al-Adhamiya',
        name_ar: 'الأعظمية',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3717, lng: 44.3842, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 650000, area_km2: 45, total_orders: 4200, active_drivers: 28 }
    },
    {
        id: 'al_kadhimiya',
        name: 'Al-Kadhimiya',
        name_ar: 'الكاظمية',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3789, lng: 44.3396, radius: 9000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 750000, area_km2: 52, total_orders: 5800, active_drivers: 35 }
    },
    {
        id: 'al_thawra',
        name: 'Al-Thawra',
        name_ar: 'الثورة',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3547, lng: 44.4547, radius: 12000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 2200000, area_km2: 85, total_orders: 7500, active_drivers: 40 }
    },
    {
        id: 'new_baghdad',
        name: 'New Baghdad',
        name_ar: 'بغداد الجديدة',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2850, lng: 44.4500, radius: 10000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 580000, area_km2: 38, total_orders: 3900, active_drivers: 26 }
    },

    // BASRA DISTRICTS (More detailed)
    {
        id: 'al_maqal',
        name: 'Al-Maqal',
        name_ar: 'المعقل',
        level: 'district',
        parent_id: 'basra',
        governorate_id: 'basra',
        coordinates: { lat: 30.5200, lng: 47.7600, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 420000, area_km2: 35, total_orders: 2800, active_drivers: 18 }
    },
    {
        id: 'al_hartha',
        name: 'Al-Hartha',
        name_ar: 'الهارثة',
        level: 'district',
        parent_id: 'basra',
        governorate_id: 'basra',
        coordinates: { lat: 30.6150, lng: 47.8200, radius: 12000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 380000, area_km2: 55, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'abu_al_khasib',
        name: 'Abu Al-Khasib',
        name_ar: 'أبو الخصيب',
        level: 'district',
        parent_id: 'basra',
        governorate_id: 'basra',
        coordinates: { lat: 30.0400, lng: 47.9300, radius: 15000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 290000, area_km2: 75, total_orders: 0, active_drivers: 0 }
    },

    // ERBIL DISTRICTS
    {
        id: 'erbil_center',
        name: 'Erbil Center',
        name_ar: 'مركز أربيل',
        name_ku: 'ناوەندی هەولێر',
        level: 'district',
        parent_id: 'erbil',
        governorate_id: 'erbil',
        coordinates: { lat: 36.1911, lng: 44.0093, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 850000, area_km2: 45, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'ankawa',
        name: 'Ankawa',
        name_ar: 'عنكاوا',
        name_ku: 'عەنکاوا',
        level: 'district',
        parent_id: 'erbil',
        governorate_id: 'erbil',
        coordinates: { lat: 36.2200, lng: 44.0400, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 150000, area_km2: 18, total_orders: 0, active_drivers: 0 }
    },

    // NAJAF DISTRICTS
    {
        id: 'najaf_center',
        name: 'Najaf Center',
        name_ar: 'مركز النجف',
        level: 'district',
        parent_id: 'najaf',
        governorate_id: 'najaf',
        coordinates: { lat: 31.9996, lng: 44.3267, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 650000, area_km2: 32, total_orders: 2100, active_drivers: 15 }
    },
    {
        id: 'kufa',
        name: 'Kufa',
        name_ar: 'الكوفة',
        level: 'district',
        parent_id: 'najaf',
        governorate_id: 'najaf',
        coordinates: { lat: 32.0296, lng: 44.3731, radius: 10000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 220000, area_km2: 28, total_orders: 980, active_drivers: 8 }
    },

    // KARBALA DISTRICTS
    {
        id: 'karbala_center',
        name: 'Karbala Center',
        name_ar: 'مركز كربلاء',
        level: 'district',
        parent_id: 'karbala',
        governorate_id: 'karbala',
        coordinates: { lat: 32.6169, lng: 44.0252, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 580000, area_km2: 25, total_orders: 1900, active_drivers: 12 }
    },
    {
        id: 'hindiya',
        name: 'Hindiya',
        name_ar: 'الهندية',
        level: 'district',
        parent_id: 'karbala',
        governorate_id: 'karbala',
        coordinates: { lat: 32.5567, lng: 44.2633, radius: 12000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 180000, area_km2: 45, total_orders: 0, active_drivers: 0 }
    },

    // ==================== EXPANDED NEIGHBORHOODS ====================

    // BAGHDAD NEIGHBORHOODS (Al-Karkh District)
    {
        id: 'al_yarmouk',
        name: 'Al-Yarmouk',
        name_ar: 'اليرموك',
        level: 'neighborhood',
        parent_id: 'al_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2854, lng: 44.3425, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 280000, area_km2: 12, total_orders: 3200, active_drivers: 18 }
    },
    {
        id: 'al_bayaa',
        name: 'Al-Bayaa',
        name_ar: 'البياع',
        level: 'neighborhood',
        parent_id: 'al_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2545, lng: 44.3125, radius: 4000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 350000, area_km2: 18, total_orders: 4100, active_drivers: 22 }
    },
    {
        id: 'al_amiriya',
        name: 'Al-Amiriya',
        name_ar: 'الأميرية',
        level: 'neighborhood',
        parent_id: 'al_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3154, lng: 44.2987, radius: 5000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 420000, area_km2: 22, total_orders: 4800, active_drivers: 26 }
    },
    {
        id: 'al_ghazaliya',
        name: 'Al-Ghazaliya',
        name_ar: 'الغزالية',
        level: 'neighborhood',
        parent_id: 'al_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3567, lng: 44.2845, radius: 4500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 380000, area_km2: 20, total_orders: 3600, active_drivers: 20 }
    },
    {
        id: 'al_dora',
        name: 'Al-Dora',
        name_ar: 'الدورة',
        level: 'neighborhood',
        parent_id: 'al_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2145, lng: 44.3687, radius: 6000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 450000, area_km2: 28, total_orders: 2900, active_drivers: 16 }
    },

    // BAGHDAD NEIGHBORHOODS (Al-Rusafa District)
    {
        id: 'al_jadriya',
        name: 'Al-Jadriya',
        name_ar: 'الجادرية',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2862, lng: 44.3777, radius: 3500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 120000, area_km2: 8, total_orders: 2800, active_drivers: 16 }
    },
    {
        id: 'al_waziriya',
        name: 'Al-Waziriya',
        name_ar: 'الوزيرية',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3289, lng: 44.3945, radius: 2500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 85000, area_km2: 6, total_orders: 2200, active_drivers: 12 }
    },
    {
        id: 'al_arasat',
        name: 'Al-Arasat',
        name_ar: 'الأراضي',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3240, lng: 44.3951, radius: 2000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 65000, area_km2: 4, total_orders: 1800, active_drivers: 10 }
    },
    {
        id: 'al_sinaa',
        name: 'Al-Sinaa',
        name_ar: 'الصناع',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3425, lng: 44.4125, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 190000, area_km2: 11, total_orders: 2900, active_drivers: 15 }
    },

    // BAGHDAD NEIGHBORHOODS (Al-Adhamiya District)
    {
        id: 'al_adhamiya_center',
        name: 'Al-Adhamiya Center',
        name_ar: 'مركز الأعظمية',
        level: 'neighborhood',
        parent_id: 'al_adhamiya',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3717, lng: 44.3842, radius: 2500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 180000, area_km2: 8, total_orders: 2100, active_drivers: 12 }
    },
    {
        id: 'al_salam',
        name: 'Al-Salam',
        name_ar: 'السلام',
        level: 'neighborhood',
        parent_id: 'al_adhamiya',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3856, lng: 44.3967, radius: 4000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 320000, area_km2: 16, total_orders: 1900, active_drivers: 11 }
    },

    // BAGHDAD NEIGHBORHOODS (Al-Kadhimiya District)
    {
        id: 'al_kadhimiya_center',
        name: 'Al-Kadhimiya Center',
        name_ar: 'مركز الكاظمية',
        level: 'neighborhood',
        parent_id: 'al_kadhimiya',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3789, lng: 44.3396, radius: 2000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 150000, area_km2: 6, total_orders: 2600, active_drivers: 14 }
    },
    {
        id: 'al_shula',
        name: 'Al-Shula',
        name_ar: 'الشعلة',
        level: 'neighborhood',
        parent_id: 'al_kadhimiya',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.4012, lng: 44.3225, radius: 5000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 580000, area_km2: 32, total_orders: 2800, active_drivers: 16 }
    },

    // BAGHDAD NEIGHBORHOODS (New Baghdad District)
    {
        id: 'new_baghdad_center',
        name: 'New Baghdad Center',
        name_ar: 'مركز بغداد الجديدة',
        level: 'neighborhood',
        parent_id: 'new_baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2850, lng: 44.4500, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 220000, area_km2: 12, total_orders: 1800, active_drivers: 11 }
    },
    {
        id: 'al_zaafaraniya',
        name: 'Al-Zaafaraniya',
        name_ar: 'الزعفرانية',
        level: 'neighborhood',
        parent_id: 'new_baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2654, lng: 44.4713, radius: 4000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 360000, area_km2: 26, total_orders: 2100, active_drivers: 15 }
    },

    // BASRA NEIGHBORHOODS (Al-Maqal District)
    {
        id: 'al_maqal_center',
        name: 'Al-Maqal Center',
        name_ar: 'مركز المعقل',
        level: 'neighborhood',
        parent_id: 'al_maqal',
        governorate_id: 'basra',
        coordinates: { lat: 30.5200, lng: 47.7600, radius: 2500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 180000, area_km2: 10, total_orders: 1200, active_drivers: 8 }
    },
    {
        id: 'al_jamhuriya',
        name: 'Al-Jamhuriya',
        name_ar: 'الجمهورية',
        level: 'neighborhood',
        parent_id: 'al_maqal',
        governorate_id: 'basra',
        coordinates: { lat: 30.5350, lng: 47.7750, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 240000, area_km2: 15, total_orders: 1600, active_drivers: 10 }
    },

    // BASRA NEIGHBORHOODS (Basra Central District)
    {
        id: 'al_hakimiya',
        name: 'Al-Hakimiya',
        name_ar: 'الحكيمية',
        level: 'neighborhood',
        parent_id: 'basra_central',
        governorate_id: 'basra',
        coordinates: { lat: 30.5150, lng: 47.7900, radius: 2500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 160000, area_km2: 8, total_orders: 1400, active_drivers: 9 }
    },
    {
        id: 'al_tameemi',
        name: 'Al-Tameemi',
        name_ar: 'التميمي',
        level: 'neighborhood',
        parent_id: 'basra_central',
        governorate_id: 'basra',
        coordinates: { lat: 30.5050, lng: 47.8050, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 200000, area_km2: 12, total_orders: 1800, active_drivers: 11 }
    },

    // ERBIL NEIGHBORHOODS (Erbil Center District)
    {
        id: 'erbil_citadel',
        name: 'Erbil Citadel',
        name_ar: 'قلعة أربيل',
        name_ku: 'قەڵای هەولێر',
        level: 'neighborhood',
        parent_id: 'erbil_center',
        governorate_id: 'erbil',
        coordinates: { lat: 36.1911, lng: 44.0093, radius: 1000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 5000, area_km2: 1, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'shorsh',
        name: 'Shorsh',
        name_ar: 'شورش',
        name_ku: 'شۆڕش',
        level: 'neighborhood',
        parent_id: 'erbil_center',
        governorate_id: 'erbil',
        coordinates: { lat: 36.1850, lng: 44.0200, radius: 2500 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 120000, area_km2: 8, total_orders: 0, active_drivers: 0 }
    },

    // NAJAF NEIGHBORHOODS (Najaf Center District)
    {
        id: 'najaf_old_city',
        name: 'Najaf Old City',
        name_ar: 'النجف القديمة',
        level: 'neighborhood',
        parent_id: 'najaf_center',
        governorate_id: 'najaf',
        coordinates: { lat: 31.9996, lng: 44.3267, radius: 2000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 180000, area_km2: 6, total_orders: 980, active_drivers: 7 }
    },
    {
        id: 'al_maidan',
        name: 'Al-Maidan',
        name_ar: 'الميدان',
        level: 'neighborhood',
        parent_id: 'najaf_center',
        governorate_id: 'najaf',
        coordinates: { lat: 32.0050, lng: 44.3350, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 220000, area_km2: 12, total_orders: 1120, active_drivers: 8 }
    },

    // KARBALA NEIGHBORHOODS (Karbala Center District)
    {
        id: 'karbala_old_city',
        name: 'Karbala Old City',
        name_ar: 'كربلاء القديمة',
        level: 'neighborhood',
        parent_id: 'karbala_center',
        governorate_id: 'karbala',
        coordinates: { lat: 32.6169, lng: 44.0252, radius: 2000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 160000, area_km2: 5, total_orders: 890, active_drivers: 6 }
    },
    {
        id: 'al_hur',
        name: 'Al-Hur',
        name_ar: 'الحر',
        level: 'neighborhood',
        parent_id: 'karbala_center',
        governorate_id: 'karbala',
        coordinates: { lat: 32.6250, lng: 44.0350, radius: 3500 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 220000, area_km2: 15, total_orders: 1010, active_drivers: 6 }
    },

    // ==================== ADDITIONAL CITY DISTRICTS & NEIGHBORHOODS ====================

    // NINEVEH GOVERNORATE - MAJOR CITIES AS DISTRICTS
    {
        id: 'mosul_center',
        name: 'Mosul Center',
        name_ar: 'مركز الموصل',
        level: 'district',
        parent_id: 'nineveh',
        governorate_id: 'nineveh',
        coordinates: { lat: 36.3350, lng: 43.1189, radius: 12000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1200000, area_km2: 180, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'tel_afar',
        name: 'Tel Afar',
        name_ar: 'تلعفر',
        level: 'district',
        parent_id: 'nineveh',
        governorate_id: 'nineveh',
        coordinates: { lat: 36.3742, lng: 42.4505, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 180000, area_km2: 85, total_orders: 0, active_drivers: 0 }
    },

    // MOSUL NEIGHBORHOODS
    {
        id: 'mosul_right_bank',
        name: 'Mosul Right Bank',
        name_ar: 'الجانب الأيمن',
        level: 'neighborhood',
        parent_id: 'mosul_center',
        governorate_id: 'nineveh',
        coordinates: { lat: 36.3500, lng: 43.1400, radius: 5000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 600000, area_km2: 85, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'mosul_left_bank',
        name: 'Mosul Left Bank',
        name_ar: 'الجانب الأيسر',
        level: 'neighborhood',
        parent_id: 'mosul_center',
        governorate_id: 'nineveh',
        coordinates: { lat: 36.3400, lng: 43.1300, radius: 5000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 600000, area_km2: 95, total_orders: 0, active_drivers: 0 }
    },

    // SULAYMANIYAH GOVERNORATE - CITY DISTRICTS
    {
        id: 'sulaymaniyah_center',
        name: 'Sulaymaniyah Center',
        name_ar: 'مركز السليمانية',
        name_ku: 'ناوەندی سلێمانی',
        level: 'district',
        parent_id: 'sulaymaniyah',
        governorate_id: 'sulaymaniyah',
        coordinates: { lat: 35.5650, lng: 45.4377, radius: 10000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 850000, area_km2: 120, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'halabja',
        name: 'Halabja',
        name_ar: 'هەڵەبجە',
        name_ku: 'هەڵەبجە',
        level: 'district',
        parent_id: 'sulaymaniyah',
        governorate_id: 'sulaymaniyah',
        coordinates: { lat: 35.1765, lng: 45.9852, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 95000, area_km2: 55, total_orders: 0, active_drivers: 0 }
    },

    // SULAYMANIYAH NEIGHBORHOODS
    {
        id: 'sulaymaniyah_salim_street',
        name: 'Salim Street',
        name_ar: 'شارع سليم',
        name_ku: 'شەقامی سەلیم',
        level: 'neighborhood',
        parent_id: 'sulaymaniyah_center',
        governorate_id: 'sulaymaniyah',
        coordinates: { lat: 35.5680, lng: 45.4310, radius: 2000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 120000, area_km2: 8, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'sulaymaniyah_sabunkaran',
        name: 'Sabunkaran',
        name_ar: 'صابونكاران',
        name_ku: 'سابونکاران',
        level: 'neighborhood',
        parent_id: 'sulaymaniyah_center',
        governorate_id: 'sulaymaniyah',
        coordinates: { lat: 35.5620, lng: 45.4440, radius: 3000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 180000, area_km2: 15, total_orders: 0, active_drivers: 0 }
    },

    // DUHOK GOVERNORATE - CITY DISTRICTS
    {
        id: 'duhok_center',
        name: 'Duhok Center',
        name_ar: 'مركز دهوك',
        name_ku: 'ناوەندی دهۆک',
        level: 'district',
        parent_id: 'duhok',
        governorate_id: 'duhok',
        coordinates: { lat: 36.8617, lng: 42.9977, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 400000, area_km2: 65, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'zakho',
        name: 'Zakho',
        name_ar: 'زاخو',
        name_ku: 'زاخۆ',
        level: 'district',
        parent_id: 'duhok',
        governorate_id: 'duhok',
        coordinates: { lat: 37.1431, lng: 42.6813, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 180000, area_km2: 45, total_orders: 0, active_drivers: 0 }
    },

    // DUHOK NEIGHBORHOODS
    {
        id: 'duhok_university_area',
        name: 'University Area',
        name_ar: 'منطقة الجامعة',
        name_ku: 'ناوچەی زانکۆ',
        level: 'neighborhood',
        parent_id: 'duhok_center',
        governorate_id: 'duhok',
        coordinates: { lat: 36.8700, lng: 42.9850, radius: 2500 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 85000, area_km2: 12, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'duhok_newroz',
        name: 'Newroz',
        name_ar: 'نوروز',
        name_ku: 'نەورۆز',
        level: 'neighborhood',
        parent_id: 'duhok_center',
        governorate_id: 'duhok',
        coordinates: { lat: 36.8580, lng: 43.0100, radius: 3000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 140000, area_km2: 18, total_orders: 0, active_drivers: 0 }
    },

    // KIRKUK GOVERNORATE - CITY DISTRICTS
    {
        id: 'kirkuk_center',
        name: 'Kirkuk Center',
        name_ar: 'مركز كركوك',
        name_ku: 'ناوەندی کەرکووک',
        level: 'district',
        parent_id: 'kirkuk',
        governorate_id: 'kirkuk',
        coordinates: { lat: 35.4681, lng: 44.3922, radius: 10000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 750000, area_km2: 95, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'tuz_khurmatu',
        name: 'Tuz Khurmatu',
        name_ar: 'طوزخورماتو',
        name_ku: 'تووزخورماتوو',
        level: 'district',
        parent_id: 'kirkuk',
        governorate_id: 'kirkuk',
        coordinates: { lat: 34.8833, lng: 44.6333, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 150000, area_km2: 42, total_orders: 0, active_drivers: 0 }
    },

    // KIRKUK NEIGHBORHOODS
    {
        id: 'kirkuk_citadel',
        name: 'Kirkuk Citadel',
        name_ar: 'قلعة كركوك',
        name_ku: 'قەڵای کەرکووک',
        level: 'neighborhood',
        parent_id: 'kirkuk_center',
        governorate_id: 'kirkuk',
        coordinates: { lat: 35.4681, lng: 44.3922, radius: 1500 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 45000, area_km2: 5, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'kirkuk_rahimawa',
        name: 'Rahimawa',
        name_ar: 'رحيماوة',
        name_ku: 'ڕەحیماوە',
        level: 'neighborhood',
        parent_id: 'kirkuk_center',
        governorate_id: 'kirkuk',
        coordinates: { lat: 35.4750, lng: 44.4050, radius: 3000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 180000, area_km2: 22, total_orders: 0, active_drivers: 0 }
    },

    // ANBAR GOVERNORATE - MAJOR CITIES AS DISTRICTS
    {
        id: 'ramadi_center',
        name: 'Ramadi Center',
        name_ar: 'مركز الرمادي',
        level: 'district',
        parent_id: 'anbar',
        governorate_id: 'anbar',
        coordinates: { lat: 33.4224, lng: 43.3089, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 280000, area_km2: 55, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'fallujah',
        name: 'Fallujah',
        name_ar: 'الفلوجة',
        level: 'district',
        parent_id: 'anbar',
        governorate_id: 'anbar',
        coordinates: { lat: 33.3510, lng: 43.7844, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 220000, area_km2: 38, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'hit',
        name: 'Hit',
        name_ar: 'هيت',
        level: 'district',
        parent_id: 'anbar',
        governorate_id: 'anbar',
        coordinates: { lat: 33.6417, lng: 42.8261, radius: 5000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 120000, area_km2: 28, total_orders: 0, active_drivers: 0 }
    },

    // BABYLON GOVERNORATE - MAJOR CITIES AS DISTRICTS
    {
        id: 'hillah_center',
        name: 'Hillah Center',
        name_ar: 'مركز الحلة',
        level: 'district',
        parent_id: 'babylon',
        governorate_id: 'babylon',
        coordinates: { lat: 32.4722, lng: 44.4267, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 580000, area_km2: 75, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'musayyib',
        name: 'Musayyib',
        name_ar: 'المسيب',
        level: 'district',
        parent_id: 'babylon',
        governorate_id: 'babylon',
        coordinates: { lat: 32.7833, lng: 44.2833, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 180000, area_km2: 42, total_orders: 0, active_drivers: 0 }
    },

    // HILLAH NEIGHBORHOODS
    {
        id: 'hillah_old_city',
        name: 'Hillah Old City',
        name_ar: 'الحلة القديمة',
        level: 'neighborhood',
        parent_id: 'hillah_center',
        governorate_id: 'babylon',
        coordinates: { lat: 32.4722, lng: 44.4267, radius: 2500 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 150000, area_km2: 12, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'hillah_industrial',
        name: 'Hillah Industrial',
        name_ar: 'المنطقة الصناعية',
        level: 'neighborhood',
        parent_id: 'hillah_center',
        governorate_id: 'babylon',
        coordinates: { lat: 32.4650, lng: 44.4400, radius: 3500 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 85000, area_km2: 18, total_orders: 0, active_drivers: 0 }
    },

    // DIYALA GOVERNORATE - MAJOR CITIES AS DISTRICTS
    {
        id: 'baqubah_center',
        name: 'Baqubah Center',
        name_ar: 'مركز بعقوبة',
        level: 'district',
        parent_id: 'diyala',
        governorate_id: 'diyala',
        coordinates: { lat: 33.7500, lng: 44.6500, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 380000, area_km2: 58, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'khanaqin',
        name: 'Khanaqin',
        name_ar: 'خانقين',
        name_ku: 'خانەقین',
        level: 'district',
        parent_id: 'diyala',
        governorate_id: 'diyala',
        coordinates: { lat: 34.3667, lng: 45.4167, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 150000, area_km2: 35, total_orders: 0, active_drivers: 0 }
    },

    // SALADIN GOVERNORATE - MAJOR CITIES AS DISTRICTS
    {
        id: 'tikrit_center',
        name: 'Tikrit Center',
        name_ar: 'مركز تكريت',
        level: 'district',
        parent_id: 'saladin',
        governorate_id: 'saladin',
        coordinates: { lat: 34.6056, lng: 43.6781, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 220000, area_km2: 45, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'samarra',
        name: 'Samarra',
        name_ar: 'سامراء',
        level: 'district',
        parent_id: 'saladin',
        governorate_id: 'saladin',
        coordinates: { lat: 34.1967, lng: 43.8744, radius: 5000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 180000, area_km2: 38, total_orders: 0, active_drivers: 0 }
    },

    // WASIT GOVERNORATE - MAJOR CITIES AS DISTRICTS
    {
        id: 'kut_center',
        name: 'Kut Center',
        name_ar: 'مركز الكوت',
        level: 'district',
        parent_id: 'wasit',
        governorate_id: 'wasit',
        coordinates: { lat: 32.5128, lng: 45.8183, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 380000, area_km2: 65, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'amarah_center',
        name: 'Amarah Center',
        name_ar: 'مركز العمارة',
        level: 'district',
        parent_id: 'maysan',
        governorate_id: 'maysan',
        coordinates: { lat: 31.9300, lng: 47.1500, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 320000, area_km2: 55, total_orders: 0, active_drivers: 0 }
    },

    // DHI QAR GOVERNORATE - MAJOR CITIES AS DISTRICTS
    {
        id: 'nasiriyah_center',
        name: 'Nasiriyah Center',
        name_ar: 'مركز الناصرية',
        level: 'district',
        parent_id: 'dhi_qar',
        governorate_id: 'dhi_qar',
        coordinates: { lat: 31.0570, lng: 46.2580, radius: 10000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 480000, area_km2: 82, total_orders: 0, active_drivers: 0 }
    },

    // MUTHANNA GOVERNORATE - MAJOR CITIES AS DISTRICTS
    {
        id: 'samawah_center',
        name: 'Samawah Center',
        name_ar: 'مركز السماوة',
        level: 'district',
        parent_id: 'muthanna',
        governorate_id: 'muthanna',
        coordinates: { lat: 31.3317, lng: 45.2942, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 280000, area_km2: 58, total_orders: 0, active_drivers: 0 }
    },

    // QADISIYYAH GOVERNORATE - MAJOR CITIES AS DISTRICTS
    {
        id: 'diwaniya_center',
        name: 'Diwaniya Center',
        name_ar: 'مركز الديوانية',
        level: 'district',
        parent_id: 'qadisiyyah',
        governorate_id: 'qadisiyyah',
        coordinates: { lat: 31.9833, lng: 45.0500, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 420000, area_km2: 68, total_orders: 0, active_drivers: 0 }
    },

    // ADDITIONAL ERBIL NEIGHBORHOODS 
    {
        id: 'ankawa_center',
        name: 'Ankawa Center',
        name_ar: 'مركز عنكاوا',
        name_ku: 'ناوەندی عەنکاوا',
        level: 'neighborhood',
        parent_id: 'ankawa',
        governorate_id: 'erbil',
        coordinates: { lat: 36.2200, lng: 44.0400, radius: 2000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 85000, area_km2: 8, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'erbil_german_village',
        name: 'German Village',
        name_ar: 'القرية الألمانية',
        name_ku: 'گوندی ئەڵمانی',
        level: 'neighborhood',
        parent_id: 'erbil_center',
        governorate_id: 'erbil',
        coordinates: { lat: 36.1950, lng: 44.0150, radius: 1500 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 25000, area_km2: 3, total_orders: 0, active_drivers: 0 }
    },

    // ADDITIONAL KUFA NEIGHBORHOODS
    {
        id: 'kufa_old_city',
        name: 'Kufa Old City',
        name_ar: 'الكوفة القديمة',
        level: 'neighborhood',
        parent_id: 'kufa',
        governorate_id: 'najaf',
        coordinates: { lat: 32.0296, lng: 44.3731, radius: 2500 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 95000, area_km2: 8, total_orders: 420, active_drivers: 4 }
    },
    {
        id: 'kufa_university_area',
        name: 'University of Kufa Area',
        name_ar: 'منطقة جامعة الكوفة',
        level: 'neighborhood',
        parent_id: 'kufa',
        governorate_id: 'najaf',
        coordinates: { lat: 32.0350, lng: 44.3800, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 125000, area_km2: 12, total_orders: 560, active_drivers: 4 }
    }
];

// GET /api/regions - Fetch all regions with comprehensive Iraqi data
app.get('/api/regions', async (req, res) => {
    try {
        const { level, parent_id, governorate_id, active, search, limit = 50, offset = 0 } = req.query;
        console.log('📍 API: Getting regions with filters:', { level, parent_id, governorate_id, active, search });
        
        // Use comprehensive Iraqi regions data
        let regions = [...comprehensiveIraqiRegions];
        
        // Apply filters
        if (level) {
            regions = regions.filter(r => r.level === level);
        }
        if (parent_id) {
            regions = regions.filter(r => r.parent_id === parent_id);
        }
        if (governorate_id) {
            regions = regions.filter(r => r.governorate_id === governorate_id);
        }
        if (active !== undefined) {
            const isActive = active === 'true';
            regions = regions.filter(r => r.is_active === isActive);
        }
        if (search) {
            const searchLower = search.toLowerCase();
            regions = regions.filter(r => 
                r.name.toLowerCase().includes(searchLower) ||
                r.name_ar.includes(search) ||
                r.id.toLowerCase().includes(searchLower)
            );
        }
        
        // Pagination
        const total = regions.length;
        const paginatedRegions = regions.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        res.json({
            success: true,
            data: paginatedRegions,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < total
            },
            filters: { level, parent_id, governorate_id, active, search },
            source: 'comprehensive-iraqi-dataset',
            summary: {
                country: 1,
                governorates: 18,
                districts: 3,
                neighborhoods: 6,
                total: total
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error getting regions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load regions',
            message: error.message
        });
    }
});

// POST /api/regions - Create or update region
app.post('/api/regions', async (req, res) => {
    try {
        console.log('📍 Creating/updating region...', req.body.name);
        
        const region = {
            id: req.body.id || `region_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            created_at: req.body.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: req.headers['x-user-id'] || 'dev-user'
        };
        
        // In a real implementation, this would save to DynamoDB
        console.log('✅ Region processed:', region.id);
        
        res.json({
            success: true,
            message: 'Region saved successfully',
            region,
            source: 'local-processing'
        });
    } catch (error) {
        console.error('❌ Error saving region:', error);
        res.status(500).json({
            error: 'Failed to save region',
            message: error.message
        });
    }
});

// GET /api/regions/statistics - Get comprehensive regions statistics
app.get('/api/regions/statistics', async (req, res) => {
    try {
        console.log('📍 Calculating comprehensive regions statistics...');
        
        const stats = {
            totalRegions: comprehensiveIraqiRegions.length,
            activeRegions: comprehensiveIraqiRegions.filter(r => r.is_active).length,
            inactiveRegions: comprehensiveIraqiRegions.filter(r => !r.is_active).length,
            levelBreakdown: {
                country: comprehensiveIraqiRegions.filter(r => r.level === 'country').length,
                governorates: comprehensiveIraqiRegions.filter(r => r.level === 'governorate').length,
                districts: comprehensiveIraqiRegions.filter(r => r.level === 'district').length,
                neighborhoods: comprehensiveIraqiRegions.filter(r => r.level === 'neighborhood').length
            },
            serviceStats: {
                totalDrivers: comprehensiveIraqiRegions.reduce((sum, r) => sum + (r.statistics?.active_drivers || 0), 0),
                totalOrders: comprehensiveIraqiRegions.reduce((sum, r) => sum + (r.statistics?.total_orders || 0), 0),
                avgPopulation: Math.round(comprehensiveIraqiRegions.reduce((sum, r) => sum + (r.statistics?.population || 0), 0) / comprehensiveIraqiRegions.length),
                totalPopulation: comprehensiveIraqiRegions.reduce((sum, r) => sum + (r.statistics?.population || 0), 0)
            },
            coverage: {
                serviceTypes: {
                    delivery: comprehensiveIraqiRegions.filter(r => r.service_config?.delivery).length,
                    pickup: comprehensiveIraqiRegions.filter(r => r.service_config?.pickup).length,
                    express: comprehensiveIraqiRegions.filter(r => r.service_config?.express).length,
                    standard: comprehensiveIraqiRegions.filter(r => r.service_config?.standard).length
                },
                totalArea: comprehensiveIraqiRegions.reduce((sum, r) => sum + (r.statistics?.area_km2 || 0), 0)
            }
        };

        res.json({
            success: true,
            data: stats,
            message: 'Comprehensive Iraqi regions statistics - All 18 governorates included',
            generatedAt: new Date().toISOString(),
            source: 'comprehensive-iraqi-dataset'
        });
    } catch (error) {
        console.error('❌ Error calculating regions statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate regions statistics',
            message: error.message
        });
    }
});

// GET /api/regions/:id - Get individual region details
app.get('/api/regions/:id', async (req, res) => {
    try {
        const regionId = req.params.id;
        console.log(`🔍 Looking up region: ${regionId}`);
        
        const region = comprehensiveIraqiRegions.find(r => r.id === regionId);
        
        if (!region) {
            return res.status(404).json({
                success: false,
                error: 'Region not found',
                message: `Region with ID '${regionId}' not found`,
                regionId: regionId
            });
        }

        res.json({
            success: true,
            data: region,
            message: `Region details for ${region.name}`,
            timestamp: new Date().toISOString(),
            source: 'comprehensive-iraqi-dataset'
        });
    } catch (error) {
        console.error('❌ Error fetching region details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch region details',
            message: error.message
        });
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
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: ['condition-engine', 'regions-management', 'real-dynamodb'],
        regionsCount: comprehensiveIraqiRegions.length
    });
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
    console.log(`📍 Iraqi Regions: ${comprehensiveIraqiRegions.length} regions loaded`);
    console.log('');
    console.log('🔗 Available Endpoints:');
    console.log(`   Dashboard: http://localhost:${PORT}/`);
    console.log(`   Conditions: http://localhost:${PORT}/pages/conditions.html`);
    console.log(`   Analytics: http://localhost:${PORT}/pages/analytics.html`);
    console.log(`   Regions: http://localhost:${PORT}/pages/regions.html`);
    console.log(`   API Health: http://localhost:${PORT}/health`);
    console.log('');
    console.log('📊 Regions Summary:');
    console.log(`   Countries: ${comprehensiveIraqiRegions.filter(r => r.level === 'country').length}`);
    console.log(`   Governorates: ${comprehensiveIraqiRegions.filter(r => r.level === 'governorate').length}`);
    console.log(`   Districts: ${comprehensiveIraqiRegions.filter(r => r.level === 'district').length}`);
    console.log(`   Neighborhoods: ${comprehensiveIraqiRegions.filter(r => r.level === 'neighborhood').length}`);
    console.log('===============================================');
});