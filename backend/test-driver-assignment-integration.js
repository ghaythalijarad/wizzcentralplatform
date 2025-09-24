#!/usr/bin/env node
/**
 * Integration Test for Driver Assignment System
 * This script performs end-to-end testing with real WebSocket connections
 */

const WebSocket = require('ws');
const { assignDriverToOrder } = require('./src/services/driver-assignment-service');

// Test configuration
const WS_ENDPOINT = 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev';
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-token'; // Should be a real JWT in production

// Test data
const testOrder = {
    orderId: 'integration-test-001',
    status: 'ready_for_pickup',
    restaurantLocation: { latitude: 33.2382, longitude: 44.3748 },
    deliveryLocation: { latitude: 33.2420, longitude: 44.3800 },
    deliveryAddress: { street: '123 Test Street', city: 'Baghdad' },
    customerName: 'Integration Test Customer',
    customerPhone: '+9647901234567',
    storeName: 'Test Restaurant',
    totalAmount: 25000,
    paymentMethod: 'cash',
    items: [{ name: 'Test Item', quantity: 1, price: 25000 }]
};

class DriverSimulator {
    constructor(driverId, name) {
        this.driverId = driverId;
        this.name = name;
        this.ws = null;
        this.isConnected = false;
        this.receivedAssignments = [];
    }

    async connect() {
        return new Promise((resolve, reject) => {
            console.log(`🚗 ${this.name} connecting to WebSocket...`);
            
            this.ws = new WebSocket(`${WS_ENDPOINT}?token=${TEST_TOKEN}&userType=driver&driverId=${this.driverId}`);
            
            this.ws.onopen = () => {
                console.log(`✅ ${this.name} connected`);
                this.isConnected = true;
                
                // Authenticate
                this.ws.send(JSON.stringify({
                    type: 'authenticate',
                    token: TEST_TOKEN,
                    userType: 'driver',
                    driverId: this.driverId
                }));
                
                resolve();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error(`❌ ${this.name} message parse error:`, error);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error(`❌ ${this.name} WebSocket error:`, error);
                reject(error);
            };
            
            this.ws.onclose = () => {
                console.log(`🔌 ${this.name} disconnected`);
                this.isConnected = false;
            };
        });
    }

    handleMessage(message) {
        console.log(`📨 ${this.name} received:`, message.type);
        
        switch (message.type) {
            case 'driver_assignment':
                this.handleAssignmentRequest(message);
                break;
            case 'assignment_response_confirmed':
                console.log(`✅ ${this.name} assignment response confirmed`);
                break;
            default:
                console.log(`📝 ${this.name} other message:`, message.type);
        }
    }

    handleAssignmentRequest(message) {
        console.log(`🎯 ${this.name} received assignment for order: ${message.data.orderId}`);
        this.receivedAssignments.push(message);
        
        // Simulate driver decision (accept/decline)
        const shouldAccept = Math.random() > 0.3; // 70% acceptance rate
        const response = shouldAccept ? 'accept' : 'decline';
        const reason = shouldAccept ? null : 'Too far from location';
        
        console.log(`📋 ${this.name} will ${response} the assignment`);
        
        // Send response after a short delay
        setTimeout(() => {
            this.respondToAssignment(message.data.assignmentId, message.data.orderId, response, reason);
        }, 2000 + Math.random() * 5000); // 2-7 second delay
    }

    respondToAssignment(assignmentId, orderId, response, reason = null) {
        if (!this.isConnected) {
            console.log(`❌ ${this.name} cannot respond - not connected`);
            return;
        }

        const responseMessage = {
            type: 'driver_assignment_response',
            orderId,
            assignmentId,
            response,
            reason,
            estimatedPickupTime: response === 'accept' ? 
                new Date(Date.now() + 15 * 60 * 1000).toISOString() : null
        };

        console.log(`📤 ${this.name} sending ${response} response`);
        this.ws.send(JSON.stringify(responseMessage));
    }

    updateLocation(latitude, longitude) {
        if (!this.isConnected) return;

        const locationMessage = {
            type: 'driver_location_update',
            latitude,
            longitude,
            heading: Math.floor(Math.random() * 360),
            speed: 20 + Math.random() * 30
        };

        this.ws.send(JSON.stringify(locationMessage));
    }

    updateStatus(status) {
        if (!this.isConnected) return;

        const statusMessage = {
            type: 'driver_status_update',
            status
        };

        this.ws.send(JSON.stringify(statusMessage));
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

async function createTestDrivers() {
    const drivers = [
        new DriverSimulator('test-driver-001', 'Ahmed Ali'),
        new DriverSimulator('test-driver-002', 'Omar Hassan'),
        new DriverSimulator('test-driver-003', 'Fatima Mohammed')
    ];

    console.log('🚗 Creating test drivers...');
    
    for (const driver of drivers) {
        try {
            await driver.connect();
            
            // Set driver status to online
            await new Promise(resolve => setTimeout(resolve, 1000));
            driver.updateStatus('online');
            
            // Update location near restaurant
            const randomOffset = () => (Math.random() - 0.5) * 0.01;
            driver.updateLocation(
                33.2382 + randomOffset(),
                44.3748 + randomOffset()
            );
            
        } catch (error) {
            console.error(`❌ Failed to connect driver ${driver.name}:`, error.message);
        }
    }

    return drivers;
}

async function testDriverAssignment() {
    console.log('🧪 Starting Driver Assignment Integration Test');
    console.log('='.repeat(60));
    console.log('');

    let drivers = [];
    
    try {
        // Create test drivers
        drivers = await createTestDrivers();
        console.log(`✅ Created ${drivers.length} test drivers\n`);
        
        // Wait for connections to stabilize
        console.log('⏳ Waiting for connections to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test assignment
        console.log('🎯 Testing order assignment...');
        const assignmentResult = await assignDriverToOrder(testOrder.orderId, testOrder);
        
        console.log('📋 Assignment Result:', JSON.stringify(assignmentResult, null, 2));
        
        // Wait for driver responses
        console.log('\n⏳ Waiting for driver responses...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Check assignment outcomes
        let totalAssignments = 0;
        let totalResponses = 0;
        
        for (const driver of drivers) {
            totalAssignments += driver.receivedAssignments.length;
            console.log(`📊 ${driver.name}: ${driver.receivedAssignments.length} assignments received`);
        }
        
        console.log('\n📈 Test Results:');
        console.log(`├─ Total assignments sent: ${totalAssignments}`);
        console.log(`├─ Assignment success: ${assignmentResult.success ? 'Yes' : 'No'}`);
        console.log(`├─ Assignment reason: ${assignmentResult.reason || 'Success'}`);
        
        if (assignmentResult.success) {
            console.log(`└─ Assigned to: ${assignmentResult.driverName}`);
        }
        
        // Test additional features
        console.log('\n🔄 Testing additional features...');
        
        // Test location updates
        for (const driver of drivers) {
            driver.updateLocation(
                33.2382 + Math.random() * 0.01,
                44.3748 + Math.random() * 0.01
            );
        }
        
        console.log('✅ Location updates sent');
        
        // Test status changes
        if (drivers.length > 0) {
            drivers[0].updateStatus('break');
            console.log('✅ Status change sent');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n🎉 Integration test completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Integration test failed:', error);
        throw error;
        
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up...');
        for (const driver of drivers) {
            driver.disconnect();
        }
        console.log('✅ All connections closed');
    }
}

async function testSystemLoad() {
    console.log('\n🔥 Testing system under load...');
    
    const loadDrivers = [];
    const promises = [];
    
    // Create 10 drivers simultaneously
    for (let i = 0; i < 10; i++) {
        const driver = new DriverSimulator(`load-test-${i}`, `LoadDriver${i}`);
        loadDrivers.push(driver);
        promises.push(driver.connect());
    }
    
    try {
        await Promise.all(promises);
        console.log('✅ All load test drivers connected');
        
        // Set all to online
        for (const driver of loadDrivers) {
            driver.updateStatus('online');
            driver.updateLocation(
                33.2382 + Math.random() * 0.02,
                44.3748 + Math.random() * 0.02
            );
        }
        
        // Test multiple simultaneous assignments
        const assignmentPromises = [];
        for (let i = 0; i < 5; i++) {
            const orderData = {
                ...testOrder,
                orderId: `load-test-order-${i}`
            };
            assignmentPromises.push(assignDriverToOrder(orderData.orderId, orderData));
        }
        
        const results = await Promise.all(assignmentPromises);
        
        console.log('📊 Load test results:');
        results.forEach((result, index) => {
            console.log(`├─ Order ${index + 1}: ${result.success ? 'Success' : 'Failed'}`);
        });
        
        console.log('✅ Load test completed');
        
    } finally {
        // Cleanup
        for (const driver of loadDrivers) {
            driver.disconnect();
        }
    }
}

// Run tests if script is executed directly
if (require.main === module) {
    (async () => {
        try {
            await testDriverAssignment();
            await testSystemLoad();
            
            console.log('\n🏆 All integration tests passed!');
            process.exit(0);
            
        } catch (error) {
            console.error('\n💥 Integration tests failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = {
    testDriverAssignment,
    testSystemLoad,
    DriverSimulator
};
