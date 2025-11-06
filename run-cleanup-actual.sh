#!/bin/bash
# Run the actual DynamoDB schema cleanup

echo "════════════════════════════════════════════════════════════════"
echo "🧹 DynamoDB Schema Cleanup"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "This will clean up all 116 items in the WizzCentral_Regions table."
echo ""
echo "What will happen:"
echo "  ✅ Keep: regionId, name, name_ar, level, parent_id, is_active, coordinates, timestamps"
echo "  ❌ Remove: governorate_id, governorateId, boundary, gadm_data, etc."
echo ""
echo "Press Ctrl+C now to cancel, or press Enter to continue..."
read

cd "$(dirname "$0")"
./backend/cleanup-regions-schema.js
