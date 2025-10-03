#!/usr/bin/env node

console.log('🚗 Creating Test Driver with Online Status...\n');

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// AWS Configuration
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const dynamoDB = DynamoDBDocumentClient.from(dynamoClient);

// Test driver with unique ID
const driverId = `test-driver-online-${Date.now()}`;

const TEST_DRIVER = {
    driverId: driverId,
    name: 'Test Driver Online',
    email: 'test.driver.online@wizz.com',
    city: 'بغداد',
    licenseNumber: 'TEST123456',
    nationalId: '1234567890123',
    vehicleType: 'car',
    
    // IMPORTANT: All three status fields set to 'online'
    registrationStatus: 'APPROVED',
    status: 'online',                    // Original field
    availabilityStatus: 'online',        // Flutter app field  
    driverStatus: 'online',              // Additional compatibility
    
    // Status metadata
    statusChangedAt: new Date().toISOString(),
    lastStatusUpdate: new Date().toISOString(),
    statusReason: 'Test driver created online',
    
    // Assignment fields
    activeOrders: 0,
    maxActiveOrders: 3,
    
    // Location (Baghdad)
    location: {
        latitude: 33.3152,
        longitude: 44.3661,
        lastLocationUpdate: new Date().toISOString()
    },
    
    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    
    // Mock documents
    drivingLicense: {
        s3Key: 'test-driver/driving-license.jpg',
        size: 100000,
        name: 'driving-license.jpg',
        uploadedAt: new Date().toISOString()
    },
    vehicleRegistration: {
        s3Key: 'test-driver/vehicle-registration.jpg',
        size: 100000,
        name: 'vehicle-registration.jpg',
        uploadedAt: new Date().toISOString()
    },
    nonCriminalRecord: {
        s3Key: 'test-driver/non-criminal-record.jpg',
        size: 100000,
        name: 'non-criminal-record.jpg',
        uploadedAt: new Date().toISOString()
    }
};

async function createTestDriver() {
    try {
        console.log('📝 Creating test driver...');
        console.log(`🆔 Driver ID: ${driverId}`);
        
        // Create the driver
        await dynamoDB.send(new PutCommand({
            TableName: 'WhizzDrivers_dev',
            Item: TEST_DRIVER
        }));
        
        console.log('✅ Test driver created successfully!');
        
        // List all drivers to verify
        console.log('\n📋 All drivers in table:');
        const result = await dynamoDB.send(new ScanCommand({
            TableName: 'WhizzDrivers_dev',
            ProjectionExpression: 'driverId, #name, registrationStatus, #status, availabilityStatus, driverStatus, activeOrders',
            ExpressionAttributeNames: {
                '#name': 'name',
                '#status': 'status'
            }
        }));
        
        if (result.Items) {
            result.Items.forEach((driver, index) => {
                console.log(`\n${index + 1}. ${driver.name || 'Unknown'}`);
                console.log(`   ID: ${driver.driverId}`);
                console.log(`   Registration: ${driver.registrationStatus}`);
                console.log(`   Status: ${driver.status || 'not set'}`);
                console.log(`   Availability: ${driver.availabilityStatus || 'not set'}`);
                console.log(`   Driver Status: ${driver.driverStatus || 'not set'}`);
                console.log(`   Active Orders: ${driver.activeOrders || 0}`);
                
                // Check availability
                const isRegistered = driver.registrationStatus === 'APPROVED' || driver.status === 'APPROVED';
                const isOnline = driver.availabilityStatus === 'online' || driver.status === 'online';
                const hasSpace = (driver.activeOrders || 0) < 3;
                const available = isRegistered && isOnline && hasSpace;
                
                console.log(`   🎯 Available: ${available ? '✅ YES' : '❌ NO'}`);
            });
            
            const onlineCount = result.Items.filter(d => 
                d.availabilityStatus === 'online' || d.status === 'online'
            ).length;
            
            console.log(`\n📊 Summary: ${result.Items.length} total drivers, ${onlineCount} online`);
        }
        
        console.log('\n🎉 COMPLETE! Check the DynamoDB console to see your new test driver.');
        console.log('🔍 Look for the driver with status="online" and availabilityStatus="online"');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.name === 'AccessDeniedException') {
            console.error('💡 Check AWS permissions for DynamoDB');
        }
    }
}

// Run it
createTestDriver();
