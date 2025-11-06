# 💾 Data Storage Guide - Where Your Regions Get Saved

## 📍 Current Storage (Default)

### When You Click "💾 Save":

```
Your Region Data
      ↓
Browser (localStorage) ← Temporary storage
      ↓
POST /api/regions
      ↓
Express Server (regions-api/server.js)
      ↓
data/regions.json ← Permanent local file
```

**Location:** `/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/data/regions.json`

---

## 🔄 Dual Storage System (New!)

I just added **DynamoDB integration** to your playground! Now you can save to BOTH locations.

### Architecture:

```
                  ┌─────────────────────┐
                  │   Click "Save"      │
                  └──────────┬──────────┘
                             ↓
                  ┌──────────────────────┐
                  │  Express API Server  │
                  └──────────┬───────────┘
                             ↓
              ┌──────────────┴──────────────┐
              ↓                             ↓
    ┌──────────────────┐         ┌──────────────────┐
    │  Local File      │         │  DynamoDB (AWS)  │
    │  data/regions    │         │  WizzOrders-     │
    │  .json           │         │  Regions table   │
    └──────────────────┘         └──────────────────┘
         ✅ Backup                    ✅ Production
```

---

## 🚀 How to Enable DynamoDB

### Option 1: Environment Variable

```bash
# Enable DynamoDB
export USE_DYNAMODB=true
export AWS_REGION=us-east-1
export DYNAMODB_TABLE=WizzOrders-Regions-ghayth-dev

# Start playground
npm run playground
```

### Option 2: .env File

Create `.env` file:
```bash
USE_DYNAMODB=true
AWS_REGION=us-east-1
DYNAMODB_TABLE=WizzOrders-Regions-ghayth-dev
AWS_PROFILE=wizz-drivers-ghayth-dev
```

Then start:
```bash
npm run playground
```

### Option 3: One-time Command

```bash
USE_DYNAMODB=true npm run playground
```

---

## 📊 Storage Comparison

| Feature | Local File | DynamoDB |
|---------|-----------|----------|
| **Speed** | ⚡ Instant | ⚡ Fast (< 1s) |
| **Persistence** | ✅ Yes | ✅ Yes |
| **Backup** | Manual | Automatic |
| **Access** | Local only | Anywhere |
| **Production Ready** | ❌ No | ✅ Yes |
| **Cost** | Free | AWS charges |
| **Multi-user** | ❌ No | ✅ Yes |

---

## 🎯 Current Workflow

### Development (Default - File Only):
```
1. Use playground
2. Save regions → data/regions.json
3. Export to JSON
4. Manually upload to DynamoDB later
```

### Production (DynamoDB Enabled):
```
1. Use playground  
2. Save regions → BOTH file & DynamoDB
3. Data instantly available to apps
4. No manual upload needed
```

---

## 📁 Where Files Are Stored

### Local File Storage:
```bash
# Main data file
/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/data/regions.json

# View your data
cat data/regions.json | jq .

# Check size
du -h data/regions.json
```

### Browser Storage:
```javascript
// Open browser console (Cmd+Option+J)
localStorage.getItem('whizz_saved_regions')

// Clear browser storage
localStorage.clear()
```

### DynamoDB Table:
```bash
# Table name
WizzOrders-Regions-ghayth-dev

# Check via AWS CLI
aws dynamodb scan \
  --table-name WizzOrders-Regions-ghayth-dev \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1
```

---

## 🔍 Check Your Data

### Method 1: View JSON File
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
cat data/regions.json
```

### Method 2: API Endpoint
```bash
# Get all regions
curl http://localhost:3000/api/regions

# Get specific region
curl http://localhost:3000/api/regions/region_1234567890
```

### Method 3: Browser Console
```javascript
// Open console in playground
fetch('/api/regions')
  .then(r => r.json())
  .then(console.log)
```

### Method 4: Check DynamoDB
```bash
aws dynamodb get-item \
  --table-name WizzOrders-Regions-ghayth-dev \
  --key '{"region_id": {"S": "region_123"}}' \
  --profile wizz-drivers-ghayth-dev
```

---

## 💾 Data Format

### What Gets Saved:

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
  "createdAt": "2025-11-05T10:30:00Z",
  "updatedAt": "2025-11-05T10:30:00Z"
}
```

### DynamoDB Schema:
```javascript
{
  region_id: "region_1730822400000",    // Primary Key
  name: "Najaf, Iraq",
  name_ar: "النجف، العراق",
  level: "governorate",                 // Mapped from type
  parent_id: "iraq",
  governorate_id: "najaf",
  coordinates: { lat: 32.0252, lng: 44.3358, radius: 10000 },
  geocoding: { ... },
  delivery_config: { ... },
  is_active: true,
  created_at: "2025-11-05T10:30:00Z",
  updated_at: "2025-11-05T10:30:00Z",
  source: "mapbox-playground"
}
```

---

## 🔄 Migration Workflows

### Workflow 1: Dev → Production
```
1. Build regions in playground (file storage)
2. Export to JSON
3. Enable DynamoDB
4. Bulk import
5. Production ready!
```

### Workflow 2: Real-time Sync
```
1. Enable DynamoDB from start
2. Every save goes to both locations
3. File = backup
4. DynamoDB = production
5. No manual upload needed
```

### Workflow 3: Backup & Restore
```
1. Use file storage during development
2. Export regularly as backup
3. Import to DynamoDB when ready
4. Keep file backups archived
```

---

## 📤 Export & Import

### Export from Playground:
```
1. Click "📤 Export Data"
2. Downloads: whizz-regions-2025-11-05.json
3. File contains all saved regions
```

### Import to DynamoDB:

#### Method 1: Bulk API Endpoint
```bash
curl -X POST http://localhost:3000/api/regions/bulk \
  -H "Content-Type: application/json" \
  -d @whizz-regions-2025-11-05.json
```

#### Method 2: Upload Script (coming soon)
```bash
node scripts/upload-to-dynamodb.js whizz-regions-2025-11-05.json
```

---

## 🛠️ Troubleshooting

### Data Not Saving?

**Check 1: File permissions**
```bash
ls -la data/regions.json
chmod 644 data/regions.json
```

**Check 2: Server running**
```bash
lsof -i :3000
# Should show node process
```

**Check 3: Browser console**
```javascript
// Open console (Cmd+Option+J)
// Look for errors when clicking save
```

### DynamoDB Not Working?

**Check 1: Environment variables**
```bash
echo $USE_DYNAMODB
echo $AWS_REGION
echo $DYNAMODB_TABLE
```

**Check 2: AWS credentials**
```bash
aws sts get-caller-identity --profile wizz-drivers-ghayth-dev
```

**Check 3: Table exists**
```bash
aws dynamodb describe-table \
  --table-name WizzOrders-Regions-ghayth-dev \
  --profile wizz-drivers-ghayth-dev
```

**Check 4: Health endpoint**
```bash
curl http://localhost:3000/health
# Should show DynamoDB status
```

---

## 🎯 Recommendations

### For Development:
✅ Use **file storage** (default)
- Fast and simple
- Easy to debug
- No AWS costs
- Perfect for testing

### For Production:
✅ Enable **DynamoDB**
- Scalable
- Multi-user support
- High availability
- Production-ready

### Best Practice:
✅ Use **BOTH**
- File = local backup
- DynamoDB = production data
- Dual redundancy
- Maximum safety

---

## 📊 Quick Commands

```bash
# View saved data
cat data/regions.json | jq .

# Count regions
cat data/regions.json | jq 'length'

# Check DynamoDB count
aws dynamodb scan \
  --table-name WizzOrders-Regions-ghayth-dev \
  --select COUNT \
  --profile wizz-drivers-ghayth-dev

# Export via API
curl http://localhost:3000/api/export > backup.json

# Health check
curl http://localhost:3000/health
```

---

## 🎉 Summary

### Current Setup (Default):
```
Save → data/regions.json (✅ Working)
```

### With DynamoDB (Optional):
```
Save → data/regions.json + DynamoDB (✅ Available)
```

### To Enable DynamoDB:
```bash
USE_DYNAMODB=true npm run playground
```

---

**Your data is safe in both locations!** 💾✨

**Choose the storage that fits your workflow!** 🚀
