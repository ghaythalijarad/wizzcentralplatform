#!/usr/bin/env node
/**
 * WebSocket Test Script for Order Assignment
 * Tests the complete driver assignment flow from WizzCentral Platform to WizzDriver app
 */

const WebSocket = require('ws');

// WebSocket endpoint for the platform
const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev?userType=support&agentId=wizzcentral-platform&platform=web&appVersion=1.0.0';

console.log('🎯 Testing Order Assignment WebSocket Flow...');
console.log('📍 WebSocket URL:', WEBSOCKET_URL);
console.log('=============================================');

class OrderAssignmentTester {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.testDriverId = 'test-driver-flutter-001';
    }

    async connect() {
        return new Promise((resolve, reject) => {
            console.log('🔌 Connecting to WebSocket...');
            
            this.ws = new WebSocket(WEBSOCKET_URL, {
                headers: {
                    'User-Agent': 'WizzCentral-Platform-Test/1.0',
                    'Origin': 'https://wizzcentral.com'
                }
            });

            this.ws.on('open', () => {
                this.connected = true;
                console.log('✅ WebSocket connection established!');
                this.setupEventHandlers();
                resolve();
            });

            this.ws.on('error', (error) => {
                console.error('❌ WebSocket connection error:', error);
                reject(error);
            });
        });
    }

    setupEventHandlers() {
        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📨 Received message:', JSON.stringify(message, null, 2));
                
                if (message.action === 'driver_assignment_response') {
                    this.handleDriverResponse(message);
                }
            } catch (error) {
                console.error('❌ Error parsing message:', error);
            }
        });

        this.ws.on('close', () => {
            this.connected = false;
            console.log('🔚 WebSocket connection closed');
        });
    }

    handleDriverResponse(message) {
        console.log('📥 Driver Response Received!');
        console.log(`   Order ID: ${message.order_id}`);
        console.log(`   Response: ${message.response}`);
        console.log(`   Driver ID: ${message.driver_id}`);
        
        if (message.response === 'accept') {
            console.log('✅ Driver ACCEPTED the order!');
            console.log(`   Estimated pickup time: ${message.estimated_pickup_time}`);
        } else {
            console.log('❌ Driver REJECTED the order');
            console.log(`   Reason: ${message.reason || 'No reason provided'}`);
        }
    }

    createTestOrderAssignment() {
        const orderId = `TEST_ORDER_${Date.now()}`;
        const assignmentId = `ASSIGN_${Date.now()}`;
        
        return {
            action: 'driver_assigned',
            order_id: orderId,
            assignment_id: assignmentId,
            driver_id: this.testDriverId,
            timeout: 30,
            
            // Order details in Arabic (Iraqi context)
            customer_name: 'أحمد محمد علي',
            customer_phone: '+9647901234567',
            restaurant_name: 'مطعم البيت العراقي',
            restaurant_phone: '+9647901234568',
            delivery_address: 'شارع الرشيد، منطقة الكرادة، بغداد، العراق',
            
            // Financial details
            total_amount: 28500,
            currency: 'IQD',
            estimated_earnings: 12000,
            payment_method: 'cash_on_delivery',
            
            // Location coordinates (Baghdad)
            pickup_location: {
                latitude: 33.3128,
                longitude: 44.3615,
                address: 'مطعم البيت العراقي، الكرادة، بغداد'
            },
            delivery_location: {
                latitude: 33.3057,
                longitude: 44.3838,
                address: 'شارع الرشيد، منطقة الكرادة، بغداد، العراق'
            },
            
            // Distance and timing
            estimated_distance: '3.2 km',
            estimated_pickup_time: '12 minutes',
            estimated_delivery_time: '25 minutes',
            
            // Order items
            order_items: [
                {
                    name: 'برياني لحم عراقي',
                    quantity: 1,
                    price: 18000
                },
                {
                    name: 'سلطة فتوش',
                    quantity: 1,
                    price: 7000
                },
                {
                    name: 'عصير برتقال طازج',
                    quantity: 1,
                    price: 3500
                }
            ],
            
            // Special instructions
            notes: 'يرجى الاتصال بالعميل عند الوصول للمطعم وعند التوصيل',
            special_instructions: 'الطلب يحتوي على طعام حار',
            
            // Metadata
            created_at: new Date().toISOString(),
            priority: 'normal',
            order_type: 'delivery'
        };
    }

    async sendOrderAssignment() {
        if (!this.connected) {
            throw new Error('WebSocket not connected');
        }

        const assignment = this.createTestOrderAssignment();
        
        console.log('📤 Sending Order Assignment...');
        console.log('===============================');
        console.log(`   Order ID: ${assignment.order_id}`);
        console.log(`   Restaurant: ${assignment.restaurant_name}`);
        console.log(`   Customer: ${assignment.customer_name}`);
        console.log(`   Total: ${assignment.total_amount} ${assignment.currency}`);
        console.log(`   Distance: ${assignment.estimated_distance}`);
        console.log('');

        // Send the assignment message
        this.ws.send(JSON.stringify(assignment));
        
        console.log('✅ Order assignment sent to driver!');
        console.log('⏳ Waiting for driver response...');
        console.log('');
        console.log('📱 Check your WizzDriver app now:');
        console.log('   1. You should see an order assignment notification');
        console.log('   2. The notification should display in Arabic');
        console.log('   3. Accept or reject the order to test the flow');
        console.log('');
    }

    async disconnect() {
        if (this.ws && this.connected) {
            this.ws.close();
        }
    }
}

async function runTest() {
    const tester = new OrderAssignmentTester();
    
    try {
        // Connect to WebSocket
        await tester.connect();
        
        // Wait a moment for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Send test order assignment
        await tester.sendOrderAssignment();
        
        // Keep connection open to receive driver response
        console.log('🔄 Keeping connection open for driver response...');
        console.log('   (The script will automatically close after 60 seconds)');
        
        // Auto-close after 60 seconds
        setTimeout(async () => {
            console.log('⏰ Test timeout reached');
            await tester.disconnect();
            process.exit(0);
        }, 60000);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await tester.disconnect();
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Test interrupted by user');
    process.exit(0);
});

// Run the test
if (require.main === module) {
    runTest();
}

module.exports = { OrderAssignmentTester };
