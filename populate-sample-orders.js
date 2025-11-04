#!/usr/bin/env node

/**
 * Populate WizzOrders Table with Sample Data
 * This script creates realistic sample orders for testing the Orders Management page
 */

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: 'us-east-1' // Update if your region is different
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'WizzOrders';

// Sample data
const customers = [
    { id: 'USER-001', name: 'Ahmed Hassan' },
    { id: 'USER-002', name: 'Fatima Ali' },
    { id: 'USER-003', name: 'Omar Mohammed' },
    { id: 'USER-004', name: 'Sara Abdullah' },
    { id: 'USER-005', name: 'Hassan Ibrahim' },
    { id: 'USER-006', name: 'Mariam Khalil' },
    { id: 'USER-007', name: 'Youssef Karim' },
    { id: 'USER-008', name: 'Layla Rashid' }
];

const businesses = [
    { id: 'BIZ-001', name: 'Whizz Burger' },
    { id: 'BIZ-002', name: 'Pizza Palace' },
    { id: 'BIZ-003', name: 'Shawarma King' },
    { id: 'BIZ-004', name: 'Sushi Express' },
    { id: 'BIZ-005', name: 'Baghdad Grill' },
    { id: 'BIZ-006', name: 'Kebab House' },
    { id: 'BIZ-007', name: 'Fresh Salads Co' },
    { id: 'BIZ-008', name: 'Sweet Treats Bakery' }
];

const statuses = [
    'pending',
    'confirmed', 
    'preparing',
    'ready_for_pickup',
    'picked_up',
    'out_for_delivery',
    'delivered',
    'cancelled'
];

const paymentMethods = ['cash', 'card', 'wallet'];

const addresses = [
    '123 Al-Rasheed St, Baghdad, Iraq',
    '456 Karrada, Baghdad, Iraq',
    '789 Mansour, Baghdad, Iraq',
    '321 Jadiriya, Baghdad, Iraq',
    '654 Adhamiya, Baghdad, Iraq',
    '987 Saydiya, Baghdad, Iraq',
    '147 Zayouna, Baghdad, Iraq',
    '258 Arasat, Baghdad, Iraq'
];

const menuItems = [
    { name: 'Burger Combo', price: 12500 },
    { name: 'Pizza Margherita', price: 18000 },
    { name: 'Chicken Shawarma', price: 8000 },
    { name: 'Sushi Roll Set', price: 25000 },
    { name: 'Mixed Grill Platter', price: 22000 },
    { name: 'Beef Kebab', price: 15000 },
    { name: 'Caesar Salad', price: 10000 },
    { name: 'Chocolate Cake', price: 7000 },
    { name: 'Fries', price: 4000 },
    { name: 'Soft Drink', price: 2000 }
];

// Generate random order ID
function generateOrderId() {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${date}-${random}`;
}

// Generate random timestamp within last 7 days
function generateRandomTimestamp() {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    return sevenDaysAgo + Math.floor(Math.random() * (now - sevenDaysAgo));
}

// Generate random items for an order
function generateOrderItems() {
    const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
    const items = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < numItems; i++) {
        let index;
        do {
            index = Math.floor(Math.random() * menuItems.length);
        } while (usedIndices.has(index));
        
        usedIndices.add(index);
        const item = menuItems[index];
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
        
        items.push({
            itemName: item.name,
            quantity: quantity,
            price: item.price
        });
    }
    
    return items;
}

// Create a sample order
function createSampleOrder(index) {
    const orderId = generateOrderId();
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const business = businesses[Math.floor(Math.random() * businesses.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const address = addresses[Math.floor(Math.random() * addresses.length)];
    const items = generateOrderItems();
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const timestamp = generateRandomTimestamp();
    
    const order = {
        PK: `ORDER#${orderId}`,
        SK: `ORDER#${orderId}`,
        orderId: orderId,
        customerName: customer.name,
        customerId: customer.id,
        businessName: business.name,
        businessId: business.id,
        orderDate: new Date(timestamp).toISOString(),
        status: status,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        deliveryAddress: address,
        items: items,
        notes: index % 3 === 0 ? 'Please knock twice' : '',
        createdAt: timestamp,
        updatedAt: timestamp
    };
    
    // Add driver info for orders that are picked up or out for delivery
    if (status === 'picked_up' || status === 'out_for_delivery' || status === 'delivered') {
        const driverNames = ['Ali Karim', 'Mohammed Saeed', 'Hussein Abbas', 'Tariq Faisal'];
        const driverName = driverNames[Math.floor(Math.random() * driverNames.length)];
        order.driverName = driverName;
        order.driverId = `DRV-${Math.floor(Math.random() * 100)}`;
    }
    
    return order;
}

// Insert order into DynamoDB
async function insertOrder(order) {
    const params = {
        TableName: TABLE_NAME,
        Item: order
    };
    
    try {
        await dynamoDB.put(params).promise();
        console.log(`✅ Created order: ${order.orderId} (${order.status}) - ${order.customerName} from ${order.businessName}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to create order ${order.orderId}:`, error.message);
        return false;
    }
}

// Main function
async function populateSampleOrders() {
    console.log('🚀 Starting to populate WizzOrders table with sample data...\n');
    
    const numberOfOrders = 20;
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < numberOfOrders; i++) {
        const order = createSampleOrder(i);
        const success = await insertOrder(order);
        
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        
        // Small delay to avoid throttling
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully created: ${successCount} orders`);
    console.log(`❌ Failed: ${failCount} orders`);
    console.log(`📈 Total: ${numberOfOrders} orders`);
    console.log('\n🎉 Done! Visit the Orders page to see your sample orders.');
    console.log('🔗 URL: https://main.d2f5oacwil9cbi.amplifyapp.com/pages/orders.html');
}

// Run the script
populateSampleOrders().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
