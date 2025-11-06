# WhizzCentral Regions System
**Powered by Mapbox Geocoding API**  
**Date:** November 5, 2025

---

## 🏗️ Clean Architecture

```
Iraq (Country)
├── Baghdad (Governorate)
│   ├── Al-Karkh (District)
│   │   ├── Kadhimiya (Neighborhood)
│   │   ├── Mansour (Neighborhood)
│   │   └── ...
│   └── Al-Rusafa (District)
│       ├── Sadr City (Neighborhood)
│       └── ...
├── Najaf (Governorate)
│   ├── Najaf Central (District)
│   │   ├── Old City (Neighborhood)
│   │   ├── Imam Ali Area (Neighborhood)
│   │   └── ...
│   ├── Kufa (District)
│   ├── Manathera (District)
│   └── Mishkhab (District)
├── Basra (Governorate)
│   └── ...
└── [16 more governorates...]
```

**Total: 1 Country → 18 Governorates → Districts → Neighborhoods**

---

## 📂 Essential Files Only

### **1. Data Creation**
- `create-complete-iraq-regions.js` - Creates hierarchical structure for ALL governorates

### **2. Local Development**
- `local-dev-server.js` - Express server with embedded data
- Start: `npm run local`
- URL: `http://localhost:3000`

### **3. Frontend**
- `frontend/pages/regions.html` - UI page (4-column table)
- `frontend/regions.js` - RegionsManager class (fetches & displays data)

### **4. Backend (Production)**
- `backend/regions-central-api.js` - Lambda API handler (CRUD operations)
- `backend/regions-service.js` - Database logic layer

### **5. Database Setup**
- `backend/setup-iraq-regions-dynamodb.js` - One-time upload to DynamoDB

---

## 🔄 How It Works

```
1. Create Data:
   node create-complete-iraq-regions.js
   → Generates complete-iraqi-regions.json

2. Local Testing:
   npm run local
   → Starts server with embedded data
   → Open http://localhost:3000/pages/regions.html

3. Production Deploy:
   node backend/setup-iraq-regions-dynamodb.js
   → Uploads to DynamoDB
   
   amplify push && amplify publish
   → Deploys to AWS
```

---

## 📊 Data Format

**Backend format:**
```json
{
  "id": "najaf_central",
  "name": "Najaf Central District",
  "name_ar": "قضاء مركز النجف",
  "level": "district",
  "parent_id": "najaf",
  "governorate_id": "najaf",
  "coordinates": { "lat": 31.9996, "lng": 44.3267 },
  "is_active": true
}
```

**API Response:**
```json
{
  "success": true,
  "data": [ /* array of regions */ ],
  "summary": {
    "total": 50,
    "byLevel": { "governorates": 18, "districts": 25, "neighborhoods": 6 }
  }
}
```

---

## 🎯 Key Features

✅ **Scalable** - Works for ALL 18 Iraqi governorates  
✅ **Hierarchical** - 4-level structure (Country → Gov → Dist → Neigh)  
✅ **Flexible** - Easy to add new districts/neighborhoods  
✅ **Maintainable** - Single source of truth  
✅ **Production Ready** - DynamoDB integration included

---

## 🚀 Quick Start

```bash
# 1. Create data
node create-complete-iraq-regions.js

# 2. Start local server
npm run local

# 3. Open browser
open http://localhost:3000/pages/regions.html
```

---

## 🐛 Troubleshooting

**Problem:** Page shows sample data  
**Solution:** Check browser console (F12) for errors

**Problem:** API returns empty  
**Solution:** Ensure `local-dev-server.js` has embedded regions data

**Problem:** Table doesn't load  
**Solution:** Verify `regionsTableBody` element exists in HTML

---

**That's it! Clean, simple, scalable.**
