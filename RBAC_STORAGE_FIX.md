# RBAC Storage Location Fix

## Problem
Admin users were seeing "🔒 Read-Only Mode" banner and limited navigation menu items despite being logged in with admin credentials.

## Root Cause
**Storage Location Mismatch:**
- Authentication system stores tokens in `sessionStorage`
- RBAC system was only checking `localStorage`
- Result: RBAC couldn't find the `idToken` → No groups detected → No permissions granted

## Solution
Updated `rbac.js` to check **both** `sessionStorage` (primary) and `localStorage` (fallback):

### File: `frontend/assets/js/rbac.js`

**Changed Method 1: `getUserGroups()`** (Line ~70-85)
```javascript
getUserGroups() {
    try {
        // Check both sessionStorage and localStorage for idToken
        const idToken = sessionStorage.getItem('idToken') || localStorage.getItem('idToken');
        if (!idToken) {
            console.log('🔍 RBAC: No idToken found in sessionStorage or localStorage');
            return [];
        }
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        const groups = payload['cognito:groups'] || [];
        console.log('🔐 RBAC: User groups from token:', groups);
        return groups;
    } catch (error) {
        console.error('RBAC: Error getting groups:', error);
        return [];
    }
}
```

**Changed Method 2: `fetchMe()`** (Line ~305-320)
```javascript
async fetchMe() {
    try {
        // Check both sessionStorage and localStorage for idToken
        const idToken = sessionStorage.getItem('idToken') || localStorage.getItem('idToken');
        if (!idToken) {
            console.log('🔍 RBAC.fetchMe: No idToken found');
            return { email: 'Guest', roles: [] };
        }
        
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        const email = payload.email || payload['cognito:username'] || 'User';
        const groups = payload['cognito:groups'] || [];
        
        console.log('👤 RBAC.fetchMe:', { email, groups });
        // ...rest of method
    }
}
```

## Added Debug Logging
- `getUserGroups()`: Logs when no token found and which groups are detected
- `fetchMe()`: Logs user email and groups for debugging

## Testing Steps

### 1. Hard Refresh Browser
```bash
# Mac: Cmd + Shift + R
# Windows/Linux: Ctrl + Shift + F5
```

### 2. Verify RBAC Debug Tool
```
URL: http://localhost:8080/pages/rbac-debug.html
```

**Expected Output:**
- ✅ **ID Token:** Present
- ✅ **User Groups:** Shows `admin` or `admins` 
- ✅ **All Permissions:** Read ✓ | Write ✓
- ✅ **All Pages:** Access Granted
- ✅ **Is Read-Only:** No ✓

### 3. Verify Dashboard
```
URL: http://localhost:8080/pages/dashboard.html
```

**Expected:**
- ✅ No "🔒 Read-Only Mode" banner
- ✅ All navigation menu items visible
- ✅ Add/Edit/Delete buttons enabled

### 4. Check Browser Console
```javascript
// In browser console, verify groups are detected:
RBAC.getUserGroups()
// Should return: ['admin'] or ['admins']
```

## Files Changed
1. ✅ `frontend/assets/js/rbac.js`
   - Updated `getUserGroups()` to check sessionStorage first
   - Updated `fetchMe()` to check sessionStorage first
   - Added debug logging

## Previous Fixes (Already Applied)
1. ✅ Added both `admin` and `admins` group configurations
2. ✅ Fixed `isReadOnly()` to check both group names
3. ✅ Fixed `can()` permission method to check both group names
4. ✅ Created RBAC debug tool (`rbac-debug.html`)

## Related Documentation
- `RBAC_ADMIN_ACCESS_FIX.md` - Original RBAC group configuration fix
- `REGIONS_PAGE_FIX_COMPLETE.md` - Service regions map display fix

## Status
✅ **Complete** - Ready to test after hard refresh

## Date
2025-11-28
