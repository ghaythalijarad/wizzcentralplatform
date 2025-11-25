#!/usr/bin/env node

/**
 * Manual Device Token Registration Script
 * Use this to manually add a device token to test push notifications
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

console.log('📱 Manual Device Token Registration\n');
console.log('This script will register a TEST device token for testing notifications.');
console.log('NOTE: In production, tokens should be registered by the app itself!\n');

async function registerTestToken() {
    try {
        // First, let's check if there are any merchants
        console.log('🔍 Checking for merchants in database...');
        const merchantScan = await dynamoDB.send(new ScanCommand({
            TableName: 'WhizzMerchants_Businesses',
            ProjectionExpression: 'businessId, businessName',
            Limit: 1
        }));

        if (!merchantScan.Items || merchantScan.Items.length === 0) {
            console.log('❌ No merchants found in database!');
            console.log('   Please ensure you have merchants in WhizzMerchants_Businesses table');
            process.exit(1);
        }

        const merchant = merchantScan.Items[0];
        console.log(`✅ Found merchant: ${merchant.businessName} (${merchant.businessId})\n`);

        // Generate a test token
        const testToken = 'TEST_TOKEN_' + Date.now() + '_' + Math.random().toString(36).substring(7);
        const deviceId = 'TEST_DEVICE_' + Math.random().toString(36).substring(7);
        const tokenId = `${merchant.businessId}_${deviceId}_${Date.now()}`;

        console.log('📝 Registering test device token:');
        console.log(`   Token ID: ${tokenId}`);
        console.log(`   Merchant ID: ${merchant.businessId}`);
        console.log(`   Device ID: ${deviceId}`);
        console.log(`   Platform: ios (test)`);
        console.log('');

        // Register the token
        await dynamoDB.send(new PutCommand({
            TableName: 'WhizzMerchants_DeviceTokens',
            Item: {
                tokenId: tokenId,
                merchantId: merchant.businessId,
                deviceToken: testToken,
                deviceId: deviceId,
                platform: 'ios',
                appVersion: '1.0.0',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }));

        console.log('✅ Test device token registered successfully!\n');
        console.log('⚠️  IMPORTANT NOTES:');
        console.log('   1. This is a TEST token and will NOT actually receive notifications');
        console.log('   2. Firebase Admin SDK will reject this token');
        console.log('   3. To test REAL notifications, you need:');
        console.log('      a) Open WhizzMerchants app in Xcode');
        console.log('      b) Run it on your physical iPhone');
        console.log('      c) Log in with merchant credentials');
        console.log('      d) The app will automatically register the REAL FCM token\n');

        console.log('🔍 To verify, check DynamoDB table WhizzMerchants_DeviceTokens');
        console.log('   or run: npm run check-tokens\n');

    } catch (error) {
        console.error('❌ Error registering test token:', error.message);
        process.exit(1);
    }
}

console.log('════════════════════════════════════════════════════════════════\n');
registerTestToken().then(() => {
    console.log('════════════════════════════════════════════════════════════════');
    process.exit(0);
});
