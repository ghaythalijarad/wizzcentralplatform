# Manual Test Driver Creation Guide

Since the AWS CLI might have authentication issues, here are two ways to create a test driver with online status:

## Method 1: Manual DynamoDB Console Entry

**Go to DynamoDB Console → WhizzDrivers_dev → "Create item"**

Copy and paste this JSON data:

```json
{
  "driverId": "test-driver-online-1727545000",
  "name": "Test Driver ONLINE",
  "email": "test.online@wizz.com", 
  "city": "بغداد",
  "licenseNumber": "TEST123456",
  "nationalId": "1234567890123",
  "vehicleType": "car",
  "registrationStatus": "APPROVED",
  "status": "online",
  "availabilityStatus": "online", 
  "driverStatus": "online",
  "activeOrders": 0,
  "maxActiveOrders": 3,
  "statusChangedAt": "2025-09-28T16:20:00.000Z",
  "lastStatusUpdate": "2025-09-28T16:20:00.000Z", 
  "statusReason": "Test driver created online",
  "location": {
    "latitude": 33.3152,
    "longitude": 44.3661,
    "lastLocationUpdate": "2025-09-28T16:20:00.000Z"
  },
  "createdAt": "2025-09-28T16:20:00.000Z",
  "updatedAt": "2025-09-28T16:20:00.000Z",
  "version": 1,
  "drivingLicense": {
    "s3Key": "test-driver/driving-license.jpg",
    "size": 100000,
    "name": "driving-license.jpg", 
    "uploadedAt": "2025-09-28T16:20:00.000Z"
  },
  "vehicleRegistration": {
    "s3Key": "test-driver/vehicle-registration.jpg",
    "size": 100000,
    "name": "vehicle-registration.jpg",
    "uploadedAt": "2025-09-28T16:20:00.000Z"
  },
  "nonCriminalRecord": {
    "s3Key": "test-driver/non-criminal-record.jpg", 
    "size": 100000,
    "name": "non-criminal-record.jpg",
    "uploadedAt": "2025-09-28T16:20:00.000Z"
  }
}
```

## Method 2: Update Existing Driver

Since you already have 2 drivers in the table, you can update one of them to test online status:

1. **Select existing driver** (e.g., `5448b458-9021-7074-7452-6110fcc1b504`)
2. **Click "Edit"**
3. **Add these fields:**

```json
"availabilityStatus": "online"
"driverStatus": "online" 
"statusChangedAt": "2025-09-28T16:20:00.000Z"
"lastStatusUpdate": "2025-09-28T16:20:00.000Z"
"activeOrders": 0
"location": {
  "latitude": 33.3152,
  "longitude": 44.3661
}
```

4. **Ensure the existing `status` field is set to `"online"`**

## Key Fields to Check

After adding the test driver, verify these fields are set correctly:

✅ **registrationStatus**: `"APPROVED"`
✅ **status**: `"online"`  
✅ **availabilityStatus**: `"online"`
✅ **driverStatus**: `"online"`
✅ **activeOrders**: `0`

## Expected Result

Once you add this driver, the assignment system should:
1. ✅ Find this driver when searching for available drivers
2. ✅ Include this driver in order assignments  
3. ✅ Send notifications to this driver's WebSocket connection

## Verification

After creating the driver, you can test the assignment system by:
1. Running our backend tests
2. Creating a test order with status "ready_for_pickup"
3. Checking if the driver gets assigned

The key breakthrough is that we now update **both** `status` AND `availabilityStatus` fields, so the assignment system will work regardless of which field the Flutter app sets.
