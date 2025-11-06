// WizzCentral Regions Admin Panel - Phase 3 Implementation
// Complete admin interface for managing regions with toggle buttons, filters, and hierarchy view

class RegionsAdminPanel {
    constructor() {
        this.regions = [];
        this.filteredRegions = [];
        this.hierarchyData = null;
        this.currentView = 'hierarchy'; // hierarchy | list
        this.filters = {
            search: '',
            province: 'all',
            district: 'all',
            neighborhood: 'all',
            status: 'all',
            regionType: 'all'
        };
        this.expandedNodes = new Set();
        
        // API endpoints (demonstration examples)
        this.API_BASE = '/api/regions'; // Base endpoint
        this.API_ENDPOINTS = {
            list: '/api/regions',
            toggleStatus: (id) => `/api/regions/${id}/toggleStatus`,
            summary: '/api/regions/summary',
            hierarchy: (id) => `/api/regions/${id}?includeHierarchy=true`
        };
    }

    /**
     * Initialize the admin panel
     */
    async init() {
        console.log('🎨 Initializing Regions Admin Panel...');
        
        try {
            // Load initial data
            await this.loadRegions();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Render initial view
            this.renderCurrentView();
            
            // Load statistics
            await this.loadStatistics();
            
            console.log('✅ Regions Admin Panel initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize admin panel:', error);
            this.showNotification('Failed to initialize regions panel', 'error');
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // View toggle buttons
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentView = e.target.dataset.view;
                this.updateViewButtons();
                this.renderCurrentView();
            });
        });

        // Search input
        const searchInput = document.getElementById('regionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }

        // Filter dropdowns
        ['provinceFilter', 'districtFilter', 'neighborhoodFilter', 'statusFilter', 'regionTypeFilter'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    const filterName = id.replace('Filter', '').toLowerCase();
                    this.filters[filterName === 'regiontype' ? 'regionType' : filterName] = e.target.value;
                    this.applyFilters();
                });
            }
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshRegions');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadRegions());
        }

        // Add region button
        const addRegionBtn = document.getElementById('addRegion');
        if (addRegionBtn) {
            addRegionBtn.addEventListener('click', () => this.showAddRegionModal());
        }
    }

    /**
     * Load all regions from API
     */
    async loadRegions() {
        console.log('📥 Loading regions...');
        
        try {
            this.showLoading(true);
            
            // In production, make actual API call
            // const response = await fetch(this.API_ENDPOINTS.list);
            // const data = await response.json();
            // this.regions = data.regions || [];
            
            // For now, use sample data
            this.regions = this.getSampleRegions();
            
            // Build hierarchy
            this.hierarchyData = this.buildHierarchy(this.regions);
            
            // Apply filters
            this.applyFilters();
            
            console.log(`✅ Loaded ${this.regions.length} regions`);
            
        } catch (error) {
            console.error('❌ Failed to load regions:', error);
            this.showNotification('Failed to load regions', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Load statistics summary
     */
    async loadStatistics() {
        try {
            // In production, make actual API call
            // const response = await fetch(this.API_ENDPOINTS.summary);
            // const stats = await response.json();
            
            // For now, calculate from sample data
            const stats = this.calculateStatistics();
            this.renderStatistics(stats);
            
        } catch (error) {
            console.error('❌ Failed to load statistics:', error);
        }
    }

    /**
     * Build hierarchy structure from flat regions array
     */
    buildHierarchy(regions) {
        const regionsMap = new Map();
        const roots = [];

        // Create map of all regions
        regions.forEach(region => {
            regionsMap.set(region.regionId, {
                ...region,
                children: []
            });
        });

        // Build tree structure
        regions.forEach(region => {
            const node = regionsMap.get(region.regionId);
            
            if (!region.parent_id) {
                // Root node (Province)
                roots.push(node);
            } else {
                // Child node
                const parent = regionsMap.get(region.parent_id);
                if (parent) {
                    parent.children.push(node);
                }
            }
        });

        return roots;
    }

    /**
     * Apply current filters to regions
     */
    applyFilters() {
        let filtered = [...this.regions];

        // Search filter
        if (this.filters.search) {
            filtered = filtered.filter(r => 
                r.regionName.toLowerCase().includes(this.filters.search) ||
                r.regionNameArabic.includes(this.filters.search) ||
                r.regionId.toLowerCase().includes(this.filters.search)
            );
        }

        // Province filter
        if (this.filters.province !== 'all') {
            filtered = filtered.filter(r => r.governorate === this.filters.province);
        }

        // Status filter
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(r => r.status === this.filters.status);
        }

        // Region type filter
        if (this.filters.regionType !== 'all') {
            filtered = filtered.filter(r => r.region_type === this.filters.regionType);
        }

        this.filteredRegions = filtered;
        this.renderCurrentView();
        this.updateFilteredCount();
    }

    /**
     * Render current view (hierarchy or list)
     */
    renderCurrentView() {
        if (this.currentView === 'hierarchy') {
            this.renderHierarchyView();
        } else {
            this.renderListView();
        }
    }

    /**
     * Render hierarchy view with collapsible tree
     */
    renderHierarchyView() {
        const container = document.getElementById('regionsHierarchyView');
        if (!container) return;

        const filteredHierarchy = this.filterHierarchy(this.hierarchyData);
        
        container.innerHTML = `
            <div class="hierarchy-tree">
                ${filteredHierarchy.map(province => this.renderHierarchyNode(province, 0)).join('')}
            </div>
        `;

        // Setup toggle listeners
        this.setupHierarchyToggles();
    }

    /**
     * Filter hierarchy based on current filters
     */
    filterHierarchy(nodes) {
        if (!this.filters.search && this.filters.status === 'all' && this.filters.regionType === 'all') {
            return nodes;
        }

        const filtered = [];
        
        for (const node of nodes) {
            const matchesSearch = !this.filters.search || 
                node.regionName.toLowerCase().includes(this.filters.search) ||
                node.regionNameArabic.includes(this.filters.search);
            
            const matchesStatus = this.filters.status === 'all' || node.status === this.filters.status;
            const matchesType = this.filters.regionType === 'all' || node.region_type === this.filters.regionType;
            
            // Filter children recursively
            const filteredChildren = this.filterHierarchy(node.children || []);
            
            if (matchesSearch && matchesStatus && matchesType || filteredChildren.length > 0) {
                filtered.push({
                    ...node,
                    children: filteredChildren
                });
            }
        }
        
        return filtered;
    }

    /**
     * Render a single hierarchy node
     */
    renderHierarchyNode(node, level) {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = this.expandedNodes.has(node.regionId);
        const indent = level * 30;
        
        const typeIcons = {
            'PROVINCE': '🏛️',
            'DISTRICT': '🏙️',
            'NEIGHBORHOOD': '🏘️'
        };

        return `
            <div class="hierarchy-node level-${level}" data-region-id="${node.regionId}">
                <div class="hierarchy-node-header" style="padding-left: ${indent}px;">
                    ${hasChildren ? `
                        <button class="collapse-toggle" data-node-id="${node.regionId}">
                            <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'}"></i>
                        </button>
                    ` : '<span class="collapse-spacer"></span>'}
                    
                    <div class="node-info">
                        <span class="node-icon">${typeIcons[node.region_type] || '📍'}</span>
                        <div class="node-details">
                            <div class="node-title">
                                <span class="node-name">${node.regionName}</span>
                                <span class="node-name-arabic">${node.regionNameArabic}</span>
                            </div>
                            <div class="node-meta">
                                <span class="badge badge-${node.region_type.toLowerCase()}">${node.region_type}</span>
                                ${node.activeDrivers ? `<span class="node-stat"><i class="fas fa-car"></i> ${node.activeDrivers} drivers</span>` : ''}
                                ${node.activeMerchants ? `<span class="node-stat"><i class="fas fa-store"></i> ${node.activeMerchants} merchants</span>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="node-actions">
                        ${this.renderStatusToggle(node)}
                        <button class="btn-icon" onclick="regionsAdmin.editRegion('${node.regionId}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="regionsAdmin.viewDetails('${node.regionId}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                ${hasChildren && isExpanded ? `
                    <div class="hierarchy-children">
                        ${node.children.map(child => this.renderHierarchyNode(child, level + 1)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render status toggle button
     */
    renderStatusToggle(region) {
        const isActive = region.status === 'ACTIVE';
        
        return `
            <div class="status-toggle-wrapper">
                <label class="status-toggle" title="${isActive ? 'Click to deactivate' : 'Click to activate'}">
                    <input 
                        type="checkbox" 
                        ${isActive ? 'checked' : ''} 
                        onchange="regionsAdmin.toggleRegionStatus('${region.regionId}', '${region.regionName}', ${!isActive})"
                    >
                    <span class="toggle-slider"></span>
                </label>
                <span class="status-label ${isActive ? 'active' : 'inactive'}">
                    ${isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
            </div>
        `;
    }

    /**
     * Setup hierarchy collapse/expand toggles
     */
    setupHierarchyToggles() {
        document.querySelectorAll('.collapse-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const nodeId = e.currentTarget.dataset.nodeId;
                
                if (this.expandedNodes.has(nodeId)) {
                    this.expandedNodes.delete(nodeId);
                } else {
                    this.expandedNodes.add(nodeId);
                }
                
                this.renderCurrentView();
            });
        });
    }

    /**
     * Render list view (flat table)
     */
    renderListView() {
        const container = document.getElementById('regionsListView');
        if (!container) return;

        if (this.filteredRegions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map-marked-alt fa-3x"></i>
                    <h3>No regions found</h3>
                    <p>Try adjusting your filters or add a new region.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="regions-table-container">
                <table class="regions-table">
                    <thead>
                        <tr>
                            <th>Region</th>
                            <th>Type</th>
                            <th>Province</th>
                            <th>Status</th>
                            <th>Drivers</th>
                            <th>Merchants</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredRegions.map(region => this.renderListRow(region)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render a single table row
     */
    renderListRow(region) {
        const typeIcons = {
            'PROVINCE': '🏛️',
            'DISTRICT': '🏙️',
            'NEIGHBORHOOD': '🏘️'
        };

        return `
            <tr data-region-id="${region.regionId}">
                <td>
                    <div class="region-cell">
                        <span class="region-icon">${typeIcons[region.region_type]}</span>
                        <div>
                            <div class="region-name-cell">${region.regionName}</div>
                            <div class="region-name-arabic-cell">${region.regionNameArabic}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge badge-${region.region_type.toLowerCase()}">${region.region_type}</span>
                </td>
                <td>${region.governorate}</td>
                <td>
                    ${this.renderStatusToggle(region)}
                </td>
                <td>
                    <span class="stat-value">${region.activeDrivers || 0}</span>
                </td>
                <td>
                    <span class="stat-value">${region.activeMerchants || 0}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="regionsAdmin.editRegion('${region.regionId}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="regionsAdmin.viewDetails('${region.regionId}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="regionsAdmin.deleteRegion('${region.regionId}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Toggle region status with confirmation
     */
    async toggleRegionStatus(regionId, regionName, willBeActive) {
        const newStatus = willBeActive ? 'ACTIVE' : 'INACTIVE';
        const action = willBeActive ? 'activate' : 'deactivate';
        
        // Show confirmation modal
        const confirmed = await this.showConfirmationModal({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Region`,
            message: `Are you sure you want to ${action} "${regionName}"?`,
            warning: !willBeActive ? 
                'This will cascade and deactivate all child regions automatically.' :
                'Parent regions must be active to activate this region.',
            confirmText: action.charAt(0).toUpperCase() + action.slice(1),
            confirmClass: willBeActive ? 'btn-success' : 'btn-warning'
        });

        if (!confirmed) {
            // Reset toggle if cancelled
            this.renderCurrentView();
            return;
        }

        try {
            this.showLoading(true);
            
            // Call API endpoint (demonstration)
            // const response = await fetch(this.API_ENDPOINTS.toggleStatus(regionId), {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ status: newStatus })
            // });
            
            // Simulate API call
            await this.simulateAPICall();
            const result = this.simulateToggleResponse(regionId, newStatus);
            
            // if (!response.ok) throw new Error('Failed to toggle status');
            // const result = await response.json();
            
            // Show success with affected regions
            this.showStatusChangeResult(result);
            
            // Reload regions
            await this.loadRegions();
            
        } catch (error) {
            console.error('❌ Failed to toggle status:', error);
            this.showNotification(error.message || 'Failed to update region status', 'error');
            this.renderCurrentView();
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Show confirmation modal
     */
    showConfirmationModal({ title, message, warning, confirmText, confirmClass }) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-dialog confirmation-modal">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="btn-close" onclick="this.closest('.modal-overlay').remove(); return false;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p class="confirmation-message">${message}</p>
                        ${warning ? `<div class="confirmation-warning"><i class="fas fa-exclamation-triangle"></i> ${warning}</div>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary cancel-btn">Cancel</button>
                        <button class="btn ${confirmClass} confirm-btn">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });

            modal.querySelector('.confirm-btn').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            modal.querySelector('.btn-close').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
        });
    }

    /**
     * Show status change result modal with affected regions
     */
    showStatusChangeResult(result) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog result-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-check-circle text-success"></i> Status Updated Successfully</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove();">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="result-message">${result.message}</p>
                    
                    <div class="affected-summary">
                        <h4>Affected Regions Summary:</h4>
                        <div class="summary-cards">
                            <div class="summary-card">
                                <div class="card-icon">🏛️</div>
                                <div class="card-value">${result.affectedRegions.provinces}</div>
                                <div class="card-label">Provinces</div>
                            </div>
                            <div class="summary-card">
                                <div class="card-icon">🏙️</div>
                                <div class="card-value">${result.affectedRegions.districts}</div>
                                <div class="card-label">Districts</div>
                            </div>
                            <div class="summary-card">
                                <div class="card-icon">🏘️</div>
                                <div class="card-value">${result.affectedRegions.neighborhoods}</div>
                                <div class="card-label">Neighborhoods</div>
                            </div>
                            <div class="summary-card total">
                                <div class="card-icon">📊</div>
                                <div class="card-value">${result.affectedRegions.total}</div>
                                <div class="card-label">Total Affected</div>
                            </div>
                        </div>
                    </div>

                    ${result.affectedRegions.details && result.affectedRegions.details.length > 0 ? `
                        <div class="affected-details">
                            <h4>Detailed Changes:</h4>
                            <div class="details-list">
                                ${result.affectedRegions.details.slice(0, 10).map(detail => `
                                    <div class="detail-item">
                                        <span class="detail-icon">${this.getTypeIcon(detail.regionType)}</span>
                                        <span class="detail-name">${detail.regionName}</span>
                                        <span class="badge badge-${detail.regionType.toLowerCase()}">${detail.regionType}</span>
                                        <span class="status-change">${detail.previousStatus} → ${result.region.status}</span>
                                    </div>
                                `).join('')}
                                ${result.affectedRegions.details.length > 10 ? `
                                    <div class="more-details">+ ${result.affectedRegions.details.length - 10} more regions</div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove();">Got it</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    /**
     * Get type icon
     */
    getTypeIcon(type) {
        const icons = {
            'PROVINCE': '🏛️',
            'DISTRICT': '🏙️',
            'NEIGHBORHOOD': '🏘️'
        };
        return icons[type] || '📍';
    }

    /**
     * Calculate statistics from regions data
     */
    calculateStatistics() {
        return {
            total: this.regions.length,
            byType: {
                PROVINCE: { 
                    total: this.regions.filter(r => r.region_type === 'PROVINCE').length,
                    active: this.regions.filter(r => r.region_type === 'PROVINCE' && r.status === 'ACTIVE').length,
                    inactive: this.regions.filter(r => r.region_type === 'PROVINCE' && r.status === 'INACTIVE').length
                },
                DISTRICT: { 
                    total: this.regions.filter(r => r.region_type === 'DISTRICT').length,
                    active: this.regions.filter(r => r.region_type === 'DISTRICT' && r.status === 'ACTIVE').length,
                    inactive: this.regions.filter(r => r.region_type === 'DISTRICT' && r.status === 'INACTIVE').length
                },
                NEIGHBORHOOD: { 
                    total: this.regions.filter(r => r.region_type === 'NEIGHBORHOOD').length,
                    active: this.regions.filter(r => r.region_type === 'NEIGHBORHOOD' && r.status === 'ACTIVE').length,
                    inactive: this.regions.filter(r => r.region_type === 'NEIGHBORHOOD' && r.status === 'INACTIVE').length
                }
            },
            byStatus: {
                ACTIVE: this.regions.filter(r => r.status === 'ACTIVE').length,
                INACTIVE: this.regions.filter(r => r.status === 'INACTIVE').length
            }
        };
    }

    /**
     * Render statistics
     */
    renderStatistics(stats) {
        const container = document.getElementById('regionsStatistics');
        if (!container) return;

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Total Regions</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-icon">✅</div>
                    <div class="stat-value">${stats.byStatus.ACTIVE}</div>
                    <div class="stat-label">Active</div>
                </div>
                <div class="stat-card danger">
                    <div class="stat-icon">❌</div>
                    <div class="stat-value">${stats.byStatus.INACTIVE}</div>
                    <div class="stat-label">Inactive</div>
                </div>
            </div>
        `;
    }

    /**
     * Update view buttons
     */
    updateViewButtons() {
        document.querySelectorAll('[data-view]').forEach(btn => {
            if (btn.dataset.view === this.currentView) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Update filtered count display
     */
    updateFilteredCount() {
        const countElement = document.getElementById('filteredCount');
        if (countElement) {
            countElement.textContent = `Showing ${this.filteredRegions.length} of ${this.regions.length} regions`;
        }
    }

    /**
     * Show/hide loading state
     */
    showLoading(show) {
        const loader = document.getElementById('regionsLoader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Implement toast notification
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    /**
     * Simulate API call delay
     */
    simulateAPICall() {
        return new Promise(resolve => setTimeout(resolve, 1000));
    }

    /**
     * Simulate toggle response
     */
    simulateToggleResponse(regionId, newStatus) {
        const region = this.regions.find(r => r.regionId === regionId);
        const isDeactivation = newStatus === 'INACTIVE';
        
        // Simulate cascade effect
        let affectedCount = 1;
        if (isDeactivation) {
            if (region.region_type === 'PROVINCE') affectedCount = 15;
            else if (region.region_type === 'DISTRICT') affectedCount = 5;
        } else {
            if (region.region_type === 'DISTRICT') affectedCount = 4;
        }

        return {
            success: true,
            message: `Successfully ${isDeactivation ? 'deactivated' : 'activated'} ${affectedCount} regions`,
            region: { ...region, status: newStatus },
            affectedRegions: {
                provinces: region.region_type === 'PROVINCE' ? 1 : 0,
                districts: region.region_type === 'DISTRICT' ? 1 : region.region_type === 'PROVINCE' ? 4 : 0,
                neighborhoods: isDeactivation ? affectedCount - (region.region_type === 'PROVINCE' ? 5 : 1) : affectedCount - 1,
                total: affectedCount,
                details: []
            },
            operation: isDeactivation ? 'DEACTIVATE_CASCADE' : 'ACTIVATE_WITH_VALIDATION'
        };
    }

    /**
     * Get sample regions data
     */
    getSampleRegions() {
        return [
            {
                regionId: 'PROV_001',
                regionName: 'Baghdad Province',
                regionNameArabic: 'محافظة بغداد',
                governorate: 'Baghdad',
                region_type: 'PROVINCE',
                parent_id: null,
                status: 'ACTIVE',
                activeDrivers: 45,
                activeMerchants: 120
            },
            {
                regionId: 'DIST_001',
                regionName: 'Baghdad Central District',
                regionNameArabic: 'منطقة بغداد المركزية',
                governorate: 'Baghdad',
                region_type: 'DISTRICT',
                parent_id: 'PROV_001',
                status: 'ACTIVE',
                activeDrivers: 15,
                activeMerchants: 45
            },
            {
                regionId: 'NEIGH_001',
                regionName: 'Kadhimiya',
                regionNameArabic: 'الكاظمية',
                governorate: 'Baghdad',
                region_type: 'NEIGHBORHOOD',
                parent_id: 'DIST_001',
                status: 'ACTIVE',
                activeDrivers: 8,
                activeMerchants: 22
            },
            {
                regionId: 'NEIGH_002',
                regionName: 'Mansour',
                regionNameArabic: 'المنصور',
                governorate: 'Baghdad',
                region_type: 'NEIGHBORHOOD',
                parent_id: 'DIST_001',
                status: 'ACTIVE',
                activeDrivers: 7,
                activeMerchants: 23
            },
            {
                regionId: 'DIST_002',
                regionName: 'Baghdad Karkh District',
                regionNameArabic: 'منطقة بغداد الكرخ',
                governorate: 'Baghdad',
                region_type: 'DISTRICT',
                parent_id: 'PROV_001',
                status: 'ACTIVE',
                activeDrivers: 12,
                activeMerchants: 38
            },
            {
                regionId: 'PROV_002',
                regionName: 'Basra Province',
                regionNameArabic: 'محافظة البصرة',
                governorate: 'Basra',
                region_type: 'PROVINCE',
                parent_id: null,
                status: 'INACTIVE',
                activeDrivers: 0,
                activeMerchants: 0
            }
        ];
    }

    // Additional methods can be implemented as needed
    editRegion(regionId) {
        console.log('Edit region:', regionId);
        // Implement edit functionality
    }

    viewDetails(regionId) {
        console.log('View details:', regionId);
        // Implement details view
    }

    deleteRegion(regionId) {
        console.log('Delete region:', regionId);
        // Implement delete functionality
    }

    showAddRegionModal() {
        console.log('Show add region modal');
        // Implement add region modal
    }
}

// Initialize admin panel when DOM is ready
let regionsAdmin;
document.addEventListener('DOMContentLoaded', () => {
    regionsAdmin = new RegionsAdminPanel();
    regionsAdmin.init();
});
