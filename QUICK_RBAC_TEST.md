# 🧪 RBAC Testing Guide - Quick Test

## Current Status

✅ **Implemented:**
- RBAC system with Cognito groups
- Automatic navigation filtering (hides inaccessible links)
- Page-level access enforcement
- Enhanced unauthorized page

⚠️ **Testing Phase:**
- Early RBAC check (prevents blank pages) - partially deployed
- Navigation filtering should work NOW

---

## 🎯 Test Plan - Navigation Filtering

### Test User: `zikbiot@yahoo.com`
**Group:** `financial_admin`

### Step 1: Login
1. Go to http://localhost:3000
2. Login with:
   - Email: `zikbiot@yahoo.com`
   - Password: (your password after force change)

### Step 2: Check Sidebar Navigation

**Open the sidebar and check what links you see:**

#### ✅ Should SEE (financial_admin has access):
- 📊 Dashboard
- 💰 Financial Management
- 📦 Orders
- 🏪 Merchants
- 🚗 Drivers

#### ❌ Should NOT SEE (hidden by navigation filter):
- 🎧 Support
- 📣 Promotions
- 🗺️ Regions
- 👥 Customers

### Step 3: Test Navigation Filtering

**Check Browser Console (F12 or Cmd+Option+I):**

Look for these logs:
```
✅ RBAC System loaded
👥 User groups: ["financial_admin"]
👤 Primary role: Financial Admin
🧭 Navigation menu filtered
```

### Step 4: Check Sidebar DOM

**In browser console, run:**
```javascript
// Check which nav items are visible
document.querySelectorAll('.nav-item').forEach(item => {
    const display = window.getComputedStyle(item).display;
    const text = item.textContent.trim();
    console.log(`${display === 'none' ? '❌ HIDDEN' : '✅ VISIBLE'}: ${text}`);
});
```

### Step 5: Test Page Access

**Try accessing allowed page:**
1. Click "Financial Management" in sidebar (or go to `/pages/financial-management.html`)
2. ✅ **Expected:** Page loads normally

**Try accessing restricted page:**
1. Manually type in URL: `http://localhost:3000/pages/support.html`
2. ⚠️ **Current behavior:** Might show blank page then redirect
3. ✅ **Expected (after full fix):** Immediate redirect to unauthorized.html

---

## 🔍 Troubleshooting

### If Navigation Still Shows All Links:

1. **Hard Refresh the Page:**
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`

2. **Check Console for RBAC Logs:**
   ```javascript
   // In browser console:
   console.log('RBAC loaded?', typeof window.RBAC);
   console.log('User groups:', window.RBAC?.getUserGroups());
   console.log('Primary role:', window.RBAC?.getRoleDisplayName());
   ```

3. **Manually Trigger Filter:**
   ```javascript
   // In browser console:
   window.RBAC.filterNavigationMenu();
   ```

4. **Check if Sidebar is Loaded:**
   ```javascript
   // Check if sidebar exists
   console.log('Sidebar exists?', !!document.querySelector('.sidebar'));
   console.log('Nav items count:', document.querySelectorAll('.nav-item').length);
   ```

5. **Check Token Groups:**
   ```javascript
   // Verify token has groups
   const idToken = sessionStorage.getItem('idToken');
   const payload = JSON.parse(atob(idToken.split('.')[1]));
   console.log('Token groups:', payload['cognito:groups']);
   ```

---

## 📊 Test Results Template

**Fill this out after testing:**

### Navigation Filtering:
- [ ] Sidebar shows only allowed pages
- [ ] Restricted pages are hidden
- [ ] Console shows "Navigation menu filtered"

### Page Access:
- [ ] Financial Management page loads ✅
- [ ] Dashboard page loads ✅
- [ ] Support page redirects (might be blank first) ❌
- [ ] Unauthorized page shows user info ✅

### Issues Found:
- Blank pages before redirect: YES / NO
- Navigation not filtering: YES / NO
- Console errors: (describe)

---

## 🎬 Next Steps Based on Results

### If Navigation Filtering WORKS:
✅ **Great!** The main user experience is fixed.
📝 **Next:** Add early check script to prevent blank pages

### If Navigation Filtering DOESN'T WORK:
1. Check browser console for errors
2. Verify RBAC.js is loaded
3. Check sidebar structure (data-page attributes)
4. May need to adjust selectors

---

## 💡 Quick Fixes You Can Try

### Force Navigation Filter:
**After page loads, run in console:**
```javascript
// Wait for sidebar to load, then filter
setTimeout(() => {
    console.log('Forcing navigation filter...');
    window.RBAC.filterNavigationMenu();
}, 2000);
```

### Check What Pages User Can Access:
```javascript
// Test page access for all pages
const pages = [
    'dashboard.html',
    'financial-management.html', 
    'support.html',
    'promotions.html',
    'regions.html',
    'customers.html',
    'merchants.html',
    'drivers.html',
    'orders.html'
];

console.log('=== Page Access Test ===');
pages.forEach(page => {
    const access = window.RBAC.hasPageAccess(page);
    console.log(`${access ? '✅' : '❌'} ${page}`);
});
```

---

## 📝 Report Back

**After testing, please report:**

1. **What you see in the sidebar** (list the visible links)
2. **Console logs** (copy paste the RBAC logs)
3. **Blank page issue** (still happening? which pages?)
4. **Any errors** in browser console

This will help me determine if we need to:
- Adjust navigation filtering selectors
- Add early check to more pages
- Fix sidebar loading timing

---

**Test started:** _______________
**Test completed:** _______________
**Result:** PASS / FAIL / PARTIAL

