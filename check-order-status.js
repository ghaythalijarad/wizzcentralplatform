#!/usr/bin/env node
/**
 * Check Order Assignment Status
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const ORDER_ID = '7652780b-ce26-44c2-8825-c15b8c5d3308';

async function checkOrderStatus() {
    try {
        console.log('🔍 Checking order assignment status...');
        console.log(`📦 Order ID: ${ORDER_ID}`);
        
        const result = await docClient.send(new GetCommand({
            TableName: 'WizzOrders',
            Key: { orderId: ORDER_ID }
        }));
        
        if (result.Item) {
            console.log('\n📋 Order Details:');
            console.log(`   Status: ${result.Item.status}`);
            console.log(`   Restaurant: ${result.Item.businessName || 'N/A'}`);
            console.log(`   Total: ${result.Item.total || 0} IQD`);
            console.log(`   Driver: ${result.Item.driverId || 'No driver assigned'}`);
            
            if (result.Item.driverId) {
                console.log('\n🎉 SUCCESS: Order has been assigned to a driver!');
                console.log(`🚗 Driver ID: ${result.Item.driverId}`);
                console.log(`⏰ Assigned At: ${result.Item.assignedAt || 'N/A'}`);
                console.log(`🕐 Estimated Pickup: ${result.Item.estimatedPickupTime || 'N/A'}`);
            } else {
                console.log('\n⚠️ Order found but no driver assigned yet');
                console.log('   This could mean:');
                console.log('   • No drivers are currently online');
                console.log('   • Assignment process is still running');
                console.log('   • All drivers declined the order');
            }
        } else {
            console.log('❌ Order not found');
        }
        
    } catch (error) {
        console.error('❌ Error checking order:', error.message);
    }
}

checkOrderStatus()
    .then(() => {
        console.log('\n✅ Status check complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Status check failed:', error);
        process.exit(1);
    });
