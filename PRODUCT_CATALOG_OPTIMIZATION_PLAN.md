# Product Catalog Optimization Implementation Plan

## Current State Analysis

### Existing Tables
✅ **WhizzMerchants_Products** (12 items)
- PK: `productId` (HASH)
- GSI: `BusinessIdIndex` on `businessId`
- Fields: name, searchableName, description, price, categoryId, businessId, imageUrl, isAvailable, createdAt, updatedAt
- Billing: PAY_PER_REQUEST
- Status: ACTIVE

✅ **WhizzMerchants_Categories** (50 items)
- PK: `categoryId` (HASH)
- GSI: `BusinessTypeIndex` on `businessType`
- Billing: PAY_PER_REQUEST
- Status: ACTIVE

✅ **WhizzMerchants_Businesses** (4 items)
- Already exists and working

### What's Missing for Scale
❌ GlobalProducts table (canonical product data)
❌ SKU/barcode fields in Products table
❌ Image deduplication service
❌ Batch upload queue system
❌ Product fingerprinting for change detection

## Implementation Plan

### Phase 1: Extend Existing Tables (Week 1)
**Goal**: Add fields to support SKU-based deduplication without breaking changes

#### 1.1 Add Fields to WhizzMerchants_Products
```javascript
// New optional fields (backward compatible):
- sku: string (optional, for stores/retail)
- barcode: string (optional, for packaged goods)
- globalProductId: string (optional, reference to future GlobalProducts)
- fingerprint: string (SHA-256 hash for change detection)
- portion: string (optional: "can", "bottle", "large", "small")
- imageHash: string (SHA-256 of image content)
```

**Action**: Update bulk upload handler to support these fields
- File: `/backend/merchants-bulk-handler.js`
- Add SKU/barcode to CSV schema
- Generate fingerprint on upload
- Compute imageHash for deduplication

#### 1.2 Enhance Bulk Upload
**Current**: Normalizes name for dedup
**New**: Priority matching:
1. SKU/barcode (if provided) → exact match
2. Normalized name + categoryId + portion → fuzzy match
3. Manual mapping UI for ambiguous cases

**Files to modify**:
- `/backend/merchants-bulk-handler.js` - add SKU matching logic
- `/frontend/merchants.js` - add SKU/barcode fields to upload modal

### Phase 2: Image Deduplication Service (Week 2)
**Goal**: Store each image once, reuse URLs across merchants

#### 2.1 Image Upload Flow
```
1. Merchant uploads CSV with image URLs
2. Worker downloads image, computes SHA-256
3. Check if hash exists in S3: s3://images/{hash}.{ext}
4. If exists: reuse URL; if not: upload once
5. Store hash → URL mapping in Products.imageHash
```

#### 2.2 S3 Bucket Structure
```
whizz-product-images-prod/
  ├── original/{sha256}.{ext}      # Original uploads
  ├── thumb/{sha256}_150x150.webp  # Generated thumbnails
  └── large/{sha256}_800x800.webp  # Generated sizes
```

**CloudFront**: Cache images with 1-year TTL

#### 2.3 Lambda Function: Image Processor
```javascript
// Trigger: S3 upload → Lambda
// Actions:
1. Compute content hash
2. Check if hash exists
3. If duplicate: delete new, return existing URL
4. If unique: generate thumbnails, store hash mapping
```

**Files to create**:
- `/backend/lambda/image-processor.js`
- `/backend/services/image-dedup-service.js`

### Phase 3: GlobalProducts Table (Week 3)
**Goal**: Canonical product catalog for shared data

#### 3.1 Table Schema
```javascript
TableName: WhizzMerchants_GlobalProducts
PK: globalProductId (UUID)
GSI1: sku-index (for barcode/SKU lookup)
GSI2: searchableName-categoryId-index (fuzzy matching)

Fields:
- globalProductId: string (PK)
- sku: string (indexed)
- barcode: string (indexed)
- canonicalName: string
- searchableName: string (normalized)
- description: string
- imageUrl: string (from dedup service)
- imageHash: string
- categoryId: string
- nutrition: object (optional)
- allergens: array
- ingredients: array
- createdAt: timestamp
- updatedAt: timestamp
- usageCount: number (how many merchants use it)
```

#### 3.2 Migration Strategy
```javascript
// Script: migrate-to-global-products.js
1. Scan WhizzMerchants_Products
2. Group by (searchableName + categoryId)
3. For each group:
   - Create GlobalProducts entry (first occurrence)
   - Update Products records with globalProductId
   - Merge duplicates (keep most complete data)
4. Generate usage statistics
```

#### 3.3 Update WhizzMerchants_Products
```javascript
// Add globalProductId reference
- globalProductId: string (FK to GlobalProducts)
- Remove: description, imageUrl (pull from global)
- Keep: price, isAvailable, businessId (merchant-specific)
- Add: localOverride: boolean (if merchant has custom image/description)
```

### Phase 4: Batch Upload Queue (Week 4)
**Goal**: Handle 10k+ products efficiently

#### 4.1 SQS Queue Architecture
```
Upload Flow:
1. Frontend: POST /api/merchants/{id}/items/bulk
2. API: Validate CSV, chunk into 100-row batches
3. Enqueue: Each batch → SQS queue
4. Worker Lambda: Process batch (25 items/write)
5. Track: Progress in DynamoDB upload_jobs table
```

#### 4.2 Upload Jobs Table
```javascript
TableName: WhizzMerchants_UploadJobs
PK: jobId (UUID)
SK: timestamp

Fields:
- jobId: string
- merchantId: string
- status: "pending" | "processing" | "completed" | "failed"
- totalItems: number
- processedItems: number
- createdItems: number
- updatedItems: number
- skippedItems: number
- errors: array
- startedAt: timestamp
- completedAt: timestamp
```

#### 4.3 Real-time Progress
```javascript
// WebSocket or polling endpoint
GET /api/upload-jobs/{jobId}/status
Response:
{
  status: "processing",
  progress: {
    total: 5000,
    processed: 2500,
    created: 1200,
    updated: 800,
    skipped: 500
  }
}
```

### Phase 5: Smart Category Mapping (Week 5)
**Goal**: Auto-map categories with ML fallback

#### 5.1 Category Classifier
```javascript
// Use AWS Comprehend or simple keyword matching
Input: product name + description
Output: suggested categoryId + confidence score

If confidence > 80%: auto-assign
If confidence < 80%: flag for manual review
```

#### 5.2 Mapping Cache
```javascript
// DynamoDB table: CategoryMappings
PK: normalizedName
SK: categoryId

Fields:
- normalizedName: string
- categoryId: string
- confidence: number
- lastUsed: timestamp
- usageCount: number
```

## Cost Optimization Strategy

### Storage Costs
**Before**: 10k products × 4 merchants = 40k records with duplicate images
**After**: 10k GlobalProducts + 40k variants = 50k records, single image per product

**Savings**:
- Images: 40k → 10k unique = 75% reduction
- Storage: ~$0.25/GB → ~$0.06/GB
- Bandwidth: Cached CloudFront hits = 90% cost reduction

### Write Costs
**Before**: Direct DynamoDB writes = $1.25 per million writes
**After**: Batched writes (25 items/request) = 40× fewer API calls

**DynamoDB Optimization**:
- Use BatchWriteItem (25 items max)
- Conditional writes (idempotent)
- GSI for fast lookups (avoid scans)

### Read Costs
**Before**: Scan products per merchant = expensive
**After**: Query BusinessIdIndex = 10× cheaper

## Execution Timeline

### Week 1: Foundation
- [ ] Add SKU/barcode/fingerprint fields to schema
- [ ] Update bulk upload handler with SKU matching
- [ ] Add CSV validation with new fields
- [ ] Test with 100-item upload

### Week 2: Images
- [ ] Create S3 bucket structure
- [ ] Build image dedup Lambda
- [ ] Implement hash-based URL reuse
- [ ] Test with sample product images

### Week 3: Global Catalog
- [ ] Create GlobalProducts table
- [ ] Write migration script
- [ ] Migrate existing 12 products
- [ ] Update frontend to show global vs local data

### Week 4: Scale
- [ ] Set up SQS queue
- [ ] Build batch processor Lambda
- [ ] Create upload jobs tracking
- [ ] Test with 5,000-item upload

### Week 5: Intelligence
- [ ] Add category classifier
- [ ] Build mapping cache
- [ ] Create merchant mapping UI
- [ ] Performance optimization

## Testing Strategy

### Unit Tests
- [ ] SKU matching logic
- [ ] Image hash deduplication
- [ ] Fingerprint generation
- [ ] Category classifier accuracy

### Integration Tests
- [ ] End-to-end bulk upload (100 items)
- [ ] Image dedup flow
- [ ] Global product linking
- [ ] Queue processing

### Load Tests
- [ ] 10,000 items upload (single merchant)
- [ ] 100 concurrent uploads
- [ ] Image dedup with 1,000 unique images
- [ ] Query performance (BusinessIdIndex)

## Rollback Plan

Each phase is backward compatible:
1. New fields are optional
2. Old upload format still works
3. GlobalProducts is additive (doesn't remove Products)
4. Can disable queue, fall back to direct writes

## Success Metrics

### Performance
- Bulk upload: < 5 min for 10k items
- Query latency: < 100ms for merchant products
- Image load: < 200ms (CloudFront cached)

### Cost
- Storage: 75% reduction vs duplicate approach
- API calls: 40× fewer writes via batching
- Bandwidth: 90% reduction via dedup

### Quality
- Duplicate rate: < 1%
- Category accuracy: > 95%
- Image reuse rate: > 80%

## Files to Create/Modify

### Backend
- [x] `/backend/merchants-bulk-handler.js` (extend with SKU)
- [ ] `/backend/services/image-dedup-service.js` (new)
- [ ] `/backend/services/category-classifier.js` (new)
- [ ] `/backend/lambda/image-processor.js` (new)
- [ ] `/backend/lambda/batch-upload-worker.js` (new)
- [ ] `/backend/migrations/create-global-products-table.js` (new)
- [ ] `/backend/migrations/migrate-products-to-global.js` (new)

### Frontend
- [ ] `/frontend/merchants.js` (add SKU fields to upload modal)
- [ ] `/frontend/components/upload-progress.js` (new)
- [ ] `/frontend/components/category-mapper.js` (new)

### Infrastructure
- [ ] `/infrastructure/dynamodb-tables.yaml` (GlobalProducts schema)
- [ ] `/infrastructure/sqs-queues.yaml` (upload queue)
- [ ] `/infrastructure/s3-buckets.yaml` (image storage)
- [ ] `/infrastructure/lambda-functions.yaml` (image processor, batch worker)

## Next Steps

1. **Review & Approve**: Get stakeholder sign-off on plan
2. **Environment Setup**: Create dev/staging DynamoDB tables
3. **Start Week 1**: Begin with SKU/barcode extension
4. **Daily Standups**: Track progress, adjust timeline
5. **Checkpoint Reviews**: End of each week, validate deliverables

## Questions to Resolve

1. Do we need multi-language support for product names? (Arabic + English)
2. Should GlobalProducts be merchant-editable or admin-only?
3. Image file size limits? (recommend: 5MB max, auto-compress)
4. Retention policy for old product images?
5. Real-time vs batch upload preference for UI?

---

**Status**: Ready for implementation
**Owner**: Platform Team
**Priority**: High (enables merchant scale)
**Estimated Effort**: 5 weeks (1 engineer full-time)
