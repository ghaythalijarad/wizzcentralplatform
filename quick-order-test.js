#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { spawn } = require('child_process');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function createOrderAndTest() {
    const orderId = `ORDER_${Date.now()}`;
    
    console.log('🚀 إنشاء طلب جديد واختبار الإشعارات');
    console.log('=' * 50);
    console.log(`📦 رقم الطلب: ${orderId}`);
    
    try {
        // إنشاء الطلب
        const orderData = {
            PK: `ORDER#${orderId}`,
            SK: `ORDER#${orderId}`, 
            orderId: orderId,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            confirmedAt: new Date().toISOString(),
            
            customerName: 'علي حسن البصري',
            customerPhone: '+9647701234567',
            totalAmount: 42000,
            total: 42000,
            currency: 'IQD',
            
            pickupAddress: 'مطعم البصرة للسمك المسقوف - شارع الكورنيش',
            deliveryAddress: 'حي الجمهورية، شارع الاستقلال، بغداد',
            restaurantName: 'مطعم البصرة للسمك المسقوف',
            storeName: 'مطعم البصرة للسمك المسقوف',
            
            paymentMethod: 'CASH',
            entityType: 'order'
        };
        
        await docClient.send(new PutCommand({
            TableName: 'WizzOrders',
            Item: orderData
        }));
        
        console.log('✅ تم إنشاء الطلب بنجاح');
        console.log(`   👤 العميل: ${orderData.customerName}`);
        console.log(`   🏪 المطعم: ${orderData.restaurantName}`);
        console.log(`   💰 المبلغ: ${orderData.totalAmount.toLocaleString()} IQD`);
        
        // انتظار قليل ثم تشغيل سكريبت التعيين
        console.log('\n⏳ انتظار 3 ثوانِ ثم بدء تعيين السائق...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🎯 بدء عملية تعيين السائق...');
        
        // تشغيل سكريبت assign-driver-to-order
        const assignProcess = spawn('node', ['assign-driver-to-order.js', orderId], {
            cwd: '/Users/ghaythallaheebi/wizzcentralplatform',
            stdio: 'inherit'
        });
        
        assignProcess.on('close', (code) => {
            if (code === 0) {
                console.log('\n🎉 تم تعيين السائق بنجاح!');
                console.log('📱 تحقق من تطبيق WizzDriver للإشعار');
            } else {
                console.log(`\n⚠️ عملية التعيين انتهت بالكود: ${code}`);
            }
        });
        
        return orderId;
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء الطلب:', error);
        throw error;
    }
}

createOrderAndTest()
    .then(orderId => {
        console.log(`\n📋 تم إنشاء الطلب: ${orderId}`);
    })
    .catch(error => {
        console.error('❌ فشل الاختبار:', error);
        process.exit(1);
    });
