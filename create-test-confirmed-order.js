#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function createConfirmedOrder() {
    const orderId = `ORDER_${Date.now()}`;
    
    console.log('🚀 إنشاء طلب جديد بحالة "confirmed"');
    console.log('=' * 50);
    console.log(`📦 رقم الطلب: ${orderId}`);
    
    const orderData = {
        PK: `ORDER#${orderId}`,
        SK: `ORDER#${orderId}`,
        orderId: orderId,
        status: 'confirmed', // الحالة التي تُشغّل تعيين السائق
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
        
        // معلومات العميل
        customerName: 'أحمد محمد علي',
        customerEmail: 'ahmed.mohammed@gmail.com',
        customerPhone: '+9647701234567',
        
        // تفاصيل الطلب
        totalAmount: 45000,
        currency: 'IQD',
        estimatedEarnings: 12000, // أرباح السائق
        
        // المواقع - بغداد
        pickupLatitude: 33.3152,
        pickupLongitude: 44.3661,
        deliveryLatitude: 33.3350,
        deliveryLongitude: 44.3940,
        pickupAddress: 'مطعم الرشيد للمأكولات الشعبية - شارع المتنبي، بغداد',
        deliveryAddress: 'حي الجادرية، شارع الجامعة، بغداد',
        
        // معلومات المطعم
        restaurantName: 'مطعم الرشيد للمأكولات الشعبية',
        restaurantId: 'restaurant_rashid_001',
        storeName: 'مطعم الرشيد للمأكولات الشعبية',
        
        // الدفع والتوصيل
        paymentMethod: 'CASH',
        deliveryType: 'delivery',
        channel: 'WIZZ_TEST_CONFIRMED',
        governorate: 'Baghdad',
        district: 'Al-Jadiriya',
        
        // معلومات التعيين
        assignmentStatus: 'pending',
        validatedForAssignment: true,
        
        // العناصر المطلوبة
        items: [
            {
                name: 'كباب عراقي (10 قطع)',
                quantity: 1,
                price: 25000,
                total: 25000
            },
            {
                name: 'برياني لحم',
                quantity: 1,
                price: 15000,
                total: 15000
            },
            {
                name: 'سلطة عراقية',
                quantity: 1,
                price: 5000,
                total: 5000
            }
        ],
        
        // معلومات إضافية
        total: 45000,
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 دقيقة من الآن
        specialInstructions: 'يرجى التأكد من أن الطعام ساخن عند التسليم',
        entityType: 'order',
        
        // معلومات الاتصال الإضافية
        alternativePhone: '+9647801234567',
        deliveryNotes: 'البناية الثالثة من اليسار، الطابق الثاني'
    };

    try {
        console.log('📝 حفظ الطلب في قاعدة البيانات...');
        
        await docClient.send(new PutCommand({
            TableName: 'WizzOrders',
            Item: orderData
        }));

        console.log('✅ تم إنشاء الطلب بنجاح!');
        console.log('');
        console.log('📋 تفاصيل الطلب:');
        console.log(`   🆔 رقم الطلب: ${orderData.orderId}`);
        console.log(`   ✅ الحالة: ${orderData.status}`);
        console.log(`   👤 العميل: ${orderData.customerName}`);
        console.log(`   🏪 المطعم: ${orderData.restaurantName}`);
        console.log(`   💰 المبلغ: ${orderData.totalAmount.toLocaleString()} ${orderData.currency}`);
        console.log(`   🚗 أرباح السائق: ${orderData.estimatedEarnings.toLocaleString()} IQD`);
        console.log(`   📍 من: ${orderData.pickupAddress}`);
        console.log(`   📍 إلى: ${orderData.deliveryAddress}`);
        console.log(`   📞 هاتف العميل: ${orderData.customerPhone}`);
        console.log('');
        
        console.log('🔔 السلوك المتوقع للنظام:');
        console.log('   1️⃣ DynamoDB Stream يكتشف الحالة الجديدة "confirmed"');
        console.log('   2️⃣ Lambda function تعالج التغيير');
        console.log('   3️⃣ نظام تعيين السائق يبحث عن السائقين المتاحين');
        console.log('   4️⃣ إرسال إشعارات WebSocket للسائقين القريبين');
        console.log('   5️⃣ السائق يستقبل الإشعار في التطبيق');
        console.log('');
        
        console.log('📱 لاختبار استقبال الإشعارات:');
        console.log('   • شغّل تطبيق WizzDriver على الآيفون');
        console.log('   • تأكد من الاتصال بالإنترنت');
        console.log('   • راقب وصول إشعار الطلب الجديد');
        console.log('');
        
        console.log('🎯 الطلب جاهز للاختبار!');
        return orderId;
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء الطلب:', error);
        throw error;
    }
}

// تشغيل الاختبار
createConfirmedOrder()
    .then(orderId => {
        console.log(`\n🏁 تم إنشاء الطلب ${orderId} بنجاح`);
        console.log('💡 النظام سيبدأ الآن في محاولة تعيين سائق تلقائياً');
        console.log('📲 تحقق من تطبيق WizzDriver لاستقبال الإشعار');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ فشل الاختبار:', error);
        process.exit(1);
    });
