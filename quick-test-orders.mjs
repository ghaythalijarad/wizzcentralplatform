// Quick test order generator
import fetch from 'node-fetch';

const MERCHANT_API = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
const REAL_BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

async function createQuickOrder(name, phone, items, total) {
    const orderId = `QUICK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const orderData = {
        orderId,
        businessId: REAL_BUSINESS_ID,
        customerId: `CUST_${Date.now()}`,
        customerName: name,
        customerPhone: phone,
        customerEmail: `${name.toLowerCase().replace(/\s+/g, '.')}@test.com`,
        deliveryAddress: {
            street: "123 Quick Test St",
            city: "Test City",
            zipCode: "12345",
            coordinates: { latitude: 40.7589, longitude: -73.9851 },
            instructions: "🔔 QUICK NOTIFICATION TEST"
        },
        items,
        totalAmount: total,
        paymentMethod: "credit_card",
        notes: `🚨 QUICK TEST ORDER ${orderId} - Check notifications!`,
        estimatedDeliveryTime: new Date(Date.now() + 30*60000).toISOString(),
        centralPlatformCallback: "https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/merchant-status-updates"
    };
    
    try {
        console.log(`🚀 Creating order: ${name} - $${total}`);
        const response = await fetch(`${MERCHANT_API}/webhooks/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        if (response.ok) {
            console.log(`✅ SUCCESS: ${orderId}`);
            return true;
        } else {
            console.log(`❌ FAILED: ${response.status} - ${JSON.stringify(result)}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🔔 CREATING QUICK TEST ORDERS FOR NOTIFICATION TESTING');
    console.log('=' .repeat(60));
    
    const orders = [
        { name: "Pizza Pete", phone: "+1555111001", items: [{ name: "Pepperoni Pizza", price: 18.99, quantity: 1 }], total: 18.99 },
        { name: "Burger Bob", phone: "+1555111002", items: [{ name: "Cheeseburger", price: 12.99, quantity: 1 }], total: 12.99 },
        { name: "Salad Sam", phone: "+1555111003", items: [{ name: "Caesar Salad", price: 14.99, quantity: 1 }], total: 14.99 },
        { name: "Taco Tim", phone: "+1555111004", items: [{ name: "Beef Tacos", price: 9.99, quantity: 3 }], total: 29.97 },
        { name: "Sushi Sue", phone: "+1555111005", items: [{ name: "California Roll", price: 8.99, quantity: 2 }], total: 17.98 }
    ];
    
    let successCount = 0;
    
    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const success = await createQuickOrder(order.name, order.phone, order.items, order.total);
        if (success) successCount++;
        
        // Wait 2 seconds between orders
        if (i < orders.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n📊 RESULTS:');
    console.log(`✅ Successfully created: ${successCount}/${orders.length} orders`);
    console.log('\n📱 CHECK YOUR FLUTTER APP NOW!');
    console.log('- Did you receive 5 new notifications?');
    console.log('- Do the orders appear instantly?');
    console.log('- Or do you need to refresh/logout?');
}

main().catch(console.error);
