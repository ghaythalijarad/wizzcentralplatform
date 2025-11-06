// Geocoding Explorer - Mapbox Integration
// WhizzCentral Platform V2

let map;
let draw;
let savedRegions = [];
let apiCallCount = 0;
let currentMarkers = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    loadSavedRegions();
    updateStats();
});

// Initialize Mapbox Map
function initializeMap() {
    mapboxgl.accessToken = MapboxConfig.accessToken;
    
    map = new mapboxgl.Map({
        container: 'map',
        style: MapboxConfig.style,
        center: [MapboxConfig.defaultCenter.lng, MapboxConfig.defaultCenter.lat],
        zoom: MapboxConfig.defaultZoom,
        maxBounds: [
            [MapboxConfig.bounds.southwest.lng, MapboxConfig.bounds.southwest.lat],
            [MapboxConfig.bounds.northeast.lng, MapboxConfig.bounds.northeast.lat]
        ]
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-left');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-left');

    // Add drawing tools
    draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            polygon: true,
            trash: true
        },
        defaultMode: 'simple_select'
    });
    map.addControl(draw, 'top-left');

    // Map click handler - show coordinates
    map.on('click', (e) => {
        console.log(`Clicked: ${e.lngLat.lat.toFixed(6)}, ${e.lngLat.lng.toFixed(6)}`);
        reverseGeocode(e.lngLat.lat, e.lngLat.lng);
    });

    // Draw create handler
    map.on('draw.create', updateArea);
    map.on('draw.delete', updateArea);
    map.on('draw.update', updateArea);

    console.log('✅ Map initialized successfully!');
}

// Search location
async function searchLocation() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        alert('Please enter a location to search');
        return;
    }

    showLoading();
    
    try {
        const results = await geocodeForward(query);
        displayResults(results);
        apiCallCount++;
        updateStats();
    } catch (error) {
        console.error('Search error:', error);
        showError('Failed to search location. Please try again.');
    }
}

// Forward Geocoding
async function geocodeForward(query) {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MapboxConfig.accessToken}&` +
        `country=IQ&` +
        `language=en,ar&` +
        `types=country,region,place,district,locality,neighborhood&` +
        `limit=5`;

    console.log('🌐 Geocoding:', query);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('✅ Geocoding results:', data.features.length);
    return data.features;
}

// Reverse Geocoding
async function reverseGeocode(lat, lng) {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
        `access_token=${MapboxConfig.accessToken}&` +
        `language=en,ar&` +
        `types=country,region,place,district,locality,neighborhood`;

    console.log('🌐 Reverse geocoding:', lat, lng);
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.features.length > 0) {
            displayResults(data.features);
            apiCallCount++;
            updateStats();
        }
    } catch (error) {
        console.error('Reverse geocoding error:', error);
    }
}

// Display results
function displayResults(features) {
    const container = document.getElementById('resultsContainer');
    
    if (!features || features.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">😕</div>
                <div>No results found</div>
            </div>
        `;
        return;
    }

    // Clear existing markers
    clearMarkers();

    container.innerHTML = features.map((feature, index) => {
        const [lng, lat] = feature.center;
        const placeType = feature.place_type[0];
        const relevance = (feature.relevance * 100).toFixed(0);
        
        // Get Arabic name if available
        const arabicName = feature.place_name_ar || feature.text_ar || 'N/A';
        
        // Add marker to map
        addMarker(lat, lng, feature.place_name, index);

        return `
            <div class="result-item" onclick="focusOnResult(${lat}, ${lng})">
                <div class="result-name">
                    ${feature.place_name}
                </div>
                <div style="font-size: 13px; color: #999; margin-bottom: 8px;">
                    ${arabicName}
                </div>
                <div class="result-details">
                    <div class="result-detail">
                        📍 <strong>Lat:</strong> ${lat.toFixed(6)}
                    </div>
                    <div class="result-detail">
                        📍 <strong>Lng:</strong> ${lng.toFixed(6)}
                    </div>
                    <div class="result-detail">
                        🏷️ <strong>Type:</strong> ${placeType}
                    </div>
                    <div class="result-detail">
                        ✅ <strong>Score:</strong> ${relevance}%
                    </div>
                </div>
                <div class="result-actions">
                    <button class="result-btn result-btn-save" onclick="event.stopPropagation(); saveRegion(${index}, ${JSON.stringify(feature).replace(/"/g, '&quot;')})">
                        💾 Save
                    </button>
                    <button class="result-btn result-btn-view" onclick="event.stopPropagation(); focusOnResult(${lat}, ${lng})">
                        🗺️ View
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Add marker to map
function addMarker(lat, lng, title, index) {
    const marker = new mapboxgl.Marker({
        color: '#667eea',
        scale: 0.8
    })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
            <div style="padding: 8px;">
                <strong>${title}</strong><br>
                <small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
            </div>
        `))
        .addTo(map);

    currentMarkers.push(marker);
}

// Clear markers
function clearMarkers() {
    currentMarkers.forEach(marker => marker.remove());
    currentMarkers = [];
}

// Focus on result
function focusOnResult(lat, lng) {
    map.flyTo({
        center: [lng, lat],
        zoom: 13,
        duration: 1500
    });
}

// Save region
function saveRegion(index, feature) {
    const [lng, lat] = feature.center;
    const placeType = feature.place_type[0];
    
    const region = {
        id: `region_${Date.now()}`,
        name: feature.place_name,
        nameAr: feature.place_name_ar || feature.text_ar,
        type: placeType,
        coordinates: {
            lat: lat,
            lng: lng
        },
        geocoding: {
            source: 'mapbox',
            confidence: feature.relevance,
            placeType: placeType,
            timestamp: new Date().toISOString()
        },
        delivery: {
            enabled: true,
            radius: 10000, // 10km default
            minOrderValue: 10000,
            deliveryFee: 2000
        },
        status: 'active',
        createdAt: new Date().toISOString()
    };

    savedRegions.push(region);
    saveToLocalStorage();
    displaySavedRegions();
    updateStats();
    
    // Show success message
    alert(`✅ Region "${region.name}" saved successfully!`);
}

// Display saved regions
function displaySavedRegions() {
    const container = document.getElementById('savedRegions');
    document.getElementById('savedCount').textContent = savedRegions.length;
    
    if (savedRegions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <div>No saved regions yet</div>
            </div>
        `;
        return;
    }

    container.innerHTML = savedRegions.map((region, index) => `
        <div class="saved-region-item">
            <div>
                <div class="saved-region-name">${region.name}</div>
                <div class="saved-region-type">
                    <span class="badge badge-info">${region.type}</span>
                </div>
            </div>
            <div>
                <button class="delete-btn" onclick="deleteRegion(${index})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Delete region
function deleteRegion(index) {
    if (confirm('Are you sure you want to delete this region?')) {
        savedRegions.splice(index, 1);
        saveToLocalStorage();
        displaySavedRegions();
        updateStats();
    }
}

// Quick search
function quickSearch(query) {
    document.getElementById('searchInput').value = query;
    searchLocation();
}

// Handle search keypress
function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        searchLocation();
    }
}

// Show loading
function showLoading() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <div>Searching...</div>
        </div>
    `;
}

// Show error
function showError(message) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">❌</div>
            <div>${message}</div>
        </div>
    `;
}

// Update area (for drawn polygons)
function updateArea(e) {
    const data = draw.getAll();
    if (data.features.length > 0) {
        const area = turf.area(data);
        console.log(`Area: ${(area / 1000000).toFixed(2)} km²`);
    }
}

// Update stats
function updateStats() {
    document.getElementById('totalRegions').textContent = savedRegions.length;
    document.getElementById('apiCalls').textContent = apiCallCount;
}

// Local storage
function saveToLocalStorage() {
    localStorage.setItem('whizz_saved_regions', JSON.stringify(savedRegions));
}

function loadSavedRegions() {
    const stored = localStorage.getItem('whizz_saved_regions');
    if (stored) {
        savedRegions = JSON.parse(stored);
        displaySavedRegions();
    }
}

// Export regions
function exportRegions() {
    if (savedRegions.length === 0) {
        alert('No regions to export!');
        return;
    }

    const dataStr = JSON.stringify(savedRegions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `whizz-regions-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    alert(`✅ Exported ${savedRegions.length} regions!`);
}

// Show help
function showHelp() {
    alert(`🗺️ Mapbox Geocoding Playground Help

🔍 Search:
- Enter any location in Iraq
- Use quick search buttons
- Press Enter to search

📍 Results:
- Click markers to see details
- Save regions for later use
- View on map to zoom in

💾 Saved Regions:
- All regions saved to browser
- Export to JSON file
- Delete unwanted regions

🗺️ Map:
- Click anywhere to reverse geocode
- Use drawing tools for custom boundaries
- Navigate with mouse/touch

💡 Tips:
- Search specific places for accurate results
- Save governorates, districts, and neighborhoods
- Export data regularly as backup`);
}

console.log('🚀 Geocoding Explorer loaded successfully!');
