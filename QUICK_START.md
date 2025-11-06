# 🚀 Quick Start Guide - Mapbox Geocoding Playground

## 🎯 What is this?

An interactive playground to explore and create delivery regions for WhizzCentral Platform using Mapbox's powerful Geocoding API.

---

## ⚡ Quick Start (3 steps)

### 1️⃣ Install Dependencies
```bash
cd whizzCentralPlatform
npm install
```

### 2️⃣ Start the Playground
```bash
npm run playground
```

### 3️⃣ Open Your Browser
Visit: **http://localhost:3000**

You'll be automatically redirected to the Geocoding Playground!

---

## 🎮 How to Use

### Search for Locations
1. Type a location in the search box (e.g., "Najaf, Iraq")
2. Click "Go" or press Enter
3. See real-time geocoding results with coordinates

### Quick Searches
- Click any city button for instant results:
  - Baghdad
  - Basra
  - Erbil
  - Najaf
  - Mosul
  - Karbala

### Save Regions
1. Search for a location
2. Click "💾 Save" on any result
3. Region is saved to browser storage
4. View all saved regions in the sidebar

### View on Map
1. Click "🗺️ View" on any result
2. Map automatically zooms to location
3. Marker shows exact coordinates
4. Click anywhere on map for reverse geocoding

### Draw Custom Boundaries
1. Use the polygon tool (top-left of map)
2. Click points to draw region boundary
3. Double-click to finish
4. System calculates area automatically

### Export Data
1. Click "📤 Export Data" in top-right
2. Downloads all saved regions as JSON
3. Import into DynamoDB or other systems

---

## 📊 Features

### ✅ Real-time Geocoding
- Forward geocoding (place name → coordinates)
- Reverse geocoding (coordinates → place name)
- Multi-language results (English + Arabic)
- Confidence scores for accuracy

### ✅ Interactive Map
- Powered by Mapbox GL JS
- Navigate anywhere in Iraq
- Zoom, pan, and explore
- Click for instant reverse geocoding

### ✅ Smart Region Management
- Save unlimited regions
- Auto-organize by type
- Export to JSON
- Import bulk data

### ✅ Beautiful UI
- Modern Material Design
- Responsive layout
- Real-time statistics
- Color-coded regions

---

## 🗺️ API Endpoints

The playground runs a local Express server with these endpoints:

```
GET    /api/regions          # List all regions
GET    /api/regions/:id      # Get single region
POST   /api/regions          # Create new region
PUT    /api/regions/:id      # Update region
DELETE /api/regions/:id      # Delete region
POST   /api/regions/bulk     # Bulk import
GET    /api/export           # Export all regions
GET    /health               # Health check
```

### Example: Create Region via API
```bash
curl -X POST http://localhost:3000/api/regions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Najaf Central",
    "nameAr": "مركز النجف",
    "type": "district",
    "coordinates": {
      "lat": 32.0252,
      "lng": 44.3358
    }
  }'
```

### Example: Get All Regions
```bash
curl http://localhost:3000/api/regions
```

---

## 💾 Data Storage

### Local Storage (Browser)
- All saved regions stored in browser
- Survives page refresh
- Click "Export" for backup

### File Storage (Server)
- Regions saved to `data/regions.json`
- Persistent across server restarts
- Easy to version control

### Future: DynamoDB
- Push to AWS when ready
- Full CRUD operations
- Scalable production storage

---

## 🎨 Customization

### Change Map Style
Edit `frontend/mapbox-config.js`:
```javascript
style: 'mapbox://styles/mapbox/satellite-streets-v12'
```

Available styles:
- `streets-v12` (default)
- `light-v11`
- `dark-v11`
- `satellite-v9`
- `satellite-streets-v12`
- `navigation-day-v1`

### Change Default Center
```javascript
defaultCenter: {
    lat: 32.0252,  // Najaf
    lng: 44.3358
}
```

### Add More Cities
Edit `mapbox-playground/index.html`:
```html
<button class="quick-search-btn" onclick="quickSearch('Your City, Iraq')">
    Your City
</button>
```

---

## 🐛 Troubleshooting

### Map not loading?
- Check Mapbox token in `frontend/mapbox-config.js`
- Ensure internet connection (loads tiles from Mapbox)

### Search not working?
- Open browser console (F12)
- Check for API errors
- Verify Mapbox token is valid

### Can't save regions?
- Check browser console for errors
- Ensure localStorage is enabled
- Try different browser

### Server won't start?
- Check if port 3000 is available
- Run: `lsof -i :3000` to check
- Kill process: `kill -9 <PID>`

---

## 📚 Learn More

### Mapbox Documentation
- **Geocoding API:** https://docs.mapbox.com/api/search/geocoding/
- **GL JS:** https://docs.mapbox.com/mapbox-gl-js/
- **Styling:** https://docs.mapbox.com/help/tutorials/

### Tutorials
- [Forward Geocoding](https://docs.mapbox.com/api/search/geocoding/#forward-geocoding)
- [Reverse Geocoding](https://docs.mapbox.com/api/search/geocoding/#reverse-geocoding)
- [Draw Polygons](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/)

---

## 🎯 Next Steps

1. ✅ **Explore:** Search for Iraqi locations
2. ✅ **Create:** Save your first regions
3. ✅ **Export:** Download regions as JSON
4. ✅ **Integrate:** Push to DynamoDB
5. ✅ **Scale:** Use in production apps

---

## 💡 Tips & Tricks

### Pro Tips
- **Use Arabic names** for better results in Iraq
- **Save governorates first**, then districts
- **Export regularly** as backup
- **Draw boundaries** for precise regions
- **Check confidence scores** before saving

### Search Examples
Good searches:
- ✅ "Najaf, Iraq"
- ✅ "Baghdad Al-Karkh"
- ✅ "Basra Old City"

Bad searches:
- ❌ "Iraq" (too broad)
- ❌ "Street 40" (too specific)
- ❌ "Near mosque" (ambiguous)

---

## 🤝 Need Help?

- Check browser console for errors
- Review API documentation
- Test with different locations
- Export data regularly as backup

---

**Happy Geocoding! 🗺️🚀**
