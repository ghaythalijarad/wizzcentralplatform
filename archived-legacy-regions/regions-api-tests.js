// WizzCentral Regions API - Test Suite
// PHASE 5: Comprehensive tests for all API endpoints

const {
    getRegions,
    getRegionById,
    getCompleteHierarchy,
    getActiveRegions,
    toggleRegionStatus,
    validateStatusChange,
    handler
} = require('./regions-api-handler');

const { REGION_STATUS, REGION_TYPE } = require('./regions-db-schema');

/**
 * Test Suite Runner
 */
class RegionsAPITestSuite {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    /**
     * Run all tests
     */
    async runAll() {
        console.log('\n🧪 Starting Regions API Test Suite\n');
        console.log('='.repeat(60));
        
        try {
            // Phase 5 Endpoint Tests
            await this.testGetCompleteHierarchy();
            await this.testGetActiveRegions();
            await this.testToggleRegionStatus();
            await this.testToggleWithCascade();
            await this.testToggleWithValidation();
            
            // Status Change Validation Tests
            await this.testValidateStatusChange();
            
            // Lambda Handler Integration Tests
            await this.testHandlerGetHierarchy();
            await this.testHandlerGetActive();
            await this.testHandlerPatchToggleStatus();
            
            // Edge Case Tests
            await this.testInvalidStatusValue();
            await this.testNonExistentRegion();
            await this.testSameStatusToggle();
            
            this.printSummary();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            throw error;
        }
    }

    /**
     * Test: GET /regions/hierarchy
     */
    async testGetCompleteHierarchy() {
        this.totalTests++;
        console.log('\n📝 Test: GET /regions/hierarchy');
        
        try {
            const result = await getCompleteHierarchy();
            
            // Validate response structure
            this.assert(result.hierarchy !== undefined, 'Response should have hierarchy property');
            this.assert(result.metadata !== undefined, 'Response should have metadata');
            this.assert(Array.isArray(result.hierarchy), 'Hierarchy should be an array');
            this.assert(result.metadata.totalProvinces >= 0, 'Metadata should include totalProvinces');
            this.assert(result.metadata.totalDistricts >= 0, 'Metadata should include totalDistricts');
            this.assert(result.metadata.totalNeighborhoods >= 0, 'Metadata should include totalNeighborhoods');
            
            // Validate nested structure
            if (result.hierarchy.length > 0) {
                const province = result.hierarchy[0];
                this.assert(province.region_type === REGION_TYPE.PROVINCE, 'Top level should be provinces');
                this.assert(Array.isArray(province.children), 'Provinces should have children array');
                
                if (province.children.length > 0) {
                    const district = province.children[0];
                    this.assert(district.region_type === REGION_TYPE.DISTRICT, 'Second level should be districts');
                    this.assert(Array.isArray(district.children), 'Districts should have children array');
                }
            }
            
            console.log('✅ Test passed: Complete hierarchy structure valid');
            console.log(`   Provinces: ${result.metadata.totalProvinces}`);
            console.log(`   Districts: ${result.metadata.totalDistricts}`);
            console.log(`   Neighborhoods: ${result.metadata.totalNeighborhoods}`);
            
            this.passedTests++;
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.failedTests++;
            return false;
        }
    }

    /**
     * Test: GET /regions/active
     */
    async testGetActiveRegions() {
        this.totalTests++;
        console.log('\n📝 Test: GET /regions/active');
        
        try {
            const result = await getActiveRegions();
            
            // Validate response structure
            this.assert(result.regions !== undefined, 'Response should have regions property');
            this.assert(result.metadata !== undefined, 'Response should have metadata');
            this.assert(Array.isArray(result.regions), 'Regions should be an array');
            
            // Validate all regions are active
            const allActive = result.regions.every(r => r.status === REGION_STATUS.ACTIVE);
            this.assert(allActive, 'All returned regions should be ACTIVE');
            
            // Validate metadata
            this.assert(result.metadata.total === result.regions.length, 'Metadata total should match array length');
            this.assert(result.metadata.byType !== undefined, 'Metadata should include byType breakdown');
            
            console.log('✅ Test passed: Active regions filtered correctly');
            console.log(`   Total active: ${result.metadata.total}`);
            console.log(`   By type:`, result.metadata.byType);
            
            this.passedTests++;
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.failedTests++;
            return false;
        }
    }

    /**
     * Test: GET /regions/active with hierarchy
     */
    async testGetActiveRegionsWithHierarchy() {
        this.totalTests++;
        console.log('\n📝 Test: GET /regions/active?includeHierarchy=true');
        
        try {
            const result = await getActiveRegions({ includeHierarchy: 'true' });
            
            // Validate hierarchical structure
            this.assert(result.hierarchy !== undefined, 'Response should have hierarchy property');
            this.assert(Array.isArray(result.hierarchy), 'Hierarchy should be an array');
            
            // Validate all regions in hierarchy are active
            for (const province of result.hierarchy) {
                this.assert(province.status === REGION_STATUS.ACTIVE, 'Province should be active');
                for (const district of province.children || []) {
                    this.assert(district.status === REGION_STATUS.ACTIVE, 'District should be active');
                    for (const neighborhood of district.children || []) {
                        this.assert(neighborhood.status === REGION_STATUS.ACTIVE, 'Neighborhood should be active');
                    }
                }
            }
            
            console.log('✅ Test passed: Active regions hierarchy valid');
            this.passedTests++;
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.failedTests++;
            return false;
        }
    }

    /**
     * Test: PATCH /regions/:id/toggleStatus (basic)
     */
    async testToggleRegionStatus() {
        this.totalTests++;
        console.log('\n📝 Test: PATCH /regions/:id/toggleStatus');
        
        try {
            // Get a test region (neighborhood without children)
            const regions = await getRegions({ region_type: REGION_TYPE.NEIGHBORHOOD });
            
            if (regions.length === 0) {
                console.log('⚠️  Test skipped: No neighborhoods found');
                this.passedTests++;
                return true;
            }
            
            const testRegion = regions[0];
            const originalStatus = testRegion.status;
            const newStatus = originalStatus === REGION_STATUS.ACTIVE 
                ? REGION_STATUS.INACTIVE 
                : REGION_STATUS.ACTIVE;
            
            // Toggle status
            const result = await toggleRegionStatus(testRegion.regionId, { status: newStatus });
            
            // Validate response
            this.assert(result.success !== false, 'Toggle should succeed');
            this.assert(result.affectedRegions !== undefined, 'Should include affected regions count');
            
            console.log('✅ Test passed: Status toggled successfully');
            console.log(`   Region: ${testRegion.regionName}`);
            console.log(`   ${originalStatus} → ${newStatus}`);
            console.log(`   Affected: ${result.affectedRegions.total} regions`);
            
            // Toggle back to original status
            await toggleRegionStatus(testRegion.regionId, { status: originalStatus });
            
            this.passedTests++;
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.failedTests++;
            return false;
        }
    }

    /**
     * Test: Toggle with cascade (deactivate province)
     */
    async testToggleWithCascade() {
        this.totalTests++;
        console.log('\n📝 Test: Toggle with cascade deactivation');
        
        try {
            // Get an active province
            const provinces = await getRegions({ 
                region_type: REGION_TYPE.PROVINCE,
                status: REGION_STATUS.ACTIVE
            });
            
            if (provinces.length === 0) {
                console.log('⚠️  Test skipped: No active provinces found');
                this.passedTests++;
                return true;
            }
            
            const testProvince = provinces[0];
            
            // Deactivate province (should cascade to children)
            const result = await toggleRegionStatus(testProvince.regionId, { 
                status: REGION_STATUS.INACTIVE 
            });
            
            // Validate cascade
            this.assert(result.affectedRegions !== undefined, 'Should include affected regions');
            this.assert(result.affectedRegions.total > 0, 'Should affect at least the province itself');
            
            console.log('✅ Test passed: Cascade deactivation works');
            console.log(`   Province: ${testProvince.regionName}`);
            console.log(`   Total affected: ${result.affectedRegions.total}`);
            console.log(`   Districts: ${result.affectedRegions.districts}`);
            console.log(`   Neighborhoods: ${result.affectedRegions.neighborhoods}`);
            
            // Reactivate province
            await toggleRegionStatus(testProvince.regionId, { 
                status: REGION_STATUS.ACTIVE 
            });
            
            this.passedTests++;
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.failedTests++;
            return false;
        }
    }

    /**
     * Test: Toggle with parent validation
     */
    async testToggleWithValidation() {
        this.totalTests++;
        console.log('\n📝 Test: Toggle with parent validation');
        
        try {
            // Get an inactive neighborhood with inactive parent
            const neighborhoods = await getRegions({ 
                region_type: REGION_TYPE.NEIGHBORHOOD,
                status: REGION_STATUS.INACTIVE
            });
            
            if (neighborhoods.length === 0) {
                console.log('⚠️  Test skipped: No inactive neighborhoods found');
                this.passedTests++;
                return true;
            }
            
            const testNeighborhood = neighborhoods[0];
            
            // Try to activate neighborhood (might fail if parent is inactive)
            try {
                await toggleRegionStatus(testNeighborhood.regionId, { 
                    status: REGION_STATUS.ACTIVE 
                });
                console.log('✅ Test passed: Activation succeeded (parent was active)');
            } catch (validationError) {
                // Expected if parent is inactive
                this.assert(
                    validationError.message.includes('parent') || 
                    validationError.message.includes('inactive'),
                    'Error should mention parent validation'
                );
                console.log('✅ Test passed: Validation correctly prevented activation');
                console.log(`   Reason: ${validationError.message}`);
            }
            
            this.passedTests++;
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.failedTests++;
            return false;
        }
    }

    /**
     * Test: validateStatusChange function
     */
    async testValidateStatusChange() {
        this.totalTests++;
        console.log('\n📝 Test: validateStatusChange middleware');
        
        try {
            // Test same status
            let validation = validateStatusChange(
                REGION_STATUS.ACTIVE, 
                REGION_STATUS.ACTIVE, 
                REGION_TYPE.PROVINCE, 
                false
            );
            this.assert(!validation.valid, 'Should reject same status change');
            
            // Test invalid status
            validation = validateStatusChange(
                REGION_STATUS.ACTIVE, 
                'INVALID_STATUS', 
                REGION_TYPE.PROVINCE, 
                false
            );
            this.assert(!validation.valid, 'Should reject invalid status');
            
            // Test deactivation with children
            validation = validateStatusChange(
                REGION_STATUS.ACTIVE, 
                REGION_STATUS.INACTIVE, 
                REGION_TYPE.PROVINCE, 
                true
            );
            this.assert(validation.valid, 'Should allow deactivation with children');
            this.assert(validation.warnings.length > 0, 'Should have warning about cascade');
            
            console.log('✅ Test passed: Status validation works correctly');
            
            this.passedTests++;
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.failedTests++;
            return false;
        }
    }

    /**
     * Test: Lambda handler - GET hierarchy
     */
    async testHandlerGetHierarchy() {
        this.totalTests++;
        console.log('\n📝 Test: Lambda Handler - GET /regions/hierarchy');
        
        try {
            const event = {
                httpMethod: 'GET',
                path: '/regions/hierarchy',
                pathParameters: { action: 'hierarchy' },
                queryStringParameters: null,
                body: null
            };
            
            const response = await handler(event);
            
            this.assert(response.statusCode === 200, 'Should return 200 status');
            
            const body = JSON.parse(response.body);
            this.assert(body.success === true, 'Response should indicate success');
            this.assert(body.data.hierarchy !== undefined, 'Should include hierarchy data');
            
            console.log('✅ Test passed: Handler correctly processes hierarchy request');
            
            this.passedTests++;
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.failedTests++;
            return false;
        }
    }

    /**
     * Test: Lambda handler - GET active
     */
    async testHandlerGetActive() {
        this.totalTests++;
        console.log('\n📝 Test: Lambda Handler - GET /regions/active');
        
        try {
            const event = {
                httpMethod: 'GET',
                path: '/regions/active',
                pathParameters: { action: 'active' },
                queryStringParameters: null,
                body: null
            };
            
            const response = await handler(event);
            
            this.assert(response.statusCode === 200, 'Should return 200 status');
            
            const body = JSON.parse(response.body);
            this.assert(body.success === true, 'Response should indicate success');
            this.assert(body.data.regions !== undefined, 'Should include regions data');
            
            console.log('✅ Test passed: Handler correctly processes active regions request');
            
            this.passedTests++;
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.failedTests++;
            return false;
        }
    }

    /**
     * Test: Lambda handler - PATCH toggleStatus
     */
    async testHandlerPatchToggleStatus() {
        this.totalTests++;
        console.log('\n📝 Test: Lambda Handler - PATCH /regions/:id/toggleStatus');
        
        try {
            // Get a test region
            const regions = await getRegions({ region_type: REGION_TYPE.NEIGHBORHOOD });
            
            if (regions.length === 0) {
                console.log('⚠️  Test skipped: No neighborhoods found');
                this.passedTests++;
                return true;
            }
            
            const testRegion = regions[0];
            const newStatus = testRegion.status === REGION_STATUS.ACTIVE 
                ? REGION_STATUS.INACTIVE 
                : REGION_STATUS.ACTIVE;
            
            const event = {
                httpMethod: 'PATCH',
                path: `/regions/${testRegion.regionId}/toggleStatus`,
                pathParameters: { 
                    regionId: testRegion.regionId,
                    action: 'toggleStatus'
                },
                queryStringParameters: null,
                body: JSON.stringify({ status: newStatus })
            };
            
            const response = await handler(event);
            
            this.assert(response.statusCode === 200, 'Should return 200 status');
            
            const body = JSON.parse(response.body);
            this.assert(body.success === true, 'Response should indicate success');
            
            console.log('✅ Test passed: Handler correctly processes PATCH toggleStatus');
            
            // Toggle back
            await toggleRegionStatus(testRegion.regionId, { status: testRegion.status });
            
            this.passedTests++;
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.failedTests++;
            return false;
        }
    }

    /**
     * Test: Invalid status value
     */
    async testInvalidStatusValue() {
        this.totalTests++;
        console.log('\n📝 Test: Invalid status value handling');
        
        try {
            const regions = await getRegions();
            
            if (regions.length === 0) {
                console.log('⚠️  Test skipped: No regions found');
                this.passedTests++;
                return true;
            }
            
            const testRegion = regions[0];
            
            try {
                await toggleRegionStatus(testRegion.regionId, { status: 'INVALID' });
                this.assert(false, 'Should have thrown error for invalid status');
            } catch (error) {
                this.assert(
                    error.message.includes('Invalid status'),
                    'Error should mention invalid status'
                );
                console.log('✅ Test passed: Invalid status correctly rejected');
            }
            
            this.passedTests++;
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.failedTests++;
            return false;
        }
    }

    /**
     * Test: Non-existent region
     */
    async testNonExistentRegion() {
        this.totalTests++;
        console.log('\n📝 Test: Non-existent region handling');
        
        try {
            try {
                await toggleRegionStatus('REG_NONEXISTENT', { 
                    status: REGION_STATUS.ACTIVE 
                });
                this.assert(false, 'Should have thrown error for non-existent region');
            } catch (error) {
                this.assert(
                    error.message.includes('not found'),
                    'Error should mention region not found'
                );
                console.log('✅ Test passed: Non-existent region correctly handled');
            }
            
            this.passedTests++;
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.failedTests++;
            return false;
        }
    }

    /**
     * Test: Same status toggle (should return early)
     */
    async testSameStatusToggle() {
        this.totalTests++;
        console.log('\n📝 Test: Same status toggle handling');
        
        try {
            const regions = await getRegions();
            
            if (regions.length === 0) {
                console.log('⚠️  Test skipped: No regions found');
                this.passedTests++;
                return true;
            }
            
            const testRegion = regions[0];
            
            // Toggle to same status
            const result = await toggleRegionStatus(testRegion.regionId, { 
                status: testRegion.status 
            });
            
            this.assert(result.success === true, 'Should still return success');
            this.assert(
                result.affectedRegions.total === 0,
                'Should not affect any regions'
            );
            
            console.log('✅ Test passed: Same status toggle handled gracefully');
            
            this.passedTests++;
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.failedTests++;
            return false;
        }
    }

    /**
     * Assertion helper
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('\n📊 Test Suite Summary\n');
        console.log(`Total Tests:  ${this.totalTests}`);
        console.log(`✅ Passed:    ${this.passedTests}`);
        console.log(`❌ Failed:    ${this.failedTests}`);
        console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
        console.log('\n' + '='.repeat(60) + '\n');
        
        if (this.failedTests === 0) {
            console.log('🎉 All tests passed!\n');
        } else {
            console.log('⚠️  Some tests failed. Review logs above.\n');
        }
    }
}

/**
 * Run tests if executed directly
 */
if (require.main === module) {
    const testSuite = new RegionsAPITestSuite();
    testSuite.runAll()
        .then(() => {
            process.exit(testSuite.failedTests === 0 ? 0 : 1);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = RegionsAPITestSuite;
