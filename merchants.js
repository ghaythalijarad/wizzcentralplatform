// Merchants Management JavaScript

// Load authentication check
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize merchants management
    await initializeMerchantsManagement();
});

// Global logout function
window.logout = async () => {
    sessionStorage.clear();
    localStorage.removeItem('accessToken');
    window.location.href = 'index.html';
};

// Configuration for DynamoDB table
const MERCHANTS_TABLE = 'order-receiver-businesses-dev';
const AWS_REGION = 'us-east-1';

// Status options for merchants - aligned with business app
const MERCHANT_STATUSES = {
    'pending': { label: 'Pending', class: 'pending', color: '#f59e0b', icon: 'hourglass_empty' },
    'approved': { label: 'Approved', class: 'verified', color: '#10b981', icon: 'check_circle' },
    'rejected': { label: 'Rejected', class: 'rejected', color: '#ef4444', icon: 'cancel' },
    'under_review': { label: 'Under Review', class: 'under-review', color: '#3b82f6', icon: 'assignment' },
    'pending_verification': { label: 'Pending Verification', class: 'pending', color: '#f59e0b', icon: 'hourglass_empty' },
    'unknown': { label: 'Unknown', class: 'unknown', color: '#6b7280', icon: 'help_outline' },
    'suspended': { label: 'Suspended', class: 'suspended', color: '#ef4444', icon: 'block' }
};

// Global merchants data
let merchantsData = [];
let filteredMerchants = [];

// Initialize merchants management
async function initializeMerchantsManagement() {
    try {
        console.log('Initializing merchants management...');
        
        // Load merchants data
        await loadMerchantsFromDynamoDB();
        
        // Initialize UI
        initializeUI();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('Merchants management initialized successfully');
    } catch (error) {
        console.error('Failed to initialize merchants management:', error);
        showMessage('Failed to load merchants data', 'error');
    }
}

// Load merchants data from DynamoDB
async function loadMerchantsFromDynamoDB() {
    try {
        console.log('Loading merchants from DynamoDB...');
        
        // Configure AWS SDK
        AWS.config.region = AWS_REGION;
        
        // Get credentials from Cognito session
        const idToken = sessionStorage.getItem('idToken');
        if (!idToken) {
            throw new Error('No authentication token found');
        }
        
        // Configure credentials using the Cognito token
        const cognitoIdentityPoolId = 'us-east-1:38954d71-6b61-431d-942b-406c6a200f7c';
        const cognitoUserPoolId = 'us-east-1_aX8X9oQTV';
        
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: cognitoIdentityPoolId,
            Logins: {
                [`cognito-idp.${AWS_REGION}.amazonaws.com/${cognitoUserPoolId}`]: idToken
            }
        });
        
        // Refresh credentials
        await new Promise((resolve, reject) => {
            AWS.config.credentials.refresh((error) => {
                if (error) {
                    console.error('Failed to refresh credentials:', error);
                    reject(error);
                } else {
                    console.log('Credentials refreshed successfully');
                    resolve();
                }
            });
        });
        
        // Create DynamoDB instance
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        
        // Scan the businesses table
        const params = {
            TableName: MERCHANTS_TABLE
        };
        
        console.log('Scanning DynamoDB table:', MERCHANTS_TABLE);
        const result = await dynamodb.scan(params).promise();
        
        console.log('DynamoDB scan result:', result);
        
        if (result.Items && result.Items.length > 0) {
            merchantsData = result.Items.map(item => ({
                id: item.businessId,
                name: item.businessName || item.name || 'Unknown Business',
                email: item.email || item.contactEmail || 'N/A',
                phone: item.phone || item.contactPhone || 'N/A',
                category: item.category || item.businessType || 'Unknown',
                status: item.status || 'unknown',
                commission: item.commission || 0,
                ordersToday: item.ordersToday || 0,
                revenueToday: item.revenueToday || 0,
                rating: item.rating || null,
                joinDate: item.createdAt || item.registrationDate || item.joinDate || 'N/A',
                avatar: item.logo || item.businessLogo || generateAvatarUrl(item.businessName || item.name),
                address: item.address || item.businessAddress || 'N/A',
                owner: item.owner || item.ownerName || 'N/A',
                description: item.description || 'N/A',
                // Include raw data for debugging
                rawData: item
            }));
            
            console.log(`Loaded ${merchantsData.length} merchants from DynamoDB:`, merchantsData);
        } else {
            console.log('No merchants found in DynamoDB, using sample data');
            merchantsData = getSampleMerchantsData();
        }
        
        filteredMerchants = [...merchantsData];
        console.log('Merchants data loaded successfully');
        
    } catch (error) {
        console.error('Error loading merchants from DynamoDB:', error);
        
        // Show specific error message
        if (error.message.includes('No authentication token')) {
            showMessage('Authentication required. Please log in again.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else if (error.code === 'UnauthorizedOperation' || error.code === 'AccessDenied') {
            showMessage('Access denied. Please check your permissions.', 'error');
        } else {
            showMessage('Failed to load merchants data. Using sample data.', 'warning');
        }
        
        // Use sample data as fallback
        merchantsData = getSampleMerchantsData();
        filteredMerchants = [...merchantsData];
    }
}

// Fetch merchants from API (placeholder for actual API call)
async function fetchMerchantsFromAPI() {
    try {
        // Try to fetch from actual API if available
        if (window.API_CONFIG && window.API_CONFIG.BASE_URL !== 'http://localhost:3000/dev') {
            const response = await fetch(`${window.API_CONFIG.BASE_URL}${window.API_CONFIG.ENDPOINTS.BUSINESSES}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                throw new Error(`API call failed with status: ${response.status}`);
            }
        }
        
        // Fallback to mock data for development/testing
        return {
            businesses: [
                {
                    businessId: 'biz-001',
                    businessName: 'Pizza Palace Downtown',
                    email: 'contact@pizzapalace.com',
                    phone: '+1-555-0123',
                    status: 'approved',
                    category: 'Restaurant',
                    owner: 'John Smith',
                    createdAt: '2024-01-15T10:30:00Z',
                    address: '123 Main St, Downtown',
                    rating: 4.8,
                    ordersToday: 42,
                    revenueToday: 1250.50,
                    commission: 15
                },
                {
                    businessId: 'biz-002',
                    businessName: 'Fresh Market Express',
                    email: 'info@freshmarket.com',
                    phone: '+1-555-0124',
                    status: 'pending',
                    category: 'Grocery',
                    owner: 'Sarah Johnson',
                    createdAt: '2024-07-20T14:22:00Z',
                    address: '456 Oak Avenue',
                    rating: null,
                    ordersToday: 0,
                    revenueToday: 0,
                    commission: 8
                },
                {
                    businessId: 'biz-003',
                    businessName: 'Coffee Corner Cafe',
                    email: 'hello@coffeecorner.com',
                    phone: '+1-555-0125',
                    status: 'unknown',
                    category: 'Restaurant',
                    owner: 'Mike Wilson',
                    createdAt: '2024-07-22T09:15:00Z',
                    address: '789 Pine Street',
                    rating: null,
                    ordersToday: 0,
                    revenueToday: 0,
                    commission: 18
                },
                {
                    businessId: 'biz-004',
                    businessName: 'Quick Pharmacy Plus',
                    email: 'support@quickpharmacy.com',
                    phone: '+1-555-0126',
                    status: 'suspended',
                    category: 'Pharmacy',
                    owner: 'Dr. Emily Chen',
                    createdAt: '2024-05-10T08:45:00Z',
                    address: '321 Health Avenue',
                    rating: 3.2,
                    ordersToday: 0,
                    revenueToday: 0,
                    commission: 12
                }
            ]
        };
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Generate avatar URL
function generateAvatarUrl(name) {
    if (!name) return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=40&h=40&fit=crop&crop=center';
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&size=40&background=random`;
}

// Get sample merchants data (fallback)
function getSampleMerchantsData() {
    return [
        {
            id: 'biz-001',
            name: 'Pizza Palace Downtown',
            email: 'contact@pizzapalace.com',
            phone: '+1-555-0123',
            category: 'Restaurant',
            status: 'approved',
            commission: 15,
            ordersToday: 42,
            revenueToday: 1250.50,
            rating: 4.8,
            joinDate: '2024-01-15',
            avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=40&h=40&fit=crop&crop=center',
            address: '123 Main St, Downtown',
            owner: 'John Smith'
        },
        {
            id: 'biz-002',
            name: 'Fresh Market Express',
            email: 'info@freshmarket.com',
            phone: '+1-555-0124',
            category: 'Grocery',
            status: 'pending',
            commission: 8,
            ordersToday: 0,
            revenueToday: 0,
            rating: null,
            joinDate: '2024-07-20',
            avatar: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=40&h=40&fit=crop&crop=center',
            address: '456 Oak Avenue',
            owner: 'Sarah Johnson'
        },
        {
            id: 'biz-003',
            name: 'Coffee Corner Cafe',
            email: 'hello@coffeecorner.com',
            phone: '+1-555-0125',
            category: 'Restaurant',
            status: 'unknown',
            commission: 18,
            ordersToday: 0,
            revenueToday: 0,
            rating: null,
            joinDate: '2024-07-22',
            avatar: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=40&h=40&fit=crop&crop=center',
            address: '789 Pine Street',
            owner: 'Mike Wilson'
        }
    ];
}

// Initialize UI
function initializeUI() {
    console.log('Initializing UI...');
    renderMerchantsTable();
    updateMerchantStats();
    updateStatusFilter();
}

// Set up event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterMerchants);
    }

    // Filter functionality
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterMerchants);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterMerchants);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshMerchantsData);
    }
}

// Update status filter dropdown
function updateStatusFilter() {
    const statusFilter = document.getElementById('statusFilter');
    if (!statusFilter) return;
    
    // Clear existing options except "All"
    statusFilter.innerHTML = '<option value="">All Statuses</option>';
    
    // Add status options
    Object.keys(MERCHANT_STATUSES).forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = MERCHANT_STATUSES[status].label;
        statusFilter.appendChild(option);
    });
}

// Filter merchants based on search and filters
function filterMerchants() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    
    filteredMerchants = merchantsData.filter(merchant => {
        const matchesSearch = !searchTerm || 
            merchant.name.toLowerCase().includes(searchTerm) ||
            merchant.email.toLowerCase().includes(searchTerm) ||
            merchant.id.toLowerCase().includes(searchTerm);
            
        const matchesStatus = !statusFilter || merchant.status === statusFilter;
        const matchesCategory = !categoryFilter || merchant.category.toLowerCase() === categoryFilter.toLowerCase();
        
        return matchesSearch && matchesStatus && matchesCategory;
    });
    
    renderMerchantsTable();
    updateMerchantStats();
}

// Render merchants table
function renderMerchantsTable() {
    const tableBody = document.getElementById('merchantsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (filteredMerchants.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-store" style="font-size: 2rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <p style="color: #666;">No merchants found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    filteredMerchants.forEach(merchant => {
        const row = createMerchantTableRow(merchant);
        tableBody.appendChild(row);
    });
}
        const row = createMerchantTableRow(merchant);
        tableBody.appendChild(row);
    });
}

// Create merchant table row
function createMerchantTableRow(merchant) {
    const row = document.createElement('tr');
    
    const statusInfo = MERCHANT_STATUSES[merchant.status] || MERCHANT_STATUSES['unknown'];
    const formattedDate = formatDate(merchant.joinDate);
    const ratingDisplay = merchant.rating ? 
        `<span class="rating-value">${merchant.rating}</span>` : 
        '<span style="color: #ccc;">N/A</span>';
    
    row.innerHTML = `
        <td>
            <div class="merchant-info">
                <div class="merchant-avatar">
                    <img src="${merchant.avatar}" alt="${merchant.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(merchant.name)}&size=40'">
                </div>
                <div>
                    <div class="merchant-name">${merchant.name}</div>
                    <div class="merchant-id">#${merchant.id}</div>
                </div>
            </div>
        </td>
        <td><span class="merchant-category">${merchant.category}</span></td>
        <td>
            <span class="status-badge ${statusInfo.class}" data-status="${merchant.status}">
                ${statusInfo.label}
            </span>
        </td>
        <td><span class="commission-rate">${merchant.commission}%</span></td>
        <td>${merchant.ordersToday}</td>
        <td>$${merchant.revenueToday.toFixed(2)}</td>
        <td>${ratingDisplay}</td>
        <td>${formattedDate}</td>
        <td>
            <div class="actions">
                <button class="btn-action" onclick="viewMerchant('${merchant.id}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action" onclick="changeStatus('${merchant.id}')" title="Change Status">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action danger" onclick="suspendMerchant('${merchant.id}')" title="Suspend">
                    <i class="fas fa-ban"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// Format date
function formatDate(dateString) {
    if (!dateString || dateString === 'N/A') return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (error) {
        return dateString;
    }
}

// Update merchant statistics
function updateMerchantStats() {
    const totalMerchants = merchantsData.length;
    const activeMerchants = merchantsData.filter(m => m.status === 'approved').length;
    const pendingMerchants = merchantsData.filter(m => m.status === 'pending').length;
    const totalRevenue = merchantsData.reduce((sum, m) => sum + (m.revenueToday || 0), 0);
    
    // Update stat cards
    updateStatCard('Total Merchants', totalMerchants, totalMerchants > 0 ? '+' + totalMerchants : '0');
    updateStatCard('Active Merchants', activeMerchants, activeMerchants > 0 ? '+' + activeMerchants : '0');
    updateStatCard('Pending Approval', pendingMerchants, pendingMerchants > 0 ? '+' + pendingMerchants : '0');
    updateStatCard('Revenue Today', `$${totalRevenue.toFixed(2)}`, totalRevenue > 0 ? '+15.2%' : '0%');
}

// Update individual stat card
function updateStatCard(label, value, change) {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        const cardLabel = card.querySelector('p')?.textContent;
        if (cardLabel === label) {
            const valueElement = card.querySelector('h3');
            const changeElement = card.querySelector('.stat-change');
            
            if (valueElement) valueElement.textContent = value;
            if (changeElement) changeElement.textContent = change;
        }
    });
}

// Refresh merchants data
async function refreshMerchantsData() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        refreshBtn.disabled = true;
    }
    
    try {
        await loadMerchantsFromDynamoDB();
        renderMerchantsTable();
        updateMerchantStats();
        showMessage('Merchants data refreshed successfully', 'success');
    } catch (error) {
        console.error('Failed to refresh merchants data:', error);
        showMessage('Failed to refresh merchants data', 'error');
    } finally {
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            refreshBtn.disabled = false;
        }
    }
}

// View merchant details
window.viewMerchant = function(merchantId) {
    const merchant = merchantsData.find(m => m.id === merchantId);
    if (!merchant) return;
    
    showMerchantDetailsModal(merchant);
};

// Change merchant status
window.changeStatus = function(merchantId) {
    const merchant = merchantsData.find(m => m.id === merchantId);
    if (!merchant) return;
    
    showStatusChangeModal(merchant);
};

// Suspend merchant
window.suspendMerchant = function(merchantId) {
    const merchant = merchantsData.find(m => m.id === merchantId);
    if (!merchant) return;
    
    if (confirm(`Are you sure you want to suspend ${merchant.name}?`)) {
        updateMerchantStatus(merchantId, 'suspended');
    }
};

// Show merchant details modal
function showMerchantDetailsModal(merchant) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Merchant Details</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="merchant-details">
                    <div class="merchant-avatar-large">
                        <img src="${merchant.avatar}" alt="${merchant.name}">
                    </div>
                    <div class="details-grid">
                        <div class="detail-item">
                            <label>Business Name:</label>
                            <span>${merchant.name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Business ID:</label>
                            <span>#${merchant.id}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${merchant.email}</span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span>${merchant.phone}</span>
                        </div>
                        <div class="detail-item">
                            <label>Category:</label>
                            <span>${merchant.category}</span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-badge ${MERCHANT_STATUSES[merchant.status]?.class || 'unknown'}">
                                ${MERCHANT_STATUSES[merchant.status]?.label || 'Unknown'}
                            </span>
                        </div>
                        <div class="detail-item">
                            <label>Owner:</label>
                            <span>${merchant.owner}</span>
                        </div>
                        <div class="detail-item">
                            <label>Address:</label>
                            <span>${merchant.address}</span>
                        </div>
                        <div class="detail-item">
                            <label>Join Date:</label>
                            <span>${formatDate(merchant.joinDate)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                <button class="btn-primary" onclick="changeStatus('${merchant.id}'); this.closest('.modal-overlay').remove();">Change Status</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Show status change modal
function showStatusChangeModal(merchant) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Change Merchant Status</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="status-change-form">
                    <div class="merchant-info-compact">
                        <img src="${merchant.avatar}" alt="${merchant.name}">
                        <div>
                            <h4>${merchant.name}</h4>
                            <p>Current Status: <span class="status-badge ${MERCHANT_STATUSES[merchant.status]?.class || 'unknown'}">${MERCHANT_STATUSES[merchant.status]?.label || 'Unknown'}</span></p>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="newStatus">New Status:</label>
                        <select id="newStatus" class="form-control">
                            ${Object.keys(MERCHANT_STATUSES).map(status => 
                                `<option value="${status}" ${status === merchant.status ? 'selected' : ''}>
                                    ${MERCHANT_STATUSES[status].label}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="statusReason">Reason (optional):</label>
                        <textarea id="statusReason" class="form-control" rows="3" placeholder="Enter reason for status change..."></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn-primary" onclick="confirmStatusChange('${merchant.id}')">Update Status</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Confirm status change
window.confirmStatusChange = async function(merchantId) {
    const newStatus = document.getElementById('newStatus').value;
    const reason = document.getElementById('statusReason').value;
    
    try {
        await updateMerchantStatus(merchantId, newStatus, reason);
        document.querySelector('.modal-overlay').remove();
        showMessage('Merchant status updated successfully', 'success');
    } catch (error) {
        console.error('Failed to update merchant status:', error);
        showMessage('Failed to update merchant status', 'error');
    }
};

// Update merchant status
async function updateMerchantStatus(merchantId, newStatus, reason = '') {
    try {
        console.log(`Updating merchant ${merchantId} status to ${newStatus}`);
        
        // Update status in DynamoDB directly
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        
        const updateParams = {
            TableName: MERCHANTS_TABLE,
            Key: {
                businessId: merchantId
            },
            UpdateExpression: 'SET #status = :status, lastStatusUpdate = :timestamp',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': newStatus,
                ':timestamp': new Date().toISOString()
            }
        };
        
        // Add reason if provided
        if (reason) {
            updateParams.UpdateExpression += ', statusReason = :reason';
            updateParams.ExpressionAttributeValues[':reason'] = reason;
        }
        
        console.log('Updating DynamoDB with params:', updateParams);
        
        const updateResult = await dynamodb.update(updateParams).promise();
        console.log('DynamoDB update successful:', updateResult);
        
        // Update local data for immediate UI feedback
        const merchantIndex = merchantsData.findIndex(m => m.id === merchantId);
        if (merchantIndex !== -1) {
            merchantsData[merchantIndex].status = newStatus;
            merchantsData[merchantIndex].lastStatusUpdate = new Date().toISOString();
            if (reason) {
                merchantsData[merchantIndex].statusReason = reason;
            }
        }
        
        // Update filtered merchants as well
        const filteredIndex = filteredMerchants.findIndex(m => m.id === merchantId);
        if (filteredIndex !== -1) {
            filteredMerchants[filteredIndex].status = newStatus;
        }
        
        // Re-render the table and update stats
        renderMerchantsTable();
        updateMerchantStats();
        
        // Log the action
        console.log(`Merchant ${merchantId} status updated to ${newStatus} in DynamoDB`, { reason });
        
    } catch (error) {
        console.error('Error updating merchant status:', error);
        
        let errorMessage = 'Failed to update merchant status';
        if (error.code === 'ValidationException') {
            errorMessage = 'Invalid data provided for status update';
        } else if (error.code === 'ResourceNotFoundException') {
            errorMessage = 'Merchant not found in database';
        } else if (error.code === 'AccessDenied') {
            errorMessage = 'Permission denied to update merchant status';
        }
        
        throw new Error(errorMessage);
    }
}
        const filteredIndex = filteredMerchants.findIndex(m => m.id === merchantId);
        if (filteredIndex !== -1) {
            filteredMerchants[filteredIndex].status = newStatus;
            if (reason) {
                filteredMerchants[filteredIndex].statusReason = reason;
            }
        }
        
        // Re-render the table and update stats
        renderMerchantsTable();
        updateMerchantStats();
        
        // Log the action
        console.log(`Merchant ${merchantId} status updated to ${newStatus}`, { reason });
        
    } catch (error) {
        console.error('Error updating merchant status:', error);
        
        // If API call failed, still update locally for demo purposes
        const merchantIndex = merchantsData.findIndex(m => m.id === merchantId);
        if (merchantIndex !== -1) {
            merchantsData[merchantIndex].status = newStatus;
            merchantsData[merchantIndex].lastStatusUpdate = new Date().toISOString();
            if (reason) {
                merchantsData[merchantIndex].statusReason = reason;
            }
        }
        
        const filteredIndex = filteredMerchants.findIndex(m => m.id === merchantId);
        if (filteredIndex !== -1) {
            filteredMerchants[filteredIndex].status = newStatus;
        }
        
        renderMerchantsTable();
        updateMerchantStats();
        
        // Show warning that changes are local only
        showMessage('Status updated locally (API connection failed)', 'warning');
        throw error;
    }
}

// Show message function
function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    // Add to page
    document.body.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}
