# 🎨 Bulk Upload Visual Guide

## 📊 The Upload Process (Visual Flow)

```
┌─────────────────────────────────────────────────────────────┐
│                    STEP 1: PREPARE FILE                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Download Template CSV              │
        │  sample-bulk-upload-template.csv    │
        └─────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    STEP 2: FILL DATA                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Open in Excel or Google Sheets     │
        │  Fill in your products              │
        │  - Name (required)                  │
        │  - Price (required)                 │
        │  - Category (required)              │
        └─────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    STEP 3: SAVE FILE                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Save as CSV UTF-8 format           │
        │  NOT .xlsx or .xls                  │
        └─────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    STEP 4: UPLOAD                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Login to Merchant Dashboard        │
        │  Go to Products → Bulk Upload       │
        │  Choose your CSV file               │
        │  Click Upload                       │
        └─────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    STEP 5: PROCESSING                       │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌───────────┐       ┌───────────┐
            │  MATCH?   │       │  NEW?     │
            └───────────┘       └───────────┘
                    │                   │
                    ▼                   ▼
            ┌───────────┐       ┌───────────┐
            │  UPDATE   │       │  CREATE   │
            └───────────┘       └───────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    STEP 6: RESULTS                          │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌───────────┐       ┌───────────┐
            │ ✅ SUCCESS │       │ ❌ ERRORS  │
            └───────────┘       └───────────┘
                    │                   │
                    ▼                   ▼
            Show results        Fix & re-upload
```

---

## 📋 CSV Structure (Visual)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  HEADER ROW (Required - Copy exactly)                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│  name,description,price,currency,category,sku,barcode,portion,isAvailable,...│
└──────────────────────────────────────────────────────────────────────────────┘
         ↓            ↓       ↓       ↓         ↓      ↓       ↓        ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│  DATA ROWS (Your products)                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│  Coca Cola,Classic drink,1500,IQD,Beverages,COKE-330,5449000000996,can,...  │
│  Pepsi,Pepsi cola,1400,IQD,Beverages,PEPSI-330,012000001765,can,...         │
│  Water,Pure water,500,IQD,Beverages,WATER-500,,bottle,...                   │
└──────────────────────────────────────────────────────────────────────────────┘
    ↑        ↑         ↑    ↑      ↑         ↑          ↑         ↑
 Required  Optional Required Opt Required  Optional   Optional  Optional
```

---

## 🎯 Matching Logic (Visual)

```
         Upload Product
               │
               ▼
        ┌──────────────┐
        │  Has SKU?    │
        └──────────────┘
          │         │
        YES         NO
          │         │
          ▼         ▼
    ┌─────────┐   ┌──────────────┐
    │ Find by │   │ Has Barcode? │
    │  SKU    │   └──────────────┘
    └─────────┘     │         │
          │       YES         NO
          │         │         │
          │         ▼         ▼
          │   ┌─────────┐   ┌──────────────┐
          │   │ Find by │   │ Find by Name │
          │   │ Barcode │   │ + Category   │
          │   └─────────┘   └──────────────┘
          │         │               │
          └─────────┼───────────────┘
                    ▼
              ┌──────────┐
              │  Found?  │
              └──────────┘
                │      │
              YES      NO
                │      │
                ▼      ▼
           ┌────────┐ ┌────────┐
           │ UPDATE │ │ CREATE │
           └────────┘ └────────┘
```

---

## 🔄 Update Flow (Visual)

```
SCENARIO: You want to change Coca Cola price from 1500 to 1800

┌────────────────────────────────────────────────────────┐
│  CURRENT DATABASE                                      │
├────────────────────────────────────────────────────────┤
│  Coca Cola | 1500 | Beverages | COKE-330              │
└────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│  YOUR CSV FILE                                         │
├────────────────────────────────────────────────────────┤
│  Coca Cola | 1800 | Beverages | COKE-330              │
│            ↑↑↑↑                                        │
│         Changed!                                       │
└────────────────────────────────────────────────────────┘
                              │
                              ▼
                     [UPLOAD PROCESS]
                              │
                              ▼
                ┌─────────────────────────┐
                │ System finds match by   │
                │ SKU: COKE-330           │
                └─────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │ Updates existing record │
                │ (No duplicate created!) │
                └─────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│  UPDATED DATABASE                                      │
├────────────────────────────────────────────────────────┤
│  Coca Cola | 1800 | Beverages | COKE-330 ✅           │
└────────────────────────────────────────────────────────┘
```

---

## ✅ Success Result (Visual)

```
┌─────────────────────────────────────────────────────────────┐
│  UPLOAD RESULTS                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Processed: 10 products                                  │
│                                                             │
│  ✅ Created:   7 products  ←── New products added           │
│  🔄 Updated:   2 products  ←── Existing products updated    │
│  ⏭️  Skipped:   1 product   ←── Already up-to-date          │
│  ❌ Errors:    0 products  ←── No problems!                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ❌ Error Result (Visual)

```
┌─────────────────────────────────────────────────────────────┐
│  UPLOAD RESULTS                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Processed: 10 products                                  │
│                                                             │
│  ✅ Created:   6 products                                   │
│  🔄 Updated:   2 products                                   │
│  ⏭️  Skipped:   0 products                                  │
│  ❌ Errors:    2 products  ←── Problems found!              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ERROR DETAILS                                      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Row 5: "Pizza"                                     │   │
│  │  Error: Category "pizza" not found                 │   │
│  │  Fix: Change "pizza" → "Pizza"                     │   │
│  │                                                     │   │
│  │  Row 8: "Burger"                                    │   │
│  │  Error: Price must be a valid number               │   │
│  │  Fix: Remove currency symbols from price           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Validation (Visual)

```
YOUR CSV FILE GOES THROUGH THESE CHECKS:

┌────────────────┐
│  1. FORMAT     │  Is it a valid CSV?
└────────────────┘
        │
        ▼
┌────────────────┐
│  2. HEADERS    │  Does it have the right columns?
└────────────────┘
        │
        ▼
┌────────────────┐
│  3. REQUIRED   │  Does each row have name, price, category?
└────────────────┘
        │
        ▼
┌────────────────┐
│  4. CATEGORY   │  Do categories match the official list?
└────────────────┘
        │
        ▼
┌────────────────┐
│  5. PRICE      │  Are prices valid numbers?
└────────────────┘
        │
        ▼
┌────────────────┐
│  6. BOOLEAN    │  Are true/false values lowercase?
└────────────────┘
        │
        ▼
┌────────────────┐
│  ✅ ALL PASS   │  → Process upload
└────────────────┘
```

---

## 🎨 Category Map (Visual Organization)

```
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCT CATEGORIES                        │
└─────────────────────────────────────────────────────────────┘

🍕 FOOD & DRINK
├── Beverages           ├── Coffee              ├── Tea
├── Pizza               ├── Burgers             ├── Chicken
├── Salads              ├── Sides               ├── Appetizers
├── Desserts            ├── Main Courses        ├── Sandwiches
└── Bread

🛒 GROCERIES
├── Cookies             ├── Snacks & Sweets     ├── Dairy & Milk
├── Fresh Herbs         ├── Meat & Poultry      ├── Vegetables & Fruits
├── Dry Foods & Grains  └── Dried Spices

🧴 PERSONAL CARE
├── Personal Care       ├── Skincare            ├── Hair Care
├── Household Items     └── Vitamins & Supplements
```

---

## 🔧 Troubleshooting Flow (Visual)

```
                    Upload Failed?
                          │
                          ▼
                ┌─────────────────┐
                │  Read Error     │
                │  Message        │
                └─────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ Category │    │  Price   │    │  Format  │
  │  Error   │    │  Error   │    │  Error   │
  └──────────┘    └──────────┘    └──────────┘
         │                │                │
         ▼                ▼                ▼
  Fix spelling    Remove symbols   Save as CSV
         │                │                │
         └────────────────┼────────────────┘
                          ▼
                   Re-upload file
                          │
                          ▼
                      Success! ✅
```

---

## 📱 Quick Decision Tree

```
           Do you have products to upload?
                      │
              ┌───────┴───────┐
              │               │
            YES              NO
              │               │
              ▼               ▼
     How many products?    Gather product
              │            information
     ┌────────┼────────┐
     │        │        │
   1-10    11-50    50+
     │        │        │
     ▼        ▼        ▼
  Quick    Normal   Batch
  Upload   Upload   Upload
     │        │        │
     └────────┼────────┘
              │
              ▼
     Use CSV Bulk Upload
              │
              ▼
   Download template
              │
              ▼
   Fill in your data
              │
              ▼
   Save as CSV UTF-8
              │
              ▼
   Upload to platform
              │
              ▼
   Check results
              │
      ┌───────┴───────┐
      │               │
   Success         Errors
      │               │
      ▼               ▼
   Done! ✅      Fix & retry
```

---

## 💡 Remember

```
┌────────────────────────────────────────────────────┐
│  3 GOLDEN RULES                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  1️⃣  Start Small                                   │
│     Test with 5 products first                    │
│                                                    │
│  2️⃣  Check Format                                  │
│     CSV UTF-8, correct headers                    │
│                                                    │
│  3️⃣  Read Errors                                   │
│     Error messages tell you exactly what to fix   │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

**For more details, see:**
- BULK_UPLOAD_GUIDE.md (complete guide)
- CSV_FORMAT_REFERENCE.md (format specs)
- BULK_UPLOAD_TROUBLESHOOTING.md (error solutions)
