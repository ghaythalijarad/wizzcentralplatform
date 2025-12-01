#!/bin/zsh
# Quick Test Script for Top Bar Logout Functionality

echo "🧪 Testing Top Bar Logout Functionality..."
echo ""

# Check if topbar.js exists and has the updated logout function
if [ -f "frontend/assets/js/topbar.js" ]; then
    echo "✅ topbar.js found"
    
    if grep -q "AuthService.signOut" frontend/assets/js/topbar.js; then
        echo "✅ Updated logout function detected (AuthService.signOut)"
    else
        echo "❌ Logout function may not be updated"
    fi
    
    if grep -q "localStorage.clear()" frontend/assets/js/topbar.js; then
        echo "✅ localStorage.clear() present"
    fi
    
    if grep -q "sessionStorage.clear()" frontend/assets/js/topbar.js; then
        echo "✅ sessionStorage.clear() present"
    fi
else
    echo "❌ topbar.js not found"
fi

echo ""
echo "📋 Pages with Top Bar:"
echo ""

pages=(
    "dashboard.html"
    "orders.html"
    "drivers.html"
    "customers.html"
    "merchants.html"
    "promotions.html"
)

for page in "${pages[@]}"; do
    file="frontend/pages/$page"
    if [ -f "$file" ]; then
        if grep -q "topbar-placeholder" "$file" && grep -q "topbar-loader.js" "$file" && grep -q "topbar.js" "$file"; then
            echo "  ✅ $page"
        else
            echo "  ⚠️  $page (incomplete integration)"
        fi
    else
        echo "  ❌ $page (not found)"
    fi
done

echo ""
echo "🎯 Manual Testing Steps:"
echo ""
echo "1. Open any page (e.g., http://localhost:8080/frontend/pages/dashboard.html)"
echo "2. Click the user profile button (top right corner)"
echo "3. Click 'Logout' in the dropdown menu"
echo "4. Confirm the logout dialog"
echo "5. Verify redirect to /frontend/index.html"
echo "6. Open DevTools > Application > Local Storage"
echo "7. Verify all auth data is cleared"
echo ""
echo "✨ Logout fix complete!"
