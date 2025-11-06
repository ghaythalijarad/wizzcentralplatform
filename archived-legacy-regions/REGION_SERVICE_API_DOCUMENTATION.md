# Region Service API Documentation

## Overview
The RegionService provides business logic for managing hierarchical regions (Province → District → Neighborhood) with automatic cascading status updates and parent validation.

---

## Core Business Rules

### 1. Deactivation Rules (Cascading)
- ✅ **PROVINCE → INACTIVE**: All districts and neighborhoods under it become INACTIVE
- ✅ **DISTRICT → INACTIVE**: All neighborhoods under it become INACTIVE
- ✅ **NEIGHBORHOOD → INACTIVE**: Only the neighborhood is affected

### 2. Activation Rules (Parent Validation)
- ✅ **PROVINCE → ACTIVE**: Can always be activated (no parent)
- ✅ **DISTRICT → ACTIVE**: 
  - Parent province MUST be ACTIVE
  - All neighborhoods under this district become ACTIVE
- ✅ **NEIGHBORHOOD → ACTIVE**: 
  - Parent district MUST be ACTIVE
  - Grandparent province MUST be ACTIVE

### 3. Transaction Safety
- ✅ Batch processing (max 25 items per batch)
- ✅ Retry logic (3 attempts with exponential backoff)
- ✅ Rollback on partial failures
- ✅ Clear error messages

---

## API Endpoints

### 1. Toggle Region Status
Toggle a region's status with automatic cascading or parent validation.

**Endpoint**: `PUT /api/regions/{regionId}`

**Request Body**:
```json
{
  "status": "INACTIVE"
}
```

**Response (Deactivation Cascade)**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Successfully deactivated 45 regions",
    "region": {
      "regionId": "PROV_BAGHDAD",
      "regionName": "Baghdad Province",
      "regionNameArabic": "محافظة بغداد",
      "region_type": "PROVINCE",
      "parent_id": null,
      "status": "INACTIVE",
      "isActive": false,
      "updatedAt": "2025-11-04T10:30:00.000Z"
    },
    "affectedRegions": {
      "provinces": 1,
      "districts": 8,
      "neighborhoods": 36,
      "total": 45,
      "details": [
        {
          "regionId": "PROV_BAGHDAD",
          "regionName": "Baghdad Province",
          "regionType": "PROVINCE",
          "previousStatus": "ACTIVE"
        },
        {
          "regionId": "DIST_BAGHDAD_CENTRAL",
          "regionName": "Baghdad Central District",
          "regionType": "DISTRICT",
          "previousStatus": "ACTIVE"
        },
        {
          "regionId": "NEIGH_KADHIMIYA",
          "regionName": "Kadhimiya",
          "regionType": "NEIGHBORHOOD",
          "previousStatus": "ACTIVE"
        }
        // ... more regions
      ]
    },
    "operation": "DEACTIVATE_CASCADE"
  }
}
```

**Response (Activation with Validation)**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Successfully activated 5 regions",
    "region": {
      "regionId": "DIST_BAGHDAD_CENTRAL",
      "regionName": "Baghdad Central District",
      "status": "ACTIVE",
      "isActive": true
    },
    "affectedRegions": {
      "provinces": 0,
      "districts": 1,
      "neighborhoods": 4,
      "total": 5,
      "details": [
        {
          "regionId": "DIST_BAGHDAD_CENTRAL",
          "regionName": "Baghdad Central District",
          "regionType": "DISTRICT",
          "previousStatus": "INACTIVE"
        },
        {
          "regionId": "NEIGH_KADHIMIYA",
          "regionName": "Kadhimiya",
          "regionType": "NEIGHBORHOOD",
          "previousStatus": "INACTIVE"
        }
        // ... more neighborhoods
      ]
    },
    "operation": "ACTIVATE_WITH_VALIDATION"
  }
}
```

**Error Response (Parent Not Active)**:
```json
{
  "success": false,
  "error": "Failed to activate region: Cannot activate DISTRICT because parent PROVINCE \"Basra Province\" is INACTIVE"
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid request (bad status value)
- `404`: Region not found
- `422`: Validation failed (parent not active)
- `500`: Server error

---

### 2. Get Region Status Summary
Get aggregate counts of regions by type and status.

**Endpoint**: `GET /api/regions/summary`

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byType": {
      "PROVINCE": {
        "total": 10,
        "active": 7,
        "inactive": 3
      },
      "DISTRICT": {
        "total": 40,
        "active": 30,
        "inactive": 10
      },
      "NEIGHBORHOOD": {
        "total": 100,
        "active": 75,
        "inactive": 25
      }
    },
    "byStatus": {
      "ACTIVE": 112,
      "INACTIVE": 38
    }
  }
}
```

**Status Codes**:
- `200`: Success
- `500`: Server error

---

## Usage Examples

### Example 1: Deactivate a Province
This will cascade and deactivate all districts and neighborhoods.

**cURL**:
```bash
curl -X PUT https://api.wizz.com/regions/PROV_BAGHDAD \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"status": "INACTIVE"}'
```

**JavaScript**:
```javascript
const response = await fetch('/api/regions/PROV_BAGHDAD', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ status: 'INACTIVE' })
});

const result = await response.json();
console.log(`Deactivated ${result.data.affectedRegions.total} regions`);
console.log(`- Provinces: ${result.data.affectedRegions.provinces}`);
console.log(`- Districts: ${result.data.affectedRegions.districts}`);
console.log(`- Neighborhoods: ${result.data.affectedRegions.neighborhoods}`);
```

**Expected Output**:
```
Deactivated 45 regions
- Provinces: 1
- Districts: 8
- Neighborhoods: 36
```

---

### Example 2: Activate a District
This will activate the district and all its neighborhoods (if parent province is active).

**cURL**:
```bash
curl -X PUT https://api.wizz.com/regions/DIST_BAGHDAD_CENTRAL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"status": "ACTIVE"}'
```

**JavaScript**:
```javascript
try {
  const response = await fetch('/api/regions/DIST_BAGHDAD_CENTRAL', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'ACTIVE' })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('✅ Activation successful');
    console.log(`Activated ${result.data.affectedRegions.total} regions`);
  } else {
    console.error('❌ Activation failed:', result.error);
  }
} catch (error) {
  console.error('❌ Request failed:', error.message);
}
```

---

### Example 3: Get Status Summary
Get an overview of all regions.

**cURL**:
```bash
curl -X GET https://api.wizz.com/regions/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**JavaScript**:
```javascript
const response = await fetch('/api/regions/summary', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const summary = await response.json();

console.log(`Total Regions: ${summary.data.total}`);
console.log(`Active: ${summary.data.byStatus.ACTIVE}`);
console.log(`Inactive: ${summary.data.byStatus.INACTIVE}`);
console.log('\nBy Type:');
console.log(`- Provinces: ${summary.data.byType.PROVINCE.total} (${summary.data.byType.PROVINCE.active} active)`);
console.log(`- Districts: ${summary.data.byType.DISTRICT.total} (${summary.data.byType.DISTRICT.active} active)`);
console.log(`- Neighborhoods: ${summary.data.byType.NEIGHBORHOOD.total} (${summary.data.byType.NEIGHBORHOOD.active} active)`);
```

---

## Business Logic Flow Diagrams

### Deactivation Flow
```
User requests INACTIVE status for Province
           ↓
    Validate region exists
           ↓
    Get region details (type, children)
           ↓
    Collect all descendants recursively
           ↓
    Batch update all regions to INACTIVE
           ↓
    Return affected counts by type
```

### Activation Flow
```
User requests ACTIVE status for District
           ↓
    Validate region exists
           ↓
    Check parent Province status
           ↓
    ┌─────────────────┬─────────────────┐
    │ Parent ACTIVE   │ Parent INACTIVE │
    │                 │                 │
    ↓                 ↓                 ↓
Proceed           Return Error       End
    ↓
Get all direct children (neighborhoods)
    ↓
Batch update district + neighborhoods to ACTIVE
    ↓
Return affected counts by type
```

---

## Transaction Safety

### Batch Processing
- Regions are processed in batches of 25 (DynamoDB limit)
- Each batch waits 100ms before processing next batch
- Prevents throttling and rate limit issues

### Retry Logic
- 3 automatic retry attempts per region update
- Exponential backoff: 1s, 2s, 3s
- Continues on transient failures
- Throws error only after all retries exhausted

### Example Retry Scenario
```
Attempt 1: ❌ ProvisionedThroughputExceededException
Wait 1 second...
Attempt 2: ❌ ProvisionedThroughputExceededException
Wait 2 seconds...
Attempt 3: ✅ Success
```

---

## Error Handling

### Common Errors

#### 1. Region Not Found
```json
{
  "success": false,
  "error": "Region INVALID_ID not found"
}
```

#### 2. Invalid Status Value
```json
{
  "success": false,
  "error": "Invalid status: PAUSED. Must be ACTIVE or INACTIVE"
}
```

#### 3. Parent Not Active
```json
{
  "success": false,
  "error": "Failed to activate region: Cannot activate DISTRICT because parent PROVINCE \"Basra Province\" is INACTIVE"
}
```

#### 4. Grandparent Not Active
```json
{
  "success": false,
  "error": "Failed to activate region: Cannot activate NEIGHBORHOOD because grandparent PROVINCE \"Basra Province\" is INACTIVE"
}
```

#### 5. Bulk Update Failure
```json
{
  "success": false,
  "error": "Bulk update failed: Failed to update region REG_123 after 3 attempts: ProvisionedThroughputExceededException"
}
```

---

## Integration with Frontend

### Display Affected Regions
```javascript
async function toggleRegionStatus(regionId, newStatus) {
  const response = await regionService.toggleRegionStatus(regionId, newStatus);
  
  // Show notification
  showNotification(
    response.message,
    response.success ? 'success' : 'error'
  );
  
  // Update UI counters
  if (response.success) {
    updateStatCard('provinces', response.affectedRegions.provinces);
    updateStatCard('districts', response.affectedRegions.districts);
    updateStatCard('neighborhoods', response.affectedRegions.neighborhoods);
    
    // Show details in modal
    showAffectedRegionsModal(response.affectedRegions.details);
  }
}
```

### Real-time Status Summary
```javascript
async function refreshStatusSummary() {
  const summary = await regionService.getRegionStatusSummary();
  
  // Update regions admin panel statistics
  document.getElementById('total-regions').textContent = summary.total;
  document.getElementById('active-regions').textContent = summary.byStatus.ACTIVE;
  document.getElementById('inactive-regions').textContent = summary.byStatus.INACTIVE;
  
  // Update charts
  updateRegionTypeChart(summary.byType);
  updateRegionStatusChart(summary.byStatus);
}

// Refresh every 30 seconds
setInterval(refreshStatusSummary, 30000);
```

---

## Performance Considerations

### Optimization Tips
1. **Use batch operations** for updating multiple regions
2. **Cache region hierarchy** to reduce database queries
3. **Index on parent_id** for fast child lookups
4. **Monitor DynamoDB metrics** for throttling

### Expected Performance
- Single region toggle: **< 100ms**
- Province cascade (50 regions): **< 2s**
- Status summary: **< 500ms**
- Batch update (100 regions): **< 5s**

---

## Testing

Run the test suite:
```bash
node backend/regions-service.test.js
```

Expected output:
```
🧪 Starting RegionService Test Suite

🧪 Test: Deactivate Province with Cascade
✅ PASS: Province cascade logic validated

🧪 Test: Activate District with Active Province
✅ PASS: District activation with parent validation successful

📊 Test Summary
Total Tests: 8
✅ Passed: 8
❌ Failed: 0
Success Rate: 100.00%
```

---

## Support
For questions or issues, contact the development team.

**Last Updated**: November 4, 2025
