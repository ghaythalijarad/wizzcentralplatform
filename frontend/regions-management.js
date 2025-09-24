// WizzCentral Regions Management
// Handles all regions management functionality including CRUD operations

class RegionsManager {
    constructor() {
        this.regions = [];
        this.governorates = [];
        this.filteredRegions = [];
        this.isLoading = false;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.loadRegions = this.loadRegions.bind(this);
        this.renderRegions = this.renderRegions.bind(this);
        this.toggleRegionStatus = this.toggleRegionStatus.bind(this);
        this.filterRegions = this.filterRegions.bind(this);
        this.saveRegion = this.saveRegion.bind(this);
        this.deleteRegion = this.deleteRegion.bind(this);
    }

    async init() {
        console.log('🗺️ Initializing Regions Manager...');
        
        try {
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadRegions();
            await this.loadGovernoratesForFilter();
            
            // Update statistics
            this.updateStatistics();
            
            console.log('✅ Regions Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Regions Manager:', error);
            this.showNotification('Failed to initialize regions management', 'error');
        }
    }

    setupEventListeners() {
        // Filter listeners
        const statusFilter = document.getElementById('statusFilter');
        const governorateFilter = document.getElementById('governorateFilter');
        const searchInput = document.getElementById('searchInput');
        
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterRegions());
        if (governorateFilter) governorateFilter.addEventListener('change', () => this.filterRegions());
        if (searchInput) searchInput.addEventListener('input', () => this.filterRegions());
        
        // Form submission
        const regionForm = document.getElementById('regionForm');
        if (regionForm) {
            regionForm.addEventListener('submit', (e) => this.saveRegion(e));
        }
    }

    async loadRegions() {
        console.log('📥 Loading regions data...');
        
        try {
            this.setLoading(true);
            
            // For now, use sample data - in production this would be API call
            this.regions = await this.getSampleRegions();
            this.filteredRegions = [...this.regions];
            
            console.log(`✅ Loaded ${this.regions.length} regions`);
            
            this.renderRegions();
            this.updateStatistics();
            
        } catch (error) {
            console.error('❌ Failed to load regions:', error);
            this.showNotification('Failed to load regions data', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async getSampleRegions() {
        // Sample data - replace with actual API call
        return [
            {
                regionId: 'REG_001',
                regionName: 'Baghdad Central',
                regionNameArabic: 'بغداد المركز',
                governorate: 'Baghdad',
                isActive: true,
                coordinates: {
                    center: { lat: 33.3152, lng: 44.3661 },
                    boundaries: [
                        { lat: 33.32, lng: 44.35 },
                        { lat: 33.31, lng: 44.38 },
                        { lat: 33.30, lng: 44.37 },
                        { lat: 33.31, lng: 44.35 }
                    ]
                },
                serviceTypes: {
                    delivery: true,
                    pickup: true,
                    dineIn: false
                },
                operatingHours: {
                    monday: { start: '08:00', end: '22:00' },
                    tuesday: { start: '08:00', end: '22:00' },
                    wednesday: { start: '08:00', end: '22:00' },
                    thursday: { start: '08:00', end: '22:00' },
                    friday: { start: '08:00', end: '23:00' },
                    saturday: { start: '08:00', end: '23:00' },
                    sunday: { start: '09:00', end: '22:00' }
                },
                deliveryFee: 2000,
                minimumOrder: 15000,
                estimatedDeliveryTime: 30,
                activeDrivers: 12,
                activeMerchants: 45,
                totalOrders: 1250,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'admin@wizz.com',
                status: 'active'
            },
            {
                regionId: 'REG_002',
                regionName: 'Baghdad Kadhimiya',
                regionNameArabic: 'بغداد الكاظمية',
                governorate: 'Baghdad',
                isActive: true,
                coordinates: {
                    center: { lat: 33.3800, lng: 44.3400 },
                    boundaries: [
                        { lat: 33.39, lng: 44.33 },
                        { lat: 33.38, lng: 44.36 },
                        { lat: 33.37, lng: 44.35 },
                        { lat: 33.38, lng: 44.33 }
                    ]
                },
                serviceTypes: {
                    delivery: true,
                    pickup: true,
                    dineIn: false
                },
                operatingHours: {
                    monday: { start: '08:00', end: '22:00' },
                    tuesday: { start: '08:00', end: '22:00' },
                    wednesday: { start: '08:00', end: '22:00' },
                    thursday: { start: '08:00', end: '22:00' },
                    friday: { start: '08:00', end: '23:00' },
                    saturday: { start: '08:00', end: '23:00' },
                    sunday: { start: '09:00', end: '22:00' }
                },
                deliveryFee: 2500,
                minimumOrder: 18000,
                estimatedDeliveryTime: 35,
                activeDrivers: 8,
                activeMerchants: 32,
                totalOrders: 890,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'admin@wizz.com',
                status: 'active'
            },
            {
                regionId: 'REG_003',
                regionName: 'Basra Central',
                regionNameArabic: 'البصرة المركز',
                governorate: 'Basra',
                isActive: false,
                coordinates: {
                    center: { lat: 30.5034, lng: 47.7804 },
                    boundaries: [
                        { lat: 30.52, lng: 47.76 },
                        { lat: 30.51, lng: 47.80 },
                        { lat: 30.49, lng: 47.79 },
                        { lat: 30.50, lng: 47.76 }
                    ]
                },
                serviceTypes: {
                    delivery: false,
                    pickup: false,
                    dineIn: false
                },
                operatingHours: {
                    monday: { start: '00:00', end: '00:00' },
                    tuesday: { start: '00:00', end: '00:00' },
                    wednesday: { start: '00:00', end: '00:00' },
                    thursday: { start: '00:00', end: '00:00' },
                    friday: { start: '00:00', end: '00:00' },
                    saturday: { start: '00:00', end: '00:00' },
                    sunday: { start: '00:00', end: '00:00' }
                },
                deliveryFee: 0,
                minimumOrder: 0,
                estimatedDeliveryTime: 0,
                activeDrivers: 0,
                activeMerchants: 0,
                totalOrders: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'admin@wizz.com',
                status: 'inactive'
            },
            {
                regionId: 'REG_004',
                regionName: 'Erbil Central',
                regionNameArabic: 'أربيل المركز',
                governorate: 'Erbil',
                isActive: true,
                coordinates: {
                    center: { lat: 36.1911, lng: 44.0093 },
                    boundaries: [
                        { lat: 36.20, lng: 44.00 },
                        { lat: 36.19, lng: 44.02 },
                        { lat: 36.18, lng: 44.01 },
                        { lat: 36.19, lng: 44.00 }
                    ]
                },
                serviceTypes: {
                    delivery: true,
                    pickup: true,
                    dineIn: true
                },
                operatingHours: {
                    monday: { start: '08:00', end: '22:00' },
                    tuesday: { start: '08:00', end: '22:00' },
                    wednesday: { start: '08:00', end: '22:00' },
                    thursday: { start: '08:00', end: '22:00' },
                    friday: { start: '08:00', end: '23:00' },
                    saturday: { start: '08:00', end: '23:00' },
                    sunday: { start: '09:00', end: '22:00' }
                },
                deliveryFee: 3000,
                minimumOrder: 20000,
                estimatedDeliveryTime: 40,
                activeDrivers: 15,
                activeMerchants: 28,
                totalOrders: 675,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'admin@wizz.com',
                status: 'active'
            },
            {
                regionId: 'REG_005',
                regionName: 'Najaf Central',
                regionNameArabic: 'النجف المركز',
                governorate: 'Najaf',
                isActive: false,
                coordinates: {
                    center: { lat: 32.0252, lng: 44.3358 },
                    boundaries: [
                        { lat: 32.03, lng: 44.32 },
                        { lat: 32.02, lng: 44.35 },
                        { lat: 32.01, lng: 44.34 },
                        { lat: 32.02, lng: 44.32 }
                    ]
                },
                serviceTypes: {
                    delivery: false,
                    pickup: false,
                    dineIn: false
                },
                operatingHours: {
                    monday: { start: '00:00', end: '00:00' },
                    tuesday: { start: '00:00', end: '00:00' },
                    wednesday: { start: '00:00', end: '00:00' },
                    thursday: { start: '00:00', end: '00:00' },
                    friday: { start: '00:00', end: '00:00' },
                    saturday: { start: '00:00', end: '00:00' },
                    sunday: { start: '00:00', end: '00:00' }
                },
                deliveryFee: 0,
                minimumOrder: 0,
                estimatedDeliveryTime: 0,
                activeDrivers: 0,
                activeMerchants: 0,
                totalOrders: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'admin@wizz.com',
                status: 'maintenance'
            }
        ];
    }

    renderRegions() {
        const container = document.getElementById('regionsContainer');
        if (!container) return;

        if (this.filteredRegions.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-map-marked-alt" style="font-size: 3rem; color: var(--md-sys-color-outline); margin-bottom: 16px;"></i>
                    <h3>No regions found</h3>
                    <p>Try adjusting your filters or add a new region</p>
                </div>
            `;
            return;
        }

        let html = '';
        this.filteredRegions.forEach(region => {
            const statusClass = region.isActive ? 'active' : 'inactive';
            const statusText = region.isActive ? 'Active' : 'Inactive';
            const statusIcon = region.isActive ? 'fa-check-circle' : 'fa-times-circle';
            
            html += `
                <div class="region-card ${statusClass}" id="region-${region.regionId}">
                    <div class="region-status-badge ${statusClass}">
                        <i class="fas ${statusIcon}"></i> ${statusText}
                    </div>
                    
                    <div class="region-header">
                        <div class="region-info">
                            <h3>${region.regionName}</h3>
                            <div class="arabic-name">${region.regionNameArabic}</div>
                            <div class="governorate">
                                <i class="fas fa-map-marker-alt"></i> ${region.governorate}
                            </div>
                        </div>
                        
                        <div class="toggle-switch">
                            <input type="checkbox" id="toggle-${region.regionId}" 
                                   ${region.isActive ? 'checked' : ''} 
                                   onchange="regionsManager.toggleRegionStatus('${region.regionId}')">
                            <span class="slider"></span>
                        </div>
                    </div>
                    
                    <div class="region-details">
                        <div class="detail-item">
                            <i class="fas fa-truck detail-icon"></i>
                            <span>Delivery Fee: ${region.deliveryFee.toLocaleString()} IQD</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-shopping-cart detail-icon"></i>
                            <span>Min Order: ${region.minimumOrder.toLocaleString()} IQD</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock detail-icon"></i>
                            <span>Delivery Time: ${region.estimatedDeliveryTime} min</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-users detail-icon"></i>
                            <span>Drivers: ${region.activeDrivers}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-store detail-icon"></i>
                            <span>Merchants: ${region.activeMerchants}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-chart-line detail-icon"></i>
                            <span>Orders: ${region.totalOrders.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="region-actions">
                        <button class="md-button md-button--outlined" onclick="regionsManager.editRegion('${region.regionId}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="md-button md-button--outlined" onclick="regionsManager.viewOnMap('${region.regionId}')">
                            <i class="fas fa-map"></i> View on Map
                        </button>
                        <button class="md-button md-button--outlined" onclick="regionsManager.viewDetails('${region.regionId}')">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                        <button class="md-button md-button--outlined md-button--error" onclick="regionsManager.deleteRegion('${region.regionId}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    async toggleRegionStatus(regionId) {
        console.log(`🔄 Toggling status for region ${regionId}`);
        
        try {
            const region = this.regions.find(r => r.regionId === regionId);
            if (!region) {
                throw new Error('Region not found');
            }
            
            // Toggle status
            region.isActive = !region.isActive;
            region.updatedAt = new Date().toISOString();
            
            // Update UI immediately
            this.renderRegions();
            this.updateStatistics();
            
            // In production, make API call here
            // await this.updateRegionStatus(regionId, region.isActive);
            
            const statusText = region.isActive ? 'activated' : 'deactivated';
            this.showNotification(`Region ${region.regionName} ${statusText} successfully`, 'success');
            
        } catch (error) {
            console.error('❌ Failed to toggle region status:', error);
            this.showNotification('Failed to update region status', 'error');
            
            // Revert UI changes
            await this.loadRegions();
        }
    }

    filterRegions() {
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        const governorateFilter = document.getElementById('governorateFilter')?.value || 'all';
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        
        this.filteredRegions = this.regions.filter(region => {
            // Status filter
            if (statusFilter !== 'all') {
                if (statusFilter === 'active' && !region.isActive) return false;
                if (statusFilter === 'inactive' && region.isActive) return false;
                if (statusFilter === 'maintenance' && region.status !== 'maintenance') return false;
            }
            
            // Governorate filter
            if (governorateFilter !== 'all' && region.governorate !== governorateFilter) {
                return false;
            }
            
            // Search filter
            if (searchTerm) {
                const searchText = `${region.regionName} ${region.regionNameArabic} ${region.governorate}`.toLowerCase();
                if (!searchText.includes(searchTerm)) return false;
            }
            
            return true;
        });
        
        this.renderRegions();
        console.log(`🔍 Filtered to ${this.filteredRegions.length} regions`);
    }

    updateStatistics() {
        const activeRegions = this.regions.filter(r => r.isActive).length;
        const inactiveRegions = this.regions.filter(r => !r.isActive).length;
        const totalGovernorate = [...new Set(this.regions.map(r => r.governorate))].length;
        const totalDrivers = this.regions.reduce((sum, r) => sum + r.activeDrivers, 0);
        
        // Update stat cards
        const activeRegionsCount = document.getElementById('activeRegionsCount');
        const inactiveRegionsCount = document.getElementById('inactiveRegionsCount');
        const totalGovernoratesCount = document.getElementById('totalGovernoratesCount');
        const totalDriversCount = document.getElementById('totalDriversCount');
        
        if (activeRegionsCount) activeRegionsCount.textContent = activeRegions;
        if (inactiveRegionsCount) inactiveRegionsCount.textContent = inactiveRegions;
        if (totalGovernoratesCount) totalGovernoratesCount.textContent = totalGovernorate;
        if (totalDriversCount) totalDriversCount.textContent = totalDrivers;
    }

    async loadGovernoratesForFilter() {
        const governorateFilter = document.getElementById('governorateFilter');
        if (!governorateFilter) return;
        
        const governorates = [...new Set(this.regions.map(r => r.governorate))].sort();
        
        // Clear existing options except "All"
        while (governorateFilter.options.length > 1) {
            governorateFilter.removeChild(governorateFilter.lastChild);
        }
        
        // Add governorate options
        governorates.forEach(gov => {
            const option = document.createElement('option');
            option.value = gov;
            option.textContent = gov;
            governorateFilter.appendChild(option);
        });
    }

    editRegion(regionId) {
        console.log(`✏️ Editing region ${regionId}`);
        
        const region = this.regions.find(r => r.regionId === regionId);
        if (!region) {
            this.showNotification('Region not found', 'error');
            return;
        }
        
        // Populate form with region data
        document.getElementById('modalTitle').textContent = 'Edit Region';
        document.getElementById('regionId').value = region.regionId;
        document.getElementById('regionName').value = region.regionName;
        document.getElementById('regionNameArabic').value = region.regionNameArabic;
        document.getElementById('governorate').value = region.governorate;
        document.getElementById('centerLat').value = region.coordinates.center.lat;
        document.getElementById('centerLng').value = region.coordinates.center.lng;
        document.getElementById('deliveryFee').value = region.deliveryFee;
        document.getElementById('minimumOrder').value = region.minimumOrder;
        document.getElementById('estimatedDeliveryTime').value = region.estimatedDeliveryTime;
        document.getElementById('saveButtonText').textContent = 'Update Region';
        
        // Show modal
        this.openRegionModal();
    }

    viewOnMap(regionId) {
        console.log(`🗺️ Viewing region ${regionId} on map`);
        
        const region = this.regions.find(r => r.regionId === regionId);
        if (!region) {
            this.showNotification('Region not found', 'error');
            return;
        }
        
        // This would open a map modal or redirect to map view
        // For now, show coordinates
        const coords = region.coordinates.center;
        this.showNotification(`Region coordinates: ${coords.lat}, ${coords.lng}`, 'success');
    }

    viewDetails(regionId) {
        console.log(`📊 Viewing details for region ${regionId}`);
        
        const region = this.regions.find(r => r.regionId === regionId);
        if (!region) {
            this.showNotification('Region not found', 'error');
            return;
        }
        
        // Create and show details modal
        let detailsHtml = `
            <div style="max-width: 600px;">
                <h3>${region.regionName} - ${region.regionNameArabic}</h3>
                <p><strong>Governorate:</strong> ${region.governorate}</p>
                <p><strong>Status:</strong> ${region.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Service Types:</strong></p>
                <ul>
                    <li>Delivery: ${region.serviceTypes.delivery ? '✅' : '❌'}</li>
                    <li>Pickup: ${region.serviceTypes.pickup ? '✅' : '❌'}</li>
                    <li>Dine-in: ${region.serviceTypes.dineIn ? '✅' : '❌'}</li>
                </ul>
                <p><strong>Operating Hours:</strong></p>
                <ul>
        `;
        
        Object.entries(region.operatingHours).forEach(([day, hours]) => {
            detailsHtml += `<li>${day}: ${hours.start} - ${hours.end}</li>`;
        });
        
        detailsHtml += `
                </ul>
                <p><strong>Performance:</strong></p>
                <ul>
                    <li>Active Drivers: ${region.activeDrivers}</li>
                    <li>Active Merchants: ${region.activeMerchants}</li>
                    <li>Total Orders: ${region.totalOrders.toLocaleString()}</li>
                </ul>
            </div>
        `;
        
        // For now, show in alert - in production would be a proper modal
        alert(detailsHtml.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n'));
    }

    async deleteRegion(regionId) {
        console.log(`🗑️ Deleting region ${regionId}`);
        
        const region = this.regions.find(r => r.regionId === regionId);
        if (!region) {
            this.showNotification('Region not found', 'error');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete region "${region.regionName}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            // Remove from array
            this.regions = this.regions.filter(r => r.regionId !== regionId);
            
            // Update UI
            this.filterRegions();
            this.updateStatistics();
            await this.loadGovernoratesForFilter();
            
            this.showNotification(`Region ${region.regionName} deleted successfully`, 'success');
            
        } catch (error) {
            console.error('❌ Failed to delete region:', error);
            this.showNotification('Failed to delete region', 'error');
        }
    }

    openRegionModal() {
        const modal = document.getElementById('regionModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeRegionModal() {
        const modal = document.getElementById('regionModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Reset form
        const form = document.getElementById('regionForm');
        if (form) {
            form.reset();
        }
        
        document.getElementById('modalTitle').textContent = 'Add New Region';
        document.getElementById('saveButtonText').textContent = 'Save Region';
    }

    async saveRegion(event) {
        event.preventDefault();
        
        console.log('💾 Saving region...');
        
        try {
            const formData = new FormData(event.target);
            const regionData = {
                regionId: formData.get('regionId') || `REG_${Date.now()}`,
                regionName: formData.get('regionName'),
                regionNameArabic: formData.get('regionNameArabic'),
                governorate: formData.get('governorate'),
                coordinates: {
                    center: {
                        lat: parseFloat(formData.get('centerLat')),
                        lng: parseFloat(formData.get('centerLng'))
                    },
                    boundaries: [] // Would be set via map interface
                },
                deliveryFee: parseInt(formData.get('deliveryFee')),
                minimumOrder: parseInt(formData.get('minimumOrder')),
                estimatedDeliveryTime: parseInt(formData.get('estimatedDeliveryTime')),
                isActive: true,
                serviceTypes: {
                    delivery: true,
                    pickup: true,
                    dineIn: false
                },
                operatingHours: {
                    monday: { start: '08:00', end: '22:00' },
                    tuesday: { start: '08:00', end: '22:00' },
                    wednesday: { start: '08:00', end: '22:00' },
                    thursday: { start: '08:00', end: '22:00' },
                    friday: { start: '08:00', end: '23:00' },
                    saturday: { start: '08:00', end: '23:00' },
                    sunday: { start: '09:00', end: '22:00' }
                },
                activeDrivers: 0,
                activeMerchants: 0,
                totalOrders: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'admin@wizz.com',
                status: 'active'
            };
            
            // Check if editing existing region
            const existingIndex = this.regions.findIndex(r => r.regionId === regionData.regionId);
            
            if (existingIndex >= 0) {
                // Update existing
                this.regions[existingIndex] = { ...this.regions[existingIndex], ...regionData };
                this.showNotification('Region updated successfully', 'success');
            } else {
                // Add new
                this.regions.push(regionData);
                this.showNotification('Region created successfully', 'success');
            }
            
            // Update UI
            this.filterRegions();
            this.updateStatistics();
            await this.loadGovernoratesForFilter();
            
            // Close modal
            this.closeRegionModal();
            
        } catch (error) {
            console.error('❌ Failed to save region:', error);
            this.showNotification('Failed to save region', 'error');
        }
    }

    refreshRegions() {
        console.log('🔄 Refreshing regions...');
        this.loadRegions();
    }

    setLoading(loading) {
        this.isLoading = loading;
        
        const container = document.getElementById('regionsContainer');
        if (!container) return;
        
        if (loading) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div class="loading-spinner"></div>
                    <p>Loading regions...</p>
                </div>
            `;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Global functions for HTML onclick handlers
function openAddRegionModal() {
    if (window.regionsManager) {
        window.regionsManager.openRegionModal();
    }
}

function closeRegionModal() {
    if (window.regionsManager) {
        window.regionsManager.closeRegionModal();
    }
}

function filterRegions() {
    if (window.regionsManager) {
        window.regionsManager.filterRegions();
    }
}

function refreshRegions() {
    if (window.regionsManager) {
        window.regionsManager.refreshRegions();
    }
}

// Initialize global instance
window.regionsManager = new RegionsManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RegionsManager;
}
