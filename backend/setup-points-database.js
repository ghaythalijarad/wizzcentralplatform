#!/usr/bin/env node
/**
 * إعداد جداول النقاط في قاعدة البيانات
 * Setup Customer Points Tables in DynamoDB
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

// Configure AWS SDK
const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
});

const CUSTOMER_POINTS_TABLE = 'WizzUser_customer_points_dev';
const POINTS_TRANSACTIONS_TABLE = 'WizzUser_points_transactions_dev';

async function createCustomerPointsTables() {
    console.log('🏗️ إنشاء جداول النقاط...');
    console.log('🏗️ Creating Customer Points Tables...');
    
    try {
        // 1. جدول رصيد النقاط للعملاء - Customer Points Balance Table
        const pointsBalanceTable = {
            TableName: CUSTOMER_POINTS_TABLE,
            KeySchema: [
                { AttributeName: 'customerId', KeyType: 'HASH' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'customerId', AttributeType: 'S' }
            ],
            BillingMode: 'PAY_PER_REQUEST',
            Tags: [
                { Key: 'Environment', Value: 'dev' },
                { Key: 'Service', Value: 'CustomerLoyalty' },
                { Key: 'Platform', Value: 'WizzCentral' }
            ]
        };

        try {
            await ddbClient.send(new CreateTableCommand(pointsBalanceTable));
            console.log('✅ جدول رصيد النقاط تم إنشاؤه بنجاح');
            console.log('✅ Customer Points Balance table created successfully');
        } catch (error) {
            if (error.name === 'ResourceInUseException') {
                console.log('ℹ️ جدول رصيد النقاط موجود مسبقاً');
                console.log('ℹ️ Customer Points Balance table already exists');
            } else {
                throw error;
            }
        }

        // 2. جدول تاريخ معاملات النقاط - Points Transaction History Table
        const transactionsTable = {
            TableName: POINTS_TRANSACTIONS_TABLE,
            KeySchema: [
                { AttributeName: 'customerId', KeyType: 'HASH' },
                { AttributeName: 'transactionId', KeyType: 'RANGE' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'customerId', AttributeType: 'S' },
                { AttributeName: 'transactionId', AttributeType: 'S' },
                { AttributeName: 'timestamp', AttributeType: 'S' },
                { AttributeName: 'orderId', AttributeType: 'S' }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'TimestampIndex',
                    KeySchema: [
                        { AttributeName: 'customerId', KeyType: 'HASH' },
                        { AttributeName: 'timestamp', KeyType: 'RANGE' }
                    ],
                    Projection: { ProjectionType: 'ALL' }
                },
                {
                    IndexName: 'OrderIndex',
                    KeySchema: [
                        { AttributeName: 'orderId', KeyType: 'HASH' }
                    ],
                    Projection: { ProjectionType: 'ALL' }
                }
            ],
            BillingMode: 'PAY_PER_REQUEST',
            Tags: [
                { Key: 'Environment', Value: 'dev' },
                { Key: 'Service', Value: 'CustomerLoyalty' },
                { Key: 'Platform', Value: 'WizzCentral' }
            ]
        };

        try {
            await ddbClient.send(new CreateTableCommand(transactionsTable));
            console.log('✅ جدول معاملات النقاط تم إنشاؤه بنجاح');
            console.log('✅ Points Transactions table created successfully');
        } catch (error) {
            if (error.name === 'ResourceInUseException') {
                console.log('ℹ️ جدول معاملات النقاط موجود مسبقاً');
                console.log('ℹ️ Points Transactions table already exists');
            } else {
                throw error;
            }
        }

        console.log('');
        console.log('🎉 إعداد جداول النقاط مكتمل!');
        console.log('🎉 Customer Points Tables setup complete!');
        console.log('');
        console.log('📊 الجداول المُنشأة / Created Tables:');
        console.log(`   - ${CUSTOMER_POINTS_TABLE} (رصيد النقاط / Points Balance)`);
        console.log(`   - ${POINTS_TRANSACTIONS_TABLE} (تاريخ المعاملات / Transaction History)`);
        console.log('');

    } catch (error) {
        console.error('❌ خطأ في إنشاء الجداول / Error creating tables:', error);
        throw error;
    }
}

// معلومات هيكل الجداول / Table Schemas
const CUSTOMER_POINTS_SCHEMA = {
    customerId: 'String',           // Primary key - معرف العميل
    totalPoints: 'Number',          // Current points balance - رصيد النقاط الحالي
    lifetimePointsEarned: 'Number', // Total points ever earned - إجمالي النقاط المكتسبة
    lifetimePointsRedeemed: 'Number', // Total points ever spent - إجمالي النقاط المستردة
    vipStatus: 'Boolean',           // True if VIP customer - حالة VIP
    tierLevel: 'String',            // regular, silver, gold, platinum - المستوى
    lastEarnedDate: 'String',       // ISO timestamp - آخر كسب نقاط
    lastRedeemedDate: 'String',     // ISO timestamp - آخر استرداد نقاط
    createdAt: 'String',            // Account creation - تاريخ إنشاء الحساب
    updatedAt: 'String'             // Last update - آخر تحديث
};

const POINTS_TRANSACTION_SCHEMA = {
    customerId: 'String',           // Partition key - معرف العميل
    transactionId: 'String',        // Sort key (timestamp-uuid) - معرف المعاملة
    orderId: 'String',              // Related order ID - معرف الطلب المرتبط
    transactionType: 'String',      // 'earned', 'redeemed', 'expired', 'bonus' - نوع المعاملة
    pointsAmount: 'Number',         // Positive for earned, negative for redeemed - عدد النقاط
    orderAmount: 'Number',          // Original order amount in IQD - مبلغ الطلب الأصلي
    actualAmountPaid: 'Number',     // Amount after discounts - المبلغ المدفوع فعلياً
    paymentMethod: 'String',        // card, cash, zain_cash - طريقة الدفع
    description: 'String',          // Human readable description - وصف المعاملة
    timestamp: 'String',            // ISO timestamp - وقت المعاملة
    metadata: 'Object'              // Additional data - بيانات إضافية
};

if (require.main === module) {
    createCustomerPointsTables()
        .then(() => {
            console.log('✅ إكتمل إعداد قاعدة البيانات / Database setup completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ فشل إعداد قاعدة البيانات / Database setup failed:', error);
            process.exit(1);
        });
}

module.exports = {
    createCustomerPointsTables,
    CUSTOMER_POINTS_TABLE,
    POINTS_TRANSACTIONS_TABLE,
    CUSTOMER_POINTS_SCHEMA,
    POINTS_TRANSACTION_SCHEMA
};
