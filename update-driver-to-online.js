#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// AWS Configuration
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const dynamoDB = DynamoDBDocumentClient.from(dynamoClient);

async function updateDriverToOnline() {
    console.log('🔄 Updating Existing Driver to Online Status...\n');
    
    try {
        // First, scan to get the existing drivers
        console.log('1️⃣ Getting existing drivers...');
        const scanResult = await dynamoDB.send(new ScanCommand({
            TableName: 'WhizzDrivers_dev',
            ProjectionExpression: 'driverId, #name, email, registrationStatus, #status',
            ExpressionAttributeNames: {
                '#name': 'name',
                '#status': 'status'
            }
        }));
        
        if (!scanResult.Items || scanResult.Items.length === 0) {
            console.log('❌ No drivers found in table');
            return;
        }
        
        console.log(`✅ Found ${scanResult.Items.length} drivers:`);
        scanResult.Items.forEach((driver, index) => {
            console.log(`   ${index + 1}. ${driver.name || 'Unknown'} (${driver.driverId})`);
            console.log(`      Status: ${driver.status || 'not set'}`);
            console.log(`      Registration: ${driver.registrationStatus}`);
        });
        
        // Take the first driver and update it to online
        const driverToUpdate = scanResult.Items[0];
        console.log(`\n2️⃣ Updating driver: ${driverToUpdate.name} (${driverToUpdate.driverId})`);
        
        // Update the driver with all the new status fields
        const updateResult = await dynamoDB.send(new UpdateCommand({
            TableName: 'WhizzDrivers_dev',
            Key: { driverId: driverToUpdate.driverId },
            UpdateExpression: `
                SET #status = :status,
                    availabilityStatus = :status,
                    driverStatus = :status,
                    statusChangedAt = :timestamp,
                    lastStatusUpdate = :timestamp,
                    statusReason = :reason,
                    activeOrders = :activeOrders,
                    updatedAt = :updatedAt
            `,
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'online',
                ':timestamp': new Date().toISOString(),
                ':reason': 'Updated to online for testing',
                ':activeOrders': 0,
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        }));
        
        console.log('✅ Driver updated successfully!');
        
        // Show the updated driver details
        const updatedDriver = updateResult.Attributes;
        console.log('\n📊 Updated Driver Details:');
        console.log('=' .repeat(50));
        console.log(`🆔 Driver ID: ${updatedDriver.driverId}`);
        console.log(`👤 Name: ${updatedDriver.name}`);
        console.log(`📧 Email: ${updatedDriver.email}`);
        console.log(`🏙️  City: ${updatedDriver.city || 'Not set'}`);
        console.log(`📋 Registration: ${updatedDriver.registrationStatus}`);
        console.log(`🟢 Status: ${updatedDriver.status}`);
        console.log(`🟢 Availability Status: ${updatedDriver.availabilityStatus}`);
        console.log(`🟢 Driver Status: ${updatedDriver.driverStatus}`);
        console.log(`📅 Status Changed: ${updatedDriver.statusChangedAt}`);
        console.log(`📦 Active Orders: ${updatedDriver.activeOrders}`);
        
        // Test if this driver would be available for assignment
        console.log('\n🎯 Assignment System Check:');
        const isRegistered = updatedDriver.registrationStatus === 'APPROVED' || updatedDriver.status === 'APPROVED';
        const isOnline = updatedDriver.availabilityStatus === 'online' || updatedDriver.status === 'online';
        const hasCapacity = (updatedDriver.activeOrders || 0) < 3;
        const isAvailable = isRegistered && isOnline && hasCapacity;
        
        console.log(`✅ Registered/Approved: ${isRegistered}`);
        console.log(`✅ Online: ${isOnline}`);
        console.log(`✅ Has Capacity: ${hasCapacity} (${updatedDriver.activeOrders || 0}/3 orders)`);
        console.log(`🎉 Available for Assignment: ${isAvailable ? 'YES' : 'NO'}`);
        
        if (isAvailable) {
            console.log('\n🚀 SUCCESS! This driver will now be found by the assignment system!');
        } else {
            console.log('\n⚠️  Driver may not be available. Check the conditions above.');
        }
        
    } catch (error) {
        console.error('❌ Error updating driver:', error.message);
        
        if (error.name === 'ValidationException') {
            console.error('💡 Check if the table schema allows these fields');
        } else if (error.name === 'AccessDeniedException') {
            console.error('💡 Check DynamoDB permissions');
        } else if (error.name === 'ResourceNotFoundException') {
            console.error('💡 Check if WhizzDrivers_dev table exists');
        }
    }
}

async function listAllDriversWithStatus() {
    console.log('\n📋 All Drivers After Update:');
    console.log('=' .repeat(50));
    
    try {
        const result = await dynamoDB.send(new ScanCommand({
            TableName: 'WhizzDrivers_dev',
            ProjectionExpression: 'driverId, #name, email, registrationStatus, #status, availabilityStatus, driverStatus, activeOrders, statusChangedAt',
            ExpressionAttributeNames: {
                '#name': 'name',
                '#status': 'status'
            }
        }));
        
        if (result.Items && result.Items.length > 0) {
            result.Items.forEach((driver, index) => {
                console.log(`\n${index + 1}. ${driver.name || 'Unknown'}`);
                console.log(`   ID: ${driver.driverId}`);
                console.log(`   Email: ${driver.email}`);
                console.log(`   Registration: ${driver.registrationStatus}`);
                console.log(`   Status: ${driver.status || 'not set'}`);
                console.log(`   Availability: ${driver.availabilityStatus || 'not set'}`);
                console.log(`   Driver Status: ${driver.driverStatus || 'not set'}`);
                console.log(`   Active Orders: ${driver.activeOrders || 0}`);
                console.log(`   Status Changed: ${driver.statusChangedAt || 'not set'}`);
                
                // Check availability for assignment
                const isAvailable = (
                    (driver.registrationStatus === 'APPROVED' || driver.status === 'APPROVED') &&
                    (driver.availabilityStatus === 'online' || driver.status === 'online') &&
                    (driver.activeOrders || 0) < 3
                );
                console.log(`   🎯 Available for Assignment: ${isAvailable ? '✅ YES' : '❌ NO'}`);
            });
            
            // Summary
            const totalDrivers = result.Items.length;
            const onlineDrivers = result.Items.filter(d => 
                d.availabilityStatus === 'online' || d.status === 'online'
            ).length;
            const availableDrivers = result.Items.filter(d => {
                return (d.registrationStatus === 'APPROVED' || d.status === 'APPROVED') &&
                       (d.availabilityStatus === 'online' || d.status === 'online') &&
                       (d.activeOrders || 0) < 3;
            }).length;
            
            console.log(`\n📊 Summary:`);
            console.log(`   Total Drivers: ${totalDrivers}`);
            console.log(`   Online Drivers: ${onlineDrivers}`);
            console.log(`   Available for Assignment: ${availableDrivers}`);
            
        } else {
            console.log('No drivers found');
        }
        
    } catch (error) {
        console.error('Error listing drivers:', error.message);
    }
}

// Main execution
async function main() {
    try {
        await updateDriverToOnline();
        await listAllDriversWithStatus();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 DRIVER STATUS UPDATE COMPLETE!');
        console.log('='.repeat(60));
        console.log('\n📋 What happened:');
        console.log('✅ Updated existing driver to online status');
        console.log('✅ Added all required status fields (status, availabilityStatus, driverStatus)');
        console.log('✅ Set activeOrders to 0');
        console.log('✅ Added status timestamps');
        
        console.log('\n🔄 Next Steps:');
        console.log('1. ✅ Refresh your DynamoDB console to see the changes');
        console.log('2. ✅ You should see online status in multiple columns');
        console.log('3. ✅ Test the assignment system with this online driver');
        console.log('4. ✅ Create a test order to verify assignment works');
        
        console.log('\n🧪 Test Commands:');
        console.log('node test-backend-driver-status.js  # Test backend logic');
        console.log('node test-order-assignment.js       # Test order assignment');
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
        process.exit(1);
    }
}

// Export for other scripts
module.exports = {
    updateDriverToOnline,
    listAllDriversWithStatus
};

// Run if called directly
if (require.main === module) {
    main();
}
