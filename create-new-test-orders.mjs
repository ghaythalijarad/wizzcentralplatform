// ⚠️  DEPRECATED: This test order simulator is no longer used
// 🚀 The platform now processes REAL CUSTOMER ORDERS from the Flutter app
// 📱 Use the customer app developed by your friend instead
// 🔗 See REAL_ORDER_PROCESSING_GUIDE.md for the new API endpoints
// 
// This file has been kept for reference only and should not be executed
//
// Script to create fresh test orders for notification testing
// This creates new orders that your Flutter merchant app will see

import fetch from 'node-fetch';

const MERCHANT_API = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
const REAL_BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5'; // Your actual business ID

async function createOrderForRealBusiness(customerName, customerPhone, items, totalAmount, customerEmail = null) {
    const orderId = `ORD_${Date.now()}`;
    
    return {
        orderId: orderId,
        businessId: REAL_BUSINESS_ID,
        customerId: `CUST_${Date.now()}`,
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        deliveryAddress: {
            street: "789 Notification Test Street",
            city: "Test City",
            zipCode: "12345",
            coordinates: {
                latitude: 40.7589,
                longitude: -73.9851
            },
            instructions: "Test order for notifications - please call when arriving"
        },
        items: items,
        totalAmount: totalAmount,
        paymentMethod: "credit_card",
        notes: "NOTIFICATION TEST ORDER - Check if you receive this instantly!",
        estimatedDeliveryTime: new Date(Date.now() + 30*60000).toISOString(),
        centralPlatformCallback: "https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/merchant-status-updates"
    };
}

async function sendOrderToMerchant(orderData) {
    console.log(`\n🚀 SENDING ORDER ${orderData.orderId} TO YOUR BUSINESS`);
    console.log('='.repeat(60));
    
    try {
        console.log('📦 Order Details:');
        console.log(`   Business ID: ${orderData.businessId}`);
        console.log(`   Customer: ${orderData.customerName} (${orderData.customerPhone})`);
        console.log(`   Items: ${orderData.items.length} items, Total: $${orderData.totalAmount}`);
        console.log(`   Delivery: ${orderData.deliveryAddress.street}, ${orderData.deliveryAddress.city}`);
        console.log(`   Special: ${orderData.notes}`);
        
        console.log('\n📡 Sending to merchant backend...');
        
        const response = await fetch(`${MERCHANT_API}/webhooks/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
            console.log('✅ SUCCESS! Order sent to your business');
            console.log(`   Response: ${JSON.stringify(responseData, null, 2)}`);
            return { success: true, data: responseData };
        } else {
            console.log(`❌ FAILED! Status: ${response.status}`);
            console.log(`   Error: ${JSON.stringify(responseData, null, 2)}`);
            return { success: false, error: responseData };
        }
        
    } catch (error) {
        console.log(`❌ NETWORK ERROR: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function createNotificationTestOrders() {
    console.log('🔔 CREATING NOTIFICATION TEST ORDERS');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🏪 Business ID: ${REAL_BUSINESS_ID}`);
    console.log(`🔗 Merchant API: ${MERCHANT_API}`);
    console.log('='.repeat(80));
    
    const results = [];
    
    // Order 1: Coffee & Pastry Order
    console.log('\n☕ ORDER 1: Morning Coffee & Pastry');
    const coffeeOrder = await createOrderForRealBusiness(
        "Emma Thompson",
        "+1555111222",
        [
            { productId: "COFFEE_001", name: "Cappuccino", quantity: 2, price: 4.50, specialInstructions: "Extra foam, oat milk" },
            { productId: "PASTRY_001", name: "Croissant", quantity: 2, price: 3.25, specialInstructions: "Warmed up" },
            { productId: "PASTRY_002", name: "Blueberry Muffin", quantity: 1, price: 2.75, specialInstructions: "Fresh" }
        ],
        18.25,
        "emma.thompson@example.com"
    );
    const result1 = await sendOrderToMerchant(coffeeOrder);
    results.push(result1);
    
    // Wait between orders
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Order 2: Late Night Snack
    console.log('\n🌙 ORDER 2: Late Night Snack');
    const snackOrder = await createOrderForRealBusiness(
        "Alex Rodriguez",
        "+1555333444",
        [
            { productId: "SNACK_001", name: "Loaded Nachos", quantity: 1, price: 12.99, specialInstructions: "Extra jalapeños" },
            { productId: "SNACK_002", name: "Buffalo Wings", quantity: 8, price: 14.99, specialInstructions: "Mild sauce" },
            { productId: "DRINK_001", name: "Ice Tea", quantity: 2, price: 2.99, specialInstructions: "Lemon, no sugar" }
        ],
        33.96,
        "alex.rodriguez@example.com"
    );
    const result2 = await sendOrderToMerchant(snackOrder);
    results.push(result2);
    
    // Wait between orders
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Order 3: Healthy Lunch
    console.log('\n🥗 ORDER 3: Healthy Lunch');
    const healthyOrder = await createOrderForRealBusiness(
        "Sophie Chen",
        "+1555555666",
        [
            { productId: "BOWL_001", name: "Quinoa Power Bowl", quantity: 1, price: 14.50, specialInstructions: "Add avocado" },
            { productId: "SMOOTHIE_001", name: "Green Smoothie", quantity: 1, price: 7.99, specialInstructions: "No banana" },
            { productId: "SIDE_001", name: "Kale Chips", quantity: 1, price: 4.99, specialInstructions: "Sea salt" }
        ],
        27.48,
        "sophie.chen@example.com"
    );
    const result3 = await sendOrderToMerchant(healthyOrder);
    results.push(result3);
    
    // Wait between orders
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Order 4: Family Dinner
    console.log('\n👨‍👩‍👧‍👦 ORDER 4: Family Dinner');
    const familyOrder = await createOrderForRealBusiness(
        "Michael Johnson",
        "+1555777888",
        [
            { productId: "PASTA_001", name: "Spaghetti Bolognese", quantity: 2, price: 16.99, specialInstructions: "Extra parmesan" },
            { productId: "PASTA_002", name: "Chicken Alfredo", quantity: 1, price: 18.99, specialInstructions: "Light sauce" },
            { productId: "BREAD_001", name: "Garlic Bread", quantity: 3, price: 5.99, specialInstructions: "Extra garlic" },
            { productId: "SALAD_001", name: "House Salad", quantity: 2, price: 8.99, specialInstructions: "Dressing on side" }
        ],
        75.94,
        "michael.johnson@example.com"
    );
    const result4 = await sendOrderToMerchant(familyOrder);
    results.push(result4);
    
    // Wait between orders
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Order 5: Quick Grab Order
    console.log('\n⚡ ORDER 5: Quick Grab & Go');
    const quickOrder = await createOrderForRealBusiness(
        "Lisa Martinez",
        "+1555999000",
        [
            { productId: "SANDWICH_001", name: "Club Sandwich", quantity: 1, price: 9.99, specialInstructions: "No tomatoes" },
            { productId: "CHIPS_001", name: "Sea Salt Chips", quantity: 1, price: 2.49, specialInstructions: "" },
            { productId: "DRINK_002", name: "Sparkling Water", quantity: 1, price: 1.99, specialInstructions: "Lime flavor" }
        ],
        14.47,
        "lisa.martinez@example.com"
    );
    const result5 = await sendOrderToMerchant(quickOrder);
    results.push(result5);
    
    // Summary
    console.log('\n📊 NOTIFICATION TEST ORDERS SUMMARY');
    console.log('='.repeat(80));
    const successCount = results.filter(r => r.success).length;
    console.log(`Successfully created: ${successCount}/5 orders`);
    
    const orderTypes = ['Coffee & Pastry', 'Late Night Snack', 'Healthy Lunch', 'Family Dinner', 'Quick Grab & Go'];
    results.forEach((result, index) => {
        const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
        console.log(`${orderTypes[index]}: ${status}`);
        if (!result.success) {
            console.log(`   Error: ${JSON.stringify(result.error)}`);
        }
    });
    
    if (successCount === 5) {
        console.log('\n🎉 ALL TEST ORDERS CREATED SUCCESSFULLY!');
        console.log('📱 Your Flutter app should now show 5 new orders');
        console.log('🔔 Check if you received instant notifications!');
    } else {
        console.log('\n⚠️  Some orders failed. Check the error messages above.');
    }
    
    return results;
}

// Verify orders were created
async function verifyOrdersCreated() {
    console.log('\n🔍 VERIFYING ORDERS IN DATABASE...');
    
    try {
        const response = await fetch(`${MERCHANT_API}/merchant/orders/${REAL_BUSINESS_ID}`);
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Found ${data.count || data.orders?.length || 0} total orders for your business`);
            if (data.orders && data.orders.length > 0) {
                // Show last 10 orders
                const recentOrders = data.orders.slice(0, 10);
                console.log('\n📋 RECENT ORDERS:');
                recentOrders.forEach((order, index) => {
                    console.log(`   ${index + 1}. ${order.orderId} - ${order.customerName} - $${order.totalAmount} - ${order.status || 'pending'}`);
                });
                
                if (data.orders.length > 10) {
                    console.log(`   ... and ${data.orders.length - 10} more orders`);
                }
            } else {
                console.log('   No orders found or orders array is empty');
            }
        } else {
            console.log('❌ Failed to fetch orders:', data);
        }
    } catch (error) {
        console.log('❌ Error verifying orders:', error.message);
    }
}

// Run the test
async function main() {
    console.log('🚀 STARTING NOTIFICATION TEST ORDER CREATION');
    console.log('📱 These orders will test your Flutter app\'s notification system');
    console.log('🔔 Check if your app receives instant notifications for each new order!');
    console.log('\n⏰ Creating orders with 3-second intervals...');
    
    await createNotificationTestOrders();
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
    await verifyOrdersCreated();
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Open your Flutter merchant app');
    console.log('2. Check if you see the 5 new test orders');
    console.log('3. Verify if you received instant notifications');
    console.log('4. Try accepting/rejecting orders to test the flow');
    console.log('5. Monitor if status updates flow back to Central Platform');
    console.log('\n🔔 NOTIFICATION TESTING:');
    console.log('- If you see orders instantly: ✅ Notifications working!');
    console.log('- If you need to refresh/logout-login: ❌ Need notification fix');
}

main().catch(console.error);
