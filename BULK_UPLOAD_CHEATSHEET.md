# 📄 Bulk Upload Cheat Sheet (Print This!)

---

## ✅ CSV HEADER (Copy This Exactly)

```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
```

---

## 🔴 REQUIRED FIELDS

| Field | Example |
|-------|---------|
| **name** | `Coca Cola` |
| **price** | `1500` (numbers only!) |
| **category** | `Beverages` (exact spelling!) |

---

## 📋 CATEGORIES (Copy Exactly)

```
✅ Beverages          ✅ Coffee            ✅ Tea
✅ Pizza              ✅ Burgers           ✅ Chicken
✅ Salads             ✅ Sides             ✅ Appetizers
✅ Desserts           ✅ Main Courses      ✅ Sandwiches
✅ Bread              ✅ Cookies           ✅ Snacks & Sweets
✅ Dairy & Milk       ✅ Fresh Herbs       ✅ Meat & Poultry
✅ Vegetables & Fruits                     ✅ Dry Foods & Grains
✅ Dried Spices       ✅ Personal Care     ✅ Skincare
✅ Hair Care          ✅ Household Items   ✅ Vitamins & Supplements
```

---

## ✅ CORRECT FORMAT

```csv
name,price,category
Coca Cola,1500,Beverages
Pepsi,1400,Beverages
```

---

## ❌ COMMON MISTAKES

| Wrong ❌ | Correct ✅ |
|---------|-----------|
| `price = "1,500"` | `price = 1500` |
| `category = "beverage"` | `category = "Beverages"` |
| `isAvailable = "yes"` | `isAvailable = true` |
| `isAvailable = "TRUE"` | `isAvailable = true` |
| Save as `.xlsx` | Save as `.csv` |

---

## 🎯 QUICK CHECKLIST

Before uploading:

- [ ] File saved as **.csv** format
- [ ] Header row is exact match
- [ ] Every row has **name, price, category**
- [ ] Category spelling is **exact**
- [ ] Prices are **numbers only** (no symbols)
- [ ] Boolean values are **lowercase**
- [ ] No **empty rows** in middle of file

---

## 💾 SAVE CORRECTLY

**Excel:** File → Save As → **CSV UTF-8**

**Google Sheets:** File → Download → **CSV**

---

## 🔄 UPDATE PRODUCTS

To update existing products:
1. Use **same SKU**
2. Change values
3. Re-upload

No duplicates will be created! ✅

---

## 📞 HELP

**Error?** → See: `BULK_UPLOAD_TROUBLESHOOTING.md`

**Details?** → See: `BULK_UPLOAD_GUIDE.md`

**Template?** → Download: `sample-bulk-upload-template.csv`

---

**Last Updated**: November 30, 2025
