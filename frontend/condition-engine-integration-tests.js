// WizzCentral Campaign Condition Engine - Integration Test Suite
// Comprehensive testing of condition evaluation in real campaign scenarios
// Author: WizzCentral Dev Team
// Version: 1.0

class ConditionEngineIntegrationTests {
    constructor(conditionEngine, campaignManager) {
        this.conditionEngine = conditionEngine;
        this.campaignManager = campaignManager;
        this.testResults = new Map();
        this.testScenarios = [];
        this.mockData = new Map();
        this.setupMockData();
        this.setupTestScenarios();
    }

    // ============ MOCK DATA SETUP ============

    setupMockData() {
        // Mock customer profiles
        this.mockData.set('customers', [
            {
                id: 'customer_new_001',
                registeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                totalOrders: 0,
                totalSpent: 0,
                lastOrderDate: null,
                preferredRestaurants: [],
                location: { city: 'Baghdad', area: 'Karrada' },
                vipStatus: false
            },
            {
                id: 'customer_vip_001',
                registeredAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
                totalOrders: 85,
                totalSpent: 2840.50,
                lastOrderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                preferredRestaurants: ['restaurant_001', 'restaurant_002'],
                location: { city: 'Baghdad', area: 'Mansour' },
                vipStatus: true
            },
            {
                id: 'customer_frequent_001',
                registeredAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
                totalOrders: 15,
                totalSpent: 485.75,
                lastOrderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
                preferredRestaurants: ['restaurant_003'],
                location: { city: 'Baghdad', area: 'Jadiriyah' },
                vipStatus: false
            },
            {
                id: 'customer_inactive_001',
                registeredAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(), // 10 months ago
                totalOrders: 3,
                totalSpent: 95.25,
                lastOrderDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months ago
                preferredRestaurants: [],
                location: { city: 'Baghdad', area: 'Saydiya' },
                vipStatus: false
            }
        ]);

        // Mock order contexts
        this.mockData.set('orders', [
            {
                id: 'order_001',
                customerId: 'customer_new_001',
                restaurantId: 'restaurant_001',
                totalAmount: 35.50,
                items: [
                    { id: 'item_001', name: 'Pizza Margherita', price: 18.50, category: 'pizza' },
                    { id: 'item_002', name: 'Coca Cola', price: 3.00, category: 'beverage' }
                ],
                timestamp: new Date().toISOString(),
                deliveryTime: '18:30'
            },
            {
                id: 'order_002',
                customerId: 'customer_vip_001',
                restaurantId: 'restaurant_002',
                totalAmount: 85.75,
                items: [
                    { id: 'item_003', name: 'Grilled Salmon', price: 45.00, category: 'seafood' },
                    { id: 'item_004', name: 'Caesar Salad', price: 15.75, category: 'salad' }
                ],
                timestamp: new Date().toISOString(),
                deliveryTime: '19:45'
            },
            {
                id: 'order_003',
                customerId: 'customer_frequent_001',
                restaurantId: 'restaurant_003',
                totalAmount: 22.25,
                items: [
                    { id: 'item_005', name: 'Chicken Shawarma', price: 12.50, category: 'middle_eastern' },
                    { id: 'item_006', name: 'Fries', price: 4.75, category: 'sides' }
                ],
                timestamp: new Date().toISOString(),
                deliveryTime: '20:15'
            }
        ]);

        // Mock restaurants
        this.mockData.set('restaurants', [
            {
                id: 'restaurant_001',
                name: 'Mario\'s Pizza Palace',
                location: { city: 'Baghdad', area: 'Karrada' },
                cuisine: 'Italian',
                rating: 4.5,
                isPartner: true
            },
            {
                id: 'restaurant_002',
                name: 'Ocean Breeze Restaurant',
                location: { city: 'Baghdad', area: 'Mansour' },
                cuisine: 'Seafood',
                rating: 4.8,
                isPartner: true
            },
            {
                id: 'restaurant_003',
                name: 'Baghdad Shawarma House',
                location: { city: 'Baghdad', area: 'Jadiriyah' },
                cuisine: 'Middle Eastern',
                rating: 4.2,
                isPartner: false
            }
        ]);
    }

    // ============ TEST SCENARIO SETUP ============

    setupTestScenarios() {
        this.testScenarios = [
            {
                id: 'scenario_new_customer_welcome',
                name: 'New Customer Welcome Campaign',
                description: 'Test targeting of brand new customers with first-order incentives',
                campaign: {
                    name: 'Welcome New Customers',
                    conditions: {
                        operator: 'AND',
                        rules: [
                            { condition_id: 'new_customer', parameters: {} },
                            { condition_id: 'minimum_order_value', parameters: { amount: 25 } }
                        ]
                    },
                    discount: { type: 'percentage', value: 20, max_amount: 10 }
                },
                testCases: [
                    {
                        customer: 'customer_new_001',
                        order: 'order_001',
                        expectedResult: true,
                        expectedDiscount: 7.10, // 20% of 35.50
                        description: 'New customer with qualifying order'
                    },
                    {
                        customer: 'customer_vip_001',
                        order: 'order_002',
                        expectedResult: false,
                        expectedDiscount: 0,
                        description: 'VIP customer should not qualify for new customer offer'
                    }
                ]
            },
            {
                id: 'scenario_vip_exclusive',
                name: 'VIP Customer Exclusive Offers',
                description: 'Test targeting of VIP customers with premium benefits',
                campaign: {
                    name: 'VIP Exclusive Deals',
                    conditions: {
                        operator: 'AND',
                        rules: [
                            { condition_id: 'vip_customer', parameters: {} },
                            { condition_id: 'order_value_range', parameters: { min_amount: 50, max_amount: 200 } }
                        ]
                    },
                    discount: { type: 'fixed', value: 15 }
                },
                testCases: [
                    {
                        customer: 'customer_vip_001',
                        order: 'order_002',
                        expectedResult: true,
                        expectedDiscount: 15,
                        description: 'VIP customer with qualifying high-value order'
                    },
                    {
                        customer: 'customer_new_001',
                        order: 'order_001',
                        expectedResult: false,
                        expectedDiscount: 0,
                        description: 'Non-VIP customer should not qualify'
                    }
                ]
            },
            {
                id: 'scenario_restaurant_specific',
                name: 'Restaurant-Specific Promotions',
                description: 'Test targeting customers ordering from specific partner restaurants',
                campaign: {
                    name: 'Partner Restaurant Boost',
                    conditions: {
                        operator: 'AND',
                        rules: [
                            { condition_id: 'specific_restaurant', parameters: { restaurant_id: 'restaurant_001' } },
                            { condition_id: 'time_window', parameters: { start_hour: 17, end_hour: 21 } }
                        ]
                    },
                    discount: { type: 'percentage', value: 15 }
                },
                testCases: [
                    {
                        customer: 'customer_new_001',
                        order: 'order_001',
                        expectedResult: true,
                        expectedDiscount: 5.33, // 15% of 35.50
                        description: 'Order from target restaurant during dinner hours'
                    },
                    {
                        customer: 'customer_frequent_001',
                        order: 'order_003',
                        expectedResult: false,
                        expectedDiscount: 0,
                        description: 'Order from different restaurant'
                    }
                ]
            },
            {
                id: 'scenario_reactivation',
                name: 'Customer Reactivation Campaign',
                description: 'Test targeting inactive customers to encourage return',
                campaign: {
                    name: 'Come Back Special',
                    conditions: {
                        operator: 'AND',
                        rules: [
                            { condition_id: 'days_since_last_order', parameters: { days: 30 } },
                            { condition_id: 'total_order_count', parameters: { min_orders: 1, max_orders: 10 } }
                        ]
                    },
                    discount: { type: 'percentage', value: 25, max_amount: 20 }
                },
                testCases: [
                    {
                        customer: 'customer_inactive_001',
                        order: 'order_003',
                        expectedResult: true,
                        expectedDiscount: 5.56, // 25% of 22.25
                        description: 'Inactive customer making return order'
                    },
                    {
                        customer: 'customer_frequent_001',
                        order: 'order_003',
                        expectedResult: false,
                        expectedDiscount: 0,
                        description: 'Recently active customer should not qualify'
                    }
                ]
            },
            {
                id: 'scenario_complex_segmentation',
                name: 'Complex Multi-Condition Targeting',
                description: 'Test complex condition combinations with OR/AND operators',
                campaign: {
                    name: 'Smart Targeting Campaign',
                    conditions: {
                        operator: 'OR',
                        rules: [
                            {
                                operator: 'AND',
                                rules: [
                                    { condition_id: 'new_customer', parameters: {} },
                                    { condition_id: 'minimum_order_value', parameters: { amount: 30 } }
                                ]
                            },
                            {
                                operator: 'AND',
                                rules: [
                                    { condition_id: 'vip_customer', parameters: {} },
                                    { condition_id: 'partner_restaurant', parameters: {} }
                                ]
                            }
                        ]
                    },
                    discount: { type: 'percentage', value: 12 }
                },
                testCases: [
                    {
                        customer: 'customer_new_001',
                        order: 'order_001',
                        expectedResult: true,
                        expectedDiscount: 4.26, // 12% of 35.50
                        description: 'New customer branch of OR condition'
                    },
                    {
                        customer: 'customer_vip_001',
                        order: 'order_002',
                        expectedResult: true,
                        expectedDiscount: 10.29, // 12% of 85.75
                        description: 'VIP customer at partner restaurant branch'
                    },
                    {
                        customer: 'customer_frequent_001',
                        order: 'order_003',
                        expectedResult: false,
                        expectedDiscount: 0,
                        description: 'Customer does not match either OR branch'
                    }
                ]
            }
        ];
    }

    // ============ TEST EXECUTION ============

    async runAllTests() {
        console.log('🧪 Starting WizzCentral Condition Engine Integration Tests');
        console.log('=' * 60);

        const startTime = Date.now();
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;

        for (const scenario of this.testScenarios) {
            console.log(`\n📋 Testing Scenario: ${scenario.name}`);
            console.log(`📄 ${scenario.description}`);
            
            const scenarioResults = await this.runScenario(scenario);
            
            totalTests += scenarioResults.totalTests;
            passedTests += scenarioResults.passedTests;
            failedTests += scenarioResults.failedTests;
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log('\n' + '=' * 60);
        console.log('📊 INTEGRATION TEST RESULTS SUMMARY');
        console.log('=' * 60);
        console.log(`✅ Passed: ${passedTests}/${totalTests}`);
        console.log(`❌ Failed: ${failedTests}/${totalTests}`);
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        // Performance benchmarks
        await this.runPerformanceTests();

        // Edge case testing
        await this.runEdgeCaseTests();

        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: passedTests / totalTests,
            duration,
            scenarioResults: Array.from(this.testResults.values())
        };
    }

    async runScenario(scenario) {
        const results = {
            scenarioId: scenario.id,
            scenarioName: scenario.name,
            totalTests: scenario.testCases.length,
            passedTests: 0,
            failedTests: 0,
            testResults: []
        };

        for (const testCase of scenario.testCases) {
            const testResult = await this.runTestCase(scenario, testCase);
            results.testResults.push(testResult);
            
            if (testResult.passed) {
                results.passedTests++;
                console.log(`  ✅ ${testCase.description}`);
            } else {
                results.failedTests++;
                console.log(`  ❌ ${testCase.description}`);
                console.log(`     Expected: ${testCase.expectedResult}, Got: ${testResult.actualResult}`);
                if (testResult.error) {
                    console.log(`     Error: ${testResult.error}`);
                }
            }
        }

        this.testResults.set(scenario.id, results);
        return results;
    }

    async runTestCase(scenario, testCase) {
        try {
            // Get mock data
            const customer = this.getCustomer(testCase.customer);
            const order = this.getOrder(testCase.order);
            const restaurant = this.getRestaurant(order.restaurantId);

            // Create campaign if not exists
            const campaign = await this.createTestCampaign(scenario.campaign);

            // Evaluate conditions
            const evaluationResult = await this.conditionEngine.evaluateConditions(
                campaign.conditions,
                customer,
                order,
                restaurant,
                { timestamp: order.timestamp }
            );

            // Calculate expected vs actual results
            const actualResult = evaluationResult.eligible;
            const actualDiscount = evaluationResult.discount ? evaluationResult.discount.amount : 0;

            const passed = (actualResult === testCase.expectedResult) &&
                          (Math.abs(actualDiscount - testCase.expectedDiscount) < 0.01);

            return {
                testCaseId: `${scenario.id}_${testCase.customer}_${testCase.order}`,
                description: testCase.description,
                passed,
                expectedResult: testCase.expectedResult,
                actualResult,
                expectedDiscount: testCase.expectedDiscount,
                actualDiscount,
                executionTime: evaluationResult.executionTime || 0,
                conditionDetails: evaluationResult.conditionResults
            };

        } catch (error) {
            return {
                testCaseId: `${scenario.id}_${testCase.customer}_${testCase.order}`,
                description: testCase.description,
                passed: false,
                error: error.message,
                expectedResult: testCase.expectedResult,
                actualResult: null
            };
        }
    }

    // ============ PERFORMANCE TESTING ============

    async runPerformanceTests() {
        console.log('\n🚀 PERFORMANCE TESTING');
        console.log('=' * 30);

        const performanceScenarios = [
            {
                name: 'Single Condition Evaluation',
                test: () => this.benchmarkSingleCondition(),
                target: 5 // ms
            },
            {
                name: 'Complex Condition Evaluation',
                test: () => this.benchmarkComplexCondition(),
                target: 15 // ms
            },
            {
                name: 'Batch Evaluation (100 customers)',
                test: () => this.benchmarkBatchEvaluation(100),
                target: 500 // ms
            },
            {
                name: 'Concurrent Evaluation (10 threads)',
                test: () => this.benchmarkConcurrentEvaluation(10),
                target: 100 // ms
            }
        ];

        for (const scenario of performanceScenarios) {
            const startTime = performance.now();
            await scenario.test();
            const endTime = performance.now();
            const duration = endTime - startTime;

            const status = duration <= scenario.target ? '✅' : '⚠️';
            console.log(`${status} ${scenario.name}: ${duration.toFixed(2)}ms (target: ${scenario.target}ms)`);
        }
    }

    async benchmarkSingleCondition() {
        const customer = this.getCustomer('customer_new_001');
        const order = this.getOrder('order_001');
        
        const condition = {
            condition_id: 'new_customer',
            parameters: {}
        };

        return await this.conditionEngine.evaluateCondition(condition, customer, order);
    }

    async benchmarkComplexCondition() {
        const customer = this.getCustomer('customer_vip_001');
        const order = this.getOrder('order_002');
        
        const conditions = {
            operator: 'AND',
            rules: [
                { condition_id: 'vip_customer', parameters: {} },
                { condition_id: 'minimum_order_value', parameters: { amount: 50 } },
                { condition_id: 'time_window', parameters: { start_hour: 17, end_hour: 22 } },
                { condition_id: 'partner_restaurant', parameters: {} }
            ]
        };

        return await this.conditionEngine.evaluateConditions(conditions, customer, order);
    }

    async benchmarkBatchEvaluation(customerCount) {
        const customers = Array.from({ length: customerCount }, (_, i) => ({
            ...this.getCustomer('customer_new_001'),
            id: `batch_customer_${i}`
        }));

        const condition = {
            condition_id: 'new_customer',
            parameters: {}
        };

        const promises = customers.map(customer => 
            this.conditionEngine.evaluateCondition(condition, customer, this.getOrder('order_001'))
        );

        return await Promise.all(promises);
    }

    async benchmarkConcurrentEvaluation(threadCount) {
        const threads = Array.from({ length: threadCount }, () => 
            this.benchmarkComplexCondition()
        );

        return await Promise.all(threads);
    }

    // ============ EDGE CASE TESTING ============

    async runEdgeCaseTests() {
        console.log('\n🔍 EDGE CASE TESTING');
        console.log('=' * 25);

        const edgeCases = [
            {
                name: 'Null Customer Data',
                test: () => this.testNullCustomerData(),
                shouldFail: true
            },
            {
                name: 'Invalid Condition Parameters',
                test: () => this.testInvalidConditionParameters(),
                shouldFail: true
            },
            {
                name: 'Missing Restaurant Data',
                test: () => this.testMissingRestaurantData(),
                shouldFail: false
            },
            {
                name: 'Circular Condition Dependencies',
                test: () => this.testCircularDependencies(),
                shouldFail: true
            },
            {
                name: 'Extremely Large Order Value',
                test: () => this.testExtremeValues(),
                shouldFail: false
            }
        ];

        for (const edgeCase of edgeCases) {
            try {
                await edgeCase.test();
                const status = edgeCase.shouldFail ? '❌' : '✅';
                console.log(`${status} ${edgeCase.name}: ${edgeCase.shouldFail ? 'Unexpectedly succeeded' : 'Handled correctly'}`);
            } catch (error) {
                const status = edgeCase.shouldFail ? '✅' : '❌';
                console.log(`${status} ${edgeCase.name}: ${edgeCase.shouldFail ? 'Failed as expected' : `Unexpected error: ${error.message}`}`);
            }
        }
    }

    async testNullCustomerData() {
        const conditions = {
            operator: 'AND',
            rules: [{ condition_id: 'new_customer', parameters: {} }]
        };

        return await this.conditionEngine.evaluateConditions(
            conditions,
            null, // null customer
            this.getOrder('order_001')
        );
    }

    async testInvalidConditionParameters() {
        const conditions = {
            operator: 'AND',
            rules: [
                { 
                    condition_id: 'minimum_order_value', 
                    parameters: { amount: 'invalid_amount' } // string instead of number
                }
            ]
        };

        return await this.conditionEngine.evaluateConditions(
            conditions,
            this.getCustomer('customer_new_001'),
            this.getOrder('order_001')
        );
    }

    async testMissingRestaurantData() {
        const order = {
            ...this.getOrder('order_001'),
            restaurantId: 'nonexistent_restaurant'
        };

        const conditions = {
            operator: 'AND',
            rules: [{ condition_id: 'partner_restaurant', parameters: {} }]
        };

        return await this.conditionEngine.evaluateConditions(
            conditions,
            this.getCustomer('customer_new_001'),
            order
        );
    }

    async testCircularDependencies() {
        // This would test the engine's ability to detect circular references
        // in complex condition hierarchies
        const conditions = {
            operator: 'AND',
            rules: [
                {
                    operator: 'OR',
                    rules: [
                        {
                            operator: 'AND',
                            rules: [
                                { condition_id: 'new_customer', parameters: {} }
                                // Circular reference would be detected here
                            ]
                        }
                    ]
                }
            ]
        };

        return await this.conditionEngine.evaluateConditions(
            conditions,
            this.getCustomer('customer_new_001'),
            this.getOrder('order_001')
        );
    }

    async testExtremeValues() {
        const extremeOrder = {
            ...this.getOrder('order_001'),
            totalAmount: 999999.99 // Extremely large order
        };

        const conditions = {
            operator: 'AND',
            rules: [
                { condition_id: 'minimum_order_value', parameters: { amount: 1000000 } }
            ]
        };

        return await this.conditionEngine.evaluateConditions(
            conditions,
            this.getCustomer('customer_new_001'),
            extremeOrder
        );
    }

    // ============ HELPER METHODS ============

    getCustomer(customerId) {
        const customers = this.mockData.get('customers');
        return customers.find(c => c.id === customerId);
    }

    getOrder(orderId) {
        const orders = this.mockData.get('orders');
        return orders.find(o => o.id === orderId);
    }

    getRestaurant(restaurantId) {
        const restaurants = this.mockData.get('restaurants');
        return restaurants.find(r => r.id === restaurantId);
    }

    async createTestCampaign(campaignData) {
        // In real implementation, this would create a test campaign
        // For now, we'll just return the campaign data with an ID
        return {
            id: `test_campaign_${Date.now()}`,
            ...campaignData
        };
    }

    // ============ REPORTING ============

    generateDetailedReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalScenarios: this.testScenarios.length,
                results: Array.from(this.testResults.values())
            },
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Analyze test results for recommendations
        this.testResults.forEach((scenario) => {
            if (scenario.failedTests > 0) {
                recommendations.push({
                    type: 'bug_fix',
                    priority: 'high',
                    scenario: scenario.scenarioId,
                    message: `${scenario.failedTests} test(s) failed in ${scenario.scenarioName}. Investigate condition logic.`
                });
            }

            // Check performance
            const avgExecutionTime = scenario.testResults.reduce((sum, test) => 
                sum + (test.executionTime || 0), 0) / scenario.testResults.length;

            if (avgExecutionTime > 10) {
                recommendations.push({
                    type: 'performance',
                    priority: 'medium',
                    scenario: scenario.scenarioId,
                    message: `Average execution time (${avgExecutionTime.toFixed(2)}ms) exceeds threshold. Consider optimization.`
                });
            }
        });

        return recommendations;
    }
}

// Export for use
window.ConditionEngineIntegrationTests = ConditionEngineIntegrationTests;

// Auto-run tests if condition engine is available
document.addEventListener('DOMContentLoaded', () => {
    if (window.CampaignConditionEngine && window.CampaignManager) {
        console.log('🎯 Condition Engine Integration Tests Ready');
        console.log('Run window.runConditionEngineTests() to start testing');
        
        window.runConditionEngineTests = async () => {
            const conditionEngine = new CampaignConditionEngine();
            const campaignManager = new CampaignManager();
            const tests = new ConditionEngineIntegrationTests(conditionEngine, campaignManager);
            
            return await tests.runAllTests();
        };
    }
});
