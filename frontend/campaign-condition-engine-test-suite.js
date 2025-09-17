// Comprehensive Test Suite for Campaign Condition Engine
// Tests sophisticated condition definitions and real-world scenarios
// Author: WizzCentral Dev Team

class CampaignConditionEngineTestSuite {
    constructor() {
        this.testResults = [];
        this.conditionEngine = null;
        this.dataService = null;
        this.startTime = null;
    }

    async initialize() {
        console.log('🚀 Initializing Campaign Condition Engine Test Suite...');
        this.startTime = Date.now();
        
        try {
            // Initialize condition engine
            if (window.CampaignConditionEngine) {
                this.conditionEngine = new window.CampaignConditionEngine();
                console.log('✅ Condition engine loaded');
            } else {
                throw new Error('CampaignConditionEngine not available');
            }

            // Initialize data service
            if (window.enhancedCampaignDataService) {
                this.dataService = window.enhancedCampaignDataService;
                await this.dataService.initialize();
                console.log('✅ Enhanced data service loaded');
            }

            console.log('✅ Test suite initialization complete');
            return true;
        } catch (error) {
            console.error('❌ Test suite initialization failed:', error);
            return false;
        }
    }

    // ============================================
    // TEST DATA GENERATORS
    // ============================================

    generateTestCustomer(profile = 'new') {
        const baseCustomer = {
            id: `test_customer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '+966501234567'
        };

        switch (profile) {
            case 'new':
                return {
                    ...baseCustomer,
                    registeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                    lastLoginAt: new Date().toISOString(),
                    preferredLanguage: 'en',
                    marketingConsent: true
                };

            case 'regular':
                return {
                    ...baseCustomer,
                    registeredAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 4 months ago
                    lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    preferredLanguage: 'ar',
                    marketingConsent: true
                };

            case 'vip':
                return {
                    ...baseCustomer,
                    registeredAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
                    lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    preferredLanguage: 'en',
                    marketingConsent: true
                };

            case 'inactive':
                return {
                    ...baseCustomer,
                    registeredAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), // 6+ months ago
                    lastLoginAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
                    preferredLanguage: 'ar',
                    marketingConsent: false
                };

            default:
                return baseCustomer;
        }
    }

    generateTestOrderHistory(customerId, profile = 'regular') {
        const orders = [];
        const restaurantIds = ['rest_001', 'rest_002', 'rest_003', 'rest_004', 'rest_005'];

        switch (profile) {
            case 'new':
                // No orders for new customers
                return [];

            case 'regular':
                // 5-10 orders over last 3 months
                for (let i = 0; i < 7; i++) {
                    orders.push({
                        orderId: `order_${customerId}_${i + 1}`,
                        customerId: customerId,
                        restaurantId: restaurantIds[i % restaurantIds.length],
                        total: 25 + Math.random() * 50,
                        status: 'delivered',
                        createdAt: new Date(Date.now() - (i + 1) * 10 * 24 * 60 * 60 * 1000).toISOString(),
                        completedAt: new Date(Date.now() - (i + 1) * 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
                        deliveryAddress: {
                            area: 'downtown',
                            district: 'business_district'
                        }
                    });
                }
                break;

            case 'vip':
                // 25+ orders over last year with high values
                for (let i = 0; i < 25; i++) {
                    orders.push({
                        orderId: `order_${customerId}_${i + 1}`,
                        customerId: customerId,
                        restaurantId: restaurantIds[i % restaurantIds.length],
                        total: 40 + Math.random() * 80,
                        status: 'delivered',
                        createdAt: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
                        completedAt: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
                        deliveryAddress: {
                            area: 'riyadh_center',
                            district: 'olaya'
                        }
                    });
                }
                break;

            case 'inactive':
                // Few orders but last one was 45+ days ago
                for (let i = 0; i < 3; i++) {
                    orders.push({
                        orderId: `order_${customerId}_${i + 1}`,
                        customerId: customerId,
                        restaurantId: restaurantIds[i],
                        total: 30 + Math.random() * 40,
                        status: 'delivered',
                        createdAt: new Date(Date.now() - (50 + i * 7) * 24 * 60 * 60 * 1000).toISOString(),
                        completedAt: new Date(Date.now() - (50 + i * 7) * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
                        deliveryAddress: {
                            area: 'al_malaz',
                            district: 'residential'
                        }
                    });
                }
                break;
        }

        return orders;
    }

    generateTestOrder(customerId, restaurantId = 'rest_001', amount = 50) {
        return {
            orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            customerId: customerId,
            restaurantId: restaurantId,
            total: amount,
            status: 'pending',
            createdAt: new Date().toISOString(),
            deliveryAddress: {
                area: 'downtown',
                district: 'business_district'
            },
            paymentMethod: 'credit_card'
        };
    }

    // ============================================
    // CONDITION TESTS
    // ============================================

    async testConditionDefinitions() {
        console.log('\n📋 Testing Condition Definitions...');
        
        const tests = [
            {
                name: 'Get All Available Conditions',
                test: () => {
                    const conditions = this.conditionEngine.getAvailableConditions();
                    return {
                        success: conditions.length > 0,
                        result: `Found ${conditions.length} condition definitions`,
                        data: conditions.map(c => ({ id: c.id, name: c.name, category: c.category }))
                    };
                }
            },
            {
                name: 'Get Conditions by Category',
                test: () => {
                    const customerConditions = this.conditionEngine.getConditionsByCategory('customer');
                    const orderConditions = this.conditionEngine.getConditionsByCategory('order');
                    const timeConditions = this.conditionEngine.getConditionsByCategory('time');
                    
                    return {
                        success: customerConditions.length > 0 && orderConditions.length > 0 && timeConditions.length > 0,
                        result: `Customer: ${customerConditions.length}, Order: ${orderConditions.length}, Time: ${timeConditions.length}`,
                        data: { customerConditions, orderConditions, timeConditions }
                    };
                }
            },
            {
                name: 'Parameter Validation',
                test: () => {
                    const errors = this.conditionEngine.validateConditionParameters('recently_registered', { days: 7 });
                    const invalidErrors = this.conditionEngine.validateConditionParameters('recently_registered', { days: -1 });
                    
                    return {
                        success: errors.length === 0 && invalidErrors.length > 0,
                        result: `Valid params: ${errors.length} errors, Invalid params: ${invalidErrors.length} errors`,
                        data: { validErrors: errors, invalidErrors: invalidErrors }
                    };
                }
            }
        ];

        for (const test of tests) {
            await this.runTest('Condition Definitions', test.name, test.test);
        }
    }

    async testCustomerConditions() {
        console.log('\n👤 Testing Customer Conditions...');

        const newCustomer = this.generateTestCustomer('new');
        const regularCustomer = this.generateTestCustomer('regular');
        const vipCustomer = this.generateTestCustomer('vip');
        const inactiveCustomer = this.generateTestCustomer('inactive');

        const newOrderHistory = this.generateTestOrderHistory(newCustomer.id, 'new');
        const regularOrderHistory = this.generateTestOrderHistory(regularCustomer.id, 'regular');
        const vipOrderHistory = this.generateTestOrderHistory(vipCustomer.id, 'vip');
        const inactiveOrderHistory = this.generateTestOrderHistory(inactiveCustomer.id, 'inactive');

        const tests = [
            {
                name: 'New Customer Detection',
                test: () => {
                    const isNewCustomer = this.conditionEngine.evaluateCondition('new_customer', newCustomer, newOrderHistory);
                    const isNotNewCustomer = this.conditionEngine.evaluateCondition('new_customer', regularCustomer, regularOrderHistory);
                    
                    return {
                        success: isNewCustomer === true && isNotNewCustomer === false,
                        result: `New customer: ${isNewCustomer}, Regular customer: ${isNotNewCustomer}`,
                        data: { newCustomer: isNewCustomer, regularCustomer: isNotNewCustomer }
                    };
                }
            },
            {
                name: 'Recently Registered Detection',
                test: () => {
                    const isRecentlyRegistered = this.conditionEngine.evaluateCondition('recently_registered', newCustomer, newOrderHistory, null, { days: 7 });
                    const isNotRecentlyRegistered = this.conditionEngine.evaluateCondition('recently_registered', vipCustomer, vipOrderHistory, null, { days: 7 });
                    
                    return {
                        success: isRecentlyRegistered === true && isNotRecentlyRegistered === false,
                        result: `Recent: ${isRecentlyRegistered}, Old: ${isNotRecentlyRegistered}`,
                        data: { recent: isRecentlyRegistered, old: isNotRecentlyRegistered }
                    };
                }
            },
            {
                name: 'VIP Customer Detection',
                test: () => {
                    const isVip = this.conditionEngine.evaluateCondition('vip_customer', vipCustomer, vipOrderHistory, null, { minSpending: 500, minOrders: 20 });
                    const isNotVip = this.conditionEngine.evaluateCondition('vip_customer', newCustomer, newOrderHistory, null, { minSpending: 500, minOrders: 20 });
                    
                    return {
                        success: isVip === true && isNotVip === false,
                        result: `VIP: ${isVip}, New: ${isNotVip}`,
                        data: { vip: isVip, new: isNotVip }
                    };
                }
            },
            {
                name: 'Inactive Customer Detection',
                test: () => {
                    const isInactive = this.conditionEngine.evaluateCondition('inactive_customer', inactiveCustomer, inactiveOrderHistory, null, { inactiveDays: 30 });
                    const isActive = this.conditionEngine.evaluateCondition('inactive_customer', regularCustomer, regularOrderHistory, null, { inactiveDays: 30 });
                    
                    return {
                        success: isInactive === true && isActive === false,
                        result: `Inactive: ${isInactive}, Active: ${isActive}`,
                        data: { inactive: isInactive, active: isActive }
                    };
                }
            },
            {
                name: 'Restaurant First Order',
                test: () => {
                    const isFirstOrder = this.conditionEngine.evaluateCondition('restaurant_first_order', regularCustomer, regularOrderHistory, null, { restaurantIds: ['rest_999'] });
                    const isNotFirstOrder = this.conditionEngine.evaluateCondition('restaurant_first_order', regularCustomer, regularOrderHistory, null, { restaurantIds: ['rest_001'] });
                    
                    return {
                        success: isFirstOrder === true && isNotFirstOrder === false,
                        result: `First order: ${isFirstOrder}, Not first: ${isNotFirstOrder}`,
                        data: { firstOrder: isFirstOrder, notFirst: isNotFirstOrder }
                    };
                }
            }
        ];

        for (const test of tests) {
            await this.runTest('Customer Conditions', test.name, test.test);
        }
    }

    async testOrderConditions() {
        console.log('\n🛒 Testing Order Conditions...');

        const customer = this.generateTestCustomer('regular');
        const orderHistory = this.generateTestOrderHistory(customer.id, 'regular');
        const testOrder = this.generateTestOrder(customer.id, 'rest_001', 75);

        const tests = [
            {
                name: 'Minimum Order Value',
                test: () => {
                    const condition = this.conditionEngine.evaluateCondition('min_order_value', customer, orderHistory, null, { minValue: 50 });
                    const meetsMinimum = condition(testOrder);
                    const belowMinimum = condition({ ...testOrder, total: 25 });
                    
                    return {
                        success: meetsMinimum === true && belowMinimum === false,
                        result: `Above minimum: ${meetsMinimum}, Below minimum: ${belowMinimum}`,
                        data: { above: meetsMinimum, below: belowMinimum }
                    };
                }
            },
            {
                name: 'Order Count in Period',
                test: () => {
                    const hasLowOrderCount = this.conditionEngine.evaluateCondition('order_count_period', customer, orderHistory.slice(0, 2), null, { maxOrders: 3, periodDays: 30 });
                    const hasHighOrderCount = this.conditionEngine.evaluateCondition('order_count_period', customer, orderHistory, null, { maxOrders: 3, periodDays: 30 });
                    
                    return {
                        success: hasLowOrderCount === true && hasHighOrderCount === false,
                        result: `Low count: ${hasLowOrderCount}, High count: ${hasHighOrderCount}`,
                        data: { lowCount: hasLowOrderCount, highCount: hasHighOrderCount }
                    };
                }
            },
            {
                name: 'First Order Today',
                test: () => {
                    const customerWithoutTodayOrders = this.generateTestCustomer('regular');
                    const oldOrderHistory = this.generateTestOrderHistory(customerWithoutTodayOrders.id, 'regular');
                    
                    const isFirstToday = this.conditionEngine.evaluateCondition('first_order_today', customerWithoutTodayOrders, oldOrderHistory);
                    
                    // Create order history with today's order
                    const todayOrderHistory = [...oldOrderHistory, {
                        ...this.generateTestOrder(customer.id),
                        createdAt: new Date().toISOString(),
                        status: 'delivered'
                    }];
                    
                    const isNotFirstToday = this.conditionEngine.evaluateCondition('first_order_today', customer, todayOrderHistory);
                    
                    return {
                        success: isFirstToday === true && isNotFirstToday === false,
                        result: `First today: ${isFirstToday}, Not first today: ${isNotFirstToday}`,
                        data: { firstToday: isFirstToday, notFirstToday: isNotFirstToday }
                    };
                }
            }
        ];

        for (const test of tests) {
            await this.runTest('Order Conditions', test.name, test.test);
        }
    }

    async testTimeConditions() {
        console.log('\n⏰ Testing Time Conditions...');

        const customer = this.generateTestCustomer('regular');
        const orderHistory = this.generateTestOrderHistory(customer.id, 'regular');

        const tests = [
            {
                name: 'Time of Day',
                test: () => {
                    const lunchOrder = { ...this.generateTestOrder(customer.id), createdAt: new Date().setHours(12, 0, 0, 0) };
                    const dinnerOrder = { ...this.generateTestOrder(customer.id), createdAt: new Date().setHours(19, 0, 0, 0) };
                    
                    const condition = this.conditionEngine.evaluateCondition('time_of_day', customer, orderHistory, null, { startHour: 11, endHour: 14 });
                    const isLunchTime = condition(lunchOrder);
                    const isDinnerTime = condition(dinnerOrder);
                    
                    return {
                        success: isLunchTime === true && isDinnerTime === false,
                        result: `Lunch time: ${isLunchTime}, Dinner time: ${isDinnerTime}`,
                        data: { lunchTime: isLunchTime, dinnerTime: isDinnerTime }
                    };
                }
            },
            {
                name: 'Day of Week',
                test: () => {
                    const weekdayOrder = { ...this.generateTestOrder(customer.id), createdAt: new Date().setDay(2) }; // Tuesday
                    const weekendOrder = { ...this.generateTestOrder(customer.id), createdAt: new Date().setDay(0) }; // Sunday
                    
                    const weekdayCondition = this.conditionEngine.evaluateCondition('day_of_week', customer, orderHistory, null, { days: [1, 2, 3, 4, 5] });
                    const isWeekday = weekdayCondition(weekdayOrder);
                    const isWeekend = weekdayCondition(weekendOrder);
                    
                    return {
                        success: isWeekday === true && isWeekend === false,
                        result: `Weekday: ${isWeekday}, Weekend: ${isWeekend}`,
                        data: { weekday: isWeekday, weekend: isWeekend }
                    };
                }
            },
            {
                name: 'Special Occasions',
                test: () => {
                    const weekendOrder = { ...this.generateTestOrder(customer.id), createdAt: new Date().setDay(0) }; // Sunday
                    const weekdayOrder = { ...this.generateTestOrder(customer.id), createdAt: new Date().setDay(2) }; // Tuesday
                    
                    const condition = this.conditionEngine.evaluateCondition('special_occasion', customer, orderHistory, null, { occasions: ['weekend'] });
                    const isWeekendOccasion = condition(weekendOrder);
                    const isNotWeekendOccasion = condition(weekdayOrder);
                    
                    return {
                        success: isWeekendOccasion === true && isNotWeekendOccasion === false,
                        result: `Weekend occasion: ${isWeekendOccasion}, Not weekend: ${isNotWeekendOccasion}`,
                        data: { weekendOccasion: isWeekendOccasion, notWeekend: isNotWeekendOccasion }
                    };
                }
            }
        ];

        for (const test of tests) {
            await this.runTest('Time Conditions', test.name, test.test);
        }
    }

    async testLocationConditions() {
        console.log('\n📍 Testing Location Conditions...');

        const customer = this.generateTestCustomer('regular');
        const orderHistory = this.generateTestOrderHistory(customer.id, 'regular');

        const tests = [
            {
                name: 'Delivery Area',
                test: () => {
                    const downtownOrder = {
                        ...this.generateTestOrder(customer.id),
                        deliveryAddress: { area: 'downtown', district: 'business_district' }
                    };
                    
                    const suburbOrder = {
                        ...this.generateTestOrder(customer.id),
                        deliveryAddress: { area: 'suburbs', district: 'residential' }
                    };
                    
                    const condition = this.conditionEngine.evaluateCondition('delivery_area', customer, orderHistory, null, { areas: ['downtown', 'riyadh_center'] });
                    const isAllowedArea = condition(downtownOrder);
                    const isNotAllowedArea = condition(suburbOrder);
                    
                    return {
                        success: isAllowedArea === true && isNotAllowedArea === false,
                        result: `Allowed area: ${isAllowedArea}, Not allowed: ${isNotAllowedArea}`,
                        data: { allowedArea: isAllowedArea, notAllowed: isNotAllowedArea }
                    };
                }
            },
            {
                name: 'Restaurant Location',
                test: () => {
                    const allowedRestaurantOrder = { ...this.generateTestOrder(customer.id), restaurantId: 'rest_001' };
                    const notAllowedRestaurantOrder = { ...this.generateTestOrder(customer.id), restaurantId: 'rest_999' };
                    
                    const condition = this.conditionEngine.evaluateCondition('restaurant_location', customer, orderHistory, null, { restaurantIds: ['rest_001', 'rest_002'] });
                    const isAllowedRestaurant = condition(allowedRestaurantOrder);
                    const isNotAllowedRestaurant = condition(notAllowedRestaurantOrder);
                    
                    return {
                        success: isAllowedRestaurant === true && isNotAllowedRestaurant === false,
                        result: `Allowed restaurant: ${isAllowedRestaurant}, Not allowed: ${isNotAllowedRestaurant}`,
                        data: { allowedRestaurant: isAllowedRestaurant, notAllowed: isNotAllowedRestaurant }
                    };
                }
            }
        ];

        for (const test of tests) {
            await this.runTest('Location Conditions', test.name, test.test);
        }
    }

    async testCampaignEligibility() {
        console.log('\n🎯 Testing Campaign Eligibility...');

        const newCustomer = this.generateTestCustomer('new');
        const vipCustomer = this.generateTestCustomer('vip');
        const newOrderHistory = this.generateTestOrderHistory(newCustomer.id, 'new');
        const vipOrderHistory = this.generateTestOrderHistory(vipCustomer.id, 'vip');

        const tests = [
            {
                name: 'New Customer Campaign',
                test: () => {
                    const campaign = {
                        id: 'test_new_customer',
                        conditions: [
                            { conditionId: 'recently_registered', params: { days: 7 } },
                            { conditionId: 'new_customer', params: {} }
                        ],
                        conditionLogic: 'AND'
                    };
                    
                    const isNewCustomerEligible = this.conditionEngine.isEligibleForCampaign(campaign, newCustomer, newOrderHistory);
                    const isVipCustomerEligible = this.conditionEngine.isEligibleForCampaign(campaign, vipCustomer, vipOrderHistory);
                    
                    return {
                        success: isNewCustomerEligible === true && isVipCustomerEligible === false,
                        result: `New customer eligible: ${isNewCustomerEligible}, VIP eligible: ${isVipCustomerEligible}`,
                        data: { newCustomer: isNewCustomerEligible, vipCustomer: isVipCustomerEligible }
                    };
                }
            },
            {
                name: 'VIP Weekend Campaign',
                test: () => {
                    const campaign = {
                        id: 'test_vip_weekend',
                        conditions: [
                            { conditionId: 'vip_customer', params: { minSpending: 500, minOrders: 20 } },
                            { conditionId: 'day_of_week', params: { days: [0, 6] } }
                        ],
                        conditionLogic: 'AND'
                    };
                    
                    const weekendOrder = { ...this.generateTestOrder(vipCustomer.id), createdAt: new Date().setDay(0) };
                    
                    const isVipWeekendEligible = this.conditionEngine.isEligibleForCampaign(campaign, vipCustomer, vipOrderHistory, weekendOrder);
                    const isNewCustomerEligible = this.conditionEngine.isEligibleForCampaign(campaign, newCustomer, newOrderHistory, weekendOrder);
                    
                    return {
                        success: isVipWeekendEligible === true && isNewCustomerEligible === false,
                        result: `VIP weekend eligible: ${isVipWeekendEligible}, New customer eligible: ${isNewCustomerEligible}`,
                        data: { vipWeekend: isVipWeekendEligible, newCustomer: isNewCustomerEligible }
                    };
                }
            },
            {
                name: 'Complex Multi-Condition Campaign',
                test: () => {
                    const campaign = {
                        id: 'test_complex',
                        conditions: [
                            { conditionId: 'returning_customer', params: { minOrders: 2 } },
                            { conditionId: 'min_order_value', params: { minValue: 50 } },
                            { conditionId: 'time_of_day', params: { startHour: 11, endHour: 14 } }
                        ],
                        conditionLogic: 'AND'
                    };
                    
                    const lunchOrder = {
                        ...this.generateTestOrder(vipCustomer.id, 'rest_001', 75),
                        createdAt: new Date().setHours(12, 0, 0, 0)
                    };
                    
                    const dinnerOrder = {
                        ...this.generateTestOrder(vipCustomer.id, 'rest_001', 75),
                        createdAt: new Date().setHours(19, 0, 0, 0)
                    };
                    
                    const isLunchEligible = this.conditionEngine.isEligibleForCampaign(campaign, vipCustomer, vipOrderHistory, lunchOrder);
                    const isDinnerEligible = this.conditionEngine.isEligibleForCampaign(campaign, vipCustomer, vipOrderHistory, dinnerOrder);
                    
                    return {
                        success: isLunchEligible === true && isDinnerEligible === false,
                        result: `Lunch eligible: ${isLunchEligible}, Dinner eligible: ${isDinnerEligible}`,
                        data: { lunch: isLunchEligible, dinner: isDinnerEligible }
                    };
                }
            }
        ];

        for (const test of tests) {
            await this.runTest('Campaign Eligibility', test.name, test.test);
        }
    }

    async testPerformance() {
        console.log('\n⚡ Testing Performance...');

        const customer = this.generateTestCustomer('vip');
        const orderHistory = this.generateTestOrderHistory(customer.id, 'vip');
        const testOrder = this.generateTestOrder(customer.id);

        const tests = [
            {
                name: 'Single Condition Evaluation Speed',
                test: () => {
                    const iterations = 1000;
                    const startTime = performance.now();
                    
                    for (let i = 0; i < iterations; i++) {
                        this.conditionEngine.evaluateCondition('vip_customer', customer, orderHistory, null, { minSpending: 500 });
                    }
                    
                    const endTime = performance.now();
                    const avgTime = (endTime - startTime) / iterations;
                    
                    return {
                        success: avgTime < 5, // Less than 5ms per evaluation
                        result: `Average time: ${avgTime.toFixed(3)}ms per evaluation`,
                        data: { avgTime, iterations, totalTime: endTime - startTime }
                    };
                }
            },
            {
                name: 'Complex Campaign Evaluation Speed',
                test: () => {
                    const campaign = {
                        id: 'performance_test',
                        conditions: [
                            { conditionId: 'vip_customer', params: { minSpending: 500, minOrders: 20 } },
                            { conditionId: 'min_order_value', params: { minValue: 50 } },
                            { conditionId: 'time_of_day', params: { startHour: 11, endHour: 14 } },
                            { conditionId: 'delivery_area', params: { areas: ['downtown', 'riyadh_center'] } }
                        ],
                        conditionLogic: 'AND'
                    };
                    
                    const iterations = 100;
                    const startTime = performance.now();
                    
                    for (let i = 0; i < iterations; i++) {
                        this.conditionEngine.isEligibleForCampaign(campaign, customer, orderHistory, testOrder);
                    }
                    
                    const endTime = performance.now();
                    const avgTime = (endTime - startTime) / iterations;
                    
                    return {
                        success: avgTime < 20, // Less than 20ms per campaign evaluation
                        result: `Average time: ${avgTime.toFixed(3)}ms per campaign evaluation`,
                        data: { avgTime, iterations, totalTime: endTime - startTime }
                    };
                }
            }
        ];

        for (const test of tests) {
            await this.runTest('Performance', test.name, test.test);
        }
    }

    // ============================================
    // TEST RUNNER
    // ============================================

    async runTest(category, testName, testFunction) {
        try {
            const startTime = performance.now();
            const result = await testFunction();
            const endTime = performance.now();
            const duration = endTime - startTime;

            const testResult = {
                category: category,
                name: testName,
                success: result.success,
                result: result.result,
                data: result.data,
                duration: duration,
                timestamp: new Date().toISOString()
            };

            this.testResults.push(testResult);

            const statusIcon = result.success ? '✅' : '❌';
            const durationText = duration < 1 ? '<1ms' : `${duration.toFixed(1)}ms`;
            console.log(`${statusIcon} ${testName}: ${result.result} (${durationText})`);

        } catch (error) {
            const testResult = {
                category: category,
                name: testName,
                success: false,
                result: `Error: ${error.message}`,
                data: { error: error.stack },
                duration: 0,
                timestamp: new Date().toISOString()
            };

            this.testResults.push(testResult);
            console.log(`❌ ${testName}: Error: ${error.message}`);
        }
    }

    async runAllTests() {
        const initialized = await this.initialize();
        if (!initialized) {
            console.error('❌ Failed to initialize test suite');
            return this.generateReport();
        }

        console.log('🧪 Running Comprehensive Campaign Condition Engine Tests...\n');

        // Run all test categories
        await this.testConditionDefinitions();
        await this.testCustomerConditions();
        await this.testOrderConditions();
        await this.testTimeConditions();
        await this.testLocationConditions();
        await this.testCampaignEligibility();
        await this.testPerformance();

        return this.generateReport();
    }

    generateReport() {
        const endTime = Date.now();
        const totalDuration = endTime - this.startTime;
        
        const passed = this.testResults.filter(t => t.success).length;
        const failed = this.testResults.filter(t => !t.success).length;
        const total = this.testResults.length;
        const successRate = total > 0 ? (passed / total * 100) : 0;

        const categoryStats = {};
        this.testResults.forEach(test => {
            if (!categoryStats[test.category]) {
                categoryStats[test.category] = { passed: 0, failed: 0, total: 0 };
            }
            categoryStats[test.category].total++;
            if (test.success) {
                categoryStats[test.category].passed++;
            } else {
                categoryStats[test.category].failed++;
            }
        });

        const report = {
            summary: {
                totalTests: total,
                passed: passed,
                failed: failed,
                successRate: Math.round(successRate * 100) / 100,
                totalDuration: totalDuration,
                timestamp: new Date().toISOString()
            },
            categoryStats: categoryStats,
            failedTests: this.testResults.filter(t => !t.success),
            allResults: this.testResults
        };

        // Log summary
        console.log('\n📊 TEST SUMMARY');
        console.log('==================');
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Success Rate: ${successRate.toFixed(1)}%`);
        console.log(`Duration: ${totalDuration}ms`);

        if (failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            report.failedTests.forEach(test => {
                console.log(`  - ${test.category}: ${test.name} - ${test.result}`);
            });
        }

        console.log('\n📈 CATEGORY BREAKDOWN:');
        Object.entries(categoryStats).forEach(([category, stats]) => {
            const rate = stats.total > 0 ? (stats.passed / stats.total * 100) : 0;
            console.log(`  ${category}: ${stats.passed}/${stats.total} (${rate.toFixed(1)}%)`);
        });

        return report;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    exportResults() {
        const report = this.generateReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign-condition-engine-test-results-${new Date().toISOString().slice(0, 19)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async validateRealWorldScenarios() {
        console.log('\n🌍 Validating Real-World Scenarios...');
        
        // This would connect to actual customer data in production
        const realWorldTests = [
            'New Customer Welcome Campaign',
            'VIP Customer Retention',
            'Inactive Customer Re-engagement',
            'Location-Based Promotions',
            'Time-Sensitive Offers',
            'Restaurant Introduction Campaigns'
        ];

        // Placeholder for real-world validation
        console.log('Real-world scenarios would be validated against actual customer data');
        console.log('Available scenarios:', realWorldTests.join(', '));
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.CampaignConditionEngineTestSuite = CampaignConditionEngineTestSuite;
    
    // Auto-run tests if in demo mode
    if (window.location.search.includes('autotest=true')) {
        document.addEventListener('DOMContentLoaded', async () => {
            const testSuite = new CampaignConditionEngineTestSuite();
            await testSuite.runAllTests();
        });
    }
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CampaignConditionEngineTestSuite;
}
