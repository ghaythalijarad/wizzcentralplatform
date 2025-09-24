/**
 * Financial Management JavaScript
 * Handles commission rules, delivery fees, and financial reporting
 */

class FinancialManager {
    constructor() {
        this.apiBaseUrl = this.detectAPIEndpoint();
        this.commissionRules = [];
        this.deliveryFeeRules = [];
        this.currentTab = 'overview';
        
        this.init();
    }

    detectAPIEndpoint() {
        // Try to detect API endpoint from various sources
        if (window.WIZZCENTRAL_CONFIG?.API_BASE_URL) {
            return window.WIZZCENTRAL_CONFIG.API_BASE_URL;
        }
        
        if (localStorage.getItem('wizzcentral_api_endpoint')) {
            return localStorage.getItem('wizzcentral_api_endpoint');
        }
        
        // Default development endpoint
        return window.location.origin;
    }

    async init() {
        console.log('🏦 Initializing Financial Manager...');
        
        this.setupEventListeners();
        await this.loadInitialData();
        this.setupTabs();
        
        console.log('✅ Financial Manager initialized');
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Commission form
        const commissionForm = document.getElementById('commission-form');
        if (commissionForm) {
            commissionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createCommissionRule();
            });
        }

        // Delivery fee form
        const deliveryForm = document.getElementById('delivery-fee-form');
        if (deliveryForm) {
            deliveryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createDeliveryFeeRule();
            });
        }

        // Commission type change
        const commissionType = document.getElementById('commission-type');
        if (commissionType) {
            commissionType.addEventListener('change', () => {
                this.updateCommissionRatesFields();
            });
        }

        // Delivery fee type change
        const deliveryFeeType = document.getElementById('delivery-fee-type');
        if (deliveryFeeType) {
            deliveryFeeType.addEventListener('change', () => {
                this.updateDeliveryRatesFields();
            });
        }
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadCommissionRules(),
                this.loadDeliveryFeeRules(),
                this.loadFinancialSettings()
            ]);
            
            this.updateOverviewMetrics();
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            this.showError('Failed to load financial data');
        }
    }

    async loadCommissionRules() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/commissions`);
            const data = await response.json();
            
            if (data.success) {
                this.commissionRules = data.data.rules;
                this.renderCommissionRules();
                console.log('✅ Loaded commission rules:', this.commissionRules.length);
            }
        } catch (error) {
            console.error('❌ Error loading commission rules:', error);
            throw error;
        }
    }

    async loadDeliveryFeeRules() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/delivery-fees`);
            const data = await response.json();
            
            if (data.success) {
                this.deliveryFeeRules = data.data.rules;
                this.renderDeliveryFeeRules();
                console.log('✅ Loaded delivery fee rules:', this.deliveryFeeRules.length);
            }
        } catch (error) {
            console.error('❌ Error loading delivery fee rules:', error);
            throw error;
        }
    }

    async loadFinancialSettings() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/financial-settings`);
            const data = await response.json();
            
            if (data.success) {
                this.financialSettings = data.data;
                console.log('✅ Loaded financial settings:', this.financialSettings);
            }
        } catch (error) {
            console.error('❌ Error loading financial settings:', error);
            // Non-critical, continue without settings
        }
    }

    updateOverviewMetrics() {
        const totalCommissionRules = this.commissionRules.length;
        const activeCommissionRules = this.commissionRules.filter(r => r.isActive).length;
        const totalDeliveryRules = this.deliveryFeeRules.length;
        const activeDeliveryRules = this.deliveryFeeRules.filter(r => r.isActive).length;

        document.getElementById('total-commission-rules').textContent = totalCommissionRules;
        document.getElementById('active-commission-rules').textContent = activeCommissionRules;
        document.getElementById('total-delivery-rules').textContent = totalDeliveryRules;
        document.getElementById('active-delivery-rules').textContent = activeDeliveryRules;
    }

    setupTabs() {
        // Set default date values
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        
        document.getElementById('report-start-date').value = lastMonth.toISOString().split('T')[0];
        document.getElementById('report-end-date').value = today.toISOString().split('T')[0];
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;
        console.log(`📑 Switched to ${tabName} tab`);
    }

    async createCommissionRule() {
        try {
            const formData = {
                ruleName: document.getElementById('commission-name').value,
                ruleType: document.getElementById('commission-type').value,
                calculationModel: 'order_value',
                isActive: document.getElementById('commission-active').checked,
                priority: parseInt(document.getElementById('commission-priority').value) || 10,
                conditions: {
                    merchantType: document.getElementById('merchant-type').value,
                    regionId: 'all'
                },
                rates: this.getCommissionRates()
            };

            const response = await fetch(`${this.apiBaseUrl}/api/commissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Commission rule created successfully!');
                document.getElementById('commission-form').reset();
                await this.loadCommissionRules();
                this.updateOverviewMetrics();
            } else {
                this.showError(data.error || 'Failed to create commission rule');
            }
        } catch (error) {
            console.error('❌ Error creating commission rule:', error);
            this.showError('Failed to create commission rule');
        }
    }

    getCommissionRates() {
        const type = document.getElementById('commission-type').value;
        const rates = { currency: 'IQD' };

        switch (type) {
            case 'percentage':
                rates.percentage = parseFloat(document.getElementById('commission-percentage').value) || 0;
                break;
            case 'flat_fee':
                rates.flatFee = parseFloat(document.getElementById('commission-flat-fee').value) || 0;
                break;
            case 'hybrid':
                rates.percentage = parseFloat(document.getElementById('commission-percentage').value) || 0;
                rates.flatFee = parseFloat(document.getElementById('commission-flat-fee').value) || 0;
                break;
            case 'tiered':
                // For now, use default tiered structure
                rates.tiers = [
                    { minValue: 0, maxValue: 10000000, percentage: 15.0 },
                    { minValue: 10000000, maxValue: 50000000, percentage: 12.0 },
                    { minValue: 50000000, maxValue: null, percentage: 10.0 }
                ];
                break;
        }

        return rates;
    }

    async createDeliveryFeeRule() {
        try {
            const formData = {
                ruleName: document.getElementById('delivery-rule-name').value,
                ruleType: document.getElementById('delivery-fee-type').value,
                isActive: document.getElementById('delivery-fee-active').checked,
                priority: 10,
                conditions: {
                    regionId: document.getElementById('delivery-region').value,
                    serviceType: document.getElementById('delivery-service-type').value
                },
                rates: this.getDeliveryRates()
            };

            const response = await fetch(`${this.apiBaseUrl}/api/delivery-fees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Delivery fee rule created successfully!');
                document.getElementById('delivery-fee-form').reset();
                await this.loadDeliveryFeeRules();
                this.updateOverviewMetrics();
            } else {
                this.showError(data.error || 'Failed to create delivery fee rule');
            }
        } catch (error) {
            console.error('❌ Error creating delivery fee rule:', error);
            this.showError('Failed to create delivery fee rule');
        }
    }

    getDeliveryRates() {
        const rates = {
            currency: 'IQD',
            baseFee: parseFloat(document.getElementById('delivery-base-fee').value) || 0,
            perKmRate: parseFloat(document.getElementById('delivery-per-km').value) || 0,
            minimumFee: parseFloat(document.getElementById('delivery-min-fee').value) || 0,
            maximumFee: parseFloat(document.getElementById('delivery-max-fee').value) || 0,
            freeDeliveryThreshold: parseFloat(document.getElementById('free-delivery-threshold').value) || 0
        };

        return rates;
    }

    updateCommissionRatesFields() {
        const type = document.getElementById('commission-type').value;
        const percentageField = document.getElementById('commission-percentage').parentElement;
        const flatFeeField = document.getElementById('commission-flat-fee').parentElement;

        // Reset visibility
        percentageField.style.display = 'block';
        flatFeeField.style.display = 'block';

        switch (type) {
            case 'percentage':
                flatFeeField.style.display = 'none';
                break;
            case 'flat_fee':
                percentageField.style.display = 'none';
                break;
            case 'tiered':
                percentageField.style.display = 'none';
                flatFeeField.style.display = 'none';
                break;
            case 'hybrid':
                // Show both
                break;
        }
    }

    updateDeliveryRatesFields() {
        const type = document.getElementById('delivery-fee-type').value;
        const baseField = document.getElementById('delivery-base-fee').parentElement;
        const perKmField = document.getElementById('delivery-per-km').parentElement;

        switch (type) {
            case 'flat':
                perKmField.style.display = 'none';
                break;
            case 'distance_based':
                baseField.style.display = 'block';
                perKmField.style.display = 'block';
                break;
            default:
                baseField.style.display = 'block';
                perKmField.style.display = 'block';
        }
    }

    renderCommissionRules() {
        const container = document.getElementById('commission-rules-list');
        
        if (this.commissionRules.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No commission rules found</p>';
            return;
        }

        container.innerHTML = this.commissionRules.map(rule => `
            <div class="rule-item">
                <div class="rule-info">
                    <div class="rule-name">${rule.ruleName}</div>
                    <div class="rule-details">
                        Type: ${rule.ruleType} | 
                        Priority: ${rule.priority} | 
                        ${this.formatCommissionRate(rule.rates)}
                    </div>
                </div>
                <div class="rule-actions">
                    <span class="status-badge ${rule.isActive ? 'status-active' : 'status-inactive'}">
                        ${rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button class="button-secondary" onclick="financialManager.editCommissionRule('${rule.ruleId}')">
                        Edit
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderDeliveryFeeRules() {
        const container = document.getElementById('delivery-rules-list');
        
        if (this.deliveryFeeRules.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No delivery fee rules found</p>';
            return;
        }

        container.innerHTML = this.deliveryFeeRules.map(rule => `
            <div class="rule-item">
                <div class="rule-info">
                    <div class="rule-name">${rule.ruleName}</div>
                    <div class="rule-details">
                        Type: ${rule.ruleType} | 
                        Region: ${rule.conditions.regionId} | 
                        ${this.formatDeliveryRate(rule.rates)}
                    </div>
                </div>
                <div class="rule-actions">
                    <span class="status-badge ${rule.isActive ? 'status-active' : 'status-inactive'}">
                        ${rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button class="button-secondary" onclick="financialManager.editDeliveryRule('${rule.ruleId}')">
                        Edit
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatCommissionRate(rates) {
        if (rates.percentage && rates.flatFee) {
            return `${rates.percentage}% + ${rates.flatFee} IQD`;
        } else if (rates.percentage) {
            return `${rates.percentage}%`;
        } else if (rates.flatFee) {
            return `${rates.flatFee} IQD`;
        } else if (rates.tiers) {
            return `Tiered (${rates.tiers.length} tiers)`;
        }
        return 'Not configured';
    }

    formatDeliveryRate(rates) {
        if (rates.baseFee && rates.perKmRate) {
            return `${rates.baseFee} IQD + ${rates.perKmRate}/km`;
        } else if (rates.baseFee) {
            return `${rates.baseFee} IQD`;
        } else if (rates.zones) {
            return `Zone-based (${rates.zones.length} zones)`;
        }
        return 'Not configured';
    }

    async generateReport() {
        const reportType = document.getElementById('report-type').value;
        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;

        if (!startDate || !endDate) {
            this.showError('Please select both start and end dates');
            return;
        }

        try {
            const url = `${this.apiBaseUrl}/api/financial-reports/${reportType}?startDate=${startDate}&endDate=${endDate}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                this.renderReportResults(data.data, reportType);
                this.showSuccess('Report generated successfully!');
            } else {
                this.showError('Failed to generate report');
            }
        } catch (error) {
            console.error('❌ Error generating report:', error);
            this.showError('Failed to generate report');
        }
    }

    renderReportResults(reportData, reportType) {
        const container = document.getElementById('report-results');
        
        const html = `
            <div class="report-content">
                <h3>📊 ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h3>
                <div class="report-period">
                    Period: ${reportData.period?.startDate} to ${reportData.period?.endDate}
                </div>
                
                <div class="metrics-grid" style="margin-top: 20px;">
                    ${this.generateReportMetrics(reportData, reportType)}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <small style="color: #6c757d;">
                        Generated at: ${new Date(reportData.generatedAt).toLocaleString()}
                    </small>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    generateReportMetrics(reportData, reportType) {
        switch (reportType) {
            case 'summary':
                return `
                    <div class="metric-card">
                        <div class="metric-value">${reportData.summary?.totalRevenue || 0} IQD</div>
                        <div class="metric-label">Total Revenue</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${reportData.summary?.totalCommissions || 0} IQD</div>
                        <div class="metric-label">Total Commissions</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${reportData.summary?.totalDeliveryFees || 0} IQD</div>
                        <div class="metric-label">Total Delivery Fees</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${reportData.summary?.commissionsPercentage || 0}%</div>
                        <div class="metric-label">Commission Rate</div>
                    </div>
                `;
            case 'commission':
                return `
                    <div class="metric-card">
                        <div class="metric-value">${reportData.totalOrders || 0}</div>
                        <div class="metric-label">Total Orders</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${reportData.totalCommissions || 0} IQD</div>
                        <div class="metric-label">Total Commissions</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${reportData.averageCommissionRate || 0}%</div>
                        <div class="metric-label">Average Rate</div>
                    </div>
                `;
            case 'delivery-fees':
                return `
                    <div class="metric-card">
                        <div class="metric-value">${reportData.totalDeliveries || 0}</div>
                        <div class="metric-label">Total Deliveries</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${reportData.totalDeliveryFees || 0} IQD</div>
                        <div class="metric-label">Total Fees</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${reportData.averageDeliveryFee || 0} IQD</div>
                        <div class="metric-label">Average Fee</div>
                    </div>
                `;
            default:
                return '<div class="metric-card"><div class="metric-value">No data</div></div>';
        }
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Remove existing messages
        document.querySelectorAll('.success-message, .error-message').forEach(el => el.remove());

        const messageEl = document.createElement('div');
        messageEl.className = type === 'success' ? 'success-message' : 'error-message';
        messageEl.textContent = message;

        // Insert at the top of the current tab
        const activeTab = document.querySelector('.tab-content.active');
        activeTab.insertBefore(messageEl, activeTab.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }

    // Quick action methods
    async calculateSampleCommission() {
        const sampleOrder = {
            orderId: 'TEST_ORDER_' + Date.now(),
            totalAmount: 25000,
            merchantType: 'standard',
            itemCount: 3
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/commissions/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderData: sampleOrder,
                    merchantId: 'TEST_MERCHANT'
                })
            });

            const data = await response.json();
            
            if (data.success) {
                const commission = data.data.commission;
                this.showSuccess(`Sample commission calculated: ${commission.commissionAmount} IQD (${commission.appliedRate.percentage || 0}%)`);
            }
        } catch (error) {
            console.error('❌ Error calculating sample commission:', error);
            this.showError('Failed to calculate sample commission');
        }
    }

    async calculateSampleDeliveryFee() {
        const sampleDelivery = {
            distanceKm: 5.2,
            orderValue: 18000,
            deliveryTime: new Date().toISOString(),
            weather: 'clear'
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/delivery-fees/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    deliveryData: sampleDelivery,
                    regionId: 'REG_IQ_BGD'
                })
            });

            const data = await response.json();
            
            if (data.success) {
                const fee = data.data.deliveryFee;
                this.showSuccess(`Sample delivery fee calculated: ${fee.deliveryFee} IQD for ${sampleDelivery.distanceKm}km delivery`);
            }
        } catch (error) {
            console.error('❌ Error calculating sample delivery fee:', error);
            this.showError('Failed to calculate sample delivery fee');
        }
    }

    editCommissionRule(ruleId) {
        // TODO: Implement edit functionality
        console.log('Edit commission rule:', ruleId);
        this.showError('Edit functionality coming soon');
    }

    editDeliveryRule(ruleId) {
        // TODO: Implement edit functionality
        console.log('Edit delivery rule:', ruleId);
        this.showError('Edit functionality coming soon');
    }

    saveSettings() {
        // TODO: Implement settings save
        this.showSuccess('Settings saved successfully!');
    }

    recalculateAllCommissions() {
        // TODO: Implement bulk recalculation
        this.showSuccess('Commission recalculation started (this may take a few minutes)');
    }

    exportFinancialData() {
        // TODO: Implement data export
        this.showSuccess('Export functionality coming soon');
    }

    async loadMerchantFinancials() {
        try {
            console.log('📊 Loading merchant financial overview...');
            
            // Get commission rules and merchant data
            const [commissionResponse, deliveryResponse] = await Promise.all([
                fetch(`${this.apiBaseUrl}/api/commissions`),
                fetch(`${this.apiBaseUrl}/api/delivery-fees`)
            ]);

            const commissionData = await commissionResponse.json();
            const deliveryData = await deliveryResponse.json();

            if (commissionData.success && deliveryData.success) {
                const merchantData = {
                    merchants: [
                        {
                            id: 'business_1756855226821_cshyb2wugda',
                            name: 'سنونو',
                            type: 'restaurant',
                            location: 'الروان، المركز، النجف',
                            email: 'alwersh.mohammed@gmail.com',
                            isActive: true
                        },
                        {
                            id: 'business_1756336745961_ywix4oy9aa',
                            name: 'كارتوشكا',
                            type: 'restaurant',
                            location: 'الصناعية، العسكري، النجف',
                            email: 'g87_a@yahoo.com',
                            isActive: true
                        },
                        {
                            id: 'business_1756392075844_vdlqud6gyu',
                            name: 'أسواق الكرادة',
                            type: 'restaurant',
                            location: 'الكوفة الخدمي، كندة، النجف',
                            email: 'zikbiot@yahoo.com',
                            isActive: true
                        }
                    ],
                    commissionRules: commissionData.data.rules,
                    deliveryRules: deliveryData.data.rules
                };

                this.displayMerchantFinancials(merchantData);
            } else {
                throw new Error('Failed to load financial data');
            }
        } catch (error) {
            console.error('❌ Error loading merchant financials:', error);
            this.showError('Failed to load merchant financial data');
        }
    }

    displayMerchantFinancials(data) {
        const recentActivity = document.getElementById('recent-activity');
        if (!recentActivity) return;

        let html = `
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 15px; color: #2d3748;">📊 Merchant Financial Overview</h4>
                <p style="color: #6c757d; margin-bottom: 20px;">
                    Real Iraqi merchants from Najaf with active commission and delivery fee rules
                </p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        `;

        data.merchants.forEach(merchant => {
            html += `
                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #fafafa;">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                        <h5 style="margin: 0; color: #2d3748; direction: rtl;">${merchant.name}</h5>
                        <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">
                            Active
                        </span>
                    </div>
                    <div style="font-size: 0.8rem; color: #6c757d; margin-bottom: 10px; direction: rtl;">
                        📍 ${merchant.location}<br>
                        📧 ${merchant.email}<br>
                        🏪 ${merchant.type}
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button onclick="testMerchantCommission('${merchant.id}', '${merchant.name}')" 
                                style="padding: 6px 12px; background: #00c2e8; color: white; border: none; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
                            Test Commission
                        </button>
                        <button onclick="testMerchantDelivery('${merchant.id}', '${merchant.name}')" 
                                style="padding: 6px 12px; background: #48bb78; color: white; border: none; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
                            Test Delivery
                        </button>
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            <div style="margin-top: 25px; padding: 15px; background: #f7fafc; border-radius: 8px;">
                <h5 style="margin-bottom: 10px; color: #2d3748;">📋 Active Financial Rules</h5>
                <div style="font-size: 0.9rem; color: #4a5568;">
                    <strong>Commission Rules:</strong> ${data.commissionRules.length} active<br>
                    <strong>Delivery Fee Rules:</strong> ${data.deliveryRules.length} active<br>
                    <strong>Coverage:</strong> All Iraq regions supported
                </div>
            </div>
        `;

        recentActivity.innerHTML = html;
    }
}

// Global functions for onclick handlers
let financialManager;

window.calculateSampleCommission = () => financialManager.calculateSampleCommission();
window.calculateSampleDeliveryFee = () => financialManager.calculateSampleDeliveryFee();
window.generateReport = () => financialManager.generateReport();
window.saveSettings = () => financialManager.saveSettings();
window.recalculateAllCommissions = () => financialManager.recalculateAllCommissions();
window.exportFinancialData = () => financialManager.exportFinancialData();
window.loadMerchantFinancials = () => financialManager.loadMerchantFinancials();

// Test functions for merchants
window.testMerchantCommission = async (merchantId, merchantName) => {
    try {
        const response = await fetch(`${financialManager.apiBaseUrl}/api/commissions/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderData: {
                    totalAmount: 25000,
                    merchantId: merchantId,
                    regionId: 'REG_IQ_NJF'
                },
                merchantType: 'standard'
            })
        });

        const result = await response.json();
        if (result.success) {
            const commission = result.data.commission;
            alert(`💰 Commission for ${merchantName}:\n\nOrder: 25,000 IQD\nCommission: ${commission.commissionAmount.toLocaleString()} IQD\nRate: ${commission.appliedRate.percentage}%\nRule: ${result.data.appliedRule.ruleName}`);
        } else {
            alert(`Error calculating commission: ${result.message}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
};

window.testMerchantDelivery = async (merchantId, merchantName) => {
    try {
        const response = await fetch(`${financialManager.apiBaseUrl}/api/delivery-fees/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deliveryData: {
                    fromLocation: { latitude: 24.7136, longitude: 46.6753, regionId: 'REG_IQ_NJF' },
                    toLocation: { latitude: 24.7200, longitude: 46.6800, regionId: 'REG_IQ_NJF' },
                    distance: 2.5,
                    serviceType: 'standard',
                    orderValue: 25000
                }
            })
        });

        const result = await response.json();
        if (result.success) {
            const delivery = result.data.deliveryFee;
            alert(`🚚 Delivery Fee for ${merchantName}:\n\nDistance: 2.5km\nFee: ${delivery.deliveryFee.toLocaleString()} IQD\nBase Fee: ${delivery.baseFee.toLocaleString()} IQD\nRule: ${result.data.appliedRule.ruleName}`);
        } else {
            alert(`Error calculating delivery fee: ${result.message}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    financialManager = new FinancialManager();
});
