// Orders Management JavaScript
console.log('orders.js script loaded');
// Ensure user is authenticated
Auth.requireAuthentication();

// Global logout using Auth utility
window.logout = () => {
    Auth.clearTokens();
    window.location.href = 'index.html';
};

// AWS and table config
let dynamoDB = null;
const ORDERS_TABLE = window.WIZZCENTRAL_CONFIG.TABLES.ORDERS;
const AWS_REGION = 'us-east-1';

// Normalize status keys (convert hyphens to underscores)
function normalizeStatus(status) {
    if (typeof status !== 'string') return 'unknown';
    return status.replace(/-/g, '_');
}

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

// Global data
let ordersData = [];
let filteredOrders = [];

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Orders page DOM loaded');
    if (typeof initializeDashboard === 'function') initializeDashboard();
    showLoader(true, 'Loading orders...');
    try {
        await fetchOrdersFromApi();
        initializeUI();
        setupEventListeners();
    } catch (err) {
        console.error('Orders initialization failed:', err);
        showMessage(`Error loading orders: ${err.message}`, 'error');
    } finally {
        showLoader(false);
        // Attach refresh button handler
        const refreshBtn = document.getElementById('refreshOrdersBtn');
        if (refreshBtn) refreshBtn.addEventListener('click', () => {
            showLoader(true, 'Refreshing orders...');
            fetchOrdersFromApi();
        });
    }
});

// Fetch orders via backend API
async function fetchOrdersFromApi() {
    showLoader(true, 'Fetching orders...');
    const token = Auth.getToken('accessToken') || Auth.getToken('idToken');
    if (!token) throw new Error('No authentication token available');
    const response = await fetch(`${window.WIZZCENTRAL_CONFIG.API_BASE_URL}/orders`, {
        method: 'GET',
        headers: Auth.attachAuthHeader({ 'Content-Type': 'application/json' })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders from API');
    }
    ordersData = data.orders || data;
    filteredOrders = [...ordersData];
    renderOrdersTable();
    updateDataSourceIndicator('api', `Loaded ${ordersData.length} orders via API`);
}

// UI and events
function initializeUI() { renderOrdersTable(); }
function setupEventListeners() {
    // Close Order Details Modal buttons
    document.querySelectorAll('.close-order-modal').forEach(btn => {
        btn.addEventListener('click', closeOrderModal);
    });
    // Optionally, add overlay click listener to close modal when clicking outside content
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.addEventListener('click', event => {
            if (event.target === modal) closeOrderModal();
        });
    }
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
        const key = normalizeStatus(o.status);
        const info = ORDER_STATUSES[key] || ORDER_STATUSES['unknown'];
        return `
        <tr>
            <td>${o.orderId}</td>
            <td>${o.customerId}</td>
            <td>${o.merchantId}</td>
            <td>${o.driverId}</td>
            <td><span class="status-badge ${info.class}">${info.label}</span></td>
            <td>${o.total}</td>
            <td>${o.date}</td>
            <td>
                <button class="btn-action" onclick="viewOrder('${o.orderId}')"><i class="fas fa-eye"></i></button>
            </td>
        </tr>`;
    }).join('');
}

// Open order details modal
function viewOrder(id) {
    const o = ordersData.find(x => x.orderId === id);
    if (!o) return;
    const body = document.getElementById('orderDetailsBody');
    if (body) {
        const key = normalizeStatus(o.status);
        const info = ORDER_STATUSES[key] || ORDER_STATUSES['unknown'];
        body.innerHTML = `
            <p><strong>Order ID:</strong> ${o.orderId}</p>
            <p><strong>Status:</strong> ${info.label}</p>
            <p><strong>Total:</strong> ${o.total}</p>
            <p><strong>Date:</strong> ${o.date}</p>
        `;
        document.getElementById('orderDetailsModal').style.display = 'flex';
    }
}

// Close the order details modal
function closeOrderModal() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) modal.style.display = 'none';
}

// Refresh data
async function refreshOrdersData() {
    showLoader(true,'Refreshing orders...');
    try { await fetchOrdersFromApi(); }
    catch(e){ console.error(e); showMessage(`Error: ${e.message}`,'error'); }
    finally{ showLoader(false); }
}

// Show/hide loader using shared loader elements
function showLoader(show, message = 'Loading...') {
    const loader = document.getElementById('loader');
    const loaderMessage = document.getElementById('loader-message');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
        if (show && loaderMessage) {
            loaderMessage.textContent = message;
        }
    }
}

// Helpers
function showMessage(msg,type='info'){
    const el=document.getElementById('orders-table-status');
    if(el){ el.textContent=msg; el.className=`table-status-info table-status-${type}`; el.style.display='block'; }
}
function hideMessage(){ const el=document.getElementById('orders-table-status'); if(el) el.style.display='none'; }
function formatDate(iso){ return iso?new Date(iso).toLocaleDateString():'N/A'; }
