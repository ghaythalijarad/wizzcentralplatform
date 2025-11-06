#!/bin/bash
# Regions Page Verification Script

echo "🗺️ Verifying Regions Page Consolidation..."
echo ""

# Check what exists
echo "📂 Checking files..."
if [ -f "frontend/pages/regions.html" ]; then
    echo "✅ regions.html exists (MAIN PAGE)"
else
    echo "❌ regions.html missing!"
fi

if [ -f "frontend/regions.js" ]; then
    echo "✅ regions.js exists (MAIN SCRIPT)"
else
    echo "❌ regions.js missing!"
fi

# Check what was removed
if [ -f "frontend/pages/regions-simple.html" ]; then
    echo "⚠️  regions-simple.html still exists (SHOULD BE DELETED)"
else
    echo "✅ regions-simple.html removed"
fi

if [ -f "frontend/pages/regions-management.html" ]; then
    echo "⚠️  regions-management.html still exists (SHOULD BE DELETED)"
else
    echo "✅ regions-management.html removed"
fi

if [ -f "frontend/js/regions-simple.js" ]; then
    echo "⚠️  regions-simple.js still exists (SHOULD BE DELETED)"
else
    echo "✅ regions-simple.js removed"
fi

if [ -f "frontend/js/regions-manager.js" ]; then
    echo "⚠️  regions-manager.js still exists (SHOULD BE DELETED)"
else
    echo "✅ regions-manager.js removed"
fi

echo ""
echo "📊 Summary:"
echo "  - Main page: /pages/regions.html"
echo "  - Main script: /regions.js"
echo "  - Access URL: http://localhost:3000/pages/regions.html"
echo ""
echo "✅ Consolidation complete! Using ONE regions page with full features."
