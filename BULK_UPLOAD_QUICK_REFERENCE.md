# Bulk Upload Quick Reference Card

## 🚀 Quick Start (2 minutes)

### Step 1: Get a Merchant ID
```bash
node get-merchant-id.js
```
Output: `business_1756855226821_cshyb2wugda`

### Step 2: Upload Products
```bash
curl -X POST http://localhost:3000/api/merchants/YOUR_BUSINESS_ID/items/bulk \
  -H "Content-Type: application/json" \
  -H "x-debug-mode: true" \
  -d '{
    "merchantId": "YOUR_BUSINESS_ID",
    "items": [
      {
        "name": "Coca Cola",
        "price": 1500,
        "category": "Beverages",
        "sku": "COKE-330",
        "barcode": "5449000000996",
        "description": "Classic Coca Cola",
        "portion": "can",
        "isAvailable": true,
        "currency": "IQD",
        "vatRate": 0,
        "stockQty": 100,
        "imageUrl": "https://example.com/coke.jpg"
      }
    ]
  }'
```

---

## 📋 CSV Template

```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Coca Cola,Classic Coca Cola drink,1500,IQD,Beverages,COKE-CAN-330,5449000000996,can,true,0,100,https://example.com/cocacola-can.jpg
Pepsi,Refreshing Pepsi cola,1400,IQD,Beverages,PEPSI-CAN-330,012000001765,can,true,0,150,https://example.com/pepsi-can.jpg
```

Use: `sample-bulk-upload-template.csv` for full example with 10 products.

---

## 🔑 Required Fields

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `name` | string | ✅ Yes | "Coca Cola" |
| `price` | number | ✅ Yes | 1500 |
| `category` | string | ✅ Yes | "Beverages" |

## 📝 Optional Fields (Recommended)

| Field | Type | Default | Example |
|-------|------|---------|---------|
| `sku` | string | Auto-generated | "COKE-330" |
| `barcode` | string | - | "5449000000996" |
| `description` | string | - | "Classic Coca Cola" |
| `portion` | string | - | "can", "bottle", "large" |
| `currency` | string | "IQD" | "IQD", "USD" |
| `vatRate` | number | 0 | 5, 10 |
| `stockQty` | number | - | 100 |
| `isAvailable` | boolean | true | true, false |
| `imageUrl` | string | - | "https://..." |

---

## 🎯 Deduplication Logic

Products are matched in this order:

1. **SKU** (highest priority)
2. **Barcode**
3. **Name + Category** (fallback)

If match found → **UPDATE**  
If no match → **CREATE**

---

## ✅ Response Format

### Success
```json
{
  "processed": 10,
  "created": 5,
  "updated": 3,
  "skipped": 2,
  "errors": []
}
```

### With Errors
```json
{
  "processed": 10,
  "created": 5,
  "updated": 3,
  "skipped": 0,
  "errors": [
    {
      "row": 4,
      "name": "Pizza",
      "error": "Category \"Pizza\" not found"
    }
  ]
}
```

---

## 📊 Available Categories

### Food
- Beverages, Coffee, Tea
- Pizza, Burgers, Chicken
- Salads, Sides, Appetizers
- Desserts, Main Courses
- Sandwiches, Bread

### Retail
- Cookies, Snacks & Sweets
- Dairy & Milk, Fresh Herbs
- Meat & Poultry, Vegetables & Fruits
- Dry Foods & Grains, Dried Spices

### Other
- Personal Care, Skincare
- Hair Care, Household Items
- Vitamins & Supplements

**Full list**: Run `aws dynamodb scan --table-name WhizzMerchants_Categories`

---

## 🛠️ Testing Tools

### Test with Sample Data
```bash
node test-bulk-upload.js <businessId>
```

### Add Missing Categories
```bash
node add-missing-categories.js
```

### View Products for Business
```bash
aws dynamodb query \
  --table-name WhizzMerchants_Products \
  --index-name BusinessIdIndex \
  --key-condition-expression "businessId = :bid" \
  --expression-attribute-values '{":bid":{"S":"YOUR_BUSINESS_ID"}}'
```

---

## ⚡ Performance Tips

1. **Batch Size**: Keep under 1,000 items per upload
2. **SKU Usage**: Always provide SKUs for faster deduplication
3. **Category Cache**: Categories cached for 5 minutes
4. **Images**: Provide image URLs, not base64 data

---

## ⚠️ Common Errors

### "Category not found"
**Solution**: Add category or check spelling
```bash
node add-missing-categories.js
```

### "merchantId is required"
**Solution**: Include `merchantId` in request body
```json
{ "merchantId": "business_xxx", "items": [...] }
```

### "Maximum 1,000 items per upload"
**Solution**: Split into multiple uploads or wait for Week 4 queue system

---

## 📖 Documentation

- **Full Docs**: `BULK_UPLOAD_CSV_SCHEMA.md`
- **Test Results**: `WEEK_1_TEST_RESULTS.md`
- **Implementation**: `WEEK_1_TESTING_COMPLETE.md`
- **Quick Start**: `WEEK_1_QUICK_START.md`
- **Roadmap**: `PRODUCT_CATALOG_OPTIMIZATION_PLAN.md`

---

## 🆘 Troubleshooting

### Server not responding?
```bash
# Check if server is running
ps aux | grep "node local-dev-server.js"

# Restart server
pkill -f "node local-dev-server.js"
node local-dev-server.js
```

### Categories not updating?
```bash
# Wait 5 minutes (cache TTL) or restart server
pkill -f "node local-dev-server.js"
node local-dev-server.js
```

### Authentication errors?
```bash
# Use debug mode for local testing
-H "x-debug-mode: true"
```

---

## 📞 Support

- **File Issues**: See error response for row-level details
- **Missing Features**: Check `PRODUCT_CATALOG_OPTIMIZATION_PLAN.md` for roadmap
- **Performance Issues**: Current limit is 1,000 items/upload

---

**Version**: Week 1 (Foundation)  
**Status**: ✅ Production Ready  
**Last Updated**: November 30, 2025
