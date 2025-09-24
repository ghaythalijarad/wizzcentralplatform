#!/usr/bin/env node
/**
 * WizzDriver Order Notification Integration Test
 * Tests the complete flow from DynamoDB order to Flutter app notification
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

console.log('🚀 WizzDriver Order Notification Integration Test');
console.log('=================================================');

async function createRealisticTestOrder() {
    try {
        const timestamp = Date.now();
        const orderId = `ORDER_${timestamp}`;

        // Create a realistic Iraqi order with proper structure for Flutter app
        const realisticOrder = {
            // Primary keys matching your existing pattern
            PK: `ORDER#${orderId}`,
            SK: 'META',
            
            // Core order information
            orderId: orderId,
            customerEmail: 'ahmed.driver.test@wizz.iq',
            customerName: 'أحمد محمد الراشد',
            customerPhone: '+964 771 123 4567',
            
            // Location details (Baghdad - active region)
            customerLocation: {
                governorate: 'baghdad',
                district: 'al_karkh',
                area: 'الكرادة',
                address: 'شارع الكرادة الداخل، بناية رقم 15، الطابق الثاني',
                coordinates: {
                    lat: 33.3085,
                    lng: 44.3937
                }
            },
            
            // Restaurant information  
            restaurantName: 'مطعم أبو نواس للمشاوي',
            restaurantId: 'REST_001',
            restaurantLocation: {
                governorate: 'baghdad',
                district: 'al_karkh',
                area: 'المنصور', 
                address: 'حي المنصور، شارع الأميرات',
                coordinates: {
                    lat: 33.3354,
                    lng: 44.3412
                }
            },
            
            // Order items in the format expected by Flutter
            items: [
                {
                    id: 'item_001',
                    name: 'مشاوي مشكلة',
                    nameEn: 'Mixed Grill',
                    price: 25000,
                    quantity: 1,
                    description: 'كباب، تكة لحم، دجاج مشوي'
                },
                {
                    id: 'item_002', 
                    name: 'سلطة فتوش',
                    nameEn: 'Fattoush Salad',
                    price: 8000,
                    quantity: 1,
                    description: 'سلطة مع خبز محمص'
                },
                {
                    id: 'item_003',
                    name: 'عرق سوس',
                    nameEn: 'Arak Sous', 
                    price: 3000,
                    quantity: 2,
                    description: 'مشروب تقليدي عراقي'
                }
            ],
            
            // Pricing breakdown
            itemsTotal: 39000,
            deliveryFee: 2500,
            serviceFee: 1500,
            totalAmount: 43000,
            currency: 'IQD',
            
            // Order status and timing
            status: 'NOT_ASSIGNED', // This triggers the notification system
            assignedAt: null,
            assignedDriverId: null,
            createdAt: new Date().toISOString(),
            createdBy: 'customer',
            channel: 'mobile_app',
            
            // Delivery information
            estimatedDistance: 3.2, // km between restaurant and customer
            estimatedDeliveryTime: 35, // minutes
            estimatedPickupTime: new Date(Date.now() + 15 * 60000).toISOString(), // 15 min
            paymentMethod: 'CASH_ON_DELIVERY',
            
            // Driver instructions
            specialInstructions: 'يرجى الاتصال عند الوصول للبناية',
            deliveryNotes: 'البناية بجانب صيدلية النهرين',
            
            // Regional configuration for Baghdad
            regionalConfig: {
                governorate: 'baghdad',
                commissionRate: 0.15,
                baseDeliveryFee: 2500,
                serviceArea: 'active',
                minimumEarning: 3750 // 15% of 25000
            },
            
            // Driver targeting criteria
            driverRequirements: {
                governorate: 'baghdad',
                maxDistanceFromRestaurant: 5.0,
                acceptLanguages: ['ar', 'en'],
                vehicleTypes: ['motorcycle', 'car'],
                experienceLevel: 'any'
            },
            
            // Notification metadata for Flutter app
            notificationConfig: {
                priority: 'high',
                soundEnabled: true,
                vibrationEnabled: true,
                displayDuration: 30, // seconds
                autoAcceptTimeout: 30000, // milliseconds
                batchable: true
            }
        };

        console.log('📝 Creating realistic test order...');
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Customer: ${realisticOrder.customerName}`);
        console.log(`   Restaurant: ${realisticOrder.restaurantName}`);
        console.log(`   Location: ${realisticOrder.customerLocation.area}, Baghdad`);
        console.log(`   Total: ${realisticOrder.totalAmount.toLocaleString()} IQD`);
        console.log(`   Distance: ${realisticOrder.estimatedDistance} km`);
        console.log(`   Expected Earning: ${realisticOrder.regionalConfig.minimumEarning.toLocaleString()} IQD`);
        console.log('');

        // Insert the order into DynamoDB
        const putCommand = new PutCommand({
            TableName: 'WizzOrders_dev',
            Item: realisticOrder
        });

        await docClient.send(putCommand);

        console.log('✅ SUCCESS: Realistic test order created!');
        console.log('=================================================');
        console.log('📱 FLUTTER APP TESTING INSTRUCTIONS:');
        console.log('');
        console.log('1. 📍 LOCATION SETUP:');
        console.log('   • Ensure your test device/emulator is set to Baghdad coordinates');
        console.log('   • Lat: 33.3152, Lng: 44.3661 (Baghdad center)'); 
        console.log('   • Or use mock location in your Flutter app');
        console.log('');
        console.log('2. 🚗 DRIVER STATUS:');
        console.log('   • Open your WizzDriver Flutter app');
        console.log('   • Set driver status to ONLINE');
        console.log('   • Ensure location permissions are granted');
        console.log('');
        console.log('3. 🔔 NOTIFICATION TESTING:');
        console.log('   • The OrderNotificationService generates orders every 60 seconds');
        console.log('   • Your new order should appear in the next notification cycle');
        console.log('   • Look for CompactOrderNotificationDialog to appear');
        console.log('');
        console.log('4. 🧪 EXPECTED BEHAVIOR:');
        console.log('   • Notification shows 30-second countdown timer');
        console.log('   • Displays restaurant name, earning amount, distance');
        console.log('   • Shows Accept/Reject buttons');
        console.log('   • Haptic feedback on timer ticks');
        console.log('');
        console.log('5. 📊 TESTING SCENARIOS:');
        console.log('   a) ACCEPT ORDER:');
        console.log('      → Order status changes to "accepted"');
        console.log('      → Driver sees order details in OrdersTab'); 
        console.log('      → Can progress through status stages');
        console.log('');
        console.log('   b) REJECT ORDER:');
        console.log('      → Order remains NOT_ASSIGNED');
        console.log('      → May appear again in future notifications');
        console.log('');
        console.log('6. 🔍 DEBUGGING:');
        console.log('   • Check Flutter debug console for OrderNotificationService logs');
        console.log('   • Look for "🆕 New batched order generated" messages');
        console.log('   • Verify WebSocket connections are active');
        console.log('');
        console.log('=================================================');
        
        return realisticOrder;

    } catch (error) {
        console.error('❌ FAILED: Error creating realistic test order:', error);
        throw error;
    }
}

async function testOrderQuery() {
    try {
        console.log('🔍 Testing order query (simulating Flutter app behavior)...');
        
        // Query orders that match Flutter app criteria
        const scanCommand = new ScanCommand({
            TableName: 'WizzOrders_dev',
            FilterExpression: '#status = :status AND #governorate = :governorate',
            ExpressionAttributeNames: {
                '#status': 'status',
                '#governorate': 'regionalConfig.governorate'
            },
            ExpressionAttributeValues: {
                ':status': 'NOT_ASSIGNED',
                ':governorate': 'baghdad'
            },
            Limit: 10
        });

        const result = await docClient.send(scanCommand);
        
        console.log(`📋 Found ${result.Items.length} available orders for Baghdad drivers:`);
        result.Items.forEach(order => {
            console.log(`   • ${order.orderId} - ${order.totalAmount} IQD - ${order.customerLocation?.area || 'Unknown area'}`);
        });
        console.log('');
        
    } catch (error) {
        console.error('❌ Query test failed:', error.message);
    }
}

async function simulateDriverAssignment(orderId) {
    try {
        console.log(`🚗 Simulating driver assignment for ${orderId}...`);
        
        const updateCommand = new UpdateCommand({
            TableName: 'WizzOrders_dev',
            Key: {
                PK: `ORDER#${orderId}`,
                SK: 'META'
            },
            UpdateExpression: 'SET #status = :status, assignedAt = :assignedAt, assignedDriverId = :driverId',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'accepted',
                ':assignedAt': new Date().toISOString(),
                ':driverId': 'TEST_DRIVER_001'
            }
        });

        await docClient.send(updateCommand);
        console.log('✅ Order assigned to test driver');
        
    } catch (error) {
        console.error('❌ Assignment simulation failed:', error.message);
    }
}

// Main execution
async function runIntegrationTest() {
    try {
        console.log('Starting WizzDriver Integration Test...');
        console.log('');
        
        // Create realistic test order
        const order = await createRealisticTestOrder();
        
        // Test order querying
        await testOrderQuery();
        
        console.log('🎯 INTEGRATION TEST COMPLETE!');
        console.log('');
        console.log('📋 Next Steps:');
        console.log('1. Run your Flutter app and test the notification');
        console.log('2. Monitor the Flutter debug logs');  
        console.log('3. Test order acceptance/rejection flow');
        console.log('4. Verify regional targeting works correctly');
        console.log('');
        console.log('🔧 To simulate driver assignment (optional):');
        console.log(`node -e "require('./wizzdriver-integration-test.js').simulateDriverAssignment('${order.orderId}')"`);
        
        return order;
        
    } catch (error) {
        console.error('💥 Integration test failed:', error);
        process.exit(1);
    }
}

// Export for module usage
module.exports = { createRealisticTestOrder, testOrderQuery, simulateDriverAssignment };

// Run if called directly
if (require.main === module) {
    runIntegrationTest()
        .then(() => {
            console.log('🏁 Integration test completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Integration test failed:', error);
            process.exit(1);
        });
}
