// Promotions Management JavaScript - Clean Version

// Global variables
let promotions = [];
let merchantDiscounts = [];
// New: Promotions filter state
let promotionFilterQuery = '';
let promotionFilterStatus = '';
let promotionFilterType = '';

// Use centralized AWS utilities
const PROMOTIONS_TABLE = 'WizzPromo_promos_dev';

// Ensure debug unauth mode is enabled in local/dev when no idToken is present
(function bootstrapDebugMode() {
    try {
        const hasIdToken = !!sessionStorage.getItem('idToken');
        const params = new URLSearchParams(window.location.search || '');
        const debugParam = params.get('debug') === '1' || params.get('unauth') === '1' || params.get('debugForceUnauth') === '1';
        const onLocalhost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (!hasIdToken && (debugParam || onLocalhost)) {
            console.warn('Enabling debugMode for unauthenticated AWS access (no idToken detected)');
            sessionStorage.setItem('debugMode', 'true');
        }
    } catch (_) { /* no-op */ }
})();

// Initialize the promotions page
function initializePromotionsPage() {
    console.log('INFO: Initializing promotions page...');
    
    // Optional: show banner when operating in unauth debug mode
    try {
        const hasIdToken = !!sessionStorage.getItem('idToken');
        const debugMode = sessionStorage.getItem('debugMode') === 'true';
        if (!hasIdToken && debugMode) {
            renderAuthBanner();
        }
    } catch (_) {}
    
    // Initialize form submission handler
    setupFormHandlers();
    // New: bind filters/search
    setupPromotionFilters();
    
    // Initialize data loading
    loadAllData().then(() => {
        console.log('INFO: Data loading completed in initializePromotionsPage');
        
        // If no promotions exist, offer to create a sample one for testing
        if (promotions.length === 0) {
            console.log('INFO: No promotions found. To test the display, you can create a sample promotion.');
            // Show helpful message in console for development
            console.log('💡 Run this in console to create a test promotion: window.createTestPromotion()');
        }
    }).catch(error => {
        console.error('ERROR: Data loading failed:', error);
    });
}

// Inject a lightweight banner to guide users when unauth debug mode is active
function renderAuthBanner() {
    const container = document.querySelector('.page-content');
    if (!container) return;
    if (document.getElementById('aws-auth-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'aws-auth-banner';
    banner.style.cssText = 'margin-bottom:12px;padding:10px 12px;border-left:4px solid #f59e0b;background:#fff8e1;border-radius:6px;color:#7a5c00;font-size:13px;';
    banner.innerHTML = '<strong>Running in debug unauth mode.</strong> Some actions require login. Use Test AWS/Debug to verify access.';
    container.prepend(banner);
}

// Setup form event handlers
function setupFormHandlers() {
    const addPromotionForm = document.getElementById('addPromotionForm');
    if (addPromotionForm) {
        addPromotionForm.addEventListener('submit', handleAddPromotion);
    }

    // Setup edit form if it exists
    const editPromotionForm = document.getElementById('editPromotionForm');
    if (editPromotionForm) {
        editPromotionForm.addEventListener('submit', handleEditPromotion);
    }
}

// New: Setup search and filters for promotions table
function setupPromotionFilters() {
    const searchEl = document.getElementById('searchInput');
    const statusEl = document.getElementById('statusFilter');
    const typeEl = document.getElementById('typeFilter');

    // Debounce helper
    const debounce = (fn, wait = 250) => {
        let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
    };

    if (searchEl) {
        const onSearch = debounce((e) => {
            promotionFilterQuery = (e.target.value || '').trim().toLowerCase();
            updatePromotionsTable();
        }, 200);
        searchEl.addEventListener('input', onSearch);
    }
    if (statusEl) {
        statusEl.addEventListener('change', (e) => {
            promotionFilterStatus = (e.target.value || '').trim().toLowerCase();
            updatePromotionsTable();
        });
    }
    if (typeEl) {
        typeEl.addEventListener('change', (e) => {
            promotionFilterType = (e.target.value || '').trim().toLowerCase();
            updatePromotionsTable();
        });
    }
}

// Load all data (promotions and discounts) - optimized for faster loading
async function loadAllData() {
    console.log('INFO: Loading all promotion data (optimized)...');
    
    // Load platform discounts first (fastest) and display immediately
    await loadPlatformDiscountsData();
    console.log('INFO: Platform discounts loaded, table should now show data');
    
    // Load backend promotions and merchant discounts in parallel
    // These will merge with platform discounts without overwriting them
    const [backendPromise, merchantPromise] = [
        loadPromotionsData(),
        loadMerchantDiscountsData()
    ];
    
    const results = await Promise.allSettled([backendPromise, merchantPromise]);
    
    // Log results for debugging
    results.forEach((result, index) => {
        const name = index === 0 ? 'backend promotions' : 'merchant discounts';
        if (result.status === 'fulfilled') {
            console.log(`✅ Successfully loaded ${name}`);
        } else {
            console.log(`⚠️ ${name} loading failed: ${result.reason?.message || 'Unknown error'}`);
        }
    });
    
    console.log(`INFO: Data loading complete. Total promotions: ${promotions.length}`);
}

// Load promotions data from backend API
async function loadPromotionsData() {
    const tbody = document.getElementById('promotionsTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding: 2rem;">Loading promotions...</td></tr>';
    }
    
    try {
        const idToken = sessionStorage.getItem('idToken');
        console.log('DEBUG: Loading promotions from API...');
        
        const urlLoad = window.WIZZCENTRAL_CONFIG.API_BASE_URL + '/promotions';
        const headersLoad = { 'Authorization': 'Bearer ' + idToken };
        const response = await fetch(urlLoad, { headers: headersLoad });
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error?.message || 'Failed to load promotions');
        }
        
        const backendPromos = result.data.promotions || [];
        const mapped = backendPromos.map(p => ({
            id: p.promotionId,
            title: p.name,
            code: p.code,
            type: normalizeType(p.type),
            value: p.value,
            status: p.isActive ? 'active' : (new Date() < new Date(p.startDate) ? 'scheduled' : 'expired'),
            usage: p.currentUsage || 0,
            limit: p.usageLimit || 0,
            startDate: p.startDate || 'N/A',
            endDate: p.endDate || 'N/A',
            description: p.description,
            minOrderValue: p.minOrderAmount || 0,
            source: 'backend'
        }));
        
        // Merge with any existing platform entries instead of overwriting
        const existing = Array.isArray(promotions) ? promotions : [];
        const platformOnly = existing.filter(p => p.source === 'platform');
        const combined = [...platformOnly, ...mapped];
        // Deduplicate by id, preferring later entries
        const dedup = Object.values(combined.reduce((acc, item) => { acc[item.id || ('noid_' + Math.random())] = item; return acc; }, {}));
        promotions = dedup;
        
        console.log('SUCCESS: Loaded ' + mapped.length + ' backend promotions; total combined: ' + promotions.length);
        
    } catch (error) {
        console.error('Error loading promotions from backend:', error);
        console.log('INFO: Backend API not available, continuing with platform discounts only');
        
        // Don't show error in table, just log it and continue with platform discounts
        // Keep any existing platform promotions
        const existing = Array.isArray(promotions) ? promotions : [];
        const platformOnly = existing.filter(p => p.source === 'platform');
        promotions = platformOnly;
        
        console.log('INFO: Using platform discounts only - total promotions: ' + promotions.length);
    }
    
    updatePromotionsTable();
}

// Load platform discounts data from DynamoDB
async function loadPlatformDiscountsData() {
    console.log('INFO: Loading platform discounts from DynamoDB...');
    
    try {
        if (!window.dataService) {
            console.log('WARNING: DataService not available, skipping platform discounts');
            return;
        }
        
        const platformDiscounts = await window.dataService.getPlatformDiscounts();
        console.log('SUCCESS: Loaded ' + platformDiscounts.length + ' platform discounts');
        
        // Convert platform discounts to promotion format for display
        const platformPromos = platformDiscounts.map(discount => {
            const startDate = discount.startDate || 'N/A';
            const endDate = discount.endDate || 'N/A';
            return {
                id: discount.discountId,
                title: discount.name || discount.title || 'Untitled',
                code: discount.code || 'N/A',
                type: normalizeType(discount.type),
                value: firstNumber(discount.value, discount.discountAmount),
                status: computeStatus(startDate, endDate, discount.isActive),
                usage: firstNumber(discount.usage, discount.currentUsage, 0),
                limit: firstNumber(discount.limit, discount.usageLimit, 0),
                startDate,
                endDate,
                description: discount.description || '',
                minOrderValue: firstNumber(discount.minOrderValue, discount.minOrderAmount, 0),
                source: 'platform'
            };
        });
        
        // Merge into promotions (keep any existing backend entries)
        const existing = Array.isArray(promotions) ? promotions : [];
        const backendOnly = existing.filter(p => p.source === 'backend');
        const combined = [...platformPromos, ...backendOnly];
        const dedup = Object.values(combined.reduce((acc, item) => { acc[item.id || ('noid_' + Math.random())] = item; return acc; }, {}));
        promotions = dedup;
        
    } catch (error) {
        console.error('Error loading platform discounts:', error);
    }
    
    updatePromotionsTable();
}

// Load merchant discounts data from DynamoDB
async function loadMerchantDiscountsData() {
    console.log('INFO: Loading merchant discounts...');
    
    try {
        if (!window.dataService) {
            console.log('WARNING: DataService not available, retrying...');
            await waitForDataService();
        }
        
        // Get processed merchant discounts
        const discounts = await window.dataService.getMerchantDiscounts();
        console.log('SUCCESS: getMerchantDiscounts returned ' + discounts.length + ' items');

        // Optionally enrich with business names when not present
        let businessMap = {};
        try {
            const businesses = await (window.dataService.getAllBusinesses?.() || window.dataService.getBusinesses());
            (businesses || []).forEach(b => {
                const id = b.businessId || b.id || b._id || b.pk || b.key;
                const name = b.businessName || b.name || b.title || 'Business';
                if (id) businessMap[id] = name;
            });
        } catch (e) {
            console.warn('WARN: Failed to load businesses for name mapping:', e?.message || e);
        }
        
        // Store merchant discounts
        merchantDiscounts = (discounts || []).map(d => {
            const businessId = d.businessId || d.merchantId || d.merchant || '';
            const merchantName = d.merchantName || d.businessName || businessMap[businessId] || 'Unknown Merchant';
            return {
                id: d.discountId || d.id || d.code || 'md_' + Math.random().toString(36).slice(2),
                title: d.title || d.name || 'Untitled',
                businessId,
                merchantName,
                type: normalizeType(d.type),
                value: firstNumber(d.value, d.discountAmount, 0),
                isActive: truthy(d.isActive),
                usage: firstNumber(d.usage, d.currentUsage, 0),
                limit: firstNumber(d.limit, d.usageLimit, 0),
                startDate: d.startDate || 'N/A',
                endDate: d.endDate || 'N/A',
            };
        });
        console.log('SUCCESS: Mapped merchant discounts - Final count: ' + merchantDiscounts.length);
        
    } catch (error) {
        console.error('ERROR: Loading merchant discounts failed:', error.message);
        merchantDiscounts = [];
    }
    
    updateMerchantDiscountsTable();
}

// Wait for data service to be available
async function waitForDataService() {
    let retries = 10;
    const retryDelay = 1000;
    
    while (retries > 0 && !window.dataService) {
        console.log('INFO: Waiting for data service to be available...');
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retries--;
    }
    
    if (!window.dataService) {
        console.error('ERROR: All retry attempts failed');
        throw new Error('Data service not available');
    }
    
    console.log('Waiting ' + retryDelay + 'ms before retry...');
}

// Helpers
function normalizeType(t) {
    const v = (t || '').toString().toLowerCase();
    if (v === 'fixed_amount' || v === 'fixed' || v === 'amount') return 'fixed';
    if (v === 'percentage' || v === 'percent' || v === '%') return 'percentage';
    // Default to percentage for unknown types in platform scope
    return 'percentage';
}
function firstNumber(...vals) {
    for (const v of vals) {
        if (v === undefined || v === null) continue;
        const n = typeof v === 'number' ? v : Number(v);
        if (!Number.isNaN(n)) return n;
    }
    return 0;
}
function truthy(v) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return ['true', '1', 'yes', 'active'].includes(v.toLowerCase());
    if (typeof v === 'number') return v > 0;
    return false;
}
function computeStatus(start, end, isActive) {
    try {
        if (isActive === false) return 'inactive';
        const now = Date.now();
        const s = start ? new Date(start).getTime() : null;
        const e = end ? new Date(end).getTime() : null;
        if (s && now < s) return 'scheduled';
        if (e && now > e) return 'expired';
        return truthy(isActive) ? 'active' : 'inactive';
    } catch (_) { return truthy(isActive) ? 'active' : 'inactive'; }
}
function formatDateTimeDisplay(val) {
    if (!val || val === 'N/A') return 'N/A';
    try {
        const d = (val instanceof Date) ? val : new Date(val);
        if (Number.isNaN(d.getTime())) return String(val);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${da} ${hh}:${mm}`;
    } catch (_) {
        return String(val);
    }
}
// New helper: format to datetime-local value
function formatDateTimeLocal(val, fallbackDays = 0) {
    try {
        let d = val && val !== 'N/A' ? new Date(val) : new Date();
        if (fallbackDays) d = new Date(d.getTime() + fallbackDays * 24 * 60 * 60 * 1000);
        if (Number.isNaN(d.getTime())) d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${da}T${hh}:${mm}`;
    } catch (_) {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${da}T${hh}:${mm}`;
    }
}

// New: return promotions filtered by current filter state
function getFilteredPromotions() {
    const q = promotionFilterQuery;
    const statusFilter = promotionFilterStatus === 'draft' ? 'inactive' : promotionFilterStatus; // map UI "draft" to internal "inactive"
    const typeFilter = promotionFilterType === 'fixed_amount' ? 'fixed' : promotionFilterType; // map fixed_amount to fixed

    let list = Array.isArray(promotions) ? promotions.slice() : [];

    if (q) {
        list = list.filter(p => {
            const title = (p.title || '').toLowerCase();
            const code = (p.code || '').toLowerCase();
            const desc = (p.description || '').toLowerCase();
            const type = (p.type || '').toLowerCase();
            return title.includes(q) || code.includes(q) || desc.includes(q) || type.includes(q);
        });
    }

    if (statusFilter) {
        list = list.filter(p => (p.status || '').toLowerCase() === statusFilter);
    }

    if (typeFilter) {
        list = list.filter(p => (p.type || '').toLowerCase() === typeFilter);
    }

    return list;
}

// Update promotions table display
function updatePromotionsTable() {
    console.log(`INFO: updatePromotionsTable called with ${promotions.length} promotions`);
    
    const tbody = document.getElementById('promotionsTableBody');
    if (!tbody) {
        console.warn('WARNING: promotionsTableBody element not found');
        return;
    }
    
    // New: apply filters
    const list = getFilteredPromotions();
    console.log(`INFO: After filtering: ${list.length} promotions to display`);
    
    if (!list || list.length === 0) {
        const emptyMsg = promotions.length === 0 ? 'No promotions found' : 'No promotions match current filters';
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">' + emptyMsg + '</td></tr>';
        console.log(`INFO: Displaying empty message: ${emptyMsg}`);
        return;
    }
    
    console.log('INFO: Rendering promotions table with data:', list.map(p => ({ id: p.id, title: p.title, source: p.source })));
    
    tbody.innerHTML = list.map(promo => {
        const statusClass = promo.status === 'active' ? 'success' : 
                           promo.status === 'scheduled' ? 'warning' : 'danger';
        const discountDisplay = promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value}`;
        const sourceBadge = promo.source === 'platform' ? '<span class="badge bg-info" style="margin-left:6px;">Platform</span>' : '';
        const startDisp = formatDateTimeDisplay(promo.startDate);
        const endDisp = formatDateTimeDisplay(promo.endDate);
        
        return '<tr>' +
            '<td>' + (promo.title || 'N/A') + sourceBadge + '</td>' +
            '<td>' + (promo.type || 'N/A') + '</td>' +
            '<td>' + discountDisplay + '</td>' +
            '<td><span class="badge bg-' + statusClass + '">' + promo.status + '</span></td>' +
            '<td>' + (promo.usage || 0) + '/' + (promo.limit || 0) + '</td>' +
            '<td>' + startDisp + '</td>' +
            '<td>' + endDisp + '</td>' +
            '<td>' +
                '<button class="btn btn-sm btn-primary me-1" onclick="editPromotion(\'' + promo.id + '\')">Edit</button>' +
                '<button class="btn btn-sm btn-danger" onclick="deletePromotion(\'' + promo.id + '\')">Delete</button>' +
            '</td>' +
        '</tr>';
    }).join('');
    
    console.log('✅ Promotions table updated successfully');
}

// Update merchant discounts table display
function updateMerchantDiscountsTable() {
    const tbody = document.getElementById('merchantDiscountsTableBody');
    if (!tbody) return;
    
    const totalEl = document.getElementById('totalMerchantDiscounts');
    const activeEl = document.getElementById('activeMerchantDiscounts');

    if (!merchantDiscounts || merchantDiscounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No merchant discounts found</td></tr>';
        if (totalEl) totalEl.textContent = '0';
        if (activeEl) activeEl.textContent = '0';
        return;
    }

    if (totalEl) totalEl.textContent = String(merchantDiscounts.length);
    if (activeEl) activeEl.textContent = String(merchantDiscounts.filter(d => d.isActive).length);
    
    tbody.innerHTML = merchantDiscounts.map(discount => {
        const discountValue = discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`;
        const status = discount.isActive ? 'Active' : 'Inactive';
        const endDisp = formatDateTimeDisplay(discount.endDate);
        return '<tr>' +
            '<td>' + (discount.title || 'N/A') + '</td>' +
            '<td>' + (discount.merchantName || 'Unknown Merchant') + '</td>' +
            '<td>' + (discount.type || 'N/A') + '</td>' +
            '<td>' + discountValue + '</td>' +
            '<td>' + status + '</td>' +
            '<td>' + (discount.usage || 0) + '/' + (discount.limit || 0) + '</td>' +
            '<td>' + endDisp + '</td>' +
            '<td>' +
                '<button class="btn btn-sm btn-primary me-1" onclick="editDiscount(\'' + discount.id + '\')">Edit</button>' +
                '<button class="btn btn-sm btn-danger" onclick="deleteDiscount(\'' + discount.id + '\')">Delete</button>' +
            '</td>' +
        '</tr>';
    }).join('');
}

// Handle form submission for adding new promotions (Platform Discount) - optimized
async function handleAddPromotion(event) {
    event.preventDefault();
    
    console.log('INFO: Creating platform discount (optimized)...');
    const startTime = Date.now();
    
    try {
        // Get form data
        const formData = new FormData(event.target);
        const nowIso = new Date().toISOString();
        const type = normalizeType(formData.get('type'));
        const value = Number(formData.get('value'));
        const minOrder = Number(formData.get('minOrder') || 0);
        const limit = Number(formData.get('limit') || 0);

        // Build minimal discount data (only required fields)
        const promotionData = {
            discountId: 'platform_' + Date.now(),
            title: formData.get('title'),
            name: formData.get('title'),
            description: formData.get('description'),
            type,
            value,
            code: String(formData.get('code') || ''),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            isActive: true,
            usage: 0,
            currentUsage: 0,
            limit,
            discountSource: 'platform',
            createdAt: nowIso,
            updatedAt: nowIso
        };

        // Add optional fields only if meaningful
        if (minOrder > 0) {
            promotionData.minOrderValue = minOrder;
            promotionData.minOrderAmount = minOrder;
        }
        if (limit > 0) {
            promotionData.usageLimit = limit;
        }
        
        console.log('Creating platform discount with optimized data structure');
        
        // Create platform discount using dataService
        if (!window.dataService) {
            throw new Error('Data service not available');
        }
        
        const result = await window.dataService.createPlatformDiscount(promotionData);
        const duration = Date.now() - startTime;
        console.log(`Platform discount created successfully in ${duration}ms:`, result);
        
        // Close modal (custom modal, not Bootstrap)
        const modalEl = document.getElementById('addPromotionModal');
        if (modalEl) modalEl.style.display = 'none';
        
        // Reset form
        event.target.reset();
        
        // Quick refresh: just add the new item to the existing promotions array
        const newPromo = {
            id: result.discountId,
            title: promotionData.title,
            code: promotionData.code || 'N/A',
            type: promotionData.type,
            value: promotionData.value,
            status: 'active',
            usage: 0,
            limit: promotionData.limit || 0,
            startDate: promotionData.startDate || 'N/A',
            endDate: promotionData.endDate || 'N/A',
            description: promotionData.description || '',
            minOrderValue: promotionData.minOrderValue || 0,
            source: 'platform'
        };
        
        // Add to beginning of promotions array for immediate display
        promotions.unshift(newPromo);
        updatePromotionsTable();
        
        // Show success message
        showSuccessMessage(`Platform discount created successfully in ${duration}ms!`);
        
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`Error creating platform discount after ${duration}ms:`, error);
        showErrorMessage('Error creating platform discount: ' + error.message);
    }
}

// Handle form submission for editing promotions
async function handleEditPromotion(event) {
    event.preventDefault();
    console.log('INFO: Editing promotion...');
    // TODO: Implement edit functionality
}

// Helper function to extract DynamoDB attribute values
function extractValue(item) {
    if (!item) return null;
    
    const result = {};
    for (const [key, value] of Object.entries(item)) {
        if (value.S) result[key] = value.S;
        else if (value.N) result[key] = parseFloat(value.N);
        else if (value.BOOL) result[key] = value.BOOL;
        else if (value.SS) result[key] = value.SS;
        else if (value.NS) result[key] = value.NS.map(n => parseFloat(n));
        else result[key] = value;
    }
    return result;
}

// Show success message
function showSuccessMessage(message) {
    console.log('SUCCESS: ' + message);
    try { window.ModalManager?.success(message); } catch (_) {}
}

// Show error message
function showErrorMessage(message) {
    console.error('ERROR: ' + message);
    try { window.ModalManager?.error(message); } catch (_) {}
}

// Build and open edit modal for platform promotions
function openPlatformEditModal(item) {
    const isActive = item.status === 'active';
    const startVal = formatDateTimeLocal(item.startDate);
    const endVal = formatDateTimeLocal(item.endDate, item.startDate ? 0 : 7);

    const content = `
      <form id="platformEditForm" class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="grid-column:1/-1">
          <label style="display:block;margin-bottom:4px;">Title</label>
          <input type="text" id="ep_title" value="${(item.title || '').replace(/"/g, '&quot;')}" required />
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;">Type</label>
          <select id="ep_type" required>
            <option value="percentage" ${item.type === 'percentage' ? 'selected' : ''}>Percentage</option>
            <option value="fixed" ${item.type === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
          </select>
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;">Value</label>
          <input type="number" id="ep_value" min="0" step="0.01" value="${Number(item.value ?? 0)}" required />
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;">Usage Limit</label>
          <input type="number" id="ep_limit" min="0" step="1" value="${Number(item.limit ?? 0)}" />
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;">Min Order Value</label>
          <input type="number" id="ep_minOrder" min="0" step="0.01" value="${Number(item.minOrderValue ?? 0)}" />
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;">Start</label>
          <input type="datetime-local" id="ep_start" step="60" value="${startVal}" />
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;">End</label>
          <input type="datetime-local" id="ep_end" step="60" value="${endVal}" />
        </div>
        <div style="grid-column:1/-1;display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="ep_active" ${isActive ? 'checked' : ''} />
          <label for="ep_active">Active</label>
        </div>
      </form>
    `;

    const modal = window.ModalManager?.showModal({
        title: 'Edit Platform Promotion',
        content,
        size: 'large',
        buttons: [
          { text: 'Cancel', action: (e, { close }) => close() },
          { text: 'Save Changes', primary: true, action: async (e, { close }) => {
              try {
                const title = document.getElementById('ep_title').value.trim();
                const type = normalizeType(document.getElementById('ep_type').value);
                const value = Number(document.getElementById('ep_value').value || 0);
                const limit = Number(document.getElementById('ep_limit').value || 0);
                const minOrder = Number(document.getElementById('ep_minOrder').value || 0);
                const startDate = (document.getElementById('ep_start').value || '').trim();
                const endDate = (document.getElementById('ep_end').value || '').trim();
                const active = !!document.getElementById('ep_active').checked;

                if (!title) return showErrorMessage('Title is required');
                if (!type) return showErrorMessage('Type is required');
                if (value < 0) return showErrorMessage('Value must be >= 0');
                if (startDate && endDate && endDate < startDate) return showErrorMessage('End must be after Start');

                await waitForDataService();
                const updates = {
                    title,
                    name: title,
                    type,
                    value,
                    limit,
                    usageLimit: limit,
                    minOrderValue: minOrder,
                    minOrderAmount: minOrder,
                    startDate: startDate || null,
                    endDate: endDate || null,
                    isActive: active
                };

                await window.dataService.updatePlatformDiscount(item.id, updates);

                // Update local copy
                const idx = promotions.findIndex(p => p.id === item.id);
                if (idx !== -1) {
                    const updated = { ...promotions[idx], ...updates };
                    updated.status = computeStatus(updated.startDate, updated.endDate, updated.isActive);
                    promotions[idx] = updated;
                }
                updatePromotionsTable();
                close();
                showSuccessMessage('Platform promotion updated');
              } catch (err) {
                showErrorMessage(err?.message || 'Failed to update promotion');
              }
          } }
        ]
    });

    // Ensure ep_end >= ep_start if user changes start
    setTimeout(() => {
        const s = document.getElementById('ep_start');
        const e = document.getElementById('ep_end');
        if (s && e) {
            s.addEventListener('change', () => { if (e.value && e.value < s.value) e.value = s.value; });
        }
    }, 0);

    return modal;
}

// New: Build and open edit modal for merchant discounts
function openMerchantEditModal(item) {
    const content = `
      <form id="merchantEditForm" class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="display:block;margin-bottom:4px;">Active</label>
          <label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="md_active" ${item.isActive ? 'checked' : ''}/> <span>Enable</span></label>
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;">Value</label>
          <input type="number" id="md_value" min="0" step="0.01" value="${Number(item.value ?? 0)}" required />
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;">Usage Limit</label>
          <input type="number" id="md_limit" min="0" step="1" value="${Number(item.limit ?? 0)}" />
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;">End</label>
          <input type="datetime-local" id="md_end" step="60" value="${formatDateTimeLocal(item.endDate, item.endDate ? 0 : 7)}" />
        </div>
      </form>
    `;

    window.ModalManager?.showModal({
      title: `Edit Merchant Discount — ${item.merchantName || ''}`.trim(),
      content,
      size: 'large',
      buttons: [
        { text: 'Cancel', action: (e, { close }) => close() },
        { text: 'Save Changes', primary: true, action: async (e, { close }) => {
            try {
              const isActive = !!document.getElementById('md_active').checked;
              const value = Number(document.getElementById('md_value').value || 0);
              const limit = Number(document.getElementById('md_limit').value || 0);
              const endDate = (document.getElementById('md_end').value || '').trim();

              if (value < 0) return showErrorMessage('Value must be >= 0');

              await waitForDataService();
              const updates = {
                isActive,
                value,
                limit,
                usageLimit: limit,
                endDate: endDate || null,
              };

              await window.dataService.updateMerchantDiscount(item.id, updates);
              const idx = merchantDiscounts.findIndex(d => d.id === item.id);
              if (idx !== -1) merchantDiscounts[idx] = { ...merchantDiscounts[idx], ...updates };
              updateMerchantDiscountsTable();
              close();
              showSuccessMessage('Merchant discount updated');
            } catch (err) {
              showErrorMessage(err?.message || 'Failed to update discount');
            }
        }}
      ]
    });
}

// Debug helpers exposed to window
window.refreshMerchantDiscounts = async function () {
    console.log('ACTION: Refresh merchant discounts clicked');
    await loadMerchantDiscountsData();
};

window.debugMerchantDiscounts = async function () {
    try {
        const debugPanel = document.getElementById('debugInfo');
        const debugContent = document.getElementById('debugContent');
        if (debugPanel) debugPanel.style.display = 'block';
        if (debugContent) debugContent.textContent = 'Scanning tables...';

        await waitForDataService();
        const scanResult = await window.dataService.scan('WhizzMerchants_Discounts', { Limit: 5 });
        const items = scanResult.Items || [];
        if (debugContent) debugContent.textContent = JSON.stringify(items, null, 2);
        console.log('DEBUG: First 5 merchant discounts:', items);
    } catch (e) {
        console.error('DEBUG ERROR:', e);
    }
};

// Debug function to test AWS connection
async function testAWSConnection() {
    console.log('INFO: Testing AWS connection...');
    
    try {
        console.log('INFO: Initializing AWS...');
        
        if (!window.dataService) {
            throw new Error('DataService not available');
        }
        
        // Test DynamoDB connection
        const dynamoDB = await window.dataService.getDynamoDBClient?.();
        console.log('SUCCESS: DynamoDB client obtained: ' + !!dynamoDB);
        
        // Test table scan
        const result = await window.dataService.scan('WhizzMerchants_Discounts', { Limit: 1 });
        console.log('SUCCESS: Table scan successful: Found ' + (result.Items?.length || 0) + ' items');
        console.log('Found ' + (result.Items?.length || 0) + ' items in first scan');
        
        return true;
        
    } catch (error) {
        console.error('ERROR: AWS connection test failed:', error.message);
        return false;
    }
}
// ensure accessible from onclick
window.testAWSConnection = testAWSConnection;

// Helper function to create a test promotion for debugging
window.createTestPromotion = async function() {
    console.log('🎯 Creating test promotion...');
    
    try {
        await waitForDataService();
        
        const testPromotion = {
            discountId: 'test_debug_' + Date.now(),
            title: 'Debug Test Promotion',
            name: 'Debug Test Promotion',
            description: 'Test promotion created for debugging the display issue',
            type: 'percentage',
            value: 10,
            code: 'DEBUG10',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            usage: 0,
            currentUsage: 0,
            limit: 100,
            usageLimit: 100,
            minOrderValue: 20,
            minOrderAmount: 20,
            discountSource: 'platform',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const result = await window.dataService.createPlatformDiscount(testPromotion);
        
        if (result.success) {
            console.log('✅ Test promotion created successfully!');
            
            // Reload data to display the new promotion
            await loadAllData();
            
            console.log('🎉 Test promotion should now be visible in the table');
        } else {
            console.error('❌ Failed to create test promotion');
        }
        
    } catch (error) {
        console.error('❌ Error creating test promotion:', error);
    }
};

// Initialize promotions page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('INFO: DOM loaded, initializing promotions page...');
    initializePromotionsPage();
});

// Expose functions globally for onclick handlers
window.editPromotion = async function(id) {
    try {
        const item = promotions.find(p => p.id === id);
        if (!item) return;
        if (item.source !== 'platform') {
            showErrorMessage('Editing backend API promotions is not supported here.');
            return;
        }
        openPlatformEditModal(item);
    } catch (e) {
        showErrorMessage(e.message || 'Failed to open edit modal');
    }
};

window.deletePromotion = async function(id) {
    try {
        const item = promotions.find(p => p.id === id);
        if (!item) return;
        if (item.source !== 'platform') {
            showErrorMessage('Deleting backend API promotions is not supported here.');
            return;
        }
        const confirmed = await (window.ModalManager?.confirm('Delete this platform promotion? This cannot be undone.', 'Confirm Delete') || Promise.resolve(false));
        if (!confirmed) return;
        await waitForDataService();
        await window.dataService.deletePlatformDiscount(id);
        promotions = promotions.filter(p => p.id !== id);
        updatePromotionsTable();
        showSuccessMessage('Platform promotion deleted');
    } catch (e) {
        showErrorMessage(e.message || 'Failed to delete promotion');
    }
};

// Update merchant actions to use ModalManager
window.editDiscount = async function(id) {
    try {
        const item = merchantDiscounts.find(d => d.id === id);
        if (!item) return;
        openMerchantEditModal(item);
    } catch (e) {
        showErrorMessage(e.message || 'Failed to open edit modal');
    }
};
window.deleteDiscount = async function(id) {
    try {
        const item = merchantDiscounts.find(d => d.id === id);
        if (!item) return;
        const confirmed = await (window.ModalManager?.confirm('Delete this merchant discount? This cannot be undone.', 'Confirm Delete') || Promise.resolve(false));
        if (!confirmed) return;
        await waitForDataService();
        await window.dataService.deleteMerchantDiscount(id);
        merchantDiscounts = merchantDiscounts.filter(d => d.id !== id);
        updateMerchantDiscountsTable();
        showSuccessMessage('Merchant discount deleted');
    } catch (e) {
        showErrorMessage(e.message || 'Failed to delete discount');
    }
};
