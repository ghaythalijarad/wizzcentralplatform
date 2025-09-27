#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = 'WizzOrders';
const WEBSOCKET_CONNECTIONS_TABLE = 'WizzUser_websocket_connections_dev';

async function createOrderAndAssignDriver() {
    const orderId = `ORDER_${Date.now()}`;
    
    console.log('🚀 إنشاء طلب جديد وتعيين سائق');
    console.log('=' * 50);
    console.log(`📦 رقم الطلب: ${orderId}`);
    
    try {
        // 1. إنشاء الطلب بحالة confirmed
        console.log('\n1️⃣ إنشاء الطلب...');
        
        const orderData = {
            PK: `ORDER#${orderId}`,
            SK: `ORDER#${orderId}`,
            orderId: orderId,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            confirmedAt: new Date().toISOString(),
            
            // معلومات العميل
            customerName: 'فاطمة أحمد الجبوري',
            customerEmail: 'fatima.ahmed@gmail.com',
            customerPhone: '+9647801234567',
            
            // تفاصيل الطلب
            totalAmount: 38000,
            total: 38000,
            currency: 'IQD',
            estimatedEarnings: 10000,
            
            // المواقع
            pickupLatitude: 33.3152,
            pickupLongitude: 44.3661,
            deliveryLatitude: 33.3280,
            deliveryLongitude: 44.3790,
            pickupAddress: 'مطعم أبو علي للكباب - شارع الرشيد، بغداد',
            deliveryAddress: 'حي الكرادة، شارع فلسطين، بغداد',
            
            // المطعم
            restaurantName: 'مطعم أبو علي للكباب',
            storeName: 'مطعم أبو علي للكباب',
            restaurantId: 'restaurant_abu_ali_001',
            
            // الدفع
            paymentMethod: 'CASH',
            deliveryType: 'delivery',
            
            // العناصر
            items: [
                {
                    name: 'كباب عراقي مشكل',
                    quantity: 2,
                    price: 15000,
                    total: 30000
                },
                {
                    name: 'عرق وخضار',
                    quantity: 1,
                    price: 8000,
                    total: 8000
                }
            ],
            
            entityType: 'order'
        };
        
        await docClient.send(new PutCommand({
            TableName: ORDERS_TABLE,
            Item: orderData
        }));
        
        console.log('✅ تم إنشاء الطلب بنجاح');
        console.log(`   👤 العميل: ${orderData.customerName}`);
        console.log(`   🏪 المطعم: ${orderData.restaurantName}`);
        console.log(`   💰 المبلغ: ${orderData.totalAmount.toLocaleString()} IQD`);
        
        // 2. البحث عن السائقين المتاحين
        console.log('\n2️⃣ البحث عن السائقين المتاحين...');
        
        const driversResult = await docClient.send(new ScanCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            FilterExpression: 'attribute_exists(driverId) AND connectionStatus = :status',
            ExpressionAttributeValues: {
                ':status': 'connected'
            }
        }));
        
        const availableDrivers = driversResult.Items || [];
        console.log(`   🔍 تم العثور على ${availableDrivers.length} سائق متصل`);
        
        if (availableDrivers.length === 0) {
            console.log('⚠️ لا يوجد سائقين متاحين حالياً');
            console.log('💡 تأكد من تشغيل محاكي السائق أولاً');
            return;
        }
        
        // 3. اختيار أول سائق متاح
        const selectedDriver = availableDrivers[0];
        const driverId = selectedDriver.driverId;
        
        console.log(`   🎯 تم اختيار السائق: ${driverId}`);
        
        // 4. تعيين السائق للطلب
        console.log('\n3️⃣ تعيين السائق للطلب...');
        
        await docClient.send(new UpdateCommand({
            TableName: ORDERS_TABLE,
            Key: {
                PK: `ORDER#${orderId}`,
                SK: `ORDER#${orderId}`
            },
            UpdateExpression: `
                SET driverId = :driverId, 
                    #status = :status, 
                    assignedAt = :assignedAt,
                    updatedAt = :updatedAt
            `,
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':driverId': driverId,
                ':status': 'assigned_to_driver',
                ':assignedAt': new Date().toISOString(),
                ':updatedAt': new Date().toISOString()
            }
        }));
        
        console.log('✅ تم تعيين السائق بنجاح');
        
        // 5. إرسال إشعار للسائق
        console.log('\n4️⃣ إرسال إشعار WebSocket للسائق...');
        
        const apiGatewayClient = new ApiGatewayManagementApiClient({
            endpoint: 'https://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev'
        });
        
        const notificationMessage = {
            action: 'driver_assigned',
            order_id: orderId,
            assignment_id: `ASSIGN_${Date.now()}`,
            timeout: 30,
            customer_name: orderData.customerName,
            restaurant_name: orderData.restaurantName,
            delivery_address: orderData.deliveryAddress,
            total_amount: orderData.totalAmount,
            currency: orderData.currency,
            estimated_earnings: orderData.estimatedEarnings,
            estimated_distance: '2.8',
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
            timestamp: new Date().toISOString()
        };
        
        try {
            await apiGatewayClient.send(new PostToConnectionCommand({
                ConnectionId: selectedDriver.connectionId,
                Data: JSON.stringify(notificationMessage)
            }));
            
            console.log('✅ تم إرسال الإشعار للسائق بنجاح!');
            
        } catch (wsError) {
            console.log('⚠️ خطأ في إرسال WebSocket:', wsError.message);
        }
        
        // ملخص العملية
        console.log('\n🎉 تمت العملية بنجاح!');
        console.log('📋 ملخص:');
        console.log(`   📦 رقم الطلب: ${orderId}`);
        console.log(`   🚗 السائق المُعيّن: ${driverId}`);
        console.log(`   📱 تم إرسال الإشعار: نعم`);
        console.log(`   ⏰ وقت الإنشاء: ${new Date().toLocaleString('ar-IQ')}`);
        
        console.log('\n📲 تحقق الآن من:');
        console.log('   • تطبيق WizzDriver للإشعار');
        console.log('   • محاكي السائق في الطرفية');
        console.log('   • سجلات CloudWatch');
        
        return { orderId, driverId };
        
    } catch (error) {
        console.error('❌ خطأ في العملية:', error);
        throw error;
    }
}

// تشغيل العملية
createOrderAndAssignDriver()
    .then(({ orderId, driverId }) => {
        console.log(`\n🏁 انتهت العملية: طلب ${orderId} مُعيّن للسائق ${driverId}`);
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ فشلت العملية:', error);
        process.exit(1);
    });
