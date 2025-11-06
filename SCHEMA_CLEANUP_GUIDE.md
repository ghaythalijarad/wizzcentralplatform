# DynamoDB Schema Cleanup Script

## Overview
The `cleanup-regions-schema.js` script removes unnecessary fields from all 116 items in the `WizzCentral_Regions` DynamoDB table and standardizes them to a clean, consistent schema.

## What It Does

### Fields to KEEP (Essential)
✅ **regionId** - Primary key
✅ **name** - English name
✅ **name_ar** - Arabic name  
✅ **level** - Region level (country/governorate/district)
✅ **parent_id** - Parent region ID
✅ **is_active** - Active status ("true" or "false" string)
✅ **coordinates** - Location (lat/lng object)
✅ **createdAt** - Creation timestamp
✅ **updatedAt** - Last update timestamp
✅ **metadata** - Optional metadata (population, area_km2, capital)

### Fields to REMOVE (Unnecessary/Duplicate)
❌ **governorate_id** - Duplicate of parent_id
❌ **governorateId** - Duplicate of parent_id
❌ **parentRegionId** - Duplicate of parent_id
❌ **boundary** - Not used
❌ **countryCode** - Not needed
❌ **delivery_config** - Not used
❌ **enhanced_with_gadm** - GADM integration field
❌ **gadm_data** - GADM data
❌ **regionCode** - Not used
❌ **regionName** - Duplicate of name
❌ **hierarchy** - Not used

## Usage

### 1. Dry Run (Recommended First)
Analyzes the schema without making changes:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
./backend/cleanup-regions-schema.js --dry-run
```

**Output:**
- Shows all fields currently in use
- Counts how many items have each field
- Identifies which fields will be removed (❌) vs kept (✅)
- Shows how many items need cleanup
- **Does NOT modify any data**

### 2. Actual Cleanup
Performs the cleanup operation:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
./backend/cleanup-regions-schema.js
```

**What happens:**
1. **3-second warning** - Time to cancel with Ctrl+C
2. **Scans all regions** from DynamoDB
3. **Processes each item:**
   - Removes unnecessary fields
   - Normalizes parent_id from any variant
   - Ensures is_active is a string ("true"/"false")
   - Normalizes coordinates (lat/lng)
   - Cleans metadata to only allowed fields
   - Ensures timestamps exist
4. **Updates each item** in DynamoDB
5. **Shows progress** for each region
6. **Summary report** at the end

## Script Features

### Smart Field Normalization
- **parent_id consolidation:** Combines governorate_id, governorateId, parentRegionId → parent_id
- **is_active normalization:** Converts booleans to strings ("true"/"false")
- **Coordinates normalization:** Converts latitude/longitude → lat/lng
- **Metadata cleanup:** Keeps only population, area_km2, capital

### Safety Features
- ✅ Dry run mode for preview
- ✅ 3-second warning before actual changes
- ✅ Progress tracking for all items
- ✅ Error handling and reporting
- ✅ Detailed success/failure summary

### Error Handling
- Continues processing even if individual items fail
- Tracks all errors
- Reports failed items at the end
- Validates required fields (regionId)

## Expected Results

### Before Cleanup (Current State)
```json
{
  "regionId": "IQ-BG-001",
  "name": "Baghdad",
  "name_ar": "بغداد",
  "level": "governorate",
  "parent_id": "IQ",
  "governorate_id": "IQ",
  "governorateId": "IQ",
  "regionCode": "BG",
  "regionName": "Baghdad",
  "boundary": {...},
  "countryCode": "IQ",
  "gadm_data": {...},
  "is_active": "true",
  "coordinates": {"lat": 33.3, "lng": 44.4},
  "createdAt": "2024-...",
  "updatedAt": "2024-..."
}
```

### After Cleanup (Clean State)
```json
{
  "regionId": "IQ-BG-001",
  "name": "Baghdad",
  "name_ar": "بغداد",
  "level": "governorate",
  "parent_id": "IQ",
  "is_active": "true",
  "coordinates": {"lat": 33.3, "lng": 44.4},
  "createdAt": "2024-...",
  "updatedAt": "2024-..."
}
```

## Output Examples

### Dry Run Output
```
🔍 DRY RUN MODE - No changes will be made
════════════════════════════════════════════════════════════════════════════════
📋 Scanning all regions from DynamoDB...
✅ Found 116 regions

📋 Analyzing 116 regions...

📊 Field Usage Across All Items:
  ✅ regionId: 116 items
  ✅ name: 116 items
  ✅ name_ar: 116 items
  ✅ level: 116 items
  ✅ parent_id: 116 items
  ✅ is_active: 116 items
  ✅ coordinates: 116 items
  ✅ createdAt: 116 items
  ✅ updatedAt: 116 items
  ❌ governorate_id: 98 items
  ❌ governorateId: 45 items
  ❌ boundary: 78 items
  ❌ gadm_data: 52 items
  ❌ regionCode: 89 items

🧹 Items needing cleanup: 98/116

💡 Run without --dry-run to perform actual cleanup
════════════════════════════════════════════════════════════════════════════════
```

### Actual Cleanup Output
```
🧹 STARTING DYNAMODB SCHEMA CLEANUP
════════════════════════════════════════════════════════════════════════════════
📦 Table: WizzCentral_Regions
✅ Keeping fields: regionId, name, name_ar, level, parent_id, is_active, coordinates, createdAt, updatedAt, metadata
❌ Removing fields: governorate_id, governorateId, parentRegionId, boundary, countryCode, delivery_config, enhanced_with_gadm, gadm_data, regionCode, regionName, hierarchy
════════════════════════════════════════════════════════════════════════════════
📋 Scanning all regions from DynamoDB...
✅ Found 116 regions

🔄 Processing 116 regions...
[1/116] ✅ Iraq
[2/116] ✅ Baghdad
[3/116] ✅ Basra
[4/116] ✅ Nineveh
...
[116/116] ✅ Zakho

════════════════════════════════════════════════════════════════════════════════
📊 CLEANUP SUMMARY
════════════════════════════════════════════════════════════════════════════════
✅ Successfully cleaned: 116 regions
❌ Errors: 0 regions
📈 Total processed: 116 regions

✨ Schema cleanup completed!
════════════════════════════════════════════════════════════════════════════════
```

## Next Steps After Cleanup

1. **Verify the results:**
   ```bash
   ./check-table-now.sh
   ```

2. **Test the API:**
   ```bash
   curl http://localhost:3000/api/regions | jq '.[0]'
   ```

3. **Restart the server** (if needed):
   ```bash
   # Kill current server
   lsof -ti:3000 | xargs kill -9
   
   # Start fresh
   npm run local
   ```

4. **Test the toggle UI:**
   - Open: http://localhost:3000/pages/regions-toggle.html
   - Toggle a few regions
   - Verify changes persist

## Troubleshooting

### Script doesn't output anything
Make sure it's executable:
```bash
chmod +x backend/cleanup-regions-schema.js
./backend/cleanup-regions-schema.js --dry-run
```

### AWS credentials error
Set your region:
```bash
export AWS_REGION=us-east-1
./backend/cleanup-regions-schema.js --dry-run
```

### "Missing regionId" error
This means some items in the table don't have a primary key - this should never happen. Check DynamoDB console.

### Cleanup is slow
Normal - it processes 116 items one by one. Expect ~30-60 seconds for full cleanup.

## Files
- **Script:** `backend/cleanup-regions-schema.js`
- **Helper:** `run-cleanup-dry-run.sh` (wrapper script)
- **Documentation:** `SCHEMA_CLEANUP_GUIDE.md` (this file)
