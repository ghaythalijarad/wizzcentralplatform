// Merchants Management JavaScript

// AWS Configuration - we'll configure this from the amplify_outputs.json
let dynamoDB = null;
let awsConfig = null;

// Wait for AWS SDK to be loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing merchants management with AWS SDK...');
    
    // First, check for authentication
    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
        // If no token, redirect to login. No need to load AWS config.
        window.location.href = 'index.html';
        return;
    }

    // Check if AWS SDK is loaded
    if (typeof AWS === 'undefined') {
        console.error('AWS SDK not loaded. Please check the CDN script.');
        showMessage('Error: AWS SDK not loaded. Falling back to sample data.', 'error');
        merchantsData = getSampleMerchantsData();
        filteredMerchants = [...merchantsData];
        initializeUI();
        setupEventListeners();
        return;
    }

    try {
        // Load AWS configuration from amplify_outputs.json
        const response = await fetch('./amplify_outputs.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch amplify_outputs.json: ${response.status}`);
        }
        const outputs = await response.json();
        
        // Configure AWS SDK
        awsConfig = {
            region: outputs.data?.aws_region || 'us-east-1',
        };

        const userPoolId = outputs.auth.user_pool_id;
        const identityPoolId = outputs.auth.identity_pool_id;
        const region = awsConfig.region;
        const cognitoProvider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;

        const credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: identityPoolId,
            Logins: {
                [cognitoProvider]: accessToken
            }
        });

        AWS.config.update({
            region: region,
            credentials
        });

        // Initialize DynamoDB client
        dynamoDB = new AWS.DynamoDB.DocumentClient();
        
        console.log('AWS SDK configured successfully with region:', awsConfig.region);
    } catch (error) {
        console.error('Error configuring AWS SDK:', error);
        showMessage('Error: Could not configure AWS. Using sample data.', 'error');
        merchantsData = getSampleMerchantsData();
        filteredMerchants = [...merchantsData];
        initializeUI();
        setupEventListeners();
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

// Helper to display messages in the UI
function showMessage(message, type = 'info') {
    const statusElement = document.getElementById('merchants-table-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `table-status-info table-status-${type}`; // e.g., 'info', 'warning', 'error'
        statusElement.style.display = 'block';
    }
}

// Helper to hide messages
function hideMessage() {
    const statusElement = document.getElementById('merchants-table-status');
    if (statusElement) {
        statusElement.style.display = 'none';
    }
}

// Show/hide loader
function showLoader(show, message = 'Loading...') {
    let loader = document.getElementById('loader-overlay');
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loader-overlay';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                color: white;
                font-size: 1.2rem;
                flex-direction: column;
            `;
            const spinner = document.createElement('div');
            spinner.className = 'loader-spinner';
            spinner.style.cssText = `
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            `;
            const keyframes = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            const styleSheet = document.createElement("style");
            styleSheet.type = "text/css";
            styleSheet.innerText = keyframes;
            document.head.appendChild(styleSheet);

            const loaderMessage = document.createElement('p');
            loaderMessage.id = 'loader-message';
            
            loader.appendChild(spinner);
            loader.appendChild(loaderMessage);
            document.body.appendChild(loader);
        }
        document.getElementById('loader-message').textContent = message;
        loader.style.display = 'flex';
    } else {
        if (loader) {
            loader.style.display = 'none';
        }
    }
}

// Initialize merchants management with fallback
async function initializeMerchantsManagement() {
    try {
        console.log('Initializing merchants management...');
        showLoader(true, 'Loading merchants...');
        showMessage('Connecting to the database and fetching merchants...', 'info');
        
        await loadMerchantsFromDynamoDB();
        
        if (merchantsData.length === 0) {
            showMessage('Connection successful, but no merchants were found in the database.', 'warning');
        } else {
            hideMessage();
        }
        
    } catch (error) {
        console.error('Failed to load merchants from DynamoDB, falling back to sample data:', error);
        const errorMessage = `Could not connect to the database. Error: ${error.message}. Displaying sample data.`;
        showMessage(errorMessage, 'error');
        merchantsData = getSampleMerchantsData();
    } finally {
        filteredMerchants = [...merchantsData];
        initializeUI();
        setupEventListeners();
        showLoader(false);
    }
}

// Load merchants data from DynamoDB using AWS SDK
async function loadMerchantsFromDynamoDB() {
    console.log('Attempting to load merchants from DynamoDB using AWS SDK...');
    
    try {
        if (!dynamoDB) {
            throw new Error('DynamoDB client not initialized');
        }

        // Scan the businesses table
        const params = {
            TableName: 'order-receiver-businesses-dev'
        };

        const result = await dynamoDB.scan(params).promise();
        console.log('DynamoDB scan result:', result);

        if (result.Items && result.Items.length > 0) {
            merchantsData = result.Items.map(item => ({
                id: item.businessId || item.id || 'N/A',
                name: item.businessName || item.name || 'Unknown Business',
                email: item.email || 'N/A',
                phone: item.phoneNumber || item.phone || 'N/A',
                category: mapBusinessType(item.businessType || item.category),
                status: item.status || 'unknown',
                commission: 15, // Default commission
                ordersToday: 0, // Default orders
                revenueToday: 0, // Default revenue
                rating: null, // No rating data
                joinDate: item.createdAt ? formatDate(item.createdAt) : 'N/A',
                avatar: item.businessPhotoUrl || generateAvatarUrl(item.businessName || item.name),
                address: extractAddress(item.address) || 'Address not available',
                owner: item.ownerName || 'N/A'
            }));

            console.log(`Successfully loaded ${merchantsData.length} merchants from DynamoDB`);
            return;
        } else {
            console.log('No merchants found in DynamoDB');
            showMessage('The database is currently empty. No merchants to display.', 'info');
            merchantsData = [];
            return;
        }
    } catch (error) {
        console.error('Error loading merchants from DynamoDB:', error);
        throw error;
    }
}

// Helper function to map business types to display categories
function mapBusinessType(businessType) {
    const typeMap = {
        'restaurant': 'Restaurant',
        'store': 'Grocery',
        'cafe': 'Restaurant',
        'cloudkitchen': 'Restaurant',
        'pharmacy': 'Pharmacy',
        'retail': 'Retail'
    };
    return typeMap[businessType] || 'Other';
}

// Helper function to extract address from complex address object
function extractAddress(address) {
    if (typeof address === 'string') {
        return address;
    }
    if (address && typeof address === 'object') {
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.district) parts.push(address.district);
        if (address.city) parts.push(address.city);
        if (address.country) parts.push(address.country);
        return parts.join(', ') || 'Address not available';
    }
    return 'Address not available';
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
            status: 'under_review',
            commission: 18,
            ordersToday: 0,
            revenueToday: 0,
            rating: null,
            joinDate: '2024-07-22',
            avatar: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=40&h=40&fit=crop&crop=center',
            address: '789 Pine Street',
            owner: 'Mike Wilson'
        },
        {
            id: 'biz-004',
            name: 'Quick Pharmacy Plus',
            email: 'support@quickpharmacy.com',
            phone: '+1-555-0126',
            category: 'Pharmacy',
            status: 'rejected',
            commission: 12,
            ordersToday: 0,
            revenueToday: 0,
            rating: 3.2,
            joinDate: '2024-05-10',
            avatar: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=40&h=40&fit=crop&crop=center',
            address: '321 Health Avenue',
            owner: 'Dr. Emily Chen'
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

// Pagination state
let currentPage = 1;
const rowsPerPage = 10;

// Get paginated data
function getPaginatedData(data) {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
}

// Render pagination controls
function renderPaginationControls(totalItems) {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(totalItems / rowsPerPage);
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = 'pagination-btn';
        if (i === currentPage) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            currentPage = i;
            renderMerchantsTable();
            renderPaginationControls(totalItems);
        });
        paginationContainer.appendChild(button);
    }
}

// Render merchants table
function renderMerchantsTable() {
    const tableBody = document.getElementById('merchants-table-body');
    if (!tableBody) return;

    // Clear previous results
    tableBody.innerHTML = '';
    
    if (filteredMerchants.length === 0) {
        // If there's already a message (e.g., "no data in DB"), don't overwrite it
        const statusElement = document.getElementById('merchants-table-status');
        if (!statusElement || statusElement.style.display === 'none') {
            showMessage('No merchants match the current filters.', 'info');
        }
        renderPaginationControls(0);
        return; // Stop execution if no merchants to render
    } else {
        hideMessage(); // Hide any messages if we have data to render
    }

    const paginatedData = getPaginatedData(filteredMerchants);

    paginatedData.forEach(merchant => {
        const row = createMerchantTableRow(merchant);
        tableBody.appendChild(row);
    });

    renderPaginationControls(filteredMerchants.length);
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
    
    // Update stat cards by finding them and updating content
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        const label = card.querySelector('p')?.textContent;
        const valueElement = card.querySelector('h3');
        const changeElement = card.querySelector('.stat-change');
        
        if (label && valueElement) {
            if (label.includes('Total Merchants')) {
                valueElement.textContent = totalMerchants;
                if (changeElement) changeElement.textContent = `+${totalMerchants}`;
            } else if (label.includes('Active Merchants')) {
                valueElement.textContent = activeMerchants;
                if (changeElement) changeElement.textContent = `+${activeMerchants}`;
            } else if (label.includes('Commission Today')) {
                valueElement.textContent = `$${totalRevenue.toFixed(2)}`;
                if (changeElement) changeElement.textContent = totalRevenue > 0 ? '+15.2%' : '0%';
            }
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
        await initializeMerchantsManagement();
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
    
    showLoader(true, 'Updating status...');
    try {
        await updateMerchantStatus(merchantId, newStatus, reason);
        document.querySelector('.modal-overlay').remove();
        showMessage('Merchant status updated successfully', 'success');
    } catch (error) {
        console.error('Failed to update merchant status:', error);
        showMessage('Failed to update merchant status', 'error');
    } finally {
        showLoader(false);
    }
};

// Update merchant status
async function updateMerchantStatus(merchantId, newStatus, reason = '') {
    console.log(`Updating merchant ${merchantId} to ${newStatus} with reason: ${reason}`);
    
    try {
        if (!dynamoDB) {
            throw new Error('DynamoDB client not initialized');
        }

        // Update the item in DynamoDB
        const params = {
            TableName: 'order-receiver-businesses-dev',
            Key: {
                businessId: merchantId
            },
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': newStatus,
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };

        const result = await dynamoDB.update(params).promise();
        console.log('Update successful:', result);

        // Update local data and re-render
        const merchantIndex = merchantsData.findIndex(m => m.id === merchantId);
        if (merchantIndex !== -1) {
            merchantsData[merchantIndex].status = newStatus;
            filterMerchants(); // This will re-render the table and update stats
        }
        
    } catch (error) {
        console.error('Failed to update merchant status in DynamoDB:', error);
        // Fallback to local update for demo purposes if API fails
        const merchantIndex = merchantsData.findIndex(m => m.id === merchantId);
        if (merchantIndex !== -1) {
            merchantsData[merchantIndex].status = newStatus;
            filterMerchants();
        }
        throw error; // Re-throw to be handled by the caller
    }
}

// Show toast message function
function showToastMessage(message, type) {
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
