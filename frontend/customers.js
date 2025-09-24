// Customers Management JavaScript

// Customer management variables
let customers = [];
let filteredCustomers = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

// Points system configuration
const POINTS_CONFIG = {
    POINTS_PER_1000_IQD: 100,
    IQD_THRESHOLD: 1000
};

// Calculate points earned from total spent amount
function calculateCustomerPoints(totalSpentIQD) {
    if (!totalSpentIQD || totalSpentIQD <= 0) {
        return 0;
    }
    
    // Calculate points: 100 points for every 1000 IQD spent
    const pointsEarned = Math.floor(totalSpentIQD / POINTS_CONFIG.IQD_THRESHOLD) * POINTS_CONFIG.POINTS_PER_1000_IQD;
    return pointsEarned;
}

// Load customer order data and calculate points
async function loadCustomerOrderData(customerId) {
    try {
        console.log(`📊 Loading real points data for customer: ${customerId}`);
        
        // Use the CustomerPointsService to get real data from backend API
        const pointsData = await CustomerPointsService.getCustomerPoints(customerId);
        
        if (pointsData && pointsData.success) {
            const dataSource = pointsData.dataSource || 'real-api';
            
            if (dataSource === 'real-api-attempted') {
                console.log(`🔄 Real API attempted for ${customerId} but AWS not configured - showing zeros instead of mock data`);
            } else {
                console.log(`✅ Real points data loaded for ${customerId}:`, pointsData);
            }
            
            return {
                totalSpent: pointsData.totalSpentIQD || 0, // Use real spending data
                totalOrders: pointsData.totalOrders || 0, // Use real order count
                points: pointsData.pointsEarned || 0,     // Use real points earned
                vipStatus: pointsData.vipStatus || false, // VIP status based on real spending
                tierLevel: pointsData.tierLevel || 'regular', // Tier based on real spending
                dataSource: dataSource, // Track data source for debugging
                note: pointsData.note // Include any notes about data source
            };
        } else {
            console.warn(`⚠️ Failed to load real points data for ${customerId}:`, pointsData?.error || 'Unknown error');
            
            // Return zero values instead of mock data to indicate no real data available
            return {
                totalSpent: 0,
                totalOrders: 0,
                points: 0,
                vipStatus: false,
                tierLevel: 'regular',
                dataSource: 'api-failed'
            };
        }
        
    } catch (error) {
        console.error('Error loading customer order data:', error);
        
        // Return zero values instead of mock data when there's an error
        return {
            totalSpent: 0,
            totalOrders: 0,
            points: 0,
            vipStatus: false,
            tierLevel: 'regular',
            dataSource: 'error'
        };
    }
}

// Load order data and calculate points for all customers
async function loadOrderDataForCustomers() {
    try {
        console.log('Loading order data for customers to calculate points...');
        
        // Process customers in parallel for better performance
        const customerPromises = customers.map(async (customer) => {
            const orderData = await loadCustomerOrderData(customer.id);
            
            // Update customer with order data and points
            customer.totalSpent = orderData.totalSpent;
            customer.totalOrders = orderData.totalOrders;
            customer.points = orderData.points;
            customer.vipStatus = orderData.vipStatus;
            customer.tierLevel = orderData.tierLevel;
            
            // Update segment based on actual spending and VIP status
            if (orderData.vipStatus) {
                customer.segment = 'vip';
            } else {
                customer.segment = determineCustomerSegment(customer.totalSpent, customer.totalOrders);
            }
            
            return customer;
        });
        
        await Promise.all(customerPromises);
        console.log('✅ Order data loaded and points calculated for all customers');
        
        // Update data source banner
        updateDataSourceBanner();
        
    } catch (error) {
        console.error('❌ Error loading order data for customers:', error);
        // Continue with default values if order data fails to load
        updateDataSourceBanner(); // Update banner even on error
    }
}

// Update data source banner based on customer data sources
function updateDataSourceBanner() {
    const banner = document.getElementById('dataSourceBanner');
    const message = document.getElementById('dataSourceMessage');
    
    if (!banner || !message) return;
    
    // Analyze data sources from customers
    const dataSources = customers.map(c => c.dataSource).filter(Boolean);
    const realApiCount = dataSources.filter(ds => ds === 'real-api').length;
    const realApiAttemptedCount = dataSources.filter(ds => ds === 'real-api-attempted').length;
    const apiFailedCount = dataSources.filter(ds => ds === 'api-failed' || ds === 'error').length;
    
    let bannerType = 'info';
    let messageText = '';
    let iconClass = 'fas fa-info-circle';
    let bannerColor = '#e3f2fd';
    
    if (realApiCount > 0) {
        // Some real data available
        bannerType = 'success';
        messageText = `✅ Successfully loading real customer order data from database (${realApiCount}/${customers.length} customers). No more mock data!`;
        iconClass = 'fas fa-check-circle';
        bannerColor = '#e8f5e8';
    } else if (realApiAttemptedCount > 0) {
        // API attempted but AWS not configured
        bannerType = 'warning';
        messageText = `⚠️ Real API configured but AWS credentials pending (${realApiAttemptedCount}/${customers.length} customers). Showing zeros instead of mock data until AWS is configured.`;
        iconClass = 'fas fa-exclamation-triangle';
        bannerColor = '#fff3e0';
    } else if (apiFailedCount > 0) {
        // API completely failed
        bannerType = 'error';
        messageText = `❌ Unable to connect to real data API (${apiFailedCount}/${customers.length} customers). Showing zeros instead of mock data.`;
        iconClass = 'fas fa-exclamation-circle';
        bannerColor = '#ffebee';
    } else {
        // Default informational message
        messageText = '🔄 System configured to fetch real customer order data from database instead of using mock data.';
    }
    
    // Update banner appearance
    banner.style.background = `linear-gradient(135deg, ${bannerColor}, #f3e5f5)`;
    banner.querySelector('i').className = iconClass;
    message.textContent = messageText;
    
    // Show the banner
    banner.style.display = 'block';
    
    console.log(`📊 Data source summary: Real=${realApiCount}, Attempted=${realApiAttemptedCount}, Failed=${apiFailedCount}`);
}

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
        updateDataSourceBanner();

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
                points: 0, // Will be calculated based on totalSpent
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

        // Load order data and calculate points for all customers
        await loadOrderDataForCustomers();

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
            <td>
                <div class="contact-info">
                    <div>${customer.email}</div>
                    <small style="color: #666;">${customer.phone}</small>
                </div>
            </td>
            <td>
                <span class="status-badge ${customer.status}">
                    ${customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                </span>
            </td>
            <td>
                <div class="points-display">
                    <span class="points-value">${customer.totalOrders}</span>
                    ${customer.dataSource === 'real-api-attempted' ? '<small style="color: #ff9800; display: block;">Real API (AWS pending)</small>' : ''}
                    ${customer.dataSource === 'real-api' ? '<small style="color: #4caf50; display: block;">Real data</small>' : ''}
                    ${customer.dataSource === 'api-failed' || customer.dataSource === 'error' ? '<small style="color: #f44336; display: block;">API unavailable</small>' : ''}
                </div>
            </td>
            <td>
                <div class="points-display">
                    <span class="points-value">${customer.totalSpent.toLocaleString()} IQD</span>
                    ${customer.dataSource === 'real-api-attempted' ? '<small style="color: #ff9800; display: block;">Real API (AWS pending)</small>' : ''}
                    ${customer.dataSource === 'real-api' ? '<small style="color: #4caf50; display: block;">Real data</small>' : ''}
                    ${customer.dataSource === 'api-failed' || customer.dataSource === 'error' ? '<small style="color: #f44336; display: block;">API unavailable</small>' : ''}
                </div>
            </td>
            <td>
                <div class="points-display">
                    <span class="points-value">${customer.points.toLocaleString()}</span>
                    <small style="color: #666; display: block;">points</small>
                    ${customer.vipStatus ? '<div class="vip-badge" style="background: gold; color: black; padding: 2px 6px; border-radius: 12px; font-size: 0.7rem; margin-top: 2px;">VIP</div>' : ''}
                    ${customer.tierLevel && customer.tierLevel !== 'regular' ? `<div class="tier-badge" style="background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 12px; font-size: 0.7rem; margin-top: 2px;">${customer.tierLevel.toUpperCase()}</div>` : ''}
                </div>
            </td>
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
    const totalCustomersEl = document.getElementById('totalCustomers');
    const activeCustomersEl = document.getElementById('activeCustomers');
    const vipCustomersEl = document.getElementById('vipCustomers');
    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalPointsEarnedEl = document.getElementById('totalPointsEarned');

    if (totalCustomersEl) {
        totalCustomersEl.textContent = customers.length.toString();
    }

    if (activeCustomersEl) {
        const activeCount = customers.filter(c => c.status === 'active').length;
        activeCustomersEl.textContent = activeCount.toString();
    }

    if (vipCustomersEl) {
        const vipCount = customers.filter(c => c.segment === 'vip').length;
        vipCustomersEl.textContent = vipCount.toString();
    }

    if (totalRevenueEl) {
        const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
        totalRevenueEl.textContent = `${totalRevenue.toLocaleString()} IQD`;
    }

    if (totalPointsEarnedEl) {
        const totalPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);
        totalPointsEarnedEl.textContent = totalPoints.toLocaleString();
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
                        <p><strong>Total Spent:</strong> ${customer.totalSpent.toLocaleString()} IQD</p>
                        <p><strong>Addresses:</strong> ${customer.addresses.length} saved</p>
                        <p><strong>Payment Methods:</strong> ${customer.paymentMethods.length} saved</p>
                    </div>
                    
                    <div class="detail-group">
                        <h3 style="color: #34495e; margin-bottom: 0.5rem;">Points & Rewards</h3>
                        <p><strong>Total Points:</strong> <span style="color: #e74c3c; font-weight: bold;">${customer.points.toLocaleString()}</span></p>
                        <p><strong>VIP Status:</strong> ${customer.vipStatus ? '⭐ VIP Member' : '👤 Regular'}</p>
                        <p><strong>Tier Level:</strong> <span style="color: #f39c12;">${customer.tierLevel ? customer.tierLevel.toUpperCase() : 'REGULAR'}</span></p>
                        <div style="margin-top: 0.5rem;">
                            <button onclick="viewCustomerPointsHistory('${customer.id}')" style="background: #3498db; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 4px; cursor: pointer; margin-right: 0.5rem;">
                                <i class="fas fa-history"></i> Points History
                            </button>
                            <button onclick="showRedeemPointsModal('${customer.id}')" style="background: #e74c3c; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-gift"></i> Redeem Points
                            </button>
                        </div>
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

// Refresh customer points data
async function refreshCustomerPoints() {
    try {
        console.log('🔄 Refreshing customer points data...');
        
        // Show loading indicator
        const totalPointsEl = document.getElementById('totalPointsEarned');
        if (totalPointsEl) {
            totalPointsEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        
        // Get system statistics to verify service is working
        const stats = await CustomerPointsService.getSystemStatistics();
        if (stats && stats.success) {
            console.log('📊 Points system statistics:', stats);
        }
        
        // Reload order data for all customers using new service
        await loadOrderDataForCustomers();
        
        // Update UI
        renderCustomersTable();
        updateStatCards();
        updatePagination();
        updateDataSourceBanner();
        
        console.log('✅ Customer points data refreshed successfully');
        
        // Show success message
        showMessage('Customer points data refreshed successfully', 'success');
        
    } catch (error) {
        console.error('❌ Error refreshing customer points:', error);
        showMessage('Failed to refresh customer points data', 'error');
    }
}

// Show message helper function
function showMessage(message, type = 'info') {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#00c2e8'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation keyframes
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Customer points management functions
async function viewCustomerPointsHistory(customerId) {
    try {
        console.log(`📊 Loading points history for customer: ${customerId}`);
        
        // Get points transaction history
        const history = await CustomerPointsService.getPointsHistory(customerId);
        
        if (history && history.success) {
            const transactions = history.transactions || [];
            
            // Create points history modal
            const historyHtml = `
                <div class="modal-overlay" id="pointsHistoryModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1001; display: flex; align-items: center; justify-content: center;">
                    <div class="modal-content" style="background: white; border-radius: 8px; padding: 2rem; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <h2 style="margin: 0; color: #2c3e50;">Points Transaction History</h2>
                            <button onclick="closePointsHistoryModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                        </div>
                        
                        <div class="points-summary" style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; text-align: center;">
                                <div>
                                    <div style="font-size: 1.5rem; font-weight: bold; color: #27ae60;">${history.totalPoints || 0}</div>
                                    <div style="color: #666; font-size: 0.9rem;">Total Points</div>
                                </div>
                                <div>
                                    <div style="font-size: 1.5rem; font-weight: bold; color: #3498db;">${history.lifetimePointsEarned || 0}</div>
                                    <div style="color: #666; font-size: 0.9rem;">Lifetime Earned</div>
                                </div>
                                <div>
                                    <div style="font-size: 1.5rem; font-weight: bold; color: #e74c3c;">${history.lifetimePointsRedeemed || 0}</div>
                                    <div style="color: #666; font-size: 0.9rem;">Lifetime Redeemed</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="transactions-list">
                            ${transactions.length > 0 ? `
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr style="background: #f1f2f6;">
                                            <th style="padding: 0.8rem; text-align: left; border-bottom: 1px solid #ddd;">Date</th>
                                            <th style="padding: 0.8rem; text-align: left; border-bottom: 1px solid #ddd;">Type</th>
                                            <th style="padding: 0.8rem; text-align: right; border-bottom: 1px solid #ddd;">Points</th>
                                            <th style="padding: 0.8rem; text-align: left; border-bottom: 1px solid #ddd;">Order</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${transactions.map(transaction => `
                                            <tr>
                                                <td style="padding: 0.8rem; border-bottom: 1px solid #eee;">${new Date(transaction.timestamp).toLocaleDateString()}</td>
                                                <td style="padding: 0.8rem; border-bottom: 1px solid #eee;">
                                                    <span style="background: ${transaction.transactionType === 'earned' ? '#e8f5e8' : '#ffeaea'}; color: ${transaction.transactionType === 'earned' ? '#27ae60' : '#e74c3c'}; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">
                                                        ${transaction.transactionType === 'earned' ? '+ Earned' : '- Redeemed'}
                                                    </span>
                                                </td>
                                                <td style="padding: 0.8rem; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: ${transaction.transactionType === 'earned' ? '#27ae60' : '#e74c3c'};">
                                                    ${transaction.transactionType === 'earned' ? '+' : '-'}${Math.abs(transaction.pointsAmount)}
                                                </td>
                                                <td style="padding: 0.8rem; border-bottom: 1px solid #eee;">${transaction.orderId || 'N/A'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : `
                                <div style="text-align: center; padding: 2rem; color: #666;">
                                    <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                                    <br>
                                    No transaction history found
                                </div>
                            `}
                        </div>
                        
                        <div style="margin-top: 1.5rem; text-align: right;">
                            <button onclick="closePointsHistoryModal()" style="background: #95a5a6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', historyHtml);
        } else {
            alert('Failed to load points history');
        }
        
    } catch (error) {
        console.error('Error loading points history:', error);
        alert('Failed to load points history');
    }
}

function closePointsHistoryModal() {
    const modal = document.getElementById('pointsHistoryModal');
    if (modal) {
        modal.remove();
    }
}

async function showRedeemPointsModal(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // Create redeem points modal
    const redeemHtml = `
        <div class="modal-overlay" id="redeemPointsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1001; display: flex; align-items: center; justify-content: center;">
            <div class="modal-content" style="background: white; border-radius: 8px; padding: 2rem; max-width: 500px; width: 90%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: #2c3e50;">Redeem Points</h2>
                    <button onclick="closeRedeemPointsModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                
                <div class="customer-info" style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                    <div><strong>Customer:</strong> ${customer.name}</div>
                    <div><strong>Available Points:</strong> <span style="color: #e74c3c; font-weight: bold;">${customer.points.toLocaleString()}</span></div>
                    <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">1 point = 1 IQD discount</div>
                </div>
                
                <div class="redeem-form">
                    <div style="margin-bottom: 

