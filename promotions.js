// Promotions Management JavaScript

// Check authentication on page load - TEMPORARILY DISABLED FOR DEBUGGING
function checkAuthentication() {
  // const idToken = sessionStorage.getItem('idToken');
  // const accessToken = sessionStorage.getItem('accessToken');
  
  // if (!idToken || !accessToken) {
  //   console.warn('No authentication tokens found, redirecting to login');
  //   window.location.href = 'index.html';
  //   return false;
  // }
  
  return true;
}

// AWS SDK and authentication setup
let dynamodbClient = null;
const PROMOTIONS_TABLE = 'WizzPromo_promos_dev'; // Assumed table name

// Global logout function for navigation consistency
window.logout = async () => {
  try {
    if (AWS && AWS.config && AWS.config.credentials) {
      AWS.config.credentials.clearCachedId();
    }
    sessionStorage.clear();
    localStorage.removeItem('accessToken');
    window.location.href = 'index.html'; // Will work since we're in pages/
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = 'index.html'; // Will work since we're in pages/
  }
};

// Initialize AWS credentials and DynamoDB client - TEMPORARILY DISABLED FOR DEBUGGING
async function initializeAWS() {
    console.log('AWS initialization disabled for debugging - promotions page');
    // All AWS initialization code temporarily disabled
    return Promise.resolve();
}

// Load promotions data from DynamoDB - TEMPORARILY DISABLED FOR DEBUGGING
async function loadPromotionsData() {
    console.log('Loading mock promotions data for debugging...');
    
    // Mock data for testing
    promotions = [
        {
            id: 'PROMO001',
            title: 'Summer Sale',
            description: '20% off all orders',
            status: 'active',
            startDate: '2025-07-01',
            endDate: '2025-07-31',
            type: 'percentage',
            value: 20,
            code: 'SUMMER20',
            usage: 45,
            limit: 100
        },
        {
            id: 'PROMO002', 
            title: 'Free Delivery',
            description: 'Free delivery on orders over $50',
            status: 'active',
            startDate: '2025-07-15',
            endDate: '2025-08-15',
            type: 'free_delivery',
            value: 0,
            code: 'FREEDEL50',
            usage: 23,
            limit: 200
        }
    ];
    
    console.log('Mock promotions loaded:', promotions);
    initializePromotionsPage();
}


// Sample promotion data
let promotions = [];

// Initialize promotions page
document.addEventListener('DOMContentLoaded', async function() {
    const tbody = document.getElementById('promotionsTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem;">Loading promotions...</td></tr>`;
    }
    
    try {
        await initializeAWS();
        await loadPromotionsData();
        setupEventListeners();
    } catch (error) {
        console.error('Failed to initialize promotions page:', error);
    }
});

// Initialize promotions page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Promotions page DOM loaded');
    
    // Check authentication first - TEMPORARILY DISABLED FOR DEBUGGING
    // if (!checkAuthentication()) {
    //     return;
    // }
    
    // Initialize dashboard functionality (sidebar, etc.)
    if (typeof initializeDashboard === 'function') {
        initializeDashboard();
    }
    
    // Load promotions data
    loadPromotionsData();
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
