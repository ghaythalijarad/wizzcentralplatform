# Quick Fix: Merchants Page Data Loading Issue

## Problem
The merchants page is not loading data from the backend. The page shows "0 merchants" even though the API endpoint `/businesses` is working correctly and returning 4 businesses.

## Root Cause
The issue is that the page JavaScript is not executing `loadMerchantsFromDynamoDB()` function. This is likely due to one of:
1. RBAC blocking page access before JavaScript runs
2. Authentication redirect preventing initialization
3. JavaScript error in initialization chain

## Verified Working
✅ Server endpoint `/businesses` returns data correctly (tested with curl)
✅ 4 businesses exist in DynamoDB
✅ Debug mode bypass for RBAC is working

## Quick Fix Options

### Option 1: Enable Debug Mode in Browser Console
Open browser console on merchants page and run:
```javascript
sessionStorage.setItem('debugMode', 'true');
location.reload();
```

### Option 2: Add Debug Mode Script to Page
Add this before the main merchants.js script loads:
```html
<script>
  // Enable debug mode for testing
  sessionStorage.setItem('debugMode', 'true');
  console.log('🧪 Debug mode enabled');
</script>
```

### Option 3: Bypass Auth Check Temporarily
Modify the auth check in merchants.js:
```javascript
// Check authentication silently in background  
const debugMode = sessionStorage.getItem('debugMode') === 'true' || true; // <-- Force bypass
if (!debugMode && !Auth.requireAuthentication()) {
    console.log('❌ Authentication required - redirecting to login');
    return;
}
```

## Testing the Fix
1. Open http://localhost:3000/pages/merchants.html in browser
2. Open Developer Console (F12)
3. Run: `sessionStorage.setItem('debugMode', 'true')`
4. Reload page
5. Check console for: "🧪 Running in debug mode - authentication bypassed"
6. Check for API call: "📊 Fetching merchants..."
7. Should see 4 merchants displayed

## Next Steps
Once confirmed working with debug mode, we can:
1. Create proper development authentication bypass
2. Or configure RBAC to allow merchants page access
3. Or add proper authentication flow

## Server Logs Show
```
🔄 [2025-11-30T14:06:45.417Z] GET /businesses
🧪 Debug mode enabled - bypassing RBAC for /businesses endpoint
📊 Fetching all businesses from WhizzMerchants_Businesses table...
✅ Found 4 businesses in DynamoDB
```

The backend is ready and working!
