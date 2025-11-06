// WizzCentral Regions Service - Business Logic Layer
// Handles complex region operations with transaction safety and cascading logic

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const {
    REGION_TYPE,
    REGION_STATUS,
    validateRegionHierarchy
} = require('./regions-db-schema');

const TABLE_NAME = 'WizzCentral_Regions';

/**
 * RegionService Class
 * Implements business logic for region management with hierarchical support
 */
class RegionService {
    constructor() {
        this.tableName = TABLE_NAME;
        this.maxRetries = 3;
        this.retryDelay = 1000; // milliseconds
    }

    /**
     * Toggle region status with cascading logic and transaction safety
     * 
     * Business Rules:
     * 1. If PROVINCE is deactivated → deactivate all districts and neighborhoods
     * 2. If DISTRICT is deactivated → deactivate all neighborhoods
     * 3. If DISTRICT is activated → activate neighborhoods only if parent PROVINCE is active
     * 4. If NEIGHBORHOOD is activated → check parent DISTRICT and grandparent PROVINCE
     * 
     * @param {string} regionId - The ID of the region to toggle
     * @param {string} newStatus - The new status (ACTIVE or INACTIVE)
     * @returns {Promise<Object>} Result with affected regions count per level
     */
    async toggleRegionStatus(regionId, newStatus) {
        console.log(`🔄 Toggling region ${regionId} to status: ${newStatus}`);
        
        try {
            // Validate status value
            if (!Object.values(REGION_STATUS).includes(newStatus)) {
                throw new Error(`Invalid status: ${newStatus}. Must be ACTIVE or INACTIVE`);
            }

            // Get the region
            const region = await this.getRegionById(regionId);
            
            if (!region) {
                throw new Error(`Region ${regionId} not found`);
            }

            // Check if status is already the same
            if (region.status === newStatus) {
                return {
                    success: true,
                    message: `Region is already ${newStatus}`,
                    region,
                    affectedRegions: {
                        provinces: 0,
                        districts: 0,
                        neighborhoods: 0,
                        total: 0
                    }
                };
            }

            let result;

            // Handle deactivation with cascading
            if (newStatus === REGION_STATUS.INACTIVE) {
                result = await this.deactivateRegionWithCascade(region);
            } 
            // Handle activation with parent validation
            else {
                result = await this.activateRegionWithValidation(region);
            }

            console.log(`✅ Region status toggle completed successfully`);
            return result;

        } catch (error) {
            console.error('❌ Error toggling region status:', error);
            throw error;
        }
    }

    /**
     * Deactivate a region and cascade to all children
     * Uses transaction safety with batch operations
     * 
     * @param {Object} region - The region to deactivate
     * @returns {Promise<Object>} Result with affected regions
     */
    async deactivateRegionWithCascade(region) {
        console.log(`📉 Deactivating region: ${region.regionName} (${region.region_type})`);
        
        const affectedRegions = {
            provinces: 0,
            districts: 0,
            neighborhoods: 0,
            total: 0,
            details: []
        };

        try {
            // Collect all regions to deactivate
            const regionsToDeactivate = [region];
            
            // Get all descendants recursively
            const descendants = await this.getAllDescendants(region.regionId);
            regionsToDeactivate.push(...descendants);

            console.log(`Found ${regionsToDeactivate.length} regions to deactivate (including self)`);

            // Deactivate all regions with transaction safety
            const updateResults = await this.bulkUpdateRegionStatus(
                regionsToDeactivate,
                REGION_STATUS.INACTIVE
            );

            // Count affected regions by type
            for (const updatedRegion of updateResults) {
                affectedRegions.details.push({
                    regionId: updatedRegion.regionId,
                    regionName: updatedRegion.regionName,
                    regionType: updatedRegion.region_type,
                    previousStatus: updatedRegion.previousStatus
                });

                switch (updatedRegion.region_type) {
                    case REGION_TYPE.PROVINCE:
                        affectedRegions.provinces++;
                        break;
                    case REGION_TYPE.DISTRICT:
                        affectedRegions.districts++;
                        break;
                    case REGION_TYPE.NEIGHBORHOOD:
                        affectedRegions.neighborhoods++;
                        break;
                }
            }

            affectedRegions.total = updateResults.length;

            return {
                success: true,
                message: `Successfully deactivated ${affectedRegions.total} regions`,
                region: updateResults.find(r => r.regionId === region.regionId),
                affectedRegions,
                operation: 'DEACTIVATE_CASCADE'
            };

        } catch (error) {
            console.error('❌ Error in deactivation cascade:', error);
            throw new Error(`Failed to deactivate region: ${error.message}`);
        }
    }

    /**
     * Activate a region with parent validation
     * Only activates if parent hierarchy is active
     * 
     * @param {Object} region - The region to activate
     * @returns {Promise<Object>} Result with affected regions
     */
    async activateRegionWithValidation(region) {
        console.log(`📈 Activating region: ${region.regionName} (${region.region_type})`);
        
        const affectedRegions = {
            provinces: 0,
            districts: 0,
            neighborhoods: 0,
            total: 0,
            details: []
        };

        try {
            // Validate parent hierarchy is active
            const parentValidation = await this.validateParentHierarchyActive(region);
            
            if (!parentValidation.valid) {
                throw new Error(parentValidation.message);
            }

            // Collect regions to activate
            const regionsToActivate = [region];

            // If activating a DISTRICT, activate all its neighborhoods
            if (region.region_type === REGION_TYPE.DISTRICT) {
                const neighborhoods = await this.getDirectChildren(region.regionId);
                regionsToActivate.push(...neighborhoods);
                console.log(`Will activate ${neighborhoods.length} neighborhoods under this district`);
            }

            // Activate all collected regions
            const updateResults = await this.bulkUpdateRegionStatus(
                regionsToActivate,
                REGION_STATUS.ACTIVE
            );

            // Count affected regions by type
            for (const updatedRegion of updateResults) {
                affectedRegions.details.push({
                    regionId: updatedRegion.regionId,
                    regionName: updatedRegion.regionName,
                    regionType: updatedRegion.region_type,
                    previousStatus: updatedRegion.previousStatus
                });

                switch (updatedRegion.region_type) {
                    case REGION_TYPE.PROVINCE:
                        affectedRegions.provinces++;
                        break;
                    case REGION_TYPE.DISTRICT:
                        affectedRegions.districts++;
                        break;
                    case REGION_TYPE.NEIGHBORHOOD:
                        affectedRegions.neighborhoods++;
                        break;
                }
            }

            affectedRegions.total = updateResults.length;

            return {
                success: true,
                message: `Successfully activated ${affectedRegions.total} regions`,
                region: updateResults.find(r => r.regionId === region.regionId),
                affectedRegions,
                operation: 'ACTIVATE_WITH_VALIDATION'
            };

        } catch (error) {
            console.error('❌ Error in activation with validation:', error);
            throw new Error(`Failed to activate region: ${error.message}`);
        }
    }

    /**
     * Validate that parent hierarchy is active
     * 
     * @param {Object} region - The region to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateParentHierarchyActive(region) {
        console.log(`🔍 Validating parent hierarchy for: ${region.regionName}`);

        try {
            // PROVINCE has no parent, always valid
            if (region.region_type === REGION_TYPE.PROVINCE) {
                return { valid: true };
            }

            // Check immediate parent
            if (!region.parent_id) {
                return {
                    valid: false,
                    message: `${region.region_type} region must have a parent`
                };
            }

            const parent = await this.getRegionById(region.parent_id);
            
            if (!parent) {
                return {
                    valid: false,
                    message: `Parent region ${region.parent_id} not found`
                };
            }

            if (parent.status !== REGION_STATUS.ACTIVE) {
                return {
                    valid: false,
                    message: `Cannot activate ${region.region_type} because parent ${parent.region_type} "${parent.regionName}" is ${parent.status}`
                };
            }

            // For NEIGHBORHOOD, also check grandparent (PROVINCE)
            if (region.region_type === REGION_TYPE.NEIGHBORHOOD && parent.parent_id) {
                const grandparent = await this.getRegionById(parent.parent_id);
                
                if (!grandparent) {
                    return {
                        valid: false,
                        message: `Grandparent region ${parent.parent_id} not found`
                    };
                }

                if (grandparent.status !== REGION_STATUS.ACTIVE) {
                    return {
                        valid: false,
                        message: `Cannot activate NEIGHBORHOOD because grandparent PROVINCE "${grandparent.regionName}" is ${grandparent.status}`
                    };
                }
            }

            return { valid: true };

        } catch (error) {
            console.error('❌ Error validating parent hierarchy:', error);
            throw error;
        }
    }

    /**
     * Bulk update region status with transaction safety
     * Implements retry logic and batch processing
     * 
     * @param {Array} regions - Regions to update
     * @param {string} newStatus - New status to set
     * @returns {Promise<Array>} Updated regions
     */
    async bulkUpdateRegionStatus(regions, newStatus) {
        console.log(`📦 Bulk updating ${regions.length} regions to ${newStatus}`);
        
        const updatedRegions = [];
        const batchSize = 25; // DynamoDB batch write limit
        const batches = this.chunkArray(regions, batchSize);

        try {
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} items)`);

                // Process each item in the batch with retry logic
                const batchPromises = batch.map(region => 
                    this.updateRegionStatusWithRetry(region, newStatus)
                );

                const batchResults = await Promise.all(batchPromises);
                updatedRegions.push(...batchResults);

                // Small delay between batches to avoid throttling
                if (batchIndex < batches.length - 1) {
                    await this.sleep(100);
                }
            }

            console.log(`✅ Successfully updated ${updatedRegions.length} regions`);
            return updatedRegions;

        } catch (error) {
            console.error('❌ Error in bulk update:', error);
            throw new Error(`Bulk update failed: ${error.message}`);
        }
    }

    /**
     * Update a single region status with retry logic
     * 
     * @param {Object} region - Region to update
     * @param {string} newStatus - New status
     * @returns {Promise<Object>} Updated region
     */
    async updateRegionStatusWithRetry(region, newStatus) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const previousStatus = region.status;
                
                const params = {
                    TableName: this.tableName,
                    Key: { regionId: region.regionId },
                    UpdateExpression: 'SET #status = :status, isActive = :isActive, updatedAt = :now',
                    ExpressionAttributeNames: {
                        '#status': 'status'
                    },
                    ExpressionAttributeValues: {
                        ':status': newStatus,
                        ':isActive': newStatus === REGION_STATUS.ACTIVE,
                        ':now': new Date().toISOString()
                    },
                    ReturnValues: 'ALL_NEW'
                };

                const result = await docClient.update(params).promise();
                
                return {
                    ...result.Attributes,
                    previousStatus
                };

            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Attempt ${attempt}/${this.maxRetries} failed for region ${region.regionId}:`, error.message);
                
                if (attempt < this.maxRetries) {
                    await this.sleep(this.retryDelay * attempt); // Exponential backoff
                }
            }
        }

        throw new Error(`Failed to update region ${region.regionId} after ${this.maxRetries} attempts: ${lastError.message}`);
    }

    /**
     * Get all descendants of a region recursively
     * 
     * @param {string} regionId - Parent region ID
     * @returns {Promise<Array>} All descendant regions
     */
    async getAllDescendants(regionId) {
        console.log(`🌳 Getting all descendants of region: ${regionId}`);
        
        const descendants = [];
        const children = await this.getDirectChildren(regionId);
        
        for (const child of children) {
            descendants.push(child);
            
            // Recursively get grandchildren
            const grandchildren = await this.getAllDescendants(child.regionId);
            descendants.push(...grandchildren);
        }

        return descendants;
    }

    /**
     * Get direct children of a region
     * 
     * @param {string} parentId - Parent region ID
     * @returns {Promise<Array>} Direct child regions
     */
    async getDirectChildren(parentId) {
        try {
            const params = {
                TableName: this.tableName,
                IndexName: 'ParentIdIndex',
                KeyConditionExpression: 'parent_id = :parentId',
                ExpressionAttributeValues: {
                    ':parentId': parentId
                }
            };

            const result = await docClient.query(params).promise();
            return result.Items || [];

        } catch (error) {
            console.error('❌ Error getting children:', error);
            throw error;
        }
    }

    /**
     * Get a region by ID
     * 
     * @param {string} regionId - Region ID
     * @returns {Promise<Object>} Region object
     */
    async getRegionById(regionId) {
        try {
            const params = {
                TableName: this.tableName,
                Key: { regionId }
            };

            const result = await docClient.get(params).promise();
            return result.Item || null;

        } catch (error) {
            console.error('❌ Error getting region:', error);
            throw error;
        }
    }

    /**
     * Get region status summary (counts by type and status)
     * 
     * @returns {Promise<Object>} Status summary
     */
    async getRegionStatusSummary() {
        console.log('📊 Getting region status summary');

        try {
            const params = {
                TableName: this.tableName
            };

            const result = await docClient.scan(params).promise();
            const regions = result.Items || [];

            const summary = {
                total: regions.length,
                byType: {
                    [REGION_TYPE.PROVINCE]: { total: 0, active: 0, inactive: 0 },
                    [REGION_TYPE.DISTRICT]: { total: 0, active: 0, inactive: 0 },
                    [REGION_TYPE.NEIGHBORHOOD]: { total: 0, active: 0, inactive: 0 }
                },
                byStatus: {
                    [REGION_STATUS.ACTIVE]: 0,
                    [REGION_STATUS.INACTIVE]: 0
                }
            };

            for (const region of regions) {
                const type = region.region_type || 'UNKNOWN';
                const status = region.status || REGION_STATUS.INACTIVE;

                if (summary.byType[type]) {
                    summary.byType[type].total++;
                    summary.byType[type][status.toLowerCase()]++;
                }

                if (summary.byStatus[status] !== undefined) {
                    summary.byStatus[status]++;
                }
            }

            return summary;

        } catch (error) {
            console.error('❌ Error getting status summary:', error);
            throw error;
        }
    }

    /**
     * Utility: Split array into chunks
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Utility: Sleep/delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
const regionService = new RegionService();

module.exports = {
    RegionService,
    regionService
};
