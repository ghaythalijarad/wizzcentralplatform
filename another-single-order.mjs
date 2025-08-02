// ⚠️  DEPRECATED: This test order simulator is no longer used
// 🚀 The platform now processes REAL CUSTOMER ORDERS from the Flutter app
// 📱 Use the customer app developed by your friend instead
// 🔗 See REAL_ORDER_PROCESSING_GUIDE.md for the new API endpoints
// 
// This file has been kept for reference only and should not be executed
//
import fetch from 'node-fetch';

const MERCHANT_API = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
const REAL_BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

const timestamp = Date.now();
const orderId = `ANOTHER_${timestamp}`;

const orderData = {
    orderId: orderId,
    businessId: REAL_BUSINESS_ID,
    customerId: `CUST_${timestamp}`,
    customerName: "Another Test Customer",
    customerPhone: "+1555777888",
    customerEmail: "another.test@example.com",
    deliveryAddress: {
        street: "888 Another Test Boulevard",
        city: "Flutter Test City",
        zipCode: "54321",
        coordinates: { latitude: 40.7589, longitude: -73.9851 },
        instructions: "🔔 ANOTHER SINGLE TEST - Ring twice!"
    },
    items: [
        { productId: "ANOTHER_001", name: "Supreme Pizza", quantity: 1, price: 21.99, specialInstructions: "Extra pepperoni, thin crust" },
        { productId: "ANOTHER_002", name: "Chicken Wings", quantity: 8, price: 12.99, specialInstructions: "Buffalo sauce, extra crispy" },
        { productId: "ANOTHER_003", name: "Garlic Bread", quantity: 1, price: 5.99, specialInstructions: "Extra garlic butter" }
    ],
    totalAmount: 40.97,
    paymentMethod: "cash",
    notes: `🚨 ANOTHER TEST ORDER ${orderId} - Check notification #2!`,
    estimatedDeliveryTime: new Date(Date.now() + 25*60000).toISOString(),
    centralPlatformCallback: "https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/merchant-status-updates"
};

console.log('🚀 CREATING ANOTHER SINGLE TEST ORDER');
console.log('==================================================');
console.log(`📦 Order ID: ${orderId}`);
console.log(`👤 Customer: ${orderData.customerName}`);
console.log(`📞 Phone: ${orderData.customerPhone}`);
console.log(`💰 Total: $${orderData.totalAmount}`);
console.log(`💳 Payment: ${orderData.paymentMethod}`);
console.log(`🍕 Items: Supreme Pizza, 8 Chicken Wings, Garlic Bread`);

try {
    console.log('📡 Sending to merchant backend...');
    const response = await fetch(`${MERCHANT_API}/webhooks/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
        console.log('✅ SUCCESS! Another single order created!');
        console.log(`📱 CHECK YOUR FLUTTER APP AGAIN!`);
        console.log(`🔔 Did you receive notification #2 for: ${orderId}?`);
        console.log(`🎯 This is test order #2 - compare with previous notification timing!`);
    } else {
        console.log('❌ FAILED:', response.status, result);
    }
} catch (error) {
    console.log('❌ ERROR:', error.message);
}
