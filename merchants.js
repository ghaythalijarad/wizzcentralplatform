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

// Initialize merchants page when DOM is ready
const onDomReady = async function() {
    console.log('🚀 Merchants page DOM loaded - Starting initialization...');
    
    // Protocol check: file:// not supported for fetch
    if (window.location.protocol === 'file:') {
        console.error('Page served via file:// protocol - fetch operations will fail');
        showLoader(false);
        const tableBody = document.getElementById('merchantsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-red-600 bg-red-50 border border-red-200">Please serve this page via a local HTTP server (e.g., python3 -m http.server) to enable data loading.</td></tr>`;
        }
        updateDataSourceIndicator('error', 'File protocol not supported');
        showMessage('Page loaded via file:// protocol. Data fetch requires HTTP/HTTPS.', 'error');
        return;
    }
    
    // Debug: Check if required elements exist
    const tableBody = document.getElementById('merchantsTableBody');
    const statusElement = document.getElementById('merchants-table-status');
    
    console.log('Table body element:', tableBody);
    console.log('Status element:', statusElement);
    
    if (!tableBody) {
        console.error('CRITICAL: merchantsTableBody element not found!');
        return;
    }

    // Initialize dashboard (sidebar, menu) - but delay it to avoid conflicts
    setTimeout(() => {
        if (typeof initializeDashboard === 'function') {
            console.log('Initializing dashboard...');
            initializeDashboard();
        } else {
            console.warn('initializeDashboard function not found');
        }
    }, 100);

    // Check authentication first
    const idToken = sessionStorage.getItem('idToken');
    const accessToken = sessionStorage.getItem('accessToken');
    
    console.log('🔑 Authentication check:', {
        hasIdToken: !!idToken,
        hasAccessToken: !!accessToken,
        idTokenLength: idToken ? idToken.length : 0
    });

    // FOR TESTING: Always try to load real data, even without auth
    console.log('🧪 TESTING MODE: Attempting to load real data regardless of auth status...');

    // Determine if running in a local development environment
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
        console.log('💻 Running in local development mode. Error fallbacks will be disabled.');
    }

    // PRIORITY: Try to load real data from DynamoDB first
    console.log('🎯 Attempting to load real merchants data from DynamoDB...');
    showLoader(true, 'Loading merchants from database...');
    updateDataSourceIndicator('loading', 'Loading real data from database...');
    
    try {
        // Initialize AWS first
        console.log('⚙️ Initializing AWS...');
        await initializeAWS();
        console.log('✅ AWS initialized successfully');
        
        // Try to load real data from DynamoDB
        console.log('📊 Loading merchants from DynamoDB...');
        await loadMerchantsFromDynamoDB();
        
        if (merchantsData.length > 0) {
            console.log(`🎉 SUCCESS! Loaded ${merchantsData.length} real merchants from DynamoDB`);
            filteredMerchants = [...merchantsData];
            renderMerchantsTable();
            updateMerchantStats();
            updateDataSourceIndicator('database', `Loaded ${merchantsData.length} real merchants from database`);
            showMessage(`Loaded ${merchantsData.length} real merchants from database`, 'success');
            setTimeout(() => hideMessage(), 3000);
        } else {
            console.log('⚠️ Database returned no merchants.');
            // When local, show an empty state message instead of sample data
            if (isLocal) {
                const tableBody = document.getElementById('merchantsTableBody');
                if(tableBody) tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8">Database is empty. No merchants found.</td></tr>';
                updateDataSourceIndicator('empty', 'Database is empty');
                showMessage('The database is empty. No merchants to display.', 'info');
            } else {
                console.log('⚠️ Database returned no merchants, using sample data');
                merchantsData = getSampleMerchantsData();
                filteredMerchants = [...merchantsData];
                renderMerchantsTable();
                updateMerchantStats();
                updateDataSourceIndicator('empty', 'Database is empty - showing sample data');
                showMessage('Database is empty. Showing sample data for demonstration.', 'warning');
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to load real data:', error);
        
        // When local, display the error clearly instead of falling back to sample data
        if (isLocal) {
            console.log('💻 LOCAL MODE: Bypassing sample data fallback to show the real error.');
            const errorMessage = `Failed to load data from DynamoDB: ${error.message}. This is likely an AWS credentials or IAM permission issue. Check the browser console for details.`;
            const tableBody = document.getElementById('merchantsTableBody');
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-red-600 bg-red-50 border border-red-200">${errorMessage}</td></tr>`;
            updateDataSourceIndicator('error', `Database Error: ${error.message}`);
            showMessage(errorMessage, 'error');
        } else {
            console.log('🔄 Falling back to sample data due to error:', error.message);
            // Fall back to sample data
            merchantsData = getSampleMerchantsData();
            filteredMerchants = [...merchantsData];
            renderMerchantsTable();
            updateMerchantStats();
            updateDataSourceIndicator('error', `Database error: ${error.message}. Showing sample data.`);
            showMessage(`Database connection failed: ${error.message}. Loading sample data...`, 'warning');
        }
    } finally {
        showLoader(false);
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
    try {
        const idToken = sessionStorage.getItem('idToken');
        const accessToken = sessionStorage.getItem('accessToken');
        
        console.log('Auth tokens status:', {
            hasIdToken: !!idToken,
            hasAccessToken: !!accessToken,
        });

        if (typeof AWS === 'undefined') {
            throw new Error('AWS SDK not loaded.');
        }

        const resp = await fetch('../amplify_outputs.json');
        if (!resp.ok) throw new Error(`Failed to load amplify_outputs.json: ${resp.status}`);
        const outputs = await resp.json();
        const region = outputs.data?.aws_region || 'us-east-1';
        const userPoolId = outputs.auth.user_pool_id;
        const identityPoolId = outputs.auth.identity_pool_id;
        const provider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;

        AWS.config.update({ region });

        const credParams = { IdentityPoolId: identityPoolId };
        const hasValidToken = idToken && !idToken.startsWith('mock-') && idToken.length > 50;

        if (hasValidToken) {
            console.log('Attempting to get AWS credentials using Cognito ID token.');
            credParams.Logins = { [provider]: idToken };
        } else {
            console.warn('No valid authentication token found.');
            console.info('Attempting to get AWS credentials for unauthenticated access.');
            console.info('ℹ️ For this to work, your Cognito Identity Pool must have "Enable access to unauthenticated identities" checked, and the unauthenticated IAM role must have permissions to access the DynamoDB table.');
        }

        AWS.config.credentials = new AWS.CognitoIdentityCredentials(credParams);

        try {
            await AWS.config.credentials.refreshPromise();
            console.log('✅ AWS credentials obtained successfully.', {
                identityId: AWS.config.credentials.identityId,
                isAuthenticated: AWS.config.credentials.authenticated
            });
        } catch (error) {
            console.error('❌ Failed to refresh AWS credentials:', error);
            const message = `Could not get AWS credentials. 
            - If you are not logged in, please check your Cognito Identity Pool settings for unauthenticated access.
            - The IAM role for your identity (authenticated or unauthenticated) might be missing the required DynamoDB permissions (e.g., dynamodb:Scan).
            - Original error: ${error.message}`;
            throw new Error(message);
        }

        dynamoDB = new AWS.DynamoDB.DocumentClient({
            convertEmptyValues: true,
            removeUndefinedValues: true,
            region: region
        });
        console.log('✅ DynamoDB DocumentClient initialized successfully in region:', region);

    } catch (err) {
        console.error('Error during AWS initialization:', err);
        // Re-throw the error so the caller function can handle it (e.g., show an error in the UI)
        throw err;
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
            TableName: 'order-receiver-businesses-dev',
            Limit: 100 // Add limit to prevent large scans
        };

        console.log('Scanning DynamoDB with params:', params);
        const result = await dynamoDB.scan(params).promise();
        console.log('DynamoDB scan result:', result);

        if (result.Items && result.Items.length > 0) {
            console.log(`✅ Found ${result.Items.length} merchants in DynamoDB!`);
            console.log('Raw DynamoDB items sample:', result.Items[0]);
            
            merchantsData = result.Items.map((item, index) => {
                console.log(`🔄 Processing merchant ${index + 1}:`, item);
                
                // Handle address extraction with enhanced logging
                let address = 'Address not available';
                try {
                    if (item.address && typeof item.address === 'object') {
                        console.log('Address object found:', item.address);
                        address = extractAddress(item.address, item.city, item.country);
                    } else if (item.city || item.country) {
                        const parts = [];
                        if (item.city) parts.push(item.city);
                        if (item.country) parts.push(item.country);
                        address = parts.join(', ');
                        console.log('Using city/country fallback:', address);
                    } else if (typeof item.address === 'string') {
                        address = item.address;
                        console.log('Using string address:', address);
                    }
                } catch (addrError) {
                    console.error('Error extracting address:', addrError);
                    address = 'Address extraction failed';
                }
                
                // Create merchant object with comprehensive field mapping
                const merchant = {
                    // Primary identification
                    id: item.businessId || item.id || `merchant-${Date.now()}-${Math.random()}`,
                    name: item.businessName || item.name || item.title || 'Unknown Business',
                    
                    // Contact information
                    email: item.email || item.businessEmail || 'N/A',
                    phone: item.phoneNumber || item.phone || item.businessPhone || 'N/A',
                    
                    // Business details
                    category: mapBusinessType(item.businessType || item.category) || 'Other',
                    status: item.status || (item.isActive !== false ? 'approved' : 'pending'),
                    isActive: item.isActive !== undefined ? item.isActive : true,
                    
                    // Location
                    address: address,
                    
                    // Owner information
                    owner: item.ownerName || item.owner || item.contactName || 'N/A',
                    
                    // Timestamps
                    joinDate: item.createdAt ? formatDate(item.createdAt) : (item.dateCreated ? formatDate(item.dateCreated) : 'N/A'),
                    
                    // Visual
                    avatar: item.businessPhotoUrl || item.avatar || item.logo || generateAvatarUrl(item.businessName || item.name),
                    
                    // Additional fields for potential future use
                    description: item.description || item.businessDescription || '',
                    website: item.website || item.businessWebsite || '',
                    
                    // Keep original data for details view
                    fullData: item
                };
                
                console.log(`✅ Mapped merchant ${index + 1}:`, {
                    id: merchant.id,
                    name: merchant.name,
                    phone: merchant.phone,
                    address: merchant.address,
                    status: merchant.status
                });
                
                return merchant;
            });
            
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
    console.log('Table body innerHTML before:', tbody ? tbody.innerHTML.substring(0, 100) + '...' : 'N/A');
    
    if (!tbody) {
        console.error('merchantsTableBody element not found');
        // Try to find it with alternative methods
        const allTables = document.querySelectorAll('table');
        console.log('All tables found:', allTables.length);
        const allTbodies = document.querySelectorAll('tbody');
        console.log('All tbody elements found:', allTbodies.length);
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
        console.log('Table HTML updated with empty state');
        return;
    }

    console.log('Generating table HTML for', filteredMerchants.length, 'merchants');
    
    try {
        const tableHTML = filteredMerchants.map(merchant => {
            console.log('Processing merchant:', merchant.name);
            return `
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
            `;
        }).join('');
        
        console.log('Generated table HTML (length:', tableHTML.length, 'characters)');
        console.log('Table HTML preview:', tableHTML.substring(0, 200) + '...');
        
        tbody.innerHTML = tableHTML;
        console.log('Table HTML set successfully');
        console.log('Table body innerHTML after:', tbody.innerHTML.substring(0, 100) + '...');
    } catch (error) {
        console.error('Error generating table HTML:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <div>Error rendering table</div>
                    <div style="font-size: 0.9rem; margin-top: 0.5rem;">${error.message}</div>
                </td>
            </tr>
        `;
    }
    
    console.log('=== RENDER MERCHANTS TABLE END ===');
}

// Update merchant statistics
function updateMerchantStats() {
    const totalMerchants = merchantsData.length;
    const activeMerchants = merchantsData.filter(m => m.isActive !== false).length;
    
    // Try to find stat cards and update them
    const cards = document.querySelectorAll('.stat-card h3');
    if (cards.length >= 2) {
        cards[0].textContent = totalMerchants;
        cards[1].textContent = activeMerchants;
        console.log(`Updated stats: ${totalMerchants} total, ${activeMerchants} active merchants`);
    } else {
        console.log(`Stats calculated but no stat-card elements found: ${totalMerchants} total, ${activeMerchants} active merchants`);
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

// Replace original listener binding
document.removeEventListener('DOMContentLoaded', /* original handler */);
document.addEventListener('DOMContentLoaded', onDomReady);
