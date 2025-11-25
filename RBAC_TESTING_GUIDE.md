# RBAC Enforcement - Testing Guide

## ✅ UPDATED: All Pages Now Enforce RBAC

### Changes Made

#### Updated Pages to Use New RBAC System:
1. ✅ `/pages/orders.html` - Updated to `window.RBAC.enforcePage()`
2. ✅ `/pages/merchants.html` - Updated to `window.RBAC.enforcePage()`
3. ✅ `/pages/drivers.html` - Updated to `window.RBAC.enforcePage()`
4. ✅ `/pages/customers.html` - Updated to `window.RBAC.enforcePage()`
5. ✅ `/pages/promotions.html` - Updated to `window.RBAC.enforcePage()`
6. ✅ `/pages/regions.html` - Updated to `window.RBAC.enforcePage()`
7. ✅ `/pages/support.html` - Updated to `window.RBAC.enforcePage()`
8. ✅ `/pages/dashboard.html` - Updated to `window.RBAC.enforcePage()`
9. ✅ `/pages/financial-management.html` - Updated to `window.RBAC.enforcePage()`

---

## Test Instructions

### Test User: `zikbiot@yahoo.com`
**Group:** `financial_admin`

### Step-by-Step Testing:

1. **Login** at http://localhost:3000
   - Email: `zikbiot@yahoo.com`
   - Password: (your new password after force change)

2. **Open Browser Console** (F12 or Cmd+Option+I)
   - Look for RBAC logs showing:
     ```
     🔐 Loading RBAC System...
     👥 User groups: ["financial_admin"]
     👤 Primary role: Financial Admin
     ```

3. **Try Allowed Pages** (Should Work ✅):
   ```
   http://localhost:3000/pages/dashboard.html
   http://localhost:3000/pages/financial-management.html
   http://localhost:3000/pages/orders.html
   http://localhost:3000/pages/orders-management.html
   http://localhost:3000/pages/merchants.html
   http://localhost:3000/pages/drivers.html
   ```

4. **Try RESTRICTED Pages** (Should Redirect to Unauthorized ❌):
   ```
   http://localhost:3000/pages/support.html
   http://localhost:3000/pages/promotions.html
   http://localhost:3000/pages/regions.html
   http://localhost:3000/pages/customers.html
   ```

### Expected Results:

#### ✅ Allowed Pages:
- Page loads normally
- Console shows: `✅ Access granted: financial-management.html`
- No redirects

#### ❌ Restricted Pages:
- Immediate redirect to `/pages/unauthorized.html`
- Console shows: `🚫 Access denied: support.html`
- Unauthorized page displays:
  - Current Role: "Financial Admin"
  - Groups: "financial_admin"
  - Attempted Page: "support.html"

---

## Console Logs to Look For

### On Page Load:
```javascript
🔐 Loading RBAC System...
✅ RBAC System loaded
👥 User groups: ["financial_admin"]
👤 Primary role: Financial Admin
🛡️ Enforcing RBAC...
📄 Current page: support.html
🔍 Checking access for page: support.html
❌ Access denied - page not in allowed list for any user group
🚫 Access denied: support.html
🚨 Redirecting to unauthorized page...
```

### On Allowed Page:
```javascript
🔐 Loading RBAC System...
✅ RBAC System loaded
👥 User groups: ["financial_admin"]
👤 Primary role: Financial Admin
🛡️ Enforcing RBAC...
📄 Current page: financial-management.html
🔍 Checking access for page: financial-management.html
✅ Access granted through group "financial_admin"
✅ Access granted to page: financial-management.html
```

---

## Troubleshooting

### If RBAC isn't working:

1. **Clear Browser Cache & Session Storage**:
   ```javascript
   // In browser console:
   sessionStorage.clear();
   localStorage.clear();
   location.reload();
   ```

2. **Check Token Groups**:
   ```javascript
   // In browser console:
   const idToken = sessionStorage.getItem('idToken');
   const payload = JSON.parse(atob(idToken.split('.')[1]));
   console.log('Groups:', payload['cognito:groups']);
   ```

3. **Enable Debug Mode**:
   - Add `?authdebug=1` to any URL
   - Shows auth debug overlay with groups and token info

4. **Check RBAC Script is Loaded**:
   ```javascript
   // In browser console:
   console.log('RBAC loaded:', typeof window.RBAC);
   console.log('getUserGroups:', window.RBAC.getUserGroups());
   ```

---

## Quick Test Script

Run this in browser console after logging in:

```javascript
// Test RBAC system
console.log('=== RBAC Test ===');
console.log('Groups:', window.RBAC.getUserGroups());
console.log('Role:', window.RBAC.getRoleDisplayName());
console.log('');

// Test page access
const testPages = [
    'dashboard.html',
    'financial-management.html',
    'support.html',
    'promotions.html'
];

testPages.forEach(page => {
    const access = window.RBAC.hasPageAccess(page);
    console.log(`${access ? '✅' : '❌'} ${page}`);
});
```

---

## Expected Output for financial_admin:

```
=== RBAC Test ===
Groups: ["financial_admin"]
Role: Financial Admin

✅ dashboard.html
✅ financial-management.html
❌ support.html
❌ promotions.html
```

---

## System Status

- ✅ RBAC system implemented
- ✅ All pages updated to use new RBAC
- ✅ Token-based group extraction working
- ✅ Unauthorized page shows user info
- ✅ Read-only mode available
- ✅ Force password change flow working

**Status: Ready for Testing** 🎯

---

## Next Steps After Testing:

1. ✅ Verify financial_admin can't access restricted pages
2. ✅ Test with different user groups
3. ✅ Verify read-only mode for reporting_view group
4. ✅ Test admins group has full access
5. 📝 Implement backend API group validation
6. 📝 Add navigation menu filtering

---

Last Updated: November 9, 2025
