# Driver Status Update Testing Guide

## Overview

This guide provides comprehensive testing procedures for the driver online/offline status update system that was recently fixed. The system handles driver status changes through WebSocket connections and updates multiple database fields for compatibility.

## Background

### What Was Fixed
- **Field Name Mismatch**: Flutter app sets `availabilityStatus: 'online'` but backend was checking `driver.status !== 'online'`
- **Table Names**: Fixed from `'WizzUser_drivers_dev'` to `'WhizzDrivers_dev'`
- **Database Keys**: Added flexible key handling for different patterns (`userId`, `driverId`, `id`)
- **Status Fields**: Now updates both `status` and `availabilityStatus` for compatibility

### System Components
1. **Flutter App**: Sends WebSocket messages when driver toggles online/offline
2. **WebSocket Handler**: Processes status update messages
3. **Database Updates**: Updates driver records with new status
4. **Assignment Service**: Uses status fields to find available drivers

## Testing Levels

### Level 1: Logic Testing (No AWS Required)
Test the business logic without needing AWS access.

```bash
# Run basic logic tests
node test-simple-driver-status.js
```

**What this tests:**
- Driver availability logic (`isDriverAvailable` function)
- Field mapping compatibility between Flutter and backend
- Database key pattern support
- WebSocket message validation

### Level 2: Backend Database Testing (AWS Required)
Test actual database operations and backend functions.

```bash
# Authenticate first
aws sso login

# Run backend tests
node test-backend-driver-status.js
```

**What this tests:**
- Driver record creation with proper status fields
- Status update operations (online/offline)
- Database field compatibility
- Assignment system integration
- WebSocket connection simulation

### Level 3: Full Integration Testing (WebSocket + Flutter)
Test the complete system with real WebSocket connections.

```bash
# Run WebSocket integration tests
node test-driver-status-updates.js
```

**What this tests:**
- WebSocket connection establishment
- Real-time status updates
- End-to-end message flow
- Flutter app integration

## Pre-Testing Setup

### 1. AWS Authentication
```bash
# Login to AWS SSO
aws sso login

# Verify access
aws sts get-caller-identity
```

### 2. Environment Configuration
Ensure these environment variables are set:
- `AWS_REGION=us-east-1`
- AWS credentials configured via SSO

### 3. Database Tables
Verify these tables exist and are accessible:
- `WhizzDrivers_dev` - Driver records
- `WizzOrders` - Order records  
- `WizzUser_websocket_connections_dev` - WebSocket connections

## Step-by-Step Testing Process

### Step 1: Quick Logic Verification
```bash
cd /Users/ghaythallaheebi/wizzcentralplatform
node test-simple-driver-status.js
```

**Expected Output:**
```
✅ PASS Driver Availability Logic
✅ PASS Field Mapping Compatibility  
✅ PASS Database Key Patterns
✅ PASS WebSocket Message Handling
Overall: 4/4 tests passed
```

### Step 2: Backend Database Testing
```bash
node test-backend-driver-status.js
```

**Expected Output:**
```
✅ PASS Driver Record Creation
✅ PASS Status Update Online  
✅ PASS Assignment System Check
✅ PASS Status Update Offline
✅ PASS Connection Simulation
Passed: 5/5 tests
```

### Step 3: Manual Database Verification
```javascript
// Check all driver statuses
const { checkAllDriverStatuses } = require('./test-backend-driver-status.js');
checkAllDriverStatuses();

// Get summary
const { getDriverStatusSummary } = require('./test-backend-driver-status.js');
getDriverStatusSummary();
```

### Step 4: Flutter App Testing
1. Open Flutter app on a test device/simulator
2. Login as a driver
3. Toggle driver status to "Online"
4. Check CloudWatch logs for WebSocket messages
5. Verify database updates in DynamoDB console

### Step 5: Order Assignment Testing
```bash
# Create test order with ready_for_pickup status
node test-order-assignment.js
```

**What to verify:**
- Driver receives assignment notification
- Order status updates correctly
- WebSocket messages flow properly

## Monitoring and Debugging

### CloudWatch Logs
Monitor these log groups during testing:
- `/aws/lambda/websocket-connections`
- `/aws/lambda/driver-assignment-service`
- `/aws/apigateway/websocket-api`

### DynamoDB Console
Check these tables for updates:
- `WhizzDrivers_dev` - Driver status fields
- `WizzUser_websocket_connections_dev` - Active connections
- `WizzOrders` - Order assignments

### Key Fields to Monitor

**Driver Record:**
```json
{
  "userId": "driver-id",
  "status": "online|offline",
  "availabilityStatus": "online|offline", 
  "driverStatus": "online|offline",
  "registrationStatus": "APPROVED",
  "statusChangedAt": "timestamp",
  "lastStatusUpdate": "timestamp"
}
```

**WebSocket Connection:**
```json
{
  "connectionId": "connection-id",
  "userId": "driver-id",
  "userType": "driver",
  "status": "online",
  "connectedAt": "timestamp",
  "lastSeen": "timestamp"
}
```

## Test Scenarios

### Scenario 1: Driver Goes Online
1. Driver opens app and logs in
2. Taps "Go Online" button
3. **Expected Results:**
   - WebSocket sends `driver_status_update` message
   - Backend updates all status fields to "online"
   - Driver appears in available drivers list
   - Assignment service can find this driver

### Scenario 2: Driver Goes Offline  
1. Driver taps "Go Offline" button
2. **Expected Results:**
   - WebSocket sends status update
   - Backend updates status fields to "offline"
   - Driver removed from available drivers list
   - No new orders assigned to this driver

### Scenario 3: Order Assignment
1. Ensure at least one driver is online
2. Create order with status "ready_for_pickup" 
3. **Expected Results:**
   - Assignment service finds available driver
   - Driver receives assignment notification
   - Order status updates to "assigned"

### Scenario 4: Connection Loss
1. Driver goes online
2. Close app or lose network connection
3. **Expected Results:**
   - WebSocket connection marked as disconnected
   - Driver status remains but connection is cleaned up
   - Driver won't receive new assignments until reconnected

## Troubleshooting

### Common Issues

**1. Tests fail with "No access" errors**
- Solution: Run `aws sso login` first

**2. Driver not appearing as available**
- Check: `registrationStatus` is "APPROVED"
- Check: Either `status` or `availabilityStatus` is "online"
- Check: `activeOrders` is less than 3

**3. WebSocket connection failures** 
- Check: JWT token is valid
- Check: WebSocket endpoint URL is correct
- Check: Network connectivity

**4. Database update failures**
- Check: Table names are correct (`WhizzDrivers_dev`)
- Check: Key patterns match existing records
- Check: DynamoDB permissions

### Debug Commands

```bash
# Check AWS credentials
aws sts get-caller-identity

# List DynamoDB tables
aws dynamodb list-tables --region us-east-1

# Check specific driver record
aws dynamodb get-item \
  --table-name WhizzDrivers_dev \
  --key '{"userId":{"S":"your-driver-id"}}'

# Check WebSocket connections
aws dynamodb scan \
  --table-name WizzUser_websocket_connections_dev \
  --filter-expression "userType = :type" \
  --expression-attribute-values '{":type":{"S":"driver"}}'
```

## Success Criteria

The system is working correctly when:

1. **Logic Tests**: All pass (4/4)
2. **Backend Tests**: All pass (5/5)  
3. **Driver Status**: Updates both `status` and `availabilityStatus` fields
4. **Assignment Service**: Finds online drivers correctly
5. **WebSocket**: Messages flow bidirectionally
6. **Flutter Integration**: Driver toggle works end-to-end

## Next Steps After Testing

Once all tests pass:

1. **Deploy to Staging**: Test with staging environment
2. **User Acceptance Testing**: Have drivers test the toggle functionality  
3. **Load Testing**: Test with multiple simultaneous driver status changes
4. **Production Deployment**: Deploy fixes to production
5. **Monitoring**: Set up alerts for driver assignment metrics

## Files Created for Testing

- `test-simple-driver-status.js` - Logic testing (no AWS required)
- `test-backend-driver-status.js` - Backend database testing  
- `test-driver-status-updates.js` - Full WebSocket integration testing
- `TESTING_GUIDE.md` - This comprehensive guide

## Contact

If you encounter issues during testing:
1. Check the error logs in CloudWatch
2. Verify AWS permissions and authentication
3. Ensure database tables and records exist
4. Test each level incrementally (logic → backend → integration)

The driver assignment system should now properly handle online/offline status updates and assign orders to available drivers correctly.
