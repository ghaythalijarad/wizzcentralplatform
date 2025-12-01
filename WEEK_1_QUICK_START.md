# Week 1 Implementation - Quick Start Guide

## What Was Implemented

✅ **Enhanced Bulk Upload Handler**
- SKU/barcode priority matching
- Auto-generated internal SKUs
- Image hash computation
- Fingerprint-based change detection
- GSI-based queries (faster than scans)

✅ **New Fields Added**
- `sku` - Stock Keeping Unit
- `barcode` - Product barcode/UPC
- `portion` - Size identifier (can, bottle, large, etc.)
- `currency` - Currency code
- `vatRate` - VAT/tax percentage
- `stockQty` - Stock quantity
- `imageHash` - Image deduplication hash
- `fingerprint` - Change detection hash

✅ **Improved Matching Logic**
1. SKU match (highest priority)
2. Barcode match
3. Name + category match (fallback)

✅ **Sample Files Created**
- `sample-bulk-upload-template.csv` - Template with all fields
- `BULK_UPLOAD_CSV_SCHEMA.md` - Complete documentation

## Testing the Implementation

### Prerequisites

1. **Server Running**
   ```bash
   cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
   node local-dev-server.js
   ```

2. **Environment Variables Set**
   - `.env` file configured with:
     - `PRODUCTS_TABLE=WhizzMerchants_Products`
     - `CATEGORIES_TABLE=WhizzMerchants_Categories`

3. **Browser Ready**
   - Open: `http://localhost:3000/pages/merchants.html`
   - Enable debug mode if needed:
     ```javascript
     sessionStorage.setItem('debugMode', 'true');
     ```

### Test 1: Upload 10 Sample Products

1. **Get a Merchant ID**
   ```bash
   # List merchants to get a valid businessId
   aws dynamodb scan \
     --table-name WhizzMerchants_Businesses \
     --max-items 1 \
     --profile wizz-drivers-ghayth-dev \
     --region us-east-1 \
     --query 'Items[0].businessId.S'
   ```

2. **Open Merchants Page**
   - Go to: `http://localhost:3000/pages/merchants.html`
   - Find the merchant in the table
   - Click the **Bulk Upload** button (upload icon)

3. **Select Sample File**
   - Choose: `sample-bulk-upload-template.csv`
   - Click **Parse & Preview**

4. **Review Preview**
   - Should show 10 valid items
   - 0 errors
   - Preview table shows all fields

5. **Start Upload**
   - Click **Start Upload**
   - Watch progress bar
   - Should complete in < 5 seconds

6. **Check Results**
   ```json
   {
     "processed": 10,
     "created": 10,
     "updated": 0,
     "skipped": 0,
     "errors": []
   }
   ```

### Test 2: Verify SKU Matching

1. **Re-upload Same File**
   - Upload `sample-bulk-upload-template.csv` again
   - Click **Start Upload**

2. **Expected Result**
   ```json
   {
     "processed": 10,
     "created": 0,
     "updated": 0,
     "skipped": 10,
     "errors": []
   }
   ```
   ✅ All items skipped (SKUs matched, no changes)

### Test 3: Update Products via SKU

1. **Modify CSV**
   - Open `sample-bulk-upload-template.csv`
   - Change price of "Coca Cola" from 1500 to 1600
   - Save file

2. **Re-upload**
   - Upload modified file
   - Start upload

3. **Expected Result**
   ```json
   {
     "processed": 10,
     "created": 0,
     "updated": 1,
     "skipped": 9,
     "errors": []
   }
   ```
   ✅ Coca Cola updated via SKU match

### Test 4: Verify in DynamoDB

```bash
# Check products were created
aws dynamodb query \
  --table-name WhizzMerchants_Products \
  --index-name BusinessIdIndex \
  --key-condition-expression "businessId = :bid" \
  --expression-attribute-values '{":bid":{"S":"YOUR_BUSINESS_ID"}}' \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1
```

**Look for**:
- `sku` field populated (e.g., "COKE-CAN-330")
- `barcode` field (if provided)
- `portion` field (e.g., "can")
- `fingerprint` field (SHA-256 hash)
- `imageHash` field

### Test 5: Category Mapping

1. **List Available Categories**
   ```bash
   aws dynamodb scan \
     --table-name WhizzMerchants_Categories \
     --profile wizz-drivers-ghayth-dev \
     --region us-east-1 \
     --query 'Items[*].[categoryId.S,name.S,name_ar.S]'
   ```

2. **Verify Mapping**
   - Sample CSV uses "Beverages", "Pizza", "Burgers", etc.
   - Should map to `categoryId` in products

3. **Test Arabic Category**
   - Create CSV with Arabic category name (e.g., "مشروبات")
   - Should map to same category as "Beverages"

## Console Output Examples

### Successful Upload
```
Starting bulk upload for merchant business_xxx with 10 items
Loaded 50 categories from DynamoDB
Found 0 existing products for merchant business_xxx
Created: Coca Cola with SKU COKE-CAN-330
Created: Pepsi with SKU PEPSI-CAN-330
Created: Water Bottle with SKU WATER-500ML
...
Bulk upload complete: {
  processed: 10,
  created: 10,
  updated: 0,
  skipped: 0,
  errors: []
}
```

### SKU Match (Skip)
```
Match found for "Coca Cola" via sku
Skipped: Coca Cola (no changes, matched via sku)
```

### Update Detected
```
Match found for "Coca Cola" via sku
Updated: Coca Cola (matched via sku)
```

## Troubleshooting

### Problem: "Category not found"
**Solution**: 
- Check category exists in `WhizzMerchants_Categories`
- Or use null category (non-fatal warning)

### Problem: "No SKU generated"
**Check**: 
- Name and category are valid
- Internal SKU format: `{name}_{category}_{portion}`

### Problem: "Duplicate products created"
**Cause**: SKU/barcode not matching correctly
**Fix**:
- Ensure consistent SKU format
- Check case sensitivity (SKUs are lowercased)

### Problem: "Upload times out"
**Cause**: Too many items (>1000)
**Fix**:
- Split into smaller batches
- Future: use queue system (Week 4)

## Next Steps After Testing

### If Tests Pass ✅
1. Mark Week 1 as complete
2. Move to **Week 2: Image Deduplication**
3. Start planning GlobalProducts table

### If Issues Found ❌
1. Check server logs for detailed errors
2. Verify DynamoDB table structure
3. Test with smaller CSV (5 items)
4. Review BULK_UPLOAD_CSV_SCHEMA.md

## Sample Test CSV Files

### Minimal Test (3 items)
```csv
name,price,currency,category,sku
Test Item 1,1000,IQD,Beverages,TEST-001
Test Item 2,2000,IQD,Pizza,TEST-002
Test Item 3,3000,IQD,Burgers,TEST-003
```

### With Barcodes (retail)
```csv
name,price,currency,category,sku,barcode
Coca Cola 330ml,1500,IQD,Beverages,COKE-330,5449000000996
Pepsi 330ml,1400,IQD,Beverages,PEPSI-330,012000001765
```

### Restaurant Items (no barcodes)
```csv
name,description,price,currency,category,portion
Margherita Pizza,Classic cheese pizza,8000,IQD,Pizza,large
Pepperoni Pizza,Spicy pepperoni,9500,IQD,Pizza,large
Caesar Salad,Fresh Caesar salad,3500,IQD,Salads,regular
```

## Performance Benchmarks (Expected)

- **10 items**: < 5 seconds
- **100 items**: < 30 seconds
- **1000 items**: < 5 minutes

## Success Criteria

✅ All 10 sample products upload successfully
✅ SKU matching prevents duplicates
✅ Updates work via SKU/barcode
✅ Category mapping functions (EN/AR)
✅ Console logs show match methods
✅ Products visible in DynamoDB with new fields

## Files Modified/Created

### Backend
- ✅ `/backend/merchants-bulk-handler.js` - Enhanced with SKU logic

### Documentation
- ✅ `BULK_UPLOAD_CSV_SCHEMA.md` - Complete schema reference
- ✅ `sample-bulk-upload-template.csv` - Sample data
- ✅ `WEEK_1_QUICK_START.md` - This guide

### Configuration
- ✅ `.env` - Already configured (PRODUCTS_TABLE, CATEGORIES_TABLE)

---

**Status**: Week 1 Implementation Complete ✅
**Testing Required**: Yes
**Ready for Week 2**: Pending tests
**Estimated Testing Time**: 15-30 minutes

## Quick Test Commands

```bash
# 1. Check server is running
curl http://localhost:3000/health

# 2. Get a merchant ID
aws dynamodb scan --table-name WhizzMerchants_Businesses --max-items 1 --profile wizz-drivers-ghayth-dev --region us-east-1 --query 'Items[0].businessId.S'

# 3. Open merchants page
open -a "Google Chrome" "http://localhost:3000/pages/merchants.html"

# 4. After upload, verify products
aws dynamodb query --table-name WhizzMerchants_Products --index-name BusinessIdIndex --key-condition-expression "businessId = :bid" --expression-attribute-values '{":bid":{"S":"YOUR_BUSINESS_ID"}}' --profile wizz-drivers-ghayth-dev --region us-east-1 --query 'Count'
```

Ready to test! 🚀
