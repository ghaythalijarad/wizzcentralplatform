// WizzCentral Iraq Regions Management - Multi-Level Hierarchy
// Comprehensive regions management with governorates, districts, neighborhoods

class IraqRegionsManager {
    constructor() {
        this.apiBase = window.location.origin;
        this.regionsData = [];
        this.currentLevel = 'governorate'; // Start with governorates
        this.currentParent = 'iraq'; // Iraq root
        this.selectedRegion = null;
        this.map = null;
        this.mapMarkers = [];
        this.hierarchyPath = [];
        this.levelNames = ['Country', 'Governorate', 'District', 'Neighborhood', 'Street'];
        this.levelMapping = {
            0: 'country',
            1: 'governorate', 
            2: 'district',
            3: 'neighborhood',
            4: 'street'
        };
        
        // Initialize event listeners
        this.initializeEventListeners();
    }

    async init() {
        console.log('🇮🇶 Iraq Regions Manager: Initializing...');
        
        try {
            // Initialize map first
            await this.initializeMap();
            
            // Load initial regions data (governorates)
            await this.loadRegions();
            
            // Load statistics
            await this.loadStatistics();
            
            console.log('✅ Iraq Regions Manager: Initialized successfully');
        } catch (error) {
            console.error('❌ Iraq Regions Manager: Initialization failed:', error);
            console.log('🔄 Attempting fallback initialization with sample data...');
            
            // Fallback initialization with sample data
            try {
                await this.initializeMap();
                this.loadSampleRegionsData('governorate', 'iraq');
                this.showError('API unavailable - showing sample data for demonstration');
                console.log('✅ Iraq Regions Manager: Fallback initialization successful');
            } catch (fallbackError) {
                console.error('❌ Fallback initialization also failed:', fallbackError);
                this.showError('Failed to initialize regions management');
            }
        }
    }

    initializeEventListeners() {
        // Level navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('.level-nav-btn')) {
                const level = parseInt(e.target.dataset.level);
                const parentId = e.target.dataset.parentId;
                this.navigateToLevel(level, parentId);
            }
            
            if (e.target.matches('.region-drill-down')) {
                e.preventDefault();
                const regionId = e.target.dataset.regionId;
                this.drillDownToRegion(regionId);
            }

            if (e.target.matches('.breadcrumb-item')) {
                const level = parseInt(e.target.dataset.level);
                const regionId = e.target.dataset.regionId;
                this.navigateToLevel(level, regionId);
            }
        });

        // Search functionality
        const searchInput = document.getElementById('regionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.searchRegions(searchInput.value);
            }, 300));
        }

        // Add region button
        const addButton = document.querySelector('.btn-add-region');
        if (addButton) {
            addButton.addEventListener('click', () => this.openAddRegionModal());
        }
    }

    async loadRegions(level = this.currentLevel, parentId = this.currentParent, search = '') {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                level: level, // Use level directly as string
                limit: '100'
            });

            if (parentId && parentId !== 'iraq') { // Changed from REG_IQ to iraq
                params.append('parent_id', parentId); // Fixed: use parent_id instead of parentId
            }
            
            if (search) {
                params.append('search', search);
            }

            console.log('📍 Loading regions with params:', params.toString());
            const response = await fetch(`${this.apiBase}/api/regions?${params}`);
            const result = await response.json();

            console.log('📍 API Response:', result);

            if (result.success) {
                this.regionsData = result.data;
                this.currentLevel = level;
                this.currentParent = parentId;
                
                // Update hierarchy path
                await this.updateHierarchyPath();
                
                // Render regions
                this.renderRegions();
                this.updateMapMarkers();
                
                console.log(`📍 Loaded ${this.regionsData.length} regions for level ${level}`);
            } else {
                throw new Error(result.error || 'Failed to load regions');
            }
        } catch (error) {
            console.error('❌ Error loading regions:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                apiBase: this.apiBase,
                level: level,
                parentId: parentId
            });
            
            // Fallback: Use sample data if API is not available
            console.log('🔄 Loading fallback sample data...');
            this.loadSampleRegionsData(level, parentId);
            
            this.showError(`API unavailable, showing sample data: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    async updateHierarchyPath() {
        try {
            if (this.currentParent && this.currentParent !== 'iraq') {
                // Only fetch region details if it's not the root 'iraq' identifier
                const response = await fetch(`${this.apiBase}/api/regions/${this.currentParent}`);
                const result = await response.json();
                
                if (result.success && result.data.fullPath) {
                    this.hierarchyPath = result.data.fullPath;
                } else {
                    this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', level: 0 }];
                }
            } else {
                // For root 'iraq', set up the basic hierarchy
                this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', level: 0 }];
            }
            
            this.renderBreadcrumb();
        } catch (error) {
            console.error('Error updating hierarchy path:', error);
            this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', level: 0 }];
            this.renderBreadcrumb();
        }
    }

    async checkServerStatus() {
        try {
            console.log('🔍 Checking server status...');
            const response = await fetch(`${this.apiBase}/health`, { 
                method: 'GET',
                timeout: 5000 
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Server is online:', result);
                return true;
            } else {
                console.log('❌ Server responded with error:', response.status, response.statusText);
                return false;
            }
        } catch (error) {
            console.log('❌ Server is not accessible:', error.message);
            console.log('💡 Make sure the development server is running:');
            console.log('   cd /Users/ghaythallaheebi/wizzcentralplatform');
            console.log('   node local-dev-server.js');
            return false;
        }
    }

    renderBreadcrumb() {
        const container = document.getElementById('hierarchyBreadcrumb');
        if (!container) {
            // Create breadcrumb container if it doesn't exist
            const header = document.querySelector('.regions-header');
            if (header) {
                const breadcrumbDiv = document.createElement('div');
                breadcrumbDiv.id = 'hierarchyBreadcrumb';
                breadcrumbDiv.className = 'hierarchy-breadcrumb';
                header.appendChild(breadcrumbDiv);
            } else {
                return;
            }
        }

        const finalContainer = document.getElementById('hierarchyBreadcrumb');
        
        finalContainer.innerHTML = `
            <div class="breadcrumb-container">
                <div class="breadcrumb-path">
                    ${this.hierarchyPath.map((item, index) => `
                        <button class="breadcrumb-item ${index === this.hierarchyPath.length - 1 ? 'active' : ''}"
                                data-level="${item.level || index}" 
                                data-region-id="${item.regionId}">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${item.regionName}</span>
                            <span class="arabic">(${item.regionNameArabic})</span>
                        </button>
                        ${index < this.hierarchyPath.length - 1 ? '<i class="fas fa-chevron-right breadcrumb-separator"></i>' : ''}
                    `).join('')}
                </div>
                <div class="level-indicator">
                    <span class="level-badge">Level ${this.currentLevel}: ${this.levelNames[this.currentLevel] || 'Unknown'}</span>
                    <span class="region-count">${this.regionsData.length} regions</span>
                </div>
            </div>
        `;

        // Add styles if not already present
        this.addBreadcrumbStyles();
    }

    addBreadcrumbStyles() {
        if (document.getElementById('breadcrumb-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'breadcrumb-styles';
        styles.textContent = `
            .hierarchy-breadcrumb {
                margin: 1rem 0;
                padding: 1rem;
                background: var(--md-sys-color-surface-container);
                border-radius: var(--md-sys-shape-corner-medium);
                border: 1px solid var(--md-sys-color-outline-variant);
            }

            .breadcrumb-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 1rem;
            }

            .breadcrumb-path {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .breadcrumb-item {
                background: none;
                border: 1px solid var(--md-sys-color-outline);
                border-radius: var(--md-sys-shape-corner-small);
                padding: 0.5rem 0.75rem;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                color: var(--md-sys-color-on-surface);
            }

            .breadcrumb-item:hover {
                background: var(--md-sys-color-surface-container-high);
                border-color: var(--md-sys-color-primary);
            }

            .breadcrumb-item.active {
                background: var(--md-sys-color-primary-container);
                border-color: var(--md-sys-color-primary);
                color: var(--md-sys-color-on-primary-container);
                cursor: default;
            }

            .breadcrumb-item .arabic {
                font-size: 0.75rem;
                opacity: 0.7;
            }

            .breadcrumb-separator {
                color: var(--md-sys-color-on-surface-variant);
                font-size: 0.75rem;
            }

            .level-indicator {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .level-badge {
                background: var(--md-sys-color-secondary-container);
                color: var(--md-sys-color-on-secondary-container);
                padding: 0.25rem 0.75rem;
                border-radius: var(--md-sys-shape-corner-full);
                font-size: 0.875rem;
                font-weight: 500;
            }

            .region-count {
                color: var(--md-sys-color-on-surface-variant);
                font-size: 0.875rem;
            }

            .search-results-indicator {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.75rem;
                background: var(--md-sys-color-tertiary-container);
                color: var(--md-sys-color-on-tertiary-container);
                border-radius: var(--md-sys-shape-corner-medium);
            }

            .btn-clear-search {
                background: var(--md-sys-color-surface);
                border: 1px solid var(--md-sys-color-outline);
                border-radius: var(--md-sys-shape-corner-small);
                padding: 0.25rem 0.5rem;
                cursor: pointer;
                transition: all 0.2s ease;
                color: var(--md-sys-color-on-surface);
            }

            .btn-clear-search:hover {
                background: var(--md-sys-color-surface-container);
            }
        `;
        document.head.appendChild(styles);
    }

    renderRegions() {
        const container = document.getElementById('regionsTableContainer');
        if (!container) return;

        if (this.regionsData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map"></i>
                    <h3>No regions found</h3>
                    <p>No regions available at this level</p>
                    <button class="btn-primary" onclick="regionsManager.openAddRegionModal()">
                        <i class="fas fa-plus"></i>
                        Add First Region
                    </button>
                </div>
            `;
            return;
        }

        // Create table rows for regions
        const tableRows = this.regionsData.map(region => {
            const nextLevel = this.getNextLevel(region.level);
            return `
                <tr class="region-row ${region.is_active ? 'active' : 'inactive'}">
                    <td>
                        <div class="region-name-cell">
                            <strong>${region.name}</strong>
                            <div class="region-name-arabic">${region.name_ar}</div>
                        </div>
                    </td>
                    <td>
                        <span class="level-badge">${region.level}</span>
                    </td>
                    <td>
                        <span class="status-badge ${region.is_active ? 'active' : 'inactive'}">
                            ${region.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>${region.statistics?.active_drivers || 0}</td>
                    <td>${region.statistics?.active_merchants || 0}</td>
                    <td>${region.statistics?.total_orders || 0}</td>
                    <td>
                        <div class="action-buttons">
                            ${nextLevel ? `<button class="btn-small btn-primary region-drill-down" data-region-id="${region.id}" title="View sub-regions"><i class="fas fa-search-plus"></i></button>` : ''}
                            <button class="btn-small btn-secondary" onclick="regionsManager.toggleRegionStatus('${region.id}')" title="Toggle status"><i class="fas fa-power-off"></i></button>
                            <button class="btn-small btn-outline" onclick="regionsManager.editRegion('${region.id}')" title="Edit region"><i class="fas fa-edit"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Create the complete table
        container.innerHTML = `
        if (document.getElementById('regions-table-styles')) return;
                <table class="regions-table">
        const styles = document.createElement('style');
        styles.id = 'regions-table-styles';
        styles.textContent = `h>Region Name</th>
            .table-responsive {>Level</th>
                overflow-x: auto;tatus</th>
                margin: 1rem 0;>Drivers</th>
            }               <th>Merchants</th>
                            <th>Orders</th>
            .regions-table {<th>Actions</th>
                width: 100%;>
                border-collapse: collapse;
                background: var(--md-sys-color-surface);
                border-radius: var(--md-sys-shape-corner-medium);
                overflow: hidden;
                box-shadow: var(--md-sys-elevation-1);
            }/div>
        `;
            .regions-table th {
                background: var(--md-sys-color-surface-container);
                color: var(--md-sys-color-on-surface);
                padding: 1rem 0.75rem;
                text-align: left;
                font-weight: 500;
                font-size: 0.875rem;'regions-table-styles')) return;
                border-bottom: 1px solid var(--md-sys-color-outline-variant);
            } styles = document.createElement('style');
        styles.id = 'regions-table-styles';
            .regions-table td {
                padding: 0.75rem;
                border-bottom: 1px solid var(--md-sys-color-outline-variant);
                vertical-align: middle;
            }

            .region-row:hover {
                background: var(--md-sys-color-surface-container-low);
            }   border-collapse: collapse;
                background: var(--md-sys-color-surface);
            .region-name-cell strong {d-sys-shape-corner-medium);
                display: block;n;
                color: var(--md-sys-color-on-surface);
                font-size: 0.875rem;
            }
            .regions-table th {
            .region-name-arabic {-md-sys-color-surface-container);
                font-size: 0.75rem;-color-on-surface);
                color: var(--md-sys-color-on-surface-variant);
                margin-top: 0.25rem;
            }   font-weight: 500;
                font-size: 0.875rem;
            .level-badge {tom: 1px solid var(--md-sys-color-outline-variant);
                background: var(--md-sys-color-secondary-container);
                color: var(--md-sys-color-on-secondary-container);
                padding: 0.25rem 0.5rem;
                border-radius: var(--md-sys-shape-corner-small);
                font-size: 0.75rem;solid var(--md-sys-color-outline-variant);
                font-weight: 500;iddle;
                text-transform: capitalize;
            }
            .region-row:hover {
            .status-badge { var(--md-sys-color-surface-container-low);
                padding: 0.25rem 0.75rem;
                border-radius: var(--md-sys-shape-corner-full);
                font-size: 0.75rem;g {
                font-weight: 500;
            }   color: var(--md-sys-color-on-surface);
                font-size: 0.875rem;
            .status-badge.active {
                background: var(--md-sys-color-primary-container);
                color: var(--md-sys-color-on-primary-container);
            }   font-size: 0.75rem;
                color: var(--md-sys-color-on-surface-variant);
            .status-badge.inactive {
                background: var(--md-sys-color-error-container);
                color: var(--md-sys-color-on-error-container);
            }level-badge {
                background: var(--md-sys-color-secondary-container);
            .action-buttons {md-sys-color-on-secondary-container);
                display: flex;em 0.5rem;
                gap: 0.5rem;s: var(--md-sys-shape-corner-small);
                align-items: center;
            }   font-weight: 500;
                text-transform: capitalize;
            .btn-small {
                padding: 0.375rem 0.5rem;
                border: none;
                border-radius: var(--md-sys-shape-corner-small);
                cursor: pointer;ar(--md-sys-shape-corner-full);
                transition: all 0.2s ease;
                font-size: 0.75rem;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 32px;--md-sys-color-primary-container);
                height: 32px;md-sys-color-on-primary-container);
            }

            .btn-small.btn-primary {
                background: var(--md-sys-color-primary);tainer);
                color: var(--md-sys-color-on-primary);tainer);
            }

            .btn-small.btn-primary:hover {
                background: var(--md-sys-color-primary-container);
                color: var(--md-sys-color-on-primary-container);
            }   align-items: center;
            }
            .btn-small.btn-secondary {
                background: var(--md-sys-color-secondary);
                color: var(--md-sys-color-on-secondary);
            }   border: none;
                border-radius: var(--md-sys-shape-corner-small);
            .btn-small.btn-secondary:hover {
                background: var(--md-sys-color-secondary-container);
                color: var(--md-sys-color-on-secondary-container);
            }   display: inline-flex;
                align-items: center;
            .btn-small.btn-outline {ter;
                background: transparent;
                border: 1px solid var(--md-sys-color-outline);
                color: var(--md-sys-color-on-surface);
            }
            .btn-small.btn-primary {
            .btn-small.btn-outline:hover {olor-primary);
                background: var(--md-sys-color-surface-container);
            }
        `;
        document.head.appendChild(styles);
    }           background: var(--md-sys-color-primary-container);
                color: var(--md-sys-color-on-primary-container);
    getNextLevel(currentLevel) {
        const levelSequence = ['country', 'governorate', 'district', 'neighborhood', 'street'];
        const totalDriversEl = document.getElementById('totalDrivers');
        if (totalDriversEl) totalDriversEl.textContent = stats.serviceStats.totalDrivers;

        // Update total merchants
        const totalMerchantsEl = document.getElementById('totalMerchants');
        if (totalMerchantsEl) totalMerchantsEl.textContent = stats.serviceStats.totalMerchants;
    }

    async initializeMap() {
        try {
            const mapContainer = document.getElementById('regionsMap');
            if (!mapContainer) {
                console.warn('Map container not found');
                return;
            }

            // Initialize Leaflet map centered on Iraq
            this.map = L.map('regionsMap').setView([33.2232, 43.6793], 6);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            console.log('✅ Map initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing map:', error);
        }
    }

    updateMapMarkers() {
        if (!this.map) return;

        // Clear existing markers
        this.mapMarkers.forEach(marker => this.map.removeLayer(marker));
        this.mapMarkers = [];

        // Add markers for current regions
        this.regionsData.forEach(region => {
            if (region.coordinates && region.coordinates.center) {
                const marker = L.marker([
                    region.coordinates.center.lat,
                    region.coordinates.center.lng
                ]).addTo(this.map);

                marker.bindPopup(`
                    <div>
                        <h4>${region.regionName}</h4>
                        <p>${region.regionNameArabic}</p>
                        <p>Status: ${region.serviceConfig.isActive ? 'Active' : 'Inactive'}</p>
                        <p>Drivers: ${region.statistics.activeDrivers}</p>
                        <p>Merchants: ${region.statistics.activeMerchants}</p>
                    </div>
                `);

                this.mapMarkers.push(marker);
            }
        });

        // Fit map to show all markers
        if (this.mapMarkers.length > 0) {
            const group = new L.featureGroup(this.mapMarkers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    focusOnMap(regionId) {
        const region = this.regionsData.find(r => r.regionId === regionId);
        if (!region || !region.coordinates || !this.map) return;

        this.map.setView([
            region.coordinates.center.lat,
            region.coordinates.center.lng
        ], 12);

        // Open popup for this region
        this.mapMarkers.forEach(marker => {
            const markerLatLng = marker.getLatLng();
            if (markerLatLng.lat === region.coordinates.center.lat &&
                markerLatLng.lng === region.coordinates.center.lng) {
                marker.openPopup();
            }
        });
    }

    openAddRegionModal() {
        console.log('Opening add region modal for level:', this.currentLevel + 1);
        // Implementation for add region modal
    }

    editRegion(regionId) {
        console.log('Editing region:', regionId);
        // Implementation for edit region
    }

    async deleteRegion(regionId) {
        const region = this.regionsData.find(r => r.regionId === regionId);
        if (!region) return;

        if (!confirm(`Are you sure you want to delete "${region.regionName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/api/regions/${regionId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                await this.loadRegions(this.currentLevel, this.currentParent);
                await this.loadStatistics();
                this.showSuccess('Region deleted successfully');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error deleting region:', error);
            this.showError('Failed to delete region');
        }
    }

    refreshRegions() {
        this.loadRegions(this.currentLevel, this.currentParent);
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showLoading() {
        const container = document.getElementById('regionsTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="loading-spinner"></div>
                    <h3>Loading regions...</h3>
                    <p>Please wait while we load the regional data</p>
                </div>
            `;
        }
    }

    hideLoading() {
        // Loading is hidden when renderRegions() is called
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);

        // Add notification styles if not present
        this.addNotificationStyles();
    }

    addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--md-sys-color-surface);
                border: 1px solid var(--md-sys-color-outline);
                border-radius: var(--md-sys-shape-corner-medium);
                padding: 1rem;
                box-shadow: var(--md-sys-elevation-3);
                z-index: 10000;
                max-width: 400px;
                display: flex;
                align-items: center;
                gap: 1rem;
                animation: slideIn 0.3s ease-out;
            }

            .notification-error {
                border-color: var(--md-sys-color-error);
                background: var(--md-sys-color-error-container);
                color: var(--md-sys-color-on-error-container);
            }

            .notification-success {
                border-color: var(--md-sys-color-success);
                background: var(--md-sys-color-success-container);
                color: var(--md-sys-color-on-success-container);
            }

            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex: 1;
            }

            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                color: inherit;
                opacity: 0.7;
                transition: opacity 0.2s ease;
            }

            .notification-close:hover {
                opacity: 1;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    loadSampleRegionsData(level, parentId) {
        console.log('📊 Loading sample Iraqi regions data...');
        
        // Sample Iraqi regions data based on level
        const sampleData = {
            governorate: [
                {
                    id: 'IQ-BA',
                    name: 'Baghdad',
                    name_ar: 'بغداد',
                    level: 'governorate',
                    parent_id: 'iraq',
                    coordinates: { lat: 33.3152, lng: 44.3661 },
                    is_active: true,
                    service_config: { delivery: true, pickup: true },
                    statistics: { population: 9500000, area_km2: 4555, total_orders: 15420, active_drivers: 234 }
                },
                {
                    id: 'IQ-BA2',
                    name: 'Basra',
                    name_ar: 'البصرة',
                    level: 'governorate',
                    parent_id: 'iraq',
                    coordinates: { lat: 30.5085, lng: 47.7804 },
                    is_active: true,
                    service_config: { delivery: true, pickup: true },
                    statistics: { population: 2750000, area_km2: 19070, total_orders: 8340, active_drivers: 89 }
                },
                {
                    id: 'IQ-AR',
                    name: 'Erbil',
                    name_ar: 'أربيل',
                    level: 'governorate',
                    parent_id: 'iraq',
                    coordinates: { lat: 36.1911, lng: 44.0092 },
                    is_active: true,
                    service_config: { delivery: true, pickup: true },
                    statistics: { population: 1920000, area_km2: 15074, total_orders: 5670, active_drivers: 67 }
                },
                {
                    id: 'IQ-NA',
                    name: 'Najaf',
                    name_ar: 'النجف',
                    level: 'governorate',
                    parent_id: 'iraq',
                    coordinates: { lat: 31.9996, lng: 44.3267 },
                    is_active: true,
                    service_config: { delivery: true, pickup: true },
                    statistics: { population: 1350000, area_km2: 28824, total_orders: 3240, active_drivers: 45 }
                },
                {
                    id: 'IQ-SU',
                    name: 'Sulaymaniyah',
                    name_ar: 'السليمانية',
                    level: 'governorate',
                    parent_id: 'iraq',
                    coordinates: { lat: 35.5495, lng: 45.4394 },
                    is_active: false,
                    service_config: { delivery: false, pickup: false },
                    statistics: { population: 1970000, area_km2: 17023, total_orders: 0, active_drivers: 0 }
                }
            ],
            district: [
                {
                    id: 'IQ-BA-KH',
                    name: 'Karkh',
                    name_ar: 'الكرخ',
                    level: 'district',
                    parent_id: 'IQ-BA',
                    coordinates: { lat: 33.3380, lng: 44.3440 },
                    is_active: true,
                    service_config: { delivery: true, pickup: true },
                    statistics: { population: 2100000, area_km2: 860, total_orders: 4200, active_drivers: 67 }
                },
                {
                    id: 'IQ-BA-RU',
                    name: 'Rusafa',
                    name_ar: 'الرصافة',
                    level: 'district',
                    parent_id: 'IQ-BA',
                    coordinates: { lat: 33.3250, lng: 44.3890 },
                    is_active: true,
                    service_config: { delivery: true, pickup: true },
                    statistics: { population: 1850000, area_km2: 755, total_orders: 3890, active_drivers: 58 }
                }
            ]
        };
        
        // Set the appropriate data based on level
        this.regionsData = sampleData[level] || sampleData.governorate;
        this.currentLevel = level;
        this.currentParent = parentId;
        
        // Update hierarchy path for sample data
        this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', level: 0 }];
        
        // Render the data
        this.renderRegions();
        this.renderBreadcrumb();
        this.updateMapMarkers();
        
        console.log(`📊 Loaded ${this.regionsData.length} sample regions for level ${level}`);
    }
}

// Global instance and functions
let regionsManager;

// Global functions for HTML onclick handlers
function openAddRegionModal() {
    if (regionsManager) {
        regionsManager.openAddRegionModal();
    }
}

function closeRegionModal() {
    if (regionsManager) {
        regionsManager.closeRegionModal();
    }
}

function refreshRegionsData() {
    if (regionsManager) {
        regionsManager.refreshRegions();
    }
}

function saveRegion() {
    if (regionsManager) {
        regionsManager.saveRegion();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IraqRegionsManager;
}
