// Customers Management JavaScript

// Define logout function only if not already defined by dashboard.js
if (!window.logout) {
    window.logout = async () => {
        try {
            if (AWS && AWS.config && AWS.config.credentials) {
                AWS.config.credentials.clearCachedId();
            }
            sessionStorage.clear();
            localStorage.removeItem('accessToken');
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '../index.html';
        }
    };
}

// Global state
let dynamodbClient = null;
let allCustomers = [];

// 1. Initialize AWS SDK and DynamoDB Client
async function initializeAWS() {
    try {
        console.log('Starting AWS initialization...');
        
        if (typeof AWS === 'undefined') {
            throw new Error('AWS SDK not loaded. Check if CDN script is working.');
        }
        
        if (!window.WIZZCENTRAL_CONFIG) {
            throw new Error('App config not loaded. Check if config.js is loaded before this script.');
        }

        const { COGNITO_REGION, COGNITO_IDENTITY_POOL_ID } = window.WIZZCENTRAL_CONFIG;
        console.log('Using region:', COGNITO_REGION, 'Identity Pool:', COGNITO_IDENTITY_POOL_ID);
        
        AWS.config.update({ region: COGNITO_REGION });

        // Use unauthenticated role for simplicity, as per previous findings
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
        });

        console.log('Refreshing AWS credentials...');
        await AWS.config.credentials.refreshPromise();
        console.log("Successfully fetched AWS credentials for customers (unauthenticated).");

        dynamodbClient = new AWS.DynamoDB.DocumentClient();
        console.log('DynamoDB client created successfully.');
    } catch (error) {
        console.error('Failed to initialize AWS:', error);
        displayError(error);
        throw error; // Stop execution if AWS fails
    }
}

// 2. Load customer data from DynamoDB
async function loadCustomersData() {
    if (!dynamodbClient) {
        throw new Error("DynamoDB client is not initialized.");
    }
    
    console.log('Fetching customers from DynamoDB table: WizzUser_users_dev');
    try {
        const params = { TableName: 'WizzUser_users_dev' };
        const result = await dynamodbClient.scan(params).promise();
        
        console.log('DynamoDB scan result:', result);
        console.log('Items found:', result.Items?.length || 0);
        
        allCustomers = (result.Items || []).map(item => ({
            id: item.userId,
            name: item.name || item.email || 'N/A',
            email: item.email || 'N/A',
            phone: item.phone || 'N/A',
            status: item.isActive ? 'active' : 'inactive',
            totalOrders: item.totalOrders || 0,
            totalSpent: item.totalSpent || 0,
            lastOrder: item.lastOrderAt || item.lastLoginAt || 'N/A',
            segment: item.segment || 'regular',
            avatar: item.avatarUrl || `https://i.pravatar.cc/40?u=${item.userId}`,
            joinDate: item.createdAt,
        }));

        console.log(`Loaded and mapped ${allCustomers.length} customers:`, allCustomers);
    } catch (error) {
        console.error('Error loading customers data from DynamoDB:', error);
        displayError(error);
        allCustomers = []; // Ensure no stale data is shown
    }
}

// 3. Render data and stats into the DOM
function renderCustomersTable(customersList = allCustomers) {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    if (customersList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding: 2rem;">No customers found.</td></tr>`;
        return;
    }

    tbody.innerHTML = customersList.map(customer => `
        <tr>
            <td>
                <div class="customer-info">
                    <div class="customer-avatar"><img src="${customer.avatar}" alt="${customer.name}"></div>
                    <div>
                        <div class="customer-name">${customer.name}</div>
                        <div class="customer-id">#${customer.id.substring(0, 8)}...</div>
                    </div>
                </div>
            </td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td><span class="status-badge ${customer.status}">${customer.status}</span></td>
            <td>${customer.totalOrders}</td>
            <td>$${(customer.totalSpent || 0).toFixed(2)}</td>
            <td>${customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString() : 'N/A'}</td>
            <td><span class="segment-badge ${customer.segment}">${customer.segment}</span></td>
            <td>
                <div class="actions">
                    <button class="btn-action" title="View Details"><i class="fas fa-eye"></i></button>
                    <button class="btn-action" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-action danger" title="Block"><i class="fas fa-ban"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateCustomerStats() {
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length < 2) return;

    const total = allCustomers.length;
    const activeCount = allCustomers.filter(c => c.status === 'active').length;
    
    statCards[0].querySelector('h3').textContent = total;
    statCards[1].querySelector('h3').textContent = activeCount;
}

// 4. Setup event listeners for UI controls
function setupEventListeners() {
    document.getElementById('searchInput')?.addEventListener('input', filterCustomers);
    document.getElementById('statusFilter')?.addEventListener('change', filterCustomers);
    document.getElementById('segmentFilter')?.addEventListener('change', filterCustomers);
}

function filterCustomers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const segmentFilter = document.getElementById('segmentFilter').value;

    const filtered = allCustomers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm) ||
                              c.email.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || c.status === statusFilter;
        const matchesSegment = !segmentFilter || c.segment === segmentFilter;
        return matchesSearch && matchesStatus && matchesSegment;
    });

    renderCustomersTable(filtered);
}

// 5. Error handling and loading state UI
function showLoadingState() {
    const tbody = document.getElementById('customersTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center" style="padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
                    <div>Loading customers...</div>
                </td>
            </tr>`;
    }
}

function displayError(error) {
    const tbody = document.getElementById('customersTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center" style="padding: 2rem; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i>
                    <div>Failed to load data</div>
                    <div style="font-size: 0.9rem; margin-top: 0.5rem;">${error.message}</div>
                </td>
            </tr>`;
    }
}

// Main initialization function
async function main() {
    showLoadingState();
    
    // Wait for dashboard to initialize first (for sidebar functionality)
    if (typeof initializeDashboard === 'function') {
        initializeDashboard();
    }
    
    try {
        await initializeAWS();
        await loadCustomersData();
        renderCustomersTable();
        updateCustomerStats();
        setupEventListeners();
    } catch (error) {
        console.error("Initialization failed:", error);
        // Error is already displayed by the functions that throw it
    }
}

// Run on DOM load
document.addEventListener('DOMContentLoaded', main);
