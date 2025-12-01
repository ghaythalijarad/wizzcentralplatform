# Bulk Upload CSV Schema - Enhanced Version

## File Formats Supported
- CSV (.csv)
- JSON (.json)
- Excel (.xlsx)

## Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Product name (required) | "Coca Cola" |
| `price` | number | Price in local currency (required) | 1500 |
| `currency` | string | Currency code (default: IQD) | "IQD" |

## Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `sku` | string | Stock Keeping Unit (auto-generated if empty) | "COKE-CAN-330" |
| `barcode` | string | Product barcode/UPC (for packaged goods) | "5449000000996" |
| `description` | string | Product description | "Classic Coca Cola drink" |
| `category` | string | Category name (English or Arabic) | "Beverages" or "مشروبات" |
| `portion` | string | Size/portion identifier | "can", "bottle", "large", "small" |
| `isAvailable` | boolean | Product availability (default: true) | true |
| `vatRate` | number | VAT/tax rate percentage | 5 |
| `stockQty` | number | Current stock quantity | 100 |
| `imageUrl` | string | Product image URL | "https://..." |

## Matching & Deduplication Logic

The system uses **priority-based matching** to identify existing products:

1. **SKU Match** (highest priority)
   - If `sku` is provided and matches an existing product → update
   - Most reliable for retail/packaged goods

2. **Barcode Match**
   - If `barcode` is provided and matches → update
   - Good for products with standard barcodes

3. **Name + Category Match** (fallback)
   - Normalized name comparison (case-insensitive, alphanumeric only)
   - Used when SKU/barcode not available

## Auto-Generated Fields

If not provided, the system generates:

### Internal SKU
Format: `{normalized_name}_{categoryId}_{portion}`
Example: `cocacola_beverages_can`

### Fingerprint
SHA-256 hash of core product attributes for change detection.
Includes: name, description, categoryId, sku, barcode, portion

### Image Hash
Hash of image URL (future: content hash from actual image)

## CSV Example

```csv
name,description,price,currency,category,sku,barcode,portion,isAvailable,vatRate,stockQty,imageUrl
Coca Cola,Classic drink,1500,IQD,Beverages,COKE-CAN-330,5449000000996,can,true,0,100,https://example.com/coke.jpg
Pepsi,Refreshing cola,1400,IQD,Beverages,PEPSI-CAN-330,012000001765,can,true,0,150,https://example.com/pepsi.jpg
```

## JSON Example

```json
[
  {
    "name": "Coca Cola",
    "description": "Classic Coca Cola drink",
    "price": 1500,
    "currency": "IQD",
    "category": "Beverages",
    "sku": "COKE-CAN-330",
    "barcode": "5449000000996",
    "portion": "can",
    "isAvailable": true,
    "vatRate": 0,
    "stockQty": 100,
    "imageUrl": "https://example.com/cocacola-can.jpg"
  },
  {
    "name": "Margherita Pizza",
    "description": "Classic cheese and tomato pizza",
    "price": 8000,
    "currency": "IQD",
    "category": "Pizza",
    "sku": "PIZZA-MARG-L",
    "portion": "large",
    "isAvailable": true,
    "vatRate": 5,
    "stockQty": 50,
    "imageUrl": "https://example.com/margherita-pizza.jpg"
  }
]
```

## Category Mapping

Categories can be provided as:
- **English name**: "Beverages", "Pizza", "Burgers"
- **Arabic name**: "مشروبات", "بيتزا", "برجر"

The system automatically maps to `categoryId` from `WhizzMerchants_Categories` table.

If category not found:
- **Behavior**: Continues with null category (warning logged)
- **Recommendation**: Ensure categories exist before bulk upload

## Validation Rules

1. **Name**: Required, 1-200 characters
2. **Price**: Required, must be numeric, > 0
3. **Currency**: Optional, max 5 characters, uppercase
4. **SKU**: Optional, max 64 characters
5. **Barcode**: Optional, numeric string
6. **VAT Rate**: 0-100 (percentage)
7. **Stock Qty**: Non-negative integer

## Upload Limits

- **Items per upload**: 1,000 (hard limit)
- **File size**: 10MB recommended
- **Processing time**: ~30 seconds per 1,000 items

For larger uploads (10k+), contact support for batch processing.

## Error Handling

Errors are non-fatal and reported per-row:

```json
{
  "processed": 100,
  "created": 80,
  "updated": 15,
  "skipped": 3,
  "errors": [
    {
      "row": 25,
      "name": "Invalid Item",
      "error": "Missing required field: price"
    }
  ]
}
```

## Best Practices

### For Packaged Goods (Stores/Retail)
✅ Always provide `sku` or `barcode`
✅ Use standard product names
✅ Include `portion` for different sizes

### For Restaurant Items
✅ Use descriptive names + `portion`
✅ Generate consistent internal SKUs
✅ Map to correct categories

### For Image Optimization
✅ Use HTTPS URLs
✅ Recommended size: 800x800px
✅ Format: WebP or JPEG
✅ Max file size: 2MB

### For Multi-Store Chains
✅ Use same SKU across stores for same product
✅ Each store maintains own price/availability
✅ Images are automatically deduplicated

## Testing Your Upload

1. Start with 10-20 test items
2. Verify category mapping
3. Check SKU generation
4. Confirm image URLs are accessible
5. Scale to full upload

## Sample Files

- `sample-bulk-upload-template.csv` - Template with headers
- `test-bulk-upload.csv` - 10 sample products
- `sample-bulk-upload.json` - JSON format example

## API Endpoint

```
POST /api/merchants/{merchantId}/items/bulk
Content-Type: application/json

{
  "merchantId": "business_123",
  "items": [ /* array of product objects */ ]
}
```

## Support

For issues or questions:
- Check logs for detailed error messages
- Validate CSV format using online tools
- Contact platform support for large uploads

---

**Version**: 2.0 (SKU/Barcode Enhanced)
**Last Updated**: November 30, 2024
