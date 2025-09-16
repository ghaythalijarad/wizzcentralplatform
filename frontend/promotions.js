// Promotions Management JavaScript

// Use centralized AWS utilities
const PROMOTIONS_TABLE = 'WizzPromo_promos_dev'; // Assumed table name

// Load promotions data from DynamoDB - TEMPORARILY DISABLED FOR DEBUGGING
async function loadPromotionsData() {
    const tbody = document.getElementById('promotionsTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem;">Loading promotions...</td></tr>`;
    }
    try {
        const idToken = sessionStorage.getItem('idToken');
        console.log('DEBUG: Debug loadPromotionsData:', window.WIZZCENTRAL_CONFIG.API_BASE_URL + '/promotions', 'Authorization:', `Bearer ${idToken}`);
        const urlLoad = `${window.WIZZCENTRAL_CONFIG.API_BASE_URL}/promotions`;
        const headersLoad = { 'Authorization': `Bearer ${idToken}` };
        const response = await fetch(urlLoad, { headers: headersLoad });
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

// Load platform discounts data from DynamoDB
async function loadPlatformDiscountsData() {
    console.log('INFO: Loading platform discounts from DynamoDB...');
    
    try {
        // Ensure data service is available
        if (!window.dataService) {
            console.warn('WARNING: Data service not available for platform discounts');
            return;
        }
        
        // Initialize data service
        await window.dataService.initialize();
        
        // Load platform discounts
        const platformDiscounts = await window.dataService.getPlatformDiscounts();
        console.log(`SUCCESS: Loaded ${platformDiscounts.length} platform discounts`);
        
        // Convert DynamoDB format to local format
        const convertedDiscounts = platformDiscounts.map(discount => {
            // Helper function to extract value from DynamoDB format
            const extractValue = (dbValue) => {
                if (!dbValue) return null;
                if (dbValue.S) return dbValue.S;
                if (dbValue.N) return parseFloat(dbValue.N);
                if (dbValue.BOOL !== undefined) return dbValue.BOOL;
                if (dbValue.SS) return dbValue.SS;
                return dbValue;
            };

            const startDate = extractValue(discount.startDate);
            const endDate = extractValue(discount.endDate);
            const isActive = extractValue(discount.isActive);
            const now = new Date();
            const start = new Date(startDate);
            const end = new Date(endDate);

            let status = 'expired';
            if (isActive) {
                if (now < start) {
                    status = 'scheduled';
                } else if (now >= start && now <= end) {
                    status = 'active';
                } else {
                    status = 'expired';
                }
            } else {
                status = 'inactive';
            }

            return {
                id: extractValue(discount.discountId),
                title: extractValue(discount.name) || extractValue(discount.title),
                code: extractValue(discount.code),
                type: extractValue(discount.type),
                value: extractValue(discount.value),
                status: status,
                usage: extractValue(discount.currentUsage) || 0,
                limit: extractValue(discount.usageLimit) || 0,
                startDate: startDate ? startDate.split('T')[0] : '',
                endDate: endDate ? endDate.split('T')[0] : '',
                description: extractValue(discount.description),
                minOrderValue: extractValue(discount.minOrderAmount) || 0,
                source: 'platform', // Mark as platform discount
                createdAt: extractValue(discount.createdAt),
                updatedAt: extractValue(discount.updatedAt)
            };
        });

        // Update the global promotions array with platform discounts
        // Filter out any existing platform discounts and add the new ones
        promotions = promotions.filter(p => p.source !== 'platform');
        promotions = [...promotions, ...convertedDiscounts];

        console.log(`SUCCESS: Platform discounts integrated. Total promotions: ${promotions.length}`);
        
        // Render the updated promotions table
        renderPromotionsTable();
        
    } catch (error) {
        console.error('ERROR: Error loading platform discounts:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
    }
}

// Enhanced promotions loading that includes both backend and platform discounts
async function loadAllPromotionsData() {
    console.log('INFO: Loading all promotions data...');
    
    const tbody = document.getElementById('promotionsTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem;">Loading promotions...</td></tr>`;
    }

    try {
        // Load backend promotions (existing logic)
        await loadPromotionsData();
        
        // Load platform discounts from DynamoDB
        await loadPlatformDiscountsData();
        
    } catch (error) {
        console.error('ERROR: Error loading all promotions:', error);
        const tbody = document.getElementById('promotionsTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error loading promotions: ${error.message}</td></tr>`;
        }
    }
}

// Sample promotion data
let promotions = [];

// Initialize promotions page - single DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Promotions page DOM loaded');
    
    const tbody = document.getElementById('promotionsTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem;">Loading promotions...</td></tr>`;
    }
    
    // Check authentication using centralized utility
    if (!Auth.requireAuthentication()) {
        return;
    }
    
    // Initialize dashboard functionality (sidebar, etc.)
    if (typeof initializeDashboard === 'function') {
        initializeDashboard();
    }
    
    try {
        // Initialize AWS using centralized utility
        await AWSUtils.initialize();
        await loadAllPromotionsData();
        setupEventListeners();
    } catch (error) {
        console.error('Failed to initialize promotions page:', error);
    }
    
    // Load merchant discounts with better error handling and retry logic
    await loadMerchantDiscountsWithRetry();
    
    // Auto-run debug after initial load attempt (for troubleshooting)
    setTimeout(() => {
        if (merchantDiscounts.length === 0) {
            console.log('DEBUG: Auto-running debug since no discounts loaded...');
            window.debugMerchantDiscounts();
        }
    }, 2000);
});

// Improved merchant discounts loading with retry logic
async function loadMerchantDiscountsWithRetry(maxRetries = 3, retryDelay = 1000) {
    console.log('INFO: Starting merchant discounts loading with retry logic...');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`INFO: Attempt ${attempt}/${maxRetries} to load merchant discounts`);
            
            // Wait for data service to be available
            if (!window.dataService) {
                console.log('⏳ Waiting for data service to be available...');
                
                // Wait up to 5 seconds for data service to load
                let waitTime = 0;
                const maxWaitTime = 5000;
                const checkInterval = 100;
                
                while (!window.dataService && waitTime < maxWaitTime) {
                    await new Promise(resolve => setTimeout(resolve, checkInterval));
                    waitTime += checkInterval;
                }
                
                if (!window.dataService) {
                    throw new Error('Data service not available after waiting');
                }
            }
            
            console.log('SUCCESS: Data service is available, attempting to load merchant discounts...');
            await loadMerchantDiscounts();
            
            console.log('SUCCESS: Merchant discounts loaded successfully!');
            return; // Success, exit retry loop
            
        } catch (error) {
            console.error(`ERROR: Attempt ${attempt} failed:`, error);
            
            if (attempt === maxRetries) {
                console.error('💥 All retry attempts failed');
                showMerchantDiscountError(error);
                return;
            }
            
            console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryDelay *= 1.5; // Exponential backoff
        }
    }
}

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

    // Modal open/close handlers for Create Promotion
    document.getElementById('openAddPromotionModalBtn').addEventListener('click', () => {
        document.getElementById('addPromotionModal').style.display = 'flex';
    });
    document.getElementById('closeAddPromotionModalBtn').addEventListener('click', () => {
        document.getElementById('addPromotionModal').style.display = 'none';
        closeAddPromotionModal();
    });
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
        fixed_amount: '<i class="fas fa-dollar-sign"></i>', // Handle both formats
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
        case 'fixed_amount': // Handle both formats
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
    // Inline form reset for Create New Promotion section
    const form = document.getElementById('addPromotionForm');
    if (form) {
        form.reset();
    }
}

async function handleAddPromotion(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    console.log('INFO: Creating platform discount...');

    // --- Form Data Extraction and Validation ---
    const title = formData.get('title');
    const code = formData.get('code').toUpperCase();
    const type = formData.get('type');
    const description = formData.get('description');
    const startDateValue = formData.get('startDate');
    const endDateValue = formData.get('endDate');
    const valueStr = formData.get('value');
    const limitStr = formData.get('limit');
    const minOrderStr = formData.get('minOrder');

    // --- Client-Side Validation ---
    if (!title || !code || !type || !description || !startDateValue || !endDateValue || !valueStr) {
        window.dashboardFunctions?.showNotification('Please fill out all required fields.', 'error');
        return;
    }

    if (new Date(endDateValue) <= new Date(startDateValue)) {
        window.dashboardFunctions?.showNotification('End Date must be after Start Date.', 'error');
        return;
    }

    // Validate and parse numeric fields
    const value = parseFloat(valueStr);
    if (isNaN(value) || value <= 0) {
        window.dashboardFunctions?.showNotification('Discount Value must be a positive number.', 'error');
        return;
    }

    let minOrderAmount = null;
    if (minOrderStr) {
        minOrderAmount = parseFloat(minOrderStr);
        if (isNaN(minOrderAmount) || minOrderAmount < 0) {
            window.dashboardFunctions?.showNotification('Min Order Value must be a valid, non-negative number.', 'error');
            return;
        }
    }

    let usageLimit = null;
    if (limitStr) {
        usageLimit = parseInt(limitStr, 10);
        if (isNaN(usageLimit) || usageLimit <= 0) {
            window.dashboardFunctions?.showNotification('Usage Limit must be a valid, positive whole number.', 'error');
            return;
        }
    }

    const discountData = {
        name: title,
        title: title, // For backward compatibility
        description: description,
        type: type,
        code: code,
        startDate: new Date(startDateValue).toISOString(),
        endDate: new Date(endDateValue).toISOString(),
        value: value,
        isActive: true,
        customerSegments: ['all'],
        usageLimit: usageLimit,
        minOrderAmount: minOrderAmount
    };

    // --- Direct DynamoDB Save ---
    try {
        console.log('INFO: Saving platform discount to DynamoDB:', discountData);

        // Ensure data service is available
        if (!window.dataService) {
            throw new Error('Data service is not available. Please refresh the page and try again.');
        }

        // Initialize data service
        await window.dataService.initialize();

        // Create platform discount directly in DynamoDB
        const result = await window.dataService.createPlatformDiscount(discountData);

        if (result.success) {
            console.log('SUCCESS: Platform discount created successfully:', result.discountId);
            
            // Show success notification
            window.dashboardFunctions?.showNotification(`Platform discount "${title}" created successfully!`, 'success');
            
            // Close modal
            document.getElementById('addPromotionModal').style.display = 'none';
            
            // Reset form
            const form = document.getElementById('addPromotionForm');
            if (form) {
                form.reset();
            }
            
            // Refresh the promotions list to include the new platform discount
            await loadPlatformDiscountsData();
            
        } else {
            throw new Error('Failed to create platform discount');
        }

    } catch (error) {
        console.error('ERROR: Error creating platform discount:', error);
        window.dashboardFunctions?.showNotification(`Error creating discount: ${error.message}`, 'error');
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
        console.log('INFO: Starting loadMerchantDiscounts...');
        
        if (!window.dataService) {
            console.warn('ERROR: Data service not available for merchant discounts');
            throw new Error('Data service is not available. Please check if data-service.js is loaded properly.');
        }
        
        console.log('SUCCESS: Data service available, initializing...');
        await window.dataService.initialize();
        console.log('SUCCESS: Data service initialized successfully');
        
        // Load both discounts and businesses data with individual error handling
        console.log('INFO: Loading discounts and businesses data...');
        
        let discounts = [];
        let businesses = [];
        
        try {
            console.log('INFO: Loading merchant discounts from table: WhizzMerchants_Discounts');
            discounts = await window.dataService.getMerchantDiscounts(false); // Force fresh data
            console.log(`SUCCESS: Raw discounts loaded: ${discounts.length} items`);
            
            if (discounts.length > 0) {
                console.log('INFO: Sample discount:', discounts[0]);
                console.log('INFO: All discount keys:', Object.keys(discounts[0]));
            } else {
                console.warn('WARNING: No discounts found in table - this might be normal if no merchants have created discounts yet');
                // Let's also test direct table access
                console.log('DEBUG: Testing direct table access...');
                const directResult = await window.dataService.scan('WhizzMerchants_Discounts', { Limit: 5 });
                console.log('INFO: Direct scan result:', directResult);
                console.log(`INFO: Direct scan found ${directResult.Items?.length || 0} items`);
            }
        } catch (discountError) {
            console.error('ERROR: Failed to load discounts:', discountError);
            console.error('Discount error details:', {
                message: discountError.message,
                code: discountError.code,
                stack: discountError.stack
            });
            
            // Check if it's a credentials or AWS error
            if (discountError.message.includes('credentials') || discountError.message.includes('AWS')) {
                throw new Error(`AWS credentials error: ${discountError.message}. Please ensure you are properly authenticated.`);
            }
            
            // Check if it's a table not found error
            if (discountError.message.includes('ResourceNotFoundException') || discountError.message.includes('does not exist')) {
                console.warn('WARNING: Discounts table not found - continuing with empty discounts array');
            }
            
            // Continue with empty discounts array for other errors
            discounts = [];
        }
        
        try {
            console.log('INFO: Loading businesses data...');
            businesses = await window.dataService.getBusinesses(false); // Force fresh data
            console.log(`SUCCESS: Raw businesses loaded: ${businesses.length} items`);
        } catch (businessError) {
            console.error('ERROR: Failed to load businesses:', businessError);
            console.error('Business error details:', {
                message: businessError.message,
                code: businessError.code,
                stack: businessError.stack
            });
            
            // Check if it's a credentials or AWS error
            if (businessError.message.includes('credentials') || businessError.message.includes('AWS')) {
                throw new Error(`AWS credentials error: ${businessError.message}. Please ensure you are properly authenticated.`);
            }
            
            // Continue with empty businesses array for other errors
            businesses = [];
        }
        
        merchantDiscounts = discounts.map(discount => {
            // Handle DynamoDB structure - normalize the discount data
            console.log('INFO: Processing discount:', discount);
            
            // Check if this is already processed data or raw DynamoDB data
            const processedDiscount = {
                id: discount.discountId || discount.id || 'unknown-id',
                businessId: discount.businessId || 'unknown-business',
                title: discount.title || 'Untitled Discount',
                description: discount.description || '',
                type: discount.type || 'percentage',
                value: Number(discount.value) || 0,
                status: discount.status || 'active',
                usageCount: Number(discount.usage_count) || 0,
                usageLimit: discount.usage_limit ? Number(discount.usage_limit) : null,
                validFrom: discount.valid_from,
                validTo: discount.valid_to,
                createdAt: discount.created_at,
                updatedAt: discount.updated_at,
                minimumOrderAmount: Number(discount.minimum_order_amount) || 0,
                applicability: discount.applicability,
                conditionalRule: discount.conditional_rule,
                conditionalParameters: discount.conditional_parameters
            };
            
            console.log('SUCCESS: Processed discount:', processedDiscount);
            return processedDiscount;
        });
        
        // Create a lookup map for business names
        businessesData = {};
        businesses.forEach(business => {
            const id = business.businessId || business.id;
            if (id) {
                businessesData[id] = {
                    id: id,
                    name: business.businessName || business.name || `Business ${id.substring(0, 8)}`,
                    businessName: business.businessName || business.name,
                    email: business.email || business.businessEmail,
                    phone: business.phoneNumber || business.phone,
                    status: business.status || business.isActive
                };
            }
        });
        
        console.log('INFO: Final processing results:');
        console.log(`- Merchant discounts: ${merchantDiscounts.length}`);
        console.log(`- Businesses data: ${Object.keys(businessesData).length}`);
        console.log('- Sample businessesData keys:', Object.keys(businessesData).slice(0, 5));
        
        // Update stats
        updateMerchantDiscountStats();
        
        // Render table
        renderMerchantDiscountsTable();
        
        console.log('SUCCESS: loadMerchantDiscounts completed successfully');
        
    } catch (error) {
        console.error('ERROR: Critical error in loadMerchantDiscounts:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            dataServiceAvailable: !!window.dataService,
            discountsLength: merchantDiscounts.length,
            businessesDataKeys: Object.keys(businessesData)
        });
        
        // Re-throw the error so it can be caught by the retry logic
        throw error;
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
    
    // Load fresh data with retry logic
    await loadMerchantDiscountsWithRetry();
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
        console.log('🎨 Rendering discount:', discount);
        
        const merchantName = getMerchantName(discount.businessId);
        const discountValue = formatDiscountValue(discount);
        const validUntil = discount.validTo ? new Date(discount.validTo).toLocaleDateString() : 'No expiry';
        const usage = discount.usageLimit ? `${discount.usageCount} / ${discount.usageLimit}` : (discount.usageCount || 0).toString();
        
        console.log(`🎨 Rendering: ${discount.title} for ${merchantName} (${discountValue})`);
        
        return `
            <tr>
                <td>
                    <div class="promotion-info">
                        <div class="promotion-icon">
                            <i class="fas fa-tag"></i>
    alert('Contact merchant functionality would be implemented here');
}

// Debug function for merchant discounts - can be called from browser console
window.debugMerchantDiscounts = async function() {
    console.log('DEBUG: === MERCHANT DISCOUNTS DEBUG START ===');
    
    // Clear debug panel
    const debugContent = document.getElementById('debugContent');
    if (debugContent) {
        debugContent.innerHTML = '';
    }
    showDebugInfo('DEBUG: === MERCHANT DISCOUNTS DEBUG START ===');
    
    try {
        // Test 1: Check if data service exists
        console.log('STEP Checking data service availability...');
        showDebugInfo('STEP Checking data service availability...');
        if (!window.dataService) {
            console.error('ERROR: window.dataService is not available');
            showDebugInfo('ERROR: window.dataService is not available');
            return;
        }
        console.log('SUCCESS: Data service is available');
        showDebugInfo('SUCCESS: Data service is available');
        
        // Test 2: Initialize data service
        console.log('STEP Initializing data service...');
        showDebugInfo('STEP Initializing data service...');
        await window.dataService.initialize();
        console.log('SUCCESS: Data service initialized');
        showDebugInfo('SUCCESS: Data service initialized');
        
        // Test 3: Test direct scan of discounts table
        console.log('STEP Testing direct scan of discounts table...');
        showDebugInfo('STEP Testing direct scan of discounts table...');
        const scanResult = await window.dataService.scan('WhizzMerchants_Discounts', { Limit: 5 });
        console.log('SUCCESS: Direct scan result:', scanResult);
        showDebugInfo(`SUCCESS: Direct scan found ${scanResult.Items?.length || 0} raw items`);
        console.log(`Found ${scanResult.Items?.length || 0} raw items`);
        if (scanResult.Items && scanResult.Items.length > 0) {
            console.log('First raw item:', JSON.stringify(scanResult.Items[0], null, 2));
            showDebugInfo(`INFO: First item keys: ${Object.keys(scanResult.Items[0]).join(', ')}`);
            showDebugInfo(`INFO: First item businessId: ${scanResult.Items[0].businessId}`);
            showDebugInfo(`INFO: First item title: ${scanResult.Items[0].title}`);
        }
        
        // Test 4: Test getMerchantDiscounts method
        console.log('STEP Testing getMerchantDiscounts method...');
        showDebugInfo('STEP Testing getMerchantDiscounts method...');
        const discounts = await window.dataService.getMerchantDiscounts(false);
        console.log('SUCCESS: getMerchantDiscounts result:', discounts);
        showDebugInfo(`SUCCESS: getMerchantDiscounts returned ${discounts.length} items`);
        console.log(`Mapped ${discounts.length} discount items`);
        if (discounts.length > 0) {
            console.log('First mapped discount:', JSON.stringify(discounts[0], null, 2));
            showDebugInfo(`INFO: First mapped discount: ${JSON.stringify(discounts[0], null, 2)}`);
        }
        
        // Test 5: Test businesses loading
        console.log('STEP Testing businesses loading...');
        showDebugInfo('STEP Testing businesses loading...');
        const businesses = await window.dataService.getBusinesses(false);
        console.log('SUCCESS: Businesses result:', businesses);
        showDebugInfo(`SUCCESS: Found ${businesses.length} businesses`);
        console.log(`Found ${businesses.length} businesses`);
        if (businesses.length > 0) {
            console.log('First business:', JSON.stringify(businesses[0], null, 2));
            showDebugInfo(`INFO: First business: ${businesses[0].businessName || businesses[0].name || 'No name'}`);
        }
        
        // Test 6: Force reload merchant discounts
        console.log('STEP Force reloading merchant discounts...');
        showDebugInfo('STEP Force reloading merchant discounts...');
        await loadMerchantDiscounts();
        console.log('SUCCESS: Force reload completed');
        showDebugInfo(`SUCCESS: Force reload completed - Final count: ${merchantDiscounts.length}`);
        
        console.log('DEBUG: === MERCHANT DISCOUNTS DEBUG END ===');
        showDebugInfo('DEBUG: === MERCHANT DISCOUNTS DEBUG END ===');
        
    } catch (error) {
        console.error('ERROR: Debug function error:', error);
        showDebugInfo(`ERROR: Debug function error: ${error.message}`);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
    }
};

// Manual refresh function for testing
window.testMerchantDiscounts = async function() {
    console.log('🧪 Manual test of merchant discounts loading...');
    try {
        await refreshMerchantDiscounts();
        console.log('SUCCESS: Manual test completed successfully');
    } catch (error) {
        console.error('ERROR: Manual test failed:', error);
    }
};

// Show debug info in UI
function showDebugInfo(message) {
    const debugPanel = document.getElementById('debugInfo');
    const debugContent = document.getElementById('debugContent');
    if (debugPanel && debugContent) {
        debugContent.innerHTML += message + '<br>';
        debugPanel.style.display = 'block';
    }
}

// Simple AWS credentials test
window.testAWSConnection = async function() {
    console.log('DEBUG: Testing AWS connection and credentials...');
    showDebugInfo('DEBUG: Testing AWS connection and credentials...');
    try {
        if (!window.AWSUtils) {
            console.error('ERROR: AWSUtils not available');
            showDebugInfo('ERROR: AWSUtils not available');
            return;
        }
        
        console.log('🔐 Initializing AWS...');
        showDebugInfo('🔐 Initializing AWS...');
        await AWSUtils.initialize();
        console.log('SUCCESS: AWS initialized successfully');
        showDebugInfo('SUCCESS: AWS initialized successfully');
        
        const dynamoDB = await AWSUtils.getDynamoDBClient();
        console.log('SUCCESS: DynamoDB client obtained:', !!dynamoDB);
        showDebugInfo(`SUCCESS: DynamoDB client obtained: ${!!dynamoDB}`);
        
        // Try to list tables to test permissions
        console.log('INFO: Testing table access...');
        showDebugInfo('INFO: Testing table access...');
        const params = { TableName: 'WhizzMerchants_Discounts', Limit: 1 };
        const result = await dynamoDB.scan(params).promise();
        console.log('SUCCESS: Table scan successful:', result);
        showDebugInfo(`SUCCESS: Table scan successful: Found ${result.Items?.length || 0} items`);
        console.log(`Found ${result.Items?.length || 0} items in first scan`);
        
        return result;
    } catch (error) {
        console.error('ERROR: AWS connection test failed:', error);
        showDebugInfo(`ERROR: AWS connection test failed: ${error.message}`);
        return null;
    }
};

// Initialize promotions page when DOM is ready
