# 🎯 QUICK START: Use GlobalProducts Merge API

## ✅ What's Done
- API endpoints created in `local-dev-server.js`
- Automatic merging of Products + GlobalProducts
- Test script ready

## 🚀 Use the API (2 Steps)

### 1. Get All Products
```javascript
const response = await fetch(
  `/api/merchants/${merchantId}/products`,
  { headers: { 'x-debug-mode': 'true' } }
);

const { products } = await response.json();
// Products now have complete data (no nulls!)
```

### 2. Display Products
```javascript
products.forEach(product => {
  // All fields populated automatically
  console.log(product.name);        // ✅ From GlobalProducts
  console.log(product.categoryId);  // ✅ From GlobalProducts
  console.log(product.price);       // ✅ From Products (merchant)
});
```

## 📋 API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/merchants/:id/products` | Get all products (merged) |
| `GET /api/merchants/:id/products/:pid` | Get single product (merged) |

## 🧪 Test It

```bash
# 1. Start server
npm start

# 2. Test API
node test-merged-products-endpoint.js business_1756855226821_cshyb2wugda
```

## 📚 Full Docs

- **GLOBALPRODUCTS_MERGE_API_GUIDE.md** - Complete guide
- **GLOBALPRODUCTS_MERGE_API_COMPLETE.md** - Implementation summary

---

**Status**: ✅ Ready to use!  
**Next**: Update frontend to use this API
