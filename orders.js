// Orders Management JavaScript
console.log('orders.js script loaded');

// AWS and table config
let dynamoDB = null;
const ORDERS_TABLE = 'order-receiver-orders-dev';
const AWS_REGION = 'us-east-1';

// Global data
let ordersData = [];
let filteredOrders = [];
let centralPlatformService = null;
let orderManagementUI = null;

// Status mapping
const ORDER_STATUSES = {
    'pending':    { label: 'Pending',        class: 'pending',         color: '#f59e0b', icon: 'hourglass_empty' },
    'confirmed':  { label: 'Confirmed',      class: 'confirmed',       color: '#3b82f6', icon: 'check_circle' },
    'preparing':  { label: 'Preparing',      class: 'preparing',       color: '#2563eb', icon: 'restaurant' },
    'ready_for_pickup': { label: 'Ready for Pickup', class: 'ready',    color: '#10b981', icon: 'local_shipping' },
    'picked_up':  { label: 'Picked Up',       class: 'picked-up',      color: '#6b21a8', icon: 'delivery_dining' },
    'out_for_delivery': { label: 'Out for Delivery', class: 'out-delivery', color: '#f97316', icon: 'directions_bike' },
    'delivered':  { label: 'Delivered',       class: 'delivered',       color: '#10b981', icon: 'check_circle' },
    'cancelled':  { label: 'Cancelled',       class: 'cancelled',       color: '#ef4444', icon: 'cancel' },
    'unknown':    { label: 'Unknown',         class: 'unknown',         color: '#6b7280', icon: 'help_outline' }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Orders page DOM loaded');
    if (typeof initializeDashboard === 'function') {
        initializeDashboard();
    }
    
    // Check authentication using centralized utility
    if (!Auth.requireAuthentication()) return;
    
    showLoader(true, 'Loading orders...');
    try {
        // Initialize AWS using centralized utility
        await AWSUtils.initialize();
        
        // Initialize Central Platform Integration
        if (typeof CentralPlatformOrderService !== 'undefined') {
            centralPlatformService = new CentralPlatformOrderService();
            orderManagementUI = new OrderManagementUI('ordersTableBody');
            updateIntegrationStatus('Connected', 'success');
        } else {
            updateIntegrationStatus('Not Available', 'error');
        }
        
        await initializeOrdersManagement();
        startRealTimeUpdates();
    } catch (err) {
        console.error('Orders initialization failed:', err);
        showMessage(`Error loading orders: ${err.message}`, 'error');
        updateIntegrationStatus('Error', 'error');
    } finally {
        showLoader(false);
    }
});

// Initialize page logic
async function initializeOrdersManagement() {
    showLoader(true, 'Fetching orders...');
    try {
        // Use centralized AWS utilities
        const dynamoDB = await AWSUtils.getDynamoDBClient();
        await loadOrdersFromDynamoDB(dynamoDB);
        hideMessage();
    } catch (error) {
        console.error('Error loading orders:', error);
        showMessage(`Error: ${error.message}. Showing sample data.`, 'error');
        ordersData = getSampleOrdersData();
    } finally {
        filteredOrders = [...ordersData];
        initializeUI();
        setupEventListeners();
        showLoader(false);
    }
}

// Load from DynamoDB
async function loadOrdersFromDynamoDB(dynamoDB) {
    if (!dynamoDB) throw new Error('DynamoDB client not initialized');
    const params = { TableName: ORDERS_TABLE };
    const result = await dynamoDB.scan(params).promise();
    ordersData = (result.Items || []).map(item => ({
        orderId: item.orderId,
        customerId: item.customerId,
        merchantId: item.merchantId,
        driverId: item.driverId || 'N/A',
        status: item.status || 'unknown',
        total: item.total != null ? `$${item.total.toFixed(2)}` : 'N/A',
        date: formatDate(item.createdAt),
        fullData: item
    }));
    console.log(`Loaded ${ordersData.length} orders`);
}

// Sample fallback
function getSampleOrdersData() {
    return [
        {
            orderId:'ORD1001',
            customerId:'CUST001', 
            merchantId:'MER001',
            driverId:'DRV001',
            status:'pending',
            total:'$45.99',
            date:'7/24/2025',
            fullData: {
                orderId: 'ORD1001',
                customerId: 'CUST001',
                merchantId: 'MER001',
                items: [
                    {name: 'Margherita Pizza', price: 18.99, quantity: 1},
                    {name: 'Caesar Salad', price: 12.99, quantity: 1},
                    {name: 'Garlic Bread', price: 8.99, quantity: 1},
                    {name: 'Coca Cola', price: 4.99, quantity: 1}
                ],
                total: 45.99,
                deliveryAddress: {
                    street: '123 Main Street',
                    city: 'New York',
                    zipCode: '10001'
                },
                customerInfo: {
                    name: 'John Doe',
                    phone: '+1234567890',
                    email: 'john@example.com'
                },
                status: 'pending',
                createdAt: '2025-07-24T10:30:00Z'
            }
        },
        {
            orderId:'ORD1002',
            customerId:'CUST002',
            merchantId:'MER002',
            driverId:'DRV002',
            status:'out_for_delivery',
            total:'$120.00',
            date:'7/25/2025',
            fullData: {
                orderId: 'ORD1002',
                customerId: 'CUST002',
                merchantId: 'MER002',
                items: [
                    {name: 'Sushi Combo', price: 45.99, quantity: 2},
                    {name: 'Miso Soup', price: 8.99, quantity: 2},
                    {name: 'Green Tea', price: 5.99, quantity: 2}
                ],
                total: 120.00,
                deliveryAddress: {
                    street: '456 Oak Avenue',
                    city: 'Los Angeles',
                    zipCode: '90210'
                },
                customerInfo: {
                    name: 'Jane Smith',
                    phone: '+1987654321',
                    email: 'jane@example.com'
                },
                status: 'out_for_delivery',
                createdAt: '2025-07-25T14:15:00Z'
            }
        },
        {
            orderId:'ORD1003',
            customerId:'CUST003',
            merchantId:'MER001',
            driverId:'DRV003',
            status:'delivered',
            total:'$89.50',
            date:'7/23/2025',
            fullData: {
                orderId: 'ORD1003',
                customerId: 'CUST003',
                merchantId: 'MER001',
                items: [
                    {name: 'BBQ Burger', price: 24.99, quantity: 2},
                    {name: 'Sweet Potato Fries', price: 12.99, quantity: 2},
                    {name: 'Milkshake', price: 8.99, quantity: 2},
                    {name: 'Apple Pie', price: 7.99, quantity: 1}
                ],
                total: 89.50,
                deliveryAddress: {
                    street: '789 Pine Road',
                    city: 'Chicago',
                    zipCode: '60601'
                },
                customerInfo: {
                    name: 'Mike Johnson',
                    phone: '+1555666777',
                    email: 'mike@example.com'
                },
                status: 'delivered',
                createdAt: '2025-07-23T18:45:00Z'
            }
        }
    ];
}

// UI and events
function initializeUI() { renderOrdersTable(); }
function setupEventListeners() {
    document.getElementById('ordersTableBody');
}

// Render table
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    if (filteredOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:#666;"><i class="fas fa-shopping-bag" style="font-size:3rem; color:#ccc;"></i><div>No orders found</div></td></tr>`;
        return;
    }
    tbody.innerHTML = filteredOrders.map(o => {
        // Determine available actions based on order status
        const canSendToMerchant = ['pending', 'confirmed'].includes(o.status);
        const sendButton = canSendToMerchant ? 
            `<button class="btn-action" onclick="sendOrderToMerchant('${o.orderId}')" title="Send to Merchant"><i class="fas fa-paper-plane"></i></button>` : '';
        
        return `
        <tr id="order-row-${o.orderId}">
            <td>${o.orderId}</td>
            <td>${o.customerId}</td>
            <td>${o.merchantId}</td>
            <td>${o.driverId}</td>
            <td><span class="status-badge ${ORDER_STATUSES[o.status]?.class||'unknown'}">${ORDER_STATUSES[o.status]?.label||'Unknown'}</span></td>
            <td>${o.total}</td>
            <td>${o.date}</td>
            <td>
                <div class="actions">
                    <button class="btn-action" onclick="viewOrder('${o.orderId}')" title="View Details"><i class="fas fa-eye"></i></button>
                    ${sendButton}
                    <button class="btn-action" onclick="trackOrderStatus('${o.orderId}')" title="Track Status"><i class="fas fa-route"></i></button>
                </div>
            </td>
        </tr>`
    }).join('');
}

// View details
function viewOrder(id) {
    const o = ordersData.find(x=>x.orderId===id);
    if (!o) return;
    
    // Enhanced order details with full information
    const orderData = o.fullData || {};
    const items = orderData.items || [];
    const deliveryAddress = orderData.deliveryAddress || {};
    const customerInfo = orderData.customerInfo || {};
    
    const itemsList = items.map(item => 
        `• ${item.name} - $${item.price} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
    
    const orderDetails = `
📦 ORDER DETAILS
Order ID: ${o.orderId}
Customer: ${customerInfo.name || o.customerId}
Phone: ${customerInfo.phone || 'N/A'}
Email: ${customerInfo.email || 'N/A'}

🏪 MERCHANT
Merchant ID: ${o.merchantId}

🛵 DRIVER
Driver ID: ${o.driverId}

📍 DELIVERY ADDRESS
${deliveryAddress.street || 'N/A'}
${deliveryAddress.city || 'N/A'} ${deliveryAddress.zipCode || ''}

🛒 ITEMS
${itemsList || 'No items available'}

💰 TOTAL: ${o.total}
📅 ORDER DATE: ${o.date}
📊 STATUS: ${ORDER_STATUSES[o.status]?.label || 'Unknown'}

Would you like to send this order to the merchant backend?
    `;
    
    if (confirm(orderDetails)) {
        sendOrderToMerchant(o.orderId);
    }
}

// Send order to merchant backend
async function sendOrderToMerchant(orderId) {
    if (!centralPlatformService) {
        alert('Central Platform Integration not available');
        return;
    }

    // Find the order data
    const order = ordersData.find(o => o.orderId === orderId);
    if (!order || !order.fullData) {
        showMessage(`Order ${orderId} not found or missing data`, 'error');
        return;
    }

    showLoader(true, `Sending order ${orderId} to merchant...`);
    
    try {
        console.log('Sending order to merchant:', order.fullData);
        
        // Use the Central Platform Integration service
        const result = await centralPlatformService.sendOrderToMerchant(order.fullData);
        
        if (result.success) {
            showMessage(`Order ${orderId} sent to merchant successfully! Status: ${result.status}`, 'success');
            
            // Update the order status locally
            const orderIndex = ordersData.findIndex(o => o.orderId === orderId);
            if (orderIndex !== -1) {
                ordersData[orderIndex].status = 'confirmed';
                ordersData[orderIndex].fullData.status = 'confirmed';
                filteredOrders = [...ordersData];
                renderOrdersTable();
                
                // Highlight the updated row
                setTimeout(() => {
                    const row = document.getElementById(`order-row-${orderId}`);
                    if (row) {
                        row.classList.add('order-row-updated');
                        setTimeout(() => row.classList.remove('order-row-updated'), 2000);
                    }
                }, 100);
            }
            
        } else {
            throw new Error(result.error || 'Failed to send order to merchant');
        }
        
    } catch (error) {
        console.error('Send to merchant failed:', error);
        showMessage(`Failed to send order ${orderId}: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
}

// Track order status
async function trackOrderStatus(orderId) {
    if (!centralPlatformService) {
        alert('Central Platform Integration not available');
        return;
    }

    showLoader(true, `Tracking order ${orderId}...`);
    
    try {
        const result = await centralPlatformService.getOrderStatus(orderId);
        
        if (result.success) {
            const statusInfo = `
Order ID: ${orderId}
Current Status: ${result.order.status}
Last Updated: ${new Date(result.order.updatedAt || Date.now()).toLocaleString()}
Merchant ID: ${result.order.merchantId}
${result.order.estimatedDelivery ? `Estimated Delivery: ${new Date(result.order.estimatedDelivery).toLocaleString()}` : ''}

Track this order in real-time?
            `;
            
            if (confirm(statusInfo)) {
                // Start real-time tracking for this specific order
                startOrderTracking(orderId);
            }
            
        } else {
            throw new Error(result.error || 'Failed to get order status');
        }
        
    } catch (error) {
        console.error('Order tracking failed:', error);
        showMessage(`Failed to track order ${orderId}: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
}

// Start tracking a specific order
function startOrderTracking(orderId) {
    const trackingInterval = setInterval(async () => {
        try {
            const result = await centralPlatformService.getOrderStatus(orderId);
            if (result.success) {
                // Update the order in the table if status changed
                const orderIndex = ordersData.findIndex(o => o.orderId === orderId);
                if (orderIndex !== -1 && ordersData[orderIndex].status !== result.order.status) {
                    ordersData[orderIndex].status = result.order.status;
                    ordersData[orderIndex].fullData = result.order;
                    filteredOrders = [...ordersData];
                    renderOrdersTable();
                    
                    // Show notification
                    showMessage(`Order ${orderId} status updated to: ${result.order.status}`, 'success');
                    
                    // Stop tracking if order is completed
                    if (['delivered', 'cancelled'].includes(result.order.status)) {
                        clearInterval(trackingInterval);
                        console.log(`Stopped tracking order ${orderId} - final status: ${result.order.status}`);
                    }
                }
            }
        } catch (error) {
            console.error(`Error tracking order ${orderId}:`, error);
            // Continue tracking despite errors
        }
    }, 10000); // Check every 10 seconds
    
    console.log(`Started real-time tracking for order ${orderId}`);
}

// Refresh data (enhanced with silent option)
async function refreshOrdersData(showLoading = true) {
    if (showLoading) showLoader(true,'Refreshing orders...');
    
    try { 
        const dynamoDB = await AWSUtils.getDynamoDBClient();
        await loadOrdersFromDynamoDB(dynamoDB); 
        renderOrdersTable(); 
        if (showLoading) hideMessage(); 
        updateLastUpdateTime();
    }
    catch(e){ 
        console.error(e); 
        if (showLoading) showMessage(`Error: ${e.message}`,'error'); 
    }
    finally{ 
        if (showLoading) showLoader(false); 
    }
}

// Helpers
function showMessage(msg,type='info'){
    const el=document.getElementById('orders-table-status');
    if(el){ el.textContent=msg; el.className=`table-status-info table-status-${type}`; el.style.display='block'; }
}
function hideMessage(){ const el=document.getElementById('orders-table-status'); if(el) el.style.display='none'; }
function showLoader(show,msg='Loading...'){ let loader=document.getElementById('loader-overlay'); /* reuse from merchants.js */ }
function formatDate(iso){ return iso?new Date(iso).toLocaleDateString():'N/A'; }

// Integration Status Management
function updateIntegrationStatus(status, type) {
    const statusEl = document.getElementById('integration-status');
    if (statusEl) {
        statusEl.textContent = status;
        statusEl.className = `stat-value ${type}`;
    }
}

function updateLastUpdateTime() {
    const lastUpdateEl = document.getElementById('last-update');
    if (lastUpdateEl) {
        lastUpdateEl.textContent = new Date().toLocaleTimeString();
    }
}

// Real-time Updates
function startRealTimeUpdates() {
    // Update every 30 seconds
    setInterval(async () => {
        try {
            await refreshOrdersData(false); // Silent refresh
            updateLastUpdateTime();
        } catch (error) {
            console.error('Real-time update failed:', error);
        }
    }, 30000);
}

// Test Order Modal Functions
function openTestOrderModal() {
    const modal = document.getElementById('testOrderModal');
    if (modal) {
        modal.style.display = 'flex';
        setupTestOrderForm();
    }
}

function closeTestOrderModal() {
    const modal = document.getElementById('testOrderModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupTestOrderForm() {
    const form = document.getElementById('testOrderForm');
    if (form) {
        // Pre-populate with realistic test data
        document.getElementById('testCustomerId').value = 'CUST' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        document.getElementById('testMerchantId').value = 'MER' + String(Math.floor(Math.random() * 100)).padStart(3, '0');
        document.getElementById('testOrderTotal').value = (Math.random() * 80 + 20).toFixed(2); // Random total between $20-$100
        
        // Realistic order items
        const sampleItems = [
            [
                {"name": "Classic Burger", "price": 15.99, "quantity": 1},
                {"name": "French Fries", "price": 6.99, "quantity": 1},
                {"name": "Coca Cola", "price": 3.99, "quantity": 1}
            ],
            [
                {"name": "Margherita Pizza", "price": 18.99, "quantity": 1},
                {"name": "Caesar Salad", "price": 12.99, "quantity": 1},
                {"name": "Garlic Bread", "price": 7.99, "quantity": 1}
            ],
            [
                {"name": "Chicken Teriyaki", "price": 22.99, "quantity": 1},
                {"name": "Fried Rice", "price": 8.99, "quantity": 1},
                {"name": "Miso Soup", "price": 4.99, "quantity": 1},
                {"name": "Green Tea", "price": 2.99, "quantity": 1}
            ],
            [
                {"name": "Fish Tacos", "price": 16.99, "quantity": 2},
                {"name": "Guacamole", "price": 5.99, "quantity": 1},
                {"name": "Mexican Rice", "price": 4.99, "quantity": 1}
            ]
        ];
        
        const randomItems = sampleItems[Math.floor(Math.random() * sampleItems.length)];
        document.getElementById('testOrderItems').value = JSON.stringify(randomItems, null, 2);
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            await submitTestOrder();
        };
    }
}

async function submitTestOrder() {
    if (!centralPlatformService) {
        alert('Central Platform Integration not available');
        return;
    }

    showLoader(true, 'Creating test order...');
    
    try {
        const customerId = document.getElementById('testCustomerId').value;
        const merchantId = document.getElementById('testMerchantId').value;
        const orderTotal = parseFloat(document.getElementById('testOrderTotal').value);
        const orderItemsText = document.getElementById('testOrderItems').value;
        
        let orderItems;
        try {
            orderItems = JSON.parse(orderItemsText);
        } catch (e) {
            throw new Error('Invalid JSON format for order items');
        }

        // Generate unique order ID
        const orderId = 'ORD' + Date.now().toString().slice(-6);
        
        const testOrder = {
            orderId,
            customerId,
            merchantId,
            items: orderItems,
            total: orderTotal,
            deliveryAddress: {
                street: '123 Test Street',
                city: 'Test City',
                zipCode: '12345'
            },
            customerInfo: {
                name: 'Test Customer',
                phone: '+1234567890',
                email: 'test@example.com'
            },
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Add to local orders data immediately
        const newOrderDisplay = {
            orderId: testOrder.orderId,
            customerId: testOrder.customerId,
            merchantId: testOrder.merchantId,
            driverId: 'N/A',
            status: 'pending',
            total: `$${testOrder.total.toFixed(2)}`,
            date: formatDate(testOrder.createdAt),
            fullData: testOrder
        };
        
        ordersData.unshift(newOrderDisplay); // Add to beginning of array
        filteredOrders = [...ordersData];
        renderOrdersTable();
        
        showMessage(`Test order ${orderId} created successfully! You can now send it to merchant.`, 'success');
        closeTestOrderModal();
        
        // Highlight the new order
        setTimeout(() => {
            const row = document.getElementById(`order-row-${orderId}`);
            if (row) {
                row.classList.add('order-row-updated');
                setTimeout(() => row.classList.remove('order-row-updated'), 3000);
                row.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
        
    } catch (error) {
        console.error('Test order creation failed:', error);
        showMessage(`Test order failed: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
}

// Generate Test Order Function - Automatically creates and sends orders to merchant app
async function generateTestOrder() {
    showLoader(true, 'Generating and sending test order...');
    
    try {
        // API URLs
        const MERCHANT_API = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
        const CENTRAL_API = 'https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev';
        
        // Generate unique order ID
        const orderId = `ORD_${Date.now()}`;
        
        // Sample customers
        const customers = [
            { name: "John Doe", phone: "+1234567890", email: "john.doe@example.com" },
            { name: "Jane Smith", phone: "+1987654321", email: "jane.smith@example.com" },
            { name: "Mike Johnson", phone: "+1555123456", email: "mike.johnson@example.com" },
            { name: "Sarah Wilson", phone: "+1777888999", email: "sarah.wilson@example.com" },
            { name: "David Brown", phone: "+1222333444", email: "david.brown@example.com" }
        ];
        
        // Sample order configurations
        const orderTypes = [
            {
                type: "pizza",
                items: [
                    { productId: "PIZZA_001", name: "Margherita Pizza", quantity: 2, price: 15.99, specialInstructions: "Extra cheese, no olives" },
                    { productId: "DRINK_001", name: "Coca Cola", quantity: 2, price: 2.99, specialInstructions: "No ice" }
                ],
                totalAmount: 37.96
            },
            {
                type: "burger",
                items: [
                    { productId: "BURGER_001", name: "Deluxe Burger", quantity: 1, price: 16.99, specialInstructions: "No pickles" },
                    { productId: "FRIES_001", name: "French Fries", quantity: 1, price: 4.99, specialInstructions: "Extra crispy" },
                    { productId: "SHAKE_001", name: "Vanilla Shake", quantity: 1, price: 5.99, specialInstructions: "Extra thick" }
                ],
                totalAmount: 27.97
            },
            {
                type: "sushi",
                items: [
                    { productId: "SUSHI_001", name: "California Roll", quantity: 2, price: 12.99, specialInstructions: "No sesame seeds" },
                    { productId: "SUSHI_002", name: "Salmon Nigiri", quantity: 4, price: 3.99, specialInstructions: "" },
                    { productId: "MISO_001", name: "Miso Soup", quantity: 1, price: 4.99, specialInstructions: "Extra tofu" }
                ],
                totalAmount: 38.95
            },
            {
                type: "mexican",
                items: [
                    { productId: "TACO_001", name: "Beef Tacos", quantity: 3, price: 4.99, specialInstructions: "Mild sauce" },
                    { productId: "BURRITO_001", name: "Chicken Burrito", quantity: 1, price: 11.99, specialInstructions: "Extra guac" },
                    { productId: "DRINK_002", name: "Horchata", quantity: 1, price: 3.99, specialInstructions: "Extra cinnamon" }
                ],
                totalAmount: 30.95
            }
        ];
        
        // Random selections
        const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
        const randomOrderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
        
        // Create test order data
        const orderData = {
            orderId: orderId,
            businessId: "7ccf646c-9594-48d4-8f63-c366d89257e5", // Real business ID from Flutter app
            customerId: `CUST${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            customerName: randomCustomer.name,
            customerPhone: randomCustomer.phone,
            customerEmail: randomCustomer.email,
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
            items: randomOrderType.items,
            totalAmount: randomOrderType.totalAmount,
            paymentMethod: "credit_card",
            notes: "Please call when arrived",
            estimatedDeliveryTime: new Date(Date.now() + 30*60000).toISOString(),
            centralPlatformCallback: `${CENTRAL_API}/api/merchant-status-updates`
        };
        
        console.log(`🚀 GENERATING ORDER ${orderData.orderId} FOR MERCHANT APP`);
        console.log(`📦 Customer: ${orderData.customerName} (${orderData.customerPhone})`);
        console.log(`📦 Items: ${orderData.items.length} items, Total: $${orderData.totalAmount}`);
        console.log(`📦 Type: ${randomOrderType.type}`);
        
        // Send to merchant backend
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
            // Add to local orders display
            const newOrderDisplay = {
                orderId: orderData.orderId,
                customerId: orderData.customerId,
                merchantId: orderData.businessId,
                driverId: 'N/A',
                status: 'pending',
                total: `$${orderData.totalAmount.toFixed(2)}`,
                date: formatDate(new Date().toISOString()),
                fullData: orderData
            };
            
            ordersData.unshift(newOrderDisplay); // Add to beginning of array
            filteredOrders = [...ordersData];
            renderOrdersTable();
            
            showMessage(`✅ Test order ${orderId} generated and sent to merchant app successfully!`, 'success');
            
            // Highlight the new order
            setTimeout(() => {
                const row = document.getElementById(`order-row-${orderId}`);
                if (row) {
                    row.classList.add('order-row-updated');
                    setTimeout(() => row.classList.remove('order-row-updated'), 3000);
                    row.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
            
            console.log('✅ SUCCESS! Order sent to merchant app');
            console.log(`   Response: ${JSON.stringify(responseData, null, 2)}`);
            
        } else {
            throw new Error(`Failed to send order: ${response.status} - ${JSON.stringify(responseData)}`);
        }
        
    } catch (error) {
        console.error('Generate test order failed:', error);
        showMessage(`❌ Failed to generate test order: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
}
