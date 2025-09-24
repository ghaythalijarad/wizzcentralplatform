// Regions Management JavaScript for WizzCentral Platform
// Handles region CRUD operations, map integration, and real-time updates

class RegionsManager {
    constructor() {
        this.regions = [];
        this.map = null;
        this.markers = [];
        this.selectedRegion = null;
        this.currentModal = null;
        this.currentView = 'table'; // Default to table view
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.sortField = null;
        this.sortDirection = 'asc';
        this.filteredRegions = [];
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        console.log('🗺️ RegionsManager: Initializing...');
        
        try {
            // Initialize map
            this.initializeMap();
            
            // Load regions data
            await this.loadRegions();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ RegionsManager: Initialized successfully');
        } catch (error) {
            console.error('❌ RegionsManager initialization failed:', error);
            this.showError('Failed to initialize regions management');
        }
    }

    initializeMap() {
        console.log('🗺️ Initializing Leaflet map...');
        
        // Initialize map centered on Iraq
        this.map = L.map('regionsMap').setView([33.3152, 44.3661], 6);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);
        
        // Add click handler for map
        this.map.on('click', (e) => this.onMapClick(e));
        
        console.log('✅ Map initialized');
    }

    async loadRegions() {
        console.log('📊 Loading regions data...');
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Try to load from backend first
            const regions = await this.fetchRegionsFromBackend();
            
            if (regions && regions.length > 0) {
                this.regions = regions;
            } else {
                // Use sample data for demonstration
                this.regions = this.getSampleRegions();
                console.log('ℹ️ Using sample regions data');
            }
            
            // Update UI
            this.renderRegionsList();
            this.renderMapMarkers();
            this.updateStatistics();
            
            console.log(`✅ Loaded ${this.regions.length} regions`);
            
        } catch (error) {
            console.error('❌ Failed to load regions:', error);
            
            // Fallback to sample data
            this.regions = this.getSampleRegions();
            this.renderRegionsList();
            this.renderMapMarkers();
            this.updateStatistics();
            
            this.showError('Failed to load regions from server, showing sample data');
        }
    }

    async fetchRegionsFromBackend() {
        try {
            const idToken = sessionStorage.getItem('idToken');
            if (!idToken) {
                throw new Error('No authentication token');
            }

            const response = await fetch('/api/regions', {
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result.regions || [];
            
        } catch (error) {
            console.warn('Backend fetch failed:', error);
            return null;
        }
    }

    getSampleRegions() {
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
                        { lat: 33.31, lng: 44.34 }
                    ]
                },
                serviceTypes: { delivery: true, pickup: true, dineIn: false },
                deliveryFee: 2000,
                minimumOrder: 15000,
                estimatedDeliveryTime: 30,
                activeDrivers: 12,
                activeMerchants: 45,
                totalOrders: 1250,
                status: 'active'
            },
            {
                regionId: 'REG_002',
                regionName: 'Baghdad Karkh',
                regionNameArabic: 'بغداد الكرخ',
                governorate: 'Baghdad',
                isActive: true,
                coordinates: {
                    center: { lat: 33.2778, lng: 44.2306 },
                    boundaries: []
                },
                serviceTypes: { delivery: true, pickup: true, dineIn: true },
                deliveryFee: 2500,
                minimumOrder: 18000,
                estimatedDeliveryTime: 35,
                activeDrivers: 8,
                activeMerchants: 32,
                totalOrders: 890,
                status: 'active'
            },
            {
                regionId: 'REG_003',
                regionName: 'Basra Downtown',
                regionNameArabic: 'البصرة وسط المدينة',
                governorate: 'Basra',
                isActive: false,
                coordinates: {
                    center: { lat: 30.5085, lng: 47.7804 },
                    boundaries: []
                },
                serviceTypes: { delivery: true, pickup: false, dineIn: false },
                deliveryFee: 3000,
                minimumOrder: 20000,
                estimatedDeliveryTime: 40,
                activeDrivers: 0,
                activeMerchants: 15,
                totalOrders: 320,
                status: 'maintenance'
            },
            {
                regionId: 'REG_004',
                regionName: 'Erbil Central',
                regionNameArabic: 'أربيل المركز',
                governorate: 'Erbil',
                isActive: true,
                coordinates: {
                    center: { lat: 36.1911, lng: 44.0092 },
                    boundaries: []
                },
                serviceTypes: { delivery: true, pickup: true, dineIn: true },
                deliveryFee: 2200,
                minimumOrder: 16000,
                estimatedDeliveryTime: 25,
                activeDrivers: 15,
                activeMerchants: 38,
                totalOrders: 1100,
                status: 'active'
            },
            {
                regionId: 'REG_005',
                regionName: 'Najaf Old City',
                regionNameArabic: 'النجف المدينة القديمة',
                governorate: 'Najaf',
                isActive: true,
                coordinates: {
                    center: { lat: 32.0322, lng: 44.3357 },
                    boundaries: []
                },
                serviceTypes: { delivery: true, pickup: true, dineIn: false },
                deliveryFee: 2800,
                minimumOrder: 17000,
                estimatedDeliveryTime: 32,
                activeDrivers: 6,
                activeMerchants: 22,
                totalOrders: 650,
                status: 'active'
            }
        ];
    }

    renderRegionsList() {
        // Filter regions based on search and filters
        this.applyFilters();
        
        if (this.currentView === 'table') {
            this.renderTableView();
        } else {
            this.renderCardView();
        }
    }

    applyFilters() {
        const searchInput = document.getElementById('regionSearch');
        const levelFilter = document.getElementById('levelFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        let filtered = [...this.regions];
        
        // Apply search filter
        if (searchInput && searchInput.value.trim()) {
            const searchTerm = searchInput.value.trim().toLowerCase();
            filtered = filtered.filter(region => 
                region.regionName.toLowerCase().includes(searchTerm) ||
                region.regionNameArabic.includes(searchTerm) ||
                region.governorate.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply level filter (if applicable)
        if (levelFilter && levelFilter.value) {
            const level = parseInt(levelFilter.value);
            filtered = filtered.filter(region => region.level === level);
        }
        
        // Apply status filter
        if (statusFilter && statusFilter.value !== '') {
            const isActive = statusFilter.value === 'true';
            filtered = filtered.filter(region => region.isActive === isActive);
        }
        
        this.filteredRegions = filtered;
    }

    renderTableView() {
        const tableBody = document.getElementById('regionsTableBody');
        const container = document.getElementById('regionsTableContainer');
        
        if (!tableBody || !container) return;
        
        container.style.display = 'block';
        document.getElementById('regionsCards').style.display = 'none';
        
        if (this.filteredRegions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="loading-cell">
                        <div class="loading-state">
                            <i class="fas fa-search"></i>
                            <div>No regions found</div>
                            <div style="font-size: 0.8rem; color: var(--md-sys-color-on-surface-variant);">
                                Try adjusting your search criteria or filters
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            this.updatePagination(0);
            return;
        }
        
        // Sort regions
        this.sortRegions();
        
        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredRegions.length);
        const pageRegions = this.filteredRegions.slice(startIndex, endIndex);
        
        // Render table rows
        const rows = pageRegions.map(region => `
            <tr onclick="selectRegion('${region.regionId}')" style="cursor: pointer;">
                <td class="region-name-cell">
                    <div class="region-name-en">${region.regionName}</div>
                    <div class="region-name-ar">${region.regionNameArabic}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-map" style="color: var(--md-sys-color-primary); opacity: 0.7;"></i>
                        ${region.governorate}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${region.isActive ? 'active' : 'inactive'}">
                        <i class="fas fa-${region.isActive ? 'check-circle' : 'times-circle'}"></i>
                        ${region.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="metric-value">${region.activeDrivers || 0}</td>
                <td class="metric-value">${region.activeMerchants || 0}</td>
                <td class="currency-value">${(region.deliveryFee || 0).toLocaleString()} IQD</td>
                <td class="currency-value">${(region.minimumOrder || 0).toLocaleString()} IQD</td>
                <td class="metric-value">${(region.totalOrders || 0).toLocaleString()}</td>
                <td class="actions-cell">
                    <button class="action-btn view" onclick="viewRegionDetails('${region.regionId}', event)" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editRegion('${region.regionId}', event)" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn toggle" onclick="toggleRegionStatus('${region.regionId}', event)" title="Toggle Status">
                        <i class="fas fa-power-off"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tableBody.innerHTML = rows;
        this.updatePagination(this.filteredRegions.length);
    }

    renderCardView() {
        const container = document.getElementById('regionsCards');
        const tableContainer = document.getElementById('regionsTableContainer');
        
        if (!container) return;
        
        container.style.display = 'block';
        tableContainer.style.display = 'none';
        
        if (this.filteredRegions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map"></i>
                    <h3>No regions found</h3>
                    <p>Try adjusting your search criteria or click "Add Region" to create a new one</p>
                </div>
            `;
            return;
        }

        const regionsHtml = this.filteredRegions.map(region => `
            <div class="region-item" data-region-id="${region.regionId}" onclick="selectRegion('${region.regionId}')">
                <div class="region-status ${region.isActive ? 'active' : 'inactive'}"></div>
                <div class="region-info">
                    <div class="region-name">${region.regionName}</div>
                    <div class="region-details">
                        <span><i class="fas fa-map-marker-alt"></i> ${region.governorate}</span>
                        <span><i class="fas fa-motorcycle"></i> ${region.activeDrivers} drivers</span>
                        <span><i class="fas fa-store"></i> ${region.activeMerchants} merchants</span>
                    </div>
                </div>
                <div class="region-actions">
                    <button class="btn-toggle ${region.isActive ? 'active' : 'inactive'}" 
                            onclick="toggleRegionStatus('${region.regionId}', event)">
                        ${region.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button class="btn-toggle" onclick="editRegion('${region.regionId}', event)" 
                            style="background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);">
                        Edit
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = regionsHtml;
    }

    renderMapMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Add markers for each region
        this.regions.forEach(region => {
            const { lat, lng } = region.coordinates.center;
            
            const marker = L.marker([lat, lng], {
                icon: this.getRegionIcon(region)
            }).addTo(this.map);

            // Add popup with region info
            marker.bindPopup(`
                <div style="text-align: center; padding: 0.5rem;">
                    <h4 style="margin: 0 0 0.5rem 0;">${region.regionName}</h4>
                    <p style="margin: 0; color: #666; font-size: 0.875rem;">${region.regionNameArabic}</p>
                    <div style="margin-top: 0.5rem; display: flex; justify-content: space-around; font-size: 0.75rem;">
                        <span><i class="fas fa-motorcycle"></i> ${region.activeDrivers}</span>
                        <span><i class="fas fa-store"></i> ${region.activeMerchants}</span>
                    </div>
                    <div style="margin-top: 0.5rem;">
                        <span class="badge ${region.isActive ? 'badge-success' : 'badge-danger'}" 
                              style="padding: 0.25rem 0.5rem; border-radius: 1rem; font-size: 0.75rem; color: white; background: ${region.isActive ? '#28a745' : '#dc3545'};">
                            ${region.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            `);

            // Add click handler
            marker.on('click', () => {
                this.selectRegion(region.regionId);
                this.showRegionDetails(region);
            });

            this.markers.push(marker);
        });
    }

    sortRegions() {
        if (!this.sortField) return;
        
        this.filteredRegions.sort((a, b) => {
            let aValue = a[this.sortField];
            let bValue = b[this.sortField];
            
            // Handle different data types
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            if (typeof aValue === 'boolean') {
                aValue = aValue ? 1 : 0;
                bValue = bValue ? 1 : 0;
            }
            
            let comparison = 0;
            if (aValue > bValue) comparison = 1;
            if (aValue < bValue) comparison = -1;
            
            return this.sortDirection === 'desc' ? -comparison : comparison;
        });
    }

    updatePagination(totalItems) {
        const paginationInfo = document.getElementById('tablePagination');
        const showingStart = document.getElementById('showingStart');
        const showingEnd = document.getElementById('showingEnd');
        const totalCount = document.getElementById('totalCount');
        const pageNumbers = document.getElementById('pageNumbers');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (!paginationInfo) return;
        
        if (totalItems === 0) {
            paginationInfo.style.display = 'none';
            return;
        }
        
        paginationInfo.style.display = 'flex';
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, totalItems);
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        showingStart.textContent = startIndex;
        showingEnd.textContent = endIndex;
        totalCount.textContent = totalItems;
        
        // Update page numbers
        let pageNumbersHtml = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbersHtml += `
                <button class="page-number ${i === this.currentPage ? 'active' : ''}" 
                        onclick="goToPage(${i})">${i}</button>
            `;
        }
        
        pageNumbers.innerHTML = pageNumbersHtml;
        
        // Update navigation buttons
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= totalPages;
    }

    // View switching and UI controls
    switchView(viewType) {
        this.currentView = viewType;
        
        // Update button states
        document.getElementById('cardViewBtn').classList.toggle('active', viewType === 'card');
        document.getElementById('tableViewBtn').classList.toggle('active', viewType === 'table');
        
        // Re-render with new view
        this.renderRegionsList();
    }

    toggleView(viewType) {
        if (viewType === this.currentView) return;
        
        this.currentView = viewType;
        
        // Update view toggle buttons
        const cardViewBtn = document.getElementById('cardViewBtn');
        const tableViewBtn = document.getElementById('tableViewBtn');
        
        if (cardViewBtn && tableViewBtn) {
            cardViewBtn.classList.toggle('active', viewType === 'card');
            tableViewBtn.classList.toggle('active', viewType === 'table');
        }
        
        // Render appropriate view
        if (viewType === 'table') {
            this.renderTableView();
        } else {
            this.renderCardView();
        }
        
        console.log(`🔄 View switched to: ${viewType}`);
    }

    sortTable(field) {
        // Update sort state
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        // Update header indicators
        document.querySelectorAll('.regions-data-table th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        const targetHeader = Array.from(document.querySelectorAll('.regions-data-table th')).find(th => 
            th.onclick && th.onclick.toString().includes(field)
        );
        
        if (targetHeader) {
            targetHeader.classList.add(`sort-${this.sortDirection}`);
        }
        
        // Reset to first page and re-render
        this.currentPage = 1;
        this.renderRegionsList();
    }

    handleSort(field) {
        if (this.sortField === field) {
            // Toggle direction if same field
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // New field, default to ascending
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        // Update sort indicators
        this.updateSortIndicators();
        
        // Apply sorting and re-render
        this.sortRegions();
        if (this.currentView === 'table') {
            this.renderTableView();
        }
    }

    updateSortIndicators() {
        // Clear all sort indicators
        const headers = document.querySelectorAll('.sortable-header');
        headers.forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Add indicator to current sort field
        if (this.sortField) {
            const currentHeader = document.querySelector(`[data-sort="${this.sortField}"]`);
            if (currentHeader) {
                currentHeader.classList.add(`sort-${this.sortDirection}`);
            }
        }
    }

    changePage(direction) {
        const totalPages = Math.ceil(this.filteredRegions.length / this.itemsPerPage);
        const newPage = this.currentPage + direction;
        
        if (newPage >= 1 && newPage <= totalPages) {
            this.currentPage = newPage;
            this.renderRegionsList();
        }
    }

    changePage(page) {
        const totalPages = Math.ceil(this.filteredRegions.length / this.itemsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        
        if (this.currentView === 'table') {
            this.renderTableView();
        } else {
            this.renderCardView();
        }
    }

    previousPage() {
        this.changePage(this.currentPage - 1);
    }

    nextPage() {
        this.changePage(this.currentPage + 1);
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredRegions.length / this.itemsPerPage);
        
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderRegionsList();
        }
    }

    viewRegionDetails(regionId, event) {
        if (event) event.stopPropagation();
        
        const region = this.regions.find(r => r.regionId === regionId);
        if (!region) return;
        
        // Show region on map
        this.map.setView([region.coordinates.center.lat, region.coordinates.center.lng], 12);
        
        // Show details panel
        this.showRegionDetails(region);
        
        // Highlight region in table/cards
        this.selectRegion(regionId);
    }

    getRegionIcon(region) {
        const color = region.isActive ? '#28a745' : '#dc3545';
        
        return L.divIcon({
            className: 'custom-region-marker',
            html: `
                <div style="
                    background: ${color};
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                ">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    }

    updateStatistics() {
        const stats = {
            totalRegions: this.regions.length,
            activeRegions: this.regions.filter(r => r.isActive).length,
            totalDrivers: this.regions.reduce((sum, r) => sum + r.activeDrivers, 0),
            totalMerchants: this.regions.reduce((sum, r) => sum + r.activeMerchants, 0)
        };

        // Animate counters
        this.animateCounter('totalRegions', stats.totalRegions);
        this.animateCounter('activeRegions', stats.activeRegions);
        this.animateCounter('totalDrivers', stats.totalDrivers);
        this.animateCounter('totalMerchants', stats.totalMerchants);
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const stepTime = 50;
        const steps = duration / stepTime;
        const increment = (targetValue - startValue) / steps;

        let currentValue = startValue;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            currentValue += increment;
            
            if (step >= steps) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            
            element.textContent = Math.round(currentValue);
        }, stepTime);
    }

    selectRegion(regionId) {
        // Remove previous selection
        document.querySelectorAll('.region-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Select new region
        const regionElement = document.querySelector(`[data-region-id="${regionId}"]`);
        if (regionElement) {
            regionElement.classList.add('selected');
        }

        this.selectedRegion = this.regions.find(r => r.regionId === regionId);
        
        if (this.selectedRegion) {
            // Center map on selected region
            const { lat, lng } = this.selectedRegion.coordinates.center;
            this.map.setView([lat, lng], 12);
            
            // Show region details panel
            this.showRegionDetails(this.selectedRegion);
        }
    }

    showRegionDetails(region) {
        const panel = document.getElementById('regionDetailsPanel');
        
        document.getElementById('panelRegionName').textContent = region.regionName;
        document.getElementById('panelStatus').textContent = region.isActive ? 'Active' : 'Inactive';
        document.getElementById('panelDrivers').textContent = region.activeDrivers;
        document.getElementById('panelMerchants').textContent = region.activeMerchants;
        document.getElementById('panelDeliveryFee').textContent = `${region.deliveryFee.toLocaleString()} IQD`;
        document.getElementById('panelMinOrder').textContent = `${region.minimumOrder.toLocaleString()} IQD`;
        
        panel.style.display = 'block';
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            panel.style.display = 'none';
        }, 10000);
    }

    async toggleRegionStatus(regionId, event) {
        event.stopPropagation();
        
        const region = this.regions.find(r => r.regionId === regionId);
        if (!region) return;

        try {
            // Update status
            region.isActive = !region.isActive;
            region.status = region.isActive ? 'active' : 'inactive';
            
            // Update UI immediately
            this.renderRegionsList();
            this.renderMapMarkers();
            this.updateStatistics();
            
            // Save to backend
            await this.saveRegionToBackend(region);
            
            this.showSuccess(`Region ${region.regionName} ${region.isActive ? 'activated' : 'deactivated'} successfully`);
            
        } catch (error) {
            console.error('Failed to toggle region status:', error);
            
            // Revert change
            region.isActive = !region.isActive;
            region.status = region.isActive ? 'active' : 'inactive';
            this.renderRegionsList();
            this.renderMapMarkers();
            
            this.showError('Failed to update region status');
        }
    }

    openAddRegionModal() {
        document.getElementById('modalTitle').textContent = 'Add New Region';
        document.getElementById('regionForm').reset();
        this.currentModal = 'add';
        document.getElementById('regionModal').style.display = 'flex';
        
        // Set default values
        document.getElementById('deliveryFee').value = '2000';
        document.getElementById('minimumOrder').value = '15000';
        document.getElementById('estimatedDelivery').value = '30';
        document.getElementById('regionStatus').value = 'active';
    }

    editRegion(regionId, event) {
        event.stopPropagation();
        
        const region = this.regions.find(r => r.regionId === regionId);
        if (!region) return;

        document.getElementById('modalTitle').textContent = 'Edit Region';
        this.currentModal = 'edit';
        this.selectedRegion = region;
        
        // Populate form
        document.getElementById('regionName').value = region.regionName;
        document.getElementById('regionNameArabic').value = region.regionNameArabic;
        document.getElementById('governorate').value = region.governorate;
        document.getElementById('deliveryFee').value = region.deliveryFee;
        document.getElementById('minimumOrder').value = region.minimumOrder;
        document.getElementById('estimatedDelivery').value = region.estimatedDeliveryTime;
        document.getElementById('regionStatus').value = region.status;
        document.getElementById('serviceDelivery').checked = region.serviceTypes.delivery;
        document.getElementById('servicePickup').checked = region.serviceTypes.pickup;
        document.getElementById('serviceDineIn').checked = region.serviceTypes.dineIn;
        
        document.getElementById('regionModal').style.display = 'flex';
    }

    closeRegionModal() {
        document.getElementById('regionModal').style.display = 'none';
        this.currentModal = null;
        this.selectedRegion = null;
    }

    async saveRegion() {
        const form = document.getElementById('regionForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            // Show loading state
            document.getElementById('saveButtonText').textContent = 'Saving...';
            document.getElementById('saveButtonSpinner').style.display = 'inline-block';

            // Collect form data
            const regionData = {
                regionName: document.getElementById('regionName').value,
                regionNameArabic: document.getElementById('regionNameArabic').value,
                governorate: document.getElementById('governorate').value,
                deliveryFee: parseInt(document.getElementById('deliveryFee').value),
                minimumOrder: parseInt(document.getElementById('minimumOrder').value),
                estimatedDeliveryTime: parseInt(document.getElementById('estimatedDelivery').value),
                status: document.getElementById('regionStatus').value,
                isActive: document.getElementById('regionStatus').value === 'active',
                serviceTypes: {
                    delivery: document.getElementById('serviceDelivery').checked,
                    pickup: document.getElementById('servicePickup').checked,
                    dineIn: document.getElementById('serviceDineIn').checked
                }
            };

            if (this.currentModal === 'edit' && this.selectedRegion) {
                // Update existing region
                Object.assign(this.selectedRegion, regionData);
                await this.saveRegionToBackend(this.selectedRegion);
                this.showSuccess('Region updated successfully');
            } else {
                // Create new region
                const newRegion = {
                    regionId: 'REG_' + Date.now(),
                    ...regionData,
                    coordinates: {
                        center: { lat: 33.3152, lng: 44.3661 }, // Default to Baghdad center
                        boundaries: []
                    },
                    activeDrivers: 0,
                    activeMerchants: 0,
                    totalOrders: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                this.regions.push(newRegion);
                await this.saveRegionToBackend(newRegion);
                this.showSuccess('Region created successfully');
            }

            // Update UI
            this.renderRegionsList();
            this.renderMapMarkers();
            this.updateStatistics();
            this.closeRegionModal();

        } catch (error) {
            console.error('Failed to save region:', error);
            this.showError('Failed to save region');
        } finally {
            // Reset button state
            document.getElementById('saveButtonText').textContent = 'Save Region';
            document.getElementById('saveButtonSpinner').style.display = 'none';
        }
    }

    async saveRegionToBackend(region) {
        try {
            const idToken = sessionStorage.getItem('idToken');
            if (!idToken) {
                throw new Error('No authentication token');
            }

            const response = await fetch('/api/regions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(region)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
            
        } catch (error) {
            console.warn('Failed to save to backend:', error);
            // Continue with local operation for demo purposes
        }
    }

    setupEventListeners() {
        // View toggle buttons
        const cardViewBtn = document.getElementById('cardViewBtn');
        const tableViewBtn = document.getElementById('tableViewBtn');
        
        if (cardViewBtn) {
            cardViewBtn.addEventListener('click', () => this.toggleView('card'));
        }
        
        if (tableViewBtn) {
            tableViewBtn.addEventListener('click', () => this.toggleView('table'));
        }
        
        // Sortable table headers
        const sortableHeaders = document.querySelectorAll('.sortable-header');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-sort');
                if (field) {
                    this.handleSort(field);
                }
            });
        });
        
        // Pagination controls
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }
        
        // Search and filter functionality
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const levelFilter = document.getElementById('levelFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.currentPage = 1; // Reset to first page
                this.applyFilters();
                if (this.currentView === 'table') {
                    this.renderTableView();
                } else {
                    this.renderCardView();
                }
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.currentPage = 1; // Reset to first page
                this.applyFilters();
                if (this.currentView === 'table') {
                    this.renderTableView();
                } else {
                    this.renderCardView();
                }
            });
        }
        
        if (levelFilter) {
            levelFilter.addEventListener('change', () => {
                this.currentPage = 1; // Reset to first page
                this.applyFilters();
                if (this.currentView === 'table') {
                    this.renderTableView();
                } else {
                    this.renderCardView();
                }
            });
        }
        
        // Close modal when clicking outside
        const regionModal = document.getElementById('regionModal');
        if (regionModal) {
            regionModal.addEventListener('click', (e) => {
                if (e.target.id === 'regionModal') {
                    this.closeRegionModal();
                }
            });
        }

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeRegionModal();
            }
        });
    }

    onMapClick(e) {
        // Future: Allow clicking on map to add new region at that location
        console.log('Map clicked at:', e.latlng);
    }

    showLoadingState() {
        const container = document.getElementById('regionsTable');
        container.innerHTML = `
            <div class="empty-state">
                <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto 1rem;"></div>
                <h3>Loading regions...</h3>
                <p>Please wait while we load the service regions</p>
            </div>
        `;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: ${type === 'success' ? 'var(--md-sys-color-tertiary-container)' : 
                        type === 'error' ? 'var(--md-sys-color-error-container)' : 
                        'var(--md-sys-color-primary-container)'};
            color: ${type === 'success' ? 'var(--md-sys-color-on-tertiary-container)' : 
                    type === 'error' ? 'var(--md-sys-color-on-error-container)' : 
                    'var(--md-sys-color-on-primary-container)'};
            padding: 1rem 1.5rem;
            border-radius: var(--md-sys-shape-corner-medium);
            box-shadow: var(--md-sys-elevation-3);
            font-weight: 500;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Global functions for HTML onclick handlers
window.selectRegion = (regionId) => regionsManager.selectRegion(regionId);
window.toggleRegionStatus = (regionId, event) => regionsManager.toggleRegionStatus(regionId, event);
window.editRegion = (regionId, event) => regionsManager.editRegion(regionId, event);
window.openAddRegionModal = () => regionsManager.openAddRegionModal();
window.closeRegionModal = () => regionsManager.closeRegionModal();
window.saveRegion = () => regionsManager.saveRegion();
window.refreshRegionsData = () => regionsManager.loadRegions();

// Table view functions
window.toggleView = (viewType) => regionsManager.toggleView(viewType);
window.sortTable = (field) => regionsManager.handleSort(field);
window.changePage = (page) => regionsManager.changePage(page);
window.previousPage = () => regionsManager.previousPage();
window.nextPage = () => regionsManager.nextPage();
window.viewRegionDetails = (regionId, event) => regionsManager.viewRegionDetails(regionId, event);

// Initialize the regions manager
const regionsManager = new RegionsManager();

console.log('🗺️ Regions management system loaded');
