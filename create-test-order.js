#!/usr/bin/env node
/**
 * Create Test Order Script for WizzDriver Notification Testing
 * Creates a realistic order in the WizzOrders_dev table using Iraqi regions
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({
    region: 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = 'WizzOrders_dev';

console.log('🚀 Creating Test Order for WizzDriver Notifications');
console.log('=================================================');
console.log(`📊 Target Table: ${ORDERS_TABLE}`);
console.log('=================================================');

async function createTestOrder() {
    try {
        // Generate unique order ID
        const timestamp = Date.now();
        const orderId = `ORDER_${timestamp}`;

        // Create realistic Iraqi order data
        const testOrder = {
            // Primary key structure based on your existing pattern
            PK: `ORDER#${orderId}`,
            SK: 'META',
            
            // Order details
            orderId: orderId,
            customerEmail: 'ahmed.customer@wizz.iq',
            customerName: 'أحمد محمد الراشد',
            customerPhone: '+964 771 123 4567',
            
            // Location in Baghdad (active region)
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
            
            // Restaurant details
            restaurantName: 'مطعم أبو نواس للمشاوي',
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
            
            // Order items
            items: [
                {
                    name: 'مشاوي مشكلة',
                    nameEn: 'Mixed Grill',
                    price: 25000,
                    quantity: 1,
                    description: 'كباب، تكة لحم، دجاج مشوي'
                },
                {
                    name: 'سلطة فتوش',
                    nameEn: 'Fattoush Salad',
                    price: 8000,
                    quantity: 1,
                    description: 'سلطة مع خبز محمص'
                },
                {
                    name: 'عرق سوس',
                    nameEn: 'Arak Sous',
                    price: 3000,
                    quantity: 2,
                    description: 'مشروب تقليدي عراقي'
                }
            ],
            
            // Order totals (in Iraqi Dinar)
            itemsTotal: 39000,
            deliveryFee: 2500,
            serviceFee: 1500,
            totalAmount: 43000,
            currency: 'IQD',
            
            // Order status and assignment
            status: 'NOT_ASSIGNED',
            assignedAt: null,
            createdAt: new Date().toISOString(),
            createdBy: 'customer',
            channel: 'mobile_app',
            
            // Delivery details
            estimatedDistance: 3.2, // km
            estimatedDeliveryTime: 35, // minutes
            paymentMethod: 'CASH_ON_DELIVERY',
            
            // Special instructions
            specialInstructions: 'يرجى الاتصال عند الوصول للبناية',
            
            // Regional pricing (Baghdad rates)
            regionalConfig: {
                governorate: 'baghdad',
                commissionRate: 0.15,
                baseDeliveryFee: 2500,
                serviceArea: 'active'
            },
            
            // Driver requirements
            driverRequirements: {
                governorate: 'baghdad',
                maxDistanceFromRestaurant: 5.0, // km
                acceptLanguages: ['ar', 'en']
            }
        };

        console.log('📝 Creating test order with details:');
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Customer: ${testOrder.customerName}`);
        console.log(`   Restaurant: ${testOrder.restaurantName}`);
        console.log(`   Location: ${testOrder.customerLocation.area}, ${testOrder.customerLocation.governorate}`);
        console.log(`   Total: ${testOrder.totalAmount.toLocaleString()} ${testOrder.currency}`);
        console.log(`   Status: ${testOrder.status}`);
        console.log('');

        const putCommand = new PutCommand({
            TableName: ORDERS_TABLE,
            Item: testOrder
        });

        await docClient.send(putCommand);

        console.log('✅ SUCCESS: Test order created successfully!');
        console.log('=================================================');
        console.log('📱 Next Steps:');
        console.log('   1. Open your WizzDriver Flutter app');
        console.log('   2. Ensure driver is online and in Baghdad area');
        console.log('   3. The notification should appear within 60 seconds');
        console.log('   4. Test accepting/rejecting the order');
        console.log('');
        console.log('🔍 Order Details Summary:');
        console.log(`   PK: ${testOrder.PK}`);
        console.log(`   SK: ${testOrder.SK}`);
        console.log(`   Order ID: ${testOrder.orderId}`);
        console.log(`   Customer: ${testOrder.customerName}`);
        console.log(`   Total: ${testOrder.totalAmount.toLocaleString()} IQD`);
        console.log(`   Status: ${testOrder.status}`);
        console.log('=================================================');

        return testOrder;

    } catch (error) {
        console.error('❌ FAILED: Error creating test order:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    createTestOrder()
        .then(() => {
            console.log('🏁 Test order creation completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Test order creation failed:', error);
            process.exit(1);
        });
}

module.exports = { createTestOrder };
