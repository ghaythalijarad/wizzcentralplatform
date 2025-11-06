/**
 * WizzCentral Regions Map Integration with Mapbox
 * 
 * Features:
 * - Display regions as markers or polygons based on GPS coordinates
 * - Interactive region creation/editing with map drawing tools
 * - Color-coded regions (green=ACTIVE, red=INACTIVE)
 * - Zoom filtering by region type (PROVINCE/DISTRICT/NEIGHBORHOOD)
 * - GeoJSON format support
 * - Click handlers for region selection
 * - Search and filter integration
 * 
 * Dependencies:
 * - Mapbox GL JS v2.15.0+
 * - Mapbox Draw Plugin for drawing tools
 */

class RegionsMapIntegration {
    constructor(config = {}) {
        // Load Mapbox config
        const mapboxConfig = typeof MapboxConfig !== 'undefined' ? MapboxConfig : {};
        
        // Mapbox configuration - now using real token
        this.mapboxToken = config.mapboxToken || mapboxConfig.accessToken || 'pk.eyJ1Ijoid2l6emdvIiwiYSI6ImNtYm50cGY0ajFpYW0ybXF0ZnY1ZG1uczMifQ.UPBxYXZeez7n4gAhmjVgSQ';
        this.mapContainerId = config.mapContainerId || 'regions-map-container';
        this.defaultCenter = config.defaultCenter || [mapboxConfig.defaultCenter?.lng || 44.3661, mapboxConfig.defaultCenter?.lat || 33.3152]; // Baghdad, Iraq [lng, lat]
        this.defaultZoom = config.defaultZoom || mapboxConfig.defaultZoom || 6;
        
        // Map instances
        this.map = null;
        this.draw = null;
        this.markers = [];
        this.polygons = {};
        
        // Region data
        this.regions = [];
        this.selectedRegion = null;
        this.filterOptions = {
            regionType: null, // PROVINCE, DISTRICT, NEIGHBORHOOD
            status: null, // ACTIVE, INACTIVE
            governorate: null,
            searchQuery: ''
        };
        
        // Drawing state
        this.isDrawingMode = false;
        this.currentDrawingType = 'polygon'; // 'marker' or 'polygon'
        
        // Event callbacks
        this.onRegionSelect = config.onRegionSelect || null;
        this.onRegionCreate = config.onRegionCreate || null;
        this.onRegionUpdate = config.onRegionUpdate || null;
        
        // Zoom levels for region types
        this.regionTypeZoomLevels = {
            'PROVINCE': { min: 5, max: 8 },
            'DISTRICT': { min: 8, max: 11 },
            'NEIGHBORHOOD': { min: 11, max: 15 }
        };
        
        console.log('🗺️ RegionsMapIntegration initialized');
    }
    
    /**
     * Initialize Mapbox map
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Mapbox map...');
            
            // Check if Mapbox GL is loaded
            if (typeof mapboxgl === 'undefined') {
                throw new Error('Mapbox GL JS not loaded. Please include the script tag.');
            }
            
            // Set access token
            mapboxgl.accessToken = this.mapboxToken;
            
            // Create map instance
            this.map = new mapboxgl.Map({
                container: this.mapContainerId,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: this.defaultCenter,
                zoom: this.defaultZoom,
                attributionControl: true
            });
            
            // Add navigation controls
            this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            
            // Add fullscreen control
            this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
            
            // Add scale control
            this.map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
            
            // Initialize Mapbox Draw for creating/editing regions
            this.initializeDrawingTools();
            
            // Wait for map to load
            await new Promise((resolve) => {
                this.map.on('load', () => {
                    console.log('✅ Mapbox map loaded successfully');
                    this.setupMapLayers();
                    this.setupEventListeners();
                    resolve();
                });
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error initializing Mapbox map:', error);
            throw error;
        }
    }
    
    /**
     * Initialize Mapbox Draw tools for creating/editing regions
     */
    initializeDrawingTools() {
        if (typeof MapboxDraw === 'undefined') {
            console.warn('⚠️ Mapbox Draw not loaded. Drawing tools will be disabled.');
            return;
        }
        
        this.draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon: true,
                point: true,
                trash: true
            },
            styles: this.getDrawingStyles()
        });
        
        this.map.addControl(this.draw, 'top-left');
        console.log('✅ Drawing tools initialized');
    }
    
    /**
     * Get custom drawing styles
     */
    getDrawingStyles() {
        return [
            // Polygon fill
            {
                'id': 'gl-draw-polygon-fill',
                'type': 'fill',
                'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                'paint': {
                    'fill-color': '#3bb2d0',
                    'fill-outline-color': '#3bb2d0',
                    'fill-opacity': 0.3
                }
            },
            // Polygon outline
            {
                'id': 'gl-draw-polygon-stroke-active',
                'type': 'line',
                'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                'paint': {
                    'line-color': '#3bb2d0',
                    'line-width': 2
                }
            },
            // Point
            {
                'id': 'gl-draw-point',
                'type': 'circle',
                'filter': ['all', ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
                'paint': {
                    'circle-radius': 8,
                    'circle-color': '#3bb2d0'
                }
            }
        ];
    }
    
    /**
     * Setup map layers for regions
     */
    setupMapLayers() {
        // Add source for region polygons
        this.map.addSource('regions-polygons', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });
        
        // Add polygon fill layer
        this.map.addLayer({
            id: 'regions-fill',
            type: 'fill',
            source: 'regions-polygons',
            paint: {
                'fill-color': ['get', 'fillColor'],
                'fill-opacity': 0.4
            }
        });
        
        // Add polygon outline layer
        this.map.addLayer({
            id: 'regions-outline',
            type: 'line',
            source: 'regions-polygons',
            paint: {
                'line-color': ['get', 'strokeColor'],
                'line-width': 2
            }
        });
        
        // Add polygon labels
        this.map.addLayer({
            id: 'regions-labels',
            type: 'symbol',
            source: 'regions-polygons',
            layout: {
                'text-field': ['get', 'name'],
                'text-size': 14,
                'text-offset': [0, 0],
                'text-anchor': 'center'
            },
            paint: {
                'text-color': '#000',
                'text-halo-color': '#fff',
                'text-halo-width': 2
            }
        });
        
        console.log('✅ Map layers setup complete');
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Click on polygon
        this.map.on('click', 'regions-fill', (e) => {
            if (e.features.length > 0) {
                const feature = e.features[0];
                const regionId = feature.properties.regionId;
                this.handleRegionClick(regionId);
            }
        });
        
        // Hover effect
        this.map.on('mouseenter', 'regions-fill', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });
        
        this.map.on('mouseleave', 'regions-fill', () => {
            this.map.getCanvas().style.cursor = '';
        });
        
        // Drawing events
        if (this.draw) {
            this.map.on('draw.create', (e) => this.handleDrawCreate(e));
            this.map.on('draw.update', (e) => this.handleDrawUpdate(e));
            this.map.on('draw.delete', (e) => this.handleDrawDelete(e));
        }
        
        // Zoom change for filtering
        this.map.on('zoom', () => this.handleZoomChange());
        
        console.log('✅ Event listeners setup complete');
    }
    
    /**
     * Load and display regions on the map
     */
    async loadRegions(regions) {
        try {
            console.log(`🗺️ Loading ${regions.length} regions onto map...`);
            
            this.regions = regions;
            
            // Clear existing markers and polygons
            this.clearMap();
            
            // Process each region
            const features = [];
            
            for (const region of regions) {
                // Determine if region passes current filters
                if (!this.regionPassesFilters(region)) {
                    continue;
                }
                
                // Add region based on its coordinate data
                if (region.coordinates && region.coordinates.boundaries) {
                    // Region has polygon boundaries
                    const feature = this.createPolygonFeature(region);
                    features.push(feature);
                } else if (region.gps_coordinates) {
                    // Region has only center point
                    this.addMarker(region);
                }
            }
            
            // Update polygon source
            if (this.map.getSource('regions-polygons')) {
                this.map.getSource('regions-polygons').setData({
                    type: 'FeatureCollection',
                    features: features
                });
            }
            
            // Fit map to show all regions
            if (features.length > 0 || this.markers.length > 0) {
                this.fitMapToRegions();
            }
            
            console.log(`✅ Loaded ${features.length} polygons and ${this.markers.length} markers`);
            
        } catch (error) {
            console.error('❌ Error loading regions:', error);
        }
    }
    
    /**
     * Create a GeoJSON polygon feature from region data
     */
    createPolygonFeature(region) {
        const boundaries = region.coordinates.boundaries;
        
        // Convert boundaries to GeoJSON format [lng, lat]
        const coordinates = [boundaries.map(point => [point.lng, point.lat])];
        
        // Close the polygon if not already closed
        if (coordinates[0][0] !== coordinates[0][coordinates[0].length - 1]) {
            coordinates[0].push(coordinates[0][0]);
        }
        
        // Determine color based on status
        const isActive = region.status === 'ACTIVE';
        const fillColor = isActive ? '#4CAF50' : '#F44336'; // Green : Red
        const strokeColor = isActive ? '#2E7D32' : '#C62828';
        
        return {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: coordinates
            },
            properties: {
                regionId: region.regionId,
                name: region.regionName,
                nameArabic: region.regionNameArabic,
                regionType: region.region_type,
                status: region.status,
                fillColor: fillColor,
                strokeColor: strokeColor,
                governorate: region.governorate
            }
        };
    }
    
    /**
     * Add a marker for a region (when no polygon boundaries exist)
     */
    addMarker(region) {
        if (!region.gps_coordinates) return;
        
        const { lat, lng } = region.gps_coordinates;
        const isActive = region.status === 'ACTIVE';
        
        // Create custom marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'region-marker';
        markerEl.style.width = '30px';
        markerEl.style.height = '30px';
        markerEl.style.borderRadius = '50%';
        markerEl.style.backgroundColor = isActive ? '#4CAF50' : '#F44336';
        markerEl.style.border = '3px solid white';
        markerEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        markerEl.style.cursor = 'pointer';
        markerEl.dataset.regionId = region.regionId;
        
        // Add icon based on region type
        const icon = this.getRegionTypeIcon(region.region_type);
        markerEl.innerHTML = `<i class="fas ${icon}" style="color: white; font-size: 12px; line-height: 24px;"></i>`;
        
        // Create marker
        const marker = new mapboxgl.Marker({
            element: markerEl,
            anchor: 'center'
        })
            .setLngLat([lng, lat])
            .addTo(this.map);
        
        // Add popup
        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(this.createMarkerPopupHTML(region));
        
        marker.setPopup(popup);
        
        // Click handler
        markerEl.addEventListener('click', () => {
            this.handleRegionClick(region.regionId);
        });
        
        this.markers.push({ marker, region });
    }
    
    /**
     * Get icon for region type
     */
    getRegionTypeIcon(regionType) {
        switch (regionType) {
            case 'PROVINCE':
                return 'fa-city';
            case 'DISTRICT':
                return 'fa-building';
            case 'NEIGHBORHOOD':
                return 'fa-home';
            default:
                return 'fa-map-marker-alt';
        }
    }
    
    /**
     * Create HTML for marker popup
     */
    createMarkerPopupHTML(region) {
        const statusBadge = region.status === 'ACTIVE' 
            ? '<span style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">ACTIVE</span>'
            : '<span style="background: #F44336; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">INACTIVE</span>';
        
        return `
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
                    ${region.regionName}
                </h3>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
                    ${region.regionNameArabic}
                </p>
                <div style="margin-bottom: 8px;">
                    ${statusBadge}
                    <span style="background: #2196F3; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 4px;">
                        ${region.region_type}
                    </span>
                </div>
                <p style="margin: 0; font-size: 12px; color: #666;">
                    <i class="fas fa-map-marker-alt"></i> ${region.governorate}
                </p>
            </div>
        `;
    }
    
    /**
     * Check if region passes current filters
     */
    regionPassesFilters(region) {
        // Region type filter
        if (this.filterOptions.regionType && region.region_type !== this.filterOptions.regionType) {
            return false;
        }
        
        // Status filter
        if (this.filterOptions.status && region.status !== this.filterOptions.status) {
            return false;
        }
        
        // Governorate filter
        if (this.filterOptions.governorate && region.governorate !== this.filterOptions.governorate) {
            return false;
        }
        
        // Search query
        if (this.filterOptions.searchQuery) {
            const query = this.filterOptions.searchQuery.toLowerCase();
            const matchesName = region.regionName.toLowerCase().includes(query);
            const matchesArabic = region.regionNameArabic.includes(query);
            const matchesId = region.regionId.toLowerCase().includes(query);
            
            if (!matchesName && !matchesArabic && !matchesId) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Apply filters and reload regions
     */
    applyFilters(filters) {
        this.filterOptions = { ...this.filterOptions, ...filters };
        this.loadRegions(this.regions);
    }
    
    /**
     * Handle zoom change for region type filtering
     */
    handleZoomChange() {
        const zoom = this.map.getZoom();
        console.log(`🔍 Zoom level: ${zoom.toFixed(2)}`);
        
        // You can implement automatic filtering based on zoom level here
        // For example, show only provinces at low zoom, districts at medium, etc.
    }
    
    /**
     * Zoom to specific region type
     */
    zoomToRegionType(regionType) {
        const zoomConfig = this.regionTypeZoomLevels[regionType];
        if (zoomConfig) {
            const targetZoom = (zoomConfig.min + zoomConfig.max) / 2;
            this.map.flyTo({
                zoom: targetZoom,
                duration: 1000
            });
        }
    }
    
    /**
     * Fit map to show all visible regions
     */
    fitMapToRegions() {
        const bounds = new mapboxgl.LngLatBounds();
        
        // Add polygon bounds
        const source = this.map.getSource('regions-polygons');
        if (source && source._data && source._data.features) {
            source._data.features.forEach(feature => {
                feature.geometry.coordinates[0].forEach(coord => {
                    bounds.extend(coord);
                });
            });
        }
        
        // Add marker bounds
        this.markers.forEach(({ region }) => {
            if (region.gps_coordinates) {
                bounds.extend([region.gps_coordinates.lng, region.gps_coordinates.lat]);
            }
        });
        
        // Fit map to bounds
        if (!bounds.isEmpty()) {
            this.map.fitBounds(bounds, {
                padding: 50,
                duration: 1000
            });
        }
    }
    
    /**
     * Clear all markers and polygons from map
     */
    clearMap() {
        // Remove markers
        this.markers.forEach(({ marker }) => marker.remove());
        this.markers = [];
        
        // Clear polygon source
        if (this.map.getSource('regions-polygons')) {
            this.map.getSource('regions-polygons').setData({
                type: 'FeatureCollection',
                features: []
            });
        }
    }
    
    /**
     * Handle region click
     */
    handleRegionClick(regionId) {
        console.log(`🖱️ Region clicked: ${regionId}`);
        
        const region = this.regions.find(r => r.regionId === regionId);
        if (region) {
            this.selectedRegion = region;
            
            // Highlight selected region
            this.highlightRegion(regionId);
            
            // Trigger callback
            if (this.onRegionSelect) {
                this.onRegionSelect(region);
            }
        }
    }
    
    /**
     * Highlight a specific region
     */
    highlightRegion(regionId) {
        // Update polygon layer to highlight selected
        if (this.map.getLayer('regions-fill')) {
            this.map.setPaintProperty('regions-fill', 'fill-opacity', [
                'case',
                ['==', ['get', 'regionId'], regionId],
                0.8, // Highlighted
                0.4  // Normal
            ]);
        }
    }
    
    /**
     * Enable drawing mode for creating new region
     */
    enableDrawingMode(type = 'polygon') {
        if (!this.draw) {
            console.error('❌ Drawing tools not available');
            return;
        }
        
        this.isDrawingMode = true;
        this.currentDrawingType = type;
        
        // Activate drawing mode
        if (type === 'polygon') {
            this.draw.changeMode('draw_polygon');
        } else {
            this.draw.changeMode('draw_point');
        }
        
        console.log(`✏️ Drawing mode enabled: ${type}`);
    }
    
    /**
     * Disable drawing mode
     */
    disableDrawingMode() {
        if (!this.draw) return;
        
        this.draw.changeMode('simple_select');
        this.isDrawingMode = false;
        console.log('🛑 Drawing mode disabled');
    }
    
    /**
     * Handle draw create event
     */
    handleDrawCreate(e) {
        console.log('✏️ Draw created:', e);
        
        const features = e.features;
        if (features.length === 0) return;
        
        const feature = features[0];
        const geoJSON = this.convertToGeoJSON(feature);
        
        // Trigger callback
        if (this.onRegionCreate) {
            this.onRegionCreate(geoJSON);
        }
        
        // Disable drawing mode after creation
        this.disableDrawingMode();
    }
    
    /**
     * Handle draw update event
     */
    handleDrawUpdate(e) {
        console.log('✏️ Draw updated:', e);
        
        const features = e.features;
        if (features.length === 0) return;
        
        const feature = features[0];
        const geoJSON = this.convertToGeoJSON(feature);
        
        // Trigger callback
        if (this.onRegionUpdate) {
            this.onRegionUpdate(geoJSON);
        }
    }
    
    /**
     * Handle draw delete event
     */
    handleDrawDelete(e) {
        console.log('🗑️ Draw deleted:', e);
    }
    
    /**
     * Convert Mapbox feature to GeoJSON format
     */
    convertToGeoJSON(feature) {
        const geometry = feature.geometry;
        
        if (geometry.type === 'Polygon') {
            // Extract boundaries
            const boundaries = geometry.coordinates[0].map(coord => ({
                lng: coord[0],
                lat: coord[1]
            }));
            
            // Calculate center
            const center = this.calculatePolygonCenter(boundaries);
            
            return {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: geometry.coordinates
                },
                properties: {
                    center: center,
                    boundaries: boundaries,
                    gps_coordinates: center
                }
            };
        } else if (geometry.type === 'Point') {
            const [lng, lat] = geometry.coordinates;
            
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: geometry.coordinates
                },
                properties: {
                    gps_coordinates: { lat, lng }
                }
            };
        }
        
        return feature;
    }
    
    /**
     * Calculate center point of a polygon
     */
    calculatePolygonCenter(boundaries) {
        let sumLat = 0;
        let sumLng = 0;
        
        boundaries.forEach(point => {
            sumLat += point.lat;
            sumLng += point.lng;
        });
        
        return {
            lat: sumLat / boundaries.length,
            lng: sumLng / boundaries.length
        };
    }
    
    /**
     * Edit existing region on map
     */
    editRegion(region) {
        if (!this.draw) {
            console.error('❌ Drawing tools not available');
            return;
        }
        
        console.log(`✏️ Editing region: ${region.regionId}`);
        
        // Clear current drawings
        this.draw.deleteAll();
        
        // Add region to draw layer
        if (region.coordinates && region.coordinates.boundaries) {
            const coordinates = region.coordinates.boundaries.map(p => [p.lng, p.lat]);
            coordinates.push(coordinates[0]); // Close polygon
            
            const feature = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [coordinates]
                },
                properties: {
                    regionId: region.regionId
                }
            };
            
            const featureIds = this.draw.add(feature);
            this.draw.changeMode('direct_select', { featureId: featureIds[0] });
            
        } else if (region.gps_coordinates) {
            const feature = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [region.gps_coordinates.lng, region.gps_coordinates.lat]
                },
                properties: {
                    regionId: region.regionId
                }
            };
            
            const featureIds = this.draw.add(feature);
            this.draw.changeMode('direct_select', { featureId: featureIds[0] });
        }
        
        // Zoom to region
        this.zoomToRegion(region);
    }
    
    /**
     * Zoom to specific region
     */
    zoomToRegion(region) {
        if (region.coordinates && region.coordinates.boundaries) {
            const bounds = new mapboxgl.LngLatBounds();
            region.coordinates.boundaries.forEach(point => {
                bounds.extend([point.lng, point.lat]);
            });
            
            this.map.fitBounds(bounds, {
                padding: 100,
                duration: 1000
            });
        } else if (region.gps_coordinates) {
            this.map.flyTo({
                center: [region.gps_coordinates.lng, region.gps_coordinates.lat],
                zoom: 13,
                duration: 1000
            });
        }
    }
    
    /**
     * Get current drawing data
     */
    getCurrentDrawing() {
        if (!this.draw) return null;
        
        const data = this.draw.getAll();
        if (data.features.length === 0) return null;
        
        return this.convertToGeoJSON(data.features[0]);
    }
    
    /**
     * Destroy map instance
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        console.log('🗑️ Map instance destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RegionsMapIntegration;
}
