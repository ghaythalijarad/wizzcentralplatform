/**
 * نقاط النهاية المُصححة لنظام النقاط
 * Fixed Customer Points API Endpoints
 * WizzCentral Platform
 */

// Import fixed customer points service
const { 
    awardPointsForOrder, 
    redeemCustomerPoints, 
    getCustomerPointsBalance,
    getPointsTransactionHistory,
    getPointsStatistics,
    CUSTOMER_POINTS_TABLE,
    POINTS_TRANSACTIONS_TABLE,
    POINTS_CONFIG
} = require('./src/services/customer-points-service-fixed.js');

/**
 * تسجيل نقاط النهاية للنقاط المُصححة
 * Register fixed customer points endpoints
 */
function registerFixedPointsEndpoints(app) {
    console.log('🎯 تسجيل نقاط النهاية المُصححة للنقاط...');
    console.log('🎯 Registering fixed customer points endpoints...');

    // ============================================
    // FIXED CUSTOMER POINTS API ENDPOINTS
    // ============================================

    // Get customer points balance from dedicated points table
    app.get('/api/customers/:customerId/points', async (req, res) => {
        try {
            const { customerId } = req.params;
            console.log(`🎯 جلب رصيد النقاط للعميل: ${customerId}`);
            console.log(`🎯 Getting points balance for customer: ${customerId}`);
            
            const pointsData = await getCustomerPointsBalance(customerId);
            
            res.json({
                success: true,
                data: pointsData,
                source: 'dedicated-points-table',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ خطأ في جلب نقاط العميل:', error);
            console.error('❌ Error fetching customer points:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في الخادم / Server error',
                message: error.message
            });
        }
    });

    // Redeem customer points
    app.post('/api/customers/redeem-points', async (req, res) => {
        try {
            const { customerId, pointsAmount, pointsToRedeem, orderId, description } = req.body;
            
            // Accept both field names for compatibility
            const pointsToRedeemValue = pointsAmount || pointsToRedeem;
            
            console.log(`💳 استهلاك النقاط: ${pointsToRedeemValue} للعميل ${customerId}`);
            console.log(`💳 Redeeming points: ${pointsToRedeemValue} for customer ${customerId}`);
            
            // التحقق من البيانات المطلوبة - Validate required data
            if (!customerId || !pointsToRedeemValue || pointsToRedeemValue <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'بيانات غير صحيحة / Invalid data',
                    message: 'Customer ID and positive points amount are required'
                });
            }

            const result = await redeemCustomerPoints(
                customerId, 
                pointsToRedeemValue, 
                orderId, 
                description || `استهلاك ${pointsToRedeemValue} نقطة / Redeemed ${pointsToRedeemValue} points`
            );
            
            if (result.success) {
                console.log(`✅ تم استهلاك ${pointsToRedeemValue} نقطة بنجاح`);
                console.log(`✅ Successfully redeemed ${pointsToRedeemValue} points`);
                res.json({
                    ...result,
                    source: 'dedicated-points-table',
                    timestamp: new Date().toISOString()
                });
            } else {
                console.log(`⚠️ فشل في استهلاك النقاط: ${result.error}`);
                console.log(`⚠️ Failed to redeem points: ${result.error}`);
                res.status(400).json({
                    ...result,
                    source: 'dedicated-points-table',
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('❌ خطأ في استهلاك النقاط:', error);
            console.error('❌ Error redeeming points:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في الخادم / Server error',
                message: error.message
            });
        }
    });

    // Award points for completed order
    app.post('/api/orders/:orderId/award-points', async (req, res) => {
        try {
            const { orderId } = req.params;
            const { customerId } = req.body;
            
            console.log(`🎯 منح نقاط للطلب ${orderId} للعميل ${customerId}`);
            console.log(`🎯 Awarding points for order ${orderId} to customer ${customerId}`);
            
            if (!customerId) {
                return res.status(400).json({
                    success: false,
                    error: 'معرف العميل مطلوب / Customer ID required'
                });
            }
            
            const result = await awardPointsForOrder(customerId, orderId);
            
            if (result.success) {
                console.log(`✅ تم منح ${result.pointsEarned} نقطة للعميل ${customerId}`);
                console.log(`✅ Awarded ${result.pointsEarned} points to customer ${customerId}`);
            }
            
            res.json({
                ...result,
                source: 'dedicated-points-table',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ خطأ في منح النقاط:', error);
            console.error('❌ Error awarding points:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في الخادم / Server error',
                message: error.message
            });
        }
    });

    // Get customer points transaction history
    app.get('/api/customers/:customerId/points-history', async (req, res) => {
        try {
            const { customerId } = req.params;
            const limit = parseInt(req.query.limit) || 50;
            
            console.log(`📊 جلب تاريخ النقاط للعميل: ${customerId}`);
            console.log(`📊 Getting points history for customer: ${customerId}`);
            
            const result = await getPointsTransactionHistory(customerId, limit);
            
            if (result.success) {
                res.json({
                    success: true,
                    customerId,
                    transactions: result.transactions,
                    count: result.transactions.length,
                    source: 'dedicated-points-table',
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: result.error,
                    customerId
                });
            }
        } catch (error) {
            console.error('❌ خطأ في جلب تاريخ النقاط:', error);
            console.error('❌ Error fetching points history:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في الخادم / Server error',
                message: error.message
            });
        }
    });

    // Get points system statistics
    app.get('/api/points/statistics', async (req, res) => {
        try {
            console.log('📈 جلب إحصائيات نظام النقاط');
            console.log('📈 Getting points system statistics');
            
            const stats = await getPointsStatistics();
            
            res.json({
                success: true,
                statistics: stats,
                pointsConfig: POINTS_CONFIG,
                source: 'dedicated-points-table',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ خطأ في جلب إحصائيات النقاط:', error);
            console.error('❌ Error fetching points statistics:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في الخادم / Server error',
                message: error.message
            });
        }
    });

    // Migrate existing customer points (development utility)
    app.post('/api/points/migrate', async (req, res) => {
        try {
            console.log('🔄 بدء ترحيل النقاط الموجودة...');
            console.log('🔄 Starting existing points migration...');
            
            // This would implement migration from old calculation to new table
            // For now, return a placeholder response
            res.json({
                success: true,
                message: 'ترحيل النقاط جاهز للتنفيذ / Points migration ready for implementation',
                recommendation: 'تشغيل سكريبت إعداد قاعدة البيانات أولاً / Run database setup script first',
                nextSteps: [
                    'node backend/setup-points-database.js',
                    'Implement migration logic for existing customers',
                    'Update frontend to use new API endpoints'
                ]
            });
        } catch (error) {
            console.error('❌ خطأ في ترحيل النقاط:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في الخادم / Server error',
                message: error.message
            });
        }
    });

    // Test points system (development only)
    app.post('/api/points/test', async (req, res) => {
        try {
            const { customerId = 'test-customer-123', action = 'check' } = req.body;
            
            console.log(`🧪 اختبار نظام النقاط للعميل: ${customerId}`);
            console.log(`🧪 Testing points system for customer: ${customerId}`);
            
            const pointsBalance = await getCustomerPointsBalance(customerId);
            
            res.json({
                success: true,
                test: 'points-system',
                customerId,
                action,
                currentBalance: pointsBalance,
                systemConfig: POINTS_CONFIG,
                tables: {
                    pointsTable: CUSTOMER_POINTS_TABLE,
                    transactionsTable: POINTS_TRANSACTIONS_TABLE
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ خطأ في اختبار نظام النقاط:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في الخادم / Server error',
                message: error.message
            });
        }
    });

    // TEST ENDPOINT - Create test points data for development
    app.post('/api/points/create-test-data', async (req, res) => {
        try {
            console.log('🧪 إنشاء بيانات تجريبية للنقاط');
            console.log('🧪 Creating test points data');

            const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
            const { DynamoDBDocumentClient, UpdateCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
            
            const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
            const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

            // Test customers with different point levels
            const testCustomers = [
                { customerId: 'CUST001', points: 4000, orders: 3 },
                { customerId: 'CUST002', points: 800, orders: 1 },
                { customerId: 'CUST003', points: 8000, orders: 5 },
                { customerId: 'CUST004', points: 15000, orders: 8 }, // Gold tier
                { customerId: 'CUST005', points: 25000, orders: 12 } // Platinum tier
            ];

            const results = [];

            for (const customer of testCustomers) {
                // Determine tier and VIP status
                const vipStatus = customer.points >= 5000;
                let tierLevel = 'regular';
                if (customer.points >= 20000) tierLevel = 'platinum';
                else if (customer.points >= 10000) tierLevel = 'gold';
                else if (customer.points >= 5000) tierLevel = 'silver';

                // Update customer points
                const updateParams = {
                    TableName: CUSTOMER_POINTS_TABLE,
                    Key: { customerId: customer.customerId },
                    UpdateExpression: 'SET totalPoints = :points, lifetimePointsEarned = :points, vipStatus = :vip, tierLevel = :tier, lastEarnedDate = :now, updatedAt = :now',
                    ExpressionAttributeValues: {
                        ':points': customer.points,
                        ':vip': vipStatus,
                        ':tier': tierLevel,
                        ':now': new Date().toISOString()
                    }
                };

                await dynamoDB.send(new UpdateCommand(updateParams));

                // Create a sample transaction
                const transactionParams = {
                    TableName: POINTS_TRANSACTIONS_TABLE,
                    Item: {
                        customerId: customer.customerId,
                        transactionId: `TEST_${Date.now()}_${customer.customerId}`,
                        transactionType: 'earned',
                        pointsAmount: customer.points,
                        orderId: `TEST_ORDER_${customer.customerId}`,
                        orderAmount: customer.points * 10, // Simulate order amount
                        currency: 'IQD',
                        description: `Test points for ${customer.customerId}`,
                        createdAt: new Date().toISOString()
                    }
                };

                await dynamoDB.send(new PutCommand(transactionParams));

                results.push({
                    customerId: customer.customerId,
                    points: customer.points,
                    tierLevel,
                    vipStatus
                });

                console.log(`✅ Created test data for ${customer.customerId}: ${customer.points} points (${tierLevel})`);
            }

            res.json({
                success: true,
                message: 'تم إنشاء البيانات التجريبية بنجاح / Test data created successfully',
                testCustomers: results,
                source: 'dedicated-points-table',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ خطأ في إنشاء البيانات التجريبية:', error);
            console.error('❌ Error creating test data:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في إنشاء البيانات التجريبية / Error creating test data',
                message: error.message
            });
        }
    });

    console.log('✅ تم تسجيل جميع نقاط النهاية للنقاط المُصححة');
    console.log('✅ All fixed customer points endpoints registered');
}

module.exports = {
    registerFixedPointsEndpoints
};
