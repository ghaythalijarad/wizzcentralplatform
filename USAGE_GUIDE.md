# 🗺️ How to Use the Mapbox Geocoding Playground
**Complete Guide to Managing Iraqi Regions**

---

## 🎯 Overview

The playground is your visual tool for creating, managing, and exporting delivery regions for Iraq. Everything is done through a beautiful web interface - no coding required!

---

## 📖 Step-by-Step Guide

### 1️⃣ Search for a Location

#### Using the Search Box
1. **Type a location** in the search box (e.g., "Najaf, Iraq")
2. **Click "Go"** or press Enter
3. **View results** with GPS coordinates and details

#### Using Quick Search Buttons
Click any of the pre-configured city buttons:
- **Baghdad** - Capital city
- **Basra** - Southern port city
- **Erbil** - Kurdish capital
- **Najaf** - Holy city
- **Mosul** - Northern city
- **Karbala** - Holy city

**Example:**
```
Click "Najaf" button
  ↓
Mapbox searches "Najaf, Iraq"
  ↓
Returns results with coordinates:
  - Lat: 32.0252
  - Lng: 44.3358
  - Type: place
  - Confidence: 95%
```

---

### 2️⃣ Review Geocoding Results

Each result shows:
- **📍 Location Name** (English)
- **🌍 Arabic Name** (if available)
- **📊 Coordinates** (Latitude, Longitude)
- **🏷️ Type** (country, region, place, district, neighborhood)
- **✅ Confidence Score** (accuracy percentage)

**Result Card Example:**
```
┌────────────────────────────────┐
│ Najaf, Iraq                    │
│ النجف، العراق                  │
│                                │
│ Lat: 32.025200                 │
│ Lng: 44.335800                 │
│ Type: place                    │
│ Score: 95%                     │
│                                │
│ [💾 Save] [🗺️ View]            │
└────────────────────────────────┘
```

---

### 3️⃣ Save a Region

#### To Save:
1. **Review the result** - check coordinates and confidence score
2. **Click "💾 Save"** button
3. **Confirmation** - "Region saved successfully!" appears
4. **Auto-stored** - Region added to:
   - Browser localStorage
   - `data/regions.json` file
   - Saved Regions list (sidebar)

#### What Gets Saved:
```json
{
  "id": "region_1730822400000",
  "name": "Najaf, Iraq",
  "nameAr": "النجف، العراق",
  "type": "place",
  "coordinates": {
    "lat": 32.0252,
    "lng": 44.3358
  },
  "geocoding": {
    "source": "mapbox",
    "confidence": 0.95,
    "placeType": "place",
    "timestamp": "2025-11-05T10:30:00Z"
  },
  "delivery": {
    "enabled": true,
    "radius": 10000,
    "minOrderValue": 10000,
    "deliveryFee": 2000
  },
  "status": "active",
  "createdAt": "2025-11-05T10:30:00Z"
}
```

---

### 4️⃣ View on Map

#### Click "🗺️ View" Button:
- Map **zooms** to the location
- **Marker** appears at coordinates
- **Popup** shows details
- **Circle** shows delivery radius

#### Or Click Anywhere on Map:
- **Reverse geocoding** runs automatically
- Finds location name from coordinates
- Shows in results panel
- You can then save it

**Map Features:**
- 🔍 **Zoom** - In/Out buttons
- 🗺️ **Pan** - Drag to move
- 📍 **Markers** - Saved regions
- 🖊️ **Draw** - Custom boundaries
- ⊕ **Full Screen** - Expand view

---

### 5️⃣ Manage Saved Regions

#### View Saved Regions List
Located in the sidebar:
```
💾 Saved Regions (3)
┌──────────────────────┐
│ Baghdad              │
│ [place] [🗑️]         │
├──────────────────────┤
│ Najaf                │
│ [place] [🗑️]         │
├──────────────────────┤
│ Basra                │
│ [place] [🗑️]         │
└──────────────────────┘
```

#### Delete a Region:
1. Click the **🗑️** button
2. Confirm deletion
3. Region removed from storage

---

### 6️⃣ Export Your Data

#### Click "📤 Export Data" Button:
- **Downloads** JSON file: `whizz-regions-2025-11-05.json`
- **Contains** all saved regions
- **Format** ready for DynamoDB import

**Export File Example:**
```json
[
  {
    "id": "region_001",
    "name": "Najaf, Iraq",
    "coordinates": { "lat": 32.0252, "lng": 44.3358 },
    ...
  },
  {
    "id": "region_002",
    "name": "Baghdad, Iraq",
    "coordinates": { "lat": 33.3152, "lng": 44.3661 },
    ...
  }
]
```

---

## 🎨 Advanced Features

### 🖊️ Draw Custom Boundaries

Perfect for creating precise delivery zones!

#### Steps:
1. **Click polygon tool** (top-left of map)
2. **Click points** on map to draw boundary
3. **Double-click** to close polygon
4. **System calculates** area automatically
5. **Add metadata** (name, type, etc.)
6. **Save** the region with custom boundary

**Use Cases:**
- Specific neighborhoods
- Shopping districts
- University campuses
- Industrial zones
- Custom delivery areas

---

### 🔄 Reverse Geocoding

Turn coordinates into place names!

#### How:
1. **Click anywhere** on the map
2. **System fetches** location details
3. **Results appear** in sidebar
4. **Save** if needed

**Perfect for:**
- Unknown locations
- GPS coordinates from other sources
- Validating existing data
- Discovering new areas

---

### 📊 Real-time Statistics

Top of sidebar shows:
```
┌─────────────┬─────────────┐
│ Total       │ API Calls   │
│ Regions     │             │
│    5        │    12       │
└─────────────┴─────────────┘
```

**Tracks:**
- Total regions saved
- Mapbox API calls made
- Updates in real-time

---

## 🌍 Building Complete Iraqi Regions

### Strategy: Top-Down Approach

#### Phase 1: Governorates (18 regions)
Search and save each governorate:
```
1. Baghdad
2. Basra
3. Najaf
4. Erbil
5. Mosul (Nineveh)
6. Karbala
7. Kirkuk
8. Sulaymaniyah
9. Diyala
10. Anbar
11. Dohuk
12. Maysan
13. Wasit
14. Dhi Qar
15. Babylon
16. Salah al-Din
17. Muthanna
18. Qadisiyyah
```

#### Phase 2: Major Districts
For each governorate, search districts:
```
Example: Najaf Governorate
├── Najaf Central District
├── Kufa District
├── Manathera District
└── Mishkhab District
```

#### Phase 3: Neighborhoods
For each district, search neighborhoods:
```
Example: Najaf Central District
├── Old City (المدينة القديمة)
├── Imam Ali Area (منطقة الإمام علي)
├── Hanana (الحنانة)
├── Ghadeer (الغدير)
├── Ameer (الأمير)
└── New City (المدينة الجديدة)
```

---

## 💡 Best Practices

### ✅ Search Tips

**Good Searches:**
- ✅ "Najaf, Iraq" - City and country
- ✅ "Baghdad Al-Karkh" - District and city
- ✅ "Basra Old City" - Neighborhood and city
- ✅ "Erbil Citadel" - Landmark and city

**Bad Searches:**
- ❌ "Iraq" - Too broad
- ❌ "Street 40, House 5" - Too specific
- ❌ "Near the mosque" - Ambiguous
- ❌ "My neighborhood" - No context

### ✅ When to Save

**Save regions with:**
- ✅ Confidence score > 80%
- ✅ Clear location type
- ✅ Accurate coordinates
- ✅ Official place names

**Don't save:**
- ❌ Low confidence results
- ❌ Ambiguous locations
- ❌ Duplicate entries
- ❌ Invalid coordinates

### ✅ Data Quality

**Always check:**
- 📍 Coordinates look correct on map
- 🏷️ Type matches actual region level
- 🌍 Arabic name is included
- ✅ Confidence score is high

---

## 📤 Export & Integration

### 1. Export from Playground
```
Click "📤 Export Data"
  ↓
Downloads: whizz-regions-2025-11-05.json
```

### 2. Review Data
```bash
# Open and verify
cat whizz-regions-2025-11-05.json | jq .
```

### 3. Import to DynamoDB
```bash
# Using AWS CLI (coming soon)
aws dynamodb batch-write-item \
  --request-items file://whizz-regions-2025-11-05.json
```

### 4. Use in Apps
- **Flutter Apps** - Load from API
- **Web Dashboard** - Display on map
- **Delivery System** - Calculate zones
- **Analytics** - Track coverage

---

## 🎯 Common Workflows

### Workflow 1: Create Single Region
```
1. Search "Najaf, Iraq"
2. Review result (95% confidence)
3. Click "💾 Save"
4. Done! ✅
```

### Workflow 2: Create Region Hierarchy
```
1. Search "Najaf, Iraq" → Save (Governorate)
2. Search "Najaf Central" → Save (District)
3. Search "Najaf Old City" → Save (Neighborhood)
4. Export all → JSON file
```

### Workflow 3: Verify Coordinates
```
1. Have GPS: 32.0252, 44.3358
2. Click that location on map
3. System shows: "Najaf, Iraq"
4. Verify it's correct
5. Save if needed
```

### Workflow 4: Draw Custom Zone
```
1. Click polygon tool
2. Draw around specific area
3. System calculates area
4. Add name: "Najaf University Campus"
5. Save with boundary
```

### Workflow 5: Bulk Creation
```
1. Create multiple regions (50+)
2. Check statistics: "50 regions"
3. Click "📤 Export Data"
4. Import to database
5. Deploy to production
```

---

## 🔧 Troubleshooting

### "No results found"
**Cause:** Search too specific or misspelled  
**Fix:** Try broader search, check spelling

### "Low confidence score"
**Cause:** Location is ambiguous  
**Fix:** Add more context to search (city, country)

### "Can't save region"
**Cause:** localStorage full or disabled  
**Fix:** Export existing data, clear browser storage

### "Map not loading"
**Cause:** Internet connection or Mapbox token  
**Fix:** Check connection, verify token in config

---

## 📊 Example: Building Najaf Regions

### Step 1: Governorate
```
Search: "Najaf, Iraq"
Result: Lat 32.0252, Lng 44.3358, Type: place
Save: ✅ Najaf Governorate
```

### Step 2: Districts (4)
```
Search: "Najaf Central District"
Save: ✅ Najaf Central

Search: "Kufa, Iraq"
Save: ✅ Kufa District

Search: "Manathera, Najaf"
Save: ✅ Manathera District

Search: "Mishkhab, Najaf"
Save: ✅ Mishkhab District
```

### Step 3: Neighborhoods (Example: Central)
```
Search: "Najaf Old City"
Save: ✅ Old City

Search: "Imam Ali Area, Najaf"
Save: ✅ Imam Ali Area

Search: "Hanana, Najaf"
Save: ✅ Hanana

(Continue for 6 neighborhoods)
```

### Step 4: Export
```
Total: 1 + 4 + 6 = 11 regions
Click: "📤 Export Data"
File: najaf-regions-complete.json
```

### Step 5: Verify
```json
[
  { "name": "Najaf, Iraq", "type": "place" },
  { "name": "Najaf Central", "type": "district" },
  { "name": "Old City", "type": "neighborhood" },
  ...
]
```

---

## 🎉 You're Ready!

### Quick Recap:
1. 🔍 **Search** for locations
2. 📊 **Review** coordinates & confidence
3. 💾 **Save** regions
4. 🗺️ **View** on map
5. 📤 **Export** as JSON

### Next Steps:
- ✅ Create your first region
- ✅ Build a complete governorate
- ✅ Export and backup data
- ✅ Import to production

---

**Start creating regions now!** 🗺️✨

**The playground is your canvas - paint Iraq with delivery zones!** 🎨🚀
