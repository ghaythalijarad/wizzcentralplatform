const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function updateDriverStatusFields() {
    try {
        console.log('Scanning for drivers in WhizzDrivers_dev table...');
        
        // First, scan all drivers
        const scanParams = {
            TableName: 'WhizzDrivers_dev'
        };
        
        const scanResult = await dynamodb.scan(scanParams).promise();
        console.log(`Found ${scanResult.Items.length} drivers to update`);
        
        // Update each driver with status fields
        for (const driver of scanResult.Items) {
            const updateParams = {
                TableName: 'WhizzDrivers_dev',
                Key: {
                    userId: driver.userId
                },
                UpdateExpression: 'SET driverStatus = :status, lastStatusUpdate = :timestamp',
                ExpressionAttributeValues: {
                    ':status': 'offline',
                    ':timestamp': new Date().toISOString()
                }
            };
            
            await dynamodb.update(updateParams).promise();
            console.log(`Updated driver ${driver.userId} with status fields`);
        }
        
        console.log('All drivers updated successfully!');
        
        // Verify the updates
        console.log('\nVerifying updates...');
        const verifyResult = await dynamodb.scan(scanParams).promise();
        
        verifyResult.Items.forEach(driver => {
            console.log(`Driver ${driver.userId}: driverStatus=${driver.driverStatus}, lastStatusUpdate=${driver.lastStatusUpdate}`);
        });
        
    } catch (error) {
        console.error('Error updating driver status fields:', error);
    }
}

updateDriverStatusFields();
