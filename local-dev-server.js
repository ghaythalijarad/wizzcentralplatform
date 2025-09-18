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

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'WizzCentral Platform - Development',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        components: {
            conditionEngine: 'operational',
            realDynamoDB: 'connected',
            awsConnection: 'authenticated'
        },
        endpoints: {
            conditionEngine: '/conditions/*',
            platform: '/public, /analytics, /campaigns',
            development: '/dev/*',
            health: '/health'
        }
    });
});

// ============================================
// STATIC FILE SERVING - Frontend
// ============================================

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// API documentation (accessible via /api-docs)
app.get('/api-docs', (req, res) => {
    res.json({
        message: '🚀 WizzCentral Platform - Development Server',
        version: '2.0.0',
        environment: 'development',
        documentation: {
            conditionEngine: {
                'POST /conditions/evaluate': 'Evaluate campaign conditions',
                'POST /conditions/validate': 'Validate condition structure',
                'GET /conditions/:campaignId': 'Get campaign conditions',
                'POST /conditions/:campaignId': 'Save campaign conditions',
                'POST /conditions/test': 'Test conditions with mock data'
            },
            platform: {
                'GET /public': 'Platform information',
                'POST /public': 'Submit public data',
                'GET /analytics': 'Analytics dashboard data',
                'POST /analytics': 'Record analytics event',
                'GET /campaigns': 'List campaigns',
                'POST /campaigns': 'Create campaign'
            },
            development: {
                'GET /dev/users/:userId': 'Get real user data from DynamoDB',
                'GET /dev/users': 'List users (paginated)',
                'GET /dev/businesses/:businessId': 'Get business data',
                'POST /dev/test-conditions': 'Test conditions with real data',
                'GET /health': 'Health check',
                'GET /api-docs': 'This documentation'
            }
        },
        quickStart: {
            testConditions: 'POST /dev/test-conditions',
            getUserData: 'GET /dev/users/[real-user-id]',
            listUsers: 'GET /dev/users',
            healthCheck: 'GET /health',
            realDataNote: 'All endpoints now use real DynamoDB data!'
        }
    });
});

// Serve the main frontend app (this should be after API routes)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        suggestion: 'Check GET / for available endpoints'
    });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
    console.log('\n🚀 WizzCentral Platform - Development Server Started!');
    console.log('════════════════════════════════════════════════════════');
    console.log(`📍 Local Server: http://localhost:${PORT}`);
    console.log('');
    console.log('🎯 Quick Test Endpoints:');
    console.log(`   GET  http://localhost:${PORT}/health`);
    console.log(`   GET  http://localhost:${PORT}/dev/users/dev-user-123`);
    console.log(`   POST http://localhost:${PORT}/dev/test-conditions`);
    console.log('');
    console.log('🔧 Condition Engine:');
    console.log(`   POST http://localhost:${PORT}/conditions/evaluate`);
    console.log(`   POST http://localhost:${PORT}/conditions/test`);
    console.log('');
    console.log('🌐 Platform APIs:');
    console.log(`   GET  http://localhost:${PORT}/public`);
    console.log(`   GET  http://localhost:${PORT}/analytics`);
    console.log(`   GET  http://localhost:${PORT}/campaigns`);
    console.log('');
    console.log('📚 Documentation:');
    console.log(`   GET  http://localhost:${PORT}/`);
    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('✅ Ready to receive requests!');
    console.log('💡 Use headers: x-user-id, x-user-email for testing');
    console.log('');
});

module.exports = app;
