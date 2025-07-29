# Dashboard Customers Table Configuration Fix

## Issue
The dashboard was showing "Error" for the Customers section instead of displaying the correct count of 4 customers, even though the `WizzUser_users_dev` table exists in DynamoDB with customer records.

## Root Cause
The dashboard was configured to load customers from the wrong table name:
- **Incorrect**: `wizzcentral-backend-customers-dev` (table doesn't exist)
- **Correct**: `WizzUser_users_dev` (actual table with 4 customer records)

## Files Modified

### 1. `/dashboard.js`
**Change**: Updated table configuration in `loadDashboardStats()` function
```javascript
// Before
customersCount: 'wizzcentral-backend-customers-dev',

// After  
customersCount: 'WizzUser_users_dev',
```

### 2. `/backend/serverless.yml`
**Change**: Fixed environment variable for customers table
```yaml
# Before
CUSTOMERS_TABLE: "${self:service}-customers-${self:provider.stage}"

# After
CUSTOMERS_TABLE: "WizzUser_users_${self:provider.stage}"
```

## Expected Result
- Dashboard customers section should now display "4" instead of "Error"
- No more DynamoDB table not found errors for customers
- Consistent table naming across all components

## Deployment Details
- **Commit**: `88475c17`
- **Date**: $(date)
- **Auto-deployment**: Via AWS Amplify (triggered by Git push)
- **Status**: Deployed to production

## Verification Steps
1. Open WizzCentral dashboard
2. Check that Customers section shows "4" instead of "Error"
3. Verify no console errors related to DynamoDB table access
4. Confirm other dashboard sections still work correctly

## Related Files (Already Correctly Configured)
- `data-service.js` - Already using `WizzUser_users_dev` ✓
- `customers.js` - Already using `WizzUser_users_dev` ✓

## Previous Related Fixes
- Merchant discounts loading fix (commit `d983892a`)
- Merchant status update validation (commit `75fb91da`)
