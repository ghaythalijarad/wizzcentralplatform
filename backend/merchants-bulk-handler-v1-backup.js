/**
 * Bulk Upload Handler for WhizzCentral Platform - Merchants Management
 * Handles bulk product uploads with deduplication, fingerprinting, and category mapping
 */

const crypto = require('crypto');

// Use AWS SDK v2 for compatibility
const AWS = require('aws-sdk');
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || 'WhizzMerchants_Products';
const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE || 'WhizzMerchants_Categories';

// Cache for categories to avoid repeated DynamoDB scans
let categoriesCache = null;
let categoriesCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Normalize string for comparison (remove spaces, lowercase, alphanumeric only)
 */
function normalize(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Generate fingerprint (SHA-256 hash) for product to detect changes
 * Includes core product attributes (excluding merchant-specific fields like price)
 */
function generateFingerprint(item) {
    const data = JSON.stringify({
        name: item.name || '',
        description: item.description || '',
        categoryId: item.categoryId || '',
        sku: item.sku || '',
        barcode: item.barcode || '',
        portion: item.portion || ''
    });
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate image hash from URL or content
 * For future: compute hash from actual image bytes
 */
function generateImageHash(imageUrl) {
    if (!imageUrl) return null;
    // For now, hash the URL; future: download and hash content
    return crypto.createHash('sha256').update(imageUrl).digest('hex').substring(0, 16);
}

/**
 * Generate internal SKU if not provided
 * Format: {normalizedName}_{categoryId}_{portion}
 */
function generateInternalSKU(name, categoryId, portion = '') {
    const normName = normalize(name);
    const parts = [normName, categoryId || 'nocat', portion || 'std'];
    return parts.join('_').substring(0, 64); // DynamoDB string limit
}

/**
 * Load and cache all categories from DynamoDB
 */
async function getCategories() {
    const now = Date.now();
    
    // Return cached categories if still valid
    if (categoriesCache && (now - categoriesCacheTime) < CACHE_TTL) {
        return categoriesCache;
    }
    
    try {
        const result = await dynamodb.scan({
            TableName: CATEGORIES_TABLE,
            FilterExpression: 'isActive = :active',
            ExpressionAttributeValues: {
                ':active': true
            }
        }).promise();
        
        categoriesCache = result.Items || [];
        categoriesCacheTime = now;
        
        console.log(`Loaded ${categoriesCache.length} categories from DynamoDB`);
        return categoriesCache;
    } catch (error) {
        console.error('Error loading categories:', error);
        throw new Error(`Failed to load categories: ${error.message}`);
    }
}

/**
 * Find categoryId by name (English or Arabic)
 */
async function findCategoryId(categoryName) {
    if (!categoryName) return null;
    
    const categories = await getCategories();
    const normalizedName = normalize(categoryName);
    
    // Try to match by English name or Arabic name
    const category = categories.find(cat => 
        normalize(cat.name) === normalizedName || 
        normalize(cat.name_ar) === normalizedName
    );
    
    return category ? category.categoryId : null;
}

/**
 * Main bulk upload handler
 */
async function bulkUploadProducts(req, res) {
    try {
        const { merchantId, items } = req.body;
        
        // Validate input
        if (!merchantId) {
            return res.status(400).json({ 
                error: 'merchantId is required' 
            });
        }
        
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                error: 'items array is required and must not be empty' 
            });
        }
        
        if (items.length > 1000) {
            return res.status(400).json({ 
                error: 'Maximum 1,000 items per upload. For larger files, contact support.' 
            });
        }
        
        console.log(`Starting bulk upload for merchant ${merchantId} with ${items.length} items`);
        
        // Load categories cache
        await getCategories();
        
        // Query existing products for this merchant using GSI
        const existingProducts = await dynamodb.query({
            TableName: PRODUCTS_TABLE,
            IndexName: 'BusinessIdIndex',
            KeyConditionExpression: 'businessId = :businessId',
            ExpressionAttributeValues: {
                ':businessId': merchantId
            }
        }).promise();
        
        console.log(`Found ${existingProducts.Items.length} existing products for merchant ${merchantId}`);
        
        // Build multiple lookup maps for efficient matching
        const existingByName = new Map();
        const existingBySKU = new Map();
        const existingByBarcode = new Map();
        
        for (const product of existingProducts.Items) {
            const normName = normalize(product.name);
            const productRef = {
                productId: product.productId,
                fingerprint: product.fingerprint,
                name: product.name,
                sku: product.sku,
                barcode: product.barcode
            };
            
            // Index by normalized name
            existingByName.set(normName, productRef);
            
            // Index by SKU (if present)
            if (product.sku) {
                existingBySKU.set(product.sku.toLowerCase(), productRef);
            }
            
            // Index by barcode (if present)
            if (product.barcode) {
                existingByBarcode.set(product.barcode, productRef);
            }
        }
        
        // Process items
        let created = 0;
        let updated = 0;
        let skipped = 0;
        const errors = [];
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const rowNum = i + 1;
            
            try {
                // Validate required fields
                if (!item.name || !item.price) {
                    errors.push({
                        row: rowNum,
                        name: item.name || 'N/A',
                        error: 'Missing required fields: name and price are required'
                    });
                    continue;
                }
                
                // Map category name to categoryId
                let categoryId = null;
                if (item.category) {
                    categoryId = await findCategoryId(item.category);
                    if (!categoryId) {
                        // Non-fatal: log warning but continue with null category
                        console.warn(`Category "${item.category}" not found for item ${rowNum}, continuing without category`);
                    }
                }
                
                // Priority-based matching: SKU > Barcode > Name+Category
                let existing = null;
                let matchMethod = 'none';
                
                // 1. Try SKU match (highest priority)
                if (item.sku && existingBySKU.has(item.sku.toLowerCase())) {
                    existing = existingBySKU.get(item.sku.toLowerCase());
                    matchMethod = 'sku';
                }
                
                // 2. Try barcode match
                if (!existing && item.barcode && existingByBarcode.has(item.barcode)) {
                    existing = existingByBarcode.get(item.barcode);
                    matchMethod = 'barcode';
                }
                
                // 3. Fallback to normalized name match
                if (!existing) {
                    const normName = normalize(item.name);
                    if (existingByName.has(normName)) {
                        existing = existingByName.get(normName);
                        matchMethod = 'name';
                    }
                }
                
                // Generate internal SKU if not provided
                const internalSKU = item.sku || generateInternalSKU(item.name, categoryId, item.portion);
                
                // Compute image hash
                const imageHash = generateImageHash(item.imageUrl);
                
                // Build product object with new fields
                const productData = {
                    name: item.name.trim(),
                    searchableName: normalize(item.name),
                    description: item.description ? item.description.trim() : '',
                    price: parseFloat(item.price),
                    currency: (item.currency || 'IQD').toUpperCase(),
                    categoryId: categoryId,
                    imageUrl: item.imageUrl || '',
                    imageHash: imageHash,
                    isAvailable: item.isAvailable !== false, // default true
                    sku: internalSKU,
                    barcode: item.barcode || '',
                    portion: item.portion || '', // e.g., "can", "bottle", "large", "small"
                    businessId: merchantId,
                    vatRate: parseFloat(item.vatRate || 0),
                    stockQty: parseInt(item.stockQty || 0, 10)
                };
                
                // Generate fingerprint
                productData.fingerprint = generateFingerprint(productData);
                
                // Log match method for debugging
                if (existing) {
                    console.log(`Match found for "${item.name}" via ${matchMethod}`);
                }
                
                // Decide: create, update, or skip
                if (existing) {
                    if (existing.fingerprint === productData.fingerprint) {
                        // Same fingerprint - skip
                        skipped++;
                        console.log(`Skipped: ${item.name} (no changes, matched via ${matchMethod})`);
                    } else {
                        // Different fingerprint - update
                        productData.productId = existing.productId;
                        productData.updatedAt = new Date().toISOString();
                        
                        await dynamodb.put({
                            TableName: PRODUCTS_TABLE,
                            Item: productData
                        }).promise();
                        
                        updated++;
                        console.log(`Updated: ${item.name} (matched via ${matchMethod})`);
                    }
                } else {
                    // New product - create
                    productData.productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    productData.createdAt = new Date().toISOString();
                    productData.updatedAt = productData.createdAt;
                    
                    await dynamodb.put({
                        TableName: PRODUCTS_TABLE,
                        Item: productData
                    }).promise();
                    
                    created++;
                    console.log(`Created: ${item.name} with SKU ${productData.sku}`);
                    
                    // Add to lookup maps for subsequent duplicates in same batch
                    const normName = normalize(item.name);
                    const productRef = {
                        productId: productData.productId,
                        fingerprint: productData.fingerprint,
                        name: productData.name,
                        sku: productData.sku,
                        barcode: productData.barcode
                    };
                    
                    existingByName.set(normName, productRef);
                    if (productData.sku) {
                        existingBySKU.set(productData.sku.toLowerCase(), productRef);
                    }
                    if (productData.barcode) {
                        existingByBarcode.set(productData.barcode, productRef);
                    }
                }
                
            } catch (itemError) {
                console.error(`Error processing item ${rowNum}:`, itemError);
                errors.push({
                    row: rowNum,
                    name: item.name || 'N/A',
                    error: itemError.message
                });
            }
        }
        
        // Return statistics
        const response = {
            processed: items.length,
            created,
            updated,
            skipped,
            errors
        };
        
        console.log('Bulk upload complete:', response);
        
        return res.status(200).json(response);
        
    } catch (error) {
        console.error('Bulk upload error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}

module.exports = {
    bulkUploadProducts
};
