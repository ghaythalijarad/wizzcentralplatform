#!/bin/bash
# Cleanup Legacy Regions Management System
# This script removes all old region management files, keeping only the new V2 system

echo "🧹 Starting Legacy Regions System Cleanup..."
echo "================================================"

# Navigate to project root
cd "$(dirname "$0")"

# Create archive directory for backup
mkdir -p archived-legacy-regions
echo "📦 Created backup directory: archived-legacy-regions/"

# Archive old documentation first
echo ""
echo "📚 Archiving old documentation..."
mv SYSTEM_ARCHITECTURE_EXPLAINED.md archived-legacy-regions/ 2>/dev/null && echo "  ✓ SYSTEM_ARCHITECTURE_EXPLAINED.md"
mv ARCHITECTURE.md archived-legacy-regions/ 2>/dev/null && echo "  ✓ ARCHITECTURE.md"
mv REGIONS-SYSTEM-6-PHASE-GUIDE.md archived-legacy-regions/ 2>/dev/null && echo "  ✓ REGIONS-SYSTEM-6-PHASE-GUIDE.md"
mv REGION_SERVICE_API_DOCUMENTATION.md archived-legacy-regions/ 2>/dev/null && echo "  ✓ REGION_SERVICE_API_DOCUMENTATION.md"
mv REGION_SERVICE_IMPLEMENTATION_COMPLETE.md archived-legacy-regions/ 2>/dev/null && echo "  ✓ REGION_SERVICE_IMPLEMENTATION_COMPLETE.md"
mv NAJAF_REGIONS_PREVIEW.md archived-legacy-regions/ 2>/dev/null && echo "  ✓ NAJAF_REGIONS_PREVIEW.md"
mv REGIONS_TERMINOLOGY_CLARIFICATION.md archived-legacy-regions/ 2>/dev/null && echo "  ✓ REGIONS_TERMINOLOGY_CLARIFICATION.md"
mv REGION_HIERARCHICAL_MODEL_UPDATE.md archived-legacy-regions/ 2>/dev/null && echo "  ✓ REGION_HIERARCHICAL_MODEL_UPDATE.md"
mv BAGHDAD_REGIONS_SUCCESS_REPORT.md archived-legacy-regions/ 2>/dev/null && echo "  ✓ BAGHDAD_REGIONS_SUCCESS_REPORT.md"
mv POPULATE_COMPLETE_IRAQ_GUIDE.md archived-legacy-regions/ 2>/dev/null && echo "  ✓ POPULATE_COMPLETE_IRAQ_GUIDE.md"

# Archive legacy data creation scripts
echo ""
echo "🔧 Archiving legacy data creation scripts..."
mv create-najaf-complete-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ create-najaf-complete-regions.js"
mv create-najaf-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ create-najaf-regions.js"
mv create-complete-iraq-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ create-complete-iraq-regions.js"
mv create-baghdad-regions-complete.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ create-baghdad-regions-complete.js"
mv enhance-najaf-with-gadm.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ enhance-najaf-with-gadm.js"
mv create-final-najaf-export.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ create-final-najaf-export.js"
mv final-najaf-system.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ final-najaf-system.js"
mv najaf-final-delivery.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ najaf-final-delivery.js"
mv export-final-najaf.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ export-final-najaf.js"

# Archive extraction scripts
echo ""
echo "🗺️ Archiving Mapbox extraction scripts..."
mv extract-najaf-regions-mapbox.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ extract-najaf-regions-mapbox.js"
mv extract-najaf-mapbox-v2.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ extract-najaf-mapbox-v2.js"
mv baghdad-mapbox-extractor.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ baghdad-mapbox-extractor.js"
mv extract-baghdad-mapbox.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ extract-baghdad-mapbox.js"
mv geocode-iraq-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ geocode-iraq-regions.js"

# Archive upload scripts
echo ""
echo "📤 Archiving upload scripts..."
mv upload-najaf-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ upload-najaf-regions.js"
mv upload-najaf-complete-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ upload-najaf-complete-regions.js"
mv quick-upload-najaf.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ quick-upload-najaf.js"
mv upload-baghdad-quick.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ upload-baghdad-quick.js"
mv upload-via-api.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ upload-via-api.js"

# Archive population scripts
echo ""
echo "🌍 Archiving population scripts..."
mv populate-iraqi-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ populate-iraqi-regions.js"
mv populate-comprehensive-iraqi-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ populate-comprehensive-iraqi-regions.js"
mv populate-complete-iraqi-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ populate-complete-iraqi-regions.js"
mv populate-iraq-complete-hierarchy.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ populate-iraq-complete-hierarchy.js"

# Archive injection/modification scripts
echo ""
echo "💉 Archiving injection/modification scripts..."
mv inject-najaf-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ inject-najaf-regions.js"
mv inject-regions-data.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ inject-regions-data.js"
mv add-najaf-complete-hierarchy.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ add-najaf-complete-hierarchy.js"
mv add-missing-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ add-missing-regions.js"
mv clean-replace-najaf-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ clean-replace-najaf-regions.js"
mv update-mock-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ update-mock-regions.js"
mv expand-regions-data.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ expand-regions-data.js"

# Archive test/verification scripts
echo ""
echo "🧪 Archiving test/verification scripts..."
mv test-regions-count.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ test-regions-count.js"
mv test-regions-data.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ test-regions-data.js"
mv check-current-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ check-current-regions.js"
mv verify-complete-iraqi-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ verify-complete-iraqi-regions.js"

# Archive old servers
echo ""
echo "🖥️ Archiving old development servers..."
mv local-dev-server.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ local-dev-server.js"
mv local-regions-server.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ local-regions-server.js"
mv local-regions-comprehensive.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ local-regions-comprehensive.js"

# Archive backend files
echo ""
echo "⚙️ Archiving legacy backend files..."
mv backend/regions-central-api.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ backend/regions-central-api.js"
mv backend/regions-service.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ backend/regions-service.js"
mv backend/regions-service.test.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ backend/regions-service.test.js"
mv backend/regions-api-handler.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ backend/regions-api-handler.js"
mv backend/regions-api-tests.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ backend/regions-api-tests.js"
mv backend/regions-central-api-tests.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ backend/regions-central-api-tests.js"
mv backend/regions-dev-server.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ backend/regions-dev-server.js"
mv backend/regions-db-schema.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ backend/regions-db-schema.js"
mv backend/setup-iraq-regions-dynamodb.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ backend/setup-iraq-regions-dynamodb.js"
mv backend/populate-regions-api.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ backend/populate-regions-api.js"
mv backend/create-sample-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ backend/create-sample-regions.js"
mv backend/create-regions-logs-table.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ backend/create-regions-logs-table.js"
mv backend/setup-region-webhooks.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ backend/setup-region-webhooks.js"

# Archive frontend files
echo ""
echo "🎨 Archiving legacy frontend files..."
mv frontend/regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ frontend/regions.js"
mv frontend/regions-management.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ frontend/regions-management.js"
mv frontend/regions-management-iraq.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ frontend/regions-management-iraq.js"
mv frontend/regions-admin-panel.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ frontend/regions-admin-panel.js"
mv frontend/regions-map-integration.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ frontend/regions-map-integration.js"
mv frontend/regions-map-admin-integration.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ frontend/regions-map-admin-integration.js"
mv frontend/pages/regions.html archived-legacy-regions/ 2>/dev/null && echo "  ✓ frontend/pages/regions.html"
mv frontend/test-api.html archived-legacy-regions/ 2>/dev/null && echo "  ✓ frontend/test-api.html"

# Archive scripts directory files
echo ""
echo "📜 Archiving scripts directory..."
mv scripts/create-all-iraq-regions.js archived-legacy-regions/ 2>/dev/null && echo "  ✓ scripts/create-all-iraq-regions.js"

# Archive data files
echo ""
echo "📊 Archiving old data files..."
mv NAJAF_REGIONS.json archived-legacy-regions/ 2>/dev/null && echo "  ✓ NAJAF_REGIONS.json"
mv NAJAF_REGIONS_VALID.json archived-legacy-regions/ 2>/dev/null && echo "  ✓ NAJAF_REGIONS_VALID.json"
mv baghdad-extraction.log archived-legacy-regions/ 2>/dev/null && echo "  ✓ baghdad-extraction.log"
mv najaf-extraction.log archived-legacy-regions/ 2>/dev/null && echo "  ✓ najaf-extraction.log"

# Archive shell scripts
echo ""
echo "🐚 Archiving old shell scripts..."
mv START_REGION_SERVER.sh archived-legacy-regions/ 2>/dev/null && echo "  ✓ START_REGION_SERVER.sh"
mv upload-najaf-now.sh archived-legacy-regions/ 2>/dev/null && echo "  ✓ upload-najaf-now.sh"
mv restart-with-najaf.sh archived-legacy-regions/ 2>/dev/null && echo "  ✓ restart-with-najaf.sh"

echo ""
echo "================================================"
echo "✅ Cleanup complete!"
echo ""
echo "📦 All legacy files archived in: archived-legacy-regions/"
echo ""
echo "🆕 NEW V2 SYSTEM FILES (kept):"
echo "  ✓ REGIONS_SYSTEM_V2.md - New system documentation"
echo "  ✓ QUICK_START.md - Quick start guide"
echo "  ✓ mapbox-playground/ - Interactive geocoding playground"
echo "  ✓ regions-api/ - New API server"
echo "  ✓ data/regions.json - Clean data storage"
echo ""
echo "🚀 To start the new system:"
echo "   npm run playground"
echo ""
echo "📖 Read the documentation:"
echo "   cat REGIONS_SYSTEM_V2.md"
echo "   cat QUICK_START.md"
echo ""
