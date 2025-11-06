# Region Model - Hierarchical Structure Update

## Overview
The Region model has been updated to support a full hierarchical structure with three levels: **PROVINCE**, **DISTRICT**, and **NEIGHBORHOOD**. This enables better organization of service areas and automated cascading control when parent regions are deactivated.

---

## New Fields Added

### 1. `region_type` (Required)
- **Type**: Enum
- **Values**: `PROVINCE`, `DISTRICT`, `NEIGHBORHOOD`
- **Description**: Defines the hierarchical level of the region
  - **PROVINCE**: Top-level administrative region (no parent)
  - **DISTRICT**: Mid-level region (child of PROVINCE)
  - **NEIGHBORHOOD**: Lowest-level region (child of DISTRICT)

### 2. `parent_id` (Nullable)
- **Type**: String (references regionId)
- **Description**: ID of the parent region
  - `null` for PROVINCE-level regions
  - Required for DISTRICT and NEIGHBORHOOD regions
- **Index**: `ParentIdIndex` (Global Secondary Index for efficient queries)

### 3. `gps_coordinates` (Required)
- **Type**: Object `{ lat: number, lng: number }`
- **Description**: GPS coordinates of the region center
- **Example**: `{ lat: 33.3152, lng: 44.3661 }`
- **Note**: Can also support GeoJSON format if needed

### 4. `status` (Required)
- **Type**: Enum
- **Values**: `ACTIVE`, `INACTIVE`
- **Description**: Operational status of the region
  - **ACTIVE**: Region is operational and accepting services
  - **INACTIVE**: Region is closed/disabled
- **Note**: Synchronized with existing `isActive` boolean field for backward compatibility

---

## Hierarchical Validation Rules

### Province Rules
- **parent_id**: Must be `null`
- **Can have children**: DISTRICT regions only

### District Rules
- **parent_id**: Must reference a PROVINCE region
- **Can have children**: NEIGHBORHOOD regions only

### Neighborhood Rules
- **parent_id**: Must reference a DISTRICT region
- **Can have children**: No (leaf node)

---

## Cascading Deactivation Logic

### Automatic Cascading
When a parent region's status is changed to `INACTIVE`, all child regions (and their descendants) are automatically set to `INACTIVE`.

### Example Cascade Flow
```
Baghdad Province (PROVINCE) → INACTIVE
    ├─ Baghdad Central (DISTRICT) → Auto-deactivated
    │   ├─ Kadhimiya (NEIGHBORHOOD) → Auto-deactivated
    │   └─ Mansour (NEIGHBORHOOD) → Auto-deactivated
    └─ Baghdad Karkh (DISTRICT) → Auto-deactivated
        └─ Adhamiyah (NEIGHBORHOOD) → Auto-deactivated
```

### Implementation
The cascading logic is implemented in `backend/regions-db-schema.js`:
- `cascadeDeactivateChildren(parentRegionId)`: Recursively deactivates all children
- `updateRegionStatus(regionId, newStatus)`: Updates status with cascading support

---

## Database Schema Changes

### Updated DynamoDB Table Schema

#### New Global Secondary Indexes
1. **ParentIdIndex**
   - Key: `parent_id` (HASH)
   - Purpose: Query all children of a specific parent region

2. **RegionTypeIndex**
   - Key: `region_type` (HASH)
   - Purpose: Query regions by type (all provinces, districts, or neighborhoods)

#### Attribute Definitions
Added to existing table:
```javascript
{
    AttributeName: 'parent_id',
    AttributeType: 'S'
},
{
    AttributeName: 'region_type',
    AttributeType: 'S'
}
```

---

## API Endpoints

### New/Updated Endpoints

#### GET /api/regions
Get all regions with optional filters
- Query Parameters:
  - `region_type`: Filter by type (PROVINCE, DISTRICT, NEIGHBORHOOD)
  - `parent_id`: Get children of specific parent
  - `status`: Filter by status (ACTIVE, INACTIVE)
  - `governorate`: Filter by governorate

#### GET /api/regions/{regionId}
Get a single region
- Query Parameters:
  - `includeHierarchy=true`: Include full tree of descendants
  - `children=true`: Include only immediate children

#### POST /api/regions
Create a new region
- Validates hierarchy rules
- Body: Region object with all required fields

#### PUT /api/regions/{regionId}
Update a region
- Validates hierarchy if `region_type` or `parent_id` changes
- If `status` changes to INACTIVE, triggers cascading
- Body: Fields to update

#### DELETE /api/regions/{regionId}
Delete a region
- Only allowed if region has no children
- Returns error if children exist

---

## Frontend Integration

### Updated Sample Data
Both `regions.js` and `regions-management.js` now include the new fields in sample data.

### Example Region Object
```javascript
{
    regionId: 'REG_001',
    regionName: 'Baghdad Central',
    regionNameArabic: 'بغداد المركز',
    governorate: 'Baghdad',
    region_type: 'DISTRICT',
    parent_id: null,
    status: 'ACTIVE',
    gps_coordinates: { lat: 33.3152, lng: 44.3661 },
    isActive: true, // Kept for backward compatibility
    coordinates: {
        center: { lat: 33.3152, lng: 44.3661 },
        boundaries: [
            { lat: 33.32, lng: 44.35 },
            { lat: 33.31, lng: 44.38 },
            // ...
        ]
    },
    // ... other existing fields
}
```

---

## Usage Examples

### 1. Create a Province
```javascript
const province = {
    regionId: 'REG_BAGHDAD',
    regionName: 'Baghdad Province',
    regionNameArabic: 'محافظة بغداد',
    governorate: 'Baghdad',
    region_type: 'PROVINCE',
    parent_id: null,
    status: 'ACTIVE',
    gps_coordinates: { lat: 33.3152, lng: 44.3661 }
};
```

### 2. Create a District (Child of Province)
```javascript
const district = {
    regionId: 'REG_BAGHDAD_CENTRAL',
    regionName: 'Baghdad Central District',
    regionNameArabic: 'منطقة بغداد المركز',
    governorate: 'Baghdad',
    region_type: 'DISTRICT',
    parent_id: 'REG_BAGHDAD', // Links to province
    status: 'ACTIVE',
    gps_coordinates: { lat: 33.3152, lng: 44.3661 }
};
```

### 3. Create a Neighborhood (Child of District)
```javascript
const neighborhood = {
    regionId: 'REG_KADHIMIYA',
    regionName: 'Kadhimiya',
    regionNameArabic: 'الكاظمية',
    governorate: 'Baghdad',
    region_type: 'NEIGHBORHOOD',
    parent_id: 'REG_BAGHDAD_CENTRAL', // Links to district
    status: 'ACTIVE',
    gps_coordinates: { lat: 33.3800, lng: 44.3400 }
};
```

### 4. Deactivate a Province (Cascades to All Children)
```javascript
const { updateRegionStatus } = require('./regions-db-schema');

const result = await updateRegionStatus('REG_BAGHDAD', 'INACTIVE');
// Result includes:
// - updatedRegion: The province itself
// - affectedChildren: Array of all deactivated child region IDs
// - message: Summary of operation
```

### 5. Query Children of a Region
```javascript
const { getChildRegions } = require('./regions-api-handler');

const children = await getChildRegions('REG_BAGHDAD');
// Returns all districts within Baghdad province
```

### 6. Get Full Hierarchy Tree
```javascript
const { getRegionHierarchy } = require('./regions-api-handler');

const tree = await getRegionHierarchy('REG_BAGHDAD');
// Returns province with nested children structure
```

---

## Migration Guide

### For Existing Regions
Existing regions need to be updated with the new fields:

```javascript
// Migration script example
const existingRegions = await getAllRegions();

for (const region of existingRegions) {
    const updates = {
        region_type: 'DISTRICT', // Assign appropriate type
        parent_id: null, // Set parent if applicable
        status: region.isActive ? 'ACTIVE' : 'INACTIVE',
        gps_coordinates: region.coordinates?.center || { lat: 0, lng: 0 }
    };
    
    await updateRegion(region.regionId, updates);
}
```

---

## Benefits

1. **Hierarchical Organization**: Clear three-level structure (Province → District → Neighborhood)

2. **Automated Control**: Deactivating a province automatically closes all districts and neighborhoods within it

3. **Efficient Queries**: New indexes enable fast lookups by parent or type

4. **Service Management**: Better control over service availability at different administrative levels

5. **Backward Compatible**: Existing `isActive` field maintained, synchronized with new `status` field

6. **Validation**: Automatic validation prevents invalid hierarchies (e.g., neighborhood as parent of district)

---

## Files Modified

### Backend
- ✅ `backend/regions-db-schema.js` - Updated schema with new fields, enums, and cascading logic
- ✅ `backend/regions-api-handler.js` - New API handler with hierarchical support

### Frontend
- ✅ `frontend/regions.js` - Updated sample data with new fields
- ✅ `frontend/regions-management.js` - Updated sample data with new fields

---

## Next Steps

1. **Database Migration**: Run migration script to update existing regions
2. **UI Updates**: Update region forms to include new fields (dropdowns for type, parent selection)
3. **Testing**: Test cascading deactivation with real data
4. **Documentation**: Update user documentation for region management
5. **Monitoring**: Add logging for cascade operations to track changes

---

## Support

For questions or issues related to the hierarchical region model, contact the development team.

**Last Updated**: November 4, 2025
