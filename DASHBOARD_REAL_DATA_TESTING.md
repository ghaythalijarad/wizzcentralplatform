# 🧪 DASHBOARD REAL DATA TESTING GUIDE

**Date:** November 4, 2025  
**Commit:** `a075c176`  
**Status:** Ready for Testing

---

## 🎯 WHAT WAS FIXED

### Problem:
- Dashboard was loading MOCK data from API files
- Showed incorrect statistics from mock campaigns/discounts
- Not displaying real production data

### Solution:
- **REMOVED** all mock API script references:
  - ❌ `orders-api.js` (mock data)
  - ❌ `campaigns-api.js` (mock data)
  - ❌ `merchant-discounts-api.js` (mock data)

- **NOW USING** only real DynamoDB data via `dataService`:
  - ✅ `WizzUser_users_dev` (real customers)
  - ✅ `WhizzMerchants_Businesses` (real merchants)
  - ✅ `WhizzDrivers_dev` (real drivers)
  - ✅ `WizzOrders` (real orders)
  - ✅ `WhizzMerchants_Discounts` (real promotions)

---

## 📊 EXPECTED REAL DATA

Based on your actual DynamoDB tables:

| Statistic | Expected Value | Source Table |
|-----------|---------------|--------------|
| **Total Customers** | TBD | WizzUser_users_dev |
| **Active Merchants** | **3** | WhizzMerchants_Businesses |
| **Online Drivers** | **3** | WhizzDrivers_dev |
| **Orders Today** | **1** (if created today) | WizzOrders |
| **Revenue Today** | **Amount from today's orders** | WizzOrders |
| **Support Tickets** | **0** | (No table yet) |
| **Active Promotions** | **5** | WhizzMerchants_Discounts |

---

## 🧪 TESTING STEPS

### 1. Open Dashboard in Browser

```bash
# Local: http://localhost:8000/pages/dashboard.html
# Or just refresh your current browser tab
```

### 2. Open Browser Console

- **Chrome/Edge:** Press `F12` or `Cmd+Option+I` (Mac)
- Go to **Console** tab

### 3. Look for These Console Messages

**✅ SUCCESS Messages (what you SHOULD see):**

```
🔧 Dashboard: Initializing navigation...
✅ Dashboard: Navigation initialized successfully
✅ AWS dataService initialized
📊 Scanning DynamoDB tables for real data...
✅ Customers: [number] (from WizzUser_users_dev)
✅ Merchants: 3 (from WhizzMerchants_Businesses)
✅ Drivers: 3 (from WhizzDrivers_dev)
✅ Found [number] orders in WizzOrders table
✅ Orders Today: [number]
✅ Revenue Today: $[amount]
✅ Active Promotions: 5 (from WhizzMerchants_Discounts)
✅ Dashboard stats loaded from REAL AWS data
```

**❌ ERROR Messages (what you should NOT see):**

```
⚠️ Failed to load orders
⚠️ Failed to load campaigns
⚠️ Failed to load merchant discounts
❌ Failed to load real AWS data
```

### 4. Verify Dashboard Display

Check that the statistics cards show:

- [ ] **Total Customers:** Shows actual number (not 0, not mock data)
- [ ] **Active Merchants:** Shows **3** (real count)
- [ ] **Online Drivers:** Shows **3** (real count)
- [ ] **Orders Today:** Shows actual today's orders (may be 0 if no orders today)
- [ ] **Revenue Today:** Shows actual revenue (may be $0 if no orders today)
- [ ] **Support Tickets:** Shows **0** (expected, no table yet)
- [ ] **Active Promotions:** Shows **5** (real active discounts)

### 5. Verify Data Source Indicator

At the top of the dashboard page, you should see:

```
✅ Live Data
Displaying real-time data from AWS DynamoDB
```

**Color:** Green/Blue background (not red/orange)

---

## 🔍 DEBUGGING GUIDE

### If Dashboard Shows All Zeros:

#### Check 1: AWS Credentials

```bash
# Run this command to verify AWS credentials
aws sts get-caller-identity
```

**Expected output:**
```json
{
    "UserId": "...",
    "Account": "...",
    "Arn": "arn:aws:iam::..."
}
```

**If it fails:** Run `aws configure` to set up credentials

#### Check 2: DynamoDB Table Access

```bash
# Test table access
aws dynamodb scan --table-name WhizzMerchants_Businesses --limit 1 --select COUNT
```

**Expected output:**
```json
{
    "Count": 3,
    "ScannedCount": 3
}
```

**If it fails:** Check IAM permissions

#### Check 3: Browser Console Errors

Look for specific error messages:

- **"dataService not available"** → data-service.js not loaded
- **"AccessDenied"** → IAM permissions issue
- **"ResourceNotFoundException"** → Table doesn't exist
- **"Token expired"** → Re-login required

### If Some Statistics Show Zeros:

#### Orders Today = 0:
**Reason:** No orders created today (Nov 4, 2025)

**Verify:**
```bash
aws dynamodb scan --table-name WizzOrders --limit 10
```

Check if any order has `orderDate` or `createdAt` = today's date

#### Revenue Today = $0:
**Reason:** Same as above - no orders today

#### Customers = 0:
**Check:**
```bash
aws dynamodb scan --table-name WizzUser_users_dev --limit 1 --select COUNT
```

### If Mock Data Still Appears:

#### Clear Browser Cache:
1. Open DevTools (F12)
2. Right-click **Refresh** button
3. Click **"Empty Cache and Hard Reload"**

#### Verify Script References:
```bash
# Check dashboard.html doesn't have mock API scripts
grep -n "orders-api.js\|campaigns-api.js\|merchant-discounts-api.js" frontend/pages/dashboard.html
```

**Expected:** No results (scripts removed)

---

## 📋 VERIFICATION CHECKLIST

### Before Testing:
- [ ] Local server running on port 8000
- [ ] AWS credentials configured (`aws sts get-caller-identity` works)
- [ ] Browser cache cleared
- [ ] Console open and ready

### During Testing:
- [ ] Dashboard page loads without errors
- [ ] Console shows "✅ AWS dataService initialized"
- [ ] Console shows "✅ Merchants: 3"
- [ ] Console shows "✅ Drivers: 3"
- [ ] Console shows "✅ Active Promotions: 5"
- [ ] Console shows "✅ Dashboard stats loaded from REAL AWS data"
- [ ] Data source indicator shows "Live Data" (green)

### Statistics Display:
- [ ] Merchants count = **3** (not 0, not 1)
- [ ] Drivers count = **3** (not 0, not 1)
- [ ] Promotions count = **5** (not 0, not 8)
- [ ] All numbers use real data (not mock data)

---

## 🚀 DEPLOYMENT

Once local testing is successful:

```bash
# Push to production
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

git push origin main
git push amplify main
```

Then verify on production URL:
- Wait for AWS Amplify build to complete
- Open production dashboard
- Repeat testing steps above

---

## 📊 DATA VERIFICATION COMMANDS

### Quick Check All Tables:

```bash
# Check Merchants (should be 3)
aws dynamodb scan --table-name WhizzMerchants_Businesses --select COUNT

# Check Drivers (should be 3)
aws dynamodb scan --table-name WhizzDrivers_dev --select COUNT

# Check Orders (should be 1)
aws dynamodb scan --table-name WizzOrders --select COUNT

# Check Discounts (should be 5)
aws dynamodb scan --table-name WhizzMerchants_Discounts --select COUNT

# Check Customers
aws dynamodb scan --table-name WizzUser_users_dev --select COUNT
```

### Get Sample Data:

```bash
# See actual order data
aws dynamodb scan --table-name WizzOrders --limit 1

# See actual merchant data
aws dynamodb scan --table-name WhizzMerchants_Businesses --limit 1

# See actual discount data
aws dynamodb scan --table-name WhizzMerchants_Discounts --limit 1
```

---

## ✅ SUCCESS CRITERIA

Dashboard is working correctly when:

1. ✅ **Console shows real data loading** (no mock API messages)
2. ✅ **Merchants count = 3** (from WhizzMerchants_Businesses)
3. ✅ **Drivers count = 3** (from WhizzDrivers_dev)
4. ✅ **Promotions count = 5** (from WhizzMerchants_Discounts)
5. ✅ **Data source indicator = "Live Data"** (green)
6. ✅ **No console errors** about failed API calls

---

## 🎯 NEXT STEPS

Once dashboard shows real data:

1. **Create test order** for today to verify Orders Today counter
2. **Add more merchants/drivers** to see counts increase
3. **Implement Support Tickets** table and API
4. **Add real-time updates** (auto-refresh every 30 seconds)

---

## 📞 TROUBLESHOOTING CONTACT

If you encounter issues:

1. **Capture console logs** (copy all messages)
2. **Take screenshot** of dashboard statistics
3. **Run verification commands** above
4. **Share results** for debugging

---

**Current Status:** Ready for Testing  
**Expected Result:** Real data from DynamoDB tables  
**Mock Data:** Removed completely

---

## 🔄 HOW TO TEST RIGHT NOW

```bash
# 1. Ensure server is running
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
lsof -ti:8000  # Should show a process ID

# 2. Open browser (if not already open)
open http://localhost:8000/pages/dashboard.html

# 3. Hard refresh browser
# Mac: Cmd+Shift+R
# Windows: Ctrl+Shift+R

# 4. Check console for messages
# Should see "✅ Dashboard stats loaded from REAL AWS data"

# 5. Verify merchant count shows 3 (not 1)
```

---

**Ready to Test! 🚀**

Open http://localhost:8000/pages/dashboard.html and check the console!
