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
        this._drawMap = null;
        this._drawnLayer = null;
        this._drawnBoundary = null; // GeoJSON-like { type, coordinates }
        this._shapesLayer = null; // LayerGroup for polygons/lines
        // Server-side pagination state
        this.pageMode = 'server'; // enable server paging by default
        this.tokenStack = [null]; // stack of page start tokens (null for first page)
        this.serverPageIndex = 0; // current index in tokenStack
        this.lastNextToken = null; // nextToken returned by last fetch
        this.lastPageCount = 0; // last page item count
        this._apiBase = this._detectApiBase();
        // Enforce polygons-only when using the draw feature
        this.polygonsOnly = true;

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

    // ===== Notification helpers (in-page banners + console fallbacks) =====
    showNotification(message, type = 'info') {
        try {
            const banner = document.getElementById('apiErrorBanner');
            if (banner) {
                banner.style.display = 'block';
                banner.style.background = type === 'error' ? 'var(--md-sys-color-error-container)' : 'var(--md-sys-color-surface-container-lowest)';
                banner.style.borderColor = type === 'error' ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-outline-variant)';
                banner.style.color = 'var(--md-sys-color-on-surface)';
                banner.textContent = message;
                // Auto-hide non-error messages after short delay
                if (type !== 'error') {
                    setTimeout(() => { try { banner.style.display = 'none'; } catch {} }, 3500);
                }
            } else {
                console.log(`[${type.toUpperCase()}]`, message);
            }
        } catch (e) { console.log(message); }
    }

    showError(message) { this.showNotification(message, 'error'); }
    showSuccess(message) { this.showNotification(message, 'success'); }

    _detectApiBase() {
        try {
            const host = (window.location && window.location.hostname) || '';
            // Local dev uses Express routes under /api
            if (host === 'localhost' || host === '127.0.0.1') return '/api';
            // Production: use API Gateway base from config.js (already includes stage)
            const cfg = window.WIZZCENTRAL_CONFIG || {};
            const base = (cfg.API_BASE_URL || '').replace(/\/$/, '');
            return base || '/api';
        } catch { return '/api'; }
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

            // Bind Draw Area modal events
            const drawBtn = document.getElementById('drawAreaBtn');
            const drawModal = document.getElementById('drawRegionModal');
            const closeDrawBtn = document.getElementById('closeDrawRegionModalBtn');
            const useShapeBtn = document.getElementById('useDrawnShapeBtn');
            const clearShapeBtn = document.getElementById('clearDrawnShapeBtn');
            if (drawBtn && drawModal) {
                drawBtn.addEventListener('click', () => this.openDrawRegionModal());
            }
            if (closeDrawBtn) closeDrawBtn.addEventListener('click', () => this.closeDrawRegionModal());
            if (useShapeBtn) useShapeBtn.addEventListener('click', () => this.applyDrawnBoundary());
            if (clearShapeBtn) clearShapeBtn.addEventListener('click', () => this.clearDrawnBoundary());

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
        this._shapesLayer = L.layerGroup().addTo(this.map);
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

    openDrawRegionModal() {
        const modal = document.getElementById('drawRegionModal');
        if (!modal) return;
        modal.style.display = 'flex';
        setTimeout(() => this.initializeDrawMap(), 50);
    }

    closeDrawRegionModal() {
        const modal = document.getElementById('drawRegionModal');
        if (modal) modal.style.display = 'none';
    }

    initializeDrawMap() {
        const container = document.getElementById('regionDrawMap');
        if (!container || typeof L === 'undefined' || typeof L.Draw === 'undefined') {
            this.showError('Map draw tools not available');
            return;
        }
        if (this._drawMap) {
            this._drawMap.invalidateSize();
            return;
        }
        const center = this.map ? this.map.getCenter() : { lat: 33.3152, lng: 44.3661 };
        const map = L.map('regionDrawMap').setView([center.lat, center.lng], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        this._drawnItems = drawnItems;

        const drawControl = new L.Control.Draw({
            position: 'topleft',
            draw: {
                marker: false,
                circle: false,
                rectangle: false,
                circlemarker: false,
                polyline: false, // Disable polylines; polygons only
                polygon: { allowIntersection: false, showArea: true, shapeOptions: { color: '#1e88e5' } }
            },
            edit: { featureGroup: drawnItems, remove: true }
        });
        map.addControl(drawControl);

        map.on(L.Draw.Event.CREATED, (e) => {
            // Replace previous shape
            drawnItems.clearLayers();
            this._drawnLayer = e.layer;
            drawnItems.addLayer(this._drawnLayer);
            this._drawnBoundary = this._convertLayerToBoundary(e.layer);
            this._updateDrawSummary();
        });
        map.on(L.Draw.Event.EDITED, () => {
            if (this._drawnLayer) {
                this._drawnBoundary = this._convertLayerToBoundary(this._drawnLayer);
                this._updateDrawSummary();
            }
        });
        map.on(L.Draw.Event.DELETED, () => {
            this._drawnLayer = null;
            this._drawnBoundary = null;
            this._updateDrawSummary();
        });

        this._drawMap = map;
        // If we already have a boundary (editing existing), render it
        try {
            if (this._drawnBoundary) {
                const layer = this._boundaryToLeafletLayer(this._drawnBoundary);
                if (layer) {
                    this._drawnItems.clearLayers();
                    this._drawnLayer = layer;
                    this._drawnItems.addLayer(layer);
                    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
                    this._updateDrawSummary();
                }
            }
        } catch {}
        setTimeout(() => map.invalidateSize(), 150);
    }

    _convertLayerToBoundary(layer) {
        if (!layer) return null;
        if (layer.getLatLngs) {
            // Polygon or Polyline
            const latlngs = layer.getLatLngs();
            // Leaflet returns multi-d arrays. Normalize to single ring for Polygon or sequence for LineString
            if (layer instanceof L.Polygon) {
                const ring = (Array.isArray(latlngs[0]) ? latlngs[0] : latlngs).map(p => [Number(p.lng), Number(p.lat)]);
                if (ring.length >= 3) {
                    // Ensure closure for GeoJSON
                    const first = ring[0];
                    const last = ring[ring.length - 1];
                    if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
                    return { type: 'Polygon', coordinates: [ring] };
                }
            } else if (layer instanceof L.Polyline) {
                const line = (Array.isArray(latlngs[0]) ? latlngs[0] : latlngs).map(p => [Number(p.lng), Number(p.lat)]);
                if (line.length >= 2) return { type: 'LineString', coordinates: line };
            }
        }
        return null;
    }

    _boundaryToLeafletLayer(boundary) {
        if (!boundary || !boundary.coordinates) return null;
        try {
            if (boundary.type === 'Polygon') {
                const ring = boundary.coordinates[0] || [];
                const latlngs = ring.map(([lng, lat]) => [lat, lng]);
                return L.polygon(latlngs, { color: '#1e88e5', weight: 2, fillOpacity: 0.1 });
            }
            if (boundary.type === 'LineString') {
                const pts = boundary.coordinates.map(([lng, lat]) => [lat, lng]);
                return L.polyline(pts, { color: '#ff7f50', weight: 3 });
            }
        } catch {}
        return null;
    }

    _updateDrawSummary() {
        const el = document.getElementById('drawSummary');
        if (!el) return;
        if (!this._drawnBoundary) {
            el.style.display = 'none';
            el.textContent = '';
            return;
        }
        const type = this._drawnBoundary.type;
        const count = this._drawnBoundary.coordinates?.[0]?.length || this._drawnBoundary.coordinates?.length || 0;
        el.style.display = 'block';
        el.textContent = `Selected ${type} with ${count} points`;
    }

    // Disable/enable lat/lng/radius inputs when polygon boundary exists, and show inline note
    _toggleCoordinateInputsForBoundary() {
        const hasPoly = !!(this._drawnBoundary && this._drawnBoundary.type === 'Polygon' && Array.isArray(this._drawnBoundary.coordinates) && (this._drawnBoundary.coordinates[0]?.length || 0) >= 4);
        const latEl = document.getElementById('coordLat');
        const lngEl = document.getElementById('coordLng');
        const radEl = document.getElementById('coordRadius');
        [latEl, lngEl, radEl].forEach(el => { if (el) { el.disabled = hasPoly; el.classList?.toggle('disabled', hasPoly); }});
        let note = document.getElementById('coordInputsNote');
        const anchor = radEl?.parentElement || latEl?.parentElement || lngEl?.parentElement || document.getElementById('regionForm');
        if (!note && anchor) {
            note = document.createElement('div');
            note.id = 'coordInputsNote';
            note.style.fontSize = '0.8rem';
            note.style.marginTop = '6px';
            note.style.color = 'var(--md-sys-color-on-surface-variant, #666)';
            anchor.appendChild(note);
        }
        if (note) note.textContent = hasPoly ? 'Polygon selected. Center and radius will be ignored on save.' : '';
    }

    clearDrawnBoundary() {
        this._drawnBoundary = null;
        this._drawnLayer = null;
        if (this._drawMap && this._drawnItems) {
            this._drawnItems.clearLayers();
        }
        this._updateDrawSummary();
        // Re-enable coordinate inputs without changing their values
        this._toggleCoordinateInputsForBoundary();
    }

    applyDrawnBoundary() {
        if (!this._drawnBoundary) {
            this.showError('Draw a shape first');
            return;
        }
        // Do not touch lat/lng/radius when a polygon is selected
        // Simply close modal, show success, and disable inputs
        this.closeDrawRegionModal();
        this.showSuccess('Area selected from map');
        this._updateDrawSummary();
        this._toggleCoordinateInputsForBoundary();
    }

    _computeCentroid(boundary) {
        if (!boundary || !boundary.coordinates) return null;
        if (boundary.type === 'Polygon') {
            const ring = boundary.coordinates[0];
            let area = 0, cx = 0, cy = 0;
            for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                const [x1, y1] = ring[j];
                const [x2, y2] = ring[i];
                const f = (x1 * y2 - x2 * y1);
                area += f;
                cx += (x1 + x2) * f;
                cy += (y1 + y2) * f;
            }
            area *= 0.5;
            if (area === 0) return null;
            return { lng: cx / (6 * area), lat: cy / (6 * area) };
        }
        if (boundary.type === 'LineString') {
            const pts = boundary.coordinates;
            const m = pts.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
            return { lng: m[0] / pts.length, lat: m[1] / pts.length };
        }
        return null;
    }

    async loadRegions() {
        try {
            const tbody = document.getElementById('regionsTableBody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="loading-cell"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading regions from API...</div></td></tr>`;
            const backendRegions = await this.fetchRegionsFromBackend();
            if (Array.isArray(backendRegions)) {
                this.regions = backendRegions;
                this.lastPageCount = backendRegions.length;
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
        try {
            const tbody = document.getElementById('regionsTableBody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="loading-cell"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading regions from API...</div></td></tr>`;

            // Build query params based on current filters + server/client mode
            const params = new URLSearchParams();
            const levelEl = document.getElementById('levelFilter');
            const statusEl = document.getElementById('statusFilter');
            const searchEl = document.getElementById('regionSearch');
            if (levelEl && levelEl.value !== '') params.set('level', String(parseInt(levelEl.value, 10)));
            if (statusEl && statusEl.value !== '') params.set('active', statusEl.value);
            if (searchEl && searchEl.value.trim()) params.set('search', searchEl.value.trim());

            if (this.pageMode === 'server') {
                params.set('pageMode', 'server');
                params.set('limit', String(this.itemsPerPage));
                const token = this.tokenStack[this.serverPageIndex] || null;
                if (token) params.set('nextToken', token);
            } else {
                // client mode fetch-all then paginate locally
                params.set('limit', '1000');
                params.set('offset', '0');
            }

            const url = `${this._apiBase}/regions${params.toString() ? `?${params.toString()}` : ''}`;
            const isLocal = ['localhost','127.0.0.1'].includes(window.location.hostname);
            let response = await fetch(url, { headers: { 'Content-Type': 'application/json' }});
            if (!response.ok) {
                await this.maybeHandleAwsAuthError(response, url);
                const idToken = sessionStorage.getItem('idToken');
                if (idToken) {
                    response = await fetch(url, { headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' }});
                }
            }
            if (!response.ok) {
                const msg = await response.text();
                if (!isLocal && typeof showApiErrorBanner === 'function') {
                    showApiErrorBanner(`Failed to load regions (${response.status}). ${url} ${msg ? '- ' + msg : ''}`);
                }
                throw new Error(`HTTP ${response.status}: ${msg}`);
            }
            const result = await response.json();
            // Support multiple backend response shapes: legacy {data|regions|pagination.nextToken} and new Lambda {items,total,nextToken}
            const list = result?.data || result?.regions || result?.items || (Array.isArray(result) ? result : []);
            this.lastNextToken = result?.nextToken || result?.pagination?.nextToken || null;
            console.log('📡 /regions returned items:', Array.isArray(list) ? list.length : 'N/A', 'nextToken:', this.lastNextToken);

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
        } catch (e) {
            console.error('fetchRegionsFromBackend failed:', e);
            throw e;
        }
    }

    renderRegionsList() {
        this.applyFilters();
        this.renderTableView();
        this.renderMapMarkers();
    }

    applyFilters() {
        const searchInput = document.getElementById('regionSearch');
        const levelFilter = document.getElementById('levelFilter');
        const statusFilter = document.getElementById('statusFilter');
        let filtered = [...this.regions];
        if (this.pageMode !== 'server') {
            // Local filtering in client mode
            if (searchInput && searchInput.value.trim()) {
                const term = searchInput.value.trim().toLowerCase();
                filtered = filtered.filter(r =>
                    (r.regionName || '').toLowerCase().includes(term) ||
                    (r.regionNameArabic || '').toLowerCase().includes(term) ||
                    (r.governorate || '').toLowerCase().includes(term)
                );
            }
            if (levelFilter && levelFilter.value) {
                let lvl = parseInt(levelFilter.value, 10);
                if (lvl === 4) lvl = 3;
                filtered = filtered.filter(r => Number(r.level) === lvl);
            }
            if (statusFilter && statusFilter.value !== '') {
                const isActive = statusFilter.value === 'true';
                filtered = filtered.filter(r => !!r.isActive === isActive);
            }
        }
        this.filteredRegions = filtered;
        // Apply sort if set (page-level)
        if (this.sortField) {
            const dir = this.sortDirection === 'asc' ? 1 : -1;
            const f = this.sortField;
            this.filteredRegions.sort((a, b) => {
                let va = a[f];
                let vb = b[f];
                if (typeof va === 'string') va = va.toLowerCase();
                if (typeof vb === 'string') vb = vb.toLowerCase();
                if (va < vb) return -1 * dir;
                if (va > vb) return 1 * dir;
                return 0;
            });
        }
        console.log('📊 Filters applied:', {
            mode: this.pageMode,
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
        let pageRegions;
        if (this.pageMode === 'server') {
            pageRegions = this.filteredRegions; // already a single server page
        } else {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredRegions.length);
            pageRegions = this.filteredRegions.slice(startIndex, endIndex);
        }
        const rows = pageRegions.map(region => `
            <tr data-id="${region.regionId}">
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
                    <button class="action-btn view" onclick="window.viewRegionDetails('${region.regionId}', event)" title="View Details"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit" onclick="window.editRegion('${region.regionId}', event)" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="action-btn toggle" onclick="window.toggleRegionStatus('${region.regionId}', event)" title="Toggle Status"><i class="fas fa-power-off"></i></button>
                    <button class="action-btn delete" onclick="window.deleteRegion('${region.regionId}', event)" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`).join('');
        tbody.innerHTML = rows;
        this.updatePagination?.(this.pageMode === 'server' ? null : this.filteredRegions.length);
    }

    renderMapMarkers() {
        if (!this.map || !this._shapesLayer) return;
        this._shapesLayer.clearLayers();
        this.markers.forEach(m => { try { this._shapesLayer.removeLayer(m); } catch {} });
        this.markers = [];
        const regionsToShow = this.filteredRegions && this.filteredRegions.length ? this.filteredRegions : this.regions;
        regionsToShow.slice(0, 500).forEach(r => {
            const c = r.coordinates?.center || { lat: 33.3152, lng: 44.3661 };
            // Center marker (small)
            try {
                const m = L.circleMarker([c.lat, c.lng], { radius: 4, color: r.isActive ? '#2e7d32' : '#9e9e9e' })
                    .bindTooltip(`${r.regionName || ''}`);
                m.addTo(this._shapesLayer);
                this.markers.push(m);
            } catch {}
            // Boundary shape
            if (r.boundary && r.boundary.coordinates) {
                const layer = this._boundaryToLeafletLayer(r.boundary);
                if (layer) {
                    layer.addTo(this._shapesLayer);
                }
            }
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

        if (this.pageMode === 'server') {
            const startIndex = this.serverPageIndex * this.itemsPerPage + 1;
            const endIndex = startIndex + (this.filteredRegions?.length || 0) - 1;
            paginationInfo.style.display = 'flex';
            showingStart && (showingStart.textContent = String(this.filteredRegions.length ? startIndex : 0));
            showingEnd && (showingEnd.textContent = String(this.filteredRegions.length ? endIndex : 0));
            totalCount && (totalCount.textContent = '—');
            if (pageNumbers) pageNumbers.innerHTML = '';
            prevBtn && (prevBtn.disabled = this.serverPageIndex <= 0);
            nextBtn && (nextBtn.disabled = !this.lastNextToken);
            return;
        }

        if (!totalItems) {
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
        if (searchInput) searchInput.addEventListener('input', async () => {
            if (this.pageMode === 'server') { this.resetServerPaging(); await this.loadRegions(); }
            else { this.currentPage = 1; this.renderRegionsList(); }
        });
        if (statusFilter) statusFilter.addEventListener('change', async () => {
            if (this.pageMode === 'server') { this.resetServerPaging(); await this.loadRegions(); }
            else { this.currentPage = 1; this.renderRegionsList(); }
        });
        if (levelFilter) levelFilter.addEventListener('change', async () => {
            if (this.pageMode === 'server') { this.resetServerPaging(); await this.loadRegions(); }
            else { this.currentPage = 1; this.renderRegionsList(); }
        });
        if (prevBtn) prevBtn.addEventListener('click', async () => {
            if (this.pageMode === 'server') { await this.previousServerPage(); }
            else { this.currentPage = Math.max(1, this.currentPage - 1); this.renderRegionsList(); }
        });
        if (nextBtn) nextBtn.addEventListener('click', async () => {
            if (this.pageMode === 'server') { await this.nextServerPage(); }
            else { const totalPages = Math.ceil((this.filteredRegions?.length || 0) / this.itemsPerPage); this.currentPage = Math.min(totalPages, this.currentPage + 1); this.renderRegionsList(); }
        });
    }

    resetServerPaging() {
        this.tokenStack = [null];
        this.serverPageIndex = 0;
        this.lastNextToken = null;
        this.currentPage = 1; // keep table UI consistent
    }

    async nextServerPage() {
        if (!this.lastNextToken) return;
        this.serverPageIndex += 1;
        // store token for this page index (acts as ExclusiveStartKey for the requested page)
        this.tokenStack[this.serverPageIndex] = this.lastNextToken;
        return this.loadRegions();
    }

    async previousServerPage() {
        if (this.serverPageIndex <= 0) return;
        this.serverPageIndex -= 1;
        return this.loadRegions();
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
            isActive: (region.is_active === true || region.is_active === 'true'),
            serviceTypes: region.service_config,
            deliveryConfig: region.delivery_config,
            coordinates: { center: coordinates, boundaries: region.boundary ? region.boundary.coordinates : [] },
            boundary: region.boundary || null
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

        const latEl = document.getElementById('coordLat');
        const lngEl = document.getElementById('coordLng');
        const radEl = document.getElementById('coordRadius');

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
                // Keep selectedRegion and boundary for editing in draw modal
                this.selectedRegion = r;
                this._drawnBoundary = r.boundary || null;

                // Only prefill coords when NO polygon boundary exists
                if (!this._drawnBoundary) {
                    const c = this.map ? this.map.getCenter() : { lat: 33.3152, lng: 44.3661 };
                    if (latEl && !latEl.value) latEl.value = (r.coordinates?.center?.lat ?? c.lat).toFixed(6);
                    if (lngEl && !lngEl.value) lngEl.value = (r.coordinates?.center?.lng ?? c.lng).toFixed(6);
                    if (radEl && !radEl.value) radEl.value = 3000;
                }
            }
        } else {
            this.selectedRegion = null;
            // Clear any previous drawn boundary when creating a new region
            this._drawnBoundary = null;
            // No boundary yet: prefill coordinates with map center
            const c = this.map ? this.map.getCenter() : { lat: 33.3152, lng: 44.3661 };
            if (latEl && !latEl.value) latEl.value = (c.lat || 33.3152).toFixed(6);
            if (lngEl && !lngEl.value) lngEl.value = (c.lng || 44.3661).toFixed(6);
            if (radEl && !radEl.value) radEl.value = 3000;
        }

        // Reflect the current boundary state on coordinate inputs (disables inputs if polygon exists)
        this._toggleCoordinateInputsForBoundary();

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
                // If editing, include regionId to update existing item
                ...(this.selectedRegion ? { regionId: this.selectedRegion.regionId } : {}),
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

            // If a polygon boundary exists, validate and send only boundary (no center/radius)
            if (this._drawnBoundary) {
                const b = this._drawnBoundary;
                if (b.type !== 'Polygon' || !Array.isArray(b.coordinates)) {
                    this.showError('Only Polygon boundaries are allowed');
                    return;
                }
                const ring = (b.coordinates[0] || []).map(pt => [Number(pt[0]), Number(pt[1])]);
                if (ring.length < 3) {
                    this.showError('Polygon must have at least 3 points');
                    return;
                }
                // Ensure closure for GeoJSON
                const first = ring[0];
                const last = ring[ring.length - 1];
                if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
                if (ring.length < 4) {
                    this.showError('Polygon must be closed (first point equals last)');
                    return;
                }
                payload.boundary = { type: 'Polygon', coordinates: [ring] };
                // Remove legacy center/radius when polygon is present
                delete payload.coordinates;
            }

            // Persist to backend
            const resp = await this.saveRegionToBackend(payload);
            if (resp?.success || (resp && (resp.regionId || resp.id) && (resp.name || resp.name_ar))) {
                const created = resp.region || resp.data || resp || payload;
                // Update in-memory list and refresh UI
                const newItem = this.transformRegionData(created);
                const existingIdx = this.regions.findIndex(x => x.regionId === newItem.regionId);
                if (existingIdx >= 0) {
                    this.regions.splice(existingIdx, 1, newItem);
                } else {
                    this.regions.unshift(newItem);
                }
                this.closeRegionModal();
                this.renderRegionsList();
                this.renderMapMarkers?.();
                this.updateStatistics?.();
                this.showSuccess('Region saved successfully');
            } else {
                // Handle known backend validation errors for better UX
                const code = resp?.code || resp?.error || '';
                const msg = resp?.message || 'Failed to save region';
                if (resp?.status === 409 || String(code).toUpperCase().includes('DUPLICATE')) {
                    this.showError('Duplicate region: a region with the same name exists under the same parent/level');
                } else if (resp?.status === 400) {
                    if (code === 'PARENT_NOT_FOUND') this.showError('Parent region does not exist');
                    else if (code === 'PARENT_LEVEL_INVALID') this.showError('Parent level must be exactly level-1');
                    else if (code === 'SELF_PARENT') this.showError('Region cannot be its own parent');
                    else this.showError(msg);
                } else {
                    this.showError(msg);
                }
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
            const url = `${this._apiBase}/regions`;
            let response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(region)
            });
            if (!response.ok) {
                await this.maybeHandleAwsAuthError(response, `${url} [POST]`);
                const idToken = sessionStorage.getItem('idToken');
                if (idToken) {
                    response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(region)
                    });
                }
            }
            const status = response.status;
            const ct = response.headers.get('content-type') || '';
            let body = null;
            try { body = ct.includes('application/json') ? await response.json() : { message: await response.text() }; } catch {}
            if (!response.ok) {
                return { success: false, status, ...(body || {}) };
            }
            // On success, return the parsed body directly (may be the created item)
            return body || { success: true };
        } catch (error) {
            console.warn('Failed to save to backend:', error);
            return { success: false, status: 0, message: error.message || 'Network error' };
        }
    }

    refreshRegions() {
        return this.loadRegions();
    }

    editRegion(regionId, event) {
        if (event) event.stopPropagation();
        this.openRegionModal(regionId);
    }

    async toggleRegionStatus(regionId, event) {
        console.log('🔄 Toggle status for:', regionId);
        if (event) event.stopPropagation();
        const idx = this.regions.findIndex(r => r.regionId === regionId);
        if (idx === -1) {
            console.error('❌ Region not found:', regionId);
            return;
        }
        const prev = this.regions[idx].isActive;
        console.log('Previous status:', prev);
        this.regions[idx].isActive = !prev; // optimistic
        this.renderRegionsList();
        try {
            let url = `${this._apiBase}/regions/${regionId}/toggle`;
            console.log('📤 Calling:', url);
            let resp = await fetch(url, { method: 'PATCH' });
            if (!resp.ok) {
                await this.maybeHandleAwsAuthError(resp, url);
                const idToken = sessionStorage.getItem('idToken');
                if (idToken) {
                    resp = await fetch(url, { method: 'PATCH', headers: { 'Authorization': `Bearer ${idToken}` }});
                }
            }
            if (!resp.ok) throw new Error(await resp.text());
            const data = await resp.json();
            console.log('📥 Toggle response:', data);
            const newStatus = !!(data?.data?.newStatus ?? this.regions[idx].isActive);
            console.log('New status:', newStatus);
            this.regions[idx].isActive = newStatus;
            this.renderRegionsList();
            this.showSuccess('Status updated');
        } catch (e) {
            console.error('❌ Toggle failed:', e);
            this.regions[idx].isActive = prev; // rollback
            this.renderRegionsList();
            this.showError(e.message || 'Failed to toggle status');
        }
    }

    async deleteRegion(regionId, event) {
        if (event) event.stopPropagation();
        if (!regionId) return;
        const ok = window.confirm('Delete this region? This cannot be undone.');
        if (!ok) return;
        try {
            let url = `${this._apiBase}/regions/${regionId}`;
            let resp = await fetch(url, { method: 'DELETE' });
            if (!resp.ok) {
                await this.maybeHandleAwsAuthError(resp, `${url} [DELETE]`);
                const idToken = sessionStorage.getItem('idToken');
                if (idToken) resp = await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${idToken}` }});
            }
            if (!resp.ok) throw new Error(await resp.text());
            // Remove from memory and refresh
            this.regions = this.regions.filter(r => r.regionId !== regionId);
            this.renderRegionsList();
            this.updateStatistics?.();
            this.showSuccess('Region deleted');
        } catch (e) {
            this.showError(e.message || 'Failed to delete region');
        }
    }

    viewRegionDetails(regionId, event) {
        if (event) event.stopPropagation();
        const r = this.regions.find(x => x.regionId === regionId);
        if (!r) return;
        // Focus map
        if (this.map) {
            const c = r.coordinates?.center || { lat: 33.3152, lng: 44.3661 };
            this.map.setView([c.lat, c.lng], 12, { animate: true });
            if (r.boundary) {
                const layer = this._boundaryToLeafletLayer(r.boundary);
                if (layer && this._shapesLayer) {
                    layer.addTo(this._shapesLayer);
                    try { this.map.fitBounds(layer.getBounds(), { padding: [20, 20] }); } catch {}
                    setTimeout(() => { try { this._shapesLayer.removeLayer(layer); } catch {} }, 2500);
                }
            }
        }
        // Render info panel
        this._renderRegionInfoPanel(r);
    }

    _renderRegionInfoPanel(region) {
        const panel = document.getElementById('regionInfoPanel');
        if (!panel) return;
        const parent = region.parent_id ? (this.regions.find(x => x.regionId === region.parent_id) || null) : null;
        const children = this.regions.filter(x => x.parent_id === region.regionId);
        const coords = region.coordinates?.center || { lat: 33.3152, lng: 44.3661 };
        const boundaryType = region.boundary?.type || '—';
        const boundaryPoints = region.boundary?.coordinates ? (region.boundary.type === 'Polygon' ? (region.boundary.coordinates[0]?.length || 0) : region.boundary.coordinates.length) : 0;
        const lvl = Number(region.level);
        const levelLabel = ({0:'Country',1:'Governorate',2:'District',3:'Neighborhood'})[lvl] || String(lvl);
        const statusCls = region.isActive ? 'active' : 'inactive';
        const statusText = region.isActive ? 'ACTIVE' : 'INACTIVE';
        panel.innerHTML = `
            <div class="region-info-header">
                <div class="region-info-title"><i class="fas fa-location-dot" style="opacity:.7;"></i> ${region.regionName || ''}</div>
                <button class="region-info-close" title="Close" onclick="(function(){const p=document.getElementById('regionInfoPanel'); if(p) p.style.display='none';})()"><i class="fas fa-times"></i></button>
            </div>
            <div class="region-info-grid">
                <div class="region-info-label">Arabic</div><div class="region-info-value">${region.regionNameArabic || '—'}</div>
                <div class="region-info-label">Region ID</div><div class="region-info-value">${region.regionId}</div>
                <div class="region-info-label">Level</div><div class="region-info-value">${levelLabel}</div>
                <div class="region-info-label">Status</div><div class="region-info-value"><span class="region-info-badge ${statusCls}">${statusText}</span></div>
                <div class="region-info-label">Governorate</div><div class="region-info-value">${region.governorate || '—'}</div>
                <div class="region-info-label">Parent</div><div class="region-info-value">${parent ? `${parent.regionName} (${parent.regionId})` : '—'}</div>
                <div class="region-info-label">Children</div><div class="region-info-value">${children.length}</div>
                <div class="region-info-label">Center</div><div class="region-info-value">${coords.lat?.toFixed ? coords.lat.toFixed(6) : coords.lat}, ${coords.lng?.toFixed ? coords.lng.toFixed(6) : coords.lng}</div>
                <div class="region-info-label">Boundary</div><div class="region-info-value">${boundaryType} ${boundaryPoints ? `(${boundaryPoints} pts)` : ''}</div>
                <div class="region-info-label">Updated</div><div class="region-info-value">${region.updatedAt || region.updated_at || '—'}</div>
            </div>
        `;
        panel.style.display = 'block';
    }

    selectRegion(regionId) {
        this.selectedRegion = this.regions.find(x => x.regionId === regionId) || null;
    }

    handleSort(field) {
        if (!field) return;
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.renderRegionsList();
    }

    changePage(page) {
        if (this.pageMode === 'server') return; // ignore direct page jumps in server mode
        this.goToPage(page);
    }

    goToPage(page) {
        if (this.pageMode === 'server') return; // handled by next/prev only
        const totalPages = Math.ceil((this.filteredRegions?.length || 0) / this.itemsPerPage) || 1;
        this.currentPage = Math.max(1, Math.min(totalPages, parseInt(page, 10) || 1));
        this.renderRegionsList();
    }

    previousPage() { this.pageMode === 'server' ? this.previousServerPage() : this.goToPage(this.currentPage - 1); }
    nextPage() { this.pageMode === 'server' ? this.nextServerPage() : this.goToPage(this.currentPage + 1); }

    toggleView(viewType) {
        this.currentView = viewType || 'table';
        this.renderRegionsList();
    }
}

// Global functions for HTML onclick handlers
window.selectRegion = (regionId) => regionsManager.selectRegion(regionId);
window.toggleRegionStatus = (regionId, event) => regionsManager.toggleRegionStatus(regionId, event);
window.editRegion = (regionId, event) => regionsManager.editRegion(regionId, event);
window.deleteRegion = (regionId, event) => regionsManager.deleteRegion(regionId, event);
window.viewRegionDetails = (regionId, event) => regionsManager.viewRegionDetails(regionId, event);
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
