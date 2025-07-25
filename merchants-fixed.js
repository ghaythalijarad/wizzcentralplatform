// Merchants Management JavaScript

// Wait for Amplify to be loaded from CDN
document.addEventListener('DOMContentLoaded', async function() {
    // Configure Amplify with outputs
    if (typeof aws_amplify === 'undefined') {
        console.error('Amplify library not loaded. Please check the CDN script.');
        showMessage('Error: Amplify library not loaded. Falling back to sample data.', 'error');
        merchantsData = getSampleMerchantsData();
        filteredMerchants = [...merchantsData];
        initializeUI();
        setupEventListeners();
        return;
    }

    try {
        // Fetch and configure with amplify_outputs.json
        const response = await fetch('./amplify_outputs.json');
        const outputs = await response.json();
        aws_amplify.Amplify.configure(outputs);
        console.log('Amplify configured successfully');
    } catch (error) {
        console.error('Error loading Amplify configuration:', error);
        showMessage('Error: Could not load Amplify configuration. Using sample data.', 'error');
        merchantsData = getSampleMerchantsData();
        filteredMerchants = [...merchantsData];
        initializeUI();
        setupEventListeners();
        return;
    }

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
        showMessage('Could not connect to the database. Displaying sample data for demonstration.', 'error');
        merchantsData = getSampleMerchantsData();
    } finally {
        filteredMerchants = [...merchantsData];
        initializeUI();
        setupEventListeners();
        showLoader(false);
    }
}

// Load merchants data from DynamoDB using Amplify Data
async function loadMerchantsFromDynamoDB() {
    console.log('Attempting to load merchants from DynamoDB using Amplify Data...');
    
    try {
        // Create client using CDN-loaded Amplify
        const client = aws_amplify.generateClient();
        const { data: items, errors } = await client.models.Business.list();

        if (errors) {
            console.error('Failed to fetch merchants from DynamoDB:', errors);
            throw new Error(JSON.stringify(errors));
        }
        
        if (items && items.length > 0) {
            merchantsData = items.map(item => ({
                id: item.id,
                name: item.name || 'Unknown Business',
                email: item.email || 'N/A',
                phone: item.phone || 'N/A',
                category: item.category || 'Unknown',
                status: item.status || 'unknown',
                joinDate: item.createdAt || 'N/A',
                avatar: item.avatar || generateAvatarUrl(item.name),
                address: item.address || 'N/A',
                owner: item.owner || 'N/A',
                description: item.description || 'N/A',
                rawData: item
            }));
            console.log(`Loaded ${merchantsData.length} merchants from DynamoDB:`, merchantsData);
        } else {
            console.log('Connection successful, but no merchants found in DynamoDB.');
            merchantsData = []; // Explicitly set to empty
        }
        
        console.log('Merchants data loaded successfully');
        
    } catch (error) {
        console.error('Error loading merchants from DynamoDB:', error);
        throw error; // Re-throw to be caught by the initializer
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
        return; // Stop execution if no merchants to render
    } else {
        hideMessage(); // Hide any messages if we have data to render
    }

    const paginatedData = getPaginatedData(filteredMerchants);

    paginatedData.forEach(merchant => {
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
        // Create client using CDN-loaded Amplify
        const client = aws_amplify.generateClient();
        const { data: updatedBusiness, errors } = await client.models.Business.update({
            id: merchantId,
            status: newStatus
        });

        if (errors) {
            console.error('Error updating merchant status:', errors);
            throw errors;
        }

        console.log('Update successful:', updatedBusiness);

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
