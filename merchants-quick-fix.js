// Simple fix to load merchants data immediately
console.log('Loading simple merchants data fix...');

// Create sample data
const sampleMerchantsData = [
    {
        id: 'biz-001',
        name: 'Pizza Palace Downtown',
        email: 'contact@pizzapalace.com',
        phone: '+1-555-0123',
        status: 'approved',
        address: '123 Main St, Downtown',
        owner: 'John Smith',
        avatar: 'https://ui-avatars.com/api/?name=Pizza+Palace&size=40&background=667eea&color=fff'
    },
    {
        id: 'biz-002',
        name: 'Fresh Market Express',
        email: 'info@freshmarket.com',
        phone: '+1-555-0124',
        status: 'pending',
        address: '456 Oak Avenue',
        owner: 'Sarah Johnson',
        avatar: 'https://ui-avatars.com/api/?name=Fresh+Market&size=40&background=f093fb&color=fff'
    },
    {
        id: 'biz-003',
        name: 'Coffee Corner Cafe',
        email: 'hello@coffeecorner.com',
        phone: '+1-555-0125',
        status: 'under_review',
        address: '789 Pine Street',
        owner: 'Mike Wilson',
        avatar: 'https://ui-avatars.com/api/?name=Coffee+Corner&size=40&background=fbbf24&color=fff'
    },
    {
        id: 'biz-004',
        name: 'Quick Pharmacy Plus',
        email: 'support@quickpharmacy.com',
        phone: '+1-555-0126',
        status: 'rejected',
        address: '321 Health Avenue',
        owner: 'Dr. Emily Chen',
        avatar: 'https://ui-avatars.com/api/?name=Quick+Pharmacy&size=40&background=ef4444&color=fff'
    }
];

// Status helper functions
function getStatusClass(status) {
    const statusMap = {
        'approved': 'verified',
        'pending': 'pending',
        'under_review': 'under-review',
        'rejected': 'rejected'
    };
    return statusMap[status] || 'unknown';
}

function getStatusLabel(status) {
    const statusMap = {
        'approved': 'Approved',
        'pending': 'Pending',
        'under_review': 'Under Review',
        'rejected': 'Rejected'
    };
    return statusMap[status] || 'Unknown';
}

// Simple render function
function renderMerchantsTableQuick() {
    console.log('Quick render function called');
    
    const tbody = document.getElementById('merchantsTableBody');
    if (!tbody) {
        console.error('Table body not found!');
        return;
    }
    
    console.log('Table body found, rendering merchants...');
    
    const tableHTML = sampleMerchantsData.map(merchant => `
        <tr>
            <td>
                <div class="merchant-info">
                    <div class="merchant-avatar">
                        <img src="${merchant.avatar}" alt="${merchant.name}" onerror="this.src='https://via.placeholder.com/40x40?text=M'">
                    </div>
                    <div class="merchant-name">${merchant.name}</div>
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
                    <button class="btn-action" onclick="alert('View ${merchant.name}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action" onclick="alert('Edit ${merchant.name}')" title="Edit Status">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = tableHTML;
    console.log('Table rendered successfully!');
    
    // Update data source indicator
    const indicator = document.getElementById('dataSourceIndicator');
    if (indicator) {
        indicator.textContent = 'Demo Data (4 merchants)';
        indicator.style.color = '#28a745';
    }
}

// Simple logout function
window.logout = function() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '../index.html';
};

// Force render when DOM is ready and multiple backup attempts
document.addEventListener('DOMContentLoaded', function() {
    console.log('Quick fix DOM loaded');
    renderMerchantsTableQuick();
});

// Multiple backup attempts
setTimeout(() => {
    console.log('Backup render attempt 1 (500ms)');
    renderMerchantsTableQuick();
}, 500);

setTimeout(() => {
    console.log('Backup render attempt 2 (1000ms)');
    renderMerchantsTableQuick();
}, 1000);

setTimeout(() => {
    console.log('Backup render attempt 3 (2000ms)');
    renderMerchantsTableQuick();
}, 2000);

console.log('Quick merchants fix loaded');
