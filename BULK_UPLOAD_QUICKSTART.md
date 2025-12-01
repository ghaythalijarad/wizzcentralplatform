# 🚀 Bulk Upload Quick Start (2 Minutes)

## Step 1️⃣: Download Template
Download: `sample-bulk-upload-template.csv`

## Step 2️⃣: Fill Your Products

Open in Excel/Google Sheets and fill in your products:

```
name          | price | category   | sku
------------- | ----- | ---------- | ------------
Coca Cola     | 1500  | Beverages  | COKE-330
Pepsi         | 1400  | Beverages  | PEPSI-330
Margherita    | 8000  | Pizza      | PIZZA-MARG
```

## Step 3️⃣: Save as CSV
File → Save As → **CSV format**

## Step 4️⃣: Upload
Log in → Products → **Bulk Upload** → Choose File → Upload

---

## ✅ Required Columns
- **name** - Product name
- **price** - Price (numbers only)
- **category** - Must match: Beverages, Pizza, Burgers, etc.

## 📋 Popular Categories
```
Beverages    Coffee      Tea
Pizza        Burgers     Chicken
Salads       Sides       Desserts
Snacks       Dairy       Personal Care
```

## ❌ Common Mistakes

| Wrong ❌ | Correct ✅ |
|---------|-----------|
| `price = "1,500 IQD"` | `price = 1500` |
| `category = "beverage"` | `category = "Beverages"` |
| `isAvailable = "yes"` | `isAvailable = true` |

---

## 🎯 Smart Matching

Upload the same file twice? **No duplicates!**

System matches by:
1. **SKU** (if provided)
2. **Barcode** (if provided)
3. **Name + Category** (fallback)

---

## 💡 Pro Tips

1. **Start small** - Test with 5 products first
2. **Use SKUs** - Prevents duplicates: `COKE-330`
3. **Keep backup** - Save your original CSV
4. **Update anytime** - Re-upload to update prices

---

## 📞 Need Help?

See full guide: **BULK_UPLOAD_GUIDE.md**

---

**That's it! You're ready to upload! 🎉**
