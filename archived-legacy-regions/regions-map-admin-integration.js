/**
 * Integration layer between RegionsAdminPanel and RegionsMapIntegration
 * Connects the admin panel UI with the interactive map
 */

class RegionsMapAdminIntegration {
    constructor() {
        this.adminPanel = null;
        this.mapIntegration = null;
        this.isInitialized = false;
        
        console.log('🔗 RegionsMapAdminIntegration initialized');
    }
    
    /**
     * Initialize with admin panel and map instances
     */
    async initialize(adminPanel, mapConfig) {
        try {
            console.log('🚀 Initializing map-admin integration...');
            
            this.adminPanel = adminPanel;
            
            // Initialize map
            this.mapIntegration = new RegionsMapIntegration({
                ...mapConfig,
                onRegionSelect: (region) => this.handleMapRegionSelect(region),
                onRegionCreate: (geoJSON) => this.handleMapRegionCreate(geoJSON),
                onRegionUpdate: (geoJSON) => this.handleMapRegionUpdate(geoJSON)
            });
            
            await this.mapIntegration.initialize();
            
            // Setup bidirectional communication
            this.setupEventBridge();
            
            this.isInitialized = true;
            console.log('✅ Map-admin integration complete');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error initializing map-admin integration:', error);
            throw error;
        }
    }
    
    /**
     * Setup event bridge between admin panel and map
     */
    setupEventBridge() {
        // Listen for admin panel events
        document.addEventListener('regions:loaded', (e) => {
            this.handleRegionsLoaded(e.detail.regions);
        });
        
        document.addEventListener('regions:filtered', (e) => {
            this.handleRegionsFiltered(e.detail.filters);
        });
        
        document.addEventListener('region:selected', (e) => {
            this.handleAdminRegionSelect(e.detail.region);
        });
        
        document.addEventListener('region:statusChanged', (e) => {
            this.handleRegionStatusChanged(e.detail);
        });
        
        document.addEventListener('region:edit', (e) => {
            this.handleRegionEdit(e.detail.region);
        });
        
        console.log('✅ Event bridge setup complete');
    }
    
    /**
     * Handle regions loaded in admin panel
     */
    handleRegionsLoaded(regions) {
        console.log(`📍 Loading ${regions.length} regions onto map...`);
        this.mapIntegration.loadRegions(regions);
    }
    
    /**
     * Handle filters applied in admin panel
     */
    handleRegionsFiltered(filters) {
        console.log('🔍 Applying filters to map:', filters);
        this.mapIntegration.applyFilters(filters);
    }
    
    /**
     * Handle region selected in admin panel (highlight on map)
     */
    handleAdminRegionSelect(region) {
        console.log(`🎯 Highlighting region on map: ${region.regionId}`);
        this.mapIntegration.highlightRegion(region.regionId);
        this.mapIntegration.zoomToRegion(region);
    }
    
    /**
     * Handle region status changed (update map colors)
     */
    handleRegionStatusChanged(data) {
        console.log('🔄 Region status changed, reloading map...');
        // Reload regions to update colors
        if (this.adminPanel && this.adminPanel.regions) {
            this.mapIntegration.loadRegions(this.adminPanel.regions);
        }
    }
    
    /**
     * Handle region edit (enter drawing mode)
     */
    handleRegionEdit(region) {
        console.log(`✏️ Editing region on map: ${region.regionId}`);
        this.mapIntegration.editRegion(region);
    }
    
    /**
     * Handle region selected on map (notify admin panel)
     */
    handleMapRegionSelect(region) {
        console.log(`🗺️ Region selected on map: ${region.regionId}`);
        
        // Dispatch event for admin panel
        document.dispatchEvent(new CustomEvent('map:regionSelected', {
            detail: { region }
        }));
        
        // Update admin panel selection
        if (this.adminPanel && this.adminPanel.selectRegion) {
            this.adminPanel.selectRegion(region.regionId);
        }
    }
    
    /**
     * Handle region created on map (open create form with coordinates)
     */
    handleMapRegionCreate(geoJSON) {
        console.log('✨ Region created on map:', geoJSON);
        
        // Extract coordinates
        const coordinates = this.extractCoordinates(geoJSON);
        
        // Dispatch event for admin panel
        document.dispatchEvent(new CustomEvent('map:regionCreated', {
            detail: { coordinates, geoJSON }
        }));
        
        // Open create modal with pre-filled coordinates
        if (this.adminPanel && this.adminPanel.showCreateModal) {
            this.adminPanel.showCreateModal(coordinates);
        }
    }
    
    /**
     * Handle region updated on map (update coordinates)
     */
    handleMapRegionUpdate(geoJSON) {
        console.log('📝 Region updated on map:', geoJSON);
        
        // Extract coordinates
        const coordinates = this.extractCoordinates(geoJSON);
        
        // Dispatch event for admin panel
        document.dispatchEvent(new CustomEvent('map:regionUpdated', {
            detail: { coordinates, geoJSON }
        }));
    }
    
    /**
     * Extract coordinates from GeoJSON
     */
    extractCoordinates(geoJSON) {
        const properties = geoJSON.properties || {};
        
        return {
            gps_coordinates: properties.gps_coordinates,
            center: properties.center,
            boundaries: properties.boundaries
        };
    }
    
    /**
     * Enable drawing mode for creating new region
     */
    enableDrawingMode(type = 'polygon') {
        if (!this.mapIntegration) {
            console.error('❌ Map not initialized');
            return;
        }
        
        this.mapIntegration.enableDrawingMode(type);
        
        // Show drawing indicator
        this.showDrawingIndicator(type);
    }
    
    /**
     * Disable drawing mode
     */
    disableDrawingMode() {
        if (!this.mapIntegration) return;
        
        this.mapIntegration.disableDrawingMode();
        this.hideDrawingIndicator();
    }
    
    /**
     * Show drawing mode indicator
     */
    showDrawingIndicator(type) {
        const indicator = document.getElementById('drawing-mode-indicator');
        if (indicator) {
            indicator.style.display = 'flex';
            indicator.innerHTML = `
                <i class="fas fa-pencil-alt"></i>
                <span>Drawing ${type === 'polygon' ? 'Region Boundary' : 'Region Marker'}</span>
            `;
        }
    }
    
    /**
     * Hide drawing mode indicator
     */
    hideDrawingIndicator() {
        const indicator = document.getElementById('drawing-mode-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    /**
     * Get current drawing data
     */
    getCurrentDrawing() {
        if (!this.mapIntegration) return null;
        return this.mapIntegration.getCurrentDrawing();
    }
    
    /**
     * Zoom to specific region type
     */
    zoomToRegionType(regionType) {
        if (!this.mapIntegration) return;
        this.mapIntegration.zoomToRegionType(regionType);
    }
    
    /**
     * Fit map to all regions
     */
    fitMapToRegions() {
        if (!this.mapIntegration) return;
        this.mapIntegration.fitMapToRegions();
    }
    
    /**
     * Destroy integration
     */
    destroy() {
        if (this.mapIntegration) {
            this.mapIntegration.destroy();
            this.mapIntegration = null;
        }
        
        this.adminPanel = null;
        this.isInitialized = false;
        
        console.log('🗑️ Map-admin integration destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RegionsMapAdminIntegration;
}
