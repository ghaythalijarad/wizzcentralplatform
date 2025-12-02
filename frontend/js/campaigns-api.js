// WizzCentral Campaigns API - Mock Data for Frontend
// This module provides mock campaign data for the promotions page

class WizzCampaignsAPI {
    constructor() {
        this.initialized = false;
        this.mockCampaigns = [];
    }

    // Initialize the API with mock data
    async initialize() {
        if (this.initialized) return;

        console.log('🔄 Initializing WizzCampaignsAPI with mock data...');
        
        // Create some mock campaigns
        this.mockCampaigns = [
            {
                id: 'CAMP001',
                name: 'Welcome Discount',
                type: 'first-order',
                description: 'Get 20% off on your first order',
                discountType: 'percentage',
                discountValue: 20,
                status: 'active',
                targetAudience: 'new_customers',
                minimumOrderValue: 10000, // 10,000 IQD
                usage: 156,
                maxUsage: 1000,
                startDate: '2025-01-01T00:00:00Z',
                endDate: '2025-12-31T23:59:59Z',
                createdAt: '2025-01-01T00:00:00Z'
            },
            {
                id: 'CAMP002',
                name: 'Ramadan Special',
                type: 'special-occasion',
                description: '15% discount during Ramadan',
                discountType: 'percentage',
                discountValue: 15,
                status: 'active',
                targetAudience: 'all_customers',
                minimumOrderValue: 15000, // 15,000 IQD
                usage: 892,
                maxUsage: 5000,
                startDate: '2025-03-01T00:00:00Z',
                endDate: '2025-03-30T23:59:59Z',
                createdAt: '2025-02-15T00:00:00Z'
            },
            {
                id: 'CAMP003',
                name: 'Restaurant Launch',
                type: 'restaurant-first',
                description: 'First order from new restaurants - 25% off',
                discountType: 'percentage',
                discountValue: 25,
                status: 'active',
                targetAudience: 'all_customers',
                minimumOrderValue: 20000, // 20,000 IQD
                usage: 45,
                maxUsage: 500,
                startDate: '2025-01-15T00:00:00Z',
                endDate: '2025-06-30T23:59:59Z',
                createdAt: '2025-01-10T00:00:00Z'
            }
        ];

        this.initialized = true;
        console.log('✅ WizzCampaignsAPI initialized with', this.mockCampaigns.length, 'mock campaigns');
    }

    // Helper: build Authorization header from Cognito if available
    getAuthHeaders() {
        try {
            const idToken = window.Auth?.getIdToken?.();
            if (idToken) return { 'Authorization': `Bearer ${idToken}` };
        } catch (_) {}
        try {
            const token = localStorage.getItem('authToken');
            if (token) return { 'Authorization': `Bearer ${token}` };
        } catch (_) {}
        return {};
    }

    // Helper: resolve API base URL
    getApiBase() {
        const cfg = window.WIZZCENTRAL_CONFIG || {};
        return window.__API_BASE_URL__ || cfg.API_BASE_URL || window.location.origin;
    }

    async fetchJson(url) {
        const headers = { 'Accept': 'application/json', ...this.getAuthHeaders() };
        const res = await fetch(url, { headers, cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        return res.json();
    }

    // Get all campaigns (real API first, mock fallback)
    async getCampaigns(limit = 50) {
        await this.initialize();

        try {
            console.log('📊 Fetching campaigns from API...');

            const base = this.getApiBase().replace(/\/$/, '');
            const stage = (window.WIZZCENTRAL_CONFIG && window.WIZZCENTRAL_CONFIG.STAGE) || '';
            const candidates = [
                `${base}/campaigns`,
                `${base}/api/campaigns`,
                `${base}/promotions/campaigns`,
                stage ? `${base}/${stage}/campaigns` : null,
                stage ? `${base}/${stage}/promotions/campaigns` : null
            ].filter(Boolean);

            for (const url of candidates) {
                try {
                    console.log('🔗 Trying campaigns endpoint:', url);
                    const data = await this.fetchJson(url);
                    const raw = Array.isArray(data) ? data
                        : (Array.isArray(data.items) ? data.items
                        : (Array.isArray(data.campaigns) ? data.campaigns : []));

                    if (raw && raw.length) {
                        const campaigns = raw.map(c => ({
                            id: c.campaignId || c.id,
                            name: c.name || c.title || 'Campaign',
                            type: (c.type || c.campaignType || 'general').toString().toLowerCase().replace(/\s+/g, '-'),
                            description: c.description || '',
                            discountType: (c.discountType || c.type) === 'Fixed Amount' || (c.discountType || c.type) === 'fixed' ? 'fixed' : 'percentage',
                            discountValue: c.discountValue ?? c.value ?? 0,
                            status: (c.status || 'inactive').toString().toLowerCase(),
                            targetAudience: c.targetAudience || c.target_audience || 'all_customers',
                            minimumOrderValue: c.minimumOrderValue ?? c.minValue ?? 0,
                            usage: c.usage ?? c.usageCount ?? 0,
                            maxUsage: c.maxUsage ?? c.usageLimit ?? 1000,
                            startDate: c.startDate || c.validFrom || '',
                            endDate: c.endDate || c.validUntil || '',
                            createdAt: c.createdAt || c.created_at || new Date().toISOString()
                        })).slice(0, limit);

                        console.log(`✅ Loaded ${campaigns.length} campaigns from API`, { url });
                        return { success: true, campaigns, count: campaigns.length, source: `API:${url}` };
                    }
                } catch (err) {
                    console.warn('⚠️ Endpoint failed, trying next:', url, '-', err.message);
                }
            }

            // Fallback to mock if none produced data
            console.log('📊 Using mock campaigns as fallback...');
            const campaigns = this.mockCampaigns.slice(0, limit);
            return { success: true, campaigns, count: campaigns.length, source: 'Mock-Data-Fallback' };

        } catch (error) {
            console.error('❌ Error fetching campaigns:', error);
            return { success: false, message: error.message, campaigns: [], count: 0 };
        }
    }

    // Create a new campaign
    async createCampaign(campaignData) {
        await this.initialize();

        try {
            console.log('📝 Creating campaign:', campaignData);

            const newCampaign = {
                id: 'CAMP' + String(this.mockCampaigns.length + 1).padStart(3, '0'),
                name: campaignData.name || 'New Campaign',
                type: campaignData.type || 'general',
                description: campaignData.description || '',
                discountType: campaignData.discountType || 'percentage',
                discountValue: campaignData.discountValue || 10,
                status: 'active',
                targetAudience: campaignData.targetAudience || 'all_customers',
                minimumOrderValue: campaignData.minimumOrderValue || 0,
                usage: 0,
                maxUsage: campaignData.maxUsage || 1000,
                startDate: campaignData.startDate || new Date().toISOString(),
                endDate: campaignData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date().toISOString()
            };

            this.mockCampaigns.unshift(newCampaign);

            console.log('✅ Campaign created:', newCampaign);

            return {
                success: true,
                campaign: newCampaign,
                message: 'Campaign created successfully'
            };

        } catch (error) {
            console.error('❌ Error creating campaign:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Update a campaign
    async updateCampaign(campaignId, updates) {
        await this.initialize();

        try {
            const index = this.mockCampaigns.findIndex(c => c.id === campaignId);
            
            if (index === -1) {
                throw new Error('Campaign not found');
            }

            this.mockCampaigns[index] = {
                ...this.mockCampaigns[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            console.log('✅ Campaign updated:', this.mockCampaigns[index]);

            return {
                success: true,
                campaign: this.mockCampaigns[index],
                message: 'Campaign updated successfully'
            };

        } catch (error) {
            console.error('❌ Error updating campaign:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Delete a campaign
    async deleteCampaign(campaignId) {
        await this.initialize();

        try {
            const index = this.mockCampaigns.findIndex(c => c.id === campaignId);
            
            if (index === -1) {
                throw new Error('Campaign not found');
            }

            const deleted = this.mockCampaigns.splice(index, 1)[0];

            console.log('✅ Campaign deleted:', deleted);

            return {
                success: true,
                message: 'Campaign deleted successfully'
            };

        } catch (error) {
            console.error('❌ Error deleting campaign:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IQ', {
            style: 'currency',
            currency: 'IQD',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

// Expose the class globally (not an instance)
window.WizzCampaignsAPI = WizzCampaignsAPI;
console.log('✅ WizzCampaignsAPI class loaded and available globally');
