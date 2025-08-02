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
const orderId = `SINGLE_${timestamp}`;

const orderData = {
    orderId: orderId,
    businessId: REAL_BUSINESS_ID,
    customerId: `CUST_${timestamp}`,
    customerName: "Single Test Customer",
    customerPhone: "+1555888999",
    customerEmail: "single.test@example.com",
    deliveryAddress: {
        street: "999 Single Test Street",
        city: "Notification City",
        zipCode: "12345",
        coordinates: { latitude: 40.7589, longitude: -73.9851 },
        instructions: "🚨 SINGLE ORDER TEST - Check your Flutter app!"
    },
    items: [
        { productId: "SINGLE_001", name: "Test Notification Burger", quantity: 1, price: 25.99, specialInstructions: "Extra notification sauce" },
        { productId: "SINGLE_002", name: "Flutter Fries", quantity: 1, price: 6.99, specialInstructions: "Crispy notifications" }
    ],
    totalAmount: 32.98,
    paymentMethod: "credit_card",
    notes: `🔔 SINGLE TEST ORDER ${orderId} - Did you get the notification instantly?`,
    estimatedDeliveryTime: new Date(Date.now() + 30*60000).toISOString(),
    centralPlatformCallback: "https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/merchant-status-updates"
};

console.log('🚀 CREATING SINGLE TEST ORDER');
console.log('==================================================');
console.log(`📦 Order ID: ${orderId}`);
console.log(`👤 Customer: ${orderData.customerName}`);
console.log(`💰 Total: $${orderData.totalAmount}`);

try {
    console.log('📡 Sending to merchant backend...');
    const response = await fetch(`${MERCHANT_API}/webhooks/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
        console.log('✅ SUCCESS! Single order created!');
        console.log(`📱 CHECK YOUR FLUTTER APP NOW!`);
        console.log(`🔔 Did you receive a notification for: ${orderId}?`);
    } else {
        console.log('❌ FAILED:', response.status, result);
    }
} catch (error) {
    console.log('❌ ERROR:', error.message);
}
