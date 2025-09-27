#!/usr/bin/env node

const WebSocket = require('ws');

// نفس WebSocket endpoint المستخدم في تطبيق Flutter
const WEBSOCKET_URL = 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev';

function simulateFlutterDriverConnection() {
    console.log('📱 محاكاة اتصال سائق Flutter');
    console.log('=' * 40);
    console.log(`📡 الاتصال بـ: ${WEBSOCKET_URL}`);
    console.log('🎯 محاكاة نفس سلوك تطبيق WizzDriver');
    
    const ws = new WebSocket(WEBSOCKET_URL);
    let connected = false;
    let messagesReceived = [];
    let registrationComplete = false;
    
    // انتهاء الاختبار بعد 60 ثانية
    const timeout = setTimeout(() => {
        console.log('\n📊 ملخص النتائج:');
        console.log(`   📨 الرسائل المستلمة: ${messagesReceived.length}`);
        console.log(`   🔐 التسجيل مكتمل: ${registrationComplete ? 'نعم' : 'لا'}`);
        
        if (messagesReceived.length > 0) {
            console.log('   📋 أنواع الرسائل:');
            const messageTypes = {};
            messagesReceived.forEach(msg => {
                const type = msg.action || msg.type || 'unknown';
                messageTypes[type] = (messageTypes[type] || 0) + 1;
            });
            
            Object.entries(messageTypes).forEach(([type, count]) => {
                console.log(`      - ${type}: ${count}`);
            });
        }
        
        console.log('\n🎯 نتيجة الاختبار:');
        if (messagesReceived.some(m => m.action === 'new_order' || m.action === 'driver_assigned')) {
            console.log('   ✅ نجح استقبال إشعارات الطلبات!');
            console.log('   📱 التطبيق سيستقبل نفس الإشعارات');
        } else {
            console.log('   ⚠️ لم يتم استقبال إشعارات طلبات');
            console.log('   💡 جرب إنشاء طلب جديد بحالة "confirmed"');
        }
        
        ws.close();
        process.exit(0);
    }, 60000);
    
    ws.on('open', () => {
        connected = true;
        console.log('✅ تم الاتصال بـ WebSocket بنجاح!');
        
        // تسجيل كسائق مع نفس البيانات المتوقعة من Flutter
        console.log('🔐 تسجيل الدخول كسائق...');
        const registrationMessage = {
            action: 'register',
            userType: 'driver',
            userId: 'flutter_test_driver_001',
            metadata: {
                name: 'غيث علي - سائق فلاتر',
                location: {
                    latitude: 31.9996, // النجف (قريب من موقع التطبيق)
                    longitude: 44.3267,
                    city: 'Najaf'
                },
                status: 'online',
                vehicle: {
                    type: 'car',
                    plate: 'ن ج ف 5678'
                },
                phone: '+9647801234567',
                zone: 'Najaf'
            }
        };
        
        ws.send(JSON.stringify(registrationMessage));
        console.log('   📋 بيانات التسجيل مُرسلة');
        
        // إرسال موقع السائق (محاكاة نفس سلوك Flutter)
        setTimeout(() => {
            console.log('📍 إرسال الموقع الحالي...');
            const locationUpdate = {
                action: 'driver_location_update',
                driver_id: 'flutter_test_driver_001',
                location: {
                    latitude: 31.9996,
                    longitude: 44.3267
                },
                status: 'online',
                zone: 'Najaf',
                timestamp: new Date().toISOString()
            };
            
            ws.send(JSON.stringify(locationUpdate));
            console.log('   📍 الموقع: النجف (31.9996, 44.3267)');
            
            // إرسال heartbeat (محاكاة نبضات التطبيق)
            setInterval(() => {
                if (connected) {
                    ws.send(JSON.stringify({
                        action: 'heartbeat',
                        driver_id: 'flutter_test_driver_001',
                        timestamp: new Date().toISOString()
                    }));
                }
            }, 30000); // كل 30 ثانية
            
        }, 2000);
    });
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            messagesReceived.push(message);
            
            const messageType = message.action || message.type || 'unknown';
            console.log(`\n📨 رسالة واردة: ${messageType}`);
            
            // التعامل مع رسائل التسجيل
            if (messageType === 'registration_ack' || messageType === 'register_ack') {
                registrationComplete = true;
                console.log('✅ تم تأكيد التسجيل بنجاح');
            }
            
            // التعامل مع إشعارات الطلبات الجديدة
            if (message.action === 'new_order' || message.action === 'driver_assigned') {
                console.log('🎯 إشعار طلب جديد - تماماً كما سيظهر في Flutter!');
                console.log(`   📦 رقم الطلب: ${message.order_id}`);
                console.log(`   👤 العميل: ${message.customer_name || 'غير محدد'}`);
                console.log(`   🏪 المطعم: ${message.restaurant_name || 'غير محدد'}`);
                console.log(`   💰 المبلغ: ${message.total_amount || 0} ${message.currency || 'IQD'}`);
                console.log(`   🚗 أرباح السائق: ${message.estimated_earnings || 0} IQD`);
                console.log(`   📍 التوصيل إلى: ${message.delivery_address || 'غير محدد'}`);
                console.log(`   ⏱️ مهلة الرد: ${message.timeout || 30} ثانية`);
                
                if (message.pickup_location) {
                    console.log(`   📍 موقع الاستلام: ${message.pickup_location.address || 'غير محدد'}`);
                }
                
                if (message.items && message.items.length > 0) {
                    console.log('   🍽️ العناصر المطلوبة:');
                    message.items.forEach((item, i) => {
                        console.log(`      ${i + 1}. ${item.name} (${item.quantity}x) - ${item.total} IQD`);
                    });
                }
                
                // محاكاة قبول الطلب (كما سيفعل السائق في Flutter)
                setTimeout(() => {
                    console.log('✅ محاكاة قبول الطلب...');
                    const acceptMessage = {
                        action: 'order_accept',
                        order_id: message.order_id,
                        assignment_id: message.assignment_id,
                        driver_id: 'flutter_test_driver_001',
                        timestamp: new Date().toISOString()
                    };
                    
                    ws.send(JSON.stringify(acceptMessage));
                    console.log('   📤 رسالة القبول مُرسلة');
                }, 5000); // قبول بعد 5 ثوانِ
            }
            
            // التعامل مع تأكيد قبول الطلب
            if (message.action === 'order_accept_ack' || message.type === 'order_accepted') {
                console.log('🎉 تم تأكيد قبول الطلب!');
                console.log('   ✅ النظام يعمل بشكل مثالي');
                console.log('   📱 Flutter app سيعرض نفس السلوك');
            }
            
            // عرض رسائل أخرى مهمة
            if (messageType === 'heartbeat_response') {
                console.log('💓 heartbeat response - الاتصال نشط');
            }
            
        } catch (e) {
            console.log(`📨 رسالة خام: ${data.toString().substring(0, 100)}...`);
        }
    });
    
    ws.on('error', (error) => {
        console.log('❌ خطأ في WebSocket:', error.message);
    });
    
    ws.on('close', (code, reason) => {
        connected = false;
        console.log(`🔌 تم إغلاق الاتصال: ${code} - ${reason}`);
        clearTimeout(timeout);
        clearInterval;
    });
}

console.log('🧪 اختبار محاكاة سائق Flutter');
console.log('🎯 هذا الاختبار يحاكي سلوك تطبيق WizzDriver تماماً');
console.log('📱 نفس WebSocket endpoint ونفس الرسائل');
console.log('');

simulateFlutterDriverConnection();
