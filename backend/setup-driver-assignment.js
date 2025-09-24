#!/usr/bin/env node
/**
 * Setup Script for Driver Assignment System
 * Configures DynamoDB streams and deploys the order stream processor
 */

const { DynamoDBClient, DescribeTableCommand, UpdateTableCommand } = require('@aws-sdk/client-dynamodb');
const { LambdaClient, CreateEventSourceMappingCommand, GetEventSourceMappingCommand } = require('@aws-sdk/client-lambda');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });

const ORDERS_TABLE = 'WizzOrders_dev';
const LAMBDA_FUNCTION_NAME = 'wizzcentral-unified-chat-dev-orderStreamProcessor';

/**
 * Check if DynamoDB streams are enabled on the orders table
 */
async function checkStreamsEnabled() {
    try {
        console.log('🔍 Checking DynamoDB streams configuration...');
        
        const command = new DescribeTableCommand({
            TableName: ORDERS_TABLE
        });
        
        const result = await dynamoClient.send(command);
        const streamSpec = result.Table.StreamSpecification;
        
        if (streamSpec && streamSpec.StreamEnabled) {
            console.log('✅ DynamoDB streams are already enabled');
            console.log(`   Stream ARN: ${result.Table.LatestStreamArn}`);
            return {
                enabled: true,
                streamArn: result.Table.LatestStreamArn
            };
        } else {
            console.log('❌ DynamoDB streams are not enabled');
            return { enabled: false };
        }
    } catch (error) {
        console.error('❌ Error checking streams:', error.message);
        throw error;
    }
}

/**
 * Enable DynamoDB streams on the orders table
 */
async function enableStreams() {
    try {
        console.log('🔧 Enabling DynamoDB streams...');
        
        const command = new UpdateTableCommand({
            TableName: ORDERS_TABLE,
            StreamSpecification: {
                StreamEnabled: true,
                StreamViewType: 'NEW_AND_OLD_IMAGES'
            }
        });
        
        const result = await dynamoClient.send(command);
        console.log('✅ DynamoDB streams enabled successfully');
        
        // Wait a moment for the stream to be fully active
        console.log('⏳ Waiting for stream to become active...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Get the stream ARN
        const describeResult = await dynamoClient.send(new DescribeTableCommand({
            TableName: ORDERS_TABLE
        }));
        
        return describeResult.Table.LatestStreamArn;
    } catch (error) {
        console.error('❌ Error enabling streams:', error.message);
        throw error;
    }
}

/**
 * Deploy the serverless function
 */
async function deployServerlessFunction() {
    try {
        console.log('🚀 Deploying serverless function...');
        
        const { stdout, stderr } = await execAsync('serverless deploy --stage dev', {
            cwd: __dirname
        });
        
        console.log('📝 Deployment output:');
        console.log(stdout);
        
        if (stderr) {
            console.warn('⚠️ Deployment warnings:');
            console.warn(stderr);
        }
        
        console.log('✅ Serverless function deployed successfully');
    } catch (error) {
        console.error('❌ Error deploying serverless function:', error.message);
        throw error;
    }
}

/**
 * Create event source mapping for DynamoDB stream
 */
async function createEventSourceMapping(streamArn) {
    try {
        console.log('🔗 Creating event source mapping...');
        
        // Check if mapping already exists
        try {
            const listCommand = await lambdaClient.send(new GetEventSourceMappingCommand({
                FunctionName: LAMBDA_FUNCTION_NAME
            }));
            console.log('ℹ️ Event source mapping may already exist');
        } catch (error) {
            // Mapping doesn't exist, create it
        }
        
        const command = new CreateEventSourceMappingCommand({
            FunctionName: LAMBDA_FUNCTION_NAME,
            EventSourceArn: streamArn,
            StartingPosition: 'LATEST',
            BatchSize: 10,
            MaximumBatchingWindowInSeconds: 5,
            FilterCriteria: {
                Filters: [
                    {
                        Pattern: JSON.stringify({
                            eventName: ['INSERT', 'MODIFY'],
                            dynamodb: {
                                NewImage: {
                                    PK: {
                                        S: [{ prefix: 'ORDER#' }]
                                    }
                                }
                            }
                        })
                    }
                ]
            }
        });
        
        const result = await lambdaClient.send(command);
        console.log('✅ Event source mapping created successfully');
        console.log(`   UUID: ${result.UUID}`);
        
        return result.UUID;
    } catch (error) {
        if (error.name === 'ResourceConflictException') {
            console.log('ℹ️ Event source mapping already exists');
            return null;
        }
        console.error('❌ Error creating event source mapping:', error.message);
        throw error;
    }
}

/**
 * Test the driver assignment system
 */
async function testDriverAssignment() {
    console.log('🧪 Testing driver assignment system...');
    console.log('You can now:');
    console.log('1. Update an order status to "ready_for_pickup", "confirmed", or "preparing_complete"');
    console.log('2. Check CloudWatch logs for the orderStreamProcessor function');
    console.log('3. Verify that drivers receive notifications through WebSocket connections');
    console.log('');
    console.log('💡 Monitor the system:');
    console.log('   - CloudWatch Logs: /aws/lambda/wizzcentral-unified-chat-dev-orderStreamProcessor');
    console.log('   - DynamoDB table: WizzOrders_dev');
    console.log('   - WebSocket connections: WizzUser_websocket_connections_dev');
}

/**
 * Main setup function
 */
async function main() {
    try {
        console.log('🎯 Setting up Driver Assignment System');
        console.log('=====================================');
        
        // Step 1: Check if streams are enabled
        const streamStatus = await checkStreamsEnabled();
        
        let streamArn = streamStatus.streamArn;
        
        // Step 2: Enable streams if not already enabled
        if (!streamStatus.enabled) {
            streamArn = await enableStreams();
        }
        
        // Step 3: Deploy the serverless function
        await deployServerlessFunction();
        
        // Step 4: Create event source mapping
        await createEventSourceMapping(streamArn);
        
        // Step 5: Test information
        await testDriverAssignment();
        
        console.log('');
        console.log('🎉 Driver Assignment System setup complete!');
        console.log('');
        console.log('📊 System Components:');
        console.log('   ✅ DynamoDB Streams enabled on WizzOrders_dev');
        console.log('   ✅ Order Stream Processor Lambda deployed');
        console.log('   ✅ Event source mapping configured');
        console.log('   ✅ WebSocket notifications ready');
        console.log('   ✅ Driver assignment service integrated');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error('');
        console.error('🔧 Troubleshooting:');
        console.error('1. Ensure AWS credentials are configured');
        console.error('2. Verify the WizzOrders_dev table exists');
        console.error('3. Check IAM permissions for DynamoDB and Lambda');
        console.error('4. Review CloudWatch logs for detailed error information');
        process.exit(1);
    }
}

// Run the setup
if (require.main === module) {
    main();
}

module.exports = {
    checkStreamsEnabled,
    enableStreams,
    deployServerlessFunction,
    createEventSourceMapping
};
