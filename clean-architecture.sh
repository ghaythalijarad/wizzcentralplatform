#!/bin/bash
# Clean Architecture - Remove Redundant Files
# Keep only essential files for the scalable multi-governorate system

echo "🧹 Cleaning WhizzCentral Platform - Removing Redundant Files"
echo "============================================================="

# Create archive directory
ARCHIVE_DIR="archived_old_system_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ARCHIVE_DIR"

echo "📦 Archiving old files to: $ARCHIVE_DIR"

# ==================== DOCUMENTATION TO REMOVE ====================
echo ""
echo "📄 Removing excessive documentation..."
DOCS_TO_REMOVE=(
    "BAGHDAD_REGIONS_SUCCESS_REPORT.md"
    "CITY_DROPDOWN_FEATURE.md"
    "COMPLETE_DEPLOYMENT_CHECKLIST.md"
    "COMPLETE_EDIT_FORM_DEPLOYMENT.md"
    "COMPLETE_IMPLEMENTATION_SUMMARY.md"
    "DASHBOARD_REAL_DATA_FIX_COMPLETE.md"
    "DASHBOARD_REAL_DATA_TESTING.md"
    "DASHBOARD_STATISTICS_FIX_COMPLETE.md"
    "DEEP_INVESTIGATION_DASHBOARD.md"
    "DEEP_INVESTIGATION_RESULTS.md"
    "DEPLOYMENT_CHECKPOINT.md"
    "DEPLOYMENT_IN_PROGRESS.md"
    "DEPLOYMENT_SUCCESS_FINAL.md"
    "DRIVERS_ACTION_BUTTONS_ANALYSIS.md"
    "DRIVERS_COMPLETE_SUMMARY.md"
    "EDIT_CUSTOMER_IMPLEMENTATION.md"
    "EDIT_DRIVER_IMPLEMENTATION.md"
    "EDIT_FORM_FIX.md"
    "FINAL_DEPLOYMENT_SUMMARY.md"
    "FINAL_PROJECT_SUMMARY.md"
    "FINAL_SESSION_SUMMARY.md"
    "FIXES_APPLIED.md"
    "LOCAL_TESTING_GUIDE.md"
    "MANUAL_TESTING_INSTRUCTIONS.md"
    "MAPBOX_INTEGRATION_CHECKLIST.md"
    "MAPBOX_INTEGRATION_SUMMARY.md"
    "MAPBOX_QUICK_FIX_GUIDE.md"
    "MAPBOX_SETUP_COMPLETE.md"
    "MAPBOX_VISUAL_GUIDE.md"
    "MINOR_FIXES_GUIDE.md"
    "MISSION_ACCOMPLISHED.md"
    "NAJAF_DEPLOYMENT_SUCCESS.md"
    "NAJAF_REGIONS_PREVIEW.md"
    "NAJAF_SYSTEM_SUCCESS_REPORT.md"
    "ORDERS_PAGE_COMPLETE.md"
    "ORDERS_PAGE_COMPLETE_FIX.md"
    "ORDERS_PAGE_FIXES_COMPLETE.md"
    "ORDERS_PAGE_INTEGRATION.md"
    "PHASE_2_SERVICE_LOGIC_COMPLETE.md"
    "PHASE_4_IMPLEMENTATION_SUMMARY.md"
    "PHASE_4_MAP_INTEGRATION_COMPLETE.md"
    "PHASE_5_API_ENDPOINTS_DOCUMENTATION.md"
    "PHASE_5_COMPLETE.md"
    "PHASE_5_DEPLOYMENT_GUIDE.md"
    "PHASE_5_QUICK_REFERENCE.md"
    "PHASE_6_COMPLETE.md"
    "POPULATE_COMPLETE_IRAQ_GUIDE.md"
    "POPULATE_ORDERS_README.md"
    "PRODUCTION_FIX_CAMPAIGNS.md"
    "PRODUCTION_TESTING_GUIDE.md"
    "PROJECT_STATUS_FINAL.md"
    "PROJECT_STATUS_UPDATE_NOV_4_2025.md"
    "PROMOTIONS_COMPLETE.md"
    "PROMOTIONS_PAGE_FIX.md"
    "PROMOTIONS_PAGE_FIXED.md"
    "QUICK_FIX_TOKEN_EXPIRED.md"
    "QUICK_REFERENCE.md"
    "REGIONS_TERMINOLOGY_CLARIFICATION.md"
    "REGION_HIERARCHICAL_MODEL_UPDATE.md"
    "REGION_SERVICE_API_DOCUMENTATION.md"
    "REGION_SERVICE_IMPLEMENTATION_COMPLETE.md"
    "SESSION_COMPLETE.md"
    "SIDEBAR_FIXES_COMPLETE.md"
    "SUCCESS_REPORT.md"
    "TESTING_INSTRUCTIONS.txt"
    "TESTING_QUICK_CHECKLIST.md"
    "TOKEN_EXPIRATION_FIX.md"
    "TOKEN_EXPIRATION_FIX_SUMMARY.md"
    "VIEW_CUSTOMER_MODAL_DEPLOYMENT.md"
    "VIEW_CUSTOMER_MODAL_FIX.md"
    "VIEW_MODAL_DEPLOYMENT.md"
    "WHATS_NEXT.md"
    "WHAT_TO_CHECK_NOW.txt"
    "WIZZORDERSAPI_CONSTRUCTOR_FIX.md"
    "WIZZORDERS_INTEGRATION_SUMMARY.md"
)

for file in "${DOCS_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done

# ==================== REDUNDANT NAJAF SCRIPTS ====================
echo ""
echo "🗑️ Removing redundant Najaf-specific scripts..."
NAJAF_SCRIPTS=(
    "add-najaf-complete-hierarchy.js"
    "clean-replace-najaf-regions.js"
    "create-najaf-complete-regions.js"
    "create-najaf-regions.js"
    "create-final-najaf-export.js"
    "enhance-najaf-with-gadm.js"
    "export-final-najaf.js"
    "extract-najaf-mapbox-v2.js"
    "extract-najaf-regions-mapbox.js"
    "final-najaf-system.js"
    "inject-najaf-regions.js"
    "quick-upload-najaf.js"
    "restart-with-najaf.sh"
    "upload-najaf-complete-regions.js"
    "upload-najaf-now.sh"
    "upload-najaf-regions.js"
    "najaf-extraction.log"
    "NAJAF_REGIONS.json"
    "NAJAF_REGIONS_VALID.json"
)

for file in "${NAJAF_SCRIPTS[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done

# ==================== REDUNDANT BAGHDAD SCRIPTS ====================
echo ""
echo "🗑️ Removing redundant Baghdad-specific scripts..."
BAGHDAD_SCRIPTS=(
    "baghdad-mapbox-extractor.js"
    "create-baghdad-regions-complete.js"
    "extract-baghdad-mapbox.js"
    "upload-baghdad-quick.js"
    "baghdad-extraction.log"
)

for file in "${BAGHDAD_SCRIPTS[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done

# ==================== OLD REGION SCRIPTS ====================
echo ""
echo "🗑️ Removing old region scripts..."
OLD_SCRIPTS=(
    "add-missing-regions.js"
    "create-sample-regions.js"
    "inject-regions-data.js"
    "update-mock-regions.js"
    "expand-regions-data.js"
    "local-regions-comprehensive.js"
    "local-regions-server.js"
)

for file in "${OLD_SCRIPTS[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done

# ==================== POPULATE SCRIPTS (OLD) ====================
echo ""
echo "🗑️ Archiving old populate scripts..."
POPULATE_SCRIPTS=(
    "populate-iraqi-regions.js"
    "populate-sample-orders.js"
    "inject-regions-data.js"
    "sync-to-aws-dynamodb.js"
    "upload-via-api.js"
)

for file in "${POPULATE_SCRIPTS[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done

# ==================== TEST/DEBUG SCRIPTS ====================
echo ""
echo "🗑️ Archiving test/debug scripts..."
TEST_SCRIPTS=(
    "test-regions-count.js"
    "test-regions-data.js"
    "verify-complete-iraqi-regions.js"
    "check-current-regions.js"
    "final-status-report.js"
    "final-system-validation.js"
    "final-validation-report.js"
    "status-summary.js"
)

for file in "${TEST_SCRIPTS[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done

# ==================== FRONTEND REDUNDANT FILES ====================
echo ""
echo "🗑️ Removing redundant frontend files..."
FRONTEND_REDUNDANT=(
    "frontend/regions-management-iraq.js"
    "frontend/regions-management.js"
    "frontend/regions-map-admin-integration.js"
    "frontend/regions-admin-panel.js"
    "frontend/regions-admin-panel.css"
)

for file in "${FRONTEND_REDUNDANT[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done

# ==================== CREATE SUMMARY ====================
echo ""
echo "📝 Creating cleanup summary..."

cat > "$ARCHIVE_DIR/README.md" << 'EOF'
# Archived Files - Old Regions System

**Date:** $(date)

These files were part of the old Najaf-specific regions system and excessive documentation.

## Why Archived?

The new architecture is designed to be:
- **Scalable**: Supports all 18 Iraqi governorates, not just Najaf
- **Hierarchical**: Country → Governorates → Districts → Neighborhoods
- **Maintainable**: Single source of truth, no duplicate scripts
- **Clean**: Minimal documentation, focused on code

## New Essential Files

**Data Creation:**
- `create-complete-iraq-regions.js` - Creates all governorates with districts & neighborhoods

**Development:**
- `local-dev-server.js` - Local development server
- `frontend/regions.js` - Frontend UI logic  
- `frontend/pages/regions.html` - UI template

**Production:**
- `backend/regions-central-api.js` - API Lambda
- `backend/regions-service.js` - Database logic
- `backend/setup-iraq-regions-dynamodb.js` - Database upload

**Documentation:**
- `README.md` - Main project readme
- `ARCHITECTURE.md` - System architecture (single file)

## Recovery

If you need any of these files, they are preserved in this archive folder.
EOF

echo ""
echo "✅ Cleanup Complete!"
echo "===================="
echo "📦 Archived: $(ls -1 $ARCHIVE_DIR | wc -l) files"
echo "📂 Location: $ARCHIVE_DIR"
echo ""
echo "🎯 New Clean Structure:"
echo "   - 1 data creation script (all governorates)"
echo "   - 1 development server"
echo "   - 1 frontend file"
echo "   - 2 backend files"
echo "   - 1 architecture document"
