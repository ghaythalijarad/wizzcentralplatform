#!/usr/bin/env node

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev';

function simulateDriverConnection() {
    console.log('🚗 محاكاة اتصال سائق لاستقبال الإشعارات');
    console.log('=' * 50);
    console.log(`📡 الاتصال بـ: ${WEBSOCKET_URL}`);
    
    const ws = new WebSocket(WEBSOCKET_URL);
    let connected = false;
    let messagesReceived = [];
    
    // انتهاء الاختبار بعد 30 ثانية
    const timeout = setTimeout(() => {
        console.log('\n📊 ملخص الاختبار:');
        console.log(`   📨 الرسائل المستلمة: ${messagesReceived.length}`);
        
        if (messagesReceived.length > 0) {
            console.log('   📋 الرسائل:');
            messagesReceived.forEach((msg, i) => {
                const type = msg.action || msg.type || 'unknown';
                console.log(`      ${i + 1}. ${type}`);
                if (msg.order_id) {
                    console.log(`         📦 رقم الطلب: ${msg.order_id}`);
                }
                if (msg.restaurant_name) {
                    console.log(`         🏪 المطعم: ${msg.restaurant_name}`);
                }
                if (msg.total_amount) {
                    console.log(`         💰 المبلغ: ${msg.total_amount} ${msg.currency || 'IQD'}`);
                }
            });
        }
        
        ws.close();
        process.exit(0);
    }, 30000);
    
    ws.on('open', () => {
        connected = true;
        console.log('✅ تم الاتصال بـ WebSocket بنجاح!');
        
        // تسجيل كسائق
        console.log('🔐 تسجيل الدخول كسائق...');
        const registrationMessage = {
            action: 'register',
            userType: 'driver',
            userId: 'test_driver_notification',
            metadata: {
                name: 'محمد أحمد - سائق اختبار',
                location: {
                    latitude: 33.3152,
                    longitude: 44.3661,
                    city: 'Baghdad'
                },
                status: 'online',
                vehicle: {
                    type: 'car',
                    plate: 'ب غ د 1234'
                }
            }
        };
        
        ws.send(JSON.stringify(registrationMessage));
        
        // إرسال موقع السائق
        setTimeout(() => {
            console.log('📍 إرسال الموقع الحالي...');
            const locationUpdate = {
                action: 'driver_location_update',
                driver_id: 'test_driver_notification',
                location: {
                    latitude: 33.3152,
                    longitude: 44.3661
                },
                status: 'online',
                timestamp: new Date().toISOString()
            };
            
            ws.send(JSON.stringify(locationUpdate));
        }, 2000);
    });
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            messagesReceived.push(message);
            
            const messageType = message.action || message.type || 'unknown';
            console.log(`\n📨 رسالة جديدة: ${messageType}`);
            
            if (message.action === 'driver_assigned' || message.action === 'new_order') {
                console.log('🎯 إشعار طلب جديد وصل!');
                console.log(`   📦 رقم الطلب: ${message.order_id}`);
                console.log(`   🏪 المطعم: ${message.restaurant_name || 'غير محدد'}`);
                console.log(`   👤 العميل: ${message.customer_name || 'غير محدد'}`);
                console.log(`   💰 المبلغ: ${message.total_amount || 0} ${message.currency || 'IQD'}`);
                console.log(`   📍 عنوان التسليم: ${message.delivery_address || 'غير محدد'}`);
                console.log(`   ⏱️ مهلة الرد: ${message.timeout || 30} ثانية`);
                
                // محاكاة قبول الطلب
                setTimeout(() => {
                    console.log('✅ قبول الطلب...');
                    const acceptMessage = {
                        action: 'order_accept',
                        order_id: message.order_id,
                        assignment_id: message.assignment_id,
                        driver_id: 'test_driver_notification',
                        timestamp: new Date().toISOString()
                    };
                    
                    ws.send(JSON.stringify(acceptMessage));
                }, 3000);
            }
            
            if (message.action === 'order_accept_ack' || message.type === 'order_accepted') {
                console.log('🎉 تم تأكيد قبول الطلب!');
            }
            
            // عرض تفاصيل إضافية للرسائل المهمة
            if (message.pickup_location) {
                console.log(`   📍 موقع الاستلام: ${message.pickup_location.address || 'غير محدد'}`);
            }
            if (message.delivery_location) {
                console.log(`   📍 موقع التسليم: ${message.delivery_location.address || 'غير محدد'}`);
            }
            if (message.estimated_earnings) {
                console.log(`   💵 الأرباح المتوقعة: ${message.estimated_earnings} IQD`);
            }
            
        } catch (e) {
            console.log(`📨 رسالة خام: ${data.toString()}`);
        }
    });
    
    ws.on('error', (error) => {
        console.log('❌ خطأ في WebSocket:', error.message);
    });
    
    ws.on('close', (code, reason) => {
        console.log(`🔌 تم إغلاق الاتصال: ${code} - ${reason}`);
        clearTimeout(timeout);
    });
}

console.log('🧪 اختبار استقبال إشعارات الطلبات');
console.log('🎯 هذا الاختبار سيقوم بـ:');
console.log('   1. الاتصال كسائق بـ WebSocket');
console.log('   2. تسجيل الموقع في بغداد');
console.log('   3. انتظار إشعارات الطلبات الجديدة');
console.log('   4. محاكاة قبول الطلب عند وصوله');
console.log('');

simulateDriverConnection();
