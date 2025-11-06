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

            if (!name || !nameAr) {
                this.showError('Please enter both English and Arabic names');
                return;
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
                level: 3, // default neighborhood; can be extended later with a level selector
                parent_id: parentId,
                is_active: status === 'active',
                service_config: {
                    delivery: svcDelivery,
                    pickup: svcPickup,
                    dineIn: svcDineIn
                },
                delivery_config: {
                    estimated_time_minutes: isNaN(estimated) ? 30 : estimated
                },
                coordinates: { lat: 33.3152, lng: 44.3661, radius: 5000 }
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
