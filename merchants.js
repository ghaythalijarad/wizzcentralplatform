// Merchants Management JavaScript - Using Centralized Data Service
console.log('merchants.js script loaded');

// DynamoDB table name
const MERCHANTS_TABLE = 'order-receiver-businesses-dev';

// DynamoDB client
let dynamoDB;

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
let allMerchants = [];
let merchantsData = [];
let filteredMerchants = [];

// Check authentication on page load - MERCHANTS SPECIFIC
function checkMerchantsAuthentication() {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
        console.log('No access token found, but proceeding for development');
        // For development, we'll allow proceeding without authentication
        // In production, uncomment the line below:
        // window.location.href = '../index.html';
        return true; // Changed from false to true for development
    }
    return true;
}

// Global logout function
window.logout = async () => {
    try {
        if (AWS && AWS.config && AWS.config.credentials) {
            AWS.config.credentials.clearCachedId();
        }
        sessionStorage.clear();
        localStorage.clear(); // Clear both just to be safe
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
};

// Initialize merchants page when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Merchants page DOM loaded');
    
    // Debug: Check if required elements exist
    const tableBody = document.getElementById('merchantsTableBody');
    const statusElement = document.getElementById('merchants-table-status');
    
    console.log('Table body element:', tableBody);
    console.log('Status element:', statusElement);
    
    if (!tableBody) {
        console.error('CRITICAL: merchantsTableBody element not found!');
        return;
    }

    // Initialize dashboard (sidebar, menu)
    if (typeof initializeDashboard === 'function') {
        console.log('Initializing dashboard...');
        initializeDashboard();
    } else {
        console.warn('initializeDashboard function not found');
    }

    // Ensure user is authenticated
    if (!checkMerchantsAuthentication()) {
        console.log('Authentication check failed, but continuing for development');
        // return; // Commented out for development
    }
    
    // Initialize AWS and load merchants data
    showLoader(true, 'Loading merchants...');
    try {
        console.log('Starting AWS initialization...');
        await initializeAWS();
        console.log('AWS initialized, starting merchants management...');
        await initializeMerchantsManagement();
        console.log('Merchants management initialized successfully');
    } catch (err) {
        console.error('Merchants management initialization failed:', err);
        showMessage(`Error loading merchants: ${err.message}`, 'error');
        
        // Fallback: Load sample data
        console.log('Loading sample data as fallback...');
        merchantsData = getSampleMerchantsData();
        filteredMerchants = [...merchantsData];
        initializeUI();
        setupEventListeners();
    } finally {
        showLoader(false);
    }
});

// Initialize AWS SDK credentials and DynamoDB client for merchants
async function initializeAWS() {
    try {
        // Retrieve Cognito ID token if available
        const idToken = sessionStorage.getItem('idToken');
        if (!idToken) {
            console.warn('No ID token found, using unauthenticated identities');
        }
        
        // Ensure AWS SDK is loaded
        if (typeof AWS === 'undefined') {
            throw new Error('AWS SDK not loaded.');
        }
        
        // Fetch Amplify outputs for configuration
        const resp = await fetch('../amplify_outputs.json');
        if (!resp.ok) throw new Error(`Failed to load amplify_outputs.json: ${resp.status}`);
        const outputs = await resp.json();
        const region = outputs.data?.aws_region || 'us-east-1'; // Default fallback
        const userPoolId = outputs.auth.user_pool_id;
        const identityPoolId = outputs.auth.identity_pool_id;
        const provider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;
        
        // Configure AWS SDK region
        AWS.config.update({ region });
        // Configure credentials: include Logins only if idToken present
        const credParams = { IdentityPoolId: identityPoolId };
        if (idToken && !idToken.startsWith('mock-')) {
            credParams.Logins = { [provider]: idToken };
        }
        AWS.config.credentials = new AWS.CognitoIdentityCredentials(credParams);
        
        // Refresh credentials
        try {
            await AWS.config.credentials.refreshPromise();
            console.log('AWS credentials obtained, identityId:', AWS.config.credentials.identityId);
        } catch(refreshError) {
            console.error('Failed to refresh AWS credentials:', refreshError);
            // For development, continue anyway
            console.warn('Continuing with potentially invalid credentials for development...');
        }
        
        // Initialize DynamoDB DocumentClient
        dynamoDB = new AWS.DynamoDB.DocumentClient();
    } catch (err) {
        console.error('Error during AWS initialization:', err);
        throw err;
    }
}

// Initialize merchants management with fallback
async function initializeMerchantsManagement() {
    try {
        console.log('Initializing merchants management...');
        showLoader(true, 'Loading merchants...');
        
        showMessage('Connecting to the database and fetching merchants...', 'info');
        
        try {
            await loadMerchantsFromDynamoDB();
            
            if (merchantsData.length === 0) {
                console.log('No merchants found in database, loading sample data...');
                showMessage('Connection successful, but no merchants were found in the database. Loading sample data...', 'warning');
                merchantsData = getSampleMerchantsData();
            } else {
                console.log(`Successfully loaded ${merchantsData.length} merchants from database`);
                hideMessage();
            }
        } catch (dbError) {
            console.error('Database loading failed, using sample data:', dbError);
            showMessage(`Database connection failed: ${dbError.message}. Displaying sample data for development.`, 'warning');
            merchantsData = getSampleMerchantsData();
        }
        
    } catch (error) {
        console.error('Failed to initialize merchants management:', error);
        const errorMessage = `Could not initialize merchants management. Error: ${error.message}. Displaying sample data.`;
        showMessage(errorMessage, 'error');
        merchantsData = getSampleMerchantsData(); // Fallback
    }
    
    // Always ensure we have data before initializing UI
    if (!merchantsData || merchantsData.length === 0) {
        console.warn('No merchants data available, loading sample data as final fallback');
        merchantsData = getSampleMerchantsData();
    }
    
    console.log(`Final merchants data count: ${merchantsData.length}`);
    console.log('Sample merchants data:', merchantsData);
    filteredMerchants = [...merchantsData];
    
    // Initialize UI after ensuring we have data
    showLoader(false);
    initializeUI();
    setupEventListeners();
    
    // Force render the table to replace "Loading..." text
    setTimeout(() => {
        console.log('Force rendering table after initialization...');
        renderMerchantsTable();
    }, 100);
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
            TableName: 'order-receiver-businesses-dev',
            Limit: 100 // Add limit to prevent large scans
        };

        console.log('Scanning DynamoDB with params:', params);
        const result = await dynamoDB.scan(params).promise();
        console.log('DynamoDB scan result:', result);

        if (result.Items && result.Items.length > 0) {
            merchantsData = result.Items.map(item => ({
                id: item.id || item.businessId || `merchant-${Date.now()}-${Math.random()}`,
                name: item.name || item.businessName || 'Unknown Business',
                email: item.email || 'N/A',
                phone: item.phone || item.phoneNumber || 'N/A',
                address: typeof item.address === 'string' ? item.address :
                         (item.address ? `${item.address.street || ''}, ${item.address.city || ''}` : 'N/A'),
                owner: item.owner || item.ownerName || 'N/A',
                status: item.status || (item.isActive ? 'approved' : 'unknown'),
                isActive: item.isActive !== undefined ? item.isActive : true,
                joinDate: item.joinDate || (item.createdAt ? formatDate(item.createdAt) : 'N/A'),
                avatar: item.avatar || item.businessPhotoUrl || generateAvatarUrl(item.name || item.businessName),
                // Keep original data for details view
                fullData: item
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
        // Provide a more specific error message if it's a credential issue.
        if (error.code === 'CredentialsError' || error.message.includes('Missing credentials')) {
            throw new Error('Failed to obtain AWS credentials. Please check the Identity Pool configuration and ensure the auth token is valid.');
        }
        throw error;
    }
}

// Helper function to map business types to display categories
function mapBusinessType(businessType) {
    const typeMap = {
        'restaurant': 'Restaurant',
        'store': 'Grocery Store',
        'cafe': 'Cafe',
        'cloudkitchen': 'Cloud Kitchen',
        'pharmacy': 'Pharmacy',
        'retail': 'Retail'
    };
    return typeMap[businessType] || 'Other';
}

// Enhanced helper function to extract address from DynamoDB address structure
function extractAddress(addressObj, city, country) {
    // Handle complex address object from DynamoDB
    if (addressObj && typeof addressObj === 'object') {
        const parts = [];
        
        // Check if it's a DynamoDB attribute value object
        if (addressObj.country && addressObj.country.S) {
            // DynamoDB AttributeValue format
            if (addressObj.street && addressObj.street.S) parts.push(addressObj.street.S);
            if (addressObj.district && addressObj.district.S) parts.push(addressObj.district.S);
            if (addressObj.city && addressObj.city.S) parts.push(addressObj.city.S);
            if (addressObj.country && addressObj.country.S) parts.push(addressObj.country.S);
        } else {
            // Regular object format
            if (addressObj.street) parts.push(addressObj.street);
            if (addressObj.district) parts.push(addressObj.district);
            if (addressObj.city) parts.push(addressObj.city);
            if (addressObj.country) parts.push(addressObj.country);
        }
        
        if (parts.length > 0) {
            return parts.join(', ');
        }
    }
    
    // Fallback to individual city and country fields
    if (typeof addressObj === 'string') {
        return addressObj;
    }
    
    const parts = [];
    if (city) parts.push(city);
    if (country) parts.push(country);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
}

// Generate avatar URL
function generateAvatarUrl(name) {
    if (!name) return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=40&h=40&fit=crop&crop=center';
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&size=40&background=random&color=fff`;
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

// Helper to display messages in the UI
function showMessage(message, type = 'info') {
    const statusElement = document.getElementById('merchants-table-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `table-status-info table-status-${type}`;
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

// Initialize UI
function initializeUI() {
    console.log('Initializing merchants UI...');
    filterMerchants(); // This will render the table
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up merchants event listeners...');
    // Add any specific event listeners for merchants page
}

// Filter and render merchants
function filterMerchants() {
    console.log('Filtering and rendering merchants...');
    renderMerchantsTable();
    // Update stats if stat cards are present
    if (document.querySelector('.stat-card h3')) {
        updateMerchantStats();
    } else {
        console.warn('No stat-card elements found, skipping stats update');
    }
}

// Render merchants table
function renderMerchantsTable() {
    console.log('=== RENDER MERCHANTS TABLE START ===');
    console.log('Rendering merchants table with', filteredMerchants.length, 'entries');
    console.log('Filtered merchants data:', filteredMerchants);
    
    const tbody = document.getElementById('merchantsTableBody');
    console.log('Table body element found:', !!tbody);
    
    if (!tbody) {
        console.error('merchantsTableBody element not found');
        return;
    }

    if (filteredMerchants.length === 0) {
        console.log('No merchants to display, showing empty state');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-store" style="font-size: 3rem; margin-bottom: 1rem; color: #ccc;"></i>
                    <div>No merchants found</div>
                    <div style="font-size: 0.9rem; margin-top: 0.5rem;">Check your connection or try refreshing the page</div>
                </td>
            </tr>
        `;
        return;
    }

    console.log('Generating table HTML for', filteredMerchants.length, 'merchants');
    const tableHTML = filteredMerchants.map(merchant => `
        <tr>
            <td>
                <div class="merchant-info">
                    <div class="merchant-avatar">
                        <img src="${merchant.avatar}" alt="${merchant.name}" onerror="this.src='https://via.placeholder.com/40x40?text=M'">
                    </div>
                    <div class="merchant-name">
                        <a href="merchant-products.html?businessId=${merchant.id}" class="merchant-link">${merchant.name}</a>
                    </div>
                </div>
            </td>
            <td>${merchant.owner}</td>
            <td>
                <span class="status-badge ${getStatusClass(merchant.status)}">
                    ${getStatusLabel(merchant.status)}
                </span>
            </td>
            <td>${merchant.email}</td>
            <td>${merchant.phone}</td>
            <td>${merchant.address}</td>
            <td>
                <div class="actions">
                    <button class="btn-action" onclick="event.stopPropagation(); viewMerchantDetails('${merchant.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action" onclick="event.stopPropagation(); openStatusModal('${merchant.id}')" title="Edit Status">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    console.log('Setting table HTML (length:', tableHTML.length, 'characters)');
    tbody.innerHTML = tableHTML;
    console.log('Table HTML set successfully');
    console.log('=== RENDER MERCHANTS TABLE END ===');
}

// Update merchant statistics
function updateMerchantStats() {
    const totalMerchants = merchantsData.length;
    const activeMerchants = merchantsData.filter(m => m.isActive).length;
    const cards = document.querySelectorAll('.stat-card h3');
    if (cards.length >= 2) {
        cards[0].textContent = totalMerchants;
        cards[1].textContent = activeMerchants;
    } else {
        console.warn('Not enough stat-card elements to update stats');
    }
}

// Helper functions for status
function getStatusClass(status) {
    return MERCHANT_STATUSES[status]?.class || 'unknown';
}

function getStatusLabel(status) {
    return MERCHANT_STATUSES[status]?.label || 'Unknown';
}

// Placeholder action functions
function viewMerchant(id) {
    // Redirect to products page for this merchant
    window.location.href = `merchant-products.html?businessId=${id}`;
}

function toggleMerchantStatus(id) {
    const merchant = merchantsData.find(m => m.id === id);
    if (merchant) {
        const action = merchant.isActive ? 'suspend' : 'activate';
        if (confirm(`Are you sure you want to ${action} ${merchant.name}?`)) {
            merchant.isActive = !merchant.isActive;
            renderMerchantsTable();
            updateMerchantStats();
            
            if (window.dashboardFunctions) {
                window.dashboardFunctions.showNotification(
                    `${merchant.name} has been ${merchant.isActive ? 'activated' : 'suspended'}`, 
                    'success'
                );
            }
        }
    }
}

// Refresh data from DynamoDB
async function refreshMerchantsData() {
    showLoader(true, 'Refreshing data from the database...');
    try {
        await loadMerchantsFromDynamoDB();
        filterMerchants();
        hideMessage();
    } catch (error) {
        console.error('Error refreshing merchants data:', error);
        showMessage(`Error refreshing data: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
}

// Handle Add Merchant Form Submission
document.getElementById('addMerchantForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const merchantData = {
        businessName: document.getElementById('businessName').value,
        ownerName: document.getElementById('ownerName').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        address: {
            street: document.getElementById('addressLine1').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipCode: document.getElementById('zipCode').value,
            country: 'USA' // Assuming USA for now
        },
        // Default values for a new merchant
        businessId: `biz-${Date.now()}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    showLoader(true, 'Adding new merchant...');
    try {
        await addMerchantToDB(merchantData);
        merchantsData.push({
            id: merchantData.businessId,
            name: merchantData.businessName,
            owner: merchantData.ownerName,
            phone: merchantData.phoneNumber,
            address: `${merchantData.address.street}, ${merchantData.address.city}`,
            isActive: merchantData.isActive,
            joinDate: formatDate(merchantData.createdAt),
            avatar: generateAvatarUrl(merchantData.businessName),
            email: '' // Not in form
        });
        filterMerchants(); // This will re-render the table
        closeModal('addMerchantModal');
        showMessage('Merchant added successfully!', 'info');
    } catch (error) {
        console.error('Failed to add merchant:', error);
        showMessage(`Error adding merchant: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
});

// Add a new merchant to DynamoDB
async function addMerchantToDB(merchantData) {
    if (!dynamoDB) throw new Error("DynamoDB client not initialized.");

    const params = {
        TableName: MERCHANTS_TABLE,
        Item: merchantData
    };

    console.log('Adding new merchant to DynamoDB with params:', params);
    return dynamoDB.put(params).promise();
}

// Update a merchant in DynamoDB
async function updateMerchantInDB(businessId, updateData) {
    if (!dynamoDB) throw new Error("DynamoDB client not initialized.");

    // Build update expression dynamically based on provided data
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updateData).forEach((key, index) => {
        const attributeName = `#attr${index}`;
        const attributeValue = `:val${index}`;
        
        updateExpressions.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = updateData[key];
    });

    const params = {
        TableName: MERCHANTS_TABLE,
        Key: { 'id': businessId },
        UpdateExpression: `set ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'UPDATED_NEW'
    };

    console.log('Updating merchant in DynamoDB with params:', params);
    return dynamoDB.update(params).promise();
}

// Open status update modal
function openStatusModal(businessId) {
    const merchant = merchantsData.find(m => m.id === businessId);
    if (!merchant) return;

    const modalBody = document.getElementById('statusModalBody');
    modalBody.innerHTML = `
        <div class="merchant-info-compact">
            <img src="${merchant.avatar}" alt="${merchant.name}">
            <div>
                <h4>${merchant.name}</h4>
                <p>${merchant.owner}</p>
            </div>
        </div>
        <form id="statusUpdateForm">
            <div class="form-group">
                <label for="isActiveStatus">Active Status</label>
                <select id="isActiveStatus" class="form-control">
                    <option value="true" ${merchant.isActive ? 'selected' : ''}>Active</option>
                    <option value="false" ${!merchant.isActive ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            <div class="form-group">
                <label for="merchantStatus">Business Status</label>
                <select id="merchantStatus" class="form-control">
                    <option value="pending" ${merchant.fullData?.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="approved" ${merchant.fullData?.status === 'approved' ? 'selected' : ''}>Approved</option>
                    <option value="under_review" ${merchant.fullData?.status === 'under_review' ? 'selected' : ''}>Under Review</option>
                    <option value="rejected" ${merchant.fullData?.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                    <option value="suspended" ${merchant.fullData?.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                </select>
            </div>
            <div class="form-group">
                <label for="statusReason">Reason for Status Change (Optional)</label>
                <textarea id="statusReason" class="form-control" rows="3" placeholder="Enter reason for status change..."></textarea>
            </div>
        </form>
    `;

    // Store the business ID for form submission
    document.getElementById('statusUpdateForm').dataset.businessId = businessId;
    document.getElementById('statusModal').style.display = 'flex';
}

// Update merchant status
async function updateMerchantStatus() {
    const form = document.getElementById('statusUpdateForm');
    const businessId = form.dataset.businessId;
    const isActive = document.getElementById('isActiveStatus').value === 'true';
    const status = document.getElementById('merchantStatus').value;
    const reason = document.getElementById('statusReason').value;

    const merchant = merchantsData.find(m => m.id === businessId);
    if (!merchant) return;

    showLoader(true, `Updating status for ${merchant.name}...`);

    try {
        const updateData = {
            isActive: isActive,
            status: status,
            updatedAt: new Date().toISOString()
        };

        // Add reason if provided
        if (reason.trim()) {
            updateData.statusChangeReason = reason.trim();
        }

        await updateMerchantInDB(businessId, updateData);
        
        // Update local data
        merchant.isActive = isActive;
        if (merchant.fullData) {
            merchant.fullData.status = status;
        }

        console.log(`Successfully updated status for ${businessId}`);
        showMessage('Merchant status updated successfully!', 'info');
        
        // Refresh the table and stats
        renderMerchantsTable();
        updateMerchantStats();
        
        // Close modal
        closeModal('statusModal');
        
    } catch (error) {
        console.error(`Failed to update status for ${businessId}:`, error);
        showMessage(`Error updating status: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
}


// View merchant details in a modal
function viewMerchantDetails(businessId) {
    const merchant = merchantsData.find(m => m.id === businessId);
    if (!merchant) return;

    // Get status info for display
    const statusInfo = MERCHANT_STATUSES[merchant.fullData?.status] || MERCHANT_STATUSES['unknown'];
    const statusBadge = `<span class="status-badge ${statusInfo.class}" style="background-color: ${statusInfo.color}20; color: ${statusInfo.color}; border: 1px solid ${statusInfo.color}40; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${statusInfo.label}</span>`;

    const detailsBody = document.getElementById('merchantDetailsBody');
    detailsBody.innerHTML = `
        <div class="merchant-avatar-large">
            <img src="${merchant.avatar}" alt="${merchant.name}">
            <h3>${merchant.name}</h3>
            <p>${merchant.owner}</p>
        </div>
        <div class="details-grid">
            <div class="detail-item"><label>Business ID</label><span>${merchant.id}</span></div>
            <div class="detail-item"><label>Active Status</label><span>${merchant.isActive ? '✅ Active' : '❌ Inactive'}</span></div>
            <div class="detail-item"><label>Business Status</label><span>${statusBadge}</span></div>
            <div class="detail-item"><label>Phone</label><span>${merchant.phone}</span></div>
            <div class="detail-item"><label>Email</label><span>${merchant.email}</span></div>
            <div class="detail-item" style="grid-column: 1 / -1;"><label>Address</label><span>${merchant.address}</span></div>
            <div class="detail-item"><label>Joined On</label><span>${merchant.joinDate}</span></div>
            ${merchant.fullData?.statusChangeReason ? `<div class="detail-item" style="grid-column: 1 / -1;"><label>Last Status Change Reason</label><span>${merchant.fullData.statusChangeReason}</span></div>` : ''}
            ${merchant.fullData?.updatedAt ? `<div class="detail-item"><label>Last Updated</label><span>${formatDate(merchant.fullData.updatedAt)}</span></div>` : ''}
        </div>
    `;

    document.getElementById('viewMerchantModal').style.display = 'flex';
}

// Close modal utility
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Format date utility
function formatDate(isoString) {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString();
}
