import fetch from 'node-fetch';

const MERCHANT_API = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
const REAL_BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

const timestamp = Date.now();
const orderId = `NEW_${timestamp}`;

const orderData = {
    orderId: orderId,
    businessId: REAL_BUSINESS_ID,
    customerId: `CUST_${timestamp}`,
    customerName: "Fresh Order Customer",
    customerPhone: "+1555666777",
    customerEmail: "fresh.order@example.com",
    deliveryAddress: {
        street: "777 Fresh Order Lane",
        city: "New Test City",
        zipCode: "98765",
        coordinates: { latitude: 40.7589, longitude: -73.9851 },
        instructions: "🔔 NEW FRESH ORDER - Call when outside!"
    },
    items: [
        { productId: "FRESH_001", name: "Deluxe Cheeseburger", quantity: 2, price: 16.99, specialInstructions: "Medium rare, extra pickles" },
        { productId: "FRESH_002", name: "Loaded Nachos", quantity: 1, price: 11.99, specialInstructions: "Extra cheese, jalapeños" },
        { productId: "FRESH_003", name: "Chocolate Milkshake", quantity: 2, price: 5.99, specialInstructions: "Extra thick, whipped cream" },
        { productId: "FRESH_004", name: "Onion Rings", quantity: 1, price: 7.99, specialInstructions: "Golden crispy" }
    ],
    totalAmount: 59.95,
    paymentMethod: "credit_card",
    notes: `🚨 NEW FRESH ORDER ${orderId} - Testing notification #3!`,
    estimatedDeliveryTime: new Date(Date.now() + 35*60000).toISOString(),
    centralPlatformCallback: "https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/merchant-status-updates"
};

console.log('🚀 CREATING NEW FRESH SINGLE ORDER');
console.log('==================================================');
console.log(`📦 Order ID: ${orderId}`);
console.log(`👤 Customer: ${orderData.customerName}`);
console.log(`📞 Phone: ${orderData.customerPhone}`);
console.log(`💰 Total: $${orderData.totalAmount}`);
console.log(`💳 Payment: ${orderData.paymentMethod}`);
console.log(`🍔 Items: 2x Deluxe Cheeseburger, Loaded Nachos, 2x Milkshake, Onion Rings`);
console.log(`📍 Address: ${orderData.deliveryAddress.street}, ${orderData.deliveryAddress.city}`);

try {
    console.log('📡 Sending to merchant backend...');
    const response = await fetch(`${MERCHANT_API}/webhooks/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
        console.log('✅ SUCCESS! New fresh order created!');
        console.log(`📱 CHECK YOUR FLUTTER APP RIGHT NOW!`);
        console.log(`🔔 Did you receive notification #3 for: ${orderId}?`);
        console.log(`🎯 This is the LARGEST test order yet ($59.95)!`);
        console.log(`💡 Compare notification timing with previous orders:`);
        console.log(`   - Order 1: $32.98 (Burger + Fries)`);
        console.log(`   - Order 2: $40.97 (Pizza + Wings)`);
        console.log(`   - Order 3: $59.95 (2 Burgers + Nachos + Shakes + Rings)`);
    } else {
        console.log('❌ FAILED:', response.status, result);
    }
} catch (error) {
    console.log('❌ ERROR:', error.message);
}
