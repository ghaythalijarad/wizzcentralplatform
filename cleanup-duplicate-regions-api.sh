#!/bin/bash

# Script to clean up duplicate regions API code from local-dev-server.js
# Removes the entire legacy Mapbox-powered regions section (lines ~792 to ~2451)

FILE="/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/local-dev-server.js"

echo "🧹 Cleaning up duplicate regions API code..."
echo ""

# Create backup
cp "$FILE" "${FILE}.backup-$(date +%Y%m%d-%H%M%S)"
echo "✅ Backup created"

# Find the start and end markers
START_LINE=$(grep -n "// REGIONS MANAGEMENT API - MAPBOX-POWERED SYSTEM" "$FILE" | cut -d: -f1 | head -1)
END_LINE=$(grep -n "// Redirect for old regions management URLs" "$FILE" | cut -d: -f1 | head -1)

if [ -z "$START_LINE" ] || [ -z "$END_LINE" ]; then
    echo "⚠️  Could not find markers. Section may already be removed."
    echo "   Checking file..."
    if grep -q "comprehensiveIraqiRegions" "$FILE"; then
        echo "   ❌ Legacy code still present but markers not found"
        echo "   Manual cleanup may be required"
    else
        echo "   ✅ Legacy code appears to be already removed"
    fi
    exit 0
fi

echo "📍 Found legacy section:"
echo "   Start line: $START_LINE"
echo "   End line: $END_LINE"
echo "   Lines to remove: $((END_LINE - START_LINE))"
echo ""

# Remove the lines
sed -i.tmp "${START_LINE},$((END_LINE - 1))d" "$FILE"
rm "${FILE}.tmp"

echo "✅ Removed legacy regions code"
echo ""

# Verify
if grep -q "comprehensiveIraqiRegions" "$FILE"; then
    echo "⚠️  Warning: Some references to 'comprehensiveIraqiRegions' still remain"
    echo "   Searching..."
    grep -n "comprehensiveIraqiRegions" "$FILE"
else
    echo "✅ All legacy references removed"
fi

echo ""
echo "✅ Cleanup complete!"
echo "   To restore: mv ${FILE}.backup-* ${FILE}"
