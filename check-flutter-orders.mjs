// Check existing orders for the Flutter app business ID
import fetch from 'node-fetch';

const MERCHANT_API = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
const REAL_BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

async function checkExistingOrders() {
    console.log('🔍 CHECKING EXISTING ORDERS FOR FLUTTER APP');
    console.log('='.repeat(60));
    console.log(`🏪 Business ID: ${REAL_BUSINESS_ID}`);
    console.log(`🔗 API: ${MERCHANT_API}`);
    
    try {
        const response = await fetch(`${MERCHANT_API}/merchant/orders/${REAL_BUSINESS_ID}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log(`\n✅ Found ${data.count} orders for your Flutter app:\n`);
            
            data.orders.forEach((order, index) => {
                console.log(`📦 ORDER ${index + 1}: ${order.orderId}`);
                console.log(`   👤 Customer: ${order.customerName}`);
                console.log(`   📱 Phone: ${order.customerPhone}`);
                console.log(`   💰 Total: $${order.totalAmount}`);
                console.log(`   📍 Status: ${order.status}`);
                console.log(`   📅 Created: ${new Date(order.createdAt).toLocaleString()}`);
                console.log(`   🍽️  Items: ${order.items.length} items`);
                order.items.forEach((item, itemIndex) => {
                    console.log(`      ${itemIndex + 1}. ${item.name} (x${item.quantity}) - $${item.price}`);
                });
                console.log(`   📝 Notes: ${order.notes || 'No notes'}`);
                console.log('   ' + '-'.repeat(50));
            });
            
            console.log('\n📊 ORDER SUMMARY:');
            console.log('='.repeat(40));
            
            // Count by language/type
            const englishOrders = data.orders.filter(o => o.customerName.match(/[a-zA-Z]/));
            const arabicOrders = data.orders.filter(o => o.customerName.match(/[\u0600-\u06FF]/));
            
            console.log(`📍 English Orders: ${englishOrders.length}`);
            console.log(`📍 Arabic Orders: ${arabicOrders.length}`);
            console.log(`📍 Total Orders: ${data.count}`);
            
            // Status breakdown
            const statusCount = {};
            data.orders.forEach(order => {
                statusCount[order.status] = (statusCount[order.status] || 0) + 1;
            });
            
            console.log('\n📈 STATUS BREAKDOWN:');
            Object.entries(statusCount).forEach(([status, count]) => {
                console.log(`   ${status}: ${count} orders`);
            });
            
            console.log('\n🎉 YOUR FLUTTER APP SHOULD DISPLAY ALL THESE ORDERS!');
            console.log('\n📝 NEXT STEPS:');
            console.log('1. Open your Flutter merchant app');
            console.log('2. Login with your business credentials');
            console.log('3. Check the orders screen - you should see 6 orders');
            console.log('4. Try accepting/rejecting an order to test the flow');
            console.log('5. Status updates should sync back to Central Platform');
            
        } else {
            console.log('❌ Failed to fetch orders:', data);
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

checkExistingOrders();
