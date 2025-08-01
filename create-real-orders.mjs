// Script to create test orders for the real business ID used by Flutter app
// This creates orders that the Flutter merchant app will actually see

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
    console.log('='.repeat(60));
    
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
    console.log('='.repeat(60));
    
    const results = [];
    
    // Order 1: Pizza Order (English)
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Order 2: Burger Combo (English)
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Order 3: Healthy Option (English)
    console.log('\n🥗 ORDER 3: Healthy Choice');
    const saladOrder = await createOrderForRealBusiness(
        "Carol Davis",
        "+1555456789",
        [
            { productId: "SALAD_001", name: "Caesar Salad", quantity: 1, price: 12.99, specialInstructions: "Dressing on side" },
            { productId: "SALAD_002", name: "Greek Salad", quantity: 1, price: 13.99, specialInstructions: "Extra olives" }
        ],
        26.98
    );
    const result3 = await sendOrderToMerchant(saladOrder);
    results.push(result3);
    
    // Wait between orders
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Order 4: Arabic Order
    console.log('\n🥙 ORDER 4: Arabic Food');
    const arabicOrder1 = await createOrderForRealBusiness(
        "أحمد محمد",
        "+966501234567",
        [
            { productId: "ARABIC_001", name: "شاورما لحم", quantity: 2, price: 25000, specialInstructions: "بدون خضار" },
            { productId: "ARABIC_002", name: "حمص", quantity: 1, price: 15000, specialInstructions: "مع خبز" },
            { productId: "DRINK_003", name: "عصير برتقال", quantity: 2, price: 8000, specialInstructions: "بارد" }
        ],
        73000,
        "ahmed.mohamed@example.com"
    );
    const result4 = await sendOrderToMerchant(arabicOrder1);
    results.push(result4);
    
    // Wait between orders
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Order 5: Arabic Order 2
    console.log('\n🍽️ ORDER 5: Arabic Family Meal');
    const arabicOrder2 = await createOrderForRealBusiness(
        "فاطمة علي",
        "+966507654321",
        [
            { productId: "ARABIC_003", name: "كبسة دجاج", quantity: 1, price: 35000, specialInstructions: "متوسط التوابل" },
            { productId: "ARABIC_004", name: "سلطة فتوش", quantity: 2, price: 12000, specialInstructions: "بدون نعناع" },
            { productId: "ARABIC_005", name: "خبز عربي", quantity: 4, price: 2000, specialInstructions: "ساخن" }
        ],
        63000,
        "fatima.ali@example.com"
    );
    const result5 = await sendOrderToMerchant(arabicOrder2);
    results.push(result5);
    
    // Wait between orders
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Order 6: Arabic Order 3
    console.log('\n🫖 ORDER 6: Arabic Breakfast');
    const arabicOrder3 = await createOrderForRealBusiness(
        "محمد حسن",
        "+966509876543",
        [
            { productId: "ARABIC_006", name: "فول مدمس", quantity: 2, price: 18000, specialInstructions: "مع طحينة" },
            { productId: "ARABIC_007", name: "فلافل", quantity: 10, price: 20000, specialInstructions: "مقرمش" },
            { productId: "ARABIC_008", name: "شاي أحمر", quantity: 3, price: 6000, specialInstructions: "سكر خفيف" },
            { productId: "ARABIC_009", name: "جبنة بيضاء", quantity: 1, price: 15000, specialInstructions: "طازجة" }
        ],
        59000,
        "mohammed.hassan@example.com"
    );
    const result6 = await sendOrderToMerchant(arabicOrder3);
    results.push(result6);
    
    // Summary
    console.log('\n📊 TEST ORDERS SUMMARY');
    console.log('='.repeat(60));
    const successCount = results.filter(r => r.success).length;
    console.log(`Successfully created: ${successCount}/6 orders`);
    
    const orderTypes = ['Pizza & Drinks', 'Burger Combo', 'Healthy Choice', 'Arabic Food', 'Arabic Family Meal', 'Arabic Breakfast'];
    results.forEach((result, index) => {
        console.log(`${orderTypes[index]}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    });
    
    if (successCount === 6) {
        console.log('\n🎉 ALL TEST ORDERS CREATED SUCCESSFULLY!');
        console.log('📱 Your Flutter app should now show 6 new orders (3 English + 3 Arabic)');
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
            console.log(`✅ Found ${data.count || data.orders?.length || 0} orders for your business:`);
            if (data.orders && data.orders.length > 0) {
                data.orders.forEach((order, index) => {
                    console.log(`   ${index + 1}. ${order.orderId} - ${order.customerName} - $${order.totalAmount}`);
                });
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
    console.log('🚀 STARTING ORDER CREATION FOR FLUTTER APP');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🏪 Business ID: ${REAL_BUSINESS_ID}`);
    console.log(`🔗 Merchant API: ${MERCHANT_API}`);
    console.log('='.repeat(80));
    
    await createTestOrdersForYourBusiness();
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
    await verifyOrdersCreated();
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Open your Flutter merchant app');
    console.log('2. Check if you see the 6 new test orders');
    console.log('3. Try accepting/rejecting orders to test the flow');
    console.log('4. Status updates should flow back to Central Platform');
}

main().catch(console.error);
