#!/bin/bash
# Quick Script to Add Top Bar to Remaining Pages
# WizzCentral Platform

echo "🚀 Adding Top Bar to Remaining Pages..."

PAGES=(
    "customers"
    "merchants"
    "promotions"
    "regions"
    "financial-management"
    "support"
)

for page in "${PAGES[@]}"; do
    FILE="frontend/pages/${page}.html"
    
    if [ -f "$FILE" ]; then
        echo "📝 Processing: $FILE"
        
        # Check if topbar.css is already added
        if ! grep -q "topbar.css" "$FILE"; then
            echo "   ├─ Adding topbar.css link..."
            # Add after material-3-design-system.css
            sed -i '' 's|<link rel="stylesheet" href="../styles/material-3-design-system.css">|<link rel="stylesheet" href="../styles/material-3-design-system.css">\n    <link rel="stylesheet" href="../styles/topbar.css">|' "$FILE"
        else
            echo "   ├─ topbar.css already present ✓"
        fi
        
        # Check if topbar placeholder is already added
        if ! grep -q "topbar-placeholder" "$FILE"; then
            echo "   ├─ Adding topbar placeholder..."
            # Add before sidebar-placeholder
            sed -i '' 's|<div id="sidebar-placeholder">|<!-- Top Bar include placeholder -->\n    <div id="topbar-placeholder"></div>\n    \n    <!-- Sidebar include placeholder -->\n    <div id="sidebar-placeholder">|' "$FILE"
        else
            echo "   ├─ topbar placeholder already present ✓"
        fi
        
        # Check if topbar-loader.js is already added
        if ! grep -q "topbar-loader.js" "$FILE"; then
            echo "   ├─ Adding topbar-loader.js..."
            # Add before </body> or before first closing script tag area
            sed -i '' 's|</body>|    <!-- Top Bar Loading Script -->\n    <script src="../assets/js/topbar-loader.js"></script>\n    \n    <!-- Top Bar Management Script -->\n    <script src="../assets/js/topbar.js"></script>\n</body>|' "$FILE"
        else
            echo "   ├─ topbar scripts already present ✓"
        fi
        
        echo "   └─ ✅ $FILE updated successfully!"
    else
        echo "   └─ ⚠️  $FILE not found, skipping..."
    fi
    echo ""
done

echo "✨ Top Bar integration complete!"
echo "📋 Summary:"
echo "   - Added topbar.css link to <head>"
echo "   - Added topbar placeholder in <body>"
echo "   - Added topbar-loader.js and topbar.js scripts"
echo ""
echo "🧪 Test by opening any updated page in your browser"
