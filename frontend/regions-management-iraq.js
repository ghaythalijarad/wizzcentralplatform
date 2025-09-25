// WizzCentral Iraq Regions Management - Multi-Level Hierarchy
// Comprehensive regions management with governorates, districts, neighborhoods
// Version redeploy marker: 2025-09-25T00:00:00Z force Amplify build

const SCRIPT_VERSION = "20250925.2";

class IraqRegionsManager {
    constructor() {
        // Determine API base robustly for dev (Vite on 5173) vs local API on 3000
        const { protocol, hostname, port } = window.location;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        this.isProduction = window.location.hostname.includes('amplifyapp.com') ||
                            window.location.hostname.includes('d2f5oacwil9cbi.amplifyapp.com');
        if (this.isProduction) {
            // In production we won't call the API; keep origin for completeness
            this.apiBase = window.location.origin;
        } else if (isLocalhost) {
            // If running frontend on Vite (5173) or any port != 3000, point API to 3000
            const apiPort = port && port !== '3000' ? '3000' : (port || '3000');
            this.apiBase = `${protocol}//${hostname}:${apiPort}`;
        } else {
            this.apiBase = window.location.origin;
        }

        this.regionsData = [];
        this.currentLevel = 'governorate';
        this.currentParent = 'iraq';
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
        // Hold full sample dataset for production and offline fallbacks
        this.sampleData = null;
        
        console.log('🌍 Environment detected:', this.isProduction ? 'Production (Amplify)' : 'Development');
        console.log('🔗 API Base:', this.apiBase);
        
        // Initialize event listeners
        this.initializeEventListeners();
    }

    async init() {
        // Display version badge
        const versionBadge = document.getElementById('version-badge');
        if (versionBadge) {
            versionBadge.textContent = `v${SCRIPT_VERSION}`;
        }

        // Normalize header to remove deprecated metric columns before data load
        this.normalizeTableHeader();
        console.log('🇮🇶 Iraq Regions Manager: Initializing...');
        try {
            await this.initializeMap();
            
            if (this.isProduction) {
                console.log('🌍 Production environment detected - using sample data');
                this.loadSampleRegionsData('governorate', 'iraq');
                this.showNotification('Regions management loaded successfully', 'success');
            } else {
                try {
                    console.log('🌐 Development environment - attempting to load regions from API...');
                    await this.loadRegions();
                    console.log('✅ Successfully loaded regions from API');
                } catch (apiError) {
                    console.log('🔄 API unavailable - falling back to sample data');
                    this.loadSampleRegionsData('governorate', 'iraq');
                    this.showNotification('Development mode: showing sample data', 'info');
                }
            }
            
            console.log('✅ Iraq Regions Manager: Initialized successfully');
        } catch (error) {
            console.error('❌ Iraq Regions Manager: Initialization failed:', error);
            try {
                await this.initializeMap();
                this.loadSampleRegionsData('governorate', 'iraq');
                this.showError('Using offline sample data - some features may be limited');
                console.log('✅ Iraq Regions Manager: Emergency fallback successful');
            } catch (fallbackError) {
                console.error('❌ Complete initialization failure:', fallbackError);
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
        // In production (Amplify), use sample data only since no backend APIs are available
        if (this.isProduction) {
            console.log('🌍 Production environment: Using sample data (no backend APIs on Amplify)');
            this.loadSampleRegionsData(level, parentId);
            if (search) this.applyClientSearch(search, level);
            this.showNotification('Regions loaded successfully', 'success');
            return;
        }

        // Development environment: Try API first, fallback to sample data
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                level: level,
                limit: '100'
            });

            if (parentId && parentId !== 'iraq') {
                params.append('parent_id', parentId);
            }
            
            if (search) {
                params.append('search', search);
            }

            console.log('📍 Loading regions with params:', params.toString(), '->', `${this.apiBase}/api/regions`);
            const response = await fetch(`${this.apiBase}/api/regions?${params}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();

            if (result.success) {
                this.regionsData = result.data;
                this.currentLevel = level;
                this.currentParent = parentId;
                
                // Update hierarchy path
                await this.updateHierarchyPath();
                
                // Render regions
                this.renderRegions();
                this.updateMapMarkers();
                
                console.log(`📍 Loaded ${this.regionsData.length} regions for level ${level} from API`);
                
                // Show success notification for API data
                if (this.regionsData.length > 0) {
                    this.showNotification(`Loaded ${this.regionsData.length} regions from server`, 'success');
                }
            } else {
                throw new Error(result.error || 'Failed to load regions');
            }
        } catch (error) {
            console.error('❌ Error loading regions:', error);
            console.log('🔄 API unavailable in development - falling back to sample data');
            this.loadSampleRegionsData(level, parentId);
            if (search) this.applyClientSearch(search, level);
            this.showNotification('Development mode: showing sample data', 'info');
        } finally {
            this.hideLoading();
        }
    }

    async updateHierarchyPath() {
        try {
            if (!this.hierarchyPath || this.hierarchyPath.length === 0) {
                this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', depth: 0 }];
            }

            if (this.currentParent && this.currentParent !== 'iraq') {
                const tail = this.hierarchyPath[this.hierarchyPath.length - 1];
                if (!tail || tail.regionId !== this.currentParent) {
                    if (this.isProduction) {
                        // In production, use local lookup only
                        const r = this.findRegionById(this.currentParent) || {};
                        this.hierarchyPath.push({
                            regionName: r.name || 'Unknown',
                            regionNameArabic: r.name_ar || 'غير معروف',
                            regionId: r.id || this.currentParent,
                            depth: this.hierarchyPath.length
                        });
                    } else {
                        // In development, try API first then fallback to local lookup
                        try {
                            const response = await fetch(`${this.apiBase}/api/regions/${this.currentParent}`);
                            if (response.ok) {
                                const result = await response.json();
                                const r = result.data || {};
                                this.hierarchyPath.push({
                                    regionName: r.name || 'Unknown',
                                    regionNameArabic: r.name_ar || 'غير معروف',
                                    regionId: r.id || this.currentParent,
                                    depth: this.hierarchyPath.length
                                });
                            } else {
                                throw new Error('API not available');
                            }
                        } catch (apiError) {
                            // Fallback to local lookup
                            const r = this.findRegionById(this.currentParent) || {};
                            this.hierarchyPath.push({
                                regionName: r.name || 'Unknown',
                                regionNameArabic: r.name_ar || 'غير معروف',
                                regionId: r.id || this.currentParent,
                                depth: this.hierarchyPath.length
                            });
                        }
                    }
                }
            } else {
                this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', depth: 0 }];
            }
            
            this.renderBreadcrumb();
        } catch (error) {
            console.error('Error updating hierarchy path:', error);
            this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', depth: 0 }];
            this.renderBreadcrumb();
        }
    }

    async checkServerStatus() {
        try {
            console.log('🔍 Checking server status...');
            const response = await fetch(`${this.apiBase}/health`, { 
                method: 'GET'
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
        if (!container) return;

        const levelDisplay = (lvl) => {
            switch (lvl) {
                case 'country': return 'Country';
                case 'governorate': return 'Governorate';
                case 'district': return 'District';
                case 'neighborhood': return 'Neighborhood';
                case 'street': return 'Street';
                default: return 'Unknown';
            }
        };

        container.innerHTML = `
            <div class="breadcrumb-container">
                <div class="breadcrumb-path">
                    ${this.hierarchyPath.map((item, index) => `
                        <button class="breadcrumb-item ${index === this.hierarchyPath.length - 1 ? 'active' : ''}"
                                data-level="${index}"
                                data-region-id="${item.regionId}">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${item.regionName}</span>
                            <span class="arabic">(${item.regionNameArabic})</span>
                        </button>
                        ${index < this.hierarchyPath.length - 1 ? '<i class="fas fa-chevron-right breadcrumb-separator"></i>' : ''}
                    `).join('')}
                </div>
                <div class="level-indicator">
                    <span class="level-badge">Level: ${levelDisplay(this.currentLevel)}</span>
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

            .breadcrumb-item:hover { background: var(--md-sys-color-surface-container-high); border-color: var(--md-sys-color-primary); }
            .breadcrumb-item.active { background: var(--md-sys-color-primary-container); border-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary-container); cursor: default; }
            .breadcrumb-item .arabic { font-size: 0.75rem; opacity: 0.7; }
            .breadcrumb-separator { color: var(--md-sys-color-on-surface-variant); font-size: 0.75rem; }
            .level-indicator { display: flex; align-items: center; gap: 1rem; }
            .level-badge { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); padding: 0.25rem 0.75rem; border-radius: var(--md-sys-shape-corner-full); font-size: 0.875rem; font-weight: 500; }
            .region-count { color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem; }
        `;
        document.head.appendChild(styles);
    }

    renderRegions() {
        // Ensure header stays normalized in case of dynamic reinjection
        this.normalizeTableHeader();
        // Populate the existing table body in regions.html
        const tbody = document.getElementById('regionsTableBody');
        if (!tbody) return;

        if (!Array.isArray(this.regionsData) || this.regionsData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading-cell">
                        <div class="empty-state">
                            <i class="fas fa-map"></i>
                            <h3>No regions found</h3>
                            <p>No regions available at this level</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const rows = this.regionsData.map(region => {
            const nextLevel = this.getNextLevel(region.level);
            const isActive = !!region.is_active;
            const governorate = region.governorate_id || (region.level === 'governorate' ? '-' : (region.parent_id || '-'));

            return `
                <tr class="region-row ${isActive ? 'active' : 'inactive'}">
                    <td>
                        <div class="region-name-cell">
                            <span class="region-name-en">${region.name || 'Unknown'}</span>
                            <span class="region-name-ar">${region.name_ar || ''}</span>
                        </div>
                    </td>
                    <td>${governorate || '-'}</td>
                    <td>
                        <span class="status-badge ${isActive ? 'active' : 'inactive'}">
                            ${isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td class="actions-cell">
                        ${nextLevel ? `<button class="action-btn view region-drill-down" data-region-id="${region.id}"><i class="fas fa-search-plus"></i> View</button>` : ''}
                        <button class="action-btn edit" onclick="regionsManager.editRegion && regionsManager.editRegion('${region.id}')"><i class="fas fa-edit"></i> Edit</button>
                        <button class="action-btn toggle" onclick="regionsManager.toggleRegionStatus && regionsManager.toggleRegionStatus('${region.id}')"><i class="fas fa-power-off"></i> Toggle</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }

    getNextLevel(currentLevel) {
        const order = ['country', 'governorate', 'district', 'neighborhood', 'street'];
        const idx = order.indexOf(currentLevel);
        if (idx === -1 || idx === order.length - 1) return null;
        return order[idx + 1];
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
            const coords = region.coordinates || {};
            const center = coords.center || coords;
            if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
                const marker = L.marker([center.lat, center.lng]).addTo(this.map);

                marker.bindPopup(`
                    <div>
                        <h4>${region.name || ''}</h4>
                        <p>${region.name_ar || ''}</p>
                        <p>Status: ${region.is_active ? 'Active' : 'Inactive'}</p>
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
        const region = this.regionsData.find(r => r.id === regionId);
        if (!region || !region.coordinates || !this.map) return;

        const coords = region.coordinates.center || region.coordinates;
        if (!coords) return;

        this.map.setView([coords.lat, coords.lng], 12);

        // Open popup for this region
        this.mapMarkers.forEach(marker => {
            const markerLatLng = marker.getLatLng();
            if (markerLatLng.lat === coords.lat && markerLatLng.lng === coords.lng) {
                marker.openPopup();
            }
        });
    }

    // Navigation helpers
    drillDownToRegion(regionId) {
        const region = this.regionsData.find(r => r.id === regionId);
        if (!region) return;
        const nextLevel = this.getNextLevel(region.level);
        if (!nextLevel) return;

        // Extend breadcrumb path
        this.hierarchyPath = this.hierarchyPath && this.hierarchyPath.length > 0 ? this.hierarchyPath : [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', depth: 0 }];
        this.hierarchyPath.push({
            regionName: region.name,
            regionNameArabic: region.name_ar,
            regionId: region.id,
            depth: this.hierarchyPath.length
        });
        this.renderBreadcrumb();

        // Load children of selected region
        this.loadRegions(nextLevel, region.id);
    }

    navigateToLevel(depthIndex, regionId) {
        // depthIndex corresponds to breadcrumb index (0=root Iraq)
        const levelByDepth = ['governorate', 'district', 'neighborhood', 'street'];
        const targetLevel = levelByDepth[depthIndex] || 'governorate';
        const targetParent = regionId || 'iraq';

        // Trim path
        this.hierarchyPath = (this.hierarchyPath || []).slice(0, depthIndex + 1);
        if (this.hierarchyPath.length === 0) {
            this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', depth: 0 }];
        }
        this.renderBreadcrumb();

        // Load target
        this.loadRegions(targetLevel, targetParent);
    }

    searchRegions(term) {
        const q = (term || '').trim();
        if (this.isProduction) {
            // In production, use client-side search only
            this.applyClientSearch(q, this.currentLevel);
        } else {
            // In development, try API first, fallback to client search if needed
            this.loadRegions(this.currentLevel, this.currentParent, q).catch(() => {
                // If API fails, use client-side search
                this.applyClientSearch(q, this.currentLevel);
            });
        }
    }

    // Client-side search over sample data or current list
    applyClientSearch(term, level = this.currentLevel) {
        try {
            const base = (this.sampleData?.[level]) ? this.sampleData[level] : this.regionsData;
            const q = (term || '').toLowerCase();
            if (!q) {
                // Reset to base
                this.regionsData = base.slice();
            } else {
                this.regionsData = base.filter(r => {
                    const en = (r.name || '').toLowerCase();
                    const ar = (r.name_ar || '');
                    const id = (r.id || '').toLowerCase();
                    return en.includes(q) || ar.includes(term) || id.includes(q);
                });
            }
            this.renderRegions();
            this.updateMapMarkers();
            this.renderBreadcrumb();
        } catch (e) {
            console.warn('Client search failed:', e.message);
        }
    }

    findRegionById(regionId) {
        if (!regionId) return null;
        // Search current view first
        let found = (this.regionsData || []).find(r => r.id === regionId);
        if (found) return found;
        // Search sample dataset across levels
        if (this.sampleData) {
            for (const lvl of Object.keys(this.sampleData)) {
                const arr = this.sampleData[lvl] || [];
                const match = arr.find(r => r.id === regionId);
                if (match) return match;
            }
        }
        return null;
    }

    openAddRegionModal() {
        console.log('Opening add region modal for level:', this.currentLevel + 1);
        // No-op placeholder: Modal handled elsewhere
    }

    editRegion(regionId) {
        console.log('Editing region:', regionId);
        // Implementation for edit region (out of scope)
    }

    async deleteRegion(regionId) {
        const region = this.regionsData.find(r => r.id === regionId);
        if (!region) return;

        if (!confirm(`Are you sure you want to delete "${region.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/api/regions/${regionId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                await this.loadRegions(this.currentLevel, this.currentParent);
                // statistics refresh removed (metrics no longer displayed)
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
        const tbody = document.getElementById('regionsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading-cell">
                        <div class="loading-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            Loading regions data...
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    hideLoading() {
        // Hidden when renderRegions() is called
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
            .notification { position: fixed; top: 20px; right: 20px; background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline); border-radius: var(--md-sys-shape-corner-medium); padding: 1rem; box-shadow: var(--md-sys-elevation-3); z-index: 10000; max-width: 400px; display: flex; align-items: center; gap: 1rem; animation: slideIn 0.3s ease-out; }
            .notification-error { border-color: var(--md-sys-color-error); background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
            .notification-success { border-color: var(--md-sys-color-success); background: var(--md-sys-color-success-container); color: var (--md-sys-color-on-success-container); }
            .notification-content { display: flex; align-items: center; gap: 0.5rem; flex: 1; }
            .notification-close { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.7; transition: opacity 0.2s ease; }
            .notification-close:hover { opacity: 1; }
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `;
        document.head.appendChild(styles);
    }

    loadSampleRegionsData(level, parentId) {
        console.log('📊 Loading sample Iraqi regions data...');
        
        // Initialize and cache sample dataset if not yet set
        if (!this.sampleData) {
            this.sampleData = {
                governorate: [
                    {
                        id: 'baghdad', name: 'Baghdad', name_ar: 'بغداد', level: 'governorate', parent_id: 'iraq',
                        coordinates: { lat: 33.3152, lng: 44.3661 }, is_active: true,
                        service_config: { delivery: true, pickup: true },
                        statistics: { population: 9500000, area_km2: 4555, total_orders: 15420, active_drivers: 234, active_merchants: 540 }
                    },
                    {
                        id: 'basra', name: 'Basra', name_ar: 'البصرة', level: 'governorate', parent_id: 'iraq',
                        coordinates: { lat: 30.5085, lng: 47.7804 }, is_active: true,
                        service_config: { delivery: true, pickup: true },
                        statistics: { population: 2750000, area_km2: 19070, total_orders: 8340, active_drivers: 89, active_merchants: 210 }
                    },
                    {
                        id: 'erbil', name: 'Erbil', name_ar: 'أربيل', level: 'governorate', parent_id: 'iraq',
                        coordinates: { lat: 36.1911, lng: 44.0092 }, is_active: false,
                        service_config: { delivery: false, pickup: false },
                        statistics: { population: 1920000, area_km2: 15074, total_orders: 0, active_drivers: 0, active_merchants: 0 }
                    }
                ],
                district: [
                    {
                        id: 'al_karkh', name: 'Al-Karkh', name_ar: 'الكرخ', level: 'district', parent_id: 'baghdad',
                        coordinates: { lat: 33.3380, lng: 44.3440 }, is_active: true,
                        service_config: { delivery: true, pickup: true },
                        statistics: { population: 2100000, area_km2: 860, total_orders: 4200, active_drivers: 67, active_merchants: 150 }
                    },
                    {
                        id: 'al_rusafa', name: 'Al-Rusafa', name_ar: 'الرصافة', level: 'district', parent_id: 'baghdad',
                        coordinates: { lat: 33.3250, lng: 44.3890 }, is_active: true,
                        service_config: { delivery: true, pickup: true },
                        statistics: { population: 1850000, area_km2: 755, total_orders: 3890, active_drivers: 58, active_merchants: 130 }
                    }
                ]
            };
        }
        
        // Set the appropriate data based on level
        this.regionsData = (this.sampleData[level] || this.sampleData.governorate).slice();
        this.currentLevel = level;
        this.currentParent = parentId;
        
        // Update hierarchy path for sample data
        this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', depth: 0 }];
        if (parentId && parentId !== 'iraq') {
            const parent = this.findRegionById(parentId);
            if (parent) {
                this.hierarchyPath.push({ regionName: parent.name, regionNameArabic: parent.name_ar, regionId: parent.id, depth: 1 });
            }
        }
        
        // Render the data
        this.renderRegions();
        this.renderBreadcrumb();
        this.updateMapMarkers();
        
        console.log(`📊 Loaded ${this.regionsData.length} sample regions for level ${level}`);
    }

    normalizeTableHeader() {
        try {
            const headerRow = document.querySelector('#regionsDataTable thead tr');
            if (!headerRow) return;
            const hasDeprecated = /Drivers|Merchants|Delivery Fee|Min Order|Total Orders/i.test(headerRow.innerText) || headerRow.children.length > 4;
            if (hasDeprecated) {
                headerRow.innerHTML = `
                    <th class="sortable" onclick="sortTable('regionName')">
                        <i class="fas fa-map-marker-alt"></i>
                        Region Name
                        <i class="fas fa-sort sort-icon"></i>
                    </th>
                    <th class="sortable" onclick="sortTable('governorate')">
                        <i class="fas fa-map"></i>
                        Governorate
                        <i class="fas fa-sort sort-icon"></i>
                    </th>
                    <th class="sortable" onclick="sortTable('isActive')">
                        <i class="fas fa-power-off"></i>
                        Status
                        <i class="fas fa-sort sort-icon"></i>
                    </th>
                    <th>
                        <i class="fas fa-cog"></i>
                        Actions
                    </th>`;
                console.log('🔧 Regions table header normalized (deprecated columns removed)');
            }
        } catch (e) {
            console.warn('Header normalization failed:', e.message);
        }
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
        regionsManager.closeRegionModal?.();
    }
}

function refreshRegionsData() {
    if (regionsManager) {
        regionsManager.refreshRegions();
    }
}

function saveRegion() {
    if (regionsManager) {
        regionsManager.saveRegion?.();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IraqRegionsManager;
}
