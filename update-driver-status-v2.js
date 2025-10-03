const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

// Initialize DynamoDB client
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

async function updateDriverStatusFields() {
    try {
        console.log('🔍 Scanning for drivers in WhizzDrivers_dev table...');
        
        // First, scan all drivers
        const scanResult = await dynamoDB.send(new ScanCommand({
            TableName: 'WhizzDrivers_dev'
        }));
        
        console.log(`📊 Found ${scanResult.Items.length} drivers to update`);
        
        if (scanResult.Items.length === 0) {
            console.log('⚠️ No drivers found in the table');
            return;
        }
        
        // Update each driver with status fields
        for (const driver of scanResult.Items) {
            console.log(`🔄 Updating driver: ${driver.userId || driver.driverId || driver.id}`);
            
            // Try different key patterns as the table structure may vary
            let updateParams = {
                TableName: 'WhizzDrivers_dev',
                UpdateExpression: 'SET driverStatus = :status, lastStatusUpdate = :timestamp',
                ExpressionAttributeValues: {
                    ':status': 'offline',
                    ':timestamp': new Date().toISOString()
                }
            };
            
            // Try userId first (seems to be the primary key based on the search results)
            if (driver.userId) {
                updateParams.Key = { userId: driver.userId };
            } else if (driver.driverId) {
                updateParams.Key = { driverId: driver.driverId };
            } else if (driver.id) {
                updateParams.Key = { id: driver.id };
            } else {
                console.log('⚠️ Could not determine key for driver:', Object.keys(driver));
                continue;
            }
            
            try {
                await dynamoDB.send(new UpdateCommand(updateParams));
                console.log(`✅ Updated driver ${updateParams.Key[Object.keys(updateParams.Key)[0]]} with status fields`);
            } catch (error) {
                console.error(`❌ Failed to update driver:`, error.message);
            }
        }
        
        console.log('\n🎉 Driver status field updates completed!');
        
        // Verify the updates
        console.log('\n🔍 Verifying updates...');
        const verifyResult = await dynamoDB.send(new ScanCommand({
            TableName: 'WhizzDrivers_dev'
        }));
        
        let updatedCount = 0;
        verifyResult.Items.forEach(driver => {
            const id = driver.userId || driver.driverId || driver.id;
            if (driver.driverStatus && driver.lastStatusUpdate) {
                console.log(`✅ Driver ${id}: driverStatus=${driver.driverStatus}, lastStatusUpdate=${driver.lastStatusUpdate}`);
                updatedCount++;
            } else {
                console.log(`❌ Driver ${id}: Missing status fields`);
            }
        });
        
        console.log(`\n📊 Summary: ${updatedCount}/${verifyResult.Items.length} drivers have proper status fields`);
        
    } catch (error) {
        console.error('❌ Error updating driver status fields:', error);
        
        if (error.name === 'UnrecognizedClientException') {
            console.error('🔐 AWS credentials issue. Please ensure AWS CLI is configured.');
        } else if (error.name === 'ResourceNotFoundException') {
            console.error('📋 Table WhizzDrivers_dev not found. Please check table name.');
        }
    }
}

updateDriverStatusFields();
