// Test Order Flow Script
// This script demonstrates sending orders to the merchant app

import fetch from 'node-fetch';

const CENTRAL_API = 'https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev';
const MERCHANT_API = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';

async function createTestOrder() {
    const orderId = `ORD_${Date.now()}`;
    
    return {
        orderId: orderId,
        businessId: "7ccf646c-9594-48d4-8f63-c366d89257e5", // Real business ID from Flutter app
        customerId: "CUST001",
        customerName: "John Doe",
        customerPhone: "+1234567890",
        customerEmail: "john.doe@example.com",
        deliveryAddress: {
            street: "123 Main Street",
            city: "New York",
            zipCode: "10001",
            coordinates: {
                latitude: 40.7128,
                longitude: -74.0060
            },
            instructions: "Ring doorbell twice"
        },
        items: [
            {
                productId: "PIZZA_001",
                name: "Margherita Pizza",
                quantity: 2,
                price: 15.99,
                specialInstructions: "Extra cheese, no olives"
            },
            {
                productId: "DRINK_001",
                name: "Coca Cola",
                quantity: 2,
                price: 2.99,
                specialInstructions: "No ice"
            }
        ],
        totalAmount: 37.96,
        paymentMethod: "credit_card",
        notes: "Please call when arrived",
        estimatedDeliveryTime: new Date(Date.now() + 30*60000).toISOString(),
        centralPlatformCallback: `${CENTRAL_API}/api/merchant-status-updates`
    };
}

async function sendOrderToMerchant(orderData) {
    console.log(`\n🚀 SENDING ORDER ${orderData.orderId} TO MERCHANT APP`);
    console.log('=' .repeat(60));
    
    try {
        console.log('📦 Order Details:');
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
            console.log('✅ SUCCESS! Order sent to merchant app');
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

async function testOrderFlow() {
    console.log('🏪 SIMULATING: CUSTOMER APP → CENTRAL PLATFORM → MERCHANT APP');
    console.log('📋 This simulates the Central Platform processing customer orders');
    console.log('📤 Platform sends processed orders to your Flutter Merchant App');
    console.log('=' .repeat(70));
    
    // Test 1: Pizza Order (Customer places order via Customer App)
    console.log('\n🍕 SIMULATION 1: Customer orders Pizza via Customer App');
    console.log('   📱 Customer App → 🏢 Central Platform → 📦 Processing → 🍕 Your Merchant App');
    const pizzaOrder = await createTestOrder();
    pizzaOrder.items = [
        { productId: "PIZZA_001", name: "Margherita Pizza", quantity: 2, price: 15.99 },
        { productId: "DRINK_001", name: "Coca Cola", quantity: 2, price: 2.99 }
    ];
    pizzaOrder.totalAmount = 37.96;
    
    const result1 = await sendOrderToMerchant(pizzaOrder);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Burger Order (Another customer places order via Customer App)
    console.log('\n🍔 SIMULATION 2: Customer orders Burger via Customer App');
    console.log('   📱 Customer App → 🏢 Central Platform → 📦 Processing → 🍕 Your Merchant App');
    const burgerOrder = await createTestOrder();
    burgerOrder.customerName = "Jane Smith";
    burgerOrder.customerPhone = "+1987654321";
    burgerOrder.items = [
        { productId: "BURGER_001", name: "Deluxe Burger", quantity: 1, price: 16.99 },
        { productId: "FRIES_001", name: "French Fries", quantity: 1, price: 4.99 }
    ];
    burgerOrder.totalAmount = 21.98;
    
    const result2 = await sendOrderToMerchant(burgerOrder);
    
    // Summary
    console.log('\n📊 SIMULATION SUMMARY');
    console.log('=' .repeat(70));
    console.log(`Pizza Customer Order: ${result1.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Burger Customer Order: ${result2.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (result1.success && result2.success) {
        console.log('\n🎉 SIMULATION SUCCESSFUL! Customer orders processed by Central Platform');
        console.log('📱 Your Flutter Merchant App should have received both orders');
        console.log('📋 Orders flow: Customer App → Central Platform → Your Merchant App');
        console.log('📧 Check your Flutter merchant app for new order notifications');
        console.log('\n📝 Next Steps:');
        console.log('   1. Open your Flutter merchant app');
        console.log('   2. You should see these 2 NEW orders + 6 existing orders = 8 total');
        console.log('   3. Try accepting/rejecting to test the reverse flow');
    } else {
        console.log('\n⚠️  Simulation failed. Check the Central Platform configuration.');
    }
}

// Run the test
testOrderFlow().catch(console.error);
