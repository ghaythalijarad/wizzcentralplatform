// Orders Management JavaScript
console.log('orders.js script loaded');

// Global logout function
window.logout = async () => {
    try {
        if (AWS && AWS.config && AWS.config.credentials) {
            AWS.config.credentials.clearCachedId();
        }
        sessionStorage.clear();
        localStorage.removeItem('accessToken');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
};

// Always allow unauthenticated access for orders page
function checkAuthentication() {
    const idToken = sessionStorage.getItem('idToken');
    const accessToken = sessionStorage.getItem('accessToken');
    if (!idToken || !accessToken) {
        console.warn('No authentication tokens found. Continuing with unauthenticated DynamoDB access.');
        return true;
    }
    console.log('Authentication tokens found, proceeding with authenticated access');
    return true;
}

// AWS and table config
let dynamoDB = null;
const ORDERS_TABLE = 'order-receiver-orders-dev';
const AWS_REGION = 'us-east-1';

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
    if (typeof initializeDashboard === 'function') {
        initializeDashboard();
    }
    if (!checkAuthentication()) return;
    showLoader(true, 'Loading orders...');
    try {
        await initializeAWS();
        await initializeOrdersManagement();
    } catch (err) {
        console.error('Orders initialization failed:', err);
        showMessage(`Error loading orders: ${err.message}`, 'error');
    } finally {
        showLoader(false);
    }
});

// AWS initialization
async function initializeAWS() {
    if (typeof AWS === 'undefined') {
        throw new Error('AWS SDK not loaded.');
    }
    const resp = await fetch('../amplify_outputs.json');
    if (!resp.ok) throw new Error(`Failed to fetch config: ${resp.status}`);
    const outputs = await resp.json();
    const region = outputs.data?.aws_region || AWS_REGION;
    const idToken = sessionStorage.getItem('idToken');
    const userPoolId = outputs.auth.user_pool_id;
    const identityPoolId = outputs.auth.identity_pool_id;
    const provider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    AWS.config.update({ region });
    const credParams = { IdentityPoolId: identityPoolId };
    if (idToken) credParams.Logins = { [provider]: idToken };
    AWS.config.credentials = new AWS.CognitoIdentityCredentials(credParams);
    await AWS.config.credentials.refreshPromise();
    dynamoDB = new AWS.DynamoDB.DocumentClient();
    console.log('AWS initialized, identityId:', AWS.config.credentials.identityId);
}

// Initialize page logic
async function initializeOrdersManagement() {
    showLoader(true, 'Fetching orders...');
    try {
        await loadOrdersFromDynamoDB();
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
async function loadOrdersFromDynamoDB() {
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
        {orderId:'ORD1001',customerId:'CUST001',merchantId:'MER001',driverId:'DRV001',status:'pending',total:'$45.99',date:'7/24/2025'},
        {orderId:'ORD1002',customerId:'CUST002',merchantId:'MER002',driverId:'DRV002',status:'out_for_delivery',total:'$120.00',date:'7/25/2025'},
        {orderId:'ORD1003',customerId:'CUST003',merchantId:'MER001',driverId:'DRV003',status:'delivered',total:'$89.50',date:'7/23/2025'}
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
    tbody.innerHTML = filteredOrders.map(o => `
        <tr>
            <td>${o.orderId}</td>
            <td>${o.customerId}</td>
            <td>${o.merchantId}</td>
            <td>${o.driverId}</td>
            <td><span class="status-badge ${ORDER_STATUSES[o.status]?.class||'unknown'}">${ORDER_STATUSES[o.status]?.label||'Unknown'}</span></td>
            <td>${o.total}</td>
            <td>${o.date}</td>
            <td>
                <button class="btn-action" onclick="viewOrder('${o.orderId}')"><i class="fas fa-eye"></i></button>
            </td>
        </tr>`).join('');
}

// View details
function viewOrder(id) {
    const o = ordersData.find(x=>x.orderId===id);
    if (!o) return;
    alert(`Order ${o.orderId}\nStatus: ${ORDER_STATUSES[o.status]?.label}\nTotal: ${o.total}`);
}

// Refresh data
async function refreshOrdersData() {
    showLoader(true,'Refreshing orders...');
    try { await loadOrdersFromDynamoDB(); renderOrdersTable(); hideMessage(); }
    catch(e){ console.error(e); showMessage(`Error: ${e.message}`,'error'); }
    finally{ showLoader(false); }
}

// Helpers
function showMessage(msg,type='info'){
    const el=document.getElementById('orders-table-status');
    if(el){ el.textContent=msg; el.className=`table-status-info table-status-${type}`; el.style.display='block'; }
}
function hideMessage(){ const el=document.getElementById('orders-table-status'); if(el) el.style.display='none'; }
function showLoader(show,msg='Loading...'){ let loader=document.getElementById('loader-overlay'); /* reuse from merchants.js */ }
function formatDate(iso){ return iso?new Date(iso).toLocaleDateString():'N/A'; }
