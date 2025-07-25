// Merchants Management JavaScript

// Sample merchant data
let merchants = [
    {
        id: 'MERCH001',
        name: 'Pizza Palace',
        email: 'contact@pizzapalace.com',
        phone: '+1 (555) 111-1111',
        category: 'restaurant',
        status: 'verified',
        commission: 15,
        ordersToday: 42,
        revenueToday: 1250.50,
        rating: 4.8,
        joinDate: 'Jan 15, 2024',
        avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=40&h=40&fit=crop&crop=center',
        address: '123 Main St, Downtown'
    },
    {
        id: 'MERCH002',
        name: 'Burger Hub',
        email: 'info@burgerhub.com',
        phone: '+1 (555) 222-2222',
        category: 'restaurant',
        status: 'verified',
        commission: 12,
        ordersToday: 38,
        revenueToday: 980.25,
        rating: 4.3,
        joinDate: 'Feb 28, 2024',
        avatar: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=40&h=40&fit=crop&crop=center',
        address: '456 Oak Ave, Midtown'
    },
    {
        id: 'MERCH003',
        name: 'Fresh Market',
        email: 'hello@freshmarket.com',
        phone: '+1 (555) 333-3333',
        category: 'grocery',
        status: 'pending',
        commission: 8,
        ordersToday: 0,
        revenueToday: 0,
        rating: null,
        joinDate: 'Jul 20, 2024',
        avatar: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=40&h=40&fit=crop&crop=center',
        address: '789 Pine St, Uptown'
    },
    {
        id: 'MERCH004',
        name: 'Coffee Corner',
        email: 'orders@coffeecorner.com',
        phone: '+1 (555) 444-4444',
        category: 'restaurant',
        status: 'under-review',
        commission: 18,
        ordersToday: 0,
        revenueToday: 0,
        rating: null,
        joinDate: 'Jul 22, 2024',
        avatar: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=40&h=40&fit=crop&crop=center',
        address: '321 Coffee Ave, Downtown'
    },
    {
        id: 'MERCH005',
        name: 'Quick Pharmacy',
        email: 'info@quickpharmacy.com',
        phone: '+1 (555) 555-5555',
        category: 'pharmacy',
        status: 'suspended',
        commission: 12,
        ordersToday: 0,
        revenueToday: 0,
        rating: 3.2,
        joinDate: 'May 10, 2024',
        avatar: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=40&h=40&fit=crop&crop=center',
        address: '654 Health St, Medical District'
    }
];

// Initialize merchants page
document.addEventListener('DOMContentLoaded', function() {
    initializeMerchantsPage();
    setupEventListeners();
});

function initializeMerchantsPage() {
    renderMerchantsTable();
    updateMerchantStats();
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterMerchants);
    }

    // Filter functionality
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterMerchants);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterMerchants);
    }

    // Add merchant form
    const addMerchantForm = document.getElementById('addMerchantForm');
    if (addMerchantForm) {
        addMerchantForm.addEventListener('submit', handleAddMerchant);
    }

    // Merchant status form
    const merchantStatusForm = document.getElementById('merchantStatusForm');
    if (merchantStatusForm) {
        merchantStatusForm.addEventListener('submit', handleMerchantStatusUpdate);
    }
}

function renderMerchantsTable(merchantsList = merchants) {
    const tbody = document.getElementById('merchantsTableBody');
    if (!tbody) return;

    tbody.innerHTML = merchantsList.map(merchant => `
        <tr>
            <td>
                <div class="merchant-info">
                    <div class="merchant-avatar">
                        <img src="${merchant.avatar}" alt="${merchant.name}">
                    </div>
                    <div>
                        <div class="merchant-name">${merchant.name}</div>
                        <div class="merchant-id">#${merchant.id}</div>
                    </div>
                </div>
            </td>
            <td><span class="merchant-category">${capitalizeFirst(merchant.category)}</span></td>
            <td><span class="status-badge ${merchant.status}">${capitalizeFirst(merchant.status)}</span></td>
            <td><span class="commission-rate">${merchant.commission}%</span></td>
            <td>${merchant.ordersToday}</td>
            <td>$${merchant.revenueToday.toFixed(2)}</td>
            <td>
                <div class="rating">
                    ${merchant.rating ? `
                        <span class="rating-stars">
                            ${generateStars(merchant.rating)}
                        </span>
                        <span class="rating-value">${merchant.rating}</span>
                    ` : '<span class="rating-value">New</span>'}
                </div>
            </td>
            <td>${merchant.joinDate}</td>
            <td>
                <div class="actions">
                    <button class="btn-action" onclick="viewMerchant('${merchant.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${merchant.status === 'pending' ? `
                        <button class="btn-action success" onclick="openMerchantStatusModal('${merchant.id}', 'approve')" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action danger" onclick="openMerchantStatusModal('${merchant.id}', 'reject')" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                        <button class="btn-action warning" onclick="openMerchantStatusModal('${merchant.id}', 'review')" title="Under Review">
                            <i class="fas fa-clock"></i>
                        </button>
                    ` : merchant.status === 'verified' ? `
                        <button class="btn-action" onclick="editMerchant('${merchant.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action danger" onclick="openMerchantStatusModal('${merchant.id}', 'suspend')" title="Suspend">
                            <i class="fas fa-ban"></i>
                        </button>
                        <button class="btn-action warning" onclick="openMerchantStatusModal('${merchant.id}', 'review')" title="Under Review">
                            <i class="fas fa-clock"></i>
                        </button>
                    ` : merchant.status === 'under-review' ? `
                        <button class="btn-action success" onclick="openMerchantStatusModal('${merchant.id}', 'approve')" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action danger" onclick="openMerchantStatusModal('${merchant.id}', 'reject')" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                        <button class="btn-action" onclick="editMerchant('${merchant.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : merchant.status === 'suspended' ? `
                        <button class="btn-action success" onclick="openMerchantStatusModal('${merchant.id}', 'reactivate')" title="Reactivate">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button class="btn-action" onclick="editMerchant('${merchant.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : `
                        <button class="btn-action" onclick="editMerchant('${merchant.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action success" onclick="openMerchantStatusModal('${merchant.id}', 'reactivate')" title="Reactivate">
                            <i class="fas fa-undo"></i>
                        </button>
                    `}
                </div>
            </td>
        </tr>
    `).join('');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }

    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }

    return stars;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function filterMerchants() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;

    let filteredMerchants = merchants.filter(merchant => {
        const matchesSearch = merchant.name.toLowerCase().includes(searchTerm) ||
                            merchant.id.toLowerCase().includes(searchTerm) ||
                            merchant.email.toLowerCase().includes(searchTerm) ||
                            merchant.category.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || merchant.status === statusFilter;
        const matchesCategory = !categoryFilter || merchant.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    renderMerchantsTable(filteredMerchants);
}

function updateMerchantStats() {
    const totalMerchants = merchants.length;
    const activeMerchants = merchants.filter(m => m.status === 'verified').length;
    const totalCommission = merchants.reduce((sum, m) => sum + m.revenueToday * (m.commission / 100), 0);
    const avgRating = merchants.filter(m => m.rating).reduce((sum, m, _, arr) => sum + m.rating / arr.length, 0);

    // Update stat cards - in real app would come from backend
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('h3').textContent = '156';
        statCards[1].querySelector('h3').textContent = '142';
        statCards[2].querySelector('h3').textContent = '$12,450';
        statCards[3].querySelector('h3').textContent = '4.6';
    }
}

// Modal functions
function openAddMerchantModal() {
    const modal = document.getElementById('addMerchantModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAddMerchantModal() {
    const modal = document.getElementById('addMerchantModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Reset form
        document.getElementById('addMerchantForm').reset();
    }
}

function handleAddMerchant(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newMerchant = {
        id: 'MERCH' + String(merchants.length + 1).padStart(3, '0'),
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        category: formData.get('category'),
        status: 'pending',
        commission: parseInt(formData.get('commission')),
        ordersToday: 0,
        revenueToday: 0,
        rating: null,
        joinDate: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        }),
        avatar: `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=40&h=40&fit=crop&crop=center`,
        address: formData.get('address')
    };

    merchants.push(newMerchant);
    renderMerchantsTable();
    updateMerchantStats();
    closeAddMerchantModal();
    
    // Show success message
    if (window.dashboardFunctions) {
        window.dashboardFunctions.showNotification('Merchant application submitted for review!', 'success');
    }
}

// Merchant status management functions
function openMerchantStatusModal(merchantId, action) {
    const merchant = merchants.find(m => m.id === merchantId);
    if (!merchant) return;

    const modal = document.getElementById('merchantStatusModal');
    const title = document.getElementById('statusModalTitle');
    const merchantIdInput = document.getElementById('statusMerchantId');
    const actionInput = document.getElementById('statusAction');
    const merchantAvatar = document.getElementById('statusMerchantAvatar');
    const merchantName = document.getElementById('statusMerchantName');
    const merchantEmail = document.getElementById('statusMerchantEmail');
    const currentStatus = document.getElementById('statusMerchantCurrentStatus');
    const reasonTextarea = document.getElementById('statusReason');
    const confirmBtn = document.getElementById('statusConfirmBtn');

    // Set merchant details
    merchantIdInput.value = merchantId;
    actionInput.value = action;
    merchantAvatar.src = merchant.avatar;
    merchantName.textContent = merchant.name;
    merchantEmail.textContent = merchant.email;
    currentStatus.textContent = capitalizeFirst(merchant.status.replace('-', ' '));

    // Configure modal based on action
    const actionConfig = {
        approve: {
            title: 'Approve Merchant',
            btnText: 'Approve Merchant',
            btnClass: 'btn-primary success',
            placeholder: 'Welcome to our platform! Your merchant account has been approved. You can now start listing your products and receiving orders.'
        },
        reject: {
            title: 'Reject Merchant Application',
            btnText: 'Reject Application',
            btnClass: 'btn-primary danger',
            placeholder: 'Unfortunately, we cannot approve your merchant application at this time. Please review our merchant guidelines and reapply when you meet the requirements.'
        },
        suspend: {
            title: 'Suspend Merchant',
            btnText: 'Suspend Merchant',
            btnClass: 'btn-primary danger',
            placeholder: 'Your merchant account has been temporarily suspended due to policy violations. Please contact support for more information.'
        },
        review: {
            title: 'Mark Under Review',
            btnText: 'Mark Under Review',
            btnClass: 'btn-primary warning',
            placeholder: 'Your merchant application is currently under review. We will notify you once the review process is complete.'
        },
        reactivate: {
            title: 'Reactivate Merchant',
            btnText: 'Reactivate Merchant',
            btnClass: 'btn-primary success',
            placeholder: 'Welcome back! Your merchant account has been reactivated. You can now resume your business operations on our platform.'
        }
    };

    const config = actionConfig[action];
    title.textContent = config.title;
    confirmBtn.textContent = config.btnText;
    confirmBtn.className = config.btnClass;
    reasonTextarea.placeholder = config.placeholder;
    reasonTextarea.value = config.placeholder;

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeMerchantStatusModal() {
    const modal = document.getElementById('merchantStatusModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('merchantStatusForm').reset();
    }
}

function handleMerchantStatusUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const merchantId = formData.get('merchantId');
    const action = formData.get('action');
    const reason = formData.get('reason');
    const sendEmail = formData.get('sendEmail');
    
    const merchant = merchants.find(m => m.id === merchantId);
    if (!merchant) return;

    // Update merchant status based on action
    const statusMap = {
        approve: 'verified',
        reject: 'rejected',
        suspend: 'suspended',
        review: 'under-review',
        reactivate: 'verified'
    };

    const oldStatus = merchant.status;
    merchant.status = statusMap[action];

    // Log the status change (in real app, this would be saved to database)
    const statusChange = {
        merchantId: merchantId,
        merchantName: merchant.name,
        merchantEmail: merchant.email,
        oldStatus: oldStatus,
        newStatus: merchant.status,
        action: action,
        reason: reason,
        sendEmail: sendEmail === 'on',
        timestamp: new Date().toISOString(),
        adminUser: 'Admin User'
    };

    console.log('Merchant Status Change:', statusChange);

    // Simulate email sending
    if (sendEmail === 'on') {
        simulateEmailNotification(merchant, action, reason);
    }

    // Update UI
    renderMerchantsTable();
    updateMerchantStats();
    closeMerchantStatusModal();

    // Show success message
    const actionMessages = {
        approve: `${merchant.name} has been approved successfully!`,
        reject: `${merchant.name}'s application has been rejected.`,
        suspend: `${merchant.name} has been suspended.`,
        review: `${merchant.name} has been marked for review.`,
        reactivate: `${merchant.name} has been reactivated.`
    };

    if (window.dashboardFunctions) {
        window.dashboardFunctions.showNotification(actionMessages[action], 'success');
    }
}

function simulateEmailNotification(merchant, action, reason) {
    // Simulate email sending (in real app, this would call your email service)
    const emailTemplates = {
        approve: `
            Subject: Welcome to WizzCentral - Your Account is Approved!
            
            Dear ${merchant.name},
            
            Congratulations! Your merchant account has been approved.
            
            ${reason}
            
            You can now log in to your merchant dashboard and start listing your products.
            
            Best regards,
            WizzCentral Team
        `,
        reject: `
            Subject: WizzCentral Merchant Application Update
            
            Dear ${merchant.name},
            
            Thank you for your interest in joining WizzCentral.
            
            ${reason}
            
            If you have any questions, please don't hesitate to contact our support team.
            
            Best regards,
            WizzCentral Team
        `,
        suspend: `
            Subject: Important: Your WizzCentral Account Status
            
            Dear ${merchant.name},
            
            We need to inform you about a change to your account status.
            
            ${reason}
            
            To resolve this issue, please contact our support team immediately.
            
            Best regards,
            WizzCentral Team
        `,
        review: `
            Subject: WizzCentral Application Under Review
            
            Dear ${merchant.name},
            
            Thank you for your patience during our review process.
            
            ${reason}
            
            We will notify you as soon as the review is complete.
            
            Best regards,
            WizzCentral Team
        `,
        reactivate: `
            Subject: Welcome Back to WizzCentral!
            
            Dear ${merchant.name},
            
            Great news! Your merchant account has been reactivated.
            
            ${reason}
            
            You can now resume your business operations on our platform.
            
            Best regards,
            WizzCentral Team
        `
    };

    console.log('Email Sent to:', merchant.email);
    console.log('Email Content:', emailTemplates[action]);

    // Show email notification
    setTimeout(() => {
        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification(`Email notification sent to ${merchant.email}`, 'info');
        }
    }, 1000);
}

function viewMerchant(merchantId) {
    const merchant = merchants.find(m => m.id === merchantId);
    if (merchant) {
        alert(`Merchant Details:\n\nName: ${merchant.name}\nEmail: ${merchant.email}\nPhone: ${merchant.phone}\nCategory: ${merchant.category}\nStatus: ${merchant.status}\nCommission: ${merchant.commission}%\nOrders Today: ${merchant.ordersToday}\nRevenue Today: $${merchant.revenueToday}\nRating: ${merchant.rating || 'New'}\nAddress: ${merchant.address}`);
    }
}

function editMerchant(merchantId) {
    const merchant = merchants.find(m => m.id === merchantId);
    if (merchant) {
        alert(`Edit functionality for ${merchant.name} would open here.`);
    }
}

function suspendMerchant(merchantId) {
    const merchant = merchants.find(m => m.id === merchantId);
    if (merchant && confirm(`Are you sure you want to suspend ${merchant.name}?`)) {
        merchant.status = 'inactive';
        renderMerchantsTable();
        updateMerchantStats();
        
        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification(`${merchant.name} has been suspended.`, 'success');
        }
    }
}

function approveMerchant(merchantId) {
    const merchant = merchants.find(m => m.id === merchantId);
    if (merchant && confirm(`Approve ${merchant.name} as a verified merchant?`)) {
        merchant.status = 'verified';
        merchant.rating = 5.0; // Start with perfect rating
        renderMerchantsTable();
        updateMerchantStats();
        
        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification(`${merchant.name} has been approved!`, 'success');
        }
    }
}

function rejectMerchant(merchantId) {
    const merchant = merchants.find(m => m.id === merchantId);
    if (merchant && confirm(`Reject ${merchant.name}'s application?`)) {
        merchant.status = 'rejected';
        renderMerchantsTable();
        updateMerchantStats();
        
        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification(`${merchant.name}'s application has been rejected.`, 'error');
        }
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const addModal = document.getElementById('addMerchantModal');
    const statusModal = document.getElementById('merchantStatusModal');
    
    if (e.target === addModal) {
        closeAddMerchantModal();
    }
    
    if (e.target === statusModal) {
        closeMerchantStatusModal();
    }
});

// Export functions
window.merchantsManager = {
    openAddMerchantModal,
    closeAddMerchantModal,
    openMerchantStatusModal,
    closeMerchantStatusModal,
    viewMerchant,
    editMerchant,
    suspendMerchant,
    approveMerchant,
    rejectMerchant
};
