# 📊 CSV Format Reference Card

## ✅ Correct CSV Format

```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Coca Cola,Classic Coca Cola drink,1500,IQD,Beverages,COKE-CAN-330,5449000000996,can,true,0,100,https://example.com/coke.jpg
Pepsi,Refreshing Pepsi cola,1400,IQD,Beverages,PEPSI-CAN-330,012000001765,can,true,0,150,https://example.com/pepsi.jpg
Water Bottle,Pure mineral water,500,IQD,Beverages,WATER-500ML,,bottle,true,0,200,
```

---

## 📋 Column Reference

| # | Column | Required? | Type | Example | Notes |
|---|--------|-----------|------|---------|-------|
| 1 | **name** | ✅ Yes | Text | `Coca Cola` | Product name |
| 2 | **description** | Optional | Text | `Classic drink` | Product details |
| 3 | **price** | ✅ Yes | Number | `1500` | No symbols! |
| 4 | **currency** | Optional | Text | `IQD` | Default: IQD |
| 5 | **category** | ✅ Yes | Text | `Beverages` | Exact match! |
| 6 | **sku** | Optional | Text | `COKE-330` | Unique ID |
| 7 | **barcode** | Optional | Text | `5449000000996` | Product barcode |
| 8 | **portion** | Optional | Text | `can`, `bottle` | Size/portion |
| 9 | **isAvailable** | Optional | Boolean | `true`, `false` | Lowercase! |
| 10 | **vatRate** | Optional | Number | `0`, `5`, `10` | Percentage |
| 11 | **stockQty** | Optional | Number | `100` | Quantity |
| 12 | **imageUrl** | Optional | URL | `https://...` | Image link |

---

## 🎯 Category List (Must Match Exactly!)

### 🍕 Food & Beverages
```
Beverages          Coffee             Tea
Pizza              Burgers            Chicken
Salads             Sides              Appetizers
Desserts           Main Courses       Sandwiches
Bread
```

### 🛒 Groceries
```
Cookies                  Snacks & Sweets
Dairy & Milk             Fresh Herbs
Meat & Poultry           Vegetables & Fruits
Dry Foods & Grains       Dried Spices
```

### 🧴 Personal Care
```
Personal Care            Skincare
Hair Care                Household Items
Vitamins & Supplements
```

---

## ✅ Valid Examples

### Minimum (Required Fields Only)
```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Coca Cola,,1500,,Beverages,,,,,,
```

### Recommended (Common Fields)
```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Coca Cola,Classic drink,1500,IQD,Beverages,COKE-330,,can,true,0,100,
```

### Complete (All Fields)
```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Coca Cola,Classic Coca Cola drink,1500,IQD,Beverages,COKE-330,5449000000996,can,true,0,100,https://example.com/coke.jpg
```

---

## ❌ Common Errors

### Error 1: Wrong Price Format
```csv
❌ WRONG: Coca Cola,,1,500 IQD,,Beverages
✅ RIGHT: Coca Cola,,1500,,Beverages
```

### Error 2: Wrong Category Spelling
```csv
❌ WRONG: Coca Cola,,1500,,beverage
❌ WRONG: Coca Cola,,1500,,BEVERAGES
✅ RIGHT: Coca Cola,,1500,,Beverages
```

### Error 3: Wrong Boolean
```csv
❌ WRONG: Coca Cola,,1500,,Beverages,,,,yes
❌ WRONG: Coca Cola,,1500,,Beverages,,,,TRUE
✅ RIGHT: Coca Cola,,1500,,Beverages,,,,true
```

### Error 4: Missing Required Field
```csv
❌ WRONG: ,,1500,,Beverages
✅ RIGHT: Coca Cola,,1500,,Beverages
```

### Error 5: Extra Spaces
```csv
❌ WRONG: Coca Cola , , 1500 , , Beverages
✅ RIGHT: Coca Cola,,1500,,Beverages
```

---

## 🔧 Excel/Sheets Tips

### In Excel:
1. Enter data normally (no special formatting)
2. File → Save As → **CSV UTF-8**
3. Don't add borders, colors, or formulas

### In Google Sheets:
1. Enter data normally
2. File → Download → **Comma-separated values (.csv)**

### Important:
- ✅ Use commas (,) as separator
- ✅ Don't add extra quotes
- ✅ Save as .csv extension
- ❌ Don't save as .xlsx or .xls

---

## 📐 Data Type Rules

| Field | Rule | Valid | Invalid |
|-------|------|-------|---------|
| **price** | Numbers only | `1500` | `1,500` `1500 IQD` |
| **stockQty** | Integer | `100` | `100.5` |
| **vatRate** | Integer | `0` `5` `10` | `5%` `0.05` |
| **isAvailable** | Lowercase boolean | `true` `false` | `TRUE` `yes` `1` |
| **currency** | 3-letter code | `IQD` `USD` | `dinar` |

---

## 🎨 Empty Fields

Leave fields empty with just commas:

```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Coca Cola,,1500,,Beverages,COKE-330,,can,,,100,
         ↑↑     ↑↑          ↑↑           ↑↑↑
       Empty  Empty        Empty       Empty
```

---

## 📦 Example: 5 Products

```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Coca Cola,Classic cola,1500,IQD,Beverages,COKE-330,5449000000996,can,true,0,100,https://example.com/coke.jpg
Pepsi,Pepsi cola,1400,IQD,Beverages,PEPSI-330,012000001765,can,true,0,150,https://example.com/pepsi.jpg
Water Bottle,Mineral water,500,IQD,Beverages,WATER-500,,bottle,true,0,200,
Margherita Pizza,Cheese pizza,8000,IQD,Pizza,PIZZA-MARG,,large,true,5,50,
Burger Deluxe,Beef burger,6000,IQD,Burgers,BURGER-DLX,,standard,true,5,30,
```

---

## 🔄 Updating Products

**To update existing products:**

1. Use the **same SKU** as the original
2. Change the values you want to update
3. Upload the file

**Example: Update Coca Cola price from 1500 to 1800**

```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Coca Cola,Classic cola,1800,IQD,Beverages,COKE-330,5449000000996,can,true,0,100,https://example.com/coke.jpg
                        ↑↑↑↑
                     Changed!
```

---

## 📋 Quick Validation Checklist

Before uploading, check:

- [ ] First row has exactly these headers (in order)
- [ ] All products have name, price, category
- [ ] Categories match the official list (case-sensitive)
- [ ] Prices are numbers only (no commas or symbols)
- [ ] Boolean values are lowercase (true/false)
- [ ] File is saved as .csv format
- [ ] No extra spaces around values
- [ ] SKUs are unique (if using them)

---

## 🎓 Test Your CSV

Use this **5-row test file** to verify your format works:

```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Test Product 1,Test description,100,IQD,Beverages,TEST-001,,can,true,0,10,
Test Product 2,Test description,200,IQD,Pizza,TEST-002,,large,true,5,20,
Test Product 3,Test description,300,IQD,Burgers,TEST-003,,standard,true,5,30,
Test Product 4,Test description,400,IQD,Salads,TEST-004,,standard,true,0,40,
Test Product 5,Test description,500,IQD,Desserts,TEST-005,,standard,true,0,50,
```

**Upload this first** to test your CSV format is correct!

---

**Need more help?** See: `BULK_UPLOAD_GUIDE.md`
