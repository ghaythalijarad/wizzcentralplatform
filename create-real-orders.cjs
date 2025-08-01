// Test Order Flow Script for Real Business ID
// This script sends orders to the actual logged-in business

const fetch = require('node-fetch');

const MERCHANT_API = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
const REAL_BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5'; // Your actual business ID

async function createOrderForRealBusiness(customerName, customerPhone, items, totalAmount) {
    const orderId = `ORD_${Date.now()}`;
    
    return {
        orderId: orderId,
        businessId: REAL_BUSINESS_ID,
        customerId: `CUST_${Date.now()}`,
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: `${customerName.toLowerCase().replace(' ', '.')}@example.com`,
        deliveryAddress: {
            street: "456 Real Street",
            city: "Your City",
            zipCode: "12345",
            coordinates: {
                latitude: 40.7589,
                longitude: -73.9851
            },
            instructions: "Call when you arrive"
        },
        items: items,
        totalAmount: totalAmount,
        paymentMethod: "credit_card",
        notes: "Real order test for Flutter app",
        estimatedDeliveryTime: new Date(Date.now() + 25*60000).toISOString(),
        centralPlatformCallback: "https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/merchant-status-updates"
    };
}

async function sendOrderToMerchant(orderData) {
    console.log(`\n🚀 SENDING ORDER ${orderData.orderId} TO YOUR BUSINESS`);
    console.log('=' .repeat(60));
    
    try {
        console.log('📦 Order Details:');
        console.log(`   Business ID: ${orderData.businessId}`);
        console.log(`   Customer: ${orderData.customerName} (${orderData.customerPhone})`);
        console.log(`   Items: ${orderData.items.length} items, Total: $${orderData.totalAmount}`);
        console.log(`   Delivery: ${orderData.deliveryAddress.street}, ${orderData.deliveryAddress.city}`);
        
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

async function createTestOrdersForYourBusiness() {
    console.log('🏪 CREATING TEST ORDERS FOR YOUR REAL BUSINESS');
    console.log(`Business ID: ${REAL_BUSINESS_ID}`);
    console.log('=' .repeat(60));
    
    const results = [];
    
    // Order 1: Pizza Order
    console.log('\n🍕 ORDER 1: Pizza & Drinks');
    const pizzaOrder = await createOrderForRealBusiness(
        "Alice Johnson",
        "+1555123456",
        [
            { productId: "PIZZA_001", name: "Pepperoni Pizza", quantity: 1, price: 18.99, specialInstructions: "Extra cheese" },
            { productId: "PIZZA_002", name: "Margherita Pizza", quantity: 1, price: 16.99, specialInstructions: "Light sauce" },
            { productId: "DRINK_001", name: "Coca Cola", quantity: 2, price: 2.99, specialInstructions: "No ice" }
        ],
        41.96
    );
    const result1 = await sendOrderToMerchant(pizzaOrder);
    results.push(result1);
    
    // Wait between orders
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Order 2: Burger Combo
    console.log('\n🍔 ORDER 2: Burger Combo');
    const burgerOrder = await createOrderForRealBusiness(
        "Bob Wilson",
        "+1555987654",
        [
            { productId: "BURGER_001", name: "Classic Cheeseburger", quantity: 1, price: 14.99, specialInstructions: "Medium well" },
            { productId: "SIDES_001", name: "French Fries", quantity: 1, price: 4.99, specialInstructions: "Extra crispy" },
            { productId: "SIDES_002", name: "Onion Rings", quantity: 1, price: 5.99, specialInstructions: "Well done" },
            { productId: "DRINK_002", name: "Pepsi", quantity: 1, price: 2.99, specialInstructions: "With ice" }
        ],
        28.96
    );
    const result2 = await sendOrderToMerchant(burgerOrder);
    results.push(result2);
    
    // Wait between orders
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Order 3: Healthy Option
    console.log('\n🥗 ORDER 3: Healthy Choice');
    const saladOrder = await createOrderForRealBusiness(
        "Carol Davis",
        "+1555456789",
        [
            { productId: "SALAD_001", name: "Caesar Salad", quantity: 1, price: 12.99, specialInstructions: "Dressing on side" },
            { productId: "SALAD_002", name: "Greek Salad", quantity: 1, price: 13.99, specialInstructions: "Extra olives" },
            { productId: "DRINK_003", name: "Fresh Orange Juice", quantity: 1, price: 4.99, specialInstructions: "No pulp" }
        ],
        31.97
    );
    const result3 = await sendOrderToMerchant(saladOrder);
    results.push(result3);
    
    // Wait between orders
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Order 4: Family Order
    console.log('\n👨‍👩‍👧‍👦 ORDER 4: Family Order');
    const familyOrder = await createOrderForRealBusiness(
        "David Martinez",
        "+1555321098",
        [
            { productId: "PIZZA_003", name: "Supreme Pizza", quantity: 2, price: 22.99, specialInstructions: "Cut in squares" },
            { productId: "WINGS_001", name: "BBQ Wings", quantity: 12, price: 15.99, specialInstructions: "Extra sauce" },
            { productId: "SIDES_003", name: "Garlic Bread", quantity: 2, price: 6.99, specialInstructions: "Extra garlic" },
            { productId: "DRINK_004", name: "2L Coca Cola", quantity: 1, price: 4.99, specialInstructions: "Cold" }
        ],
        79.95
    );
    const result4 = await sendOrderToMerchant(familyOrder);
    results.push(result4);
    
    // Summary
    console.log('\n📊 TEST ORDERS SUMMARY');
    console.log('=' .repeat(60));
    const successCount = results.filter(r => r.success).length;
    console.log(`Successfully created: ${successCount}/4 orders`);
    
    results.forEach((result, index) => {
        const orderType = ['Pizza & Drinks', 'Burger Combo', 'Healthy Choice', 'Family Order'][index];
        console.log(`${orderType}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    });
    
    if (successCount === 4) {
        console.log('\n🎉 ALL TEST ORDERS CREATED SUCCESSFULLY!');
        console.log('📱 Your Flutter app should now show 4 new orders');
        console.log(`🔍 Check your app or API: GET /merchant/orders/${REAL_BUSINESS_ID}`);
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
            console.log(`✅ Found ${data.count} orders for your business:`);
            data.orders.forEach((order, index) => {
                console.log(`   ${index + 1}. ${order.orderId} - ${order.customerName} - $${order.totalAmount}`);
            });
        } else {
            console.log('❌ Failed to fetch orders:', data);
        }
    } catch (error) {
        console.log('❌ Error verifying orders:', error.message);
    }
}

// Run the test
async function main() {
    await createTestOrdersForYourBusiness();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await verifyOrdersCreated();
}

main().catch(console.error);
