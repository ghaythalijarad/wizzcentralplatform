#!/usr/bin/env node
/**
 * Add Online/Offline Status Fields to Driver Records
 * This will add the availabilityStatus field that the Flutter app uses
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

// Initialize DynamoDB client
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

const DRIVERS_TABLE = 'WhizzDrivers_dev';

async function addOnlineStatusFields() {
    console.log('🔧 Adding Online/Offline Status Fields to Driver Records');
    console.log('=' .repeat(60));
    console.log('📅 Date:', new Date().toISOString());
    
    try {
        // First, scan all drivers to see current state
        console.log('\n1️⃣ Scanning current driver records...');
        
        const scanResult = await dynamoDB.send(new ScanCommand({
            TableName: DRIVERS_TABLE
        }));
        
        const drivers = scanResult.Items || [];
        console.log(`📊 Found ${drivers.length} drivers in WhizzDrivers_dev table`);
        
        if (drivers.length === 0) {
            console.log('⚠️ No drivers found in table');
            return;
        }
        
        // Show current driver data
        drivers.forEach((driver, index) => {
            console.log(`\n👤 Driver ${index + 1}: ${driver.name || 'Unknown'}`);
            console.log(`   ID: ${driver.driverId}`);
            console.log(`   Registration Status: ${driver.registrationStatus}`);
            console.log(`   Status: ${driver.status}`);
            console.log(`   Availability Status: ${driver.availabilityStatus || 'NOT SET'}`);
            console.log(`   Last Status Update: ${driver.lastStatusUpdate || 'NOT SET'}`);
        });
        
        console.log('\n2️⃣ Adding availabilityStatus and lastStatusUpdate fields...');
        
        // Update each driver with the new fields
        for (const driver of drivers) {
            const driverId = driver.driverId;
            
            console.log(`🔄 Updating driver: ${driver.name} (${driverId})`);
            
            try {
                await dynamoDB.send(new UpdateCommand({
                    TableName: DRIVERS_TABLE,
                    Key: { driverId: driverId },
                    UpdateExpression: 'SET availabilityStatus = :availabilityStatus, lastStatusUpdate = :lastStatusUpdate, driverStatus = :driverStatus',
                    ExpressionAttributeValues: {
                        ':availabilityStatus': 'offline', // Default to offline
                        ':lastStatusUpdate': new Date().toISOString(),
                        ':driverStatus': 'offline' // Also add this for compatibility
                    }
                }));
                
                console.log(`✅ Successfully updated ${driver.name}`);
                
            } catch (error) {
                console.error(`❌ Failed to update ${driver.name}:`, error.message);
            }
        }
        
        console.log('\n3️⃣ Verifying updates...');
        
        // Verify the updates
        const verifyResult = await dynamoDB.send(new ScanCommand({
            TableName: DRIVERS_TABLE
        }));
        
        console.log('\n📋 Updated Driver Records:');
        verifyResult.Items.forEach((driver, index) => {
            console.log(`\n✅ Driver ${index + 1}: ${driver.name}`);
            console.log(`   Registration Status: ${driver.registrationStatus} ✅`);
            console.log(`   Status: ${driver.status} ✅`);
            console.log(`   Availability Status: ${driver.availabilityStatus} 🆕`);
            console.log(`   Driver Status: ${driver.driverStatus} 🆕`);
            console.log(`   Last Status Update: ${driver.lastStatusUpdate} 🆕`);
        });
        
        console.log('\n🎉 SUCCESS: Online/Offline status fields added!');
        console.log('\n📱 Next Steps:');
        console.log('   1. Launch Flutter app');
        console.log('   2. Toggle driver status to "Online"');
        console.log('   3. This will set availabilityStatus = "online"');
        console.log('   4. Backend will now find the driver for assignments');
        
    } catch (error) {
        console.error('❌ Error adding status fields:', error);
        
        if (error.name === 'UnrecognizedClientException') {
            console.error('🔐 AWS credentials not configured. Run: aws sso login --profile wizz-drivers-ghayth-dev');
        } else if (error.name === 'ResourceNotFoundException') {
            console.error('📋 Table WhizzDrivers_dev not found');
        } else if (error.name === 'AccessDeniedException') {
            console.error('🚫 Access denied. Check DynamoDB permissions');
        }
    }
}

addOnlineStatusFields();
