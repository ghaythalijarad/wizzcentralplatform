#!/usr/bin/env node

console.log('🚀 Starting...');

// Test basic functionality first
console.log('📦 Loading AWS SDK...');

try {
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    console.log('✅ DynamoDB Client loaded');
    
    const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
    console.log('✅ Document Client loaded');
    
    console.log('🔧 Creating clients...');
    const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
    const dynamoDB = DynamoDBDocumentClient.from(dynamoClient);
    console.log('✅ Clients created');
    
    const driverId = `test-driver-${Date.now()}`;
    console.log(`🆔 Generated Driver ID: ${driverId}`);
    
    const testDriver = {
        driverId: driverId,
        name: 'Test Driver ONLINE',
        email: 'test@wizz.com',
        city: 'بغداد',
        registrationStatus: 'APPROVED',
        status: 'online',
        availabilityStatus: 'online', 
        driverStatus: 'online',
        activeOrders: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusChangedAt: new Date().toISOString(),
        lastStatusUpdate: new Date().toISOString(),
        location: {
            latitude: 33.3152,
            longitude: 44.3661
        },
        vehicleType: 'car',
        licenseNumber: 'TEST123',
        nationalId: '1234567890',
        version: 1
    };
    
    console.log('📝 Driver data prepared, inserting into table...');
    
    // Insert the driver
    dynamoDB.send(new PutCommand({
        TableName: 'WhizzDrivers_dev',
        Item: testDriver
    })).then(() => {
        console.log('✅ SUCCESS! Test driver created with ONLINE status!');
        console.log(`🆔 Driver ID: ${driverId}`);
        console.log('🟢 Status: online');
        console.log('🟢 Availability Status: online');
        console.log('🟢 Driver Status: online');
        console.log('\n🎯 This driver should now appear in your DynamoDB console!');
        console.log('🔄 Refresh the DynamoDB table view to see the new driver.');
        process.exit(0);
    }).catch(error => {
        console.error('❌ ERROR creating driver:', error.message);
        console.error('🔍 Full error:', error);
        process.exit(1);
    });
    
} catch (error) {
    console.error('❌ ERROR loading modules:', error.message);
    console.error('💡 Try: npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb');
    process.exit(1);
}
