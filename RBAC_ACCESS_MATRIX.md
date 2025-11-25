# RBAC Group Access Matrix - Updated November 10, 2025

## Complete Access Overview

### 👑 admins (Precedence: 1)
**Full System Access**
- ✅ ALL PAGES (wildcard access)

---

### 💰 financial_admin (Precedence: 10)
**Financial Management & Reporting**
```
✅ Dashboard
✅ Financial Management
✅ Orders
✅ Merchants (view)
✅ Drivers (view)

❌ Support
❌ Customers
❌ Promotions
❌ Regions
```

---

### 🎧 support_admin (Precedence: 20) - **UPDATED**
**Customer Support & Service**
```
✅ Dashboard
✅ Support
✅ Support (Merchants)
✅ Support (Production)
✅ Customers
✅ Orders
✅ Merchants        ← ADDED
✅ Drivers          ← ADDED

❌ Financial Management
❌ Promotions
❌ Regions
```

**Rationale:** Support admins need to view merchant and driver info to resolve customer issues

---

### 🏪 merchants_admin (Precedence: 30)
**Merchant Management**
```
✅ Dashboard
✅ Merchants
✅ Support (Merchants)
✅ Orders
✅ Promotions
✅ Regions
✅ Regions Management

❌ Financial Management
❌ Drivers
❌ Customers
❌ Support
```

---

### 🚗 drivers_admin (Precedence: 40) - **UPDATED**
**Driver Management ONLY**
```
✅ Dashboard
✅ Drivers

❌ Orders          ← REMOVED
❌ Regions         ← REMOVED
❌ All other pages
```

**Rationale:** Minimal access - only manage driver accounts

---

### 👥 customers_admin (Precedence: 50)
**Customer Account Management**
```
✅ Dashboard
✅ Customers
✅ Orders
✅ Support

❌ Financial Management
❌ Drivers
❌ Merchants
❌ Promotions
❌ Regions
```

---

### 📢 campaigns_admin (Precedence: 60)
**Marketing & Campaigns**
```
✅ Dashboard
✅ Promotions
✅ Customers (view)
✅ Merchants (view)

❌ Financial Management
❌ Support
❌ Drivers
❌ Orders
❌ Regions
```

---

### 📊 reporting_view (Precedence: 100)
**Read-Only Reports** (All edit buttons disabled)
```
✅ Dashboard
✅ Orders (view only)
✅ Financial Management (view only)
✅ Merchants (view only)
✅ Drivers (view only)
✅ Customers (view only)

❌ Support
❌ Promotions
❌ Regions

🔒 READ-ONLY MODE ACTIVE
```

---

## Test Scenarios

### Test User: g87_a@outlook.com
**Group:** drivers_admin  
**User ID:** c4f89438-7021-704e-f497-66bc77e3bddd

#### Expected Behavior:
1. **Login** → Should see only Dashboard + Drivers in sidebar
2. **Sidebar Shows:**
   ```
   ✅ Dashboard
   ✅ Drivers
   ```
3. **Sidebar HIDES:**
   ```
   ❌ Orders          (now hidden)
   ❌ Regions         (now hidden)
   ❌ Financial
   ❌ Merchants
   ❌ Customers
   ❌ Support
   ❌ Promotions
   ```
4. **Direct URL Test:**
   - Try: `/pages/orders.html` → Redirect to unauthorized
   - Try: `/pages/regions.html` → Redirect to unauthorized
   - Try: `/pages/drivers.html` → Load successfully

---

## Changes Made Today

### drivers_admin Access Reduced:
**Before:**
```javascript
allowedPages: ['dashboard.html', 'drivers.html', 'orders.html', 'orders-management.html', 'regions.html']
permissions: ['manage_drivers', 'assign_orders']
```

**After:**
```javascript
allowedPages: ['dashboard.html', 'drivers.html']
permissions: ['manage_drivers']
```

### Files Updated:
1. `/frontend/assets/js/rbac.js` - Main RBAC configuration
2. `/frontend/assets/js/rbac-early-check.js` - Early access check

---

## Quick Test Commands

### Check Current User Groups:
```javascript
// In browser console after login:
console.log('Groups:', window.RBAC.getUserGroups());
console.log('Role:', window.RBAC.getRoleDisplayName());
```

### Test Page Access:
```javascript
// Check specific pages:
console.log('Drivers:', window.RBAC.hasPageAccess('drivers.html'));     // true
console.log('Orders:', window.RBAC.hasPageAccess('orders.html'));       // false
console.log('Regions:', window.RBAC.hasPageAccess('regions.html'));     // false
```

---

## Business Justification

### Why Minimal Access for drivers_admin?

**Option Chosen: Minimal Access**
- ✅ Drivers page - Manage driver accounts, status, documents
- ✅ Dashboard - Overview and quick stats
- ❌ Orders - Not needed (order assignment can be handled by operations team)
- ❌ Regions - Not needed (region management separate concern)

**If you need to restore Orders/Regions access:**
Change the configuration back to:
```javascript
allowedPages: ['dashboard.html', 'drivers.html', 'orders.html', 'regions.html']
```

---

## Summary

| Group | Pages Count | Primary Function |
|-------|------------|------------------|
| admins | ALL | Full system access |
| financial_admin | 5 | Financial management |
| support_admin | 6 | Customer support |
| merchants_admin | 7 | Merchant relations |
| **drivers_admin** | **2** | **Driver management only** |
| customers_admin | 4 | Customer accounts |
| campaigns_admin | 4 | Marketing campaigns |
| reporting_view | 6 | Read-only reports |

---

**Status:** ✅ Updated and Ready for Testing  
**Last Updated:** November 10, 2025  
**Next Step:** Refresh browser and test with g87_a@outlook.com
