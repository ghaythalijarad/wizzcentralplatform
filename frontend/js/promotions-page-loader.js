// Promotions Page Loader - Clean Implementation
// Loads and renders merchant discounts and special campaigns

(function() {
    'use strict';

    console.log('🎯 Promotions Page Loader initializing...');

    // Wait for DOM and dependencies
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPromotionsPage);
    } else {
        initPromotionsPage();
    }

    async function initPromotionsPage() {
        console.log('📋 Initializing Promotions Page...');

        try {
            // Wait for API dependencies to load
            await waitForDependencies();

            // Load both datasets in parallel
            await Promise.all([
                loadMerchantDiscounts(),
                loadSpecialCampaigns()
            ]);

            // Setup event listeners
            setupEventListeners();

            console.log('✅ Promotions Page initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize promotions page:', error);
            showErrorState();
        }
    }

    async function waitForDependencies() {
        console.log('⏳ Waiting for API dependencies...');
        
        const maxWait = 5000; // 5 seconds
        const checkInterval = 100;
        let elapsed = 0;

        while (elapsed < maxWait) {
            if (window.WizzMerchantDiscountsAPI && window.WizzCampaignsAPI) {
                console.log('✅ API dependencies loaded');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            elapsed += checkInterval;
        }

        throw new Error('API dependencies failed to load within timeout');
    }

    async function loadMerchantDiscounts() {
        console.log('📦 Loading merchant discounts...');
        
        const tbody = document.getElementById('merchant-discounts-tbody');
        const loadingRow = document.getElementById('discounts-loading-row');
        
        if (!tbody) {
            console.warn('⚠️ Merchant discounts table body not found');
            return;
        }

        try {
            // Initialize and fetch discounts
            console.log('🔄 Creating WizzMerchantDiscountsAPI instance...');
            const api = new window.WizzMerchantDiscountsAPI();
            
            console.log('🔄 Initializing API...');
            await api.initialize();
            
            console.log('🔄 Fetching merchant discounts...');
            const result = await api.getMerchantDiscounts(50);
            
            console.log('📊 API result:', result);

            if (!result || !result.success) {
                console.warn('⚠️ API returned unsuccessful result:', result);
                showEmptyState(tbody, 'merchant-discounts');
                updateStats('discounts', 0, 0);
                return;
            }

            if (!result.discounts || result.discounts.length === 0) {
                console.warn('⚠️ No discounts in result');
                showEmptyState(tbody, 'merchant-discounts');
                updateStats('discounts', 0, 0);
                return;
            }

            const discounts = result.discounts;
            console.log(`✅ Loaded ${discounts.length} merchant discounts from ${result.source || 'API'}`);

            // Hide loading row
            if (loadingRow) loadingRow.style.display = 'none';

            // Render discounts
            tbody.innerHTML = discounts.map(discount => renderDiscountRow(discount)).join('');

            // Update statistics
            const activeCount = discounts.filter(d => d.status === 'active').length;
            updateStats('discounts', discounts.length, activeCount);

        } catch (error) {
            console.error('❌ Error loading merchant discounts:', error);
            console.error('Error stack:', error.stack);
            showErrorState(tbody, 'Failed to load merchant discounts: ' + error.message);
            updateStats('discounts', 0, 0);
        }
    }

    async function loadSpecialCampaigns() {
        console.log('📦 Loading special campaigns...');
        
        const tbody = document.getElementById('special-campaigns-tbody');
        const loadingRow = document.getElementById('campaigns-loading-row');
        
        if (!tbody) {
            console.warn('⚠️ Special campaigns table body not found');
            return;
        }

        try {
            // Initialize and fetch campaigns
            console.log('🔄 Creating WizzCampaignsAPI instance...');
            const api = new window.WizzCampaignsAPI();
            
            console.log('🔄 Initializing campaigns API...');
            await api.initialize();
            
            console.log('🔄 Fetching campaigns...');
            const result = await api.getCampaigns(50);
            
            console.log('📊 Campaigns API result:', result);

            if (!result || !result.success) {
                console.warn('⚠️ Campaigns API returned unsuccessful result:', result);
                showEmptyState(tbody, 'campaigns');
                updateStats('campaigns', 0, 0);
                return;
            }

            if (!result.campaigns || result.campaigns.length === 0) {
                console.warn('⚠️ No campaigns in result');
                showEmptyState(tbody, 'campaigns');
                updateStats('campaigns', 0, 0);
                return;
            }

            const campaigns = result.campaigns;
            console.log(`✅ Loaded ${campaigns.length} campaigns from ${result.source || 'API'}`);

            // Hide loading row
            if (loadingRow) loadingRow.style.display = 'none';

            // Render campaigns
            tbody.innerHTML = campaigns.map(campaign => renderCampaignRow(campaign)).join('');

            // Update statistics
            const activeCount = campaigns.filter(c => c.status === 'active').length;
            updateStats('campaigns', campaigns.length, activeCount);

        } catch (error) {
            console.error('❌ Error loading campaigns:', error);
            console.error('Error stack:', error.stack);
            showErrorState(tbody, 'Failed to load campaigns: ' + error.message);
            updateStats('campaigns', 0, 0);
        }
    }

    function renderDiscountRow(discount) {
        const statusClass = discount.status === 'active' ? 'status-active' : 'status-inactive';
        const statusText = discount.status.charAt(0).toUpperCase() + discount.status.slice(1);
        const valueDisplay = discount.discountType === 'percentage' 
            ? `${discount.discountValue}%` 
            : `${(discount.discountValue / 1000).toFixed(0)}K IQD`;
        
        const validUntil = discount.validUntil ? new Date(discount.validUntil).toLocaleDateString() : 'N/A';

        return `
            <tr>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="font-weight: 600; color: var(--md-sys-color-on-surface);">
                            ${escapeHtml(discount.discountCode)}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--md-sys-color-on-surface-variant);">
                            ${escapeHtml(discount.description || 'No description')}
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(discount.merchantName)}</td>
                <td>
                    <span style="text-transform: capitalize;">
                        ${discount.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </span>
                </td>
                <td>
                    <span class="discount-badge">${valueDisplay}</span>
                </td>
                <td>
                    <span class="badge ${statusClass}">${statusText}</span>
                </td>
                <td>${discount.usage} / ${discount.maxUsage}</td>
                <td>${validUntil}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="action-btn view-btn" onclick="viewDiscount('${discount.id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick="editDiscount('${discount.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteDiscount('${discount.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    function renderCampaignRow(campaign) {
        const statusClass = campaign.status === 'active' ? 'status-active' : 'status-inactive';
        const statusText = campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1);
        const valueDisplay = campaign.discountType === 'percentage' 
            ? `${campaign.discountValue}%` 
            : `${(campaign.discountValue / 1000).toFixed(0)}K IQD`;
        
        const startDate = campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A';
        const endDate = campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A';
        const targetDisplay = campaign.targetAudience ? campaign.targetAudience.replace(/_/g, ' ') : 'All';

        return `
            <tr>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="font-weight: 600; color: var(--md-sys-color-on-surface);">
                            ${escapeHtml(campaign.name)}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--md-sys-color-on-surface-variant);">
                            ${escapeHtml(campaign.description || 'No description')}
                        </div>
                    </div>
                </td>
                <td style="text-transform: capitalize;">${escapeHtml(campaign.type.replace(/-/g, ' '))}</td>
                <td style="text-transform: capitalize;">${escapeHtml(targetDisplay)}</td>
                <td>
                    <span class="discount-badge">${valueDisplay}</span>
                </td>
                <td>
                    <span class="badge ${statusClass}">${statusText}</span>
                </td>
                <td>${campaign.usage} / ${campaign.maxUsage}</td>
                <td>${startDate} - ${endDate}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="action-btn view-btn" onclick="viewCampaign('${campaign.id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick="editCampaign('${campaign.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteCampaign('${campaign.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    function showEmptyState(tbody, type) {
        const message = type === 'campaigns' 
            ? 'No campaigns found. Create your first campaign to get started!' 
            : 'No merchant discounts found. Create discounts to boost sales!';
        
        const icon = type === 'campaigns' ? 'rocket' : 'tags';
        
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem 2rem;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; color: var(--md-sys-color-on-surface-variant);">
                        <i class="fas fa-${icon}" style="font-size: 3rem; opacity: 0.3;"></i>
                        <div style="font-size: 1.1rem; font-weight: 500;">${message}</div>
                    </div>
                </td>
            </tr>
        `;
    }

    function showErrorState(tbody, message) {
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--md-sys-color-error);">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i>
                        <div>${escapeHtml(message)}</div>
                        <button onclick="location.reload()" class="btn-secondary" style="margin-top: 12px;">
                            <i class="fas fa-sync-alt"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    function updateStats(type, total, active) {
        const totalEl = document.getElementById(`${type}-total`);
        const activeEl = document.getElementById(`${type}-active`);
        
        if (totalEl) totalEl.textContent = total;
        if (activeEl) activeEl.textContent = active;
    }

    function setupEventListeners() {
        // Refresh buttons
        const refreshDiscountsBtn = document.getElementById('refreshDiscountsBtn');
        if (refreshDiscountsBtn) {
            refreshDiscountsBtn.addEventListener('click', () => {
                console.log('🔄 Refreshing merchant discounts...');
                loadMerchantDiscounts();
            });
        }

        // Add promotion button
        const addPromotionBtn = document.getElementById('addPromotionBtn');
        if (addPromotionBtn) {
            addPromotionBtn.addEventListener('click', () => {
                console.log('➕ Opening add discount modal...');
                // TODO: Implement modal opening
                alert('Add Discount functionality coming soon!');
            });
        }

        // Create campaign button
        const createCampaignBtn = document.getElementById('createCampaignBtn');
        if (createCampaignBtn) {
            createCampaignBtn.addEventListener('click', () => {
                console.log('➕ Opening create campaign modal...');
                // TODO: Implement modal opening
                alert('Create Campaign functionality coming soon!');
            });
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Global action functions
    window.viewDiscount = function(id) {
        console.log('👁️ View discount:', id);
        alert(`View discount ${id} - Coming soon!`);
    };

    window.editDiscount = function(id) {
        console.log('✏️ Edit discount:', id);
        alert(`Edit discount ${id} - Coming soon!`);
    };

    window.deleteDiscount = function(id) {
        if (confirm('Are you sure you want to delete this discount?')) {
            console.log('🗑️ Delete discount:', id);
            alert(`Delete discount ${id} - Coming soon!`);
        }
    };

    window.viewCampaign = function(id) {
        console.log('👁️ View campaign:', id);
        alert(`View campaign ${id} - Coming soon!`);
    };

    window.editCampaign = function(id) {
        console.log('✏️ Edit campaign:', id);
        alert(`Edit campaign ${id} - Coming soon!`);
    };

    window.deleteCampaign = function(id) {
        if (confirm('Are you sure you want to delete this campaign?')) {
            console.log('🗑️ Delete campaign:', id);
            alert(`Delete campaign ${id} - Coming soon!`);
        }
    };

})();
