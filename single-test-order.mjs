// Create a single test order for Flutter app notification testing
import fetch from 'node-fetch';

const MERCHANT_API = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
const REAL_BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

async function createSingleTestOrder() {
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
            coordinates: {
                latitude: 40.7589,
                longitude: -73.9851
            },
            instructions: "🚨 SINGLE ORDER TEST - Check your Flutter app!"
        },
        items: [
            {
                productId: "SINGLE_001",
                name: "Test Notification Burger",
                quantity: 1,
                price: 25.99,
                specialInstructions: "Extra notification sauce"
            },
            {
                productId: "SINGLE_002", 
                name: "Flutter Fries",
                quantity: 1,
                price: 6.99,
                specialInstructions: "Crispy notifications"
            }
        ],
        totalAmount: 32.98,
        paymentMethod: "credit_card",
        notes: `🔔 SINGLE TEST ORDER ${orderId} - Did you get the notification instantly?`,
        estimatedDeliveryTime: new Date(Date.now() + 30*60000).toISOString(),
        centralPlatformCallback: "https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/merchant-status-updates"
    };

    console.log('🚀 CREATING SINGLE TEST ORDER');
    console.log('=' .repeat(50));
    console.log(`📦 Order ID: ${orderId}`);
    console.log(`👤 Customer: ${orderData.customerName}`);
    console.log(`📞 Phone: ${orderData.customerPhone}`);
    console.log(`💰 Total: $${orderData.totalAmount}`);
    console.log(`🔔 Note: ${orderData.notes}`);
    console.log('');

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

        const responseData = await response.json();

        if (response.ok) {
            console.log('✅ SUCCESS! Single order created successfully!');
            console.log(`   Order ID: ${orderId}`);
            console.log(`   Response: ${JSON.stringify(responseData, null, 2)}`);
            console.log('');
            console.log('📱 CHECK YOUR FLUTTER APP RIGHT NOW!');
            console.log('🔔 Did you receive an instant notification?');
            console.log('👀 Can you see the new order without refreshing?');
            return true;
        } else {
            console.log(`❌ FAILED! Status: ${response.status}`);
            console.log(`   Error: ${JSON.stringify(responseData, null, 2)}`);
            return false;
        }

    } catch (error) {
        console.log(`❌ NETWORK ERROR: ${error.message}`);
        return false;
    }
}

// Run the single order creation
createSingleTestOrder()
    .then(success => {
        if (success) {
            console.log('');
            console.log('🎯 NOTIFICATION TEST COMPLETE');
            console.log('Please check your Flutter merchant app and report:');
            console.log('1. Did you receive a notification?');
            console.log('2. Does the order appear instantly?');
            console.log('3. Or do you need to refresh/logout?');
        } else {
            console.log('❌ Order creation failed');
        }
    })
    .catch(error => {
        console.log('❌ Script error:', error.message);
    });
