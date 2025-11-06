#!/bin/bash
# Cleanup Redundant Region Files - Focus on 6-Phase System
# Date: November 5, 2025

echo "🧹 Starting cleanup of redundant region files..."
echo ""

# Create archive directory for old files
mkdir -p .archive/old-region-scripts-$(date +%Y%m%d)
ARCHIVE_DIR=".archive/old-region-scripts-$(date +%Y%m%d)"

echo "📦 Archiving redundant files to: $ARCHIVE_DIR"
echo ""

# ============================================
# PHASE 1: Data Creation - KEEP ONLY ESSENTIAL
# ============================================
echo "Phase 1: Data Creation Files"
echo "✅ KEEP: create-najaf-complete-regions.js (final data creation script)"
echo "✅ KEEP: enhance-najaf-with-gadm.js (GADM boundary integration)"
echo ""

# Archive old/redundant data creation scripts
mv upload-najaf-regions.js "$ARCHIVE_DIR/" 2>/dev/null
mv upload-najaf-complete-regions.js "$ARCHIVE_DIR/" 2>/dev/null
mv quick-upload-najaf.js "$ARCHIVE_DIR/" 2>/dev/null
mv create-final-najaf-export.js "$ARCHIVE_DIR/" 2>/dev/null
mv extract-najaf-mapbox-v2.js "$ARCHIVE_DIR/" 2>/dev/null
mv extract-najaf-regions-mapbox.js "$ARCHIVE_DIR/" 2>/dev/null
mv export-final-najaf.js "$ARCHIVE_DIR/" 2>/dev/null
mv najaf-final-delivery.js "$ARCHIVE_DIR/" 2>/dev/null
mv inject-najaf-regions.js "$ARCHIVE_DIR/" 2>/dev/null
mv create-najaf-regions.js "$ARCHIVE_DIR/" 2>/dev/null
mv add-najaf-complete-hierarchy.js "$ARCHIVE_DIR/" 2>/dev/null
mv final-najaf-system.js "$ARCHIVE_DIR/" 2>/dev/null
mv clean-replace-najaf-regions.js "$ARCHIVE_DIR/" 2>/dev/null
mv create-baghdad-regions-complete.js "$ARCHIVE_DIR/" 2>/dev/null
mv add-missing-regions.js "$ARCHIVE_DIR/" 2>/dev/null
mv populate-iraqi-regions.js "$ARCHIVE_DIR/" 2>/dev/null
mv expand-regions-data.js "$ARCHIVE_DIR/" 2>/dev/null
mv populate-comprehensive-iraqi-regions.js "$ARCHIVE_DIR/" 2>/dev/null
mv update-mock-regions.js "$ARCHIVE_DIR/" 2>/dev/null
mv inject-regions-data.js "$ARCHIVE_DIR/" 2>/dev/null
mv populate-complete-iraqi-regions.js "$ARCHIVE_DIR/" 2>/dev/null

echo "📦 Archived old data creation scripts"

# ============================================
# PHASE 2: Local Development - KEEP ONLY ONE
# ============================================
echo ""
echo "Phase 2: Local Development"
echo "✅ KEEP: local-dev-server.js (main local server with comprehensive data)"
echo ""

# Archive redundant local servers
mv local-regions-comprehensive.js "$ARCHIVE_DIR/" 2>/dev/null
mv local-regions-server.js "$ARCHIVE_DIR/" 2>/dev/null
mv backend/regions-dev-server.js "$ARCHIVE_DIR/" 2>/dev/null

echo "📦 Archived redundant local servers"

# ============================================
# PHASE 3: Frontend - KEEP ONLY MAIN FILE
# ============================================
echo ""
echo "Phase 3: Frontend Display"
echo "✅ KEEP: frontend/regions.js (main regions management UI)"
echo "✅ KEEP: frontend/pages/regions.html (regions page)"
echo ""

# Archive old/redundant frontend files
mv frontend/regions-map-admin-integration.js "$ARCHIVE_DIR/" 2>/dev/null
mv frontend/regions-management.js "$ARCHIVE_DIR/" 2>/dev/null
mv frontend/regions-admin-panel.js "$ARCHIVE_DIR/" 2>/dev/null
mv frontend/regions-management-iraq.js "$ARCHIVE_DIR/" 2>/dev/null
mv frontend/regions-map-integration.js "$ARCHIVE_DIR/" 2>/dev/null

echo "📦 Archived old frontend files"

# ============================================
# PHASE 4: Backend API - KEEP ESSENTIAL
# ============================================
echo ""
echo "Phase 4: Backend API"
echo "✅ KEEP: backend/regions-central-api.js (main API handler)"
echo "✅ KEEP: backend/regions-service.js (business logic)"
echo ""

# Archive redundant backend files
mv backend/regions-central-api-tests.js "$ARCHIVE_DIR/" 2>/dev/null
mv backend/regions-api-tests.js "$ARCHIVE_DIR/" 2>/dev/null
mv backend/regions-api-handler.js "$ARCHIVE_DIR/" 2>/dev/null
mv backend/populate-regions-api.js "$ARCHIVE_DIR/" 2>/dev/null
mv backend/create-sample-regions.js "$ARCHIVE_DIR/" 2>/dev/null

echo "📦 Archived redundant backend files"

# ============================================
# PHASE 5: Database - KEEP UPLOAD SCRIPT
# ============================================
echo ""
echo "Phase 5: Database Upload"
echo "✅ KEEP: backend/setup-iraq-regions-dynamodb.js (DynamoDB setup)"
echo ""

# Test/verification scripts can be archived
mv test-regions-count.js "$ARCHIVE_DIR/" 2>/dev/null
mv test-regions-data.js "$ARCHIVE_DIR/" 2>/dev/null
mv check-current-regions.js "$ARCHIVE_DIR/" 2>/dev/null
mv verify-complete-iraqi-regions.js "$ARCHIVE_DIR/" 2>/dev/null

echo "📦 Archived test scripts"

# ============================================
# OTHER REDUNDANT FILES
# ============================================
echo ""
echo "Cleaning up other redundant files..."

# Archive old deployment/setup scripts
mv backend/create-regions-logs-table.js "$ARCHIVE_DIR/" 2>/dev/null
mv backend/setup-region-webhooks.js "$ARCHIVE_DIR/" 2>/dev/null
mv backend/regions-db-schema.js "$ARCHIVE_DIR/" 2>/dev/null

echo "📦 Archived other redundant files"

# ============================================
# SUMMARY
# ============================================
echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ CLEANUP COMPLETE - 6-PHASE SYSTEM ORGANIZED"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📂 ESSENTIAL FILES REMAINING:"
echo ""
echo "Phase 1 - Data Creation:"
echo "  ✓ create-najaf-complete-regions.js"
echo "  ✓ enhance-najaf-with-gadm.js"
echo ""
echo "Phase 2 - Local Development:"
echo "  ✓ local-dev-server.js"
echo ""
echo "Phase 3 - Frontend:"
echo "  ✓ frontend/regions.js"
echo "  ✓ frontend/pages/regions.html"
echo ""
echo "Phase 4 - Backend API:"
echo "  ✓ backend/regions-central-api.js"
echo "  ✓ backend/regions-service.js"
echo ""
echo "Phase 5 - Database:"
echo "  ✓ backend/setup-iraq-regions-dynamodb.js"
echo ""
echo "Phase 6 - Production:"
echo "  ✓ Deploy using existing infrastructure"
echo ""
echo "📦 Archived files: $ARCHIVE_DIR"
echo "═══════════════════════════════════════════════════════"
