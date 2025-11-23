#!/bin/bash
# Quick FCM Key Finder & Setup Script

echo "🔍 Searching for FCM Server Key..."
echo ""

# Method 1: Check Firebase project files
echo "📁 Method 1: Checking Firebase configuration files..."
if [ -f "/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzMerchants/frontend/android/app/google-services.json" ]; then
    PROJECT_ID=$(grep -o '"project_id": *"[^"]*"' "/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzMerchants/frontend/android/app/google-services.json" | cut -d'"' -f4)
    echo "   ✅ Firebase Project ID: $PROJECT_ID"
    echo ""
fi

# Method 2: Check if key is in environment
echo "📁 Method 2: Checking current environment..."
if [ ! -z "$FCM_SERVER_KEY" ]; then
    echo "   ✅ FCM_SERVER_KEY is set in environment: ${FCM_SERVER_KEY:0:20}..."
    echo ""
else
    echo "   ❌ FCM_SERVER_KEY not found in environment"
    echo ""
fi

# Method 3: Check .env files
echo "📁 Method 3: Checking .env files..."
ENV_FILES=(
    "/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzMerchants/backend/.env"
    "/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzMerchants/frontend/.env"
    "/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/.env"
)

FOUND_KEY=""
for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        KEY=$(grep "FCM_SERVER_KEY" "$file" 2>/dev/null | grep -v "YOUR_FCM" | cut -d'=' -f2-)
        if [ ! -z "$KEY" ] && [ "$KEY" != "YOUR_FCM_SERVER_KEY_HERE" ]; then
            echo "   ✅ Found in: $file"
            FOUND_KEY="$KEY"
            break
        fi
    fi
done

if [ -z "$FOUND_KEY" ]; then
    echo "   ❌ No FCM key found in .env files"
    echo ""
fi

# Instructions
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🔥 HOW TO GET YOUR FCM SERVER KEY"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "1️⃣  Open Firebase Console:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID/settings/cloudmessaging"
echo ""
echo "2️⃣  Look for 'Server key' (or 'Legacy server key')"
echo "   - If you see it, copy it!"
echo "   - If not, you may need to enable Cloud Messaging API"
echo ""
echo "3️⃣  Add it to .env file:"
echo "   nano /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/.env"
echo ""
echo "4️⃣  Update the line:"
echo "   FCM_SERVER_KEY=paste_your_key_here"
echo ""
echo "5️⃣  Restart the server:"
echo "   cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform"
echo "   pkill -f 'node.*local-dev-server.js'"
echo "   node local-dev-server.js > server.log 2>&1 &"
echo ""
echo "6️⃣  Test the notification:"
echo "   node test_backend_notification.js"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

# If key was found, offer to copy it
if [ ! -z "$FOUND_KEY" ]; then
    echo "🎉 GOOD NEWS! I found a key. Would you like to use it?"
    echo ""
    echo "To automatically set it up, run:"
    echo "export FCM_SERVER_KEY='$FOUND_KEY'"
    echo "echo 'FCM_SERVER_KEY=$FOUND_KEY' >> /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/.env"
    echo ""
fi

# Check if we can open Firebase console
if command -v open &> /dev/null && [ ! -z "$PROJECT_ID" ]; then
    echo "🌐 Would you like to open Firebase Console now?"
    echo "Run: open 'https://console.firebase.google.com/project/$PROJECT_ID/settings/cloudmessaging'"
    echo ""
fi
