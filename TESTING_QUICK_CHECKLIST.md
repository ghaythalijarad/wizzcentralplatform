# 🧪 DASHBOARD TESTING - QUICK CHECKLIST

**URL:** http://localhost:8000/pages/dashboard.html  
**Status:** Server Running ✅

---

## 🎯 WHAT TO DO RIGHT NOW:

### 1. Open Dashboard
The dashboard should already be open in VS Code Simple Browser.

### 2. Open Console (F12 or Cmd+Option+I)
Click on the "Console" tab

### 3. Look for This Line:
```
✅ Dashboard stats loaded from REAL AWS data
```

### 4. Check These Numbers on Dashboard:

| Statistic | Must Show | Why |
|-----------|-----------|-----|
| **Merchants** | **3** | NOT 1 (1 = mock data) |
| **Drivers** | **3** | NOT 1 (1 = mock data) |
| **Promotions** | **5** | NOT 8 (8 = mock data) |

---

## ✅ SUCCESS = See These in Console:

```
✅ AWS dataService initialized
✅ Merchants: 3 (from WhizzMerchants_Businesses)
✅ Drivers: 3 (from WhizzDrivers_dev)
✅ Active Promotions: 5 (from WhizzMerchants_Discounts)
✅ Dashboard stats loaded from REAL AWS data
```

---

## ❌ FAILURE = See These in Console:

```
❌ Failed to load orders
⚠️ AWS credentials not available
⚠️ Failed to load campaigns  ← Should NOT see this
⚠️ Failed to load merchant discounts  ← Should NOT see this
```

---

## 🔧 IF YOU SEE ERRORS:

### Problem: "AccessDenied"
**Solution:** Run `aws configure` and enter your credentials

### Problem: All stats show "0"
**Solution:** 
1. Login to dashboard first: http://localhost:8000/login.html
2. Then go to dashboard

### Problem: Still shows mock data (1 merchant, 1 driver, 8 promotions)
**Solution:** 
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Clear cache and reload

---

## 🎯 THE MAGIC NUMBERS:

```
Merchants: 3  ✅
Drivers: 3    ✅
Promotions: 5 ✅
```

**If you see these three numbers, you're DONE!** 🎉

---

## 📸 WHAT TO SCREENSHOT:

1. Dashboard showing the statistics
2. Console showing "REAL AWS data" message
3. The three magic numbers (3, 3, 5)

---

**Dashboard is open at:** http://localhost:8000/pages/dashboard.html  
**Check the console NOW!** Press F12 or Cmd+Option+I
