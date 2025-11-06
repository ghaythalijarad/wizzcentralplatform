// Google Maps Geocoding Explorer
// WhizzCentral Platform V2 - Iraqi Regions Management

let map;
let geocoder;
let markers = [];
let savedRegions = [];
let apiCallCount = 0;
let infoWindow;

// Initialize when Google Maps is loaded
function initMap() {
    console.log('🗺️ Initializing Google Maps...');
    
    // Initialize geocoder
    geocoder = new google.maps.Geocoder();
    
    // Initialize info window
    infoWindow = new google.maps.InfoWindow();
    
    // Create map centered on Iraq
    map = new google.maps.Map(document.getElementById('map'), {
        center: GoogleMapsConfig.defaultCenter,
        zoom: GoogleMapsConfig.defaultZoom,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "on" }]
            }
        ]
    });

    // Map click handler for reverse geocoding
    map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        console.log(`📍 Clicked: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        reverseGeocode(lat, lng);
    });

    // Load saved regions
    loadSavedRegions();
    updateStats();
    
    console.log('✅ Google Maps initialized successfully!');
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
        await geocodeForward(query);
        apiCallCount++;
        updateStats();
    } catch (error) {
        console.error('Search error:', error);
        alert('Failed to search location. Please try again.');
    } finally {
        hideLoading();
    }
}

// Quick search for Iraqi cities
function quickSearch(city) {
    document.getElementById('searchInput').value = city;
    searchLocation();
}

// Forward Geocoding (Place name → Coordinates)
async function geocodeForward(query) {
    console.log('🔍 Geocoding:', query);
    
    return new Promise((resolve, reject) => {
        geocoder.geocode({
            address: query,
            componentRestrictions: {
                country: 'IQ' // Restrict to Iraq
            },
            language: 'en'
        }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
                console.log(`✅ Found ${results.length} results`);
                displayResults(results);
                
                // Center map on first result
                const firstResult = results[0];
                map.setCenter(firstResult.geometry.location);
                map.setZoom(12);
                
                resolve(results);
            } else if (status === 'ZERO_RESULTS') {
                displayNoResults();
                reject(new Error('No results found'));
            } else {
                console.error('Geocoding failed:', status);
                displayError(status);
                reject(new Error(`Geocoding failed: ${status}`));
            }
        });
    });
}

// Reverse Geocoding (Coordinates → Place name)
async function reverseGeocode(lat, lng) {
    console.log('🔄 Reverse geocoding:', lat, lng);
    showLoading();
    
    const latlng = { lat, lng };
    
    geocoder.geocode({ location: latlng }, (results, status) => {
        hideLoading();
        
        if (status === 'OK' && results && results.length > 0) {
            console.log(`✅ Reverse geocoded: ${results[0].formatted_address}`);
            
            // Add marker at clicked location
            addMarker(latlng, results[0].formatted_address);
            
            // Display results
            displayResults(results);
            
            apiCallCount++;
            updateStats();
        } else {
            console.error('Reverse geocoding failed:', status);
            alert('Could not find location at these coordinates');
        }
    });
}

// Display search results
function displayResults(results) {
    const container = document.getElementById('resultsContainer');
    
    if (!results || results.length === 0) {
        displayNoResults();
        return;
    }
    
    // Clear previous markers
    clearMarkers();
    
    let html = '';
    
    results.forEach((result, index) => {
        const lat = result.geometry.location.lat();
        const lng = result.geometry.location.lng();
        const name = extractPlaceName(result);
        const nameAr = extractArabicName(result);
        const address = result.formatted_address;
        const type = result.types[0] || 'unknown';
        
        html += `
            <div class="result-item" onclick="selectResult(${index})">
                <div class="result-name">${name}</div>
                ${nameAr ? `<div class="result-name-ar">${nameAr}</div>` : ''}
                <div class="result-address">${address}</div>
                <div class="result-coords">📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
                <div class="result-meta">
                    <span class="badge">${type}</span>
                </div>
                <button class="btn-search" style="margin-top: 10px; width: 100%;" 
                        onclick="event.stopPropagation(); saveRegion(${index})">
                    💾 Save Region
                </button>
            </div>
        `;
        
        // Add marker for each result
        addMarker(result.geometry.location, name, index);
    });
    
    container.innerHTML = html;
    
    // Store results for later use
    window.currentResults = results;
}

// Display no results message
function displayNoResults() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `
        <div class="no-results">
            <div style="font-size: 48px; margin-bottom: 10px;">😕</div>
            <div>No results found</div>
            <div style="font-size: 12px; margin-top: 5px;">Try searching for Iraqi cities like Baghdad, Najaf, or Basra</div>
        </div>
    `;
}

// Display error message
function displayError(status) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `
        <div class="no-results">
            <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
            <div>Search failed: ${status}</div>
            <div style="font-size: 12px; margin-top: 5px;">Please try again</div>
        </div>
    `;
}

// Select a result from the list
function selectResult(index) {
    if (!window.currentResults || !window.currentResults[index]) return;
    
    const result = window.currentResults[index];
    const location = result.geometry.location;
    
    // Center map on selected result
    map.setCenter(location);
    map.setZoom(14);
    
    // Highlight the marker
    if (markers[index]) {
        markers[index].setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            markers[index].setAnimation(null);
        }, 2000);
    }
}

// Save a region
function saveRegion(index) {
    if (!window.currentResults || !window.currentResults[index]) return;
    
    const result = window.currentResults[index];
    const location = result.geometry.location;
    
    const region = {
        id: 'reg_' + Date.now(),
        name: extractPlaceName(result),
        nameAr: extractArabicName(result) || extractPlaceName(result),
        type: determineRegionType(result.types),
        coordinates: {
            lat: location.lat(),
            lng: location.lng()
        },
        address: result.formatted_address,
        placeId: result.place_id,
        types: result.types,
        geocoding: {
            source: 'google-maps',
            confidence: 1.0,
            timestamp: new Date().toISOString()
        },
        delivery: {
            enabled: true,
            radius: 10000, // 10km default
            minOrderValue: 10000, // 10,000 IQD
            deliveryFee: 2000 // 2,000 IQD
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Check for duplicates
    const exists = savedRegions.some(r => r.placeId === region.placeId);
    if (exists) {
        alert('This region is already saved!');
        return;
    }
    
    savedRegions.push(region);
    localStorage.setItem('savedRegions', JSON.stringify(savedRegions));
    
    displaySavedRegions();
    updateStats();
    
    // Send to API server if running
    saveToAPI(region);
    
    alert(`✅ Saved: ${region.name}`);
}

// Save region to API server
async function saveToAPI(region) {
    try {
        const response = await fetch('http://localhost:3000/api/regions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(region)
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Saved to API:', data);
        } else {
            console.warn('⚠️ API not available or save failed');
        }
    } catch (error) {
        console.warn('⚠️ API server not available:', error.message);
    }
}

// Delete a region
function deleteRegion(id) {
    if (!confirm('Are you sure you want to delete this region?')) return;
    
    savedRegions = savedRegions.filter(r => r.id !== id);
    localStorage.setItem('savedRegions', JSON.stringify(savedRegions));
    
    displaySavedRegions();
    updateStats();
    
    // Delete from API if running
    deleteFromAPI(id);
}

// Delete from API server
async function deleteFromAPI(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/regions/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            console.log('✅ Deleted from API:', id);
        }
    } catch (error) {
        console.warn('⚠️ API server not available:', error.message);
    }
}

// Display saved regions
function displaySavedRegions() {
    const container = document.getElementById('savedContainer');
    
    if (savedRegions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📍</div>
                <div>No saved regions yet</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    savedRegions.forEach(region => {
        html += `
            <div class="region-item">
                <div class="region-info">
                    <div class="region-name">${region.name}</div>
                    <div class="region-name-ar">${region.nameAr}</div>
                    <div class="region-meta">
                        <span class="badge">${region.type}</span>
                        ${region.coordinates.lat.toFixed(4)}, ${region.coordinates.lng.toFixed(4)}
                    </div>
                </div>
                <button class="btn-delete" onclick="deleteRegion('${region.id}')">Delete</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Load saved regions from localStorage
function loadSavedRegions() {
    const stored = localStorage.getItem('savedRegions');
    if (stored) {
        try {
            savedRegions = JSON.parse(stored);
            displaySavedRegions();
        } catch (error) {
            console.error('Failed to load saved regions:', error);
            savedRegions = [];
        }
    }
}

// Update statistics
function updateStats() {
    document.getElementById('statSaved').textContent = savedRegions.length;
    document.getElementById('statCalls').textContent = apiCallCount;
}

// Add marker to map
function addMarker(location, title, index) {
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        title: title,
        animation: google.maps.Animation.DROP,
        label: index !== undefined ? String(index + 1) : undefined
    });
    
    marker.addListener('click', () => {
        infoWindow.setContent(`
            <div style="padding: 10px;">
                <h3 style="margin: 0 0 5px 0;">${title}</h3>
                <p style="margin: 0; font-size: 12px; color: #666;">
                    ${location.lat().toFixed(6)}, ${location.lng().toFixed(6)}
                </p>
            </div>
        `);
        infoWindow.open(map, marker);
    });
    
    markers.push(marker);
    return marker;
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// Export regions to JSON
function exportRegions() {
    if (savedRegions.length === 0) {
        alert('No regions to export');
        return;
    }
    
    const dataStr = JSON.stringify(savedRegions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `iraqi-regions-${Date.now()}.json`;
    link.click();
    
    console.log(`📥 Exported ${savedRegions.length} regions`);
}

// Clear all data
function clearAll() {
    if (!confirm('This will delete ALL saved regions. Are you sure?')) return;
    
    savedRegions = [];
    localStorage.removeItem('savedRegions');
    clearMarkers();
    
    displaySavedRegions();
    displayNoResults();
    updateStats();
    
    alert('✅ All data cleared');
}

// Helper: Extract place name from Google Maps result
function extractPlaceName(result) {
    // Try to get the most specific name
    for (const component of result.address_components) {
        if (component.types.includes('locality') || 
            component.types.includes('administrative_area_level_1') ||
            component.types.includes('sublocality') ||
            component.types.includes('neighborhood')) {
            return component.long_name;
        }
    }
    return result.address_components[0]?.long_name || 'Unknown';
}

// Helper: Extract Arabic name (if available)
function extractArabicName(result) {
    // Google Maps doesn't always provide Arabic names in the same request
    // You might need to make a separate request with language=ar
    // For now, return null and handle it separately if needed
    return null;
}

// Helper: Determine region type from Google Maps types
function determineRegionType(types) {
    if (types.includes('country')) return 'country';
    if (types.includes('administrative_area_level_1')) return 'governorate';
    if (types.includes('locality') || types.includes('administrative_area_level_2')) return 'district';
    if (types.includes('sublocality') || types.includes('neighborhood')) return 'neighborhood';
    return 'place';
}

// Loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// Make initMap available globally
window.initMap = initMap;
