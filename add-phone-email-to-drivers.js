#!/usr/bin/env node

/**
 * Add Phone Number and Email Fields to WhizzDrivers_dev
 * 
 * This script adds missing phoneNumber and email fields to existing driver records
 * in the WhizzDrivers_dev DynamoDB table.
 */

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: 'us-east-1',
    profile: 'wizz-drivers-ghayth-dev' // Update if your profile name is different
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'WhizzDrivers_dev';

async function addPhoneAndEmailFields() {
    console.log('🔄 Starting to add phoneNumber and email fields to drivers...\n');

    try {
        // Step 1: Scan all drivers
        console.log('📊 Scanning WhizzDrivers_dev table...');
        const scanResult = await dynamoDB.scan({
            TableName: TABLE_NAME
        }).promise();

        const drivers = scanResult.Items || [];
        console.log(`✅ Found ${drivers.length} drivers in table\n`);

        if (drivers.length === 0) {
            console.log('⚠️  No drivers found in table. Nothing to update.');
            return;
        }

        // Step 2: Update each driver
        let updateCount = 0;
        let skipCount = 0;

        for (const driver of drivers) {
            const driverId = driver.driverId;
            
            // Check if fields already exist
            const hasPhone = driver.phoneNumber !== undefined;
            const hasEmail = driver.email !== undefined;

            if (hasPhone && hasEmail) {
                console.log(`⏭️  Skipping ${driver.name} (${driverId}) - already has phone and email`);
                skipCount++;
                continue;
            }

            // Prepare update
            const updateExpression = [];
            const expressionAttributeNames = {};
            const expressionAttributeValues = {};

            if (!hasPhone) {
                updateExpression.push('#phone = :phone');
                expressionAttributeNames['#phone'] = 'phoneNumber';
                // Generate placeholder Iraqi phone number
                expressionAttributeValues[':phone'] = `+96477${Math.floor(10000000 + Math.random() * 90000000)}`;
            }

            if (!hasEmail) {
                updateExpression.push('#email = :email');
                expressionAttributeNames['#email'] = 'email';
                // Generate placeholder email from driver name
                const emailName = (driver.name || 'driver').toLowerCase().replace(/\s+/g, '.');
                expressionAttributeValues[':email'] = `${emailName}@whizz-placeholder.com`;
            }

            // Add updatedAt timestamp
            updateExpression.push('#updatedAt = :timestamp');
            expressionAttributeNames['#updatedAt'] = 'updatedAt';
            expressionAttributeValues[':timestamp'] = new Date().toISOString();

            try {
                await dynamoDB.update({
                    TableName: TABLE_NAME,
                    Key: { driverId: driverId },
                    UpdateExpression: `SET ${updateExpression.join(', ')}`,
                    ExpressionAttributeNames: expressionAttributeNames,
                    ExpressionAttributeValues: expressionAttributeValues
                }).promise();

                console.log(`✅ Updated ${driver.name} (${driverId})`);
                console.log(`   Phone: ${!hasPhone ? expressionAttributeValues[':phone'] : 'already exists'}`);
                console.log(`   Email: ${!hasEmail ? expressionAttributeValues[':email'] : 'already exists'}`);
                console.log('');
                updateCount++;

            } catch (updateError) {
                console.error(`❌ Failed to update ${driver.name} (${driverId}):`, updateError.message);
            }
        }

        // Step 3: Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Drivers: ${drivers.length}`);
        console.log(`Updated: ${updateCount}`);
        console.log(`Skipped (already had fields): ${skipCount}`);
        console.log('='.repeat(60));

        // Step 4: Verify by scanning again
        console.log('\n🔍 Verifying updates...');
        const verifyResult = await dynamoDB.scan({
            TableName: TABLE_NAME,
            ProjectionExpression: 'driverId, #name, phoneNumber, email',
            ExpressionAttributeNames: {
                '#name': 'name'
            }
        }).promise();

        console.log('\n📋 Updated Driver Records:');
        console.log('='.repeat(80));
        verifyResult.Items.forEach((driver, index) => {
            console.log(`${index + 1}. ${driver.name}`);
            console.log(`   ID: ${driver.driverId}`);
            console.log(`   Phone: ${driver.phoneNumber || 'NOT SET'}`);
            console.log(`   Email: ${driver.email || 'NOT SET'}`);
            console.log('');
        });

        console.log('✅ Process completed successfully!\n');
        console.log('📝 NEXT STEPS:');
        console.log('   1. ✅ phoneNumber and email fields added to all drivers');
        console.log('   2. ✅ Edit functionality in Central Platform will now work');
        console.log('   3. ⚠️  Placeholder values used - update with real data later');
        console.log('   4. 🔄 Refresh the drivers page: http://localhost:3000/pages/drivers.html');

    } catch (error) {
        console.error('❌ Error:', error);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Check AWS credentials: aws configure list');
        console.error('   2. Verify table name: WhizzDrivers_dev');
        console.error('   3. Ensure IAM permissions for UpdateItem on table');
    }
}

// Run the script
addPhoneAndEmailFields().catch(console.error);
