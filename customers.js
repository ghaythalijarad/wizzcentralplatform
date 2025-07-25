// Customers Management JavaScript

// Sample customer data
let customers = [
    {
        id: 'CUST001',
        name: 'Alice Johnson',
        email: 'alice.johnson@email.com',
        phone: '+1 (555) 111-2222',
        status: 'active',
        totalOrders: 24,
        totalSpent: 1245.80,
        lastOrder: '2 days ago',
        segment: 'vip',
        avatar: 'https://i.pravatar.cc/40?img=11',
        joinDate: '2023-05-15'
    },
    {
        id: 'CUST002',
        name: 'Bob Wilson',
        email: 'bob.wilson@email.com',
        phone: '+1 (555) 222-3333',
        status: 'active',
        totalOrders: 8,
        totalSpent: 567.25,
        lastOrder: '1 week ago',
        segment: 'regular',
        avatar: 'https://i.pravatar.cc/40?img=12',
        joinDate: '2024-01-10'
    },
    {
        id: 'CUST003',
        name: 'Carol Davis',
        email: 'carol.davis@email.com',
        phone: '+1 (555) 333-4444',
        status: 'inactive',
        totalOrders: 3,
        totalSpent: 89.50,
        lastOrder: '2 months ago',
        segment: 'new',
        avatar: 'https://i.pravatar.cc/40?img=13',
        joinDate: '2024-06-20'
    }
];

// Initialize customers page
document.addEventListener('DOMContentLoaded', function() {
    initializeCustomersPage();
    setupEventListeners();
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
function viewCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        alert(`Customer Details:\n\nName: ${customer.name}\nEmail: ${customer.email}\nPhone: ${customer.phone}\nStatus: ${customer.status}\nTotal Orders: ${customer.totalOrders}\nTotal Spent: $${customer.totalSpent}\nSegment: ${customer.segment}\nJoined: ${customer.joinDate}`);
    }
}

function editCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        // For demo purposes, just show an alert
        alert(`Edit functionality for ${customer.name} would open here.`);
    }
}

function blockCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer && confirm(`Are you sure you want to block ${customer.name}?`)) {
        customer.status = 'blocked';
        renderCustomersTable();
        updateCustomerStats();
        
        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification(`${customer.name} has been blocked.`, 'success');
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
    exportCustomers
};
