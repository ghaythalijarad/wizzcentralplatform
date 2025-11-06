# Regions Generation Scripts

**Mapbox-Powered Iraq Regions System**

---

## 🎯 Overview

These scripts automatically generate a comprehensive hierarchical dataset of ALL Iraqi regions using the Mapbox Geocoding API.

**What You Get:**
- 1 Country (Iraq)
- 18 Governorates (All Iraqi governorates)
- 70+ Districts (Major districts in each governorate)
- 100+ Neighborhoods (Major neighborhoods)

**All with accurate GPS coordinates from Mapbox!**

---

## 🔑 Setup

### 1. Get Mapbox Token

1. Go to: https://account.mapbox.com/access-tokens/
2. Create a new token or copy your default token
3. Copy `.env.mapbox.example` to `.env.mapbox`
4. Add your token:
   ```
   MAPBOX_ACCESS_TOKEN=pk.ey...your_token_here
   ```

### 2. Install Dependencies

```bash
npm install node-fetch dotenv
```

---

## 🚀 Usage

### Generate All Iraq Regions:

```bash
node scripts/create-all-iraq-regions.js
```

This will:
1. Geocode Iraq (country)
2. Geocode all 18 governorates
3. Geocode 70+ districts
4. Geocode 100+ neighborhoods
5. Save to `data/comprehensive-iraq-regions.json`

**Time:** ~5-10 minutes (due to Mapbox rate limits)

---

## 📊 Output Format

```json
{
  "id": "najaf_central",
  "name": "Najaf Central",
  "name_ar": "مركز النجف",
  "level": "district",
  "parent_id": "najaf",
  "governorate_id": "najaf",
  "coordinates": {
    "lat": 31.9996,
    "lng": 44.3267,
    "radius": 15000
  },
  "is_active": true,
  "geocoded_by": "mapbox",
  "geocoding_confidence": 0.95
}
```

---

## 🛠️ Customization

### Add More Districts:

Edit `scripts/create-all-iraq-regions.js`:

```javascript
const DISTRICTS = {
    'Baghdad': ['Al-Karkh', 'Al-Rusafa', 'Your New District'],
    // ...
};
```

### Add More Neighborhoods:

```javascript
const NEIGHBORHOODS = {
    'Baghdad': {
        'Al-Karkh': ['Kadhimiya', 'Mansour', 'Your New Neighborhood']
    }
};
```

Then run: `node scripts/create-all-iraq-regions.js`

---

## 📁 Files

| File | Purpose |
|------|---------|
| `geocode-helper.js` | Mapbox API wrapper |
| `create-all-iraq-regions.js` | Main generator |
| `../data/comprehensive-iraq-regions.json` | Generated output |

---

## ✅ Next Steps

After generating regions:

1. **Test Locally:**
   ```bash
   npm run local
   open http://localhost:3000/pages/regions.html
   ```

2. **Upload to AWS:**
   ```bash
   node scripts/upload-to-dynamodb.js
   ```

3. **Deploy:**
   ```bash
   amplify push && amplify publish
   ```

---

## 🐛 Troubleshooting

**Problem:** `MAPBOX_ACCESS_TOKEN not found`  
**Solution:** Create `.env.mapbox` file with your token

**Problem:** Geocoding fails for some locations  
**Solution:** Check Mapbox API status, or adjust location names

**Problem:** Rate limit errors  
**Solution:** Script has built-in 100ms delays. If issues persist, increase delay in `geocode-helper.js`

---

**Happy Geocoding! 🗺️**
