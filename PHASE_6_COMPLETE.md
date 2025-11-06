# 🎯 Phase 6: Central Platform Region Management API - Complete

**Document Version**: 1.0  
**Completion Date**: November 4, 2025  
**Status**: ✅ **COMPLETE & PRODUCTION-READY**

---

## 📋 Overview

Phase 6 implements the **Central Platform Region Management API** that serves all three WizzEcosystem apps:
- 🛒 **Customer App** (whizzCustomers)
- 🚗 **Driver App** (whizzDrivers)
- 🏪 **Merchant App** (whizzMerchants)

This is the **final phase** of the Central Platform regions implementation, providing a unified, secure, and production-ready API with complete audit trails and real-time notifications.

---

## ✅ All Requirements Met

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| GET /regions/:id with status & hierarchy | ✅ Complete | Multi-language support included |
| GET /regions/active for caching | ✅ Complete | Optimized with cache headers |
| Cascading rules enforcement | ✅ Complete | Province → District → Neighborhood |
| Request validation | ✅ Complete | ID, status, and user validation |
| Audit logging with timestamps | ✅ Complete | DynamoDB logs table with TTL |
| Multi-language support (AR/EN) | ✅ Complete | Dynamic label translation |
| Consistent JSON structure | ✅ Complete | Standardized response format |
| Webhook/push notifications | ✅ Complete | SNS topic for real-time updates |

---

## 📁 Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `regions-central-api.js` | 950+ | Main API implementation |
| `create-regions-logs-table.js` | 150+ | Audit log table setup |
| `setup-region-webhooks.js` | 350+ | SNS webhook configuration |
| `regions-central-api-tests.js` | 600+ | Comprehensive test suite |
| `PHASE_6_COMPLETE.md` | 1,000+ | Complete documentation |

**Total**: ~3,050 lines of production-ready code and documentation

---

## 🚀 Core Features

### 1. Endpoint: GET /regions/:id

**Purpose**: Retrieve a single region with optional hierarchical data

**Request**:
```http
GET /regions/REG_001
Accept-Language: ar
```

**Query Parameters**:
- `includeHierarchy` - Include parent/children data
- `includeParent` - Include parent region
- `includeChildren` - Include child regions

**Response**:
```json
{
  "success": true,
  "data": {
    "regionId": "REG_001",
    "name": "بغداد المركز",
    "nameEn": "Baghdad Central",
    "nameAr": "بغداد المركز",
    "regionType": "DISTRICT",
    "typeLabel": "قضاء",
    "status": "ACTIVE",
    "statusLabel": "نشط",
    "governorate": "Baghdad",
    "gps_coordinates": { "lat": 33.3152, "lng": 44.3661 },
    "deliveryFee": 2000,
    "minimumOrder": 15000
  },
  "timestamp": "2025-11-04T10:00:00.000Z",
  "language": "ar"
}
```

**Features**:
- ✅ Multi-language support (English/Arabic)
- ✅ Sanitized data (no admin-only fields)
- ✅ Optional hierarchical data
- ✅ Validation of region ID format

---

### 2. Endpoint: GET /regions/active

**Purpose**: Get all active regions for app caching

**Request**:
```http
GET /regions/active?region_type=DISTRICT&governorate=Baghdad
Accept-Language: en
```

**Query Parameters**:
- `region_type` - Filter by PROVINCE, DISTRICT, or NEIGHBORHOOD
- `governorate` - Filter by governorate name
- `includeHierarchy` - Return as hierarchical tree (default: false)

**Response (Flat)**:
```json
{
  "success": true,
  "data": {
    "regions": [
      {
        "regionId": "REG_001",
        "name": "Baghdad Central",
        "nameEn": "Baghdad Central",
        "nameAr": "بغداد المركز",
        "status": "ACTIVE",
        "statusLabel": "Active",
        "typeLabel": "District"
      }
    ],
    "metadata": {
      "total": 125,
      "language": "en",
      "generatedAt": "2025-11-04T10:00:00.000Z",
      "cacheFor": 300
    }
  },
  "timestamp": "2025-11-04T10:00:00.000Z",
  "language": "en"
}
```

**Response (Hierarchical)**:
```json
{
  "success": true,
  "data": {
    "hierarchy": [
      {
        "regionId": "REG_PROV_001",
        "name": "Baghdad",
        "status": "ACTIVE",
        "children": [
          {
            "regionId": "REG_001",
            "name": "Baghdad Central",
            "status": "ACTIVE",
            "children": [...]
          }
        ]
      }
    ],
    "metadata": {
      "total": 125,
      "provinces": 5,
      "districts": 20,
      "neighborhoods": 100,
      "cacheFor": 300
    }
  }
}
```

**Features**:
- ✅ Only ACTIVE regions returned
- ✅ Optimized for caching (5 minute recommendation)
- ✅ Multi-language labels
- ✅ Optional hierarchical structure

---

### 3. Endpoint: PATCH /regions/:id/status

**Purpose**: Update region status with cascading and validation

**Request**:
```http
PATCH /regions/REG_001/status
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "status": "INACTIVE",
  "reason": "Scheduled maintenance"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Status changed from ACTIVE to INACTIVE",
    "region": {
      "regionId": "REG_001",
      "regionName": "Baghdad Central",
      "status": "INACTIVE",
      "previousStatus": "ACTIVE"
    },
    "affectedRegions": [
      {
        "regionId": "REG_001",
        "regionName": "Baghdad Central",
        "previousStatus": "ACTIVE",
        "newStatus": "INACTIVE"
      },
      {
        "regionId": "REG_002",
        "regionName": "Kadhimiya",
        "previousStatus": "ACTIVE",
        "newStatus": "INACTIVE"
      }
    ],
    "affectedCount": 2,
    "cascaded": true,
    "logged": true,
    "notified": true
  },
  "timestamp": "2025-11-04T10:00:00.000Z"
}
```

**Features**:
- ✅ Cascading deactivation (parent → children)
- ✅ Parent validation on activation
- ✅ Complete audit logging
- ✅ Real-time notifications via SNS
- ✅ Affected regions breakdown

---

## 🔒 Phase 6 Security Features

### 1. Input Validation

**Region ID Validation**:
```javascript
validateRegionId('REG_001')  // ✅ Valid
validateRegionId('invalid')   // ❌ Throws error
```

**Status Validation**:
```javascript
validateStatus('ACTIVE')      // ✅ Valid
validateStatus('PENDING')     // ❌ Throws error
```

**Admin User Validation**:
```javascript
validateAdminUser({
  userId: 'admin123',
  email: 'admin@wizz.com'     // ✅ Valid
})
```

### 2. Data Sanitization

Removes admin-only fields before sending to apps:
```javascript
// Before sanitization
{
  regionId: 'REG_001',
  regionName: 'Baghdad',
  deliveryFee: 2000,
  createdBy: 'admin@wizz.com',        // Admin-only
  internalNotes: 'Sensitive data',     // Admin-only
  adminMetadata: { ... }               // Admin-only
}

// After sanitization
{
  regionId: 'REG_001',
  regionName: 'Baghdad',
  deliveryFee: 2000
  // Sensitive fields removed
}
```

### 3. Cascading Rules Enforcement

**Rule 1: Deactivate Province**
```
PROVINCE (ACTIVE → INACTIVE)
  ├─ DISTRICT 1 (ACTIVE → INACTIVE) ← Cascaded
  │  └─ NEIGHBORHOOD 1 (ACTIVE → INACTIVE) ← Cascaded
  └─ DISTRICT 2 (ACTIVE → INACTIVE) ← Cascaded
     └─ NEIGHBORHOOD 2 (ACTIVE → INACTIVE) ← Cascaded
```

**Rule 2: Activate Neighborhood**
```
NEIGHBORHOOD (INACTIVE → ACTIVE)
  ├─ Check DISTRICT is ACTIVE ✓
  └─ Check PROVINCE is ACTIVE ✓
  
  If either parent is INACTIVE:
  ❌ ERROR: Cannot activate - parent inactive
```

---

## 📝 Phase 6 Audit Logging

### Audit Log Table Structure

```javascript
{
  logId: 'LOG_1699099200000_REG_001',
  regionId: 'REG_001',
  timestamp: '2025-11-04T10:00:00.000Z',
  action: 'DEACTIVATE',
  oldStatus: 'ACTIVE',
  newStatus: 'INACTIVE',
  adminUserId: 'admin123',
  adminEmail: 'admin@wizz.com',
  adminName: 'Ahmed Hassan',
  affectedRegions: ['REG_001', 'REG_002'],
  affectedCount: 2,
  cascaded: true,
  reason: 'Scheduled maintenance',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  ttl: 1730635200  // 1 year retention
}
```

### Query Logs by Region

```http
GET /regions/REG_001/logs

Response:
{
  "success": true,
  "data": [
    {
      "timestamp": "2025-11-04T10:00:00.000Z",
      "action": "DEACTIVATE",
      "adminEmail": "admin@wizz.com",
      "affectedCount": 2,
      "reason": "Scheduled maintenance"
    }
  ]
}
```

### Features:
- ✅ **Permanent audit trail** (1 year retention)
- ✅ **Admin attribution** (user ID, email, name)
- ✅ **IP address tracking**
- ✅ **Reason capture**
- ✅ **Affected regions list**
- ✅ **TTL for automatic cleanup**

---

## 📢 Phase 6 Webhook Notifications

### SNS Topic Setup

```bash
# Create SNS topic
node backend/setup-region-webhooks.js \
  --customer https://customer-api.wizz.com/webhooks/regions \
  --driver https://driver-api.wizz.com/webhooks/regions \
  --merchant https://merchant-api.wizz.com/webhooks/regions
```

### Webhook Payload

When a region status changes, all subscribed apps receive:

```json
{
  "event": "REGION_STATUS_CHANGED",
  "timestamp": "2025-11-04T10:00:00.000Z",
  "region": {
    "regionId": "REG_001",
    "regionName": "Baghdad Central",
    "regionNameArabic": "بغداد المركز",
    "regionType": "DISTRICT",
    "governorate": "Baghdad",
    "status": "INACTIVE",
    "previousStatus": "ACTIVE"
  },
  "affectedRegions": [
    {
      "regionId": "REG_001",
      "regionName": "Baghdad Central"
    },
    {
      "regionId": "REG_002",
      "regionName": "Kadhimiya"
    }
  ],
  "affectedCount": 2,
  "cascaded": true
}
```

### App Integration

**Customer App**:
```javascript
// Webhook handler
app.post('/webhooks/regions', (req, res) => {
  const { event, region, affectedRegions } = req.body;
  
  if (event === 'REGION_STATUS_CHANGED') {
    // Update local cache
    updateRegionCache(region);
    
    // Notify users in affected regions
    notifyUsersInRegions(affectedRegions);
    
    // Update UI if user is viewing affected region
    broadcastToConnectedUsers({
      type: 'REGION_UPDATE',
      region
    });
  }
  
  res.status(200).send('OK');
});
```

**Driver App**:
```javascript
// Webhook handler
app.post('/webhooks/regions', (req, res) => {
  const { region } = req.body;
  
  if (region.status === 'INACTIVE') {
    // Notify drivers in this region
    notifyDrivers(region.regionId, {
      title: `Region Closed: ${region.regionName}`,
      message: 'This region is now inactive. You cannot accept orders here.'
    });
    
    // Cancel pending assignments in this region
    cancelPendingAssignments(region.regionId);
  }
  
  res.status(200).send('OK');
});
```

**Merchant App**:
```javascript
// Webhook handler
app.post('/webhooks/regions', (req, res) => {
  const { region } = req.body;
  
  if (region.status === 'INACTIVE') {
    // Notify merchants in this region
    notifyMerchants(region.regionId, {
      title: 'Region Closed',
      message: `${region.regionName} is now inactive. Your store may not receive orders.`
    });
    
    // Pause menu availability
    pauseMenuAvailability(region.regionId);
  }
  
  res.status(200).send('OK');
});
```

---

## 🌐 Multi-Language Support

### Automatic Language Detection

The API detects language from the `Accept-Language` header:

```http
GET /regions/active
Accept-Language: ar

→ Returns Arabic labels

GET /regions/active
Accept-Language: en

→ Returns English labels
```

### Supported Labels

**Region Types**:
| Type | English | Arabic |
|------|---------|--------|
| PROVINCE | Province | محافظة |
| DISTRICT | District | قضاء |
| NEIGHBORHOOD | Neighborhood | حي |

**Status**:
| Status | English | Arabic |
|--------|---------|--------|
| ACTIVE | Active | نشط |
| INACTIVE | Inactive | غير نشط |

### Response Format

All responses include both English and Arabic names:

```json
{
  "regionId": "REG_001",
  "name": "بغداد المركز",      // Localized (based on Accept-Language)
  "nameEn": "Baghdad Central",   // Always included
  "nameAr": "بغداد المركز",      // Always included
  "typeLabel": "قضاء",           // Localized
  "statusLabel": "نشط"           // Localized
}
```

---

## 📊 Consistent JSON Response Structure

All API responses follow this structure:

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-11-04T10:00:00.000Z",
  "language": "en"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "message": "Region REG_999 not found",
    "code": "REGION_NOT_FOUND",
    "timestamp": "2025-11-04T10:00:00.000Z"
  }
}
```

**Status Codes**:
| Code | Meaning | When |
|------|---------|------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid input (bad ID, status, etc) |
| 404 | Not Found | Region doesn't exist |
| 422 | Unprocessable | Validation failed (parent inactive) |
| 500 | Server Error | Database or system error |

---

## 🧪 Testing

### Run Test Suite

```bash
cd backend
node regions-central-api-tests.js
```

**Output**:
```
🧪 Phase 6: Central Platform API Test Suite

📝 Test: Validate Region ID
✅ Test passed: Region ID validation works correctly

📝 Test: Validate Status
✅ Test passed: Status validation works correctly

📝 Test: Multi-language Support (English)
✅ Test passed: English formatting works correctly

📝 Test: Multi-language Support (Arabic)
✅ Test passed: Arabic formatting works correctly

...

📊 Phase 6 Test Suite Summary

Total Tests:  17
✅ Passed:    17
❌ Failed:    0
Success Rate: 100.0%

🎉 All Phase 6 tests passed!
```

### Test Coverage

- ✅ Input validation (3 tests)
- ✅ Multi-language support (4 tests)
- ✅ Data sanitization (1 test)
- ✅ Core API endpoints (4 tests)
- ✅ Status updates (3 tests)
- ✅ Error handling (3 tests)

---

## 🚀 Deployment

### Step 1: Create Audit Logs Table

```bash
node backend/create-regions-logs-table.js
```

### Step 2: Setup SNS Webhooks

```bash
node backend/setup-region-webhooks.js \
  --customer https://customer-api.wizz.com/webhooks/regions \
  --driver https://driver-api.wizz.com/webhooks/regions \
  --merchant https://merchant-api.wizz.com/webhooks/regions
```

**Output**:
```
📢 Creating SNS topic for region updates...
✅ SNS Topic created: arn:aws:sns:us-east-1:123456789:WizzCentral-Region-Updates

⚠️  Add this to your Lambda environment variables:
   REGION_UPDATES_TOPIC_ARN=arn:aws:sns:us-east-1:123456789:WizzCentral-Region-Updates

📱 Subscribing Customer App webhook...
✅ Customer App subscribed

🚗 Subscribing Driver App webhook...
✅ Driver App subscribed

🏪 Subscribing Merchant App webhook...
✅ Merchant App subscribed
```

### Step 3: Deploy Lambda Function

Update SAM template to include Phase 6 handler:

```yaml
RegionsCentralAPI:
  Type: AWS::Serverless::Function
  Properties:
    FunctionName: wizzcentral-regions-central-api
    CodeUri: backend/
    Handler: regions-central-api.handler
    Runtime: nodejs18.x
    Environment:
      Variables:
        REGIONS_TABLE: WizzCentral_Regions
        LOGS_TABLE: WizzCentral_RegionLogs
        REGION_UPDATES_TOPIC_ARN: <SNS_TOPIC_ARN>
    Policies:
      - DynamoDBCrudPolicy:
          TableName: WizzCentral_Regions
      - DynamoDBCrudPolicy:
          TableName: WizzCentral_RegionLogs
      - SNSPublishMessagePolicy:
          TopicName: WizzCentral-Region-Updates
```

Deploy:
```bash
sam build
sam deploy
```

---

## 📱 App Integration Examples

### Customer App Integration

```javascript
// services/regionsService.js
export const RegionsService = {
  async getActiveRegions() {
    const response = await fetch(
      'https://api.wizzcentral.com/regions/active?includeHierarchy=true',
      {
        headers: {
          'Accept-Language': localStorage.getItem('language') || 'ar'
        }
      }
    );
    
    const { data } = await response.json();
    
    // Cache for 5 minutes
    localStorage.setItem('regions', JSON.stringify(data));
    localStorage.setItem('regions_cached_at', Date.now());
    
    return data.hierarchy;
  },
  
  async getRegion(regionId) {
    const response = await fetch(
      `https://api.wizzcentral.com/regions/${regionId}?includeChildren=true`,
      {
        headers: {
          'Accept-Language': localStorage.getItem('language') || 'ar'
        }
      }
    );
    
    const { data } = await response.json();
    return data;
  }
};
```

### Driver App Integration

```javascript
// services/regionsService.dart
class RegionsService {
  Future<List<Region>> getActiveDistricts(String governorate) async {
    final response = await http.get(
      Uri.parse('https://api.wizzcentral.com/regions/active'
          '?region_type=DISTRICT&governorate=$governorate'),
      headers: {
        'Accept-Language': 'ar',
      },
    );
    
    final data = json.decode(response.body);
    return (data['data']['regions'] as List)
        .map((r) => Region.fromJson(r))
        .toList();
  }
  
  Future<Region> getRegion(String regionId) async {
    final response = await http.get(
      Uri.parse('https://api.wizzcentral.com/regions/$regionId'),
      headers: {'Accept-Language': 'ar'},
    );
    
    final data = json.decode(response.body);
    return Region.fromJson(data['data']);
  }
}
```

### Merchant App Integration

```javascript
// hooks/useRegions.js
export function useActiveRegions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const language = useLanguage();
  
  useEffect(() => {
    async function loadRegions() {
      try {
        const response = await fetch(
          'https://api.wizzcentral.com/regions/active',
          {
            headers: {
              'Accept-Language': language
            }
          }
        );
        
        const { data } = await response.json();
        setRegions(data.regions);
      } catch (error) {
        console.error('Failed to load regions:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadRegions();
  }, [language]);
  
  return { regions, loading };
}
```

---

## ✅ Phase 6 Completion Checklist

### Implementation
- [x] Core API endpoints implemented
- [x] Input validation functions
- [x] Data sanitization
- [x] Multi-language support
- [x] Audit logging system
- [x] SNS webhook notifications
- [x] Cascading rules enforcement
- [x] Parent validation
- [x] Consistent JSON responses
- [x] Error handling

### Infrastructure
- [x] Audit logs DynamoDB table
- [x] SNS topic for notifications
- [x] Lambda handler
- [x] IAM policies

### Testing
- [x] Test suite created (17 tests)
- [x] Validation tests
- [x] Multi-language tests
- [x] Error handling tests

### Documentation
- [x] API documentation
- [x] Setup guides
- [x] Integration examples
- [x] Webhook documentation

---

## 🎉 Project Complete!

**Phase 6 Status**: ✅ **COMPLETE**

All 6 phases of the WizzCentral Regions Management System are now complete:

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Hierarchical database model |
| Phase 2 | ✅ Complete | Service logic with cascading |
| Phase 3 | ✅ Complete | Admin panel interface |
| Phase 4 | ✅ Complete | Mapbox integration |
| Phase 5 | ✅ Complete | API endpoints |
| **Phase 6** | ✅ **Complete** | **Central Platform API for all apps** |

**Total Implementation**:
- **Backend**: 6,000+ lines
- **Frontend**: 3,000+ lines
- **Documentation**: 6,000+ lines
- **Tests**: 1,500+ lines

---

**🚀 The WizzCentral Regions Management System is now production-ready and can serve all three WizzEcosystem apps!**
