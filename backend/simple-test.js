/**
 * Simple test for the order stream processor
 */

async function runTest() {
    console.log('🧪 Testing Order Stream Processor...');
    
    try {
        // Import the handler
        const { handler } = require('./src/handlers/order-stream-processor');
        
        // Create a simple test event
        const testEvent = {
            Records: [
                {
                    eventID: "test-001",
                    eventName: "MODIFY",
                    dynamodb: {
                        NewImage: {
                            PK: { S: "ORDER#test123" },
                            SK: { S: "ORDER#test123" },
                            status: { S: "ready_for_pickup" },
                            customerId: { S: "test-customer" },
                            restaurantId: { S: "test-restaurant" }
                        },
                        OldImage: {
                            PK: { S: "ORDER#test123" },
                            SK: { S: "ORDER#test123" },
                            status: { S: "preparing" },
                            customerId: { S: "test-customer" },
                            restaurantId: { S: "test-restaurant" }
                        }
                    }
                }
            ]
        };
        
        console.log('📊 Processing test event...');
        const result = await handler(testEvent);
        
        console.log('✅ Test completed successfully!');
        console.log('📋 Result:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
runTest();
