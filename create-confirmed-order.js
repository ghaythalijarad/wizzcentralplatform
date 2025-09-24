console.log('🚀 Creating CONFIRMED order for driver assignment...');

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function createConfirmedOrder() {
    const orderId = `ORDER_${Date.now()}`;
    console.log(`📦 Creating order: ${orderId}`);

    const order = {
        PK: `ORDER#${orderId}`,
        SK: 'META', 
        orderId: orderId,
        customerName: 'عمار صالح الخالدي',
        customerEmail: 'ammar.test@wizz.iq',
        customerPhone: '+964772345678',
        status: 'CONFIRMED',  // ✅ CONFIRMED by merchant - ready for driver assignment
        totalAmount: 65500,
        currency: 'IQD',
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(), // ✅ Merchant confirmed timestamp
        channel: 'mobile_app',
        location: {
            governorate: 'Baghdad',
            district: 'Sadr City',
            coordinates: {
                lat: 33.3160,
                lng: 44.3670
            }
        },
        restaurantInfo: {
            name: 'مطعم الصدر الشعبي',
            location: {
                lat: 33.3175,
                lng: 44.3685
            }
        },
        deliveryAddress: {
            street: 'مدينة الصدر، الحي الأول',
            district: 'مدينة الصدر',
            coordinates: {
                lat: 33.3145,
                lng: 44.3655
            }
        },
        items: [
            { name: 'دجاج مشوي', quantity: 1, price: 28000 },
            { name: 'أرز تمن', quantity: 1, price: 8000 },
            { name: 'سلطة خضار', quantity: 1, price: 7000 },
            { name: 'عصير برتقال', quantity: 2, price: 11250 }
        ],
        estimatedDistance: 2.5,
        estimatedTime: 20,
        paymentMethod: 'CASH_ON_DELIVERY',
        priority: 'normal'
    };

    try {
        await docClient.send(new PutCommand({
            TableName: 'WizzOrders_dev',
            Item: order
        }));

        console.log('✅ CONFIRMED order created successfully!');
        console.log('📋 Order Details:');
        console.log(`   ID: ${orderId}`);
        console.log(`   Customer: ${order.customerName}`);
        console.log(`   Total: ${order.totalAmount.toLocaleString()} IQD`);
        console.log(`   Status: ✅ ${order.status}`);
        console.log(`   Location: Baghdad, ${order.location.district}`);
        console.log('');
        console.log('📱 This order should now trigger WizzDriver notifications!');
        console.log('📍 Simulator location: Baghdad (33.3152, 44.3661)');
        console.log('⏱️  Check Flutter app for notifications (60-second cycle)');
        
    } catch (error) {
        console.error('❌ Error creating order:', error);
    }
}

createConfirmedOrder();
