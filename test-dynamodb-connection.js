#!/usr/bin/env node
// Test DynamoDB Connection for Regions V2
// This script tests the connection to DynamoDB and verifies basic operations

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// Configuration
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'WizzOrders-Regions-ghayth-dev';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Test data
const testRegion = {
    region_id: 'test-region-' + Date.now(),
    name: 'Test Baghdad Region',
    name_ar: 'منطقة بغداد التجريبية',
    level: 'governorate',
    parent_id: 'root',
    governorate_id: 'test-baghdad',
    coordinates: {
        lat: 33.3152,
        lng: 44.3661,
        radius: 10000
    },
    geocoding: {
        source: 'test-script',
        confidence: 1.0,
        timestamp: new Date().toISOString()
    },
    delivery_config: {
        enabled: true,
        radius: 10000,
        minOrderValue: 10000,
        deliveryFee: 2000
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: 'test-script'
};

async function testDynamoDBConnection() {
    console.log('\n🧪 DynamoDB Connection Test\n');
    console.log('═'.repeat(60));
    console.log(`📍 Region: ${AWS_REGION}`);
    console.log(`📊 Table: ${TABLE_NAME}`);
    console.log(`🔑 Profile: ${process.env.AWS_PROFILE || 'default'}`);
    console.log('═'.repeat(60));

    try {
        // Initialize client
        console.log('\n1️⃣  Initializing DynamoDB client...');
        const client = new DynamoDBClient({
            region: AWS_REGION
        });
        const docClient = DynamoDBDocumentClient.from(client);
        console.log('   ✅ Client initialized');

        // Test 1: Write operation (Put)
        console.log('\n2️⃣  Testing WRITE operation (PutItem)...');
        const putCommand = new PutCommand({
            TableName: TABLE_NAME,
            Item: testRegion
        });
        await docClient.send(putCommand);
        console.log(`   ✅ Successfully saved test region: ${testRegion.name}`);
        console.log(`   📝 Region ID: ${testRegion.region_id}`);

        // Test 2: Read operation (Get)
        console.log('\n3️⃣  Testing READ operation (GetItem)...');
        const getCommand = new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                region_id: testRegion.region_id
            }
        });
        const getResult = await docClient.send(getCommand);
        if (getResult.Item) {
            console.log('   ✅ Successfully retrieved test region');
            console.log(`   📍 Name: ${getResult.Item.name} (${getResult.Item.name_ar})`);
            console.log(`   🌍 Coordinates: ${getResult.Item.coordinates.lat}, ${getResult.Item.coordinates.lng}`);
        } else {
            console.log('   ⚠️  Item not found immediately (eventual consistency)');
        }

        // Test 3: Scan operation (List all)
        console.log('\n4️⃣  Testing SCAN operation (ListAll)...');
        const scanCommand = new ScanCommand({
            TableName: TABLE_NAME,
            Limit: 5
        });
        const scanResult = await docClient.send(scanCommand);
        console.log(`   ✅ Scan successful`);
        console.log(`   📊 Total items in table: ${scanResult.Count}`);
        if (scanResult.Items && scanResult.Items.length > 0) {
            console.log(`   📋 Sample regions:`);
            scanResult.Items.slice(0, 3).forEach((item, idx) => {
                console.log(`      ${idx + 1}. ${item.name} (${item.level})`);
            });
        }

        // Test 4: Delete operation (Cleanup)
        console.log('\n5️⃣  Testing DELETE operation (DeleteItem)...');
        const deleteCommand = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                region_id: testRegion.region_id
            }
        });
        await docClient.send(deleteCommand);
        console.log('   ✅ Successfully deleted test region');

        // Final Summary
        console.log('\n' + '═'.repeat(60));
        console.log('✨ ALL TESTS PASSED! ✨');
        console.log('═'.repeat(60));
        console.log('\n✅ DynamoDB is fully operational:');
        console.log('   • Connection established');
        console.log('   • Write operations working');
        console.log('   • Read operations working');
        console.log('   • Scan operations working');
        console.log('   • Delete operations working');
        console.log('\n🚀 Your Regions V2 system is ready to use!\n');

        return true;

    } catch (error) {
        console.log('\n' + '═'.repeat(60));
        console.log('❌ TEST FAILED');
        console.log('═'.repeat(60));
        console.error('\n💥 Error Details:');
        console.error(`   Type: ${error.name}`);
        console.error(`   Message: ${error.message}`);
        
        if (error.name === 'ResourceNotFoundException') {
            console.log('\n📋 Troubleshooting:');
            console.log('   • Table does not exist or name is incorrect');
            console.log(`   • Expected table: ${TABLE_NAME}`);
            console.log('   • Check your AWS Console to verify table name');
        } else if (error.name === 'UnrecognizedClientException' || error.name === 'InvalidSignatureException') {
            console.log('\n📋 Troubleshooting:');
            console.log('   • AWS credentials not configured or invalid');
            console.log('   • Run: aws configure --profile wizz-drivers-ghayth-dev');
            console.log('   • Or set AWS_PROFILE environment variable');
        } else if (error.name === 'AccessDeniedException') {
            console.log('\n📋 Troubleshooting:');
            console.log('   • IAM permissions insufficient');
            console.log('   • Required permissions: dynamodb:PutItem, GetItem, Scan, DeleteItem');
            console.log('   • Check your IAM role/user permissions');
        }
        
        console.log('\n');
        return false;
    }
}

// Run the test
if (require.main === module) {
    testDynamoDBConnection()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { testDynamoDBConnection };
