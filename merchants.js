// Merchants Management JavaScript - Using Centralized Data Service
console.log('merchants.js script loaded');

// API Base URL from configuration
const API_BASE_URL = window.WIZZCENTRAL_CONFIG.API_BASE_URL;

// DynamoDB table name
const MERCHANTS_TABLE = 'order-receiver-businesses-dev';

// DynamoDB client
// Use var to avoid "duplicate declaration" errors when dashboard.js is also present.
var dynamoDB;

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

// Enhanced authentication check with proper token validation
function checkMerchantsAuthentication() {
    const token = sessionStorage.getItem('accessToken');
    const idToken = sessionStorage.getItem('idToken');
    
    if (!token && !idToken) {
        console.warn('No authentication tokens found. Redirecting to login.');
        window.location.href = '../index.html';
        return false;
    }
    
    // Validate token expiration
    if (idToken) {
        try {
            const tokenPayload = JSON.parse(atob(idToken.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (tokenPayload.exp && tokenPayload.exp < currentTime) {
                console.warn('Authentication token has expired. Redirecting to login.');
                sessionStorage.clear();
                window.location.href = '../index.html';
                return false;
            }
        } catch (error) {
            console.error('Invalid token format. Redirecting to login.');
            sessionStorage.clear();
            window.location.href = '../index.html';
            return false;
        }
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

// Utility to add a timeout to a promise
function withTimeout(promise, ms, operationName = 'Unnamed operation') {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`'${operationName}' timed out after ${ms}ms`));
        }, ms);
    });

    return Promise.race([
        promise,
        timeoutPromise
    ]).finally(() => {
        clearTimeout(timeoutId); // Ensure timeout is cleared
    });
}

// Initialize merchants page when DOM is ready
const onDomReady = async function() {
    console.log('🚀 Merchants page DOM loaded - Starting initialization...');
    const tableBody = document.getElementById('merchantsTableBody');

    // Early exit if critical element is missing
    if (!tableBody) {
        console.error('CRITICAL: merchantsTableBody element not found! Aborting.');
        return;
    }

    // Always ensure the loader is managed and event listeners are set up.
    try {
        // Protocol check: file:// not supported for fetch
        if (window.location.protocol === 'file:') {
            throw new Error('Page cannot be loaded via file:// protocol. Please use a local HTTP server.');
        }

        // Initialize dashboard UI elements
        if (typeof initializeDashboard === 'function') {
            console.log('Initializing dashboard UI...');
            initializeDashboard();
        } else {
            console.warn('initializeDashboard function not found, skipping.');
        }

        console.log('🎯 Attempting to fetch merchants via API');
        showLoader(true, 'Loading merchants...');
        await fetchMerchantsFromApi();

        if (merchantsData.length > 0) {
            console.log(`🎉 SUCCESS! Loaded ${merchantsData.length} merchants from API`);
            filteredMerchants = [...merchantsData];
            renderMerchantsTable();
            updateMerchantStats();
            updateDataSourceIndicator('api', `Loaded ${merchantsData.length} merchants via API`);
            showMessage(`Loaded ${merchantsData.length} merchants from API`, 'success');
        } else {
            console.log('⚠️ API returned no merchants.');
            document.getElementById('merchantsTableBody').innerHTML = '<tr><td colspan="7" class="text-center p-8">No merchants found.</td></tr>';
            updateDataSourceIndicator('empty', 'No merchants to display');
            showMessage('No merchants to display.', 'info');
        }

    } catch (error) {
        console.error('❌ Error loading merchants via API:', error);
        document.getElementById('merchantsTableBody').innerHTML = `<tr><td colspan="7" class="text-center p-8 text-red-600 bg-red-50">${error.message}</td></tr>`;
        updateDataSourceIndicator('error', `Error: ${error.message}`);
        showMessage(`Failed to load merchants: ${error.message}`, 'error');
    } finally {
        showLoader(false);
        setupEventListeners();
    }
};

// New: Fetch merchants via backend API
async function fetchMerchantsFromApi() {
    console.log('🔍 Fetching merchants from API endpoint');
    const token = sessionStorage.getItem('idToken') || sessionStorage.getItem('accessToken');
    if (!token) throw new Error('No authentication token available');
    updateDataSourceIndicator('loading', 'Fetching merchants from API...');

    const response = await fetch(`${API_BASE_URL}/merchants`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch merchants from API');
    }
    merchantsData = data.merchants || data;
    filteredMerchants = [...merchantsData];
}

// Helper function to update the data source indicator
function updateDataSourceIndicator(status, message) {
    const indicator = document.getElementById('dataSourceIndicator');
    const authIndicator = document.getElementById('authIndicator');
    const loginBtn = document.getElementById('loginBtn');
    const loadRealDataBtn = document.getElementById('loadRealDataBtn');
    
    if (indicator) {
        indicator.textContent = message;
    }
    
    if (authIndicator) {
        switch (status) {
            case 'unauthenticated':
                authIndicator.textContent = 'Not Logged In';
                authIndicator.style.backgroundColor = '#ffc107';
                authIndicator.style.color = '#000';
                if (loginBtn) loginBtn.style.display = 'inline-block';
                if (loadRealDataBtn) loadRealDataBtn.style.display = 'none';
                break;
            case 'database':
                authIndicator.textContent = 'Real Data';
                authIndicator.style.backgroundColor = '#28a745';
                authIndicator.style.color = '#fff';
                if (loginBtn) loginBtn.style.display = 'none';
                if (loadRealDataBtn) loadRealDataBtn.style.display = 'none';
                break;
            case 'empty':
                authIndicator.textContent = 'No Data';
                authIndicator.style.backgroundColor = '#6c757d';
                authIndicator.style.color = '#fff';
                if (loginBtn) loginBtn.style.display = 'none';
                if (loadRealDataBtn) loadRealDataBtn.style.display = 'none';
                break;
            case 'error':
                authIndicator.textContent = 'Error';
                authIndicator.style.backgroundColor = '#dc3545';
                authIndicator.style.color = '#fff';
                if (loginBtn) loginBtn.style.display = 'none';
                if (loadRealDataBtn) loadRealDataBtn.style.display = 'none';
                break;
            default:
                authIndicator.textContent = 'Checking...';
                authIndicator.style.backgroundColor = '#007bff';
                authIndicator.style.color = '#fff';
                if (loginBtn) loginBtn.style.display = 'none';
                if (loadRealDataBtn) loadRealDataBtn.style.display = 'none';
        }
    }
}

// Function to refresh merchants data (for refresh button)
async function refreshMerchantsData() {
    showLoader(true, 'Refreshing merchants data...');
    updateDataSourceIndicator('loading', 'Refreshing data from database...');
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    try {
        await initializeAWS();
        await loadMerchantsFromDynamoDB();
        
        if (merchantsData.length > 0) {
            filteredMerchants = [...merchantsData];
            renderMerchantsTable();
            updateMerchantStats();
            updateDataSourceIndicator('database', `Showing ${merchantsData.length} real merchants from database`);
            showMessage(`Refreshed: Loaded ${merchantsData.length} merchants from database`, 'success');
            setTimeout(() => hideMessage(), 3000);
        } else {
            const tableBody = document.getElementById('merchantsTableBody');
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8">No merchants to display.</td></tr>';
            updateDataSourceIndicator('empty', 'No merchants to display');
            showMessage('No merchants to display.', 'info');
        }
    } catch (error) {
        console.error('Refresh failed:', error);
        if (isLocal) {
            const errorMessage = `Failed to refresh data: ${error.message}. Check console for details.`;
            const tableBody = document.getElementById('merchantsTableBody');
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-red-600 bg-red-50">${errorMessage}</td></tr>`;
            updateDataSourceIndicator('error', `Refresh Error: ${error.message}`);
            showMessage(errorMessage, 'error');
        } else {
            const tableBody = document.getElementById('merchantsTableBody');
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-red-600 bg-red-50">Failed to refresh data: ${error.message}</td></tr>`;
            updateDataSourceIndicator('error', `Refresh failed: ${error.message}`);
            showMessage(`Failed to refresh data: ${error.message}`, 'error');
        }
    } finally {
        showLoader(false);
    }
}

// Export for global access
window.refreshMerchantsData = refreshMerchantsData;
window.onDomReady = onDomReady;

// Initialize AWS SDK credentials and DynamoDB client for merchants
async function initializeAWS() {
    console.log('Starting AWS Initialization...');
    try {
        if (typeof AWS === 'undefined') {
            throw new Error('AWS SDK is not loaded. Please ensure the AWS SDK script is included in the HTML.');
        }

        console.log('Fetching amplify_outputs.json from root...');
        const resp = await fetch('/amplify_outputs.json');
        if (!resp.ok) {
            throw new Error(`Failed to fetch amplify_outputs.json: ${resp.status}`);
        }
        const outputs = await resp.json();
        console.log('Successfully loaded amplify_outputs.json');

        const region = outputs.data?.aws_region || 'us-east-1';
        const userPoolId = outputs.auth?.user_pool_id;
        const identityPoolId = outputs.auth?.identity_pool_id;

        if (!userPoolId || !identityPoolId) {
            throw new Error('user_pool_id or identity_pool_id is missing from amplify_outputs.json.');
        }

        const provider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;
        AWS.config.update({ region });
        console.log(`AWS region configured to: ${region}`);

        const idToken = sessionStorage.getItem('idToken');
        const credParams = { IdentityPoolId: identityPoolId };
        const hasValidToken = idToken && idToken.length > 50;

        if (hasValidToken) {
            console.log('Valid Cognito ID token found. Using for authenticated access.');
            credParams.Logins = { [provider]: idToken };
        } else {
            console.warn('No valid authentication token found. Attempting unauthenticated access.');
            console.info('ℹ️ For this to work, your Cognito Identity Pool must allow unauthenticated access, and the unauthenticated IAM role must have DynamoDB permissions.');
        }

        AWS.config.credentials = new AWS.CognitoIdentityCredentials(credParams);

        console.log('Refreshing AWS credentials...');
        await withTimeout(
            AWS.config.credentials.refreshPromise(),
            10000,
            'AWS credentials refresh'
        );
        console.log('✅ AWS credentials refreshed successfully.', {
            identityId: AWS.config.credentials.identityId,
            isAuthenticated: AWS.config.credentials.authenticated
        });

        dynamoDB = new AWS.DynamoDB.DocumentClient({
            convertEmptyValues: true,
            removeUndefinedValues: true,
            region: region
        });
        console.log('✅ DynamoDB DocumentClient initialized successfully.');

    } catch (err) {
        console.error('❌ Error during AWS initialization:', err);
        // Re-throw the error with a more descriptive message to be caught by the main handler
        throw new Error(`AWS Initialization Failed: ${err.message}`);
    }
}

// Load merchants data from DynamoDB using AWS SDK
async function loadMerchantsFromDynamoDB() {
    console.log('Executing DynamoDB scan...');
    const params = {
        TableName: 'order-receiver-businesses-dev',
    };

    try {
        const data = await withTimeout(
            dynamoDB.scan(params).promise(),
            10000,
            'DynamoDB scan'
        );
        console.log('DynamoDB scan result:', data);

        if (data && Array.isArray(data.Items)) {
            merchantsData = data.Items.map(item => ({
                id: item.businessId || item.id || `merchant-${Date.now()}-${Math.random()}`,
                name: item.businessName || item.name || item.title || 'Unknown Business',
                email: item.email || item.businessEmail || 'N/A',
                phone: item.phoneNumber || item.phone || item.businessPhone || 'N/A',
                category: mapBusinessType(item.businessType || item.category) || 'Other',
                status: item.status || (item.isActive !== false ? 'approved' : 'pending'),
                isActive: item.isActive !== undefined ? item.isActive : true,
                address: extractAddress(item.address, item.city, item.country),
                owner: item.ownerName || item.owner || item.contactName || 'N/A',
                joinDate: item.createdAt ? formatDate(item.createdAt) : (item.dateCreated ? formatDate(item.dateCreated) : 'N/A'),
                avatar: item.businessPhotoUrl || item.avatar || item.logo || generateAvatarUrl(item.businessName || item.name),
                description: item.description || item.businessDescription || '',
                website: item.website || item.businessWebsite || '',
                fullData: item
            }));
            
            console.log(`✅ Successfully loaded and mapped ${merchantsData.length} merchants from DynamoDB!`);
            console.log('📊 Summary of loaded merchants:');
            merchantsData.forEach((merchant, index) => {
                console.log(`   ${index + 1}. ${merchant.name} (${merchant.id}) - ${merchant.address}`);
            });
            
            console.log('Final merchants data for rendering:', merchantsData);
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
    console.log('Extracting address from:', { addressObj, city, country });
    
    // Handle complex address object from DynamoDB
    if (addressObj && typeof addressObj === 'object') {
        const parts = [];
        
        // Check if it's a DynamoDB attribute value object (unconverted format)
        if (addressObj.country && addressObj.country.S) {
            console.log('Processing DynamoDB AttributeValue format');
            // DynamoDB AttributeValue format
            if (addressObj.street && addressObj.street.S) parts.push(addressObj.street.S);
            if (addressObj.district && addressObj.district.S) parts.push(addressObj.district.S);
            if (addressObj.city && addressObj.city.S) parts.push(addressObj.city.S);
            if (addressObj.country && addressObj.country.S) parts.push(addressObj.country.S);
        } else {
            console.log('Processing converted object format');
            // Regular object format (DocumentClient converted)
            if (addressObj.street) parts.push(addressObj.street);
            if (addressObj.district) parts.push(addressObj.district);
            if (addressObj.city) parts.push(addressObj.city);
            if (addressObj.country) parts.push(addressObj.country);
        }
        
        if (parts.length > 0) {
            const address = parts.join(', ');
            console.log('Extracted address:', address);
            return address;
        }
    }
    
    // Fallback to individual city and country fields
    if (typeof addressObj === 'string') {
        console.log('Using string address:', addressObj);
        return addressObj;
    }
    
    const parts = [];
    if (city) parts.push(city);
    if (country) parts.push(country);
    
    const fallbackAddress = parts.length > 0 ? parts.join(', ') : 'Address not available';
    console.log('Fallback address:', fallbackAddress);
    return fallbackAddress;
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        // Attempt to parse the date
        const date = new Date(dateString);
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return dateString; // Return original string if it's not a valid date
        }
        // Format to a more readable string e.g., "Jan 15, 2024"
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        console.warn(`Could not parse date: ${dateString}`);
        return dateString; // Return original string if parsing fails
    }
}

// Generate avatar URL
function generateAvatarUrl(name) {
    if (!name) return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=40&h=40&fit=crop&crop=center';
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&size=40&background=random&color=fff`;
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
    const loader = document.getElementById('loader');
    const loaderMessage = document.getElementById('loader-message');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
        if (show && loaderMessage) {
            loaderMessage.textContent = message;
        }
    } else {
        // This is not a critical error, but good to know for debugging UI.
        // console.warn('#loader element not found in the DOM.');
    }
}

// Dummy function to avoid errors if it's missing.
// In a real app, this would handle search, filters, etc.
function setupEventListeners() {
    console.log('Setting up event listeners (search, filters, etc.)...');
    // This is a placeholder. A full implementation would add listeners for
    // search input, filter dropdowns, and other interactive elements.
}

// Render the merchants table with the provided data
function renderMerchantsTable() {
    const tableBody = document.getElementById('merchantsTableBody');
    if (!tableBody) {
        console.error('Cannot render table: tbody element not found.');
        return;
    }

    if (filteredMerchants.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center p-8">No merchants match the current filters.</td></tr>';
        return;
    }

    const rows = filteredMerchants.map(merchant => {
        const statusInfo = MERCHANT_STATUSES[merchant.status] || MERCHANT_STATUSES['unknown'];
        
        let displayAddress = merchant.address || 'N/A';
        try {
            // The address might be a JSON string, so we parse it.
            const parsedAddress = JSON.parse(merchant.address);
            displayAddress = [
                parsedAddress.street,
                parsedAddress.city,
                parsedAddress.country
            ].filter(Boolean).join(', ');
        } catch (e) {
            // If it's not a JSON string, use it as is.
        }

        return `
            <tr>
                <td>
                    <div class="business-info">
                        <img src="${merchant.avatar}" alt="${merchant.name}" class="business-avatar">
                        <div class="business-details">
                            <h4>${merchant.name}</h4>
                            <p>${merchant.category || 'Business'}</p>
                        </div>
                    </div>
                </td>
                <td>${merchant.owner}</td>
                <td>
                    <span class="status-badge ${statusInfo.class}" style="background-color: ${statusInfo.color}20; color: ${statusInfo.color};">
                        ${statusInfo.label}
                    </span>
                </td>
                <td>${merchant.email}</td>
                <td>${merchant.phone}</td>
                <td>
                    <div class="address-info">${displayAddress}</div>
                </td>
                <td>
                    <div class="actions">
                        <button class="btn-action" onclick="viewMerchantDetails('${merchant.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action" onclick="editMerchant('${merchant.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;
}

// Update dashboard stats based on loaded merchants
function updateMerchantStats() {
    const totalMerchants = document.getElementById('total-merchants');
    const approvedMerchants = document.getElementById('approved-merchants');
    const pendingMerchants = document.getElementById('pending-merchants');
    const newThisMonth = document.getElementById('new-this-month');

    if (totalMerchants) totalMerchants.textContent = merchantsData.length;
    if (approvedMerchants) approvedMerchants.textContent = merchantsData.filter(m => m.status === 'approved').length;
    if (pendingMerchants) pendingMerchants.textContent = merchantsData.filter(m => m.status === 'pending' || m.status === 'under_review').length;
    
    const thisMonthCount = merchantsData.filter(m => {
        const joinDate = new Date(m.joinDate);
        const today = new Date();
        return joinDate.getMonth() === today.getMonth() && joinDate.getFullYear() === today.getFullYear();
    }).length;

    if (newThisMonth) newThisMonth.textContent = thisMonthCount;
}

// Modal functions for merchant management
function viewMerchantDetails(merchantId) {
    const merchant = filteredMerchants.find(m => m.id === merchantId);
    if (!merchant) {
        console.error('Merchant not found:', merchantId);
        return;
    }

    // Format address display
    let displayAddress = merchant.address || 'Not provided';
    try {
        const parsedAddress = JSON.parse(merchant.address);
        displayAddress = [
            parsedAddress.street,
            parsedAddress.city,
            parsedAddress.country
        ].filter(Boolean).join(', ');
    } catch (e) {
        // Use address as is if not JSON
    }

    const modalBody = document.getElementById('merchantDetailsBody');
    if (modalBody) {
        modalBody.innerHTML = `
            <div style="display: grid; gap: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <img src="${merchant.avatar}" alt="${merchant.name}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;">
                    <div>
                        <h4 style="margin: 0; color: #1e293b;">${merchant.name}</h4>
                        <p style="margin: 0; color: #64748b; font-size: 0.9rem;">${merchant.category || 'Business'}</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div><strong>Owner:</strong> ${merchant.owner}</div>
                    <div><strong>Status:</strong> <span class="status-badge ${MERCHANT_STATUSES[merchant.status]?.class || 'unknown'}">${MERCHANT_STATUSES[merchant.status]?.label || 'Unknown'}</span></div>
                    <div><strong>Email:</strong> ${merchant.email}</div>
                    <div><strong>Phone:</strong> ${merchant.phone}</div>
                    <div style="grid-column: 1 / -1;"><strong>Address:</strong> ${displayAddress}</div>
                    <div><strong>Join Date:</strong> ${merchant.joinDate ? new Date(merchant.joinDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Commission:</strong> ${merchant.commission || 0}%</div>
                </div>
            </div>
        `;
        
        document.getElementById('viewMerchantModal').style.display = 'flex';
    }
}

function editMerchant(merchantId) {
    const merchant = filteredMerchants.find(m => m.id === merchantId);
    if (!merchant) {
        console.error('Merchant not found:', merchantId);
        showEditFormMessage('Merchant not found', 'error');
        return;
    }

    // Clear any previous messages
    hideEditFormMessage();

    // Populate form fields with current merchant data
    populateEditForm(merchant);
    
    // Store the merchant ID for submission
    document.getElementById('editMerchantForm').setAttribute('data-merchant-id', merchantId);
    
    // Show the modal
    document.getElementById('editMerchantModal').style.display = 'flex';
    
    // Set up form submission handler
    setupEditFormSubmission();
}

function populateEditForm(merchant) {
    // Basic information - map to correct DynamoDB field names
    document.getElementById('editBusinessName').value = merchant.businessName || merchant.name || '';
    document.getElementById('editOwnerName').value = merchant.ownerName || merchant.owner || '';
    document.getElementById('editEmail').value = merchant.email || '';
    document.getElementById('editPhoneNumber').value = merchant.phoneNumber || merchant.phone || '';
    
    // Business type and status - use exact DynamoDB values
    document.getElementById('editBusinessType').value = merchant.businessType?.toLowerCase() || 'restaurant';
    document.getElementById('editStatus').value = merchant.status || 'pending';
    
    // Store original status for comparison
    document.getElementById('editMerchantForm').setAttribute('data-original-status', merchant.status || 'pending');
    
    // Address fields - handle both the nested address object and individual fields
    let street = '', city = '', district = '', country = 'Iraq';
    
    // First try individual fields
    if (merchant.street) street = merchant.street;
    if (merchant.city) city = merchant.city;
    if (merchant.district) district = merchant.district;
    if (merchant.country) country = merchant.country;
    
    // If no individual fields, try parsing the address object
    if (!street && !city && merchant.address) {
        try {
            if (typeof merchant.address === 'string') {
                const addressObj = JSON.parse(merchant.address);
                if (addressObj.street && addressObj.street.S) street = addressObj.street.S;
                if (addressObj.city && addressObj.city.S) city = addressObj.city.S;
                if (addressObj.district && addressObj.district.S) district = addressObj.district.S;
                if (addressObj.country && addressObj.country.S) country = addressObj.country.S;
            } else if (typeof merchant.address === 'object') {
                street = merchant.address.street || '';
                city = merchant.address.city || '';
                district = merchant.address.district || merchant.address.state || '';
                country = merchant.address.country || 'Iraq';
            }
        } catch (e) {
            console.warn('Failed to parse address:', e);
            // If parsing fails, treat address as a simple string for the street field
            street = merchant.address;
        }
    }
    
    document.getElementById('editStreet').value = street;
    document.getElementById('editCity').value = city;
    document.getElementById('editDistrict').value = district;
    document.getElementById('editCountry').value = country;
    
    // Set up status change monitoring
    setupStatusChangeHandler();
}

function setupStatusChangeHandler() {
    const statusSelect = document.getElementById('editStatus');
    const reasonSection = document.getElementById('statusReasonSection');
    const reasonTextarea = document.getElementById('editStatusReason');
    const form = document.getElementById('editMerchantForm');
    
    if (!statusSelect || !reasonSection || !reasonTextarea || !form) return;
    
    const originalStatus = form.getAttribute('data-original-status');
    
    statusSelect.addEventListener('change', function() {
        const newStatus = this.value;
        const statusChanged = newStatus !== originalStatus;
        
        if (statusChanged) {
            reasonSection.style.display = 'block';
            reasonTextarea.required = true;
            
            // Add visual indicator that status changed
            statusSelect.style.borderColor = '#f59e0b';
            statusSelect.style.backgroundColor = '#fef3c7';
            
            // Auto-focus the reason field
            setTimeout(() => reasonTextarea.focus(), 100);
        } else {
            reasonSection.style.display = 'none';
            reasonTextarea.required = false;
            reasonTextarea.value = '';
            
            // Reset status field styling
            statusSelect.style.borderColor = '#d1d5db';
            statusSelect.style.backgroundColor = 'white';
        }
    });
}

function setupEditFormSubmission() {
    const form = document.getElementById('editMerchantForm');
    
    // Remove any existing event listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Add new event listener
    newForm.addEventListener('submit', handleEditFormSubmission);
}

async function handleEditFormSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const merchantId = form.getAttribute('data-merchant-id');
    const saveBtn = document.getElementById('saveEditBtn');
    
    if (!merchantId) {
        showEditFormMessage('Error: Merchant ID not found', 'error');
        return;
    }
    
    // Disable submit button and show loading state
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
        // Collect form data
        const formData = collectEditFormData(form);
        
        // Validate form data
        const validation = validateEditFormData(formData);
        if (!validation.isValid) {
            showEditFormMessage(`Validation Error: ${validation.errors.join(', ')}`, 'error');
            return;
        }
        
        // Submit to backend
        const result = await submitMerchantUpdate(merchantId, formData);
        
        if (result.success) {
            showEditFormMessage('Merchant updated successfully!', 'success');
            
            // Trigger success event for auto-save cleanup
            form.dispatchEvent(new CustomEvent('formSubmitSuccess'));
            
            // Update the table immediately with new data
            renderMerchantsTable();
            updateMerchantStats();
            
            // Close modal after a brief delay
            setTimeout(() => {
                closeModal('editMerchantModal');
                // Optionally refresh data from server
                if (!window.location.hostname.includes('localhost')) {
                    refreshMerchantsData();
                }
            }, 1500);
        } else {
            // Ensure error is a string
            const errorMsg = typeof result.error === 'string' ? result.error : 
                           result.error?.message || 
                           JSON.stringify(result.error) || 
                           'Unknown error occurred';
            showEditFormMessage(`Update failed: ${errorMsg}`, 'error');
        }
        
    } catch (error) {
        console.error('Error updating merchant:', error);
        // Ensure error message is a string
        const errorMsg = error?.message || error?.toString() || 'Unknown error occurred';
        showEditFormMessage(`Update failed: ${errorMsg}`, 'error');
    } finally {
        // Re-enable submit button
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
    }
}

function collectEditFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    // Map form fields to exact DynamoDB field names
    const businessName = formData.get('businessName')?.trim();
    if (businessName) data.businessName = businessName;
    
    const ownerName = formData.get('ownerName')?.trim();
    if (ownerName) data.ownerName = ownerName;
    
    const email = formData.get('email')?.trim();
    if (email) data.email = email;
    
    const phoneNumber = formData.get('phoneNumber')?.trim();
    if (phoneNumber) data.phoneNumber = phoneNumber;
    
    const businessType = formData.get('businessType');
    if (businessType) data.businessType = businessType;
    
    // Status and reason
    const newStatus = formData.get('status');
    const originalStatus = form.getAttribute('data-original-status');
    const statusReason = formData.get('statusReason')?.trim();
    
    if (newStatus && newStatus !== originalStatus) {
        data.statusUpdate = {
            newStatus: newStatus,
            previousStatus: originalStatus,
            reason: statusReason || 'Status updated via merchant edit form'
        };
    }
    
    // Address fields - store as individual fields (matching DynamoDB schema)
    const street = formData.get('street')?.trim();
    const city = formData.get('city')?.trim();
    const district = formData.get('district')?.trim();
    const country = formData.get('country')?.trim();
    
    if (street) data.street = street;
    if (city) data.city = city;
    if (district) data.district = district;
    if (country) data.country = country;
    
    // Also create the nested address object for compatibility (some APIs might expect this)
    const addressParts = { street, city, district, country };
    const hasAddressData = Object.values(addressParts).some(value => value);
    if (hasAddressData) {
        data.address = JSON.stringify({
            street: { S: street || '' },
            city: { S: city || '' },
            district: { S: district || '' },
            country: { S: country || 'Iraq' }
        });
    }
    
    // Add updatedAt timestamp
    data.updatedAt = new Date().toISOString();
    
    // Remove empty fields
    Object.keys(data).forEach(key => {
        if (data[key] === '' || data[key] === null || data[key] === undefined) {
            delete data[key];
        }
    });
    
    return data;
}

function validateEditFormData(data) {
    const errors = [];
    
    // Required fields - using correct DynamoDB field names
    if (!data.businessName || data.businessName.length < 2) {
        errors.push('Business name must be at least 2 characters');
    }
    
    if (!data.email) {
        errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
    }
    
    if (!data.phoneNumber) {
        errors.push('Phone number is required');
    }
    
    // Status change validation
    if (data.statusUpdate) {
        const validStatuses = ['pending', 'approved', 'under_review', 'rejected'];
        if (!validStatuses.includes(data.statusUpdate.newStatus)) {
            errors.push('Invalid status selected');
        }
        
        if (!data.statusUpdate.reason || data.statusUpdate.reason.length < 10) {
            errors.push('Status change reason must be at least 10 characters');
        }
        
        if (data.statusUpdate.reason && data.statusUpdate.reason.length > 500) {
            errors.push('Status change reason must be less than 500 characters');
        }
    }
    
    // Business type validation
    if (data.businessType) {
        const validTypes = ['restaurant', 'store', 'cafe', 'cloudkitchen', 'pharmacy', 'retail'];
        if (!validTypes.includes(data.businessType)) {
            errors.push('Invalid business type selected');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

async function submitMerchantUpdate(merchantId, updateData) {
    try {
        console.log('Submitting merchant update:', { merchantId, updateData });
        console.log('API_BASE_URL resolved to:', API_BASE_URL);
        
        // Check if we're in a development environment - but allow real API calls if tokens are available
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const hasAuthToken = sessionStorage.getItem('accessToken') || sessionStorage.getItem('idToken');
        
        // Use simulation only if in development AND no auth token is available
        if (isDevelopment && !hasAuthToken) {
            // In development, simulate the API call and update local data
            console.log('Development mode: Simulating API call');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update the local data
            const merchantIndex = filteredMerchants.findIndex(m => m.id === merchantId);
            if (merchantIndex !== -1) {
                // Handle status update
                if (updateData.statusUpdate) {
                    filteredMerchants[merchantIndex].status = updateData.statusUpdate.newStatus;
                    console.log(`Status updated to: ${updateData.statusUpdate.newStatus}`);
                    // Remove statusUpdate from regular update data
                    const { statusUpdate, ...regularUpdates } = updateData;
                    Object.assign(filteredMerchants[merchantIndex], regularUpdates);
                } else {
                    // Regular update without status change
                    Object.assign(filteredMerchants[merchantIndex], updateData);
                }
                
                // Also update in the main merchants data array
                const mainIndex = merchantsData.findIndex(m => m.id === merchantId);
                if (mainIndex !== -1) {
                    if (updateData.statusUpdate) {
                        merchantsData[mainIndex].status = updateData.statusUpdate.newStatus;
                        const { statusUpdate, ...regularUpdates } = updateData;
                        Object.assign(merchantsData[mainIndex], regularUpdates);
                    } else {
                        Object.assign(merchantsData[mainIndex], updateData);
                    }
                }
            }
            
            return { success: true };
        } else {
            // In production, make actual API calls
            const accessToken = sessionStorage.getItem('accessToken') || sessionStorage.getItem('idToken');
            
            if (!accessToken) {
                throw new Error('Authentication token not found. Please login again.');
            }
            
            // Handle status update first if present
            if (updateData.statusUpdate) {
                console.log('Submitting status update:', updateData.statusUpdate);
                
                // Get proper action from status
                const action = getActionFromStatus(updateData.statusUpdate.newStatus);
                if (!action) {
                    throw new Error(`Invalid status change: ${updateData.statusUpdate.newStatus}`);
                }
                
                // Prepare the request body for status update
                const requestBody = {
                    action: action,
                    reason: updateData.statusUpdate.reason,
                    sendEmail: true
                };
                
                // Log request details for debugging
                console.log('Status update request URL:', `${API_BASE_URL}/merchants/${merchantId}/status`);
                console.log('Status update request body:', JSON.stringify(requestBody, null, 2));
                console.log('Request method:', 'PATCH');
                
                // Make status update request - MUST use PATCH method and the /status endpoint
                const statusResponse = await fetch(`${API_BASE_URL}/merchants/${merchantId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
                
                // Handle response for status update
                if (!statusResponse.ok) {
                    let errorMessage = 'Status update failed';
                    try {
                        const errorDetails = await statusResponse.json();
                        if (errorDetails.error && typeof errorDetails.error === 'object') {
                            errorMessage = errorDetails.error.message || errorDetails.error.error || `Server error: ${statusResponse.status}`;
                        } else {
                            errorMessage = errorDetails.message || errorDetails.error || errorDetails.detail || `Server error: ${statusResponse.status}`;
                        }
                        console.error('Status update error details:', errorDetails);
                    } catch (e) {
                        console.error('Failed to parse error response:', e);
                        try {
                            const responseText = await statusResponse.text();
                            console.error('Error response text:', responseText);
                            errorMessage = `HTTP ${statusResponse.status}: ${statusResponse.statusText} - ${responseText.substring(0, 200)}`;
                        } catch (textError) {
                            errorMessage = `HTTP ${statusResponse.status}: ${statusResponse.statusText}`;
                        }
                    }
                    
                    if (typeof errorMessage !== 'string') {
                        errorMessage = JSON.stringify(errorMessage) || `Server error: ${statusResponse.status}`;
                    }
                    
                    console.log('About to throw error with message:', errorMessage);
                    throw new Error(errorMessage);
                }
                
                console.log('Status update successful');
                
                // Try to parse the response for status update
                let statusUpdateResult;
                try {
                    statusUpdateResult = await statusResponse.json();
                    console.log('Status update response:', statusUpdateResult);
                } catch (e) {
                    console.warn('Could not parse status update response as JSON:', e);
                }
            }
            
            // Remove statusUpdate and the base status field from regular update data
            const { statusUpdate, status, ...regularUpdateData } = updateData;
            
            // If there are other fields to update, make a separate call
            if (Object.keys(regularUpdateData).length > 0) {
                console.log('Submitting regular merchant update:', regularUpdateData);
                console.log('Regular update request URL:', `${API_BASE_URL}/merchants/${merchantId}`);
                console.log('Request method:', 'PUT');
                
                const response = await fetch(`${API_BASE_URL}/merchants/${merchantId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(regularUpdateData)
                });
                
                if (!response.ok) {
                    let errorMessage = 'Update failed';
                    try {
                        const errorData = await response.json();
                        // Handle nested error structure from API response
                        if (errorData.error && typeof errorData.error === 'object') {
                            errorMessage = errorData.error.message || errorData.error.error || errorData.message || `Server error: ${response.status}`;
                        } else {
                            errorMessage = errorData.message || errorData.error || `Server error: ${response.status}`;
                        }
                        console.error('Merchant update error details:', errorData);
                    } catch (e) {
                        console.error('Failed to parse error response:', e);
                        // Try to get response text if JSON parsing fails
                        try {
                            const errorText = await response.text();
                            console.error('Error response text:', errorText);
                            errorMessage = `HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 200)}`;
                        } catch (textError) {
                            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                        }
                    }
                    throw new Error(errorMessage);
                }
                
                const result = await response.json();
                console.log('Regular update response:', result);
                
                // Update local data with the response from server
                if (result.merchant) {
                    const merchantIndex = filteredMerchants.findIndex(m => m.id === merchantId);
                    if (merchantIndex !== -1) {
                        Object.assign(filteredMerchants[merchantIndex], result.merchant);
                        
                        const mainIndex = merchantsData.findIndex(m => m.id === merchantId);
                        if (mainIndex !== -1) {
                            Object.assign(merchantsData[mainIndex], result.merchant);
                        }
                    }
                }
                
                return { success: true, data: result };
            }
            
            return { success: true };
        }
    } catch (error) {
        console.error('API call failed:', error);
        console.error('Error type:', typeof error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        
        // Extract meaningful error message
        let errorMessage = 'Unknown error occurred';
        
        if (error instanceof Error) {
            errorMessage = error.message || 'Unknown error occurred';
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else if (error && typeof error === 'object') {
            // Try to extract error information from response object
            if (error.message) {
                errorMessage = error.message || 'Unknown error occurred';
            } else if (error.error && typeof error.error === 'object' && error.error.message) {
                errorMessage = error.error.message;
            } else if (error.status) {
                errorMessage = `HTTP ${error.status}: ${error.statusText || 'Server Error'}`;
            } else {
                try {
                    errorMessage = JSON.stringify(error);
                } catch (e) {
                    errorMessage = 'Failed to parse error object';
                }
            }
        }
        
        // Final safety check - ensure errorMessage is a string
        if (typeof errorMessage !== 'string') {
            console.error('Error message is still not a string:', typeof errorMessage, errorMessage);
            errorMessage = 'An error occurred while updating the merchant';
        }
        
        // Provide more specific error messages based on content
        if (error.name === 'TypeError' && errorMessage.includes('fetch')) {
            return { success: false, error: 'Network error. Please check your connection and try again.' };
        } else if (errorMessage.includes('401')) {
            return { success: false, error: 'Authentication failed. Please login again.' };
        } else if (errorMessage.includes('403')) {
            return { success: false, error: 'You do not have permission to edit this merchant.' };
        } else if (errorMessage.includes('404')) {
            return { success: false, error: 'Merchant not found.' };
        } else if (errorMessage.includes('500')) {
            return { success: false, error: 'Server error occurred. Please try again or contact support.' };
        } else {
            return { success: false, error: errorMessage };
        }
    }
}

// Helper function to map status to backend action values
function getActionFromStatus(status) {
    const statusActionMap = {
        'verified': 'approve',
        'approved': 'approve',
        'rejected': 'reject',
        'suspended': 'suspend',
        'under-review': 'review',
        'under_review': 'review', // handle underscore variant
        'pending': 'reactivate'
    };
    return statusActionMap[status] || 'review'; // Default to review if status isn't recognized
}

// Modal utility functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scroll
    }
}

function showEditFormMessage(message, type = 'info') {
    const messageContainer = document.getElementById('editFormMessages');
    if (messageContainer) {
        messageContainer.innerHTML = `
            <div class="alert alert-${type}" style="
                padding: 0.75rem 1rem;
                border-radius: 6px;
                margin-bottom: 1rem;
                border: 1px solid;
                ${type === 'error' ? 'background-color: #fef2f2; border-color: #fecaca; color: #dc2626;' : ''}
                ${type === 'success' ? 'background-color: #f0fdf4; border-color: #bbf7d0; color: #16a34a;' : ''}
                ${type === 'info' ? 'background-color: #eff6ff; border-color: #bfdbfe; color: #2563eb;' : ''}
            ">
                ${message}
            </div>
        `;
        messageContainer.style.display = 'block';
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => hideEditFormMessage(), 3000);
        }
    }
}

function hideEditFormMessage() {
    const messageContainer = document.getElementById('editFormMessages');
    if (messageContainer) {
        messageContainer.style.display = 'none';
        messageContainer.innerHTML = '';
    }
}

// Export modal functions for global access
window.closeModal = closeModal;
window.showEditFormMessage = showEditFormMessage;
window.hideEditFormMessage = hideEditFormMessage;

// Force load real data function for development testing
window.forceLoadRealData = async function() {
    console.log('Forcing load of real data...');
    showLoader(true, 'Loading real data from database...');
    
    try {
        await initializeAWS();
        await loadMerchantsFromDynamoDB();
        
        if (merchantsData.length > 0) {
            filteredMerchants = [...merchantsData];
            renderMerchantsTable();
            updateMerchantStats();
            updateDataSourceIndicator('database', `Loaded ${merchantsData.length} real merchants from database`);
            showMessage(`Loaded ${merchantsData.length} merchants from database`, 'success');
        } else {
            showMessage('No merchants found in database', 'info');
        }
    } catch (error) {
        console.error('Failed to force load real data:', error);
        showMessage(`Failed to load real data: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
};

// Update merchant status function (for status modal)
window.updateMerchantStatus = function() {
    console.log('updateMerchantStatus function called - this would handle status modal updates');
    // This function would be implemented to handle the status modal
    // For now, just close the modal
    closeModal('statusModal');
    showMessage('Status modal function not fully implemented yet', 'info');
};
