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
        this.awsAuthWarningShown = this.awsAuthWarningShown || false;
        this._modalEl = null;
        this._formEl = null;

        console.log('🗺️ RegionsManager: Constructor called, readyState:', document.readyState);

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            console.log('🗺️ DOM still loading, waiting for DOMContentLoaded...');
            document.addEventListener('DOMContentLoaded', () => {
                console.log('🗺️ DOMContentLoaded fired, initializing...');
                this.init();
            });
        } else {
            console.log('🗺️ DOM already loaded, initializing immediately...');
            // Use setTimeout to ensure everything is rendered
            setTimeout(() => this.init(), 100);
        }
    }

    async init() {
        console.log('🗺️ RegionsManager: Initializing...');
        console.log('🗺️ Checking required elements...');

        // Check if required elements exist
        const tableBody = document.getElementById('regionsTableBody');
        const tableContainer = document.getElementById('regionsTableContainer');

        console.log('🗺️ Elements found:', {
            tableBody: !!tableBody,
            tableContainer: !!tableContainer
        });

        if (!tableBody || !tableContainer) {
            console.error('❌ Required HTML elements not found! Cannot initialize.');
            return;
        }

        try {
            // Initialize map (optional)
            this.initializeMap();

            // Load regions data
            await this.loadRegions();

            // Setup event listeners
            this.setupEventListeners();

            // Bind form submit if present
            const form = document.getElementById('regionForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveRegion();
                });
            }

            console.log('✅ RegionsManager: Initialized successfully');
        } catch (error) {
            console.error('❌ RegionsManager initialization failed:', error);
            this.showError('Failed to initialize regions management');
        }
    }

    initializeMap() {
        // Guard if no map container or Leaflet
        const mapContainer = document.getElementById('regionsMap');
        if (!mapContainer || typeof L === 'undefined') {
            console.log('ℹ️ Map not initialized (container or Leaflet missing)');
            this.map = null;
            return;
        }
        // Initialize map centered on Iraq
        this.map = L.map('regionsMap').setView([33.3152, 44.3661], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);
        this.map.on('click', (e) => this.onMapClick(e));
        // Pick-on-map helpers
        this._pickOnMapActive = false;
        const pickBtn = document.getElementById('pickOnMapBtn');
        const useCenterBtn = document.getElementById('useMapCenterBtn');
        if (pickBtn) {
            pickBtn.addEventListener('click', () => {
                this._pickOnMapActive = true;
                this.showNotification('Click on the map to set coordinates', 'info');
            });
        }
        if (useCenterBtn) {
            useCenterBtn.addEventListener('click', () => {
                if (!this.map) return;
                const c = this.map.getCenter();
                const latEl = document.getElementById('coordLat');
                const lngEl = document.getElementById('coordLng');
                if (latEl) latEl.value = c.lat.toFixed(6);
                if (lngEl) lngEl.value = c.lng.toFixed(6);
            });
        }
        console.log('✅ Map initialized');
    }

    onMapClick(e) {
        // If picking is active, set form coordinates
        if (this._pickOnMapActive) {
            const { lat, lng } = e.latlng;
            const latEl = document.getElementById('coordLat');
            const lngEl = document.getElementById('coordLng');
            if (latEl) latEl.value = lat.toFixed(6);
            if (lngEl) lngEl.value = lng.toFixed(6);
            this._pickOnMapActive = false;
            this.showSuccess('Coordinates set from map');
        }
        console.log('Map clicked at:', e.latlng);
    }

    async loadRegions() {
        try {
            const tbody = document.getElementById('regionsTableBody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="loading-cell"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading regions from API...</div></td></tr>`;
            const backendRegions = await this.fetchRegionsFromBackend();
            if (Array.isArray(backendRegions)) {
                this.regions = backendRegions;
                this.renderRegionsList();
                this.updateStatistics?.();
            } else {
                throw new Error('Invalid regions payload');
            }
        } catch (e) {
            console.error('loadRegions failed:', e);
            this.showError('Failed to load regions');
            this.regions = [];
            this.renderRegionsList();
        }
    }

    async fetchRegionsFromBackend() {
        let response = await fetch('/api/regions', { headers: { 'Content-Type': 'application/json' }});
        if (!response.ok) {
            await this.maybeHandleAwsAuthError(response, '/api/regions');
            const idToken = sessionStorage.getItem('idToken');
            if (idToken) {
                response = await fetch('/api/regions', { headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' }});
            }
        }
        if (!response.ok) {
            const msg = await response.text();
            throw new Error(`HTTP ${response.status}: ${msg}`);
        }
        const result = await response.json();
        const list = result?.data || result?.regions || (Array.isArray(result) ? result : []);
        console.log('📡 /api/regions returned items:', Array.isArray(list) ? list.length : 'N/A');
        const rawById = new Map(list.filter(r => r && (r.id || r.regionId)).map(r => [r.id || r.regionId, r]));
        const findGovernorateName = (rid) => {
            let cursor = rawById.get(rid);
            let steps = 0;
            while (cursor && steps < 10) {
                const lvl = Number(cursor.level);
                if (lvl === 1) return cursor.name || cursor.name_en || cursor.name_ar || cursor.regionName;
                if (!cursor.parent_id) break;
                cursor = rawById.get(cursor.parent_id);
                steps++;
            }
            return undefined;
        };
        const transformed = list.map(r => this.transformRegionData(r, findGovernorateName));
        console.log('🧭 Transformed regions count:', transformed.length);
        return transformed;
    }

    renderRegionsList() {
        this.applyFilters();
        this.renderTableView();
    }

    applyFilters() {
        const searchInput = document.getElementById('regionSearch');
        const levelFilter = document.getElementById('levelFilter');
        const statusFilter = document.getElementById('statusFilter');
        let filtered = [...this.regions];
        // Search
        if (searchInput && searchInput.value.trim()) {
            const term = searchInput.value.trim().toLowerCase();
            filtered = filtered.filter(r =>
                (r.regionName || '').toLowerCase().includes(term) ||
                (r.regionNameArabic || '').toLowerCase().includes(term) ||
                (r.governorate || '').toLowerCase().includes(term)
            );
        }
        // Level filter (normalize 4 -> 3 as UI has Streets but backend levels are 0..3)
        if (levelFilter && levelFilter.value) {
            let lvl = parseInt(levelFilter.value, 10);
            if (lvl === 4) lvl = 3;
            filtered = filtered.filter(r => Number(r.level) === lvl);
        }
        // Status filter
        if (statusFilter && statusFilter.value !== '') {
            const isActive = statusFilter.value === 'true';
            filtered = filtered.filter(r => !!r.isActive === isActive);
        }
        this.filteredRegions = filtered;
        console.log('📊 Filters applied:', {
            total: this.regions.length,
            afterFilters: this.filteredRegions.length,
            level: levelFilter?.value || '',
            status: statusFilter?.value || '',
            search: searchInput?.value || ''
        });
    }

    renderTableView() {
        const tbody = document.getElementById('regionsTableBody');
        if (!tbody) return;
        if (!this.filteredRegions || this.filteredRegions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="loading-cell"><div class="loading-state"><i class="fas fa-search"></i><div>No regions found</div><div style=\"font-size: 0.8rem; color: var(--md-sys-color-on-surface-variant);\">Try adjusting your search or filters</div></div></td></tr>`;
            this.updatePagination?.(0);
            return;
        }
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredRegions.length);
        const pageRegions = this.filteredRegions.slice(startIndex, endIndex);
        const rows = pageRegions.map(region => `
            <tr>
                <td class="region-name-cell">
                    <div class="region-name-en">${region.regionName || ''}</div>
                    <div class="region-name-ar">${region.regionNameArabic || ''}</div>
                </td>
                <td>
                    <div style="display:flex;align-items:center;gap:0.5rem;">
                        <i class="fas fa-map" style="color: var(--md-sys-color-primary); opacity: 0.7;"></i>
                        ${region.governorate || '—'}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${region.isActive ? 'active' : 'inactive'}">
                        <i class="fas fa-${region.isActive ? 'check-circle' : 'times-circle'}"></i>
                        ${region.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="action-btn view" title="View Details"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="action-btn toggle" title="Toggle Status"><i class="fas fa-power-off"></i></button>
                </td>
            </tr>`).join('');
        tbody.innerHTML = rows;
        this.updatePagination?.(this.filteredRegions.length);
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
            paginationInfo.style.display = 'flex';
            showingStart && (showingStart.textContent = '0');
            showingEnd && (showingEnd.textContent = '0');
            totalCount && (totalCount.textContent = '0');
            pageNumbers && (pageNumbers.innerHTML = '');
            prevBtn && (prevBtn.disabled = true);
            nextBtn && (nextBtn.disabled = true);
            return;
        }
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, totalItems);
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        paginationInfo.style.display = 'flex';
        showingStart && (showingStart.textContent = String(startIndex));
        showingEnd && (showingEnd.textContent = String(endIndex));
        totalCount && (totalCount.textContent = String(totalItems));
        // Simple page numbers
        if (pageNumbers) {
            let html = '';
            const maxVisible = 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);
            if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }
            for (let p = startPage; p <= endPage; p++) {
                html += `<button class="page-number ${p === this.currentPage ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`;
            }
            pageNumbers.innerHTML = html;
        }
        prevBtn && (prevBtn.disabled = this.currentPage <= 1);
        nextBtn && (nextBtn.disabled = this.currentPage >= totalPages);
    }

    setupEventListeners() {
        const searchInput = document.getElementById('regionSearch');
        const statusFilter = document.getElementById('statusFilter');
        const levelFilter = document.getElementById('levelFilter');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (searchInput) searchInput.addEventListener('input', () => { this.currentPage = 1; this.renderRegionsList(); });
        if (statusFilter) statusFilter.addEventListener('change', () => { this.currentPage = 1; this.renderRegionsList(); });
        if (levelFilter) levelFilter.addEventListener('change', () => { this.currentPage = 1; this.renderRegionsList(); });
        if (prevBtn) prevBtn.addEventListener('click', () => { this.currentPage = Math.max(1, this.currentPage - 1); this.renderRegionsList(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { const totalPages = Math.ceil((this.filteredRegions?.length || 0) / this.itemsPerPage); this.currentPage = Math.min(totalPages, this.currentPage + 1); this.renderRegionsList(); });
    }

    async maybeHandleAwsAuthError(response, endpoint) {
        try {
            if (response.status === 401) {
                const ct = response.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    const data = await response.clone().json();
                    if (data && data.error === 'aws-credentials') this.showAwsCredentialsToast(data, endpoint);
                } else {
                    this.showAwsCredentialsToast({}, endpoint);
                }
            }
        } catch (e) { console.warn('AWS auth parse failed:', e); }
    }

    showAwsCredentialsToast(data = {}, endpoint = '') {
        if (this.awsAuthWarningShown) return; this.awsAuthWarningShown = true;
        const profile = data.profile || 'wizz-drivers-ghayth-dev';
        const region = data.region || 'us-east-1';
        this.showNotification(`AWS credentials missing/expired for DynamoDB (${region}). Run: aws sso login --profile ${profile}. Then retry ${endpoint}`, 'error');
    }

    transformRegionData(region, findGovernorateName) {
        let coordinates = { lat: 33.3152, lng: 44.3661 };
        if (region.coordinates) {
            coordinates = {
                lat: region.coordinates.lat || region.coordinates.center?.lat || 33.3152,
                lng: region.coordinates.lng || region.coordinates.center?.lng || 44.3661
            };
        }
        // Derive governorate for display
        let gov = region.governorate || region.governorate_id;
        const lvl = Number(region.level);
        if (!gov && typeof findGovernorateName === 'function') {
            if (lvl === 1) {
                gov = region.name || region.name_en || region.name_ar || region.regionName;
            } else if (lvl >= 2) {
                gov = findGovernorateName(region.parent_id || region.regionId || region.id) || '—';
            }
        }
        return {
            regionId: region.regionId || region.id,
            regionName: region.name || region.regionName,
            regionNameArabic: region.name_ar || region.regionNameArabic,
            governorate: gov || (lvl === 0 ? '—' : 'N/A'),
            level: lvl,
            parent_id: region.parent_id,
            isActive: region.is_active !== false,
            serviceTypes: region.service_config,
            deliveryConfig: region.delivery_config,
            coordinates: { center: coordinates, boundaries: region.boundary ? region.boundary.coordinates : [] }
        };
    }

    get modalEl() {
        return this._modalEl || (this._modalEl = document.getElementById('regionModal'));
    }

    get formEl() {
        return this._formEl || (this._formEl = document.getElementById('regionForm'));
    }

    openRegionModal(regionId = null) {
        const modal = this.modalEl;
        const form = this.formEl;
        if (!modal || !form) return;

        // Reset form
        form.reset();
        document.getElementById('modalTitle').textContent = regionId ? 'Edit Region' : 'Add New Region';

        // Populate parent regions based on selected level
        this.populateParentOptions();
        const levelEl = document.getElementById('regionLevel');
        if (levelEl) {
            levelEl.addEventListener('change', () => this.populateParentOptions());
        }
        
        // Prefill coordinates with map center
        const c = this.map ? this.map.getCenter() : { lat: 33.3152, lng: 44.3661 };
        const latEl = document.getElementById('coordLat');
        const lngEl = document.getElementById('coordLng');
        const radEl = document.getElementById('coordRadius');
        if (latEl && !latEl.value) latEl.value = (c.lat || 33.3152).toFixed(6);
        if (lngEl && !lngEl.value) lngEl.value = (c.lng || 44.3661).toFixed(6);
        if (radEl && !radEl.value) radEl.value = 3000;

        // Prefill if editing
        if (regionId) {
            const r = this.regions.find(x => x.regionId === regionId);
            if (r) {
                const name = document.getElementById('regionName');
                const nameAr = document.getElementById('regionNameArabic');
                const gov = document.getElementById('governorate');
                const est = document.getElementById('estimatedDelivery');
                const status = document.getElementById('regionStatus');
                const svcDel = document.getElementById('serviceDelivery');
                const svcPck = document.getElementById('servicePickup');
                const svcDine = document.getElementById('serviceDineIn');
                if (name) name.value = r.regionName || '';
                if (nameAr) nameAr.value = r.regionNameArabic || '';
                if (gov) gov.value = r.governorate && r.governorate !== '—' ? r.governorate : '';
                if (est) est.value = r.estimatedDeliveryTime || 30;
                if (status) status.value = r.isActive ? 'active' : 'inactive';
                if (svcDel) svcDel.checked = !!(r.serviceTypes?.delivery ?? true);
                if (svcPck) svcPck.checked = !!(r.serviceTypes?.pickup ?? false);
                if (svcDine) svcDine.checked = !!(r.serviceTypes?.dineIn ?? false);
            }
        }

        modal.style.display = 'flex';
        this.currentModal = 'region';
    }

    populateParentOptions() {
        const levelEl = document.getElementById('regionLevel');
        const parentEl = document.getElementById('parentRegion');
        if (!levelEl || !parentEl) return;
        const level = parseInt(levelEl.value || '3', 10);
        const neededParentLevel = level - 1;
        let options = '<option value="">None</option>';
        if (neededParentLevel >= 0) {
            const parents = this.regions.filter(r => r.level === neededParentLevel);
            parents.forEach(p => {
                options += `<option value="${p.regionId}">${p.regionName} (${p.regionId})</option>`;
            });
        }
        parentEl.innerHTML = options;
    }

    closeRegionModal() {
        const modal = this.modalEl;
        if (modal) modal.style.display = 'none';
        this.currentModal = null;
    }

    async saveRegion() {
        const form = this.formEl;
        if (!form) return;

        // Button state
        const btnText = document.getElementById('saveButtonText');
        const btnSpin = document.getElementById('saveButtonSpinner');
        if (btnText) btnText.textContent = 'Saving...';
        if (btnSpin) btnSpin.style.display = 'inline-block';

        try {
            // Collect form values
            const name = document.getElementById('regionName')?.value?.trim();
            const nameAr = document.getElementById('regionNameArabic')?.value?.trim();
            const governorateLabel = document.getElementById('governorate')?.value || '';
            const estimated = parseInt(document.getElementById('estimatedDelivery')?.value || '30', 10);
            const status = document.getElementById('regionStatus')?.value || 'active';
            const svcDelivery = document.getElementById('serviceDelivery')?.checked ?? true;
            const svcPickup = document.getElementById('servicePickup')?.checked ?? false;
            const svcDineIn = document.getElementById('serviceDineIn')?.checked ?? false;
            const selectedLevel = parseInt(document.getElementById('regionLevel')?.value || '3', 10);
            const parentRegionId = document.getElementById('parentRegion')?.value || null;
            const latVal = parseFloat(document.getElementById('coordLat')?.value || '33.3152');
            const lngVal = parseFloat(document.getElementById('coordLng')?.value || '44.3661');
            const radiusVal = parseInt(document.getElementById('coordRadius')?.value || '3000', 10);

            if (!name || !nameAr) {
                this.showError('Please enter both English and Arabic names');
                return;
            }

            // Validate parent level relationship
            if (selectedLevel > 0 && !parentRegionId) {
                this.showError('Please select a parent region for this level');
                return;
            }
            if (parentRegionId) {
                const parent = this.regions.find(r => r.regionId === parentRegionId);
                if (!parent || parent.level !== selectedLevel - 1) {
                    this.showError('Invalid parent region for selected level');
                    return;
                }
            }

            // Map governorate label to an existing level-1 regionId if possible
            let parentId = null;
            const gov = this.regions.find(r => r.level === 1 && (
                (r.regionName && r.regionName.toLowerCase() === governorateLabel.toLowerCase()) ||
                (r.regionNameArabic && r.regionNameArabic === governorateLabel) ||
                (r.governorate && r.governorate.toLowerCase() === governorateLabel.toLowerCase())
            ));
            if (gov) parentId = gov.regionId;

            // Build payload matching server normalization
            const payload = {
                name,
                name_ar: nameAr,
                level: selectedLevel,
                parent_id: parentRegionId,
                is_active: status === 'active',
                service_config: {
                    delivery: svcDelivery,
                    pickup: svcPickup,
                    dineIn: svcDineIn
                },
                delivery_config: {
                    estimated_time_minutes: isNaN(estimated) ? 30 : estimated
                },
                coordinates: { lat: isNaN(latVal) ? 33.3152 : latVal, lng: isNaN(lngVal) ? 44.3661 : lngVal, radius: isNaN(radiusVal) ? 3000 : radiusVal }
            };

            // Persist to backend
            const resp = await this.saveRegionToBackend(payload);
            if (resp?.success) {
                const created = resp.region || resp.data || payload;
                // Add to in-memory list and refresh UI
                this.regions.unshift(this.transformRegionData(created));
                this.closeRegionModal();
                this.renderRegionsList();
                this.renderMapMarkers();
                this.updateStatistics();
                this.showSuccess('Region saved successfully');
            } else {
                this.showError('Failed to save region');
            }
        } catch (e) {
            console.error('saveRegion error:', e);
            this.showError(e.message || 'Failed to save region');
        } finally {
            if (btnText) btnText.textContent = 'Save Region';
            if (btnSpin) btnSpin.style.display = 'none';
        }
    }

    async saveRegionToBackend(region) {
        try {
            // Try without auth first
            let response = await fetch('/api/regions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(region)
            });
            if (!response.ok) {
                await this.maybeHandleAwsAuthError(response, '/api/regions [POST]');
                // Fallback with idToken if available
                const idToken = sessionStorage.getItem('idToken');
                if (idToken) {
                    response = await fetch('/api/regions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${idToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(region)
                    });
                }
            }
            if (!response.ok) {
                const txt = await response.text();
                throw new Error(`HTTP ${response.status}: ${txt}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Failed to save to backend:', error);
            throw error;
        }
    }

    refreshRegions() {
        return this.loadRegions();
    }

    editRegion(regionId, event) {
        if (event) event.stopPropagation();
        this.openRegionModal(regionId);
    }

    // ...existing methods...
}

// Global functions for HTML onclick handlers
window.selectRegion = (regionId) => regionsManager.selectRegion(regionId);
window.toggleRegionStatus = (regionId, event) => regionsManager.toggleRegionStatus(regionId, event);
window.editRegion = (regionId, event) => regionsManager.editRegion(regionId, event);
window.openAddRegionModal = () => regionsManager.openRegionModal();
window.closeRegionModal = () => regionsManager.closeRegionModal();
window.saveRegion = () => regionsManager.saveRegion();
window.refreshRegionsData = () => regionsManager.refreshRegions();

// Table view functions
window.toggleView = (viewType) => regionsManager.toggleView(viewType);
window.sortTable = (field) => regionsManager.handleSort(field);
window.changePage = (page) => regionsManager.changePage(page);
window.previousPage = () => regionsManager.previousPage();
window.nextPage = () => regionsManager.nextPage();
window.viewRegionDetails = (regionId, event) => regionsManager.viewRegionDetails(regionId, event);
window.goToPage = (page) => regionsManager.goToPage(page);

// Initialize the regions manager
const regionsManager = new RegionsManager();

console.log('🗺️ Regions management system loaded');
