#!/bin/bash
# Add Google API Key to Regions Management Page

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║          🔑 Google API Key Configuration Helper                 ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Check if API key is provided as argument
if [ -z "$1" ]; then
    echo "📝 Please enter your Google API Key:"
    echo "   (It should start with AIzaSy...)"
    echo ""
    read -p "API Key: " API_KEY
else
    API_KEY="$1"
fi

# Validate API key format
if [[ ! $API_KEY =~ ^AIza ]]; then
    echo "❌ Invalid API key format!"
    echo "   Google API keys start with 'AIza'"
    echo "   Please check your key and try again."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Configuring API Key..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# File to update
HTML_FILE="frontend/pages/regions-management.html"

if [ ! -f "$HTML_FILE" ]; then
    echo "❌ Error: File not found: $HTML_FILE"
    echo "   Are you in the correct directory?"
    exit 1
fi

# Create backup
cp "$HTML_FILE" "${HTML_FILE}.backup"
echo "✅ Created backup: ${HTML_FILE}.backup"

# Replace the API key
if grep -q "YOUR_API_KEY" "$HTML_FILE"; then
    sed -i.tmp "s/YOUR_API_KEY/$API_KEY/g" "$HTML_FILE"
    rm "${HTML_FILE}.tmp"
    echo "✅ API key added to: $HTML_FILE"
else
    echo "⚠️  Warning: YOUR_API_KEY placeholder not found"
    echo "   The key might already be configured"
fi

# Also update google-maps-config.js if it exists
CONFIG_FILE="google-maps-config.js"
if [ -f "$CONFIG_FILE" ]; then
    if grep -q "YOUR_GOOGLE_MAPS_API_KEY_HERE" "$CONFIG_FILE"; then
        sed -i.tmp "s/YOUR_GOOGLE_MAPS_API_KEY_HERE/$API_KEY/g" "$CONFIG_FILE"
        rm "${CONFIG_FILE}.tmp"
        echo "✅ API key added to: $CONFIG_FILE"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuration Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Start your server:"
echo "   npm run local"
echo ""
echo "2. Open the regions page:"
echo "   http://localhost:3000/pages/regions-management.html"
echo ""
echo "3. Start adding Iraqi regions!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 Security Note:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Your API key is protected by .gitignore"
echo "✅ Never share your API key publicly"
echo "✅ Monitor usage at: console.cloud.google.com/apis/dashboard"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
