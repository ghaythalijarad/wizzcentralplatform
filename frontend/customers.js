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

            // Handle phone number display - combine countryCode if available
            let phoneDisplay = 'N/A';
            if (user.countryCode && user.countryCode !== 'N/A') {
                phoneDisplay = user.countryCode;
            } else if (user.phone || user.phoneNumber || user.mobile) {
                phoneDisplay = user.phone || user.phoneNumber || user.mobile;
            }

            // Determine customer segment based on activity and profile completeness
            let segment = 'new';
            if (user.lastLoginAt && user.name && user.email) {
                const lastLogin = new Date(user.lastLoginAt);
                const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

                if (daysSinceLogin < 7) {
                    segment = 'vip'; // Active recent users
                } else if (daysSinceLogin < 30) {
                    segment = 'regular'; // Regular users
                } else {
                    segment = 'inactive'; // Inactive users
                }
            }

            const customer = {
                id: user.userId,
                name: user.name || 'Unknown User',
                email: user.email || 'N/A',
                phone: phoneDisplay,
                status: user.isActive ? 'active' : 'inactive',
                totalOrders: 0, // Will be populated from orders table if available
                totalSpent: 0,  // Will be populated from orders table if available
                lastOrder: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never',
                segment: segment,
                joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=40&background=4f46e5&color=fff`,
                isActive: !!user.isActive,

                // Additional real data fields
                cognitoUsername: user.cognitoUsername || 'N/A',
                countryCode: user.countryCode || 'N/A',
                gender: user.gender || 'N/A',
                birthDate: user.birth_date || 'N/A',
                preferredLanguage: user.preferredLanguage || 'en',
                marketingConsent: user.marketingConsent || user.marketing_consent || false,
                newsletterSubscription: user.newsletter_subscription || false,
                privacyAccepted: user.privacyAccepted || false,
                termsAccepted: user.termsAccepted || false,
                addresses: user.addresses || [],
                paymentMethods: user.paymentMethods || [],
                createdAt: user.createdAt,
                updatedAt: user.updatedAt || user.updated_at,
                lastLoginAt: user.lastLoginAt
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
    if (!customer) return;

    // Create detailed customer info modal
    const modalHtml = `
        <div class="modal-overlay" id="customerModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div class="modal-content" style="background: white; border-radius: 8px; padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: #2c3e50;">Customer Details</h2>
                    <button onclick="closeCustomerModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                
                <div class="customer-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="detail-group">
                        <h3 style="color: #34495e; margin-bottom: 0.5rem;">Basic Information</h3>
                        <p><strong>Name:</strong> ${customer.name}</p>
                        <p><strong>Email:</strong> ${customer.email}</p>
                        <p><strong>Phone:</strong> ${customer.phone}</p>
                        <p><strong>Gender:</strong> ${customer.gender}</p>
                        <p><strong>Birth Date:</strong> ${customer.birthDate}</p>
                        <p><strong>Country Code:</strong> ${customer.countryCode}</p>
                    </div>
                    
                    <div class="detail-group">
                        <h3 style="color: #34495e; margin-bottom: 0.5rem;">Account Status</h3>
                        <p><strong>Status:</strong> <span class="status-badge ${customer.status}">${customer.status}</span></p>
                        <p><strong>Segment:</strong> <span class="segment-badge ${customer.segment}">${customer.segment.toUpperCase()}</span></p>
                        <p><strong>Preferred Language:</strong> ${customer.preferredLanguage}</p>
                        <p><strong>Join Date:</strong> ${customer.joinDate}</p>
                        <p><strong>Last Login:</strong> ${customer.lastLoginAt ? new Date(customer.lastLoginAt).toLocaleDateString() : 'Never'}</p>
                    </div>
                    
                    <div class="detail-group">
                        <h3 style="color: #34495e; margin-bottom: 0.5rem;">Preferences & Consent</h3>
                        <p><strong>Marketing Consent:</strong> ${customer.marketingConsent ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>Newsletter:</strong> ${customer.newsletterSubscription ? '✅ Subscribed' : '❌ Not subscribed'}</p>
                        <p><strong>Privacy Accepted:</strong> ${customer.privacyAccepted ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>Terms Accepted:</strong> ${customer.termsAccepted ? '✅ Yes' : '❌ No'}</p>
                    </div>
                    
                    <div class="detail-group">
                        <h3 style="color: #34495e; margin-bottom: 0.5rem;">Activity & Orders</h3>
                        <p><strong>Total Orders:</strong> ${customer.totalOrders}</p>
                        <p><strong>Total Spent:</strong> $${customer.totalSpent.toFixed(2)}</p>
                        <p><strong>Addresses:</strong> ${customer.addresses.length} saved</p>
                        <p><strong>Payment Methods:</strong> ${customer.paymentMethods.length} saved</p>
                    </div>
                </div>
                
                <div class="modal-actions" style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                    <button onclick="editCustomer('${customer.id}')" class="btn-primary" style="padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-edit"></i> Edit Customer
                    </button>
                    <button onclick="closeCustomerModal()" class="btn-secondary" style="padding: 0.5rem 1rem; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeCustomerModal() {
    const modal = document.getElementById('customerModal');
    if (modal) {
        modal.remove();
    }
}

function editCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        alert(`Edit functionality for ${customer.name} would open here. Customer ID: ${customerId}`);
    }
}

async function toggleCustomerStatus(customerId) {
    try {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const newStatus = !customer.isActive;

        // Update status in DynamoDB using centralized AWS utilities (ensures proper credentials)
        const dynamoDB = await AWSUtils.getDynamoDBClient();

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
document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOM loaded, checking authentication...');

    const debugMode = sessionStorage.getItem('debugMode') === 'true';

    // Ensure Auth utility is loaded
    if (typeof Auth === 'undefined') {
        console.error('❌ Auth utility not loaded! Checking script loading...');
        console.log('Available global objects:', Object.keys(window));
        return;
    }

    console.log('✅ Auth utility loaded, proceeding with authentication check...');

    // Check authentication using centralized utility (allow bypass in debug mode)
    if (!debugMode && !Auth.requireAuthentication()) {
        return;
    }
    if (debugMode) {
        console.warn('🧪 Debug mode enabled: skipping strict authentication for customers page');
    }

    console.log('Authentication valid (or bypassed for debug), initializing customers page...');

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

