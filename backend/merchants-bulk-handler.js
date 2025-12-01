/**
 * Enhanced Bulk Upload Handler with GlobalProducts Support (Week 3)
 * 
 * This handler:
 * 1. Checks GlobalProducts for existing products (by SKU/barcode)
 * 2. Creates global product if new
 * 3. Links merchant product to global product via globalProductId
 * 4. Maintains merchant-specific data (price, stock, availability)
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Use AWS SDK v2 for compatibility
const AWS = require('aws-sdk');
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || 'WhizzMerchants_Products';
const GLOBAL_PRODUCTS_TABLE = 'WhizzMerchants_GlobalProducts';
const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE || 'WhizzMerchants_Categories';

// Cache for categories
let categoriesCache = null;
let categoriesCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Normalize string for comparison
 */
function normalize(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Generate fingerprint for product
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
 * Generate image hash
 */
function generateImageHash(imageUrl) {
    if (!imageUrl) return null;
    return crypto.createHash('sha256').update(imageUrl).digest('hex').substring(0, 16);
}

/**
 * Load and cache categories
 */
async function getCategories() {
    const now = Date.now();
    if (categoriesCache && (now - categoriesCacheTime) < CACHE_TTL) {
        return categoriesCache;
    }
    
    const result = await dynamodb.scan({
        TableName: CATEGORIES_TABLE,
        FilterExpression: 'isActive = :active',
        ExpressionAttributeValues: { ':active': true }
    }).promise();
    
    categoriesCache = result.Items || [];
    categoriesCacheTime = now;
    return categoriesCache;
}

/**
 * Find categoryId by name
 */
async function findCategoryId(categoryName) {
    if (!categoryName) return null;
    const categories = await getCategories();
    const normalizedName = normalize(categoryName);
    const category = categories.find(cat => 
        normalize(cat.name) === normalizedName || 
        normalize(cat.name_ar) === normalizedName
    );
    return category ? category.categoryId : null;
}

/**
 * Find global product by SKU, barcode, or name
 */
async function findGlobalProduct(item, categoryId) {
    // Try SKU first (most reliable)
    if (item.sku) {
        try {
            const result = await dynamodb.query({
                TableName: GLOBAL_PRODUCTS_TABLE,
                IndexName: 'SkuIndex',
                KeyConditionExpression: 'sku = :sku',
                ExpressionAttributeValues: { ':sku': item.sku }
            }).promise();
            
            if (result.Items && result.Items.length > 0) {
                console.log(`Found global product by SKU: ${item.sku}`);
                return result.Items[0];
            }
        } catch (error) {
            console.warn(`SKU lookup failed for ${item.sku}:`, error.message);
        }
    }
    
    // Try barcode
    if (item.barcode) {
        try {
            const result = await dynamodb.query({
                TableName: GLOBAL_PRODUCTS_TABLE,
                IndexName: 'BarcodeIndex',
                KeyConditionExpression: 'barcode = :barcode',
                ExpressionAttributeValues: { ':barcode': item.barcode }
            }).promise();
            
            if (result.Items && result.Items.length > 0) {
                console.log(`Found global product by barcode: ${item.barcode}`);
                return result.Items[0];
            }
        } catch (error) {
            console.warn(`Barcode lookup failed for ${item.barcode}:`, error.message);
        }
    }
    
    // Try searchable name + category
    if (item.name && categoryId) {
        try {
            const searchableName = normalize(item.name);
            if (searchableName) {
                const result = await dynamodb.query({
                    TableName: GLOBAL_PRODUCTS_TABLE,
                    IndexName: 'SearchableNameCategoryIndex',
                    KeyConditionExpression: 'searchableName = :name AND categoryId = :cat',
                    ExpressionAttributeValues: {
                        ':name': searchableName,
                        ':cat': categoryId
                    }
                }).promise();
                
                if (result.Items && result.Items.length > 0) {
                    console.log(`Found global product by name+category: ${item.name}`);
                    return result.Items[0];
                }
            }
        } catch (error) {
            console.warn(`Name+category lookup failed for ${item.name}:`, error.message);
        }
    }
    
    return null;
}

/**
 * Create new global product
 */
async function createGlobalProduct(item, categoryId, merchantId) {
    const globalProductId = uuidv4();
    const searchableName = normalize(item.name) || globalProductId;
    const finalCategoryId = categoryId || 'uncategorized';
    
    const globalProduct = {
        globalProductId,
        canonicalName: item.name,
        searchableName,
        categoryId: finalCategoryId,
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        imageHash: generateImageHash(item.imageUrl),
        portion: item.portion || '',
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: merchantId,
        fingerprint: generateFingerprint({ ...item, categoryId: finalCategoryId })
    };
    
    // Only add SKU/barcode if present (GSI doesn't allow empty strings)
    if (item.sku) globalProduct.sku = item.sku;
    if (item.barcode) globalProduct.barcode = item.barcode;
    
    await dynamodb.put({
        TableName: GLOBAL_PRODUCTS_TABLE,
        Item: globalProduct
    }).promise();
    
    console.log(`Created global product: ${globalProduct.canonicalName} (${globalProductId})`);
    return globalProduct;
}

/**
 * Update global product usage count
 */
async function incrementGlobalProductUsage(globalProductId) {
    try {
        await dynamodb.update({
            TableName: GLOBAL_PRODUCTS_TABLE,
            Key: { globalProductId },
            UpdateExpression: 'SET usageCount = usageCount + :inc, updatedAt = :now',
            ExpressionAttributeValues: {
                ':inc': 1,
                ':now': new Date().toISOString()
            }
        }).promise();
    } catch (error) {
        console.warn(`Failed to increment usage for ${globalProductId}:`, error.message);
    }
}

/**
 * Main bulk upload handler with GlobalProducts support
 */
async function bulkUploadProductsWithGlobal(req, res) {
    try {
        const { merchantId, items } = req.body;
        
        if (!merchantId) {
            return res.status(400).json({ error: 'merchantId is required' });
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                error: 'items array is required and must not be empty' 
            });
        }
        
        if (items.length > 1000) {
            return res.status(400).json({ 
                error: 'Maximum 1,000 items per upload' 
            });
        }
        
        console.log(`Starting bulk upload for merchant ${merchantId} with ${items.length} items`);
        console.log('Using GlobalProducts table for deduplication');
        
        // Load categories cache
        await getCategories();
        
        // Query existing merchant products
        const existingProducts = await dynamodb.query({
            TableName: PRODUCTS_TABLE,
            IndexName: 'BusinessIdIndex',
            KeyConditionExpression: 'businessId = :businessId',
            ExpressionAttributeValues: { ':businessId': merchantId }
        }).promise();
        
        // Build lookup maps
        const existingByGlobalId = new Map();
        const existingBySKU = new Map();
        
        for (const product of existingProducts.Items || []) {
            if (product.globalProductId) {
                existingByGlobalId.set(product.globalProductId, product);
            }
            if (product.sku) {
                existingBySKU.set(product.sku.toLowerCase(), product);
            }
        }
        
        // Process items
        let created = 0, updated = 0, skipped = 0;
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
                        error: 'Missing required fields: name and price'
                    });
                    continue;
                }
                
                // Map category
                const categoryId = await findCategoryId(item.category);
                
                // Find or create global product
                let globalProduct = await findGlobalProduct(item, categoryId);
                
                if (!globalProduct) {
                    // Create new global product
                    globalProduct = await createGlobalProduct(item, categoryId, merchantId);
                } else {
                    // Existing global product
                    console.log(`Using existing global product: ${globalProduct.canonicalName}`);
                }
                
                // Check if merchant already has this product
                let existingMerchantProduct = existingByGlobalId.get(globalProduct.globalProductId);
                if (!existingMerchantProduct && item.sku) {
                    existingMerchantProduct = existingBySKU.get(item.sku.toLowerCase());
                }
                
                // Build merchant product data
                const productData = {
                    businessId: merchantId,
                    globalProductId: globalProduct.globalProductId,
                    
                    // Merchant-specific fields
                    price: parseFloat(item.price),
                    currency: (item.currency || 'IQD').toUpperCase(),
                    isAvailable: item.isAvailable !== false,
                    vatRate: parseFloat(item.vatRate || 0),
                    stockQty: parseInt(item.stockQty || 0, 10),
                    
                    // Optional overrides (null = use global)
                    name: null,  // Use global by default
                    description: null,
                    imageUrl: null,
                    categoryId: null,
                    
                    updatedAt: new Date().toISOString()
                };
                
                // Add SKU/barcode if provided (for merchant's own tracking)
                if (item.sku) productData.sku = item.sku;
                if (item.barcode) productData.barcode = item.barcode;
                if (item.portion) productData.portion = item.portion;
                
                if (existingMerchantProduct) {
                    // Update existing
                    productData.productId = existingMerchantProduct.productId;
                    
                    await dynamodb.put({
                        TableName: PRODUCTS_TABLE,
                        Item: productData
                    }).promise();
                    
                    updated++;
                    console.log(`Updated: ${globalProduct.canonicalName} for merchant ${merchantId}`);
                } else {
                    // Create new merchant product
                    productData.productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    productData.createdAt = new Date().toISOString();
                    
                    await dynamodb.put({
                        TableName: PRODUCTS_TABLE,
                        Item: productData
                    }).promise();
                    
                    // Increment global usage count
                    await incrementGlobalProductUsage(globalProduct.globalProductId);
                    
                    created++;
                    console.log(`Created: ${globalProduct.canonicalName} for merchant ${merchantId}`);
                    
                    // Update lookup maps
                    existingByGlobalId.set(globalProduct.globalProductId, productData);
                    if (productData.sku) {
                        existingBySKU.set(productData.sku.toLowerCase(), productData);
                    }
                }
                
            } catch (error) {
                console.error(`Error processing row ${rowNum}:`, error);
                errors.push({
                    row: rowNum,
                    name: item.name || 'N/A',
                    error: error.message
                });
            }
        }
        
        // Return summary
        const summary = {
            processed: items.length,
            created,
            updated,
            skipped,
            errors: errors.length
        };
        
        console.log(`Upload complete: created=${created}, updated=${updated}, skipped=${skipped}, errors=${errors.length}`);
        
        res.status(200).json({
            success: true,
            summary,
            errors: errors.length > 0 ? errors : undefined
        });
        
    } catch (error) {
        console.error('Bulk upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to bulk upload items',
            message: error.message
        });
    }
}

module.exports = {
    bulkUploadProducts: bulkUploadProductsWithGlobal
};
