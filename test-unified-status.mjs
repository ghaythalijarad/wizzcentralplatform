// Test script to verify unified order status logic is working
import fetch from 'node-fetch';

const MERCHANT_API = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
const REAL_BUSINESS_ID = '2e102ff3-72a2-4823-93b8-f975d915c82e';

async function testStatusUpdate() {
    console.log('🧪 Testing Unified Order Status Logic');
    console.log('=====================================');
    
    // Create a test order first
    const testOrder = {
        orderId: `TEST_${Date.now()}`,
        businessId: REAL_BUSINESS_ID,
        customerId: `CUST_${Date.now()}`,
        customerName: "Status Test Customer",
        customerPhone: "+1555999999",
        customerEmail: "status.test@example.com",
        deliveryAddress: {
            street: "123 Test Street",
            city: "Test City",
            zipCode: "12345",
            coordinates: { latitude: 40.7589, longitude: -73.9851 },
            instructions: "Status test order"
        },
        items: [
            { productId: "TEST_001", name: "Test Item", quantity: 1, price: 10.99 }
        ],
        totalAmount: 10.99,
        paymentMethod: "credit_card",
        notes: "🧪 Testing unified status logic",
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString()
    };
    
    try {
        // Step 1: Create the order
        console.log('\n📦 Step 1: Creating test order...');
        const createResponse = await fetch(`${MERCHANT_API}/webhooks/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testOrder)
        });
        
        if (!createResponse.ok) {
            throw new Error(`Order creation failed: ${createResponse.status}`);
        }
        
        console.log('✅ Order created successfully');
        
        // Step 2: Test status update with unified logic
        console.log('\n📝 Step 2: Testing status update to "confirmed"...');
        const statusUpdate = {
            orderId: testOrder.orderId,
            newStatus: 'confirmed',
            estimatedPreparationTime: 15,
            merchantNotes: 'Testing unified status logic'
        };
        
        const updateResponse = await fetch(`${MERCHANT_API}/merchant/orders/update-status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(statusUpdate)
        });
        
        const updateResult = await updateResponse.json();
        
        if (updateResponse.ok) {
            console.log('✅ Status update successful!');
            console.log('📊 Response:', JSON.stringify(updateResult, null, 2));
            
            // Check if the response includes translations
            if (updateResult.statusTranslations) {
                console.log('\n🌐 Status Translations:');
                console.log(`   English: ${updateResult.statusTranslations.english}`);
                console.log(`   Arabic: ${updateResult.statusTranslations.arabic}`);
                console.log('✅ Unified status logic is working correctly!');
            } else {
                console.log('⚠️  Status translations not found in response');
            }
        } else {
            console.log('❌ Status update failed:', updateResult);
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
}

// Run the test
testStatusUpdate();
