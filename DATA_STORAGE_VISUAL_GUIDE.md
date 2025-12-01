# Visual Guide: Where Your Data Is Stored

## 🎯 Current State - VERIFIED ✅

```
YOUR ACTUAL DATA (November 30, 2025):

DynamoDB Table: WhizzMerchants_Products
└── business_1756855226821_cshyb2wugda (Test Merchant)
    ├── ✅ Coca Cola (SKU: COKE-CAN-330) - 1500 IQD
    ├── ✅ Pepsi (SKU: PEPSI-CAN-330) - 1400 IQD
    ├── ✅ Water Bottle (SKU: WATER-500ML) - 500 IQD
    ├── ✅ Margherita Pizza (SKU: PIZZA-MARG-L) - 8000 IQD
    ├── ✅ Pepperoni Pizza (SKU: PIZZA-PEPP-L) - 9500 IQD
    ├── ✅ Burger Deluxe (SKU: BURGER-DELUXE) - 6000 IQD
    ├── ✅ French Fries (SKU: FRIES-REG) - 2000 IQD
    ├── ✅ Chicken Wings (SKU: WINGS-6PC) - 4500 IQD
    ├── ✅ Caesar Salad (SKU: SALAD-CAESAR) - 3500 IQD
    ├── ✅ Ice Cream Sundae (SKU: ICECREAM-SUND) - 2500 IQD
    └── ... 4 more products (from earlier uploads)

TOTAL: 14 products for this merchant
```

---

## 📊 Architecture Visualization

### Current Architecture (Week 1 - NOW)

```
┌─────────────────────────────────────────────────────────────┐
│                    BULK UPLOAD REQUEST                      │
│  POST /api/merchants/:id/items/bulk                         │
│  { items: [                                                 │
│    { name: "Coca Cola", sku: "COKE-330", price: 1500 }    │
│  ]}                                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│           merchants-bulk-handler.js                         │
│  • Validates input                                          │
│  • Maps categories                                          │
│  • Checks for duplicates (SKU/barcode/name)                │
│  • Generates fingerprint & imageHash                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│         ✅ SAVES TO: WhizzMerchants_Products                │
│                                                             │
│  Record Structure:                                          │
│  {                                                          │
│    productId: "product_xxx",         ← Unique per merchant │
│    businessId: "merchant_A",         ← Merchant identifier │
│    name: "Coca Cola",                                      │
│    price: 1500,                      ← Merchant's price   │
│    sku: "COKE-CAN-330",             ← For matching        │
│    barcode: "5449000000996",        ← For matching        │
│    imageHash: "sha256_...",         ← Week 2 prep         │
│    fingerprint: "sha256_...",       ← Change detection    │
│    ...                                                     │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

### Future Architecture (Week 3 - GlobalProducts)

```
┌─────────────────────────────────────────────────────────────┐
│                    BULK UPLOAD REQUEST                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│           merchants-bulk-handler.js (Enhanced)              │
│  • Checks GlobalProducts for existing product               │
│  • Creates global record if new                             │
│  • Links merchant product to global                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├──────────────────┬─────────────────────┐
                   ▼                  ▼                     ▼
┌──────────────────────────┐  ┌─────────────────────────────┐
│ WhizzMerchants_          │  │ WhizzMerchants_Products     │
│ GlobalProducts           │  │ (Merchant-Specific Data)    │
│ (Shared Canonical Data)  │  │                             │
│                          │  │ {                           │
│ {                        │  │   productId: "prod_xxx",    │
│   globalProductId:       │  │   businessId: "merchant_A", │
│   "global_coke_330",     │  │   globalProductId: ───────┐ │
│   canonicalName:         │  │   "global_coke_330", ←────┼─┤
│   "Coca-Cola 330ml",     │  │                           │ │
│   sku: "COKE-CAN-330",   │  │   price: 1500, ← Merchant │ │
│   barcode:               │  │   stockQty: 100, specific │ │
│   "5449000000996",       │  │   isAvailable: true       │ │
│   imageUrl: "s3://...",  │  │ }                           │
│   description: "...",    │  │                             │
│   categoryId: "bev"      │  │ Merchant B's product:       │
│ }                        │  │ {                           │
│                          │  │   productId: "prod_yyy",    │
│ ☝️ ONE record for        │  │   businessId: "merchant_B", │
│    Coca Cola             │  │   globalProductId: ───────┐ │
│                          │  │   "global_coke_330", ←────┼─┤
│ Used by ALL merchants    │  │   price: 1800, ← Different│ │
│ selling Coca Cola        │  │   stockQty: 50   price!   │ │
└──────────────────────────┘  └─────────────────────────────┘
     Shared Data                   Merchant Overrides
```

---

## 🔍 Comparison: Same Product, Different Merchants

### Current (Week 1) - Separate Records

```
Merchant A uploads Coca Cola:
┌─────────────────────────────────┐
│ WhizzMerchants_Products         │
├─────────────────────────────────┤
│ productId: "product_111"        │
│ businessId: "merchant_A"        │
│ name: "Coca Cola"               │
│ description: "Classic Coke"     │
│ price: 1500 IQD                 │
│ sku: "COKE-CAN-330"             │
│ imageUrl: "http://img1.jpg"     │
└─────────────────────────────────┘

Merchant B uploads same product:
┌─────────────────────────────────┐
│ WhizzMerchants_Products         │
├─────────────────────────────────┤
│ productId: "product_222"        │ ← Different ID
│ businessId: "merchant_B"        │ ← Different merchant
│ name: "Coca Cola"               │ ← Duplicate name
│ description: "Classic Coke"     │ ← Duplicate description
│ price: 1800 IQD                 │ ← Different price ✓
│ sku: "COKE-CAN-330"             │ ← Same SKU (for future matching)
│ imageUrl: "http://img2.jpg"     │ ← Duplicate image (maybe same!)
└─────────────────────────────────┘

⚠️ Problem: Name, description, image duplicated
💾 Storage: 2x the data
```

### Future (Week 3) - Linked to Global

```
Global Catalog (ONE record):
┌─────────────────────────────────┐
│ WhizzMerchants_GlobalProducts   │
├─────────────────────────────────┤
│ globalProductId: "global_coke"  │
│ canonicalName: "Coca-Cola 330ml"│
│ description: "Classic Coke"     │ ← Stored ONCE
│ sku: "COKE-CAN-330"             │
│ barcode: "5449000000996"        │
│ imageUrl: "s3://shared/abc.jpg" │ ← Stored ONCE
│ categoryId: "beverages"         │
└─────────────────────────────────┘
              ▲
              │ Referenced by both merchants
              │
     ┌────────┴────────┐
     │                 │
     ▼                 ▼
Merchant A         Merchant B
┌──────────────┐  ┌──────────────┐
│ Products     │  │ Products     │
├──────────────┤  ├──────────────┤
│ productId:   │  │ productId:   │
│ "prod_111"   │  │ "prod_222"   │
│ businessId:  │  │ businessId:  │
│ "merchant_A" │  │ "merchant_B" │
│ globalProdId:│  │ globalProdId:│
│ "global_coke"│  │ "global_coke"│
│              │  │              │
│ price: 1500  │  │ price: 1800  │ ← Only difference!
│ stockQty: 100│  │ stockQty: 50 │
└──────────────┘  └──────────────┘

✅ Benefit: Shared data, unique prices
💾 Storage: 60-80% reduction
```

---

## 📈 Storage Impact Example

### Scenario: 1000 Merchants selling 50 common products

**Current (Week 1):**
```
Products Table:
- 1000 merchants × 50 products = 50,000 records
- Each record: ~5KB (name, description, image URL, etc.)
- Total storage: 250 MB

Image Storage (S3):
- 50,000 images (many duplicates)
- Each image: ~200KB
- Total storage: 10 GB
- Monthly cost: ~$0.23/GB = $2.30/month
```

**Future (Week 3):**
```
GlobalProducts Table:
- 50 unique products = 50 records
- Each record: ~5KB
- Total storage: 250 KB (1000x reduction!)

Products Table:
- 50,000 records (same count)
- Each record: ~1KB (just merchant-specific data)
- Total storage: 50 MB (5x reduction!)

Image Storage (S3):
- 50 unique images (deduplicated in Week 2)
- Each image: ~200KB
- Total storage: 10 MB (1000x reduction!)
- Monthly cost: ~$0.0023/month (100x cheaper!)
```

**Savings:**
- DynamoDB: 200 MB saved
- S3: 9.99 GB saved
- Cost: ~$2.30/month → ~$0.02/month

---

## ✅ Verification Commands

### Check Your Current Data

```bash
# Count total products for test merchant
aws dynamodb query \
  --table-name WhizzMerchants_Products \
  --index-name BusinessIdIndex \
  --key-condition-expression "businessId = :bid" \
  --expression-attribute-values '{":bid":{"S":"business_1756855226821_cshyb2wugda"}}' \
  --region us-east-1 \
  | jq '.Count'

# Expected: 14 products
```

```bash
# List products with SKUs
aws dynamodb query \
  --table-name WhizzMerchants_Products \
  --index-name BusinessIdIndex \
  --key-condition-expression "businessId = :bid" \
  --expression-attribute-values '{":bid":{"S":"business_1756855226821_cshyb2wugda"}}' \
  --region us-east-1 \
  | jq -r '.Items[] | select(.sku.S != null) | "\(.name.S) - SKU: \(.sku.S) - Price: \(.price.N)"'

# Expected: List of 10 products with SKUs
```

### Verify GlobalProducts Table Does NOT Exist (Yet)

```bash
# Try to describe GlobalProducts table
aws dynamodb describe-table \
  --table-name WhizzMerchants_GlobalProducts \
  --region us-east-1 2>&1

# Expected: Error - Table does not exist
```

---

## 🎯 Summary

### ✅ What's TRUE Right Now:
1. **Data IS saved** to `WhizzMerchants_Products` ✅
2. **14 products exist** for test merchant ✅
3. **SKUs are stored** correctly ✅
4. **Each merchant has separate products** ✅
5. **No GlobalProducts table yet** ✅

### 🔮 What's Coming (Week 3):
1. **GlobalProducts table** will be created
2. **Existing products** will be migrated
3. **Storage costs** will decrease by 60-80%
4. **Merchants keep control** over prices/stock

### 💡 Key Takeaway:
**Your implementation is CORRECT and WORKING!**  
GlobalProducts is an **optimization**, not a requirement.  
You can use the current system in production right now! 🚀

---

**Last Updated**: November 30, 2025  
**Data Verified**: ✅ 14 products in WhizzMerchants_Products  
**Status**: Week 1 Complete, Ready for Week 2 or Production
