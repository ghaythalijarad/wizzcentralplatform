#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = 'WizzOrders';
const WEBSOCKET_CONNECTIONS_TABLE = 'WizzUser_websocket_connections_dev';

async function createOrderAndNotifyFlutterApp() {
    const orderId = `ORDER_${Date.now()}`;
    
    console.log('🚀 إنشاء طلب نهائي واختبار الإشعار مع تطبيق Flutter');
    console.log('=' * 60);
    console.log(`📦 رقم الطلب: ${orderId}`);
    console.log('📱 التطبيق يعمل على الآيفون - جاهز لاستقبال الإشعارات');
    
    try {
        // 1. إنشاء طلب مؤكد
        console.log('\n1️⃣ إنشاء طلب بحالة "confirmed"...');
        
        const orderData = {
            PK: `ORDER#${orderId}`,
            SK: `ORDER#${orderId}`,
            orderId: orderId,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            confirmedAt: new Date().toISOString(),
            
            // معلومات العميل
            customerName: 'سارة محمد الكربلائي',
            customerEmail: 'sara.mohammed@gmail.com',
            customerPhone: '+9647801234567',
            
            // تفاصيل الطلب
            totalAmount: 55000,
            total: 55000,
            currency: 'IQD',
            estimatedEarnings: 15000,
            
            // المواقع - النجف (قريب من موقع التطبيق الحالي)
            pickupLatitude: 31.9996, // النجف
            pickupLongitude: 44.3267,
            deliveryLatitude: 31.9950,
            deliveryLongitude: 44.3300,
            pickupAddress: 'مطعم الحضرة للمأكولات الشعبية - النجف الأشرف',
            deliveryAddress: 'حي الأنصار، شارع الكوفة، النجف',
            
            // المطعم
            restaurantName: 'مطعم الحضرة للمأكولات الشعبية',
            storeName: 'مطعم الحضرة للمأكولات الشعبية',
            restaurantId: 'restaurant_hadra_najaf_001',
            
            // الدفع والتوصيل
            paymentMethod: 'CASH',
            deliveryType: 'delivery',
            channel: 'WIZZ_FLUTTER_TEST',
            governorate: 'Najaf',
            district: 'Al-Najaf',
            
            // العناصر
            items: [
                {
                    name: 'دولمة عراقية (15 قطعة)',
                    quantity: 1,
                    price: 20000,
                    total: 20000
                },
                {
                    name: 'تشريب لحم',
                    quantity: 1,
                    price: 18000,
                    total: 18000
                },
                {
                    name: 'شاي عراقي + حلويات',
                    quantity: 2,
                    price: 8500,
                    total: 17000
                }
            ],
            
            // معلومات إضافية
            estimatedDeliveryTime: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
            specialInstructions: 'يرجى التأكد من أن الطعام ساخن - طلب مهم',
            entityType: 'order',
            validatedForAssignment: true,
            assignmentStatus: 'pending'
        };
        
        await docClient.send(new PutCommand({
            TableName: ORDERS_TABLE,
            Item: orderData
        }));
        
        console.log('✅ تم إنشاء الطلب بنجاح');
        console.log(`   👤 العميل: ${orderData.customerName}`);
        console.log(`   🏪 المطعم: ${orderData.restaurantName}`);
        console.log(`   💰 المبلغ: ${orderData.totalAmount.toLocaleString()} IQD`);
        console.log(`   🚗 أرباح السائق: ${orderData.estimatedEarnings.toLocaleString()} IQD`);
        console.log(`   📍 المدينة: ${orderData.governorate} (${orderData.district})`);
        
        // 2. البحث عن السائقين المتصلين
        console.log('\n2️⃣ البحث عن السائقين المتصلين...');
        
        const driversResult = await docClient.send(new ScanCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            FilterExpression: 'attribute_exists(driverId) AND connectionStatus = :status',
            ExpressionAttributeValues: {
                ':status': 'connected'
            }
        }));
        
        const connectedDrivers = driversResult.Items || [];
        console.log(`   🔍 السائقين المتصلين: ${connectedDrivers.length}`);
        
        if (connectedDrivers.length > 0) {
            console.log('   📋 قائمة السائقين:');
            connectedDrivers.forEach((driver, index) => {
                console.log(`      ${index + 1}. ${driver.driverId} (${driver.connectionId})`);
            });
        }
        
        // 3. إرسال إشعارات لجميع السائقين المتصلين
        console.log('\n3️⃣ إرسال إشعارات WebSocket...');
        
        const apiGatewayClient = new ApiGatewayManagementApiClient({
            endpoint: 'https://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev'
        });
        
        const notificationMessage = {
            action: 'new_order',
            type: 'driver_assigned', 
            order_id: orderId,
            assignment_id: `ASSIGN_${Date.now()}`,
            timeout: 30,
            customer_name: orderData.customerName,
            restaurant_name: orderData.restaurantName,
            delivery_address: orderData.deliveryAddress,
            total_amount: orderData.totalAmount,
            currency: orderData.currency,
            estimated_earnings: orderData.estimatedEarnings,
            estimated_distance: '1.2 كم',
            pickup_location: {
                latitude: orderData.pickupLatitude,
                longitude: orderData.pickupLongitude,
                address: orderData.pickupAddress
            },
            delivery_location: {
                latitude: orderData.deliveryLatitude,
                longitude: orderData.deliveryLongitude,
                address: orderData.deliveryAddress
            },
            items: orderData.items,
            special_instructions: orderData.specialInstructions,
            payment_method: orderData.paymentMethod,
            timestamp: new Date().toISOString()
        };
        
        let notificationsSent = 0;
        
        for (const driver of connectedDrivers) {
            try {
                await apiGatewayClient.send(new PostToConnectionCommand({
                    ConnectionId: driver.connectionId,
                    Data: JSON.stringify(notificationMessage)
                }));
                
                console.log(`   ✅ إشعار مُرسل للسائق: ${driver.driverId}`);
                notificationsSent++;
                
            } catch (wsError) {
                console.log(`   ❌ فشل إرسال إشعار للسائق ${driver.driverId}: ${wsError.message}`);
            }
        }
        
        // 4. النتائج النهائية
        console.log('\n🎉 تمت العملية بنجاح!');
        console.log('📊 ملخص العملية:');
        console.log(`   📦 رقم الطلب: ${orderId}`);
        console.log(`   ✅ حالة الطلب: ${orderData.status}`);
        console.log(`   📱 إشعارات مُرسلة: ${notificationsSent}/${connectedDrivers.length}`);
        console.log(`   🕐 وقت الإنشاء: ${new Date().toLocaleString('ar-IQ')}`);
        console.log(`   📍 المدينة: ${orderData.governorate}`);
        
        console.log('\n📲 توقعات النظام:');
        console.log('   1️⃣ السائق سيستقبل إشعار في تطبيق Flutter');
        console.log('   2️⃣ سيظهر تفاصيل الطلب (العميل، المطعم، العنوان)');
        console.log('   3️⃣ السائق يمكنه قبول أو رفض الطلب');
        console.log('   4️⃣ عند القبول، سيتم تحديث حالة الطلب');
        
        console.log('\n🎯 تحقق من تطبيق WizzDriver الآن!');
        console.log('📱 يجب أن ترى إشعار الطلب الجديد على الشاشة');
        
        return { orderId, notificationsSent };
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء الطلب:', error);
        throw error;
    }
}

// تشغيل الاختبار النهائي
createOrderAndNotifyFlutterApp()
    .then(({ orderId, notificationsSent }) => {
        console.log(`\n🏁 اختبار مكتمل بنجاح!`);
        console.log(`📦 الطلب: ${orderId}`);
        console.log(`📱 إشعارات مُرسلة: ${notificationsSent}`);
        console.log('🎉 تحقق من تطبيق Flutter لرؤية الإشعار!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ فشل الاختبار:', error);
        process.exit(1);
    });
