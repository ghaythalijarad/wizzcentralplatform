# 🔧 Bulk Upload Troubleshooting Guide

## 🚨 Common Upload Errors

---

### Error: "Category not found"

**Error Message:**
```json
{
  "row": 2,
  "name": "Coca Cola",
  "error": "Category \"beverage\" not found. Available categories: Beverages, Coffee, Tea, ..."
}
```

**Cause:**
- Category name is misspelled
- Category name has wrong capitalization
- Category doesn't exist in the system

**Solution:**
✅ Check category spelling exactly:
```csv
❌ beverage        → Must be: Beverages
❌ BEVERAGES       → Must be: Beverages
❌ Beverage        → Must be: Beverages
✅ Beverages       → Correct!
```

**Valid Categories:**
```
Beverages, Coffee, Tea, Pizza, Burgers, Chicken, Salads, 
Sides, Appetizers, Desserts, Main Courses, Sandwiches, 
Bread, Cookies, Snacks & Sweets, Dairy & Milk, Fresh Herbs, 
Meat & Poultry, Vegetables & Fruits, Dry Foods & Grains, 
Dried Spices, Personal Care, Skincare, Hair Care, 
Household Items, Vitamins & Supplements
```

---

### Error: "Missing required field: name"

**Error Message:**
```json
{
  "row": 5,
  "error": "Missing required field: name"
}
```

**Cause:**
- Product name column is empty
- Name column has only spaces

**Solution:**
✅ Ensure every row has a name:
```csv
❌ WRONG:
name,price,category
,1500,Beverages        ← Empty name

✅ CORRECT:
name,price,category
Coca Cola,1500,Beverages
```

---

### Error: "Invalid price format"

**Error Message:**
```json
{
  "row": 3,
  "name": "Pepsi",
  "error": "Price must be a valid number"
}
```

**Cause:**
- Price contains letters, symbols, or spaces
- Price uses commas for thousands
- Price is empty

**Solution:**
✅ Use numbers only:
```csv
❌ WRONG:
price
1,500         ← Has comma
1500 IQD      ← Has text
$15           ← Has symbol
1500.50       ← Has decimal (use 1501)

✅ CORRECT:
price
1500
1400
500
```

---

### Error: "Invalid boolean value for isAvailable"

**Error Message:**
```json
{
  "row": 4,
  "name": "Pizza",
  "error": "isAvailable must be true or false"
}
```

**Cause:**
- Using "yes/no" instead of "true/false"
- Using uppercase "TRUE/FALSE"
- Using "1/0"

**Solution:**
✅ Use lowercase true/false:
```csv
❌ WRONG:
isAvailable
yes           ← Use true
TRUE          ← Use lowercase
1             ← Use true
Yes           ← Use true

✅ CORRECT:
isAvailable
true
false
```

---

### Error: "File is not a valid CSV"

**Error Message:**
```
Error: Unable to parse CSV file
```

**Cause:**
- File is saved as .xlsx or .xls (Excel format)
- File has wrong encoding
- File has special characters

**Solution:**

**In Excel:**
1. File → Save As
2. Choose **"CSV UTF-8 (Comma delimited) (*.csv)"**
3. Click Save

**In Google Sheets:**
1. File → Download
2. Choose **"Comma-separated values (.csv)"**

**Verify file extension:**
```
✅ products.csv          → Correct
❌ products.xlsx         → Wrong format
❌ products.xls          → Wrong format
❌ products.txt          → Wrong format
```

---

### Error: "Duplicate SKU found"

**Error Message:**
```json
{
  "row": 8,
  "name": "Burger",
  "sku": "COKE-330",
  "error": "SKU already exists for a different product"
}
```

**Cause:**
- Two different products have the same SKU
- SKU already exists in the database

**Solution:**
✅ Make each SKU unique:
```csv
❌ WRONG:
name,sku
Coca Cola,COKE-330
Pepsi,COKE-330        ← Same SKU!

✅ CORRECT:
name,sku
Coca Cola,COKE-330
Pepsi,PEPSI-330       ← Unique SKU
```

---

### Error: "Headers do not match expected format"

**Error Message:**
```
Error: CSV headers are incorrect or missing
```

**Cause:**
- Header row is missing
- Header names are misspelled
- Headers are in wrong order

**Solution:**
✅ Use exact header row (copy and paste):
```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
```

**Common mistakes:**
```csv
❌ Name (capital N)          → Must be: name
❌ product_name              → Must be: name
❌ Category_Name             → Must be: category
❌ stock                     → Must be: stockQty
❌ available                 → Must be: isAvailable
```

---

### Error: "Empty CSV file"

**Error Message:**
```
Error: CSV file contains no data rows
```

**Cause:**
- File only has header row
- All data rows are empty

**Solution:**
✅ Add at least one product:
```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Coca Cola,,1500,,Beverages,COKE-330,,can,true,0,100,
```

---

### Error: "Failed to upload: Network error"

**Error Message:**
```
Error: Network request failed
```

**Cause:**
- Internet connection lost
- Server is not running
- File is too large

**Solution:**
1. ✅ Check internet connection
2. ✅ Verify server is running (http://localhost:3000)
3. ✅ Try smaller file (split into multiple uploads)
4. ✅ Refresh page and try again

---

### Error: "Merchant ID not found"

**Error Message:**
```json
{
  "error": "Business not found"
}
```

**Cause:**
- Not logged in
- Merchant account not active
- Wrong merchant ID

**Solution:**
1. ✅ Log in to your merchant account
2. ✅ Verify your account is active
3. ✅ Check you're on the correct merchant page

---

### Error: "Products showing as uncategorized"

**Error Symptom:**
```
Products in GlobalProducts table have:
categoryId = "uncategorized"
```

**Cause:**
- CSV file uses category names that don't exist in database
- System falls back to `'uncategorized'` instead of rejecting

**Solution:**

**Step 1: Check what categories you used**
```bash
# Extract unique categories from your CSV
cut -d',' -f5 your-file.csv | tail -n +2 | sort | uniq
```

**Step 2: Compare with valid categories**
```bash
# Get valid categories from database
aws dynamodb scan --table-name WhizzMerchants_Categories \
  --region us-east-1 \
  --filter-expression "isActive = :active" \
  --expression-attribute-values '{":active":{"BOOL":true}}' \
  --output json | jq -r '.Items[].name.S' | sort
```

**Step 3: Add missing categories**
Create a script to add the missing categories (see: `fix-missing-categories.js`)

**Step 4: Re-upload CSV file**
Once categories exist, re-upload the same CSV file. The system will:
- Match products by SKU
- Update them with correct categoryId
- No duplicates created

**Prevention:**
Always use exact category names from the official list in:
- BULK_UPLOAD_GUIDE.md
- CSV_FORMAT_REFERENCE.md

---

## 🐛 File Format Issues

### Issue: Excel adds extra quotes

**Problem:**
```csv
"name","description","price"
"Coca Cola","Classic drink","1500"
```

**Solution:**
Save as **CSV UTF-8** format (not just CSV)

---

### Issue: Special characters broken

**Problem:**
Product names with Arabic/special characters show as `????`

**Solution:**
1. Save file as **UTF-8 encoding**
2. In Excel: Save As → CSV UTF-8
3. In Notepad: Save As → Encoding: UTF-8

---

### Issue: Extra blank rows

**Problem:**
```csv
name,price,category
Coca Cola,1500,Beverages

                          ← Empty rows
Pepsi,1400,Beverages
```

**Solution:**
Delete all empty rows before uploading

---

### Issue: Columns shifted

**Problem:**
```csv
name,description,price,category
Coca Cola,1500,Beverages     ← Missing description column!
```

**Solution:**
Add empty commas for missing columns:
```csv
name,description,price,category
Coca Cola,,1500,Beverages    ← Correct
```

---

## 🔍 Validation Checklist

Before reporting an issue, check:

- [ ] **File format**: Saved as .csv (not .xlsx)
- [ ] **Headers**: First row exactly matches template
- [ ] **Required fields**: name, price, category are filled
- [ ] **Category**: Matches official list exactly
- [ ] **Price**: Numbers only, no symbols
- [ ] **Boolean**: Lowercase true/false
- [ ] **Encoding**: UTF-8 for special characters
- [ ] **Empty rows**: No blank rows in the middle
- [ ] **File size**: Under 5MB (or split into chunks)

---

## 🧪 Test Your File

Use this **minimal test** to verify your format:

```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Test Product,,100,,Beverages,TEST-001,,can,true,0,10,
```

**Steps:**
1. Copy the 2 lines above
2. Save as `test.csv`
3. Upload this file first
4. If it works → Your format is correct!
5. If it fails → Follow error message instructions

---

## 📊 Check Upload Results

After upload completes:

### Success Response:
```json
{
  "processed": 10,
  "created": 8,
  "updated": 2,
  "skipped": 0,
  "errors": []
}
```

✅ All good! All 10 products uploaded successfully.

### Partial Success:
```json
{
  "processed": 10,
  "created": 7,
  "updated": 2,
  "skipped": 0,
  "errors": [
    {
      "row": 5,
      "name": "Pizza",
      "error": "Category \"pizza\" not found"
    }
  ]
}
```

⚠️ 9 products succeeded, 1 failed. Fix row 5 and re-upload.

---

## 🆘 Still Having Issues?

### Quick Fixes:

1. **Download fresh template**: `sample-bulk-upload-template.csv`
2. **Copy your data** into the template
3. **Test with 1-2 products first**
4. **Check browser console** for detailed errors (F12)

### Contact Support:

Include this information:
- ✉️ **Your CSV file** (first 5 rows)
- 📸 **Screenshot of error**
- 🆔 **Your merchant ID**
- 🖥️ **Browser** (Chrome, Safari, etc.)

---

## 💡 Pro Tips to Avoid Errors

1. **Use the template**: Start with `sample-bulk-upload-template.csv`
2. **Test small**: Upload 5 products first
3. **Keep it simple**: Only fill required fields initially
4. **Check categories**: Copy from the official list
5. **No fancy formatting**: Plain text only
6. **Save correctly**: Always CSV UTF-8
7. **Remove blanks**: Delete empty rows
8. **Unique SKUs**: Don't repeat SKU codes

---

## 📚 Related Guides

- **BULK_UPLOAD_GUIDE.md** - Complete upload guide
- **CSV_FORMAT_REFERENCE.md** - Format specifications
- **BULK_UPLOAD_QUICKSTART.md** - 2-minute quick start

---

**Last Updated**: November 30, 2025
