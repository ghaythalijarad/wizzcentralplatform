// Merchants Management JavaScript

// AWS Configuration - we'll configure this from the amplify_outputs.json
let dynamoDB = null;
let awsConfig = null;
let cognitoCredentials = null; // Store credentials globally after fetching

// Wait for AWS SDK to be loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing merchants management with AWS SDK...');
    
    try {
        // 1. Check for auth token
        const idToken = sessionStorage.getItem('idToken');
        if (!idToken) {
            console.log('No ID token found in session storage. Redirecting to login.');
            window.location.href = 'index.html';
            return;
        }

        // 2. Check if AWS SDK is loaded
        if (typeof AWS === 'undefined') {
            throw new Error('AWS SDK not loaded. Please check the CDN script.');
        }

        // 3. Load AWS configuration from amplify_outputs.json
        const response = await fetch('./amplify_outputs.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch amplify_outputs.json: ${response.status}`);
        }
        const outputs = await response.json();
        
        // 4. Prepare AWS configuration details
        const region = outputs.data?.aws_region || 'us-east-1';
        const userPoolId = outputs.auth.user_pool_id;
        const identityPoolId = outputs.auth.identity_pool_id;
        const cognitoProvider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;

        // 5. Set up credentials
        AWS.config.region = region;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: identityPoolId,
            Logins: {
                [cognitoProvider]: idToken
            }
        });

        // 6. Force credentials to refresh and handle potential errors.
        try {
            await AWS.config.credentials.refreshPromise();
            console.log("Successfully fetched/refreshed AWS credentials.");
            console.log("Cognito Identity ID:", AWS.config.credentials.identityId);
        } catch (error) {
            console.error("Error refreshing credentials:", error);
            throw new Error("Could not refresh AWS credentials. The authentication token might be invalid or expired. Please try logging in again.");
        }

        if (!AWS.config.credentials.identityId) {
            throw new Error("Cognito Identity ID not found after credential refresh. This indicates a problem with the Identity Pool configuration or the provided token.");
        }

        // 7. Initialize DynamoDB client now that credentials are confirmed
        dynamoDB = new AWS.DynamoDB.DocumentClient();
        console.log('DynamoDB client initialized successfully.');

        // 8. Initialize the application
        await initializeMerchantsManagement();

    } catch (error) {
        console.error('A critical error occurred during initialization:', error);
        const errorMessage = `Initialization failed: ${error.message}. Displaying sample data as a fallback.`;
        showMessage(errorMessage, 'error');
        
        // Fallback to sample data on any initialization failure
        merchantsData = getSampleMerchantsData();
        filteredMerchants = [...merchantsData];
        initializeUI();
        setupEventListeners();
    }
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
        
        // The DynamoDB client is already initialized in the DOMContentLoaded event listener.
        // We can proceed directly to loading data.
        if (!dynamoDB) {
            throw new Error("DynamoDB client is not initialized. This should not happen.");
        }

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
        merchantsData = getSampleMerchantsData(); // Fallback
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
                id: item.businessId, // Primary key
                name: item.businessName || 'Unknown Business',
                email: item.email || 'N/A',
                phone: item.phoneNumber || 'N/A',
                address: item.address ? `${item.address.street}, ${item.address.city}` : 'N/A',
                owner: item.ownerName || 'N/A',
                isActive: item.isActive !== undefined ? item.isActive : true,
                joinDate: item.createdAt ? formatDate(item.createdAt) : 'N/A',
                avatar: item.businessPhotoUrl || generateAvatarUrl(item.businessName),
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

    // Filter functionality (simplified for new structure)
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterMerchants);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshMerchantsData);
    }
}

// Update status filter dropdown - simplified, can be removed if not used
function updateStatusFilter() {
    // This function can be simplified or removed if the status filter is no longer complex
    // For now, it does nothing as the primary status is the active toggle.
}

// Filter merchants based on search and filters
function filterMerchants() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    filteredMerchants = merchantsData.filter(merchant => {
        return !searchTerm || 
            merchant.name.toLowerCase().includes(searchTerm) ||
            (merchant.owner && merchant.owner.toLowerCase().includes(searchTerm)) ||
            merchant.id.toLowerCase().includes(searchTerm);
    });
    
    renderMerchantsTable();
    updateMerchantStats();
}

// Pagination state (can be re-added if needed)
// let currentPage = 1;
// const rowsPerPage = 10;

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
    const tableBody = document.getElementById('merchantsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Clear existing rows

    if (filteredMerchants.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No merchants found.</td></tr>';
        return;
    }

    filteredMerchants.forEach(merchant => {
        const row = createMerchantTableRow(merchant);
        tableBody.appendChild(row);
    });
}

// Create a single table row for a merchant
function createMerchantTableRow(merchant) {
    const row = document.createElement('tr');
    row.dataset.merchantId = merchant.id;

    // Business & Owner Cell
    row.innerHTML = `
        <td>
            <div class="merchant-info">
                <div class="merchant-avatar">
                    <img src="${merchant.avatar || 'placeholder.png'}" alt="${merchant.name}">
                </div>
                <div>
                    <div class="merchant-name">${merchant.name}</div>
                    <div class="merchant-id">${merchant.owner || 'N/A'}</div>
                </div>
            </div>
        </td>
        <td>
            <label class="switch">
                <input type="checkbox" ${merchant.isActive ? 'checked' : ''} onchange="toggleActive('${merchant.id}')">
                <span class="slider round"></span>
            </label>
        </td>
        <td>${merchant.phone || 'N/A'}</td>
        <td>${merchant.address || 'N/A'}</td>
        <td>
            <button class="btn-secondary btn-sm" onclick="viewMerchantDetails('${merchant.id}')">View</button>
        </td>
    `;
    return row;
}

// Toggle merchant active status
async function toggleActive(businessId) {
    const merchant = merchantsData.find(m => m.id === businessId);
    if (!merchant) return;

    const newStatus = !merchant.isActive;
    showLoader(true, `Updating status for ${merchant.name}...`);

    try {
        await updateMerchantInDB(businessId, { isActive: newStatus });
        merchant.isActive = newStatus; // Update local data
        console.log(`Successfully updated status for ${businessId} to ${newStatus}`);
        updateMerchantStats(); // Recalculate stats
    } catch (error) {
        console.error(`Failed to update status for ${businessId}:`, error);
        showMessage(`Error updating status: ${error.message}`, 'error');
        // Revert the checkbox if the update fails
        const checkbox = document.querySelector(`tr[data-merchant-id='${businessId}'] input[type='checkbox']`);
        if (checkbox) {
            checkbox.checked = merchant.isActive;
        }
    } finally {
        showLoader(false);
    }
}

// Update a merchant in DynamoDB
async function updateMerchantInDB(businessId, updateData) {
    if (!dynamoDB) throw new Error("DynamoDB client not initialized.");

    const params = {
        TableName: MERCHANTS_TABLE,
        Key: { 'businessId': businessId },
        UpdateExpression: 'set #isActive = :isActive',
        ExpressionAttributeNames: { '#isActive': 'isActive' },
        ExpressionAttributeValues: { ':isActive': updateData.isActive },
        ReturnValues: 'UPDATED_NEW'
    };

    console.log('Updating merchant in DynamoDB with params:', params);
    return dynamoDB.update(params).promise();
}


// View merchant details in a modal
function viewMerchantDetails(businessId) {
    const merchant = merchantsData.find(m => m.id === businessId);
    if (!merchant) return;

    const detailsBody = document.getElementById('merchantDetailsBody');
    detailsBody.innerHTML = `
        <div class="merchant-avatar-large">
            <img src="${merchant.avatar}" alt="${merchant.name}">
            <h3>${merchant.name}</h3>
            <p>${merchant.owner}</p>
        </div>
        <div class="details-grid">
            <div class="detail-item"><label>Business ID</label><span>${merchant.id}</span></div>
            <div class="detail-item"><label>Status</label><span>${merchant.isActive ? 'Active' : 'Inactive'}</span></div>
            <div class="detail-item"><label>Phone</label><span>${merchant.phone}</span></div>
            <div class="detail-item"><label>Email</label><span>${merchant.email}</span></div>
            <div class="detail-item" style="grid-column: 1 / -1;"><label>Address</label><span>${merchant.address}</span></div>
            <div class="detail-item"><label>Joined On</label><span>${merchant.joinDate}</span></div>
        </div>
    `;

    document.getElementById('viewMerchantModal').style.display = 'flex';
}

// Update merchant stats cards
function updateMerchantStats() {
    const totalMerchants = merchantsData.length;
    const activeMerchants = merchantsData.filter(m => m.isActive).length;

    document.querySelector('.stat-card:nth-child(1) h3').textContent = totalMerchants;
    document.querySelector('.stat-card:nth-child(2) h3').textContent = activeMerchants;
    // Other stats can be updated here if data is available
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

// Close modal utility
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Format date utility
function formatDate(isoString) {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString();
}

// Refresh data from DynamoDB
async function refreshMerchantsData() {
    showLoader(true, 'Refreshing data from the database...');
    try {
        await loadMerchantsFromDynamoDB();
        filterMerchants();
        hideMessage();
    } catch (error) {
        console.error('Failed to refresh data:', error);
        showMessage(`Error refreshing data: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
}

// Sample data function (if needed for fallback)
function getSampleMerchantsData() {
    return [
        {
            id: 'biz-001',
            name: 'Sample Merchant 1',
            email: 'sample1@example.com',
            phone: '+1-555-0101',
            category: 'Restaurant',
            status: 'approved',
            commission: 10,
            ordersToday: 5,
            revenueToday: 150.00,
            rating: 4.5,
            joinDate: '2023-01-10',
            avatar: 'https://ui-avatars.com/api/?name=Sample+Merchant+1&size=40&background=random',
            address: '123 Sample St, Sample City',
            owner: 'Owner 1',
            isActive: true
        },
        {
            id: 'biz-002',
            name: 'Sample Merchant 2',
            email: 'sample2@example.com',
            phone: '+1-555-0102',
            category: 'Grocery',
            status: 'pending',
            commission: 8,
            ordersToday: 0,
            revenueToday: 0,
            rating: null,
            joinDate: '2023-07-15',
            avatar: 'https://ui-avatars.com/api/?name=Sample+Merchant+2&size=40&background=random',
            address: '456 Example Ave, Example City',
            owner: 'Owner 2',
            isActive: true
        }
    ];
}
