// Promotions Management JavaScript

// Check authentication on page load
function checkAuthentication() {
  const idToken = sessionStorage.getItem('idToken');
  const accessToken = sessionStorage.getItem('accessToken');
  
  if (!idToken || !accessToken) {
    console.warn('No authentication tokens found, redirecting to login');
    window.location.href = 'index.html';
    return false;
  }
  
  // Validate token expiration
  if (idToken) {
    try {
      const tokenPayload = JSON.parse(atob(idToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (tokenPayload.exp && tokenPayload.exp < currentTime) {
        console.warn('Authentication token has expired. Redirecting to login.');
        sessionStorage.clear();
        window.location.href = 'index.html';
        return false;
      }
    } catch (error) {
      console.error('Invalid token format. Redirecting to login.');
      sessionStorage.clear();
      window.location.href = 'index.html';
      return false;
    }
  }
  
  console.log('Authentication check passed');
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
    localStorage.clear(); // Clear both just to be safe
    window.location.href = 'index.html'; // Will work since we're in pages/
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = 'index.html'; // Will work since we're in pages/
  }
};

// Initialize AWS credentials and DynamoDB client
async function initializeAWS() {
    try {
        const idToken = sessionStorage.getItem('idToken');
        const accessToken = sessionStorage.getItem('accessToken');
        
        if (!idToken || !accessToken) {
            console.log('No authentication tokens found. Redirecting to login.');
            window.location.href = 'index.html';
            return;
        }

        if (typeof AWS === 'undefined') {
            throw new Error('AWS SDK not loaded.');
        }

        const response = await fetch('../amplify_outputs.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch amplify_outputs.json: ${response.status}`);
        }
        const outputs = await response.json();
        
        const region = outputs.data?.aws_region || 'us-east-1';
        const userPoolId = outputs.auth.user_pool_id;
        const identityPoolId = outputs.auth.identity_pool_id;
        const cognitoProvider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;

        AWS.config.region = region;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: identityPoolId,
            Logins: {
                [cognitoProvider]: idToken
            }
        });

        await AWS.config.credentials.refreshPromise();
        console.log("Successfully fetched AWS credentials for promotions.");

        dynamodbClient = new AWS.DynamoDB.DocumentClient();
        console.log('AWS initialized successfully for promotions.');
    } catch (error) {
        console.error('Failed to initialize AWS for promotions:', error);
        window.location.href = 'index.html';
        throw error;
    }
}

// Load promotions data from DynamoDB - TEMPORARILY DISABLED FOR DEBUGGING
async function loadPromotionsData() {
    const tbody = document.getElementById('promotionsTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem;">Loading promotions...</td></tr>`;
    }
    try {
        const idToken = sessionStorage.getItem('idToken');
        const response = await fetch(`${window.WIZZCENTRAL_CONFIG.API_BASE_URL}/promotions`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error?.message || 'Failed to load promotions');
        }
        const backendPromos = result.data.promotions || [];
        promotions = backendPromos.map(p => ({
            id: p.promotionId,
            title: p.name,
            code: p.code,
            type: p.type,
            value: p.value,
            status: p.isActive ? 'active' : (new Date() < new Date(p.startDate) ? 'scheduled' : 'expired'),
            usage: p.currentUsage || 0,
            limit: p.usageLimit || 0,
            startDate: p.startDate.split('T')[0],
            endDate: p.endDate.split('T')[0],
            description: p.description,
            minOrderValue: p.minOrderAmount || 0
        }));
    } catch (error) {
        console.error('Error loading promotions from backend:', error);
        // Display error message on UI
        const tbody = document.getElementById('promotionsTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error loading promotions: ${error.message}</td></tr>`;
        }
        return;
    }
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
    
    // Load merchant discounts
    if (window.dataService) {
        loadMerchantDiscounts();
    } else {
        console.warn('Data service not available, merchant discounts will not be loaded');
        // Try again after a delay in case the service is still loading
        setTimeout(() => {
            if (window.dataService) {
                loadMerchantDiscounts();
            }
        }, 1000);
    }
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

async function handleAddPromotion(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const code = formData.get('code').toUpperCase();
    const type = formData.get('type');
    const value = parseFloat(formData.get('value'));
    const limit = parseInt(formData.get('limit'));
    const minOrder = parseFloat(formData.get('minOrder')) || 0;
    const startDateISO = formData.get('startDate');
    const endDateISO = formData.get('endDate');

    // Prepare payload for backend
    const payload = {
        name: title,
        description: formData.get('description'),
        type: type,
        code: code,
        value: value,
        minOrderAmount: minOrder,
        usageLimit: limit,
        startDate: new Date(startDateISO).toISOString(),
        endDate: new Date(endDateISO).toISOString()
    };

    try {
        const idToken = sessionStorage.getItem('idToken');
        const response = await fetch(`${window.WIZZCENTRAL_CONFIG.API_BASE_URL}/promotions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            console.error('Backend create error:', result);
            const details = Array.isArray(result.error.details)
                ? result.error.details.join('; ')
                : result.error.message || 'Failed to create promotion';
            throw new Error(details);
        }
        // Refresh promotions from backend
        await loadPromotionsData();
        closeAddPromotionModal();
        window.dashboardFunctions?.showNotification('Promotion created successfully!', 'success');
    } catch (error) {
        console.error('Error creating promotion:', error);
        window.dashboardFunctions?.showNotification(`Error creating promotion: ${error.message}`, 'error');
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

// Merchant Discounts Management
let merchantDiscounts = [];
let businessesData = {};

// Load merchant discounts from data service
async function loadMerchantDiscounts() {
    try {
        console.log('🔄 Starting loadMerchantDiscounts...');
        
        if (!window.dataService) {
            console.warn('❌ Data service not available for merchant discounts');
            showMerchantDiscountError();
            return;
        }
        
        console.log('✅ Data service available, initializing...');
        await window.dataService.initialize();
        console.log('✅ Data service initialized successfully');
        
        // Load both discounts and businesses data with individual error handling
        console.log('🔄 Loading discounts and businesses data...');
        
        let discounts = [];
        let businesses = [];
        
        try {
            console.log('🔄 Loading merchant discounts...');
            discounts = await window.dataService.getMerchantDiscounts(false); // Force fresh data
            console.log(`✅ Raw discounts loaded: ${discounts.length} items`);
            if (discounts.length > 0) {
                console.log('📋 Sample discount:', discounts[0]);
            }
        } catch (discountError) {
            console.error('❌ Failed to load discounts:', discountError);
            console.error('Discount error details:', {
                message: discountError.message,
                code: discountError.code,
                stack: discountError.stack
            });
            // Continue with empty discounts array
        }
        
        try {
            console.log('🔄 Loading businesses data...');
            businesses = await window.dataService.getBusinesses(false); // Force fresh data
            console.log(`✅ Raw businesses loaded: ${businesses.length} items`);
        } catch (businessError) {
            console.error('❌ Failed to load businesses:', businessError);
            console.error('Business error details:', {
                message: businessError.message,
                code: businessError.code,
                stack: businessError.stack
            });
            // Continue with empty businesses array
        }
        
        merchantDiscounts = discounts;
        
        // Create a lookup map for business names
        businessesData = {};
        businesses.forEach(business => {
            const id = business.id || business.businessId;
            if (id) {
                businessesData[id] = business;
            }
        });
        
        console.log('📊 Final processing results:');
        console.log(`- Merchant discounts: ${merchantDiscounts.length}`);
        console.log(`- Businesses data: ${Object.keys(businessesData).length}`);
        console.log('- Sample businessesData keys:', Object.keys(businessesData).slice(0, 5));
        console.log('📊 Final processing results:');
        console.log(`- Merchant discounts: ${merchantDiscounts.length}`);
        console.log(`- Businesses data: ${Object.keys(businessesData).length}`);
        console.log('- Sample businessesData keys:', Object.keys(businessesData).slice(0, 5));
        console.log('Final businesses data:', businessesData);
        
        // Update stats
        updateMerchantDiscountStats();
        
        // Render table
        renderMerchantDiscountsTable();
        
        console.log('✅ loadMerchantDiscounts completed successfully');
        
    } catch (error) {
        console.error('❌ Critical error in loadMerchantDiscounts:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            dataServiceAvailable: !!window.dataService,
            discountsLength: merchantDiscounts.length,
            businessesDataKeys: Object.keys(businessesData)
        });
        showMerchantDiscountError();
    }
}

// Refresh merchant discounts manually
async function refreshMerchantDiscounts() {
    console.log('Manual refresh of merchant discounts triggered');
    
    // Reset variables
    merchantDiscounts = [];
    businessesData = {};
    
    // Update table to show loading state
    const tbody = document.getElementById('merchantDiscountsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; margin-bottom: 1rem; color: #007cba;"></i>
                    <div>Refreshing merchant discounts...</div>
                </td>
            </tr>
        `;
    }
    
    // Reset stats
    const totalEl = document.getElementById('totalMerchantDiscounts');
    const activeEl = document.getElementById('activeMerchantDiscounts');
    if (totalEl) totalEl.textContent = '0';
    if (activeEl) activeEl.textContent = '0';
    
    // Load fresh data
    await loadMerchantDiscounts();
}

// Update merchant discount statistics
function updateMerchantDiscountStats() {
    const totalDiscounts = merchantDiscounts.length;
    const activeDiscounts = merchantDiscounts.filter(d => d.status === 'active').length;
    
    const totalEl = document.getElementById('totalMerchantDiscounts');
    const activeEl = document.getElementById('activeMerchantDiscounts');
    
    if (totalEl) totalEl.textContent = totalDiscounts;
    if (activeEl) activeEl.textContent = activeDiscounts;
}

// Render merchant discounts table
function renderMerchantDiscountsTable() {
    const tbody = document.getElementById('merchantDiscountsTableBody');
    if (!tbody) return;
    
    if (merchantDiscounts.length === 0) {
        // Check if we have no discounts due to an error or truly empty
        const hasError = merchantDiscounts._error || false;
        const errorMessage = hasError ? 
            'Failed to load merchant discounts. Check console for details.' :
            'No merchant discounts found. Merchants haven\'t created any discounts yet.';
        const iconClass = hasError ? 'fas fa-exclamation-triangle' : 'fas fa-tags';
        const iconColor = hasError ? '#e74c3c' : '#ccc';
        
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: ${hasError ? '#e74c3c' : '#666'};">
                    <i class="${iconClass}" style="font-size: 3rem; margin-bottom: 1rem; color: ${iconColor};"></i>
                    <div>${errorMessage}</div>
                    ${hasError ? `
                        <div style="font-size: 0.9rem; margin-top: 0.5rem;">
                            <button onclick="refreshMerchantDiscounts()" style="padding: 0.5rem 1rem; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 1rem;">
                                <i class="fas fa-sync-alt"></i> Retry Loading
                            </button>
                            <button onclick="window.debugMerchantDiscounts()" style="padding: 0.5rem 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 1rem; margin-left: 0.5rem;">
                                <i class="fas fa-bug"></i> Debug in Console
                            </button>
                        </div>
                    ` : `<div style="font-size: 0.9rem; margin-top: 0.5rem;">Discounts created by merchants will appear here</div>`}
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = merchantDiscounts.map(discount => {
        const merchantName = getMerchantName(discount.businessId);
        const discountValue = formatDiscountValue(discount);
        const validUntil = discount.validTo ? new Date(discount.validTo).toLocaleDateString() : 'No expiry';
        const usage = discount.usageLimit ? `${discount.usageCount} / ${discount.usageLimit}` : discount.usageCount.toString();
        
        return `
            <tr>
                <td>
                    <div class="promotion-info">
                        <div class="promotion-icon">
                            <i class="fas fa-tag"></i>
                        </div>
                        <div>
                            <div class="promotion-title">${discount.title}</div>
                            <div class="promotion-code">${discount.description}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="merchant-info">
                        <span class="merchant-name">${merchantName}</span>
                        <small style="color: #666; display: block;">ID: ${discount.businessId.substring(0, 8)}...</small>
                    </div>
                </td>
                <td><span class="type-badge ${discount.type}">${discount.type.charAt(0).toUpperCase() + discount.type.slice(1)}</span></td>
                <td><span class="discount-badge">${discountValue}</span></td>
                <td><span class="promotion-status ${discount.status}">${discount.status.charAt(0).toUpperCase() + discount.status.slice(1)}</span></td>
                <td>${usage}</td>
                <td>${validUntil}</td>
                <td>
                    <div class="actions">
                        <button class="btn-action" onclick="viewMerchantDiscount('${discount.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action" onclick="contactMerchant('${discount.businessId}')" title="Contact Merchant">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Helper function to get merchant name from business ID
function getMerchantName(businessId) {
    // Look up the business name from the loaded business data
    const business = businessesData[businessId];
    if (business) {
        return business.name || business.businessName || 'Unknown Business';
    }
    return `Business ${businessId.substring(0, 8)}...`; // Fallback with truncated ID
}

// Helper function to format discount value
function formatDiscountValue(discount) {
    if (discount.type === 'percentage') {
        return `${discount.value}% OFF`;
    } else if (discount.type === 'fixed') {
        return `$${discount.value} OFF`;
    } else {
        return `${discount.value}`;
    }
}

// Show error when merchant discounts fail to load
function showMerchantDiscountError() {
    const tbody = document.getElementById('merchantDiscountsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 2rem; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">Failed to load merchant discounts</div>
                <div style="font-size: 0.9rem; margin-bottom: 1rem;">Please check the console for detailed error information</div>
                <button onclick="refreshMerchantDiscounts()" style="padding: 0.5rem 1rem; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
            </td>
        </tr>
    `;
}

// Merchant discount action functions
function viewMerchantDiscount(discountId) {
    const discount = merchantDiscounts.find(d => d.id === discountId);
    if (!discount) return;
    
    alert(`Discount Details:\n\nTitle: ${discount.title}\nType: ${discount.type}\nValue: ${formatDiscountValue(discount)}\nStatus: ${discount.status}\nCreated: ${new Date(discount.createdAt).toLocaleDateString()}`);
}

function contactMerchant(businessId) {
    // This would open a contact form or redirect to merchant details
    console.log('Contact merchant:', businessId);
    alert('Contact merchant functionality would be implemented here');
}

// Debug function for merchant discounts - can be called from browser console
window.debugMerchantDiscounts = async function() {
    console.log('🔍 === MERCHANT DISCOUNTS DEBUG START ===');
    
    try {
        // Test 1: Check if data service exists
        console.log('1️⃣ Checking data service availability...');
        if (!window.dataService) {
            console.error('❌ window.dataService is not available');
            return;
        }
        console.log('✅ Data service is available');
        
        // Test 2: Initialize data service
        console.log('2️⃣ Initializing data service...');
        await window.dataService.initialize();
        console.log('✅ Data service initialized');
        
        // Test 3: Test direct scan of discounts table
        console.log('3️⃣ Testing direct scan of discounts table...');
        const scanResult = await window.dataService.scan('order-receiver-discounts-dev', { Limit: 5 });
        console.log('✅ Direct scan result:', scanResult);
        console.log(`Found ${scanResult.Items?.length || 0} raw items`);
        if (scanResult.Items && scanResult.Items.length > 0) {
            console.log('First raw item:', JSON.stringify(scanResult.Items[0], null, 2));
        }
        
        // Test 4: Test getMerchantDiscounts method
        console.log('4️⃣ Testing getMerchantDiscounts method...');
        const discounts = await window.dataService.getMerchantDiscounts(false);
        console.log('✅ getMerchantDiscounts result:', discounts);
        console.log(`Mapped ${discounts.length} discount items`);
        if (discounts.length > 0) {
            console.log('First mapped discount:', JSON.stringify(discounts[0], null, 2));
        }
        
        // Test 5: Test businesses loading
        console.log('5️⃣ Testing businesses loading...');
        const businesses = await window.dataService.getBusinesses(false);
        console.log('✅ Businesses result:', businesses);
        console.log(`Loaded ${businesses.length} businesses`);
        
        console.log('🎯 === DEBUG COMPLETED SUCCESSFULLY ===');
        return {
            scanResult,
            discounts,
            businesses,
            summary: {
                rawItems: scanResult.Items?.length || 0,
                mappedDiscounts: discounts.length,
                businesses: businesses.length
            }
        };
        
    } catch (error) {
        console.error('❌ DEBUG FAILED:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        throw error;
    }
};

// Initialize promotions page when DOM is ready
