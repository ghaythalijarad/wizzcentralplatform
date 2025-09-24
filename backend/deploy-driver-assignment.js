#!/usr/bin/env node
/**
 * Deployment Script for Driver Assignment System
 * This script sets up the necessary infrastructure for the driver assignment system
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// AWS Configuration
const dynamoDB = new AWS.DynamoDB({ region: 'us-east-1' });
const lambda = new AWS.Lambda({ region: 'us-east-1' });
const apiGateway = new AWS.ApiGatewayV2({ region: 'us-east-1' });

// Configuration
const STAGE = process.env.STAGE || 'dev';
const WEBSOCKET_API_ID = 'lwk0wf6rpl';

// Table definitions
const TABLES = [
    {
        name: 'WizzUser_driver_assignments_dev',
        schema: {
            TableName: 'WizzUser_driver_assignments_dev',
            KeySchema: [
                { AttributeName: 'PK', KeyType: 'HASH' },
                { AttributeName: 'SK', KeyType: 'RANGE' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'PK', AttributeType: 'S' },
                { AttributeName: 'SK', AttributeType: 'S' },
                { AttributeName: 'orderId', AttributeType: 'S' },
                { AttributeName: 'driverId', AttributeType: 'S' },
                { AttributeName: 'timestamp', AttributeType: 'S' }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'OrderIdIndex',
                    KeySchema: [
                        { AttributeName: 'orderId', KeyType: 'HASH' },
                        { AttributeName: 'timestamp', KeyType: 'RANGE' }
                    ],
                    Projection: { ProjectionType: 'ALL' },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5
                    }
                },
                {
                    IndexName: 'DriverIdIndex',
                    KeySchema: [
                        { AttributeName: 'driverId', KeyType: 'HASH' },
                        { AttributeName: 'timestamp', KeyType: 'RANGE' }
                    ],
                    Projection: { ProjectionType: 'ALL' },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5
                    }
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 10,
                WriteCapacityUnits: 10
            },
            StreamSpecification: {
                StreamEnabled: true,
                StreamViewType: 'NEW_AND_OLD_IMAGES'
            }
        }
    }
];

// Lambda functions to deploy
const LAMBDA_FUNCTIONS = [
    {
        name: 'wizzcentral-driver-assignment-trigger',
        handler: 'src/handlers/order-status-trigger.handler',
        description: 'Triggers driver assignment when order status changes',
        environment: {
            ORDERS_TABLE: 'WizzUser_orders_dev',
            DRIVERS_TABLE: 'WizzUser_drivers_dev',
            WEBSOCKET_CONNECTIONS_TABLE: 'WizzUser_websocket_connections_dev',
            ASSIGNMENT_HISTORY_TABLE: 'WizzUser_driver_assignments_dev',
            WEBSOCKET_ENDPOINT: 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev'
        }
    }
];

async function createTable(tableConfig) {
    console.log(`📊 Creating table: ${tableConfig.name}`);
    
    try {
        // Check if table exists
        await dynamoDB.describeTable({ TableName: tableConfig.name }).promise();
        console.log(`✅ Table ${tableConfig.name} already exists`);
        return;
    } catch (error) {
        if (error.code !== 'ResourceNotFoundException') {
            throw error;
        }
    }

    try {
        await dynamoDB.createTable(tableConfig.schema).promise();
        console.log(`✅ Table ${tableConfig.name} created successfully`);
        
        // Wait for table to be active
        await dynamoDB.waitFor('tableExists', { TableName: tableConfig.name }).promise();
        console.log(`✅ Table ${tableConfig.name} is now active`);
    } catch (error) {
        console.error(`❌ Error creating table ${tableConfig.name}:`, error);
        throw error;
    }
}

async function packageLambdaFunction(functionName) {
    console.log(`📦 Packaging Lambda function: ${functionName}`);
    
    const AdmZip = require('adm-zip');
    const zip = new AdmZip();
    
    // Add source files
    const srcDir = path.join(__dirname, 'src');
    const addDirectory = (dirPath, zipPath = '') => {
        const items = fs.readdirSync(dirPath);
        items.forEach(item => {
            const fullPath = path.join(dirPath, item);
            const zipItemPath = path.join(zipPath, item);
            
            if (fs.statSync(fullPath).isDirectory()) {
                addDirectory(fullPath, zipItemPath);
            } else if (item.endsWith('.js')) {
                zip.addLocalFile(fullPath, zipPath);
            }
        });
    };
    
    addDirectory(srcDir);
    
    // Add package.json
    const packageJson = {
        name: functionName,
        version: '1.0.0',
        main: 'index.js',
        dependencies: {
            '@aws-sdk/client-dynamodb': '^3.450.0',
            '@aws-sdk/lib-dynamodb': '^3.450.0',
            '@aws-sdk/client-apigatewaymanagementapi': '^3.450.0'
        }
    };
    
    zip.addFile('package.json', Buffer.from(JSON.stringify(packageJson, null, 2)));
    
    return zip.toBuffer();
}

async function deployLambdaFunction(functionConfig) {
    console.log(`🚀 Deploying Lambda function: ${functionConfig.name}`);
    
    try {
        const zipBuffer = await packageLambdaFunction(functionConfig.name);
        
        const params = {
            FunctionName: functionConfig.name,
            Runtime: 'nodejs18.x',
            Role: `arn:aws:iam::${await getAccountId()}:role/lambda-execution-role`,
            Handler: functionConfig.handler,
            Code: { ZipFile: zipBuffer },
            Description: functionConfig.description,
            Timeout: 30,
            MemorySize: 256,
            Environment: {
                Variables: functionConfig.environment
            }
        };

        try {
            // Try to update existing function
            await lambda.updateFunctionCode({
                FunctionName: functionConfig.name,
                ZipFile: zipBuffer
            }).promise();
            
            await lambda.updateFunctionConfiguration({
                FunctionName: functionConfig.name,
                Runtime: params.Runtime,
                Role: params.Role,
                Handler: params.Handler,
                Description: params.Description,
                Timeout: params.Timeout,
                MemorySize: params.MemorySize,
                Environment: params.Environment
            }).promise();
            
            console.log(`✅ Updated existing Lambda function: ${functionConfig.name}`);
        } catch (updateError) {
            if (updateError.code === 'ResourceNotFoundException') {
                // Create new function
                await lambda.createFunction(params).promise();
                console.log(`✅ Created new Lambda function: ${functionConfig.name}`);
            } else {
                throw updateError;
            }
        }
    } catch (error) {
        console.error(`❌ Error deploying Lambda function ${functionConfig.name}:`, error);
        throw error;
    }
}

async function getAccountId() {
    const sts = new AWS.STS();
    const identity = await sts.getCallerIdentity().promise();
    return identity.Account;
}

async function addWebSocketRoutes() {
    console.log('🔗 Adding WebSocket routes for driver assignment');
    
    try {
        // Get existing routes
        const routes = await apiGateway.getRoutes({ ApiId: WEBSOCKET_API_ID }).promise();
        
        const requiredRoutes = [
            'driver_assignment_response',
            'driver_location_update',
            'driver_status_update',
            'order_status_update'
        ];
        
        for (const routeKey of requiredRoutes) {
            const existingRoute = routes.Items.find(r => r.RouteKey === routeKey);
            
            if (!existingRoute) {
                await apiGateway.createRoute({
                    ApiId: WEBSOCKET_API_ID,
                    RouteKey: routeKey,
                    Target: `integrations/${await getWebSocketIntegrationId()}`
                }).promise();
                
                console.log(`✅ Added WebSocket route: ${routeKey}`);
            } else {
                console.log(`✅ WebSocket route already exists: ${routeKey}`);
            }
        }
    } catch (error) {
        console.error('❌ Error adding WebSocket routes:', error);
        throw error;
    }
}

async function getWebSocketIntegrationId() {
    const integrations = await apiGateway.getIntegrations({ ApiId: WEBSOCKET_API_ID }).promise();
    return integrations.Items[0]?.IntegrationId;
}

async function deployDriverAssignmentSystem() {
    console.log('🎯 Starting Driver Assignment System deployment...\n');
    
    try {
        // 1. Create DynamoDB tables
        console.log('📊 Creating DynamoDB tables...');
        for (const table of TABLES) {
            await createTable(table);
        }
        console.log('✅ All tables created successfully\n');
        
        // 2. Deploy Lambda functions
        console.log('🚀 Deploying Lambda functions...');
        for (const func of LAMBDA_FUNCTIONS) {
            await deployLambdaFunction(func);
        }
        console.log('✅ All Lambda functions deployed successfully\n');
        
        // 3. Add WebSocket routes
        console.log('🔗 Configuring WebSocket routes...');
        await addWebSocketRoutes();
        console.log('✅ WebSocket routes configured successfully\n');
        
        // 4. Create deployment summary
        console.log('📋 Deployment Summary:');
        console.log('─'.repeat(50));
        console.log(`📊 DynamoDB Tables: ${TABLES.length} created/verified`);
        console.log(`🚀 Lambda Functions: ${LAMBDA_FUNCTIONS.length} deployed`);
        console.log(`🔗 WebSocket Endpoint: wss://${WEBSOCKET_API_ID}.execute-api.us-east-1.amazonaws.com/${STAGE}`);
        console.log('─'.repeat(50));
        console.log('');
        
        console.log('🎉 Driver Assignment System deployed successfully!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('1. Test driver assignment with sample orders');
        console.log('2. Monitor assignment success rates');
        console.log('3. Configure driver app integration');
        console.log('4. Set up analytics dashboards');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

// Run deployment if script is executed directly
if (require.main === module) {
    deployDriverAssignmentSystem();
}

module.exports = {
    deployDriverAssignmentSystem,
    createTable,
    deployLambdaFunction,
    addWebSocketRoutes
};
