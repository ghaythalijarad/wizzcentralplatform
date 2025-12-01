#!/bin/zsh
# Enable Debug Mode for WizzCentral Platform Testing
# This bypasses authentication for local development

echo "🔧 Enabling Debug Mode for WizzCentral Platform..."
echo ""
echo "📝 Instructions:"
echo "1. Open Chrome Developer Console (Cmd+Option+J)"
echo "2. Run the following command:"
echo ""
echo "   sessionStorage.setItem('debugMode', 'true');"
echo "   location.reload();"
echo ""
echo "3. The page will reload with authentication bypassed"
echo ""
echo "🎯 Or use this one-liner in the console:"
echo ""
echo "sessionStorage.setItem('debugMode', 'true'); location.reload();"
echo ""
echo "✅ To disable debug mode later:"
echo ""
echo "sessionStorage.removeItem('debugMode'); location.reload();"
echo ""
echo "🚀 Opening Chrome with the merchants page..."
echo ""

# Open Chrome with the merchants page
open -na "Google Chrome" --args --new-window "http://localhost:3000/pages/merchants.html"

echo "✅ Chrome opened!"
echo "📌 Remember to enable debug mode in the console!"
