#!/usr/bin/env node
/**
 * WizzCentral Platform - Create Test Points Data
 * This script creates test data for the customer points system
 */

const { 
    awardPointsForOrder, 
    getCustomerPointsBalance,
    getPointsStatistics 
} = require('./backend/src/services/customer-points-service-fixed.js');

async function createTestPointsData() {
    console.log('🧪 Creating test points data...');
    
    try {
        // Test customers with different scenarios
        const testScenarios = [
            {
                customerId: 'CUST001',
                orderData: [
                    { orderId: 'ORDER001', amount: 25000 }, // 2500 points
                    { orderId: 'ORDER002', amount: 15000 }, // 1500 points
                ]
            },
            {
                customerId: 'CUST002', 
                orderData: [
                    { orderId: 'ORDER003', amount: 8000 }, // 800 points
                ]
            },
            {
                customerId: 'CUST003',
                orderData: [
                    { orderId: 'ORDER004', amount: 50000 }, // 5000 points (VIP threshold)
                    { orderId: 'ORDER005', amount: 30000 }, // 3000 points
                ]
            }
        ];

        // Award points for each scenario
        for (const scenario of testScenarios) {
            console.log(`\n👤 Processing customer: ${scenario.customerId}`);
            
            for (const order of scenario.orderData) {
                console.log(`  📦 Order ${order.orderId}: ${order.amount} IQD`);
                
                // Directly create points record without order validation for testing
                try {
                    // Calculate points
                    const pointsToAward = Math.floor(order.amount / 1000) * 100;
                    
                    // Get current balance
                    const currentBalance = await getCustomerPointsBalance(scenario.customerId);
                    
                    // Update points record manually for testing
                    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
                    const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
                    
                    const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
                    const dynamoDB = DynamoDBDocumentClient.from(ddbClient);
                    
                    // Update customer points
                    const updateParams = {
                        TableName: 'WizzUser_customer_points_dev',
                        Key: { customerId: scenario.customerId },
                        UpdateExpression: 'SET totalPoints = totalPoints + :points, lifetimePointsEarned = lifetimePointsEarned + :points, vipStatus = :vipStatus, tierLevel = :tierLevel, lastEarnedDate = :now, updatedAt = :now',
                        ExpressionAttributeValues: {
                            ':points': pointsToAward,
                            ':now': new Date().toISOString(),
                            ':vipStatus': (currentBalance.totalPoints + pointsToAward) >= 5000,
                            ':tierLevel': getTierLevel(currentBalance.totalPoints + pointsToAward)
                        }
                    };
                    
                    await dynamoDB.send(new UpdateCommand(updateParams));
                    
                    // Create transaction record
                    const transactionParams = {
                        TableName: 'WizzUser_points_transactions_dev',
                        Item: {
                            customerId: scenario.customerId,
                            transactionId: `${Date.now()}_${order.orderId}`,
                            transactionType: 'earned',
                            pointsAmount: pointsToAward,
                            orderId: order.orderId,
                            orderAmount: order.amount,
                            currency: 'IQD',
                            description: `Points earned from order ${order.orderId}`,
                            createdAt: new Date().toISOString()
                        }
                    };
                    
                    const { PutCommand } = require('@aws-sdk/lib-dynamodb');
                    await dynamoDB.send(new PutCommand(transactionParams));
                    
                    console.log(`    ✅ Awarded ${pointsToAward} points`);
                    
                } catch (error) {
                    console.error(`    ❌ Error awarding points for ${order.orderId}:`, error.message);
                }
            }
        }
        
        // Display final statistics
        console.log('\n📊 Final Points Statistics:');
        const stats = await getPointsStatistics();
        console.log(JSON.stringify(stats, null, 2));
        
        console.log('\n✅ Test data creation completed!');
        console.log('\n🎯 You can now test the customer points system with:');
        console.log('- Customer CUST001: Should have ~4000 points (Regular tier)');
        console.log('- Customer CUST002: Should have ~800 points (Regular tier)');
        console.log('- Customer CUST003: Should have ~8000 points (VIP/Gold tier)');
        
    } catch (error) {
        console.error('❌ Error creating test data:', error);
    }
}

function getTierLevel(totalPoints) {
    if (totalPoints >= 20000) return 'platinum';
    if (totalPoints >= 10000) return 'gold';  
    if (totalPoints >= 5000) return 'silver';
    return 'regular';
}

// Run the script
createTestPointsData();
