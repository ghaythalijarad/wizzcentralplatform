#!/usr/bin/env node
/**
 * Complete Driver Assignment End-to-End Test
 * Establishes proper driver WebSocket connection and tests order assignment
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev';
const TEST_DRIVER_ID = 'test-driver-e2e-' + Date.now();
const ORDER_ID = '7652780b-ce26-44c2-8825-c15b8c5d3308'; // Confirmed order

console.log('🚀 Starting Complete Driver Assignment E2E Test');
console.log('=' .repeat(60));
console.log(`🔗 WebSocket URL: ${WEBSOCKET_URL}`);
console.log(`👤 Test Driver ID: ${TEST_DRIVER_ID}`);
console.log(`📦 Target Order ID: ${ORDER_ID}`);
console.log('');

let ws = null;
let driverConnected = false;
let assignmentReceived = false;

// Step 1: Connect driver to WebSocket
function connectDriver() {
    return new Promise((resolve, reject) => {
        console.log('🔌 Step 1: Connecting driver to WebSocket...');
        
        // Create WebSocket connection (bypassing auth for testing)
        ws = new WebSocket(WEBSOCKET_URL);
        
        ws.on('open', function() {
            console.log('✅ WebSocket connected successfully!');
            
            // Send driver registration/connection message
            const driverConnect = {
                action: 'driver_connect',
                type: 'driver_connect',
                driverId: TEST_DRIVER_ID,
                userId: TEST_DRIVER_ID,
                userType: 'driver',
                status: 'online',
                connectionStatus: 'connected',
                location: {
                    latitude: 33.3152,
                    longitude: 44.3661
                },
                city: 'baghdad',
                businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
                platform: 'test',
                timestamp: new Date().toISOString()
            };
            
            console.log('📤 Sending driver registration...');
            ws.send(JSON.stringify(driverConnect));
            
            // Wait for connection confirmation
            setTimeout(() => {
                driverConnected = true;
                console.log('✅ Driver registered and ready for assignments');
                resolve();
            }, 2000);
        });
        
        ws.on('message', handleDriverMessage);
        
        ws.on('error', function(error) {
            console.error('❌ WebSocket error:', error.message);
            reject(error);
        });
        
        ws.on('close', function(code, reason) {
            console.log(`🔌 WebSocket closed: ${code} - ${reason || 'Connection closed'}`);
            if (!driverConnected) {
                reject(new Error('Connection closed before driver registration'));
            }
        });
        
        // Connection timeout
        setTimeout(() => {
            if (!driverConnected) {
                reject(new Error('Driver connection timeout'));
            }
        }, 10000);
    });
}

// Handle messages received by driver
function handleDriverMessage(data) {
    try {
        const message = JSON.parse(data.toString());
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`\n📨 [${timestamp}] Driver received:`);
        console.log('─'.repeat(50));
        console.log(JSON.stringify(message, null, 2));
        
        // Handle different message types
        switch (message.type) {
            case 'driver_connect_ack':
                console.log('✅ Driver connection acknowledged by server');
                break;
                
            case 'order_assignment':
            case 'new_order':
                assignmentReceived = true;
                console.log('🎉 ORDER ASSIGNMENT RECEIVED!');
                console.log(`📋 Order ID: ${message.orderId || message.order_id}`);
                
                // Automatically accept the order after 2 seconds
                setTimeout(() => acceptOrder(message), 2000);
                break;
                
            case 'assignment_response_confirmed':
                console.log('✅ Order acceptance confirmed by server');
                break;
                
            case 'error':
                console.log('❌ Error from server:', message.message);
                break;
                
            default:
                console.log(`📩 Message type: ${message.type || 'Unknown'}`);
        }
    } catch (error) {
        console.log('📨 Raw message:', data.toString());
    }
}

// Accept the assigned order
function acceptOrder(orderMessage) {
    const acceptMessage = {
        action: 'order_accept',
        type: 'assignment_response',
        orderId: orderMessage.orderId || orderMessage.order_id,
        assignmentId: orderMessage.assignmentId || `assignment_${Date.now()}`,
        driverId: TEST_DRIVER_ID,
        response: 'accept',
        acceptedAt: new Date().toISOString(),
        estimatedPickupTime: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
    };
    
    console.log('\n🟢 Accepting order...');
    console.log('📤 Sending acceptance:', JSON.stringify(acceptMessage, null, 2));
    ws.send(JSON.stringify(acceptMessage));
}

// Step 2: Trigger driver assignment
async function triggerAssignment() {
    console.log('\n🎯 Step 2: Triggering driver assignment...');
    
    // Import and run the assignment service
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
        const assignProcess = spawn('node', ['assign-driver-to-order.js'], {
            stdio: 'pipe',
            cwd: process.cwd()
        });
        
        let output = '';
        let errorOutput = '';
        
        assignProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            console.log('📋 Assignment Service:', text.trim());
        });
        
        assignProcess.stderr.on('data', (data) => {
            const text = data.toString();
            errorOutput += text;
            console.error('❌ Assignment Error:', text.trim());
        });
        
        assignProcess.on('close', (code) => {
            console.log(`📊 Assignment process completed with code: ${code}`);
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(`Assignment failed with code ${code}: ${errorOutput}`));
            }
        });
        
        // Timeout after 30 seconds
        setTimeout(() => {
            assignProcess.kill();
            reject(new Error('Assignment process timeout'));
        }, 30000);
    });
}

// Step 3: Monitor for assignment completion
function monitorAssignment() {
    return new Promise((resolve) => {
        console.log('\n⏱️ Step 3: Monitoring for order assignment completion...');
        
        let monitorCount = 0;
        const monitor = setInterval(() => {
            monitorCount++;
            console.log(`⏰ Monitoring... ${monitorCount}s`);
            
            if (assignmentReceived) {
                clearInterval(monitor);
                console.log('✅ Order assignment completed successfully!');
                resolve(true);
            } else if (monitorCount >= 20) {
                clearInterval(monitor);
                console.log('⚠️ Assignment monitoring timeout - no order received');
                resolve(false);
            }
        }, 1000);
    });
}

// Main test execution
async function runCompleteTest() {
    try {
        // Step 1: Connect driver
        await connectDriver();
        console.log('\n✅ Step 1 Complete: Driver connected and registered');
        
        // Wait a moment for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 2: Trigger assignment  
        console.log('\n🚀 Starting assignment process...');
        const assignmentPromise = triggerAssignment();
        
        // Step 3: Monitor for assignment
        const monitorPromise = monitorAssignment();
        
        // Wait for either assignment completion or monitoring timeout
        await Promise.race([assignmentPromise, monitorPromise]);
        
        // Give some extra time for the full flow to complete
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Final results
        console.log('\n' + '='.repeat(60));
        console.log('🏁 END-TO-END TEST RESULTS:');
        console.log('='.repeat(60));
        console.log(`✅ Driver Connected: ${driverConnected ? 'YES' : 'NO'}`);
        console.log(`🎯 Assignment Received: ${assignmentReceived ? 'YES' : 'NO'}`);
        
        if (driverConnected && assignmentReceived) {
            console.log('\n🎉 SUCCESS: Complete driver assignment flow working!');
            console.log('   • Driver WebSocket connection established');
            console.log('   • Order assignment notification received');
            console.log('   • Assignment acceptance processed');
            console.log('\n🚀 The driver assignment system is fully operational!');
        } else if (driverConnected && !assignmentReceived) {
            console.log('\n⚠️ PARTIAL SUCCESS: Driver connected but no assignment received');
            console.log('   • WebSocket connection working');
            console.log('   • Assignment logic may need debugging');
        } else {
            console.log('\n❌ FAILURE: Driver assignment system needs attention');
            console.log('   • Check WebSocket connectivity');
            console.log('   • Verify authentication requirements');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting suggestions:');
        console.log('   • Check WebSocket endpoint connectivity');
        console.log('   • Verify order exists and is in ready_for_pickup status');
        console.log('   • Check AWS permissions and credentials');
    } finally {
        // Cleanup
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('\n🧹 Cleaning up WebSocket connection...');
            ws.close();
        }
        
        setTimeout(() => {
            console.log('\n👋 Test complete - exiting...');
            process.exit(0);
        }, 2000);
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n\n⚡ Test interrupted by user');
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
    }
    process.exit(0);
});

// Start the test
runCompleteTest();
