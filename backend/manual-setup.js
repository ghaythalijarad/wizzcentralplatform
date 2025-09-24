/**
 * Manual Driver Assignment System Setup
 * This script can be run locally to test the order stream processor function
 */

const { handler } = require('./src/handlers/order-stream-processor');

// Sample DynamoDB stream event for testing
const sampleStreamEvent = {
    Records: [
        {
            eventID: "test-event-001",
            eventName: "MODIFY",
            eventVersion: "1.1",
            eventSource: "aws:dynamodb",
            awsRegion: "us-east-1",
            dynamodb: {
                ApproximateCreationDateTime: Date.now() / 1000,
                Keys: {
                    PK: { S: "ORDER#12345" },
                    SK: { S: "ORDER#12345" }
                },
                NewImage: {
                    PK: { S: "ORDER#12345" },
                    SK: { S: "ORDER#12345" },
                    status: { S: "ready_for_pickup" },
                    customerId: { S: "customer123" },
                    restaurantId: { S: "restaurant456" },
                    restaurantName: { S: "Test Restaurant" },
                    restaurantAddress: { S: "123 Test St" },
                    totalAmount: { N: "25.50" },
                    createdAt: { S: new Date().toISOString() },
                    updatedAt: { S: new Date().toISOString() }
                },
                OldImage: {
                    PK: { S: "ORDER#12345" },
                    SK: { S: "ORDER#12345" },
                    status: { S: "preparing" },
                    customerId: { S: "customer123" },
                    restaurantId: { S: "restaurant456" },
                    restaurantName: { S: "Test Restaurant" },
                    restaurantAddress: { S: "123 Test St" },
                    totalAmount: { N: "25.50" },
                    createdAt: { S: new Date().toISOString() },
                    updatedAt: { S: new Date().toISOString() }
                },
                SequenceNumber: "123456789",
                SizeBytes: 500,
                StreamViewType: "NEW_AND_OLD_IMAGES"
            }
        }
    ]
};

/**
 * Test the order stream processor locally
 */
async function testOrderStreamProcessor() {
    console.log('🧪 Testing Order Stream Processor locally...');
    console.log('=============================================');
    
    try {
        console.log('📊 Sample event:', JSON.stringify(sampleStreamEvent, null, 2));
        console.log('');
        
        console.log('🔄 Processing event...');
        const result = await handler(sampleStreamEvent);
        
        console.log('✅ Processing completed successfully!');
        console.log('📋 Result:', JSON.stringify(result, null, 2));
        
        console.log('');
        console.log('🎉 Test completed successfully!');
        console.log('');
        console.log('💡 Next Steps:');
        console.log('1. Deploy this function to AWS Lambda');
        console.log('2. Enable DynamoDB streams on WizzOrders_dev table');
        console.log('3. Create event source mapping');
        console.log('4. Test with real order status changes');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack trace:', error.stack);
        
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('1. Check if all dependencies are installed (npm install)');
        console.log('2. Verify AWS credentials are configured');
        console.log('3. Ensure DynamoDB tables exist');
        console.log('4. Check network connectivity');
    }
}

/**
 * Create deployment package
 */
async function createDeploymentPackage() {
    console.log('📦 Creating deployment package...');
    
    const fs = require('fs');
    const path = require('path');
    const archiver = require('archiver');
    
    try {
        const output = fs.createWriteStream('order-stream-processor-deployment.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
            console.log(`✅ Deployment package created: ${archive.pointer()} bytes`);
            console.log('📄 File: order-stream-processor-deployment.zip');
            console.log('');
            console.log('🚀 Manual deployment steps:');
            console.log('1. Upload this ZIP file to AWS Lambda');
            console.log('2. Set the handler to: src/handlers/order-stream-processor.handler');
            console.log('3. Configure environment variables');
            console.log('4. Set up DynamoDB stream trigger');
        });
        
        archive.on('error', (err) => {
            throw err;
        });
        
        archive.pipe(output);
        
        // Add the source files
        archive.directory('src/', 'src');
        archive.file('package.json', { name: 'package.json' });
        
        archive.finalize();
        
    } catch (error) {
        console.error('❌ Failed to create deployment package:', error);
    }
}

// Export for use as module
module.exports = {
    testOrderStreamProcessor,
    createDeploymentPackage,
    sampleStreamEvent
};

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--test')) {
        testOrderStreamProcessor();
    } else if (args.includes('--package')) {
        createDeploymentPackage();
    } else {
        console.log('🎯 Driver Assignment System - Manual Setup');
        console.log('==========================================');
        console.log('');
        console.log('Available commands:');
        console.log('  node manual-setup.js --test     Test the processor locally');
        console.log('  node manual-setup.js --package  Create deployment package');
        console.log('');
        console.log('💡 Run with --test to verify everything works locally first');
    }
}
