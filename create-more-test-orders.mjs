// ⚠️  DEPRECATED: This test order simulator is no longer used
// 🚀 The platform now processes REAL CUSTOMER ORDERS from the Flutter app
// 📱 Use the customer app developed by your friend instead
// 🔗 See REAL_ORDER_PROCESSING_GUIDE.md for the new API endpoints
// 
// This file has been kept for reference only and should not be executed
//
// Script to create additional test orders for notification testing
// This creates more diverse orders to thoroughly test the Flutter app

import fetch from 'node-fetch';

const MERCHANT_API = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
const REAL_BUSINESS_ID = '2e102ff3-72a2-4823-93b8-f975d915c82e'; // Your actual business ID

async function createOrderForRealBusiness(customerName, customerPhone, items, totalAmount, customerEmail = null) {
    const orderId = `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    return {
        orderId: orderId,
        businessId: REAL_BUSINESS_ID,
        customerId: `CUST_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        deliveryAddress: {
            street: `${Math.floor(Math.random() * 999) + 100} Test Avenue`,
            city: "Flutter City",
            zipCode: "12345",
            coordinates: {
                latitude: 40.7589 + (Math.random() - 0.5) * 0.01,
                longitude: -73.9851 + (Math.random() - 0.5) * 0.01
            },
            instructions: "🔔 NOTIFICATION TEST - Ring doorbell when arrived"
        },
        items: items,
        totalAmount: totalAmount,
        paymentMethod: Math.random() > 0.5 ? "credit_card" : "cash",
        notes: `🚨 NOTIFICATION TEST #${Date.now()} - Check if you receive this order instantly!`,
        estimatedDeliveryTime: new Date(Date.now() + (20 + Math.random() * 20) * 60000).toISOString(),
        centralPlatformCallback: "https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/merchant-status-updates"
    };
}

async function sendOrderToMerchant(orderData) {
    console.log(`\n🚀 SENDING ORDER ${orderData.orderId}`);
    console.log(`👤 Customer: ${orderData.customerName} (${orderData.customerPhone})`);
    console.log(`💰 Total: $${orderData.totalAmount} | Items: ${orderData.items.length}`);
    console.log(`🔔 Note: ${orderData.notes}`);
    
    try {
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
            console.log('✅ SUCCESS!');
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

async function createMoreTestOrders() {
    console.log('🔔 CREATING MORE NOTIFICATION TEST ORDERS');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🏪 Business ID: ${REAL_BUSINESS_ID}`);
    console.log('='.repeat(80));
    
    const results = [];
    const orderInterval = 4000; // 4 seconds between orders
    
    // Order 1: Asian Fusion
    console.log('\n🍜 ORDER 1: Asian Fusion Delight');
    const asianOrder = await createOrderForRealBusiness(
        "Chen Wei",
        "+1555200300",
        [
            { productId: "ASIAN_001", name: "Pad Thai", quantity: 1, price: 13.99, specialInstructions: "Medium spicy, extra peanuts" },
            { productId: "ASIAN_002", name: "Spring Rolls", quantity: 4, price: 8.99, specialInstructions: "Crispy, sweet & sour sauce" },
            { productId: "ASIAN_003", name: "Thai Iced Tea", quantity: 2, price: 3.99, specialInstructions: "Less sweet" }
        ],
        30.96,
        "chen.wei@example.com"
    );
    const result1 = await sendOrderToMerchant(asianOrder);
    results.push(result1);
    
    await new Promise(resolve => setTimeout(resolve, orderInterval));
    
    // Order 2: Breakfast Special
    console.log('\n🥞 ORDER 2: Hearty Breakfast');
    const breakfastOrder = await createOrderForRealBusiness(
        "Maria Garcia",
        "+1555400500",
        [
            { productId: "BREAKFAST_001", name: "Pancake Stack", quantity: 1, price: 11.99, specialInstructions: "Blueberry, extra syrup" },
            { productId: "BREAKFAST_002", name: "Bacon & Eggs", quantity: 1, price: 9.99, specialInstructions: "Over easy, crispy bacon" },
            { productId: "BREAKFAST_003", name: "Fresh Orange Juice", quantity: 1, price: 4.99, specialInstructions: "Pulp-free" },
            { productId: "BREAKFAST_004", name: "Hash Browns", quantity: 1, price: 3.99, specialInstructions: "Extra crispy" }
        ],
        30.96,
        "maria.garcia@example.com"
    );
    const result2 = await sendOrderToMerchant(breakfastOrder);
    results.push(result2);
    
    await new Promise(resolve => setTimeout(resolve, orderInterval));
    
    // Order 3: Vegan Delights
    console.log('\n🌱 ORDER 3: Vegan Special');
    const veganOrder = await createOrderForRealBusiness(
        "Oliver Green",
        "+1555600700",
        [
            { productId: "VEGAN_001", name: "Impossible Burger", quantity: 1, price: 17.99, specialInstructions: "No mayo, add avocado" },
            { productId: "VEGAN_002", name: "Sweet Potato Fries", quantity: 1, price: 6.99, specialInstructions: "Sea salt, rosemary" },
            { productId: "VEGAN_003", name: "Kombucha", quantity: 1, price: 4.99, specialInstructions: "Ginger flavor" },
            { productId: "VEGAN_004", name: "Quinoa Salad Bowl", quantity: 1, price: 12.99, specialInstructions: "Extra tahini dressing" }
        ],
        42.96,
        "oliver.green@example.com"
    );
    const result3 = await sendOrderToMerchant(veganOrder);
    results.push(result3);
    
    await new Promise(resolve => setTimeout(resolve, orderInterval));
    
    // Order 4: Pizza Party
    console.log('\n🍕 ORDER 4: Weekend Pizza Party');
    const pizzaPartyOrder = await createOrderForRealBusiness(
        "Jennifer Wilson",
        "+1555800900",
        [
            { productId: "PIZZA_001", name: "Meat Lovers Pizza", quantity: 2, price: 19.99, specialInstructions: "Extra cheese, thin crust" },
            { productId: "PIZZA_002", name: "Veggie Supreme", quantity: 1, price: 17.99, specialInstructions: "No mushrooms" },
            { productId: "SIDES_001", name: "Mozzarella Sticks", quantity: 12, price: 9.99, specialInstructions: "Extra marinara sauce" },
            { productId: "DRINK_001", name: "2L Pepsi", quantity: 2, price: 4.99, specialInstructions: "Ice cold" }
        ],
        82.95,
        "jennifer.wilson@example.com"
    );
    const result4 = await sendOrderToMerchant(pizzaPartyOrder);
    results.push(result4);
    
    await new Promise(resolve => setTimeout(resolve, orderInterval));
    
    // Order 5: Dessert Lover
    console.log('\n🍰 ORDER 5: Sweet Tooth Special');
    const dessertOrder = await createOrderForRealBusiness(
        "Robert Davis",
        "+1555111333",
        [
            { productId: "DESSERT_001", name: "Chocolate Lava Cake", quantity: 2, price: 8.99, specialInstructions: "Warm, vanilla ice cream" },
            { productId: "DESSERT_002", name: "Tiramisu", quantity: 1, price: 7.99, specialInstructions: "Extra cocoa powder" },
            { productId: "DESSERT_003", name: "Fresh Strawberries", quantity: 1, price: 5.99, specialInstructions: "With whipped cream" },
            { productId: "DRINK_002", name: "Espresso", quantity: 2, price: 2.99, specialInstructions: "Double shot" }
        ],
        34.95,
        "robert.davis@example.com"
    );
    const result5 = await sendOrderToMerchant(dessertOrder);
    results.push(result5);
    
    await new Promise(resolve => setTimeout(resolve, orderInterval));
    
    // Order 6: BBQ Feast
    console.log('\n🔥 ORDER 6: BBQ Smokehouse');
    const bbqOrder = await createOrderForRealBusiness(
        "Marcus Johnson",
        "+1555222444",
        [
            { productId: "BBQ_001", name: "Pulled Pork Sandwich", quantity: 2, price: 14.99, specialInstructions: "Extra BBQ sauce, pickles" },
            { productId: "BBQ_002", name: "Beef Brisket", quantity: 1, price: 18.99, specialInstructions: "Lean cut, smoky" },
            { productId: "BBQ_003", name: "Mac & Cheese", quantity: 2, price: 6.99, specialInstructions: "Crispy top" },
            { productId: "BBQ_004", name: "Coleslaw", quantity: 1, price: 4.99, specialInstructions: "Creamy style" }
        ],
        66.95,
        "marcus.johnson@example.com"
    );
    const result6 = await sendOrderToMerchant(bbqOrder);
    results.push(result6);
    
    await new Promise(resolve => setTimeout(resolve, orderInterval));
    
    // Order 7: Mediterranean
    console.log('\n🥙 ORDER 7: Mediterranean Feast');
    const medOrder = await createOrderForRealBusiness(
        "Sophia Papadopoulos",
        "+1555333555",
        [
            { productId: "MED_001", name: "Chicken Gyro", quantity: 2, price: 12.99, specialInstructions: "Extra tzatziki, no onions" },
            { productId: "MED_002", name: "Greek Salad", quantity: 1, price: 9.99, specialInstructions: "Extra feta, olive oil" },
            { productId: "MED_003", name: "Hummus & Pita", quantity: 1, price: 7.99, specialInstructions: "Warm pita, paprika" },
            { productId: "MED_004", name: "Baklava", quantity: 3, price: 4.99, specialInstructions: "Honey drizzle" }
        ],
        50.95,
        "sophia.papadopoulos@example.com"
    );
    const result7 = await sendOrderToMerchant(medOrder);
    results.push(result7);
    
    await new Promise(resolve => setTimeout(resolve, orderInterval));
    
    // Order 8: Seafood Special
    console.log('\n🦐 ORDER 8: Ocean Fresh');
    const seafoodOrder = await createOrderForRealBusiness(
        "Captain Jack",
        "+1555444666",
        [
            { productId: "SEA_001", name: "Fish & Chips", quantity: 1, price: 16.99, specialInstructions: "Cod, malt vinegar" },
            { productId: "SEA_002", name: "Shrimp Scampi", quantity: 1, price: 19.99, specialInstructions: "Extra garlic, lemon" },
            { productId: "SEA_003", name: "Clam Chowder", quantity: 2, price: 7.99, specialInstructions: "Extra crackers" },
            { productId: "SEA_004", name: "Lobster Roll", quantity: 1, price: 24.99, specialInstructions: "Connecticut style" }
        ],
        77.95,
        "captain.jack@example.com"
    );
    const result8 = await sendOrderToMerchant(seafoodOrder);
    results.push(result8);
    
    // Summary
    console.log('\n📊 ADDITIONAL TEST ORDERS SUMMARY');
    console.log('='.repeat(80));
    const successCount = results.filter(r => r.success).length;
    console.log(`Successfully created: ${successCount}/8 orders`);
    
    const orderTypes = [
        'Asian Fusion', 'Hearty Breakfast', 'Vegan Special', 'Pizza Party', 
        'Sweet Tooth Special', 'BBQ Smokehouse', 'Mediterranean Feast', 'Ocean Fresh'
    ];
    
    results.forEach((result, index) => {
        const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
        console.log(`${orderTypes[index]}: ${status}`);
        if (!result.success) {
            console.log(`   Error: ${JSON.stringify(result.error)}`);
        }
    });
    
    if (successCount === 8) {
        console.log('\n🎉 ALL 8 ADDITIONAL ORDERS CREATED SUCCESSFULLY!');
        console.log('📱 Your Flutter app should now show 8 more new orders');
        console.log('🔔 Total new orders today: 13 orders (5 + 8)');
        console.log('⏰ Orders were spaced 4 seconds apart for proper notification testing');
    } else {
        console.log('\n⚠️  Some orders failed. Check the error messages above.');
    }
    
    return results;
}

// Verify total orders
async function verifyTotalOrders() {
    console.log('\n🔍 CHECKING TOTAL ORDERS...');
    
    try {
        const response = await fetch(`${MERCHANT_API}/merchant/orders/${REAL_BUSINESS_ID}`);
        const data = await response.json();
        
        if (response.ok) {
            const totalOrders = data.count || data.orders?.length || 0;
            console.log(`✅ Total orders in your business: ${totalOrders}`);
            
            if (data.orders && data.orders.length > 0) {
                console.log('\n📋 LATEST 5 ORDERS:');
                const latest = data.orders.slice(0, 5);
                latest.forEach((order, index) => {
                    const timestamp = new Date(order.createdAt || Date.now()).toLocaleTimeString();
                    console.log(`   ${index + 1}. [${timestamp}] ${order.orderId} - ${order.customerName} - $${order.totalAmount}`);
                });
            }
        } else {
            console.log('❌ Failed to fetch orders:', data);
        }
    } catch (error) {
        console.log('❌ Error verifying orders:', error.message);
    }
}

// Main execution
async function main() {
    console.log('🚀 CREATING MORE NOTIFICATION TEST ORDERS');
    console.log('📱 Testing Flutter app real-time notifications with diverse orders');
    console.log('🔔 Each order will be spaced 4 seconds apart');
    console.log('⏰ Perfect for testing notification delivery timing!');
    console.log('\n🎯 TESTING STRATEGY:');
    console.log('- 8 different cuisine types');
    console.log('- Various order sizes ($30-$83)');
    console.log('- Mixed payment methods');
    console.log('- Diverse customer profiles');
    console.log('- Special notification test notes');
    
    await createMoreTestOrders();
    await new Promise(resolve => setTimeout(resolve, 3000));
    await verifyTotalOrders();
    
    console.log('\n📱 FLUTTER APP TESTING CHECKLIST:');
    console.log('□ Did you receive 8 instant notifications?');
    console.log('□ Do orders appear without refresh/logout?');
    console.log('□ Are notification sounds/vibrations working?');
    console.log('□ Can you accept/reject orders smoothly?');
    console.log('□ Do status updates sync back to Central Platform?');
    
    console.log('\n🔔 NOTIFICATION STATUS CHECK:');
    console.log('✅ Working = Orders appear instantly with notifications');
    console.log('❌ Not Working = Need logout/refresh to see new orders');
    console.log('\n💡 If notifications aren\'t working, we\'ll deploy the WebSocket system next!');
}

main().catch(console.error);
