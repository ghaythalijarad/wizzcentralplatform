const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function createRealisticOrder() {
    try {
        const orderId = `ORDER_${Date.now()}`;
        
        // Create an order that matches your Flutter app's expected structure
        const realisticOrder = {
            // Primary keys matching your table structure
            PK: `ORDER#${orderId}`,
            SK: 'META',
            
            // Basic order information
            orderId: orderId,
            status: 'NOT_ASSIGNED', // This is key - your app looks for this status
            
            // Customer details (Arabic names as your app expects)
            customerEmail: 'ahmed.test@wizz.iq',
            customerName: 'أحمد محمد الراشد',
            customerPhone: '+964 771 123 4567',
            
            // Location data for Baghdad (your active region)
            customerLocation: {
                governorate: 'baghdad',
                district: 'al_karkh', 
                area: 'الكرادة',
                address: 'شارع الكرادة الداخل، بناية رقم 15',
                coordinates: {
                    latitude: 33.3085,
                    longitude: 44.3937
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
                    latitude: 33.3354,
                    longitude: 44.3412
                }
            },
            
            // Order items (what your Flutter app displays)
            items: [
                {
                    name: 'مشاوي مشكلة',
                    nameEn: 'Mixed Grill',
                    price: 25000,
                    quantity: 1
                },
                {
                    name: 'سلطة فتوش',
                    nameEn: 'Fattoush Salad', 
                    price: 8000,
                    quantity: 1
                }
            ],
            
            // Financial details (Iraqi Dinar)
            totalAmount: 43000,
            currency: 'IQD',
            deliveryFee: 2500,
            
            // Timing and delivery
            createdAt: new Date().toISOString(),
            channel: 'mobile_app',
            estimatedDistance: 3.2,
            estimatedDeliveryTime: 35,
            paymentMethod: 'CASH_ON_DELIVERY',
            
            // Regional settings (Baghdad is active)
            regionalConfig: {
                governorate: 'baghdad',
                commissionRate: 0.15,
                serviceArea: 'active'
            },
            
            // Special instructions
            specialInstructions: 'يرجى الاتصال عند الوصول للبناية'
        };

        console.log('🚀 Creating realistic order for Flutter notification system...');
        console.log('📋 Order Details:');
        console.log(`   ID: ${orderId}`);
        console.log(`   Customer: ${realisticOrder.customerName}`);
        console.log(`   Restaurant: ${realisticOrder.restaurantName}`);
        console.log(`   Amount: ${realisticOrder.totalAmount.toLocaleString()} IQD`);
        console.log(`   Status: ${realisticOrder.status}`);
        console.log('');

        await docClient.send(new PutCommand({
            TableName: 'WizzOrders_dev',
            Item: realisticOrder
        }));

        console.log('✅ Order created successfully!');
        console.log('');
        console.log('🎯 TESTING INSTRUCTIONS:');
        console.log('================================');
        console.log('1. Open your WizzDriver Flutter app');
        console.log('2. Make sure the driver is:');
        console.log('   - Online/Available');
        console.log('   - In Baghdad area');
        console.log('   - OrderNotificationService is listening');
        console.log('3. The order should appear as a notification within 60 seconds');
        console.log('4. Test accepting/rejecting the notification');
        console.log('');
        console.log('📱 Expected Notification Content:');
        console.log(`   Restaurant: ${realisticOrder.restaurantName}`);
        console.log(`   Customer: ${realisticOrder.customerName}`);
        console.log(`   Total: ${realisticOrder.totalAmount.toLocaleString()} IQD`);
        console.log(`   Distance: ~${realisticOrder.estimatedDistance} km`);
        console.log(`   Items: ${realisticOrder.items.length} items`);
        
        return realisticOrder;

    } catch (error) {
        console.error('❌ Error creating realistic order:', error);
        throw error;
    }
}

// Run the script
createRealisticOrder()
    .then(() => {
        console.log('🏁 Script completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
