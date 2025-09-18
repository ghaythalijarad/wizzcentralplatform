/**
 * Enhanced Targeting System Test Suite
 * 
 * This file contains comprehensive tests for the enhanced targeting system
 * including validation, eligibility evaluation, and integration testing.
 */

class EnhancedTargetingTestSuite {
    constructor() {
        this.testResults = [];
        this.validator = new CampaignTargetingValidator();
        this.evaluator = new CampaignEligibilityEvaluator();
    }

    async runAllTests() {
        console.log('🚀 Starting Enhanced Targeting System Tests...\n');
        
        // Test validation functions
        await this.testValidation();
        
        // Test eligibility evaluation
        await this.testEligibilityEvaluation();
        
        // Test UI integration
        await this.testUIIntegration();
        
        // Test customer app integration
        await this.testCustomerAppIntegration();
        
        // Display results
        this.displayResults();
    }

    async testValidation() {
        console.log('📋 Testing Validation Functions...\n');

        // Test 1: Valid customer segment targeting
        this.runTest('Valid Customer Segment Targeting', () => {
            const validSegmentTargeting = {
                customerSegments: {
                    enabled: true,
                    predefinedSegments: ['new', 'vip'],
                    customCriteria: [
                        {
                            field: 'orderCount',
                            operator: 'greater_than',
                            value: 5
                        }
                    ],
                    logic: 'OR'
                }
            };
            
            const result = this.validator.validateCustomerSegments(validSegmentTargeting.customerSegments);
            return result.isValid === true;
        });

        // Test 2: Invalid customer segment targeting
        this.runTest('Invalid Customer Segment Targeting', () => {
            const invalidSegmentTargeting = {
                customerSegments: {
                    enabled: true,
                    customCriteria: [
                        {
                            field: 'orderCount',
                            operator: 'invalid_operator',
                            value: 'not_a_number'
                        }
                    ]
                }
            };
            
            const result = this.validator.validateCustomerSegments(invalidSegmentTargeting.customerSegments);
            return result.isValid === false && result.errors.length > 0;
        });

        // Test 3: Valid restaurant targeting
        this.runTest('Valid Restaurant Targeting', () => {
            const validRestaurantTargeting = {
                restaurantTargeting: {
                    enabled: true,
                    mode: 'specific',
                    specificRestaurants: ['rest_1', 'rest_2', 'rest_3']
                }
            };
            
            const result = this.validator.validateRestaurantTargeting(validRestaurantTargeting.restaurantTargeting);
            return result.isValid === true;
        });

        // Test 4: Valid occasion targeting
        this.runTest('Valid Occasion Targeting', () => {
            const validOccasionTargeting = {
                occasions: {
                    enabled: true,
                    specialEvents: [
                        {
                            name: 'New Year Sale',
                            startDate: '2024-01-01T00:00:00Z',
                            endDate: '2024-01-02T23:59:59Z'
                        }
                    ],
                    recurringSchedules: [
                        {
                            name: 'Weekend Special',
                            daysOfWeek: [0, 6], // Sunday and Saturday
                            timeRange: {
                                start: '18:00',
                                end: '22:00'
                            }
                        }
                    ]
                }
            };
            
            const result = this.validator.validateOccasions(validOccasionTargeting.occasions);
            return result.isValid === true;
        });

        // Test 5: Complete targeting validation
        this.runTest('Complete Targeting Validation', () => {
            const completeTargeting = {
                customerSegments: {
                    enabled: true,
                    predefinedSegments: ['new'],
                    logic: 'AND'
                },
                restaurantTargeting: {
                    enabled: true,
                    mode: 'category',
                    categories: ['fast_food', 'casual_dining']
                },
                occasions: {
                    enabled: true,
                    specialEvents: [
                        {
                            name: 'Holiday Special',
                            startDate: '2024-12-25T00:00:00Z',
                            endDate: '2024-12-26T23:59:59Z'
                        }
                    ]
                }
            };
            
            const result = this.validator.validateTargeting(completeTargeting);
            return result.isValid === true;
        });
    }

    async testEligibilityEvaluation() {
        console.log('🎯 Testing Eligibility Evaluation...\n');

        // Test customer data
        const testCustomer = {
            customerId: 'cust_123',
            orderCount: 10,
            totalSpent: 250.50,
            loyaltyLevel: 'gold',
            joinDate: '2023-06-15T10:00:00Z',
            lastOrderDate: '2024-01-10T15:30:00Z',
            averageOrderValue: 25.05
        };

        // Test order context
        const testContext = {
            restaurantId: 'rest_456',
            orderTime: new Date().toISOString(),
            orderValue: 30.00
        };

        // Test 6: Customer segment eligibility
        this.runTest('Customer Segment Eligibility - Order Count', () => {
            const targeting = {
                customerSegments: {
                    enabled: true,
                    customCriteria: [
                        {
                            field: 'orderCount',
                            operator: 'greater_than',
                            value: 5
                        }
                    ],
                    logic: 'AND'
                }
            };
            
            const result = this.evaluator.evaluateCustomerEligibility(targeting, testCustomer, testContext);
            return result.eligible === true;
        });

        // Test 7: Customer segment eligibility - Total spent
        this.runTest('Customer Segment Eligibility - Total Spent', () => {
            const targeting = {
                customerSegments: {
                    enabled: true,
                    customCriteria: [
                        {
                            field: 'totalSpent',
                            operator: 'greater_equal',
                            value: 200
                        }
                    ],
                    logic: 'AND'
                }
            };
            
            const result = this.evaluator.evaluateCustomerEligibility(targeting, testCustomer, testContext);
            return result.eligible === true;
        });

        // Test 8: Customer segment eligibility - Loyalty level
        this.runTest('Customer Segment Eligibility - Loyalty Level', () => {
            const targeting = {
                customerSegments: {
                    enabled: true,
                    customCriteria: [
                        {
                            field: 'loyaltyLevel',
                            operator: 'equals',
                            value: 'gold'
                        }
                    ],
                    logic: 'AND'
                }
            };
            
            const result = this.evaluator.evaluateCustomerEligibility(targeting, testCustomer, testContext);
            return result.eligible === true;
        });

        // Test 9: Multiple criteria with AND logic
        this.runTest('Multiple Criteria - AND Logic', () => {
            const targeting = {
                customerSegments: {
                    enabled: true,
                    customCriteria: [
                        {
                            field: 'orderCount',
                            operator: 'greater_than',
                            value: 5
                        },
                        {
                            field: 'loyaltyLevel',
                            operator: 'equals',
                            value: 'gold'
                        }
                    ],
                    logic: 'AND'
                }
            };
            
            const result = this.evaluator.evaluateCustomerEligibility(targeting, testCustomer, testContext);
            return result.eligible === true;
        });

        // Test 10: Multiple criteria with OR logic
        this.runTest('Multiple Criteria - OR Logic', () => {
            const targeting = {
                customerSegments: {
                    enabled: true,
                    customCriteria: [
                        {
                            field: 'orderCount',
                            operator: 'greater_than',
                            value: 100 // Customer won't meet this
                        },
                        {
                            field: 'loyaltyLevel',
                            operator: 'equals',
                            value: 'gold' // But will meet this
                        }
                    ],
                    logic: 'OR'
                }
            };
            
            const result = this.evaluator.evaluateCustomerEligibility(targeting, testCustomer, testContext);
            return result.eligible === true;
        });

        // Test 11: Restaurant targeting - Specific restaurants
        this.runTest('Restaurant Targeting - Specific Restaurants', () => {
            const targeting = {
                restaurantTargeting: {
                    enabled: true,
                    mode: 'specific',
                    specificRestaurants: ['rest_456', 'rest_789']
                }
            };
            
            const result = this.evaluator.evaluateCustomerEligibility(targeting, testCustomer, testContext);
            return result.eligible === true;
        });

        // Test 12: Combined targeting with multiple conditions
        this.runTest('Combined Targeting - Multiple Conditions', () => {
            const targeting = {
                customerSegments: {
                    enabled: true,
                    customCriteria: [
                        {
                            field: 'orderCount',
                            operator: 'greater_than',
                            value: 5
                        }
                    ],
                    logic: 'AND'
                },
                restaurantTargeting: {
                    enabled: true,
                    mode: 'specific',
                    specificRestaurants: ['rest_456']
                }
            };
            
            const result = this.evaluator.evaluateCustomerEligibility(targeting, testCustomer, testContext);
            return result.eligible === true;
        });
    }

    async testUIIntegration() {
        console.log('🖼️ Testing UI Integration...\n');

        // Test 13: Enhanced targeting manager initialization
        this.runTest('Enhanced Targeting Manager Initialization', () => {
            try {
                const manager = new EnhancedTargetingManager('test-container');
                return manager !== null && typeof manager.render === 'function';
            } catch (error) {
                console.error('Manager initialization error:', error);
                return false;
            }
        });

        // Test 14: Data collection from UI
        this.runTest('Data Collection from UI', () => {
            try {
                // Create a temporary container for testing
                const testContainer = document.createElement('div');
                testContainer.id = 'test-targeting-container';
                document.body.appendChild(testContainer);

                const manager = new EnhancedTargetingManager('test-targeting-container');
                manager.render();

                // Simulate user input
                const enableCheckbox = testContainer.querySelector('#enableCustomerSegments');
                if (enableCheckbox) {
                    enableCheckbox.checked = true;
                    enableCheckbox.dispatchEvent(new Event('change'));
                }

                const data = manager.getTargetingData();
                
                // Cleanup
                document.body.removeChild(testContainer);
                
                return data !== null && typeof data === 'object';
            } catch (error) {
                console.error('UI data collection error:', error);
                return false;
            }
        });
    }

    async testCustomerAppIntegration() {
        console.log('📱 Testing Customer App Integration...\n');

        // Test 15: Customer campaign evaluator initialization
        this.runTest('Customer Campaign Evaluator Initialization', () => {
            try {
                const evaluator = new CustomerCampaignEvaluator({
                    baseUrl: 'https://api.example.com',
                    apiKey: 'test-key'
                });
                return evaluator !== null;
            } catch (error) {
                console.error('Customer evaluator initialization error:', error);
                return false;
            }
        });

        // Test 16: Campaign eligibility evaluation
        this.runTest('Campaign Eligibility Evaluation', async () => {
            try {
                const evaluator = new CustomerCampaignEvaluator({
                    baseUrl: 'https://api.example.com',
                    apiKey: 'test-key'
                });

                const mockCampaign = {
                    id: 'camp_123',
                    title: 'Test Campaign',
                    enhancedTargeting: {
                        customerSegments: {
                            enabled: true,
                            customCriteria: [
                                {
                                    field: 'orderCount',
                                    operator: 'greater_than',
                                    value: 5
                                }
                            ],
                            logic: 'AND'
                        }
                    }
                };

                const mockCustomer = {
                    customerId: 'cust_123',
                    orderCount: 10
                };

                const result = await evaluator.evaluateCampaignEligibility(mockCampaign, mockCustomer, {});
                return typeof result === 'object' && 'eligible' in result;
            } catch (error) {
                console.error('Campaign evaluation error:', error);
                return false;
            }
        });
    }

    runTest(testName, testFunction) {
        try {
            const startTime = Date.now();
            const result = testFunction();
            const endTime = Date.now();
            
            // Handle async tests
            if (result instanceof Promise) {
                return result.then(asyncResult => {
                    this.recordTestResult(testName, asyncResult, endTime - startTime);
                    return asyncResult;
                }).catch(error => {
                    this.recordTestResult(testName, false, endTime - startTime, error.message);
                    return false;
                });
            } else {
                this.recordTestResult(testName, result, endTime - startTime);
                return result;
            }
        } catch (error) {
            this.recordTestResult(testName, false, 0, error.message);
            return false;
        }
    }

    recordTestResult(testName, passed, duration, error = null) {
        this.testResults.push({
            name: testName,
            passed,
            duration,
            error
        });

        const status = passed ? '✅ PASS' : '❌ FAIL';
        const durationText = `(${duration}ms)`;
        const errorText = error ? ` - ${error}` : '';
        
        console.log(`${status} ${testName} ${durationText}${errorText}`);
    }

    displayResults() {
        console.log('\n📊 Test Results Summary\n');
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        console.log(`Total Duration: ${totalDuration}ms`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => {
                    console.log(`  - ${r.name}: ${r.error || 'Test assertion failed'}`);
                });
        }
        
        console.log('\n🎉 Enhanced Targeting System Testing Complete!');
    }

    // Helper method to create test campaigns
    createTestCampaign(targeting) {
        return {
            id: `test_campaign_${Date.now()}`,
            title: 'Test Campaign',
            description: 'Test campaign for validation',
            type: 'special-occasion',
            discountType: 'percentage',
            discountValue: 20,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            enhancedTargeting: targeting
        };
    }

    // Helper method to create test customer data
    createTestCustomer(overrides = {}) {
        return {
            customerId: 'test_customer_123',
            orderCount: 5,
            totalSpent: 150.00,
            loyaltyLevel: 'silver',
            joinDate: '2023-06-15T10:00:00Z',
            lastOrderDate: '2024-01-01T12:00:00Z',
            averageOrderValue: 30.00,
            ...overrides
        };
    }
}

// Performance testing utilities
class PerformanceTestSuite {
    constructor() {
        this.validator = new CampaignTargetingValidator();
        this.evaluator = new CampaignEligibilityEvaluator();
    }

    async runPerformanceTests() {
        console.log('⚡ Running Performance Tests...\n');

        // Test validation performance
        await this.testValidationPerformance();
        
        // Test evaluation performance
        await this.testEvaluationPerformance();
        
        // Test scale performance
        await this.testScalePerformance();
    }

    async testValidationPerformance() {
        console.log('🔍 Testing Validation Performance...\n');

        const iterations = 1000;
        const testTargeting = {
            customerSegments: {
                enabled: true,
                customCriteria: [
                    { field: 'orderCount', operator: 'greater_than', value: 5 },
                    { field: 'totalSpent', operator: 'greater_equal', value: 100 },
                    { field: 'loyaltyLevel', operator: 'equals', value: 'gold' }
                ],
                logic: 'AND'
            },
            restaurantTargeting: {
                enabled: true,
                mode: 'specific',
                specificRestaurants: ['rest_1', 'rest_2', 'rest_3']
            }
        };

        const startTime = Date.now();
        
        for (let i = 0; i < iterations; i++) {
            this.validator.validateTargeting(testTargeting);
        }
        
        const endTime = Date.now();
        const avgTime = (endTime - startTime) / iterations;
        
        console.log(`✅ Validation Performance: ${avgTime.toFixed(2)}ms average per validation (${iterations} iterations)`);
    }

    async testEvaluationPerformance() {
        console.log('🎯 Testing Evaluation Performance...\n');

        const iterations = 1000;
        const testTargeting = {
            customerSegments: {
                enabled: true,
                customCriteria: [
                    { field: 'orderCount', operator: 'greater_than', value: 5 },
                    { field: 'loyaltyLevel', operator: 'equals', value: 'gold' }
                ],
                logic: 'AND'
            }
        };

        const testCustomer = {
            customerId: 'test_123',
            orderCount: 10,
            loyaltyLevel: 'gold'
        };

        const startTime = Date.now();
        
        for (let i = 0; i < iterations; i++) {
            this.evaluator.evaluateCustomerEligibility(testTargeting, testCustomer, {});
        }
        
        const endTime = Date.now();
        const avgTime = (endTime - startTime) / iterations;
        
        console.log(`✅ Evaluation Performance: ${avgTime.toFixed(2)}ms average per evaluation (${iterations} iterations)`);
    }

    async testScalePerformance() {
        console.log('📈 Testing Scale Performance...\n');

        const customers = this.generateTestCustomers(1000);
        const targeting = {
            customerSegments: {
                enabled: true,
                customCriteria: [
                    { field: 'orderCount', operator: 'greater_than', value: 5 }
                ],
                logic: 'AND'
            }
        };

        const startTime = Date.now();
        
        let eligibleCount = 0;
        for (const customer of customers) {
            const result = this.evaluator.evaluateCustomerEligibility(targeting, customer, {});
            if (result.eligible) eligibleCount++;
        }
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const avgTime = totalTime / customers.length;
        
        console.log(`✅ Scale Performance: ${totalTime}ms total for ${customers.length} customers`);
        console.log(`   Average: ${avgTime.toFixed(2)}ms per customer`);
        console.log(`   Eligible customers: ${eligibleCount}/${customers.length} (${(eligibleCount/customers.length*100).toFixed(1)}%)`);
    }

    generateTestCustomers(count) {
        const customers = [];
        for (let i = 0; i < count; i++) {
            customers.push({
                customerId: `test_customer_${i}`,
                orderCount: Math.floor(Math.random() * 20),
                totalSpent: Math.random() * 500,
                loyaltyLevel: ['bronze', 'silver', 'gold', 'platinum'][Math.floor(Math.random() * 4)],
                joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        return customers;
    }
}

// Initialize and run tests when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create test runner button
    const testButton = document.createElement('button');
    testButton.textContent = 'Run Enhanced Targeting Tests';
    testButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 10000;
        padding: 10px 15px;
        background: #007cba;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    `;
    
    testButton.addEventListener('click', async () => {
        console.clear();
        const testSuite = new EnhancedTargetingTestSuite();
        await testSuite.runAllTests();
        
        const performanceTests = new PerformanceTestSuite();
        await performanceTests.runPerformanceTests();
    });
    
    document.body.appendChild(testButton);
    
    console.log('🧪 Enhanced Targeting Test Suite loaded. Click the test button to run tests.');
});

// Export for Node.js testing environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EnhancedTargetingTestSuite,
        PerformanceTestSuite
    };
}
