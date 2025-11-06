#!/bin/zsh

###############################################################################
# Quick Server Check and Start
###############################################################################

echo "🔍 Checking server status..."
echo ""

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Check if server is running
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✅ Server IS running on port 3000"
    echo ""
    
    # Test API
    echo "🧪 Testing API..."
    curl -s http://localhost:3000/api/regions | jq '. | length' 2>/dev/null && echo " regions found"
    echo ""
    
    # Open Safari
    echo "🌐 Opening Safari..."
    open -a Safari "http://localhost:3000/pages/regions-toggle.html"
    echo "✅ Done!"
    
else
    echo "❌ Server is NOT running"
    echo ""
    echo "🚀 Starting server now..."
    echo ""
    
    # The VS Code task should have started it, give it more time
    echo "   Waiting 5 more seconds..."
    sleep 5
    
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo "   ✅ Server started!"
        echo ""
        echo "   Opening Safari..."
        open -a Safari "http://localhost:3000/pages/regions-toggle.html"
    else
        echo "   ❌ Server still not running"
        echo ""
        echo "   Try running in VS Code:"
        echo "   Terminal → Run Task → 'Start Local Dev Server'"
        echo ""
        echo "   Or check the task output for errors"
    fi
fi

echo ""
