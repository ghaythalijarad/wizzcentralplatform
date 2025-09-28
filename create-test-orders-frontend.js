#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function createTestOrdersForFrontend() {
    console.log('🚀 Creating test orders for WizzCentral frontend...');
    
    const orders = [
        {
            PK: `ORDER#TEST_ORDER_001_${Date.now()}`,
            SK: 'META',
            orderId: `TEST_ORDER_001_${Date.now()}`,
            status: 'confirmed',
            customerName: 'علي احمد محمد',
            customerPhone: '+964 770 123 4567',
            storeName: 'مطعم بغداد المركزي',
            businessName: 'مطعم بغداد المركزي',
            total: 35000,
            totalAmount: 35000,
            currency: 'IQD',
            paymentMethod: 'cash_on_delivery',
            deliveryAddress: {
                street: 'شارع الرشيد',
                area: 'الكرادة الشرقية',
                city: 'بغداد',
                governorate: 'بغداد'
            },
            items: [
                {
                    name: 'كباب عراقي',
                    quantity: 2,
                    price: 15000,
                    total: 30000
                },
                {
                    name: 'عيش تميس',
                    quantity: 1,
                    price: 5000,
                    total: 5000
                }
            ],
            createdAt: new Date().toISOString(),
            confirmedAt: new Date().toISOString(),
            entityType: 'order'
        },
        {
            PK: `ORDER#TEST_ORDER_002_${Date.now()}`,
            SK: 'META',
            orderId: `TEST_ORDER_002_${Date.now()}`,
            status: 'ready_for_pickup',
            customerName: 'فاطمة حسين علي',
            customerPhone: '+964 780 567 8901',
            storeName: 'مطعم النجف الاشرف',
            businessName: 'مطعم النجف الاشرف',
            total: 42000,
            totalAmount: 42000,
            currency: 'IQD',
            paymentMethod: 'zain_cash',
            deliveryAddress: {
                street: 'شارع الكوفة',
                area: 'حي الأنصار',
                city: 'النجف',
                governorate: 'النجف'
            },
            items: [
                {
                    name: 'مقلوبة لحم',
                    quantity: 1,
                    price: 25000,
                    total: 25000
                },
                {
                    name: 'شوربة عدس',
                    quantity: 2,
                    price: 8500,
                    total: 17000
                }
            ],
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            confirmedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            entityType: 'order'
        },
        {
            PK: `ORDER#TEST_ORDER_003_${Date.now()}`,
            SK: 'META', 
            orderId: `TEST_ORDER_003_${Date.now()}`,
            status: 'out_for_delivery',
            customerName: 'محمد عبد الله جاسم',
            customerPhone: '+964 790 234 5678',
            storeName: 'مطعم البصرة للسمك',
            businessName: 'مطعم البصرة للسمك',
            total: 58000,
            totalAmount: 58000,
            currency: 'IQD',
            paymentMethod: 'cash_on_delivery',
            deliveryAddress: {
                street: 'شارع الكورنيش',
                area: 'حي الجمهورية',
                city: 'البصرة',
                governorate: 'البصرة'
            },
            items: [
                {
                    name: 'سمك مسقوف',
                    quantity: 1,
                    price: 45000,
                    total: 45000
                },
                {
                    name: 'رز عنبر',
                    quantity: 1,
                    price: 8000,
                    total: 8000
                },
                {
                    name: 'سلطة',
                    quantity: 1,
                    price: 5000,
                    total: 5000
                }
            ],
            driverId: 'DRIVER_001',
            assignedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
            createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
            confirmedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
            entityType: 'order'
        }
    ];

    try {
        for (const order of orders) {
            await docClient.send(new PutCommand({
                TableName: 'WizzOrders',
                Item: order
            }));
            
            console.log(`✅ Created order: ${order.orderId}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Customer: ${order.customerName}`);
            console.log(`   Store: ${order.storeName}`);
            console.log(`   Total: ${order.total.toLocaleString()} ${order.currency}`);
            console.log('');
        }
        
        console.log(`🎉 Successfully created ${orders.length} test orders for the frontend!`);
        console.log('📱 You can now test the orders management page.');
        
    } catch (error) {
        console.error('❌ Error creating test orders:', error);
        throw error;
    }
}

createTestOrdersForFrontend()
    .then(() => {
        console.log('\n✅ Test orders creation complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Failed to create test orders:', error);
        process.exit(1);
    });
