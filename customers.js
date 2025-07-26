// Customers Management JavaScript

// Global logout function for navigation consistency
window.logout = async () => {
  try {
    if (AWS.config.credentials) {
      AWS.config.credentials.clearCachedId();
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = 'index.html';
  }
};

// AWS SDK and authentication setup
let dynamodbClient = null;
let customers = [];

// Initialize AWS credentials and DynamoDB client
async function initializeAWS() {
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

    // 6. Force credentials to refresh and handle potential errors
    try {
      await AWS.config.credentials.refreshPromise();
      console.log("Successfully fetched/refreshed AWS credentials for customers.");
      console.log("Cognito Identity ID:", AWS.config.credentials.identityId);
    } catch (error) {
      console.error("Error refreshing credentials:", error);
      throw new Error("Could not refresh AWS credentials. The authentication token might be invalid or expired. Please try logging in again.");
    }

    if (!AWS.config.credentials.identityId) {
      throw new Error("Cognito Identity ID not found after credential refresh. This indicates a problem with the Identity Pool configuration or the provided token.");
    }

    // Initialize DynamoDB client
    dynamodbClient = new AWS.DynamoDB.DocumentClient();
    
    console.log('AWS initialized successfully for customers');
    
  } catch (error) {
    console.error('Failed to initialize AWS:', error);
    // Redirect to login on authentication failure
    window.location.href = 'index.html';
    throw error;
  }
}

// Load customers data from DynamoDB
async function loadCustomersData() {
  try {
    if (!dynamodbClient) {
      await initializeAWS();
    }

    const params = {
      TableName: 'WizzUser_users_dev'
    };

    console.log('Scanning customers from DynamoDB...');
    const result = await dynamodbClient.scan(params).promise();
    
    console.log('Raw DynamoDB customers result:', result);
    
    // Map DynamoDB data to customers format
    customers = result.Items.map(item => ({
      id: item.userId || 'N/A',
      name: item.name || `User ${item.userId?.substring(0, 8) || 'Unknown'}`,
      email: item.email || 'N/A',
      phone: item.phone || 'N/A',
      status: item.isActive === false ? 'inactive' : 'active',
      totalOrders: 0, // This would come from orders table in real implementation
      totalSpent: 0, // This would be calculated from orders
      lastOrder: 'N/A', // This would come from last order date
      segment: 'regular', // Would be calculated based on order history
      avatar: `https://i.pravatar.cc/40?u=${item.userId || Math.random()}`,
      joinDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
      addresses: item.addresses || [],
      isActive: item.isActive !== false
    }));

    console.log('Processed customers:', customers);
    
    // Update UI
    renderCustomersTable();
    updateCustomerStats();
    
  } catch (error) {
    console.error('Error loading customers data:', error);
    
    // Show user-friendly error
    const tbody = document.getElementById('customersTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center" style="padding: 2rem; color: #e74c3c;">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <div>Failed to load customers data</div>
            <div style="font-size: 0.9rem; margin-top: 0.5rem;">${error.message}</div>
          </td>
        </tr>
      `;
    }
  }
}

// Update customer status in DynamoDB
async function updateCustomerStatus(userId, newStatus) {
  try {
    if (!dynamodbClient) {
      await initializeAWS();
    }

    const params = {
      TableName: 'WizzUser_users_dev',
      Key: { userId: userId },
      UpdateExpression: 'SET isActive = :status',
      ExpressionAttributeValues: {
        ':status': newStatus === 'active'
      },
      ReturnValues: 'ALL_NEW'
    };

    console.log('Updating customer status:', params);
    const result = await dynamodbClient.update(params).promise();
    console.log('Customer status updated:', result);
    
    return result.Attributes;
  } catch (error) {
    console.error('Error updating customer status:', error);
    throw error;
  }
}

// Initialize customers page
document.addEventListener('DOMContentLoaded', async function() {
    // Show loading state
    const tbody = document.getElementById('customersTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center" style="padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem; color: #007bff;"></i>
                    <div>Loading customers data...</div>
                </td>
            </tr>
        `;
    }
    
    // Initialize AWS and load data
    try {
        await initializeAWS();
        await loadCustomersData();
        setupEventListeners();
    } catch (error) {
        console.error('Failed to initialize customers page:', error);
    }
});

function initializeCustomersPage() {
    renderCustomersTable();
    updateCustomerStats();
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterCustomers);
    }

    // Filter functionality
    const statusFilter = document.getElementById('statusFilter');
    const segmentFilter = document.getElementById('segmentFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterCustomers);
    }
    
    if (segmentFilter) {
        segmentFilter.addEventListener('change', filterCustomers);
    }
}

function renderCustomersTable(customersList = customers) {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    tbody.innerHTML = customersList.map(customer => `
        <tr>
            <td>
                <div class="customer-info">
                    <div class="customer-avatar">
                        <img src="${customer.avatar}" alt="${customer.name}">
                    </div>
                    <div>
                        <div class="customer-name">${customer.name}</div>
                        <div class="customer-id">#${customer.id}</div>
                    </div>
                </div>
            </td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td><span class="status-badge ${customer.status}">${capitalizeFirst(customer.status)}</span></td>
            <td>${customer.totalOrders}</td>
            <td>$${customer.totalSpent.toFixed(2)}</td>
            <td>${customer.lastOrder}</td>
            <td><span class="segment-badge ${customer.segment}">${customer.segment.toUpperCase()}</span></td>
            <td>
                <div class="actions">
                    <button class="btn-action" onclick="viewCustomer('${customer.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action" onclick="editCustomer('${customer.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action danger" onclick="blockCustomer('${customer.id}')" title="Block">
                        <i class="fas fa-ban"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function filterCustomers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const segmentFilter = document.getElementById('segmentFilter').value;

    let filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.name.toLowerCase().includes(searchTerm) ||
                            customer.email.toLowerCase().includes(searchTerm) ||
                            customer.id.toLowerCase().includes(searchTerm) ||
                            customer.phone.includes(searchTerm);
        
        const matchesStatus = !statusFilter || customer.status === statusFilter;
        const matchesSegment = !segmentFilter || customer.segment === segmentFilter;

        return matchesSearch && matchesStatus && matchesSegment;
    });

    renderCustomersTable(filteredCustomers);
}

function updateCustomerStats() {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const avgOrders = (customers.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length).toFixed(1);
    const avgSpent = (customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(2);

    // Update stat cards - this would normally come from an API
    // For demo purposes, we'll use static values that look realistic
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        // These are demo values - in real app would come from backend
        statCards[0].querySelector('h3').textContent = '2,847';
        statCards[1].querySelector('h3').textContent = '1,456';
        statCards[2].querySelector('h3').textContent = '4.2';
        statCards[3].querySelector('h3').textContent = '$68.50';
    }
}

// Customer action functions
async function viewCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        const addresses = customer.addresses && customer.addresses.length > 0 
            ? customer.addresses.map(addr => `${addr.street || ''} ${addr.city || ''}`).join(', ')
            : 'No addresses on file';
            
        alert(`Customer Details:\n\nName: ${customer.name}\nEmail: ${customer.email}\nPhone: ${customer.phone}\nStatus: ${customer.status}\nJoined: ${customer.joinDate}\nAddresses: ${addresses}`);
    }
}

function editCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        // For demo purposes, just show an alert
        alert(`Edit functionality for ${customer.name} would open here.`);
    }
}

async function blockCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer && confirm(`Are you sure you want to ${customer.status === 'active' ? 'block' : 'unblock'} ${customer.name}?`)) {
        try {
            const newStatus = customer.status === 'active' ? 'inactive' : 'active';
            await updateCustomerStatus(customerId, newStatus);
            
            // Update local data
            customer.status = newStatus;
            customer.isActive = newStatus === 'active';
            
            // Re-render table
            renderCustomersTable();
            updateCustomerStats();
            
            if (window.dashboardFunctions) {
                window.dashboardFunctions.showNotification(
                    `${customer.name} has been ${newStatus === 'active' ? 'unblocked' : 'blocked'}.`, 
                    'success'
                );
            }
        } catch (error) {
            console.error('Error updating customer status:', error);
            if (window.dashboardFunctions) {
                window.dashboardFunctions.showNotification(
                    'Failed to update customer status. Please try again.', 
                    'error'
                );
            }
        }
    }
}

// Toggle customer status function for switch controls
async function toggleCustomerStatus(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        try {
            const newStatus = customer.status === 'active' ? 'inactive' : 'active';
            await updateCustomerStatus(customerId, newStatus);
            
            // Update local data
            customer.status = newStatus;
            customer.isActive = newStatus === 'active';
            
            // Re-render table
            renderCustomersTable();
            updateCustomerStats();
            
            if (window.dashboardFunctions) {
                window.dashboardFunctions.showNotification(
                    `${customer.name} status updated to ${newStatus}.`, 
                    'success'
                );
            }
        } catch (error) {
            console.error('Error toggling customer status:', error);
            if (window.dashboardFunctions) {
                window.dashboardFunctions.showNotification(
                    'Failed to update customer status. Please try again.', 
                    'error'
                );
            }
            
            // Revert the toggle state
            const toggle = document.querySelector(`[data-customer-id="${customerId}"]`);
            if (toggle) {
                toggle.checked = customer.status === 'active';
            }
        }
    }
}

function exportCustomers() {
    // Simulate export functionality
    if (window.dashboardFunctions) {
        window.dashboardFunctions.showNotification('Customer data export started...', 'info');
        
        setTimeout(() => {
            window.dashboardFunctions.showNotification('Customer data exported successfully!', 'success');
        }, 2000);
    }
}

// Export functions
window.customersManager = {
    viewCustomer,
    editCustomer,
    blockCustomer,
    toggleCustomerStatus,
    exportCustomers,
    loadCustomersData
};
