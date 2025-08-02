// Customers Management JavaScript

// Customer management variables
let customers = [];
let filteredCustomers = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

// Initialize customers page
async function initializeCustomersPage() {
    console.log('Initializing customers page...');
    
    try {
        // Load customers data from DynamoDB
        console.log('About to load customers data...');
        await loadCustomersData();
        console.log('Customers data loaded successfully');
        
        // Setup event listeners
        setupEventListeners();
        
        // Render page
        renderCustomersTable();
        updateStatCards();
        updatePagination();
        
        console.log('Customers page initialization complete');
    } catch (error) {
        console.error('Error initializing customers page:', error);
        // Show error in UI
        const tbody = document.querySelector('#customersTable tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: red;">Error loading customers: ${error.message}</td></tr>`;
        }
    }
}

// Load customers data from DynamoDB with proper permissions
async function loadCustomersData() {
    try {
        console.log('Loading customers data from DynamoDB...');
        
        // Use centralized AWS utilities
        const dynamoDB = await AWSUtils.getDynamoDBClient();
        
        console.log('Scanning WizzUser_users_dev table with proper permissions...');
        
        const params = {
            TableName: 'WizzUser_users_dev'
        };
        
        const result = await dynamoDB.scan(params).promise();
        console.log('✅ DynamoDB scan successful! Result:', result);
        console.log('📊 Items returned:', result.Items ? result.Items.length : 0);
        
        if (!result.Items || result.Items.length === 0) {
            console.warn('No users found in DynamoDB table');
            customers = [];
            filteredCustomers = [];
            return;
        }
        
        console.log(`🎉 Successfully found ${result.Items.length} users in DynamoDB!`);
        
        // Map your real DynamoDB users to the customers management UI format
        customers = result.Items.map((user, index) => {
            console.log(`Processing user ${index + 1}:`, user);
            
            const customer = {
                id: user.userId,
                name: user.name || 'N/A',
                email: user.email || 'N/A',
                phone: user.phone || 'N/A',
                status: user.isActive ? 'active' : 'inactive',
                totalOrders: 0, // Will be populated from orders table later
                totalSpent: 0, // Will be populated from orders table later
                lastOrder: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never',
                segment: user.name && user.email ? 'regular' : 'new',
                joinDate: user.createdAt,
                avatar: `https://i.pravatar.cc/40?u=${user.userId}`,
                isActive: user.isActive,
                // Additional fields from your DynamoDB table
                cognitoUsername: user.cognitoUsername,
                countryCode: user.countryCode,
                gender: user.gender,
                preferredLanguage: user.preferredLanguage,
                marketingConsent: user.marketingConsent,
                privacyAccepted: user.privacyAccepted,
                termsAccepted: user.termsAccepted,
                addresses: user.addresses || []
            };
            
            console.log(`✅ Mapped customer ${index + 1} for UI:`, customer);
            return customer;
        });
        
        filteredCustomers = [...customers];
        console.log('🎯 Final customers array ready for UI:', customers);
        console.log(`📈 Total customers mapped: ${customers.length}`);
        
    } catch (error) {
        console.error('❌ Error loading customers data:', error);
        console.error('Error details:', error.code, error.message);
        
        // Display error in UI and re-throw
        customers = [];
        filteredCustomers = [];
        throw new Error(`Failed to load customers: ${error.message}`);
    }
}

// Determine customer segment based on spending and orders
function determineCustomerSegment(totalSpent, totalOrders) {
    if (totalSpent > 500 || totalOrders > 20) {
        return 'vip';
    } else if (totalSpent >= 100 && totalSpent <= 500) {
        return 'regular';
    } else if (totalOrders <= 3) {
        return 'new';
    } else {
        return 'regular';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Filter functionality
    const statusFilter = document.getElementById('statusFilter');
    const segmentFilter = document.getElementById('segmentFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilter);
    }
    
    if (segmentFilter) {
        segmentFilter.addEventListener('change', handleFilter);
    }
    
    // Pagination
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderCustomersTable();
                updatePagination();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                renderCustomersTable();
                updatePagination();
            }
        });
    }
}

// Handle search functionality
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredCustomers = [...customers];
    } else {
        filteredCustomers = customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.email.toLowerCase().includes(searchTerm) ||
            customer.phone.includes(searchTerm)
        );
    }
    
    currentPage = 1;
    renderCustomersTable();
    updatePagination();
}

// Handle filter functionality
function handleFilter() {
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const segmentFilter = document.getElementById('segmentFilter')?.value || '';
    
    filteredCustomers = customers.filter(customer => {
        const matchesStatus = !statusFilter || customer.status === statusFilter;
        const matchesSegment = !segmentFilter || customer.segment === segmentFilter;
        return matchesStatus && matchesSegment;
    });
    
    currentPage = 1;
    renderCustomersTable();
    updatePagination();
}

// Render customers table
function renderCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageCustomers = filteredCustomers.slice(startIndex, endIndex);
    
    if (pageCustomers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center" style="padding: 2rem; color: #666;">
                    <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <br>
                    No customers found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = pageCustomers.map(customer => `
        <tr>
            <td>
                <div class="customer-info">
                    <img src="${customer.avatar}" alt="${customer.name}" class="customer-avatar">
                    <div>
                        <div class="customer-name">${customer.name}</div>
                        <div class="customer-id">ID: ${customer.id}</div>
                    </div>
                </div>
            </td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>
                <span class="status-badge ${customer.status}">
                    ${customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                </span>
            </td>
            <td>${customer.totalOrders}</td>
            <td>$${customer.totalSpent.toFixed(2)}</td>
            <td>${formatDate(customer.lastOrder)}</td>
            <td>
                <span class="segment-badge ${customer.segment}">
                    ${customer.segment.toUpperCase()}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewCustomer('${customer.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editCustomer('${customer.id}')" title="Edit Customer">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn toggle" onclick="toggleCustomerStatus('${customer.id}')" title="Toggle Status">
                        <i class="fas fa-toggle-${customer.status === 'active' ? 'on' : 'off'}"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update statistics cards
function updateStatCards() {
    const totalCustomersEl = document.querySelector('.stat-card h3');
    const activeCustomersEl = document.querySelectorAll('.stat-card h3')[1];
    const avgOrderValueEl = document.querySelectorAll('.stat-card h3')[2];
    
    if (totalCustomersEl) {
        totalCustomersEl.textContent = customers.length.toString();
    }
    
    if (activeCustomersEl) {
        const activeCount = customers.filter(c => c.status === 'active').length;
        activeCustomersEl.textContent = activeCount.toString();
    }
    
    if (avgOrderValueEl && customers.length > 0) {
        const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
        const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        avgOrderValueEl.textContent = `$${avgOrderValue.toFixed(2)}`;
    }
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
    const paginationInfo = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (paginationInfo) {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
        const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length);
        paginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${filteredCustomers.length} customers`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString || dateString === 'Never') return 'Never';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return 'Invalid Date';
    }
}

// Customer action functions
function viewCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        alert(`Customer Details:\n\nName: ${customer.name}\nEmail: ${customer.email}\nPhone: ${customer.phone}\nStatus: ${customer.status}\nTotal Orders: ${customer.totalOrders}\nTotal Spent: $${customer.totalSpent.toFixed(2)}`);
    }
}

function editCustomer(customerId) {
    // TODO: Implement edit customer functionality
    alert(`Edit customer functionality not yet implemented for customer ID: ${customerId}`);
}

async function toggleCustomerStatus(customerId) {
    try {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;
        
        const newStatus = !customer.isActive;
        
        // Update status in DynamoDB using direct access
        const dynamoDB = new AWS.DynamoDB.DocumentClient();
        
        const updateParams = {
            TableName: 'WizzUser_users_dev',
            Key: { userId: customerId },
            UpdateExpression: 'SET isActive = :status',
            ExpressionAttributeValues: { ':status': newStatus },
            ReturnValues: 'ALL_NEW'
        };
        
        await dynamoDB.update(updateParams).promise();
        
        // Update local data
        customer.status = newStatus ? 'active' : 'inactive';
        customer.isActive = newStatus;
        
        // Update filtered customers
        const filteredIndex = filteredCustomers.findIndex(c => c.id === customerId);
        if (filteredIndex >= 0) {
            filteredCustomers[filteredIndex] = { ...customer };
        }
        
        // Re-render table
        renderCustomersTable();
        updateStatCards();
        
        console.log(`Customer ${customerId} status toggled to: ${newStatus ? 'active' : 'inactive'}`);
        
    } catch (error) {
        console.error('Error toggling customer status:', error);
        alert('Failed to update customer status. Please try again.');
    }
}

// Export customers data
function exportCustomers() {
    try {
        if (customers.length === 0) {
            alert('No customer data to export');
            return;
        }

        // Prepare CSV data
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Total Orders', 'Total Spent', 'Last Order', 'Segment', 'Join Date'];
        
        const csvData = [
            headers.join(','),
            ...customers.map(customer => [
                customer.id,
                `"${customer.name}"`,
                customer.email,
                customer.phone,
                customer.status,
                customer.totalOrders,
                customer.totalSpent.toFixed(2),
                customer.lastOrder,
                customer.segment,
                formatDate(customer.joinDate)
            ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `customers-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Customer data exported successfully');
        
    } catch (error) {
        console.error('Error exporting customer data:', error);
        alert('Failed to export customer data. Please try again.');
    }
}

// Make export function globally available
window.exportCustomers = exportCustomers;

// Initialize page when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, checking authentication...');
    
    // Check authentication using centralized utility
    if (!Auth.requireAuthentication()) {
        return;
    }
    
    console.log('Authentication valid, initializing customers page...');
    
    try {
        // Initialize AWS utilities
        await AWSUtils.initialize();
        
        // Initialize customers page
        await initializeCustomersPage();
    } catch (error) {
        console.error('Failed to initialize customers page:', error);
    }
});

console.log('Customers management script loaded');

// Merchants Management JavaScript

// Merchant management variables
let merchants = [];
let filteredMerchants = [];
let currentMerchantPage = 1;
const ITEMS_PER_MERCHANT_PAGE = 10;

// Initialize merchants page
async function initializeMerchantsPage() {
    console.log('Initializing merchants page...');

    try {
        // Load merchants data from DynamoDB
        console.log('About to load merchants data...');
        await loadMerchantsData();
        console.log('Merchants data loaded successfully');

        // Setup event listeners
        setupMerchantEventListeners();

        // Render page
        renderMerchantsTable();
        updateMerchantPagination();

        console.log('Merchants page initialization complete');
    } catch (error) {
        console.error('Error initializing merchants page:', error);
        // Show error in UI
        const tbody = document.querySelector('#merchantsTable tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: red;">Error loading merchants: ${error.message}</td></tr>`;
        }
    }
}

// Load merchants data from DynamoDB
async function loadMerchantsData() {
    try {
        console.log('Loading merchants data from DynamoDB...');

        // Use centralized AWS utilities
        const dynamoDB = await AWSUtils.getDynamoDBClient();

        console.log('Scanning WizzUser_merchants_dev table...');

        const params = {
            TableName: 'WizzUser_merchants_dev'
        };

        const result = await dynamoDB.scan(params).promise();
        console.log('✅ DynamoDB scan successful! Result:', result);
        console.log('📊 Items returned:', result.Items ? result.Items.length : 0);

        if (!result.Items || result.Items.length === 0) {
            console.warn('No merchants found in DynamoDB table');
            merchants = [];
            filteredMerchants = [];
            return;
        }

        console.log(`🎉 Successfully found ${result.Items.length} merchants in DynamoDB!`);

        // Map your real DynamoDB merchants to the merchants management UI format
        merchants = result.Items.map((merchant, index) => {
            console.log(`Processing merchant ${index + 1}:`, merchant);

            const mappedMerchant = {
                id: merchant.businessId,
                name: merchant.name || 'N/A',
                owner: merchant.owner || 'N/A',
                email: merchant.email || 'N/A',
                phone: merchant.phone || 'N/A',
                status: merchant.isActive ? 'active' : 'inactive',
                totalProducts: 0, // Will be populated from products table later
                totalSales: 0, // Will be populated from sales data later
                joinDate: merchant.createdAt,
                avatar: `https://i.pravatar.cc/40?u=${merchant.businessId}`,
                isActive: merchant.isActive,
                // Additional fields from your DynamoDB table
                category: merchant.category,
                subcategory: merchant.subcategory,
                address: merchant.address,
                website: merchant.website,
                socialLinks: merchant.socialLinks || {}
            };

            console.log(`✅ Mapped merchant ${index + 1} for UI:`, mappedMerchant);
            return mappedMerchant;
        });

        filteredMerchants = [...merchants];
        console.log('🎯 Final merchants array ready for UI:', merchants);
        console.log(`📈 Total merchants mapped: ${merchants.length}`);

    } catch (error) {
        console.error('❌ Error loading merchants data:', error);
        console.error('Error details:', error.code, error.message);

        // Display error in UI and re-throw
        merchants = [];
        filteredMerchants = [];
        throw new Error(`Failed to load merchants: ${error.message}`);
    }
}

// Setup event listeners for merchants
function setupMerchantEventListeners() {
    // Search functionality
    const merchantSearchInput = document.getElementById('merchantSearchInput');
    if (merchantSearchInput) {
        merchantSearchInput.addEventListener('input', handleMerchantSearch);
    }

    // Filter functionality
    const merchantStatusFilter = document.getElementById('merchantStatusFilter');
    const merchantCategoryFilter = document.getElementById('merchantCategoryFilter');

    if (merchantStatusFilter) {
        merchantStatusFilter.addEventListener('change', handleMerchantFilter);
    }

    if (merchantCategoryFilter) {
        merchantCategoryFilter.addEventListener('change', handleMerchantFilter);
    }

    // Pagination
    const merchantPrevBtn = document.getElementById('merchantPrevBtn');
    const merchantNextBtn = document.getElementById('merchantNextBtn');

    if (merchantPrevBtn) {
        merchantPrevBtn.addEventListener('click', () => {
            if (currentMerchantPage > 1) {
                currentMerchantPage--;
                renderMerchantsTable();
                updateMerchantPagination();
            }
        });
    }

    if (merchantNextBtn) {
        merchantNextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredMerchants.length / ITEMS_PER_MERCHANT_PAGE);
            if (currentMerchantPage < totalPages) {
                currentMerchantPage++;
                renderMerchantsTable();
                updateMerchantPagination();
            }
        });
    }
}

// Handle search functionality for merchants
function handleMerchantSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();

    if (searchTerm === '') {
        filteredMerchants = [...merchants];
    } else {
        filteredMerchants = merchants.filter(merchant =>
            merchant.name.toLowerCase().includes(searchTerm) ||
            merchant.email.toLowerCase().includes(searchTerm) ||
            merchant.phone.includes(searchTerm)
        );
    }

    currentMerchantPage = 1;
    renderMerchantsTable();
    updateMerchantPagination();
}

// Handle filter functionality for merchants
function handleMerchantFilter() {
    const merchantStatusFilter = document.getElementById('merchantStatusFilter')?.value || '';
    const merchantCategoryFilter = document.getElementById('merchantCategoryFilter')?.value || '';

    filteredMerchants = merchants.filter(merchant => {
        const matchesStatus = !merchantStatusFilter || merchant.status === merchantStatusFilter;
        const matchesCategory = !merchantCategoryFilter || merchant.category === merchantCategoryFilter;
        return matchesStatus && matchesCategory;
    });

    currentMerchantPage = 1;
    renderMerchantsTable();
    updateMerchantPagination();
}

// Render merchants table
function renderMerchantsTable() {
    const tbody = document.getElementById('merchantsTableBody');
    if (!tbody) return;

    const startIndex = (currentMerchantPage - 1) * ITEMS_PER_MERCHANT_PAGE;
    const endIndex = startIndex + ITEMS_PER_MERCHANT_PAGE;
    const pageMerchants = filteredMerchants.slice(startIndex, endIndex);

    if (pageMerchants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center" style="padding: 2rem; color: #666;">
                    <i class="fas fa-store" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <br>
                    No merchants found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageMerchants.map(merchant => `
        <tr>
            <td>
                <div class="merchant-info">
                    <img src="${merchant.avatar}" alt="${merchant.name}" class="merchant-avatar">
                    <div>
                        <div class="merchant-name">${merchant.name}</div>
                        <div class="merchant-id">ID: ${merchant.id}</div>
                    </div>
                </div>
            </td>
            <td>${merchant.owner}</td>
            <td>${merchant.email}</td>
            <td>${merchant.phone}</td>
            <td>
                <span class="status-badge ${merchant.status}">
                    ${merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
                </span>
            </td>
            <td>${merchant.totalProducts}</td>
            <td>$${merchant.totalSales.toFixed(2)}</td>
            <td>${formatDate(merchant.joinDate)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewMerchant('${merchant.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editMerchant('${merchant.id}')" title="Edit Merchant">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn toggle" onclick="toggleMerchantStatus('${merchant.id}')" title="Toggle Status">
                        <i class="fas fa-toggle-${merchant.status === 'active' ? 'on' : 'off'}"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update pagination for merchants
function updateMerchantPagination() {
    const totalPages = Math.ceil(filteredMerchants.length / ITEMS_PER_MERCHANT_PAGE);
    const merchantPaginationInfo = document.getElementById('merchantPaginationInfo');
    const merchantPrevBtn = document.getElementById('merchantPrevBtn');
    const merchantNextBtn = document.getElementById('merchantNextBtn');

    if (merchantPaginationInfo) {
        const startIndex = (currentMerchantPage - 1) * ITEMS_PER_MERCHANT_PAGE + 1;
        const endIndex = Math.min(currentMerchantPage * ITEMS_PER_MERCHANT_PAGE, filteredMerchants.length);
        merchantPaginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${filteredMerchants.length} merchants`;
    }

    if (merchantPrevBtn) {
        merchantPrevBtn.disabled = currentMerchantPage === 1;
    }

    if (merchantNextBtn) {
        merchantNextBtn.disabled = currentMerchantPage >= totalPages;
    }
}

// Merchant action functions
function viewMerchant(merchantId) {
    const merchant = merchants.find(m => m.id === merchantId);
    if (merchant) {
        alert(`Merchant Details:\n\nName: ${merchant.name}\nOwner: ${merchant.owner}\nEmail: ${merchant.email}\nPhone: ${merchant.phone}\nStatus: ${merchant.status}\nTotal Products: ${merchant.totalProducts}\nTotal Sales: $${merchant.totalSales.toFixed(2)}`);
    }
}

function editMerchant(merchantId) {
    // TODO: Implement edit merchant functionality
    alert(`Edit merchant functionality not yet implemented for merchant ID: ${merchantId}`);
}

async function toggleMerchantStatus(merchantId) {
    try {
        const merchant = merchants.find(m => m.id === merchantId);
        if (!merchant) return;

        const newStatus = !merchant.isActive;

        // Update status in DynamoDB using direct access
        const dynamoDB = new AWS.DynamoDB.DocumentClient();

        const updateParams = {
            TableName: 'WizzUser_merchants_dev',
            Key: { businessId: merchantId },
            UpdateExpression: 'SET isActive = :status',
            ExpressionAttributeValues: { ':status': newStatus },
            ReturnValues: 'ALL_NEW'
        };

        await dynamoDB.update(updateParams).promise();

        // Update local data
        merchant.status = newStatus ? 'active' : 'inactive';
        merchant.isActive = newStatus;

        // Update filtered merchants
        const filteredIndex = filteredMerchants.findIndex(m => m.id === merchantId);
        if (filteredIndex >= 0) {
            filteredMerchants[filteredIndex] = { ...merchant };
        }

        // Re-render table
        renderMerchantsTable();

        console.log(`Merchant ${merchantId} status toggled to: ${newStatus ? 'active' : 'inactive'}`);

    } catch (error) {
        console.error('Error toggling merchant status:', error);
        alert('Failed to update merchant status. Please try again.');
    }
}

// Make merchants management functions globally available
window.initializeMerchantsPage = initializeMerchantsPage;
window.viewMerchant = viewMerchant;
window.editMerchant = editMerchant;
window.toggleMerchantStatus = toggleMerchantStatus;

// Automatically initialize merchants page on load
document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOM loaded, initializing merchants page...');
    await initializeMerchantsPage();
});

console.log('Merchants management script loaded');

// API Handlers (for serverless functions)

// Import utilities
const { sendResponse } = require('../utils/response');

const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE;
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

/**
 * @description Get all merchants for the customer app
 * @param {*} event 
 * @returns {object}
 */
module.exports.listMerchants = async (event) => {
    try {
        const params = {
            TableName: MERCHANTS_TABLE,
            FilterExpression: 'isPublished = :isPublished',
            ExpressionAttributeValues: {
                ':isPublished': true
            }
        };
        const result = await dynamoDb.scan(params).promise();
        return sendResponse(200, { merchants: result.Items });
    } catch (error) {
        console.error('Error getting merchants:', error);
        return sendResponse(500, { message: 'Could not get merchants.', error: error.message });
    }
};

/**
 * @description Get a single merchant by ID for the customer app
 * @param {*} event 
 * @returns {object}
 */
module.exports.getMerchantDetails = async (event) => {
    try {
        const { businessId } = event.pathParameters;
        const params = {
            TableName: MERCHANTS_TABLE,
            Key: {
                businessId: businessId
            }
        };
        const result = await dynamoDb.get(params).promise();
        if (result.Item && result.Item.isPublished) {
            return sendResponse(200, { merchant: result.Item });
        } else {
            return sendResponse(404, { message: 'Merchant not found or not available.' });
        }
    } catch (error) {
        console.error('Error getting merchant by ID:', error);
        return sendResponse(500, { message: 'Could not get merchant.', error: error.message });
    }
};

/**
 * @description Get all products for a specific merchant for the customer app
 * @param {*} event 
 * @returns {object}
 */
module.exports.getMerchantProducts = async (event) => {
    try {
        const { businessId } = event.pathParameters;
        const params = {
            TableName: PRODUCTS_TABLE,
            IndexName: 'businessId-index',
            KeyConditionExpression: 'businessId = :businessId',
            ExpressionAttributeValues: {
                ':businessId': businessId
            }
        };
        const result = await dynamoDb.query(params).promise();
        return sendResponse(200, { products: result.Items });
    } catch (error) {
        console.error('Error getting products by merchant:', error);
        return sendResponse(500, { message: 'Could not get products.', error: error.message });
    }
};