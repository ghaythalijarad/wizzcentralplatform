#!/bin/bash

# Arabic Localization Test Script
# Tests the Arabic i18n implementation for support chat

echo "🧪 Testing Arabic Localization Implementation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if support-i18n.js exists
echo "1️⃣ Checking i18n system file..."
if [ -f "frontend/assets/js/support-i18n.js" ]; then
    echo -e "${GREEN}✅ support-i18n.js found${NC}"
    
    # Check for key translations
    if grep -q "currentLanguage: 'ar'" "frontend/assets/js/support-i18n.js"; then
        echo -e "${GREEN}✅ Default language set to Arabic${NC}"
    else
        echo -e "${RED}❌ Default language not set to Arabic${NC}"
    fi
    
    if grep -q "الدعم المباشر" "frontend/assets/js/support-i18n.js"; then
        echo -e "${GREEN}✅ Arabic translations found${NC}"
    else
        echo -e "${RED}❌ Arabic translations missing${NC}"
    fi
else
    echo -e "${RED}❌ support-i18n.js not found${NC}"
    exit 1
fi

echo ""
echo "2️⃣ Checking support.html updates..."
if [ -f "frontend/pages/support.html" ]; then
    echo -e "${GREEN}✅ support.html found${NC}"
    
    # Check for Arabic lang and dir
    if grep -q 'lang="ar"' "frontend/pages/support.html"; then
        echo -e "${GREEN}✅ HTML lang attribute set to Arabic${NC}"
    else
        echo -e "${RED}❌ HTML lang attribute not set to Arabic${NC}"
    fi
    
    if grep -q 'dir="rtl"' "frontend/pages/support.html"; then
        echo -e "${GREEN}✅ RTL direction set${NC}"
    else
        echo -e "${RED}❌ RTL direction not set${NC}"
    fi
    
    # Check for i18n script import
    if grep -q 'support-i18n.js' "frontend/pages/support.html"; then
        echo -e "${GREEN}✅ i18n script imported${NC}"
    else
        echo -e "${RED}❌ i18n script not imported${NC}"
    fi
    
    # Check for language switcher
    if grep -q 'languageSwitcher' "frontend/pages/support.html"; then
        echo -e "${GREEN}✅ Language switcher button found${NC}"
    else
        echo -e "${RED}❌ Language switcher button not found${NC}"
    fi
    
    # Check for data-i18n attributes
    if grep -q 'data-i18n=' "frontend/pages/support.html"; then
        echo -e "${GREEN}✅ i18n attributes found in HTML${NC}"
        
        # Count how many
        count=$(grep -o 'data-i18n=' "frontend/pages/support.html" | wc -l)
        echo -e "${GREEN}   Found $count i18n attributes${NC}"
    else
        echo -e "${RED}❌ i18n attributes not found in HTML${NC}"
    fi
    
    # Check for RTL CSS
    if grep -q '\[dir="rtl"\]' "frontend/pages/support.html"; then
        echo -e "${GREEN}✅ RTL CSS adjustments found${NC}"
    else
        echo -e "${YELLOW}⚠️  RTL CSS adjustments not found${NC}"
    fi
else
    echo -e "${RED}❌ support.html not found${NC}"
    exit 1
fi

echo ""
echo "3️⃣ Checking JavaScript updates..."

# Check for SupportI18n.t() usage
if grep -q 'SupportI18n.t(' "frontend/pages/support.html"; then
    echo -e "${GREEN}✅ JavaScript uses i18n translation function${NC}"
    count=$(grep -o 'SupportI18n.t(' "frontend/pages/support.html" | wc -l)
    echo -e "${GREEN}   Found $count uses of SupportI18n.t()${NC}"
else
    echo -e "${RED}❌ JavaScript doesn't use i18n translation function${NC}"
fi

# Check if updateConnectionStatus is updated
if grep -q "updateConnectionStatus('connected')" "frontend/pages/support.html"; then
    echo -e "${GREEN}✅ Connection status function updated for i18n${NC}"
else
    echo -e "${YELLOW}⚠️  Connection status function might not be fully updated${NC}"
fi

echo ""
echo "4️⃣ Translation Coverage..."

# Key translation checks
translations=(
    "liveSupport"
    "activeConversations"
    "selectConversation"
    "endSession"
    "typeYourMessage"
    "connecting"
    "connected"
    "disconnected"
)

for key in "${translations[@]}"; do
    if grep -q "$key:" "frontend/assets/js/support-i18n.js"; then
        echo -e "${GREEN}✅ Translation key '$key' found${NC}"
    else
        echo -e "${RED}❌ Translation key '$key' missing${NC}"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ Arabic Localization Test Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "1. Open http://localhost:8080/frontend/pages/support.html"
echo "2. Verify Arabic UI displays correctly"
echo "3. Test language switcher (AR ↔ EN)"
echo "4. Test RTL layout in Arabic mode"
echo "5. Test dynamic content updates"
echo ""
echo "💡 Quick Test Commands:"
echo "   console.log(SupportI18n.getLanguage())"
echo "   SupportI18n.setLanguage('en')"
echo "   SupportI18n.setLanguage('ar')"
echo ""
