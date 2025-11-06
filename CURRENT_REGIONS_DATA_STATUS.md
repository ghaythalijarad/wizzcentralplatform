# Current Regions Data Status

**Date:** November 5, 2025  
**Status:** ⚠️ MIXED - File-based data currently active, DynamoDB ready but not in use

---

## 📊 CURRENT DATA SOURCE

### ✅ Active: File-Based Storage
**Location:** `/data/regions.json`

**Current Data:**
- **1 Country:** Iraq (العراق)
- **10 Governorates:**
  - ✅ Baghdad (بغداد) - ACTIVE
  - ✅ Basra (البصرة) - ACTIVE
  - ✅ Erbil (أربيل) - ACTIVE
  - ✅ Najaf (النجف) - ACTIVE
  - ✅ Mosul (الموصل) - ACTIVE
  - ✅ Karbala (كربلاء) - ACTIVE
  - ✅ Sulaymaniyah (السليمانية) - ACTIVE
  - ✅ Dohuk (دهوك) - ACTIVE
  - ✅ Anbar (الأنبار) - ACTIVE
  
- **6 Districts:**
  - ✅ Baghdad Central (بغداد المركز) - ACTIVE
  - ✅ Baghdad Karkh (بغداد الكرخ) - ACTIVE
  - ❌ Basra Downtown (البصرة وسط المدينة) - INACTIVE
  - ✅ Erbil Central (أربيل المركز) - ACTIVE
  - ✅ Najaf Old City (النجف المدينة القديمة) - ACTIVE

**Total Regions:** ~17 regions (1 country + 10 governorates + 6 districts)

---

## 🔄 DUPLICATE API ENDPOINTS ISSUE

### ⚠️ Problem: Two Sets of Endpoints Defined

#### Set 1: Lines 108-160 (File-Based - Currently Active)
```javascript
app.get('/api/regions', async (req, res) => {
    const regions = await readRegionsFromFile(); // Uses data/regions.json
    res.json({ success: true, regions: regions });
});
```

**Features:**
- Simple file reading from `data/regions.json`
- No filtering capability
- Basic CRUD operations
- **This is what's currently responding to API calls**

#### Set 2: Lines 2272-2440 (Advanced - Shadowed)
```javascript
app.get('/api/regions', async (req, res) => {
    let regions = [...comprehensiveIraqiRegions]; // Uses in-memory array
    // Advanced filtering, pagination, search
});
```

**Features:**
- Advanced filtering (level, parent_id, active status)
- Pagination support
- Search functionality
- Comprehensive statistics
- **This code exists but is NEVER executed** (overshadowed by first definition)

---

## 🗄️ DynamoDB TABLE STATUS

### Table Name: `WizzCentral_Regions`

**Status:** ❓ **Unknown - Needs Verification**

**Designed Schema:**
```javascript
{
  regionId: "baghdad",           // Primary Key (HASH)
  name: "Baghdad",
  name_ar: "بغداد",
  level: "governorate",          // country/governorate/district
  parent_id: "iraq",
  is_active: "true",             // String: "true" or "false"
  coordinates: { lat, lng },
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp",
  metadata: { population, area_km2, capital }
}
```

**Global Secondary Indexes:**
1. **LevelIndex** - Query by level (country/governorate/district)
2. **ParentIndex** - Query districts by governorate
3. **ActiveIndex** - Query active/inactive regions

**Prepared Data:** All 18 Iraqi governorates + sample districts

**Governorates to be loaded:**
1. Baghdad (بغداد)
2. Basra (البصرة)
3. Najaf (النجف)
4. Erbil (أربيل)
5. Nineveh/Mosul (نينوى)
6. Sulaymaniyah (السليمانية)
7. Kirkuk (كركوك)
8. Diyala (ديالى)
9. Anbar (الأنبار)
10. Karbala (كربلاء)
11. Babil (بابل)
12. Wasit (واسط)
13. Salah ad-Din (صلاح الدين)
14. Dhi Qar (ذي قار)
15. Maysan (ميسان)
16. Muthanna (المثنى)
17. Qadisiyyah (القادسية)
18. Dohuk (دهوك)

---

## 🎯 WHAT NEEDS TO BE DONE

### Step 1: Verify DynamoDB Table Exists
```bash
export AWS_PAGER="" AWS_REGION=us-east-1 AWS_PROFILE=wizz-drivers-ghayth-dev
aws dynamodb describe-table --table-name WizzCentral_Regions
```

### Step 2: Create Table if Needed
```bash
cd backend
node create-regions-table.js
```

### Step 3: Remove Duplicate API Endpoints
**Remove lines 2272-2440** from `local-dev-server.js` (the shadowed duplicate code)

### Step 4: Replace File-Based API with DynamoDB
**Update lines 108-160** to use DynamoDB instead of file operations

### Step 5: Restart Server
```bash
# Kill current server
pkill -f "node local-dev-server.js"

# Start fresh
npm run local
```

### Step 6: Test Toggle UI
Open: `http://localhost:3000/pages/regions-toggle.html`

---

## 📁 FILE LOCATIONS

### Backend Files:
- **Server:** `/local-dev-server.js` (2519 lines)
  - Lines 108-160: File-based API (ACTIVE)
  - Lines 2272-2440: Duplicate advanced API (SHADOWED)
- **Table Setup:** `/backend/create-regions-table.js`
- **Data File:** `/data/regions.json` (203 lines, 17 regions)

### Frontend Files:
- **Toggle UI:** `/frontend/pages/regions-toggle.html` (NEW)
- **Main UI:** `/frontend/pages/regions.html` (1342 lines)
- **Main JS:** `/frontend/regions.js`

### Scripts:
- `setup-complete-regions.sh` - Full setup automation
- `check-regions-status.sh` - Status verification
- `quick-status.sh` - Quick check

---

## 💡 RECOMMENDATION

**Priority: HIGH - Fix Duplicate Endpoints**

1. ✅ Keep the file-based data for now (it works)
2. ⚠️ Remove duplicate API endpoints (lines 2272-2440)
3. 🔄 Migrate to DynamoDB later when tested
4. 🎯 Test toggle UI with current file-based data first

**OR**

**Go Full DynamoDB Now:**
1. Create DynamoDB table with all 18 governorates
2. Remove ALL old regions API code
3. Implement clean DynamoDB-only endpoints
4. Update toggle UI to work with DynamoDB
5. Test thoroughly

---

## 🔍 CURRENT API BEHAVIOR

```bash
# What happens when you call the API:
curl http://localhost:3000/api/regions
```

**Returns:**
- Data from `data/regions.json` (10 governorates only)
- Simple JSON format
- No pagination
- No advanced filtering
- The duplicate code at line 2272 NEVER runs

**Why the second endpoint doesn't work:**
- Express.js uses **first matching route**
- Once `app.get('/api/regions')` is defined at line 109, that handler runs
- The second definition at line 2273 is ignored

---

## ✅ RECOMMENDED NEXT STEPS

1. **Run quick status check:**
   ```bash
   bash quick-status.sh
   ```

2. **Decide on strategy:**
   - Option A: Fix duplicates, keep file-based
   - Option B: Go full DynamoDB migration

3. **Execute chosen strategy**

4. **Test toggle UI functionality**

---

**Last Updated:** November 5, 2025  
**Server:** Running on port 3000  
**Current Data:** File-based (`data/regions.json`)  
**DynamoDB:** Ready but not in use
