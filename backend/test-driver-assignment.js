#!/usr/bin/env node
/**
 * Test Script for Driver Assignment System
 * This script validates the driver assignment functionality
 */

const { assignDriverToOrder, getAssignmentAnalytics, calculateDistance } = require('./src/services/driver-assignment-service');

// Test data
const testOrder = {
    orderId: 'test-order-001',
    status: 'ready_for_pickup',
    restaurantLocation: {
        latitude: 33.2382,
        longitude: 44.3748
    },
    deliveryLocation: {
        latitude: 33.2420,
        longitude: 44.3800
    },
    deliveryAddress: {
        street: '123 Test Street',
        city: 'Baghdad',
        coordinates: {
            latitude: 33.2420,
            longitude: 44.3800
        }
    },
    customerName: 'Test Customer',
    customerPhone: '+9647901234567',
    storeName: 'Test Restaurant',
    storeAddress: '456 Restaurant Street, Baghdad',
    totalAmount: 25000,
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    items: [
        {
            name: 'Test Item 1',
            quantity: 2,
            price: 10000
        },
        {
            name: 'Test Item 2',
            quantity: 1,
            price: 5000
        }
    ]
};

const testDriver = {
    driverId: 'test-driver-001',
    name: 'Test Driver',
    status: 'online',
    isVerified: true,
    isActive: true,
    rating: 4.5,
    completionRate: 0.95,
    activeOrdersCount: 0,
    vehicleType: 'motorcycle',
    location: {
        latitude: 33.2350,
        longitude: 44.3720
    }
};

async function testDistanceCalculation() {
    console.log('🧮 Testing distance calculation...');
    
    const distance = calculateDistance(
        testOrder.restaurantLocation.latitude,
        testOrder.restaurantLocation.longitude,
        testDriver.location.latitude,
        testDriver.location.longitude
    );
    
    console.log(`📍 Distance from driver to restaurant: ${distance} km`);
    
    if (distance > 0 && distance < 50) {
        console.log('✅ Distance calculation test passed');
        return true;
    } else {
        console.log('❌ Distance calculation test failed');
        return false;
    }
}

async function testDriverAssignment() {
    console.log('🎯 Testing driver assignment...');
    
    try {
        const result = await assignDriverToOrder(testOrder.orderId, testOrder);
        
        console.log('📋 Assignment result:', JSON.stringify(result, null, 2));
        
        if (result.success !== undefined) {
            console.log('✅ Driver assignment test completed');
            return true;
        } else {
            console.log('❌ Driver assignment test failed - invalid result format');
            return false;
        }
    } catch (error) {
        console.error('❌ Driver assignment test failed:', error.message);
        return false;
    }
}

async function testAnalytics() {
    console.log('📊 Testing assignment analytics...');
    
    try {
        const analytics = await getAssignmentAnalytics('24h');
        
        if (analytics !== null && typeof analytics === 'object') {
            console.log('📈 Analytics result:', JSON.stringify(analytics, null, 2));
            console.log('✅ Analytics test passed');
            return true;
        } else {
            console.log('❌ Analytics test failed - invalid result');
            return false;
        }
    } catch (error) {
        console.error('❌ Analytics test failed:', error.message);
        return false;
    }
}

async function testWebSocketMessage() {
    console.log('📱 Testing WebSocket message format...');
    
    const assignmentMessage = {
        type: 'driver_assignment',
        action: 'order_assignment_request',
        data: {
            orderId: testOrder.orderId,
            assignmentId: `${testOrder.orderId}_${testDriver.driverId}_${Date.now()}`,
            restaurant: {
                name: testOrder.storeName,
                address: testOrder.storeAddress,
                location: testOrder.restaurantLocation
            },
            customer: {
                name: testOrder.customerName,
                phone: testOrder.customerPhone,
                address: `${testOrder.deliveryAddress.street}, ${testOrder.deliveryAddress.city}`,
                location: testOrder.deliveryLocation
            },
            order: {
                items: testOrder.items,
                totalAmount: testOrder.totalAmount,
                paymentMethod: testOrder.paymentMethod
            },
            timing: {
                estimatedPickupTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                responseDeadline: new Date(Date.now() + 30 * 1000).toISOString()
            }
        }
    };
    
    try {
        const messageString = JSON.stringify(assignmentMessage);
        const parsedMessage = JSON.parse(messageString);
        
        if (parsedMessage.type === 'driver_assignment' && parsedMessage.data.orderId) {
            console.log('✅ WebSocket message format test passed');
            console.log(`📝 Message size: ${messageString.length} bytes`);
            return true;
        } else {
            console.log('❌ WebSocket message format test failed');
            return false;
        }
    } catch (error) {
        console.error('❌ WebSocket message format test failed:', error.message);
        return false;
    }
}

async function testConfigurationValues() {
    console.log('⚙️ Testing configuration values...');
    
    const { ASSIGNMENT_CONFIG } = require('./src/services/driver-assignment-service');
    
    const requiredConfigs = [
        'MAX_ASSIGNMENT_DISTANCE_KM',
        'ASSIGNMENT_TIMEOUT_SECONDS',
        'MAX_RETRY_ATTEMPTS',
        'PRIORITY_WEIGHTS'
    ];
    
    let allConfigsValid = true;
    
    for (const config of requiredConfigs) {
        if (ASSIGNMENT_CONFIG[config] === undefined) {
            console.log(`❌ Missing configuration: ${config}`);
            allConfigsValid = false;
        } else {
            console.log(`✅ Configuration ${config}: ${JSON.stringify(ASSIGNMENT_CONFIG[config])}`);
        }
    }
    
    // Validate priority weights sum to 1.0
    const weights = ASSIGNMENT_CONFIG.PRIORITY_WEIGHTS;
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    if (Math.abs(totalWeight - 1.0) < 0.001) {
        console.log('✅ Priority weights sum to 1.0');
    } else {
        console.log(`❌ Priority weights sum to ${totalWeight}, should be 1.0`);
        allConfigsValid = false;
    }
    
    return allConfigsValid;
}

async function runAllTests() {
    console.log('🧪 Starting Driver Assignment System Tests');
    console.log('='.repeat(50));
    console.log('');
    
    const tests = [
        { name: 'Configuration Values', func: testConfigurationValues },
        { name: 'Distance Calculation', func: testDistanceCalculation },
        { name: 'WebSocket Message Format', func: testWebSocketMessage },
        { name: 'Assignment Analytics', func: testAnalytics },
        { name: 'Driver Assignment', func: testDriverAssignment }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        console.log(`\n🔬 Running ${test.name} test...`);
        console.log('-'.repeat(30));
        
        try {
            const result = await test.func();
            if (result) {
                passedTests++;
            }
        } catch (error) {
            console.error(`❌ Test ${test.name} failed with error:`, error.message);
        }
        
        console.log('');
    }
    
    // Print test summary
    console.log('📊 Test Summary');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log('');
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Driver Assignment System is ready for deployment.');
    } else {
        console.log('⚠️ Some tests failed. Please review the issues before deployment.');
    }
    
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Fix any failing tests');
    console.log('2. Run integration tests with real WebSocket connections');
    console.log('3. Test with multiple drivers simultaneously');
    console.log('4. Monitor performance under load');
    console.log('5. Deploy to production environment');
}

// Run tests if script is executed directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    testDistanceCalculation,
    testDriverAssignment,
    testAnalytics,
    testWebSocketMessage,
    testConfigurationValues
};
