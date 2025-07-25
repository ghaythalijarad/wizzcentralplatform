// Promotions Management JavaScript

// Sample promotion data
let promotions = [
    {
        id: 'PROMO001',
        title: 'Summer Sale 2025',
        code: 'SUMMER25',
        type: 'percentage',
        value: 25,
        status: 'active',
        usage: 847,
        limit: 1000,
        startDate: '2025-07-01',
        endDate: '2025-07-31',
        description: 'Summer discount for all orders',
        minOrderValue: 30
    },
    {
        id: 'PROMO002',
        title: 'Free Delivery Week',
        code: 'FREEDEL',
        type: 'free_delivery',
        value: 0,
        status: 'active',
        usage: 234,
        limit: 500,
        startDate: '2025-07-20',
        endDate: '2025-07-27',
        description: 'Free delivery on all orders',
        minOrderValue: 20
    },
    {
        id: 'PROMO003',
        title: 'Weekend Special',
        code: 'WEEKEND15',
        type: 'percentage',
        value: 15,
        status: 'scheduled',
        usage: 0,
        limit: 200,
        startDate: '2025-07-26',
        endDate: '2025-07-28',
        description: 'Weekend only discount',
        minOrderValue: 25
    },
    {
        id: 'PROMO004',
        title: 'New Customer Bonus',
        code: 'WELCOME20',
        type: 'fixed',
        value: 20,
        status: 'expired',
        usage: 156,
        limit: 100,
        startDate: '2025-06-01',
        endDate: '2025-06-30',
        description: 'Welcome bonus for new customers',
        minOrderValue: 50
    }
];

// Initialize promotions page
document.addEventListener('DOMContentLoaded', function() {
    initializePromotionsPage();
    setupEventListeners();
});

function initializePromotionsPage() {
    renderPromotionsTable();
    updatePromotionStats();
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterPromotions);
    }

    // Filter functionality
    const statusFilter = document.getElementById('statusFilter');
    const typeFilter = document.getElementById('typeFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterPromotions);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', filterPromotions);
    }

    // Add promotion form
    const addPromotionForm = document.getElementById('addPromotionForm');
    if (addPromotionForm) {
        addPromotionForm.addEventListener('submit', handleAddPromotion);
    }

    // Set default dates for new promotion
    setDefaultDates();
}

function setDefaultDates() {
    const now = new Date();
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (startDate) {
        startDate.value = now.toISOString().slice(0, 16);
    }
    
    if (endDate) {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        endDate.value = nextWeek.toISOString().slice(0, 16);
    }
}

function renderPromotionsTable(promotionsList = promotions) {
    const tbody = document.getElementById('promotionsTableBody');
    if (!tbody) return;

    tbody.innerHTML = promotionsList.map(promotion => `
        <tr>
            <td>
                <div class="promotion-info">
                    <div class="promotion-icon">
                        ${getPromotionIcon(promotion.type)}
                    </div>
                    <div>
                        <div class="promotion-title">${promotion.title}</div>
                        <div class="promotion-code">${promotion.code}</div>
                    </div>
                </div>
            </td>
            <td>${capitalizeFirst(promotion.type.replace('_', ' '))}</td>
            <td><span class="discount-badge">${getDiscountDisplay(promotion)}</span></td>
            <td><span class="promotion-status ${promotion.status}">${capitalizeFirst(promotion.status)}</span></td>
            <td>${promotion.usage} / ${promotion.limit}</td>
            <td>${formatDate(promotion.startDate)}</td>
            <td>${formatDate(promotion.endDate)}</td>
            <td>
                <div class="actions">
                    <button class="btn-action" onclick="viewPromotion('${promotion.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${getActionButtons(promotion)}
                </div>
            </td>
        </tr>
    `).join('');
}

function getPromotionIcon(type) {
    const icons = {
        percentage: '<i class="fas fa-percentage"></i>',
        fixed: '<i class="fas fa-dollar-sign"></i>',
        free_delivery: '<i class="fas fa-truck"></i>',
        bogo: '<i class="fas fa-gift"></i>'
    };
    return icons[type] || '<i class="fas fa-tags"></i>';
}

function getDiscountDisplay(promotion) {
    switch (promotion.type) {
        case 'percentage':
            return `${promotion.value}% OFF`;
        case 'fixed':
            return `$${promotion.value} OFF`;
        case 'free_delivery':
            return 'Free Shipping';
        case 'bogo':
            return 'Buy 1 Get 1';
        default:
            return 'Discount';
    }
}

function getActionButtons(promotion) {
    if (promotion.status === 'expired') {
        return `
            <button class="btn-action" onclick="clonePromotion('${promotion.id}')" title="Clone">
                <i class="fas fa-copy"></i>
            </button>
            <button class="btn-action danger" onclick="deletePromotion('${promotion.id}')" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        `;
    } else if (promotion.status === 'scheduled') {
        return `
            <button class="btn-action" onclick="editPromotion('${promotion.id}')" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action" onclick="activatePromotion('${promotion.id}')" title="Activate Now">
                <i class="fas fa-play"></i>
            </button>
        `;
    } else {
        return `
            <button class="btn-action" onclick="editPromotion('${promotion.id}')" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action danger" onclick="deactivatePromotion('${promotion.id}')" title="Deactivate">
                <i class="fas fa-pause"></i>
            </button>
        `;
    }
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function filterPromotions() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;

    let filteredPromotions = promotions.filter(promotion => {
        const matchesSearch = promotion.title.toLowerCase().includes(searchTerm) ||
                            promotion.code.toLowerCase().includes(searchTerm) ||
                            promotion.id.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || promotion.status === statusFilter;
        const matchesType = !typeFilter || promotion.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    renderPromotionsTable(filteredPromotions);
}

function updatePromotionStats() {
    const activePromotions = promotions.filter(p => p.status === 'active').length;
    const totalUsage = promotions.reduce((sum, p) => sum + p.usage, 0);
    
    // Update stat cards - in real app would come from backend
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('h3').textContent = '24';
        statCards[1].querySelector('h3').textContent = '1,847';
        statCards[2].querySelector('h3').textContent = '$8,450';
        statCards[3].querySelector('h3').textContent = '67%';
    }
}

// Modal functions
function openAddPromotionModal() {
    const modal = document.getElementById('addPromotionModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setDefaultDates(); // Reset dates when opening modal
    }
}

function closeAddPromotionModal() {
    const modal = document.getElementById('addPromotionModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Reset form
        document.getElementById('addPromotionForm').reset();
    }
}

function handleAddPromotion(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const startDate = new Date(formData.get('startDate'));
    const endDate = new Date(formData.get('endDate'));
    const now = new Date();
    
    // Determine status based on dates
    let status = 'draft';
    if (startDate <= now && endDate >= now) {
        status = 'active';
    } else if (startDate > now) {
        status = 'scheduled';
    }
    
    const newPromotion = {
        id: 'PROMO' + String(promotions.length + 1).padStart(3, '0'),
        title: formData.get('title'),
        code: formData.get('code').toUpperCase(),
        type: formData.get('type'),
        value: parseFloat(formData.get('value')),
        status: status,
        usage: 0,
        limit: parseInt(formData.get('limit')),
        startDate: formData.get('startDate').split('T')[0],
        endDate: formData.get('endDate').split('T')[0],
        description: formData.get('description'),
        minOrderValue: parseFloat(formData.get('minOrder')) || 0
    };

    promotions.push(newPromotion);
    renderPromotionsTable();
    updatePromotionStats();
    closeAddPromotionModal();
    
    // Show success message
    if (window.dashboardFunctions) {
        window.dashboardFunctions.showNotification('Promotion created successfully!', 'success');
    }
}

// Promotion action functions
function viewPromotion(promotionId) {
    const promotion = promotions.find(p => p.id === promotionId);
    if (promotion) {
        alert(`Promotion Details:\n\nTitle: ${promotion.title}\nCode: ${promotion.code}\nType: ${promotion.type}\nValue: ${promotion.value}\nStatus: ${promotion.status}\nUsage: ${promotion.usage}/${promotion.limit}\nStart: ${promotion.startDate}\nEnd: ${promotion.endDate}\nMin Order: $${promotion.minOrderValue}\nDescription: ${promotion.description}`);
    }
}

function editPromotion(promotionId) {
    const promotion = promotions.find(p => p.id === promotionId);
    if (promotion) {
        alert(`Edit functionality for ${promotion.title} would open here.`);
    }
}

function deactivatePromotion(promotionId) {
    const promotion = promotions.find(p => p.id === promotionId);
    if (promotion && confirm(`Deactivate promotion "${promotion.title}"?`)) {
        promotion.status = 'draft';
        renderPromotionsTable();
        updatePromotionStats();
        
        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification(`${promotion.title} has been deactivated.`, 'success');
        }
    }
}

function activatePromotion(promotionId) {
    const promotion = promotions.find(p => p.id === promotionId);
    if (promotion && confirm(`Activate promotion "${promotion.title}" now?`)) {
        promotion.status = 'active';
        renderPromotionsTable();
        updatePromotionStats();
        
        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification(`${promotion.title} is now active!`, 'success');
        }
    }
}

function clonePromotion(promotionId) {
    const promotion = promotions.find(p => p.id === promotionId);
    if (promotion && confirm(`Clone promotion "${promotion.title}"?`)) {
        const clonedPromotion = {
            ...promotion,
            id: 'PROMO' + String(promotions.length + 1).padStart(3, '0'),
            title: promotion.title + ' (Copy)',
            code: promotion.code + '_COPY',
            status: 'draft',
            usage: 0
        };
        
        promotions.push(clonedPromotion);
        renderPromotionsTable();
        updatePromotionStats();
        
        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification(`${promotion.title} has been cloned.`, 'success');
        }
    }
}

function deletePromotion(promotionId) {
    const promotion = promotions.find(p => p.id === promotionId);
    if (promotion && confirm(`Delete promotion "${promotion.title}"? This action cannot be undone.`)) {
        const index = promotions.findIndex(p => p.id === promotionId);
        promotions.splice(index, 1);
        renderPromotionsTable();
        updatePromotionStats();
        
        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification(`${promotion.title} has been deleted.`, 'error');
        }
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('addPromotionModal');
    if (e.target === modal) {
        closeAddPromotionModal();
    }
});

// Export functions
window.promotionsManager = {
    openAddPromotionModal,
    closeAddPromotionModal,
    viewPromotion,
    editPromotion,
    deactivatePromotion,
    activatePromotion,
    clonePromotion,
    deletePromotion
};
