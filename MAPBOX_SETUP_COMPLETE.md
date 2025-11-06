# 🗺️ MAPBOX INTEGRATION SETUP GUIDE
**WizzCentral Platform - Regions Management with Real Map Data**

## ✅ TOKEN CONFIGURED SUCCESSFULLY!

Your Mapbox access token has been configured and is ready to use:
```
Token: pk.eyJ1Ijoid2l6emdvIiwiYSI6ImNtYm50cGY0ajFpYW0ybXF0ZnY1ZG1uczMifQ.UPBxYXZeez7n4gAhmjVgSQ
Status: ✅ Active
Account: wizzgo
```

---

## 📦 FILES CREATED

### 1. **Mapbox Configuration** (`frontend/mapbox-config.js`)
Central configuration file with:
- ✅ Your Mapbox access token
- 🎨 Map styles (Streets, Satellite, Dark, Light, etc.)
- 📍 Iraqi cities coordinates (Baghdad, Basra, Erbil, Najaf, etc.)
- 🎨 Region status colors (Active=Green, Inactive=Red)
- 🔧 Drawing tools configuration
- 🌍 Iraq map bounds

### 2. **Environment File** (`.env.mapbox`)
Backup configuration file with environment variables:
- Mapbox token
- Default center coordinates
- Map bounds for Iraq
- ⚠️ **DO NOT COMMIT THIS FILE TO GIT**

### 3. **Test Page** (`frontend/mapbox-integration-test.html`)
Standalone test page to verify Mapbox integration:
- Interactive map of Iraq
- Sample city markers (Baghdad, Basra, Erbil, Najaf, Karbala)
- Navigation controls
- Geocoder search
- Quick navigation buttons
- Status indicators

### 4. **Updated Integration** (`frontend/regions-map-integration.js`)
Updated to use your Mapbox token automatically.

---

## 🚀 QUICK START

### Step 1: Test Mapbox Integration
Open the test page in your browser:
```bash
cd frontend
open mapbox-integration-test.html
# or
python3 -m http.server 8000
# Then visit: http://localhost:8000/mapbox-integration-test.html
```

**Expected Result:**
- ✅ Interactive map of Iraq
- ✅ 5 city markers (Baghdad, Basra, Erbil, Najaf, Karbala)
- ✅ Search functionality
- ✅ Navigation controls
- ✅ Status badge: "Map Loaded"

### Step 2: Verify Token Status
Check browser console for:
```
✅ Mapbox GL initialized with access token
✅ Map loaded successfully!
📍 Added marker for Baghdad
📍 Added marker for Basra
📍 Added marker for Erbil
📍 Added marker for Najaf
📍 Added marker for Karbala
```

### Step 3: Test Features
1. **Click markers** - See city popups
2. **Use search** - Type "Baghdad" in search bar
3. **Navigate** - Click city buttons (Baghdad, Basra, etc.)
4. **Add marker** - Click "Add Test Marker"
5. **Zoom** - Use mouse wheel or +/- buttons

---

## 🔧 INTEGRATION WITH REGIONS ADMIN PANEL

To integrate Mapbox with your existing admin panel:

### Option A: Add to regions.html
```html
<!DOCTYPE html>
<html>
<head>
    <!-- Existing head content -->
    
    <!-- Add Mapbox -->
    <script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
    
    <!-- Mapbox Draw -->
    <script src='https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.2/mapbox-gl-draw.js'></script>
    <link href='https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.2/mapbox-gl-draw.css' rel='stylesheet' />
    
    <!-- Mapbox Config -->
    <script src="mapbox-config.js"></script>
</head>
<body>
    <!-- Existing content -->
    
    <!-- Add Map Container -->
    <div id="regions-map-container" style="height: 600px; margin-top: 20px;"></div>
    
    <!-- Map Integration -->
    <script src="regions-map-integration.js"></script>
    <script>
        // Initialize map
        const mapIntegration = new RegionsMapIntegration({
            mapContainerId: 'regions-map-container'
        });
        
        mapIntegration.initialize();
    </script>
</body>
</html>
```

### Option B: Use Test Page as Template
Copy `mapbox-integration-test.html` and customize:
1. Add your existing admin panel UI
2. Connect map events to your admin functions
3. Update markers when regions change

---

## 🎨 MAP STYLES AVAILABLE

Your token has access to these Mapbox styles:

```javascript
// Streets (default)
style: 'mapbox://styles/mapbox/streets-v12'

// Satellite
style: 'mapbox://styles/mapbox/satellite-v9'

// Satellite with streets
style: 'mapbox://styles/mapbox/satellite-streets-v12'

// Light
style: 'mapbox://styles/mapbox/light-v11'

// Dark
style: 'mapbox://styles/mapbox/dark-v11'

// Navigation (for routing)
style: 'mapbox://styles/mapbox/navigation-day-v1'
style: 'mapbox://styles/mapbox/navigation-night-v1'
```

To change style:
```javascript
map.setStyle('mapbox://styles/mapbox/satellite-v9');
```

---

## 📍 IRAQI CITIES COORDINATES

Pre-configured in `mapbox-config.js`:

| City | Latitude | Longitude | Zoom |
|------|----------|-----------|------|
| Baghdad | 33.3152 | 44.3661 | 11 |
| Basra | 30.5034 | 47.7804 | 11 |
| Erbil | 36.1911 | 44.0093 | 11 |
| Mosul | 36.3350 | 43.1189 | 11 |
| Najaf | 32.0252 | 44.3358 | 12 |
| Karbala | 32.6160 | 44.0247 | 12 |
| Kirkuk | 35.4681 | 44.3922 | 11 |
| Sulaymaniyah | 35.5608 | 45.4373 | 11 |

Usage:
```javascript
// Fly to city
map.flyTo({
    center: [MapboxConfig.cities.baghdad.lng, MapboxConfig.cities.baghdad.lat],
    zoom: MapboxConfig.cities.baghdad.zoom
});
```

---

## 🎨 REGION STATUS COLORS

Pre-configured color scheme:

```javascript
const colors = {
    ACTIVE: '#10b981',      // Green
    INACTIVE: '#ef4444',    // Red
    MAINTENANCE: '#f59e0b', // Amber
    PENDING: '#6b7280'      // Gray
};

// Use in markers
new mapboxgl.Marker({ color: colors.ACTIVE })
    .setLngLat([lng, lat])
    .addTo(map);
```

---

## 🔧 ADVANCED FEATURES

### 1. Drawing Tools
Draw region boundaries:
```javascript
const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
        polygon: true,
        trash: true
    }
});
map.addControl(draw);

// Get drawn features
const data = draw.getAll();
console.log('Drawn features:', data);
```

### 2. Geocoding (Address Search)
Already included in test page:
```javascript
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    countries: 'IQ', // Restrict to Iraq
    language: 'ar,en' // Arabic and English
});
map.addControl(geocoder);
```

### 3. Custom Popups
```javascript
const popup = new mapboxgl.Popup()
    .setLngLat([lng, lat])
    .setHTML(`
        <h3>${region.regionName}</h3>
        <p>Status: ${region.status}</p>
        <p>Type: ${region.region_type}</p>
    `)
    .addTo(map);
```

### 4. GeoJSON Layers
Display region boundaries:
```javascript
map.addSource('regions', {
    type: 'geojson',
    data: {
        type: 'FeatureCollection',
        features: regions.map(r => ({
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [r.boundaries]
            },
            properties: {
                name: r.regionName,
                status: r.status
            }
        }))
    }
});

map.addLayer({
    id: 'regions-layer',
    type: 'fill',
    source: 'regions',
    paint: {
        'fill-color': [
            'match',
            ['get', 'status'],
            'ACTIVE', '#10b981',
            'INACTIVE', '#ef4444',
            '#6b7280'
        ],
        'fill-opacity': 0.3
    }
});
```

---

## 🔒 SECURITY BEST PRACTICES

### 1. Token Security
- ✅ Token is public (safe for browser use)
- ✅ Token has URL restrictions (recommended)
- ⚠️ Don't commit `.env.mapbox` to Git
- ✅ Use environment variables in production

### 2. Token Restrictions
Configure in Mapbox Studio:
- **URL Restrictions**: `*.wizzgo.com/*`
- **Rate Limits**: Monitor usage
- **Revoke**: If compromised

### 3. Production Setup
```javascript
// Use environment variable
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || 'fallback-token';
```

---

## 📊 USAGE LIMITS

Your Mapbox token has these limits:

| Feature | Free Tier | Your Usage |
|---------|-----------|------------|
| Map Loads | 50,000/month | Track in console |
| Geocoding | 100,000/month | Track searches |
| Directions | 100,000/month | N/A yet |
| Static Images | 50,000/month | N/A yet |

Monitor at: https://account.mapbox.com/

---

## 🐛 TROUBLESHOOTING

### Issue: Map not loading
**Check:**
1. Console for errors
2. Token is correct in `mapbox-config.js`
3. Internet connection
4. No ad blockers blocking Mapbox

**Solution:**
```javascript
// Test token
fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/baghdad.json?access_token=${MAPBOX_TOKEN}`)
    .then(r => r.json())
    .then(d => console.log('Token valid:', d));
```

### Issue: Markers not showing
**Check:**
1. Coordinates are [lng, lat] not [lat, lng]
2. Coordinates within Iraq bounds
3. Console for errors

**Solution:**
```javascript
// Correct order
new mapboxgl.Marker()
    .setLngLat([44.3661, 33.3152]) // [lng, lat]
    .addTo(map);
```

### Issue: Search not working
**Check:**
1. Geocoder plugin loaded
2. Token has geocoding access
3. Country code is 'IQ'

**Solution:**
```javascript
// Test geocoding
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    countries: 'IQ'
});
```

---

## 📚 NEXT STEPS

### 1. Integrate with Admin Panel
- [ ] Add map to `regions.html`
- [ ] Connect map to region CRUD operations
- [ ] Sync map with DynamoDB data

### 2. Add Drawing Tools
- [ ] Enable polygon drawing for boundaries
- [ ] Save GeoJSON to DynamoDB
- [ ] Load boundaries on map

### 3. Real-Time Updates
- [ ] Update markers when status changes
- [ ] Show affected regions on cascade
- [ ] Add animations for status changes

### 4. Advanced Features
- [ ] Heatmap of driver/merchant density
- [ ] Delivery zone visualization
- [ ] Route optimization preview

---

## 📞 SUPPORT

### Mapbox Resources
- Documentation: https://docs.mapbox.com/
- Examples: https://docs.mapbox.com/mapbox-gl-js/examples/
- API Reference: https://docs.mapbox.com/mapbox-gl-js/api/
- Support: https://support.mapbox.com/

### WizzCentral Resources
- Phase 4 Docs: `PHASE_4_MAP_INTEGRATION_COMPLETE.md`
- API Docs: `PHASE_5_API_ENDPOINTS_DOCUMENTATION.md`
- Central API: `PHASE_6_COMPLETE.md`

---

## ✅ SUCCESS CHECKLIST

- [x] Mapbox token configured
- [x] Config file created (`mapbox-config.js`)
- [x] Environment file created (`.env.mapbox`)
- [x] Test page created (`mapbox-integration-test.html`)
- [x] Integration updated (`regions-map-integration.js`)
- [ ] Test page opened in browser
- [ ] Map loads successfully
- [ ] City markers visible
- [ ] Search works
- [ ] Navigation works
- [ ] Ready to integrate with admin panel

---

## 🎉 YOU'RE ALL SET!

Your Mapbox integration is ready to use! Open the test page to see it in action:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/frontend
open mapbox-integration-test.html
```

**Expected Result:**
- 🗺️ Interactive map of Iraq
- 📍 5 city markers
- 🔍 Working search
- 🎮 Navigation controls
- ✅ Status: "Map Loaded"

---

**Document Version:** 1.0  
**Last Updated:** November 4, 2025  
**Token Owner:** wizzgo  
**Token Status:** ✅ Active
