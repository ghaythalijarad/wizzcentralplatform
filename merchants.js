// Merchants Management JavaScript - Using Centralized Data Service
console.log('merchants.js script loaded');

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

// This function is not currently used in the main flow but is kept for potential future use or reference.
// The main DOMContentLoaded handler contains the primary authentication and data loading logic.
function checkMerchantsAuthentication() {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
        console.log('No access token found, but proceeding for development');
        // For development, we'll allow proceeding without authentication
        // In production, this should redirect to the login page.
        // window.location.href = '../index.html';
        return true; // Allow proceeding for local dev
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

        console.log('🎯 Attempting to load real merchants data from DynamoDB...');
        showLoader(true, 'Loading merchants from database...');
        updateDataSourceIndicator('loading', 'Connecting to database...');

        // Initialize AWS first
        console.log('⚙️ Initializing AWS connection...');
        await initializeAWS();
        console.log('✅ AWS connection initialized successfully');

        // Try to load real data from DynamoDB
        console.log('📊 Loading merchants from DynamoDB...');
        updateDataSourceIndicator('loading', 'Fetching merchant data...');
        await loadMerchantsFromDynamoDB();

        if (merchantsData.length > 0) {
            console.log(`🎉 SUCCESS! Loaded ${merchantsData.length} real merchants from DynamoDB`);
            filteredMerchants = [...merchantsData];
            renderMerchantsTable();
            updateMerchantStats();
            updateDataSourceIndicator('database', `Loaded ${merchantsData.length} real merchants`);
            showMessage(`Loaded ${merchantsData.length} real merchants from the database.`, 'success');
        } else {
            console.log('⚠️ Database returned no merchants.');
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8">The database is empty. No merchants found.</td></tr>';
            updateDataSourceIndicator('empty', 'Database is empty');
            showMessage('The database is empty. No merchants to display.', 'info');
        }

    } catch (error) {
        console.error('❌ A critical error occurred during initialization:', error);
        const errorMessage = `Failed to load data: ${error.message}. This could be an issue with AWS credentials, network, or permissions. Please check the browser console for details.`;
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-red-600 bg-red-50 border border-red-200">${errorMessage}</td></tr>`;
        }
        updateDataSourceIndicator('error', `Error: ${error.message}`);
        showMessage(errorMessage, 'error');
    } finally {
        console.log('🏁 Initialization sequence finished. Cleaning up.');
        showLoader(false);
        // Setup event listeners regardless of outcome
        setupEventListeners();
    }
};

// Helper function to show sample data with a clear message
function showSampleDataWithMessage(reason) {
    console.log('Loading sample data as fallback...');
    merchantsData = getSampleMerchantsData();
    filteredMerchants = [...merchantsData];
    
    renderMerchantsTable();
    updateMerchantStats();
    setupEventListeners();
    
    // Show clear message about why we're showing sample data
    showMessage(`Showing sample data: ${reason}`, 'warning');
    console.log('Sample data loaded and rendered as fallback');
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
            case 'error':
            case 'empty':
                authIndicator.textContent = 'Sample Data';
                authIndicator.style.backgroundColor = '#6c757d';
                authIndicator.style.color = '#fff';
                if (loginBtn) loginBtn.style.display = 'none';
                if (loadRealDataBtn) loadRealDataBtn.style.display = 'inline-block';
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

// Function to force load real data (for the button)
function forceLoadRealData() {
    const idToken = sessionStorage.getItem('idToken');
    const accessToken = sessionStorage.getItem('accessToken');
    
    if (!idToken && !accessToken) {
        alert('You need to log in first to access real data. Redirecting to login page...');
        window.location.href = '../index.html';
        return;
    }
    
    // Force reload the page to retry loading real data
    location.reload();
}

// Export the forceLoadRealData function to global scope for the button
window.forceLoadRealData = forceLoadRealData;

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
            if (isLocal) {
                const tableBody = document.getElementById('merchantsTableBody');
                if(tableBody) tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8">Database is empty. No merchants found.</td></tr>';
                updateDataSourceIndicator('empty', 'Database is empty');
                showMessage('The database is empty. No merchants to display.', 'info');
            } else {
                updateDataSourceIndicator('empty', 'Database is empty - showing sample data');
                showSampleDataWithMessage('Database is empty after refresh.');
            }
        }
    } catch (error) {
        console.error('Refresh failed:', error);
        if (isLocal) {
            const errorMessage = `Failed to refresh data: ${error.message}. Check console for details.`;
            const tableBody = document.getElementById('merchantsTableBody');
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-red-600 bg-red-50 border border-red-200">${errorMessage}</td></tr>`;
            updateDataSourceIndicator('error', `Refresh Error: ${error.message}`);
            showMessage(errorMessage, 'error');
        } else {
            updateDataSourceIndicator('error', `Refresh failed - showing sample data (${error.message})`);
            showMessage(`Refresh failed: ${error.message}`, 'error');
            showSampleDataWithMessage(`Refresh failed: ${error.message}`);
        }
    } finally {
        showLoader(false);
    }
}

// Export for global access
window.refreshMerchantsData = refreshMerchantsData;

// Function to open debug tool
function openDebugTool() {
    window.open('../merchant-data-debug.html', '_blank');
}

// Export for global access
window.openDebugTool = openDebugTool;

// Initialize AWS SDK credentials and DynamoDB client for merchants
async function initializeAWS() {
    console.log('Starting AWS Initialization...');
    try {
        if (typeof AWS === 'undefined') {
            throw new Error('AWS SDK is not loaded. Please ensure the AWS SDK script is included in the HTML.');
        }

        console.log('Fetching amplify_outputs.json from root...');
        const resp = await withTimeout(
            fetch('/amplify_outputs.json'), 
            5000, 
            'Fetch amplify_outputs.json'
        );
        if (!resp.ok) {
            throw new Error(`Failed to fetch /amplify_outputs.json. Status: ${resp.status} ${resp.statusText}. Ensure the file is in the root of your deployment.`);
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
    const loader = document.getElementById('loader');
    const loaderMessage = document.getElementById('loader-message');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
        if (show && loaderMessage) {
            loaderMessage.textContent = message;
        }
    } else {
        console.warn('#loader element not found in the DOM.');
    }
}

// This script should run after the DOM is fully loaded.
// We'll check the readyState to handle cases where the script is loaded asynchronously
// after the DOMContentLoaded event has already fired.
if (document.readyState === 'loading') {
    // Loading hasn't finished yet
    document.addEventListener('DOMContentLoaded', onDomReady);
} else {
    // `DOMContentLoaded` has already fired
    console.log('DOM already loaded, running onDomReady immediately.');
    onDomReady();
}
