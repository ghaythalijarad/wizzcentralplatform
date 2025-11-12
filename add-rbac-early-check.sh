#!/bin/bash

# Add RBAC Early Check to All Protected Pages
# This ensures no blank pages and immediate redirect

echo "🔒 Adding RBAC Early Check to Protected Pages..."

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/frontend/pages

# List of pages to update (exclude public pages)
PAGES=(
    "support.html"
    "support-merchants.html"
    "support-production.html"
    "promotions.html"
    "regions.html"
    "regions-management.html"
    "regions-simple.html"
    "regions-toggle.html"
    "customers.html"
    "customers-simple.html"
    "merchants.html"
    "drivers.html"
    "orders.html"
    "orders-management.html"
    "orders-new.html"
    "financial-management.html"
    "debug-dashboard.html"
)

for page in "${PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo "📄 Processing $page..."
        
        # Check if already has rbac-early-check.js
        if grep -q "rbac-early-check.js" "$page"; then
            echo "   ✅ Already has early check - skipping"
        else
            # Add the script after rbac.js line
            if grep -q "rbac.js" "$page"; then
                # Use sed to add after rbac.js
                sed -i.bak '/rbac\.js/a\
    <script src="../assets/js/rbac-early-check.js"></script>' "$page"
                echo "   ✅ Added early check script"
            else
                echo "   ⚠️  No rbac.js found - needs manual review"
            fi
        fi
    else
        echo "   ⚠️  File not found: $page"
    fi
done

echo ""
echo "✅ RBAC Early Check installation complete!"
echo ""
echo "🧪 Test by:"
echo "   1. Login with financial_admin user"
echo "   2. Try accessing /pages/support.html"
echo "   3. Should see immediate redirect (no blank page)"
echo ""
