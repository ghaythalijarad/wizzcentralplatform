// Simple test script to debug the order creation
import fetch from 'node-fetch';

console.log('🚀 Starting simple test...');
console.log('📅 Date:', new Date().toISOString());

const MERCHANT_API = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
const REAL_BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

console.log('🔗 API:', MERCHANT_API);
console.log('🏪 Business ID:', REAL_BUSINESS_ID);

async function testConnection() {
    console.log('\n🔍 Testing API connection...');
    
    try {
        const response = await fetch(`${MERCHANT_API}/merchant/orders/${REAL_BUSINESS_ID}`);
        console.log('📡 Response status:', response.status);
        
        const data = await response.json();
        console.log('📦 Response data:', JSON.stringify(data, null, 2));
        
        return data;
    } catch (error) {
        console.log('❌ Connection error:', error.message);
        return null;
    }
}

async function createSingleTestOrder() {
    console.log('\n🍕 Creating single test order...');
    
    const orderData = {
        orderId: `ORD_${Date.now()}`,
        businessId: REAL_BUSINESS_ID,
        customerId: `CUST_${Date.now()}`,
        customerName: "Test Customer",
        customerPhone: "+1555000001",
        customerEmail: "test@example.com",
        deliveryAddress: {
            street: "123 Test Street",
            city: "Test City",
            zipCode: "12345",
            coordinates: {
                latitude: 40.7589,
                longitude: -73.9851
            },
            instructions: "Test order"
        },
        items: [
            { productId: "TEST_001", name: "Test Pizza", quantity: 1, price: 19.99, specialInstructions: "Test order" }
        ],
        totalAmount: 19.99,
        paymentMethod: "credit_card",
        notes: "Test order from script",
        estimatedDeliveryTime: new Date(Date.now() + 25*60000).toISOString(),
        centralPlatformCallback: "https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/merchant-status-updates"
    };
    
    console.log('📦 Order data prepared:', orderData.orderId);
    
    try {
        console.log('📡 Sending to merchant backend...');
        const response = await fetch(`${MERCHANT_API}/webhooks/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        console.log('📡 Response status:', response.status);
        const responseData = await response.json();
        console.log('📦 Response:', JSON.stringify(responseData, null, 2));
        
        return response.ok;
    } catch (error) {
        console.log('❌ Error sending order:', error.message);
        return false;
    }
}

async function main() {
    console.log('🏪 SIMPLE ORDER TEST FOR FLUTTER APP');
    console.log('='.repeat(50));
    
    // Test connection first
    await testConnection();
    
    // Create single test order
    const success = await createSingleTestOrder();
    
    console.log('\n📊 Result:', success ? '✅ SUCCESS' : '❌ FAILED');
    
    // Check orders again
    await new Promise(resolve => setTimeout(resolve, 2000));
    await testConnection();
}

main().catch(error => {
    console.log('❌ Script error:', error.message);
    console.log(error.stack);
});
