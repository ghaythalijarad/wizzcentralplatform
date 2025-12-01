# 🚀 Bulk Upload Feature - Quick Start Guide

## Current Status
✅ **Implementation Complete**  
✅ **Server Running** on http://localhost:3000  
✅ **Debug Mode Enabled** (bypasses authentication)  

---

## 🔧 How to Test (3 Simple Steps)

### Step 1: Enable Debug Mode
In the browser window showing the merchants page:

1. Press **`Cmd + Option + J`** (Mac) to open Chrome DevTools
2. Click the **Console** tab
3. Paste this command and press Enter:
   ```javascript
   sessionStorage.setItem('debugMode', 'true'); location.reload();
   ```
4. The page will reload with authentication bypassed ✅

---

### Step 2: Access Bulk Upload
1. The merchants page should now load (no login required in debug mode)
2. **Click on any merchant** in the list to view their products
3. Click the **"Bulk Upload Products"** button (top right)

---

### Step 3: Upload Test File
1. Click "Choose File" in the upload modal
2. Navigate to and select:
   ```
   /Users/ghaythallaheebi/WhizzEcoSystem/test-bulk-upload.csv
   ```
3. Review the preview (10 items should appear)
4. Click **"Upload Products"**
5. Watch the progress bar and results!

---

## 📊 Expected Results

### First Upload (New Items)
```
✅ Processed: 10
✅ Created: 10
✅ Updated: 0
✅ Skipped: 0
✅ Errors: 0
```

### Second Upload (Duplicates Test)
Upload the **same file** again:
```
✅ Processed: 10
✅ Created: 0
✅ Updated: 0
✅ Skipped: 10  ← All duplicates detected!
✅ Errors: 0
```

### Third Upload (Update Test)
1. Open `/test-bulk-upload.csv`
2. Change **one price** (e.g., Coca-Cola from 1500 to 2000)
3. Save and upload again:
```
✅ Processed: 10
✅ Created: 0
✅ Updated: 1   ← Price change detected!
✅ Skipped: 9
✅ Errors: 0
```

---

## 🎯 What to Verify

### Deduplication ✅
- Same product name → skipped (no duplicate creation)
- Works with English names: "Coca-Cola 500ml"
- Works with Arabic names: "شاورما دجاج"

### Fingerprinting ✅
- Unchanged products → skipped (saves DynamoDB costs)
- Changed price → detected and updated
- Changed description → detected and updated

### Category Mapping ✅
- "Beverages" → mapped to categoryId
- "Main Courses" → mapped to categoryId
- "Desserts" → mapped to categoryId
- "Appetizers" → mapped to categoryId

### Error Handling ✅
- Missing name → error reported
- Missing price → error reported
- Invalid category → error reported with details

---

## 🛠️ Troubleshooting

### Issue: "Invalid login token" error
**Solution**: Enable debug mode using the console command above

### Issue: Merchants not loading
**Solution**: 
1. Check AWS credentials: `aws sso login --profile wizz-drivers-ghayth-dev`
2. Or use debug mode to bypass AWS requirements

### Issue: Can't find test CSV file
**Solution**: File is located at:
```
/Users/ghaythallaheebi/WhizzEcoSystem/test-bulk-upload.csv
```

### Issue: Upload button not visible
**Solution**: Make sure you clicked on a merchant first to view their products

---

## 📁 Test Data File Contents

The test file contains 10 products:
- **2 Beverages** (Coca-Cola, Pepsi)
- **3 Main Courses** (Grilled Chicken, Beef Burger, Shawarma)
- **2 Desserts** (Chocolate Cake, Tiramisu)
- **2 Appetizers** (French Fries, Hummus)
- **1 Beverage in Arabic** (Orange Juice)

All prices are in IQD (Iraqi Dinar).

---

## 🎓 Key Features Demonstrated

1. **Bulk Upload** - Up to 1,000 items at once
2. **Deduplication** - Prevents duplicate products
3. **Fingerprinting** - Detects unchanged items
4. **Category Mapping** - English & Arabic support
5. **Progress Tracking** - Real-time feedback
6. **Error Handling** - Clear error messages
7. **Validation** - Required field checks
8. **Preview** - Review before upload

---

## ✨ Success Indicators

When everything works correctly, you should see:
- ✅ Progress bar animates smoothly
- ✅ Success message with statistics
- ✅ Products appear in merchant's product list
- ✅ No errors in console
- ✅ Duplicate uploads are skipped
- ✅ Price changes are detected

---

## 🔗 Quick Links

- **Merchants Page**: http://localhost:3000/pages/merchants.html
- **Test CSV**: `/Users/ghaythallaheebi/WhizzEcoSystem/test-bulk-upload.csv`
- **Server Health**: http://localhost:3000/health
- **API Endpoint**: `POST /api/merchants/:merchantId/items/bulk`

---

## 💡 Pro Tips

1. Keep DevTools console open to see debug logs
2. Check Network tab to see API requests/responses
3. Use debug mode for all local testing (no auth needed)
4. Check DynamoDB table to verify data is saved correctly
5. Test edge cases: empty file, malformed CSV, huge file

---

**Ready to test?** Follow the 3 steps above! 🚀
