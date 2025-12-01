# 📦 Bulk Product Upload Guide

## Overview
This guide will help you upload multiple products to your merchant account at once using a CSV file. This is much faster than adding products one by one!

---

## 🎯 What You'll Need

1. **A CSV file** with your products (or use our template)
2. **Your merchant account** logged into the platform
3. **Product information** (names, prices, categories)

---

## 📋 Step 1: Prepare Your CSV File

### Download the Template
You can download our sample template file: `sample-bulk-upload-template.csv`

### CSV File Format

Your CSV file must have these **column headers** in the first row:

```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
```

### Required Columns (Must Have Values)

| Column | Description | Example |
|--------|-------------|---------|
| **name** | Product name | `Coca Cola` |
| **price** | Price (numbers only, no symbols) | `1500` |
| **category** | Category name (see list below) | `Beverages` |

### Optional Columns (Can Be Empty)

| Column | Description | Example |
|--------|-------------|---------|
| **description** | Product details | `Classic Coca Cola drink` |
| **currency** | Currency code | `IQD` (default) |
| **sku** | Stock Keeping Unit (unique ID) | `COKE-CAN-330` |
| **barcode** | Product barcode | `5449000000996` |
| **portion** | Size/portion | `can`, `bottle`, `large` |
| **isAvailable** | Is product available? | `true` or `false` |
| **vatRate** | VAT percentage | `0`, `5`, `10` |
| **stockQty** | Quantity in stock | `100` |
| **imageUrl** | Product image URL | `https://example.com/image.jpg` |

---

## 📝 Step 2: Fill In Your Products

### Example CSV (Correct Format)

```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Coca Cola,Classic Coca Cola drink,1500,IQD,Beverages,COKE-CAN-330,5449000000996,can,true,0,100,https://example.com/cocacola.jpg
Pepsi,Refreshing Pepsi cola,1400,IQD,Beverages,PEPSI-CAN-330,012000001765,can,true,0,150,https://example.com/pepsi.jpg
Margherita Pizza,Classic cheese and tomato pizza,8000,IQD,Pizza,PIZZA-MARG-L,,large,true,5,50,https://example.com/pizza.jpg
Burger Deluxe,Beef burger with cheese,6000,IQD,Burgers,BURGER-DELUXE,,standard,true,5,30,https://example.com/burger.jpg
```

### Important Rules

✅ **DO:**
- Keep the header row exactly as shown
- Use commas to separate columns
- Use numbers only for price (no currency symbols)
- Use `true` or `false` for isAvailable (lowercase)
- Leave optional fields empty (just use commas: `,,`)

❌ **DON'T:**
- Don't add extra spaces around values
- Don't use currency symbols (₹, $, IQD)
- Don't use commas in numbers (use `1500` not `1,500`)
- Don't skip the header row
- Don't change column order

---

## 🗂️ Step 3: Choose the Right Category

Your products **must** use one of these categories (spelling must be exact):

### Food & Beverages
- **Beverages** - Soft drinks, juices, water
- **Coffee** - Coffee drinks and beans
- **Tea** - Tea varieties
- **Pizza** - All pizza types
- **Burgers** - Burger meals
- **Chicken** - Chicken dishes
- **Salads** - Fresh salads
- **Sides** - Side dishes, fries
- **Appetizers** - Starters
- **Desserts** - Sweet treats
- **Main Courses** - Main meals
- **Sandwiches** - All sandwiches
- **Bread** - Bread products

### Groceries & Snacks
- **Cookies** - Cookies and biscuits
- **Snacks & Sweets** - Chips, candy
- **Dairy & Milk** - Milk, cheese, yogurt
- **Fresh Herbs** - Herbs and spices
- **Meat & Poultry** - Fresh meat
- **Vegetables & Fruits** - Fresh produce
- **Dry Foods & Grains** - Rice, pasta, beans
- **Dried Spices** - Spices and seasonings

### Personal Care
- **Personal Care** - Body care items
- **Skincare** - Skincare products
- **Hair Care** - Shampoo, conditioner
- **Household Items** - Cleaning supplies
- **Vitamins & Supplements** - Health supplements

> ⚠️ **Category Tip**: If you need a category that's not listed, contact support to add it before uploading.

---

## 🚀 Step 4: Upload Your File

### Via Web Interface (Coming Soon)
1. Log in to your merchant account
2. Go to **Products** → **Bulk Upload**
3. Click **Choose File** and select your CSV
4. Click **Upload**
5. Wait for processing
6. Review the results

### Via API (For Developers)

```bash
curl -X POST http://localhost:3000/api/merchants/YOUR_BUSINESS_ID/items/bulk \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your-products.csv"
```

---

## 🔍 Step 5: Understanding Results

After upload, you'll see a summary:

```json
{
  "processed": 10,
  "created": 7,
  "updated": 2,
  "skipped": 1,
  "errors": []
}
```

### What Each Field Means

- **processed**: Total products in your file
- **created**: New products added
- **updated**: Existing products updated
- **skipped**: Products already up-to-date
- **errors**: Problems found (see details below)

---

## 🎯 Smart Duplicate Detection

The system automatically detects if a product already exists by checking:

1. **SKU** (if you provide it) - Highest priority
2. **Barcode** (if you provide it) - Medium priority  
3. **Name + Category** - Fallback matching

### What This Means for You

✅ **Upload the same file twice?** → Products will be **updated**, not duplicated

✅ **Same product, different price?** → Price will be **updated**

✅ **Same product name but different SKU?** → Treated as **different products**

---

## ❌ Common Errors and Solutions

### Error: "Category not found"
**Problem**: Category name doesn't match exactly  
**Solution**: Check spelling and capitalization against the category list above

```csv
❌ Wrong: category = "beverage" (lowercase)
✅ Correct: category = "Beverages"
```

### Error: "Missing required field: name"
**Problem**: Product name is empty  
**Solution**: Make sure every row has a name

```csv
❌ Wrong: ,Classic drink,1500,IQD,Beverages
✅ Correct: Coca Cola,Classic drink,1500,IQD,Beverages
```

### Error: "Invalid price"
**Problem**: Price contains non-numeric characters  
**Solution**: Use numbers only, no symbols

```csv
❌ Wrong: price = "1,500 IQD"
✅ Correct: price = 1500
```

### Error: "Invalid boolean value"
**Problem**: isAvailable is not true/false  
**Solution**: Use lowercase true or false

```csv
❌ Wrong: isAvailable = "yes" or "TRUE"
✅ Correct: isAvailable = true
```

---

## 💡 Pro Tips

### 1. Start Small
- Upload 5-10 products first to test
- Once successful, upload the rest

### 2. Use SKUs for Better Control
- SKUs help prevent duplicates
- Make them meaningful: `COKE-CAN-330` is better than `PROD001`

### 3. Keep a Backup
- Save your original CSV file
- You can re-upload if needed

### 4. Use Consistent Names
- "Coca Cola" instead of "Coke", "coca cola", "CocaCola"
- This helps customers find products

### 5. Pricing Strategy
- Use whole numbers (1500 not 1500.50)
- Keep currency consistent (stick to IQD)

### 6. Stock Management
- Update stockQty regularly
- Set isAvailable=false instead of deleting products

---

## 📊 Example: Complete Product Entry

Here's a perfect example with all fields:

```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Coca Cola Original,Classic Coca Cola carbonated soft drink 330ml can,1500,IQD,Beverages,COKE-ORIG-330,5449000000996,can,true,0,100,https://cdn.example.com/products/cocacola-330ml.jpg
```

---

## 🔄 Updating Existing Products

To update products that are already in your catalog:

1. **Include the same SKU** in your CSV
2. **Change the values** you want to update
3. **Upload the file** - existing products will be updated

### Example: Price Update

**Original product:**
```csv
Coca Cola,Classic drink,1500,IQD,Beverages,COKE-330,...
```

**Upload this to update price:**
```csv
Coca Cola,Classic drink,1800,IQD,Beverages,COKE-330,...
```

Result: Price changes from 1500 → 1800

---

## 📞 Need Help?

### Before Uploading
- Review this guide
- Check your CSV format
- Verify category names
- Test with a small file first

### If You Get Errors
- Read the error message carefully
- Check the specific row number mentioned
- Fix the issue in your CSV
- Re-upload

### Still Stuck?
Contact support with:
- Your CSV file
- Error message screenshot
- Merchant ID

---

## 🎓 Quick Checklist

Before uploading, verify:

- [ ] CSV has the correct header row
- [ ] All products have name, price, and category
- [ ] Categories match the official list exactly
- [ ] Prices are numbers only (no symbols)
- [ ] Boolean values are lowercase true/false
- [ ] SKUs are unique (if using them)
- [ ] File is saved as .csv format

---

## 📁 Download Resources

- **Template File**: `sample-bulk-upload-template.csv`
- **Example with 10 products**: Included in template
- **This Guide**: Save for reference

---

## 🎉 Success!

Once your upload is complete:
1. Check the **Products** page to see your items
2. Verify prices and details are correct
3. Update product images if needed
4. Start selling!

---

**Last Updated**: November 30, 2025  
**Version**: 1.0 (Week 3 - GlobalProducts Architecture)
