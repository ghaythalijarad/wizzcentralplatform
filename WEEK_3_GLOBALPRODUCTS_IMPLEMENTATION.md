# Week 3 Implementation: GlobalProducts Table

## 🎯 Implementation Plan

### Phase 1: Create GlobalProducts Table Schema
### Phase 2: Migration Script for Existing Products
### Phase 3: Update Bulk Upload Handler
### Phase 4: Build Merchant Mapping UI

---

## Phase 1: Table Schema Design

### GlobalProducts Table Structure

```javascript
TableName: WhizzMerchants_GlobalProducts

Primary Key:
- PK: globalProductId (UUID)

Global Secondary Indexes:
- GSI1: sku-index
  - PK: sku
  - Projection: ALL
  
- GSI2: barcode-index
  - PK: barcode
  - Projection: ALL
  
- GSI3: searchableName-categoryId-index
  - PK: searchableName
  - SK: categoryId
  - Projection: ALL

Attributes:
{
  // Primary identifier
  globalProductId: string (UUID),
  
  // Product identifiers
  sku: string (indexed),
  barcode: string (indexed, optional),
  
  // Canonical product data
  canonicalName: string,
  searchableName: string (normalized, indexed),
  description: string,
  
  // Category
  categoryId: string (indexed),
  
  // Media
  imageUrl: string (from image dedup service),
  imageHash: string (SHA-256),
  
  // Additional product data
  portion: string (can, bottle, large, etc.),
  
  // Optional rich data
  nutrition: object (optional),
  allergens: array (optional),
  ingredients: array (optional),
  brand: string (optional),
  manufacturer: string (optional),
  
  // Metadata
  usageCount: number (how many merchants use this),
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string (merchantId who first created),
  
  // Fingerprint for change detection
  fingerprint: string (SHA-256)
}
```

### Updated Products Table Schema

```javascript
TableName: WhizzMerchants_Products

// Add new field:
globalProductId: string (reference to GlobalProducts)

// Merchant-specific fields (keep existing):
productId: string,
businessId: string,
price: number,
currency: string,
isAvailable: boolean,
stockQty: number,
vatRate: number,

// Override fields (null = use global)
nameOverride: string (optional),
descriptionOverride: string (optional),
imageOverride: string (optional),
categoryOverride: string (optional),

// Keep existing metadata
createdAt: timestamp,
updatedAt: timestamp
```

---

## Implementation Steps

### Step 1: Create DynamoDB Table
### Step 2: Create Migration Script
### Step 3: Update Bulk Upload Handler
### Step 4: Create Product Matching Service
### Step 5: Build Admin UI for Product Mapping

Let's begin! 🚀
