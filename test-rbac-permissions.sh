#!/bin/bash
# filepath: /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/test-rbac-permissions.sh
# Test user permissions by showing their groups and computed access
# Usage: ./test-rbac-permissions.sh <email>

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

USER_POOL_ID="us-east-1_Cp9YnOQWi"
AWS_REGION="us-east-1"
AWS_PROFILE="${AWS_PROFILE:-wizz-drivers-ghayth-dev}"

if [ "$#" -lt 1 ]; then
    echo -e "${RED}Usage: $0 <email>${NC}"
    exit 1
fi

EMAIL=$1

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  RBAC Permissions Test${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "  User: $EMAIL"
echo ""

# Get username
USERNAME=$(aws cognito-idp list-users \
    --user-pool-id "$USER_POOL_ID" \
    --filter "email = \"$EMAIL\"" \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" \
    --no-cli-pager \
    --query 'Users[0].Username' \
    --output text)

if [ "$USERNAME" == "None" ] || [ -z "$USERNAME" ]; then
    echo -e "${RED}❌ User not found: $EMAIL${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found user: $USERNAME${NC}"
echo ""

# Get user's groups
echo -e "${BLUE}📋 User's Cognito Groups:${NC}"
GROUPS=$(aws cognito-idp admin-list-groups-for-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$USERNAME" \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" \
    --no-cli-pager \
    --query 'Groups[*].GroupName' \
    --output json)

if [ "$GROUPS" == "[]" ]; then
    echo -e "${YELLOW}⚠️  No groups assigned - user has no access${NC}"
    echo ""
    echo "Assign groups using:"
    echo "  ./assign-user-to-group.sh $EMAIL <group-name>"
    exit 0
fi

echo "$GROUPS" | jq -r '.[]' | while read -r group; do
    echo "  • $group"
done

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Computed Permissions${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Map groups to roles and show permissions
GROUP_ARRAY=$(echo "$GROUPS" | jq -r '.[]' | tr '\n' ',' | sed 's/,$//')

echo -e "${BLUE}📊 Mapped Roles:${NC}"
echo "$GROUPS" | jq -r '.[]' | while read -r group; do
    case "$group" in
        "admins")
            echo "  • admin (SUPERUSER - ALL ACCESS)"
            ;;
        "financial_admin")
            echo "  • financial_admin"
            ;;
        "support_admin")
            echo "  • support_admin"
            ;;
        "merchants_admin")
            echo "  • merchants_admin"
            ;;
        "drivers_admin")
            echo "  • drivers_admin"
            ;;
        "customers_admin")
            echo "  • customers_admin"
            ;;
        "campaigns_admin")
            echo "  • campaigns_admin"
            ;;
        "reporting_view")
            echo "  • reporting_view (READ-ONLY)"
            ;;
        *)
            echo "  • $group (unmapped)"
            ;;
    esac
done

echo ""
echo -e "${BLUE}🔓 Page Access:${NC}"

# Check each page based on RBAC_MATRIX
check_page_access() {
    local PAGE=$1
    local ALLOWED_ROLES=$2
    
    for role in $ALLOWED_ROLES; do
        if echo "$GROUPS" | jq -r '.[]' | grep -q "$role"; then
            echo -e "  ${GREEN}✅${NC} $PAGE"
            return 0
        fi
    done
    echo -e "  ${RED}❌${NC} $PAGE"
}

# Check if admin
if echo "$GROUPS" | jq -r '.[]' | grep -q "admins"; then
    echo -e "  ${GREEN}✅ ALL PAGES (admin access)${NC}"
else
    check_page_access "Dashboard" "financial_admin support_admin merchants_admin drivers_admin customers_admin campaigns_admin reporting_view"
    check_page_access "Financial" "financial_admin reporting_view"
    check_page_access "Orders" "support_admin merchants_admin drivers_admin"
    check_page_access "Merchants" "merchants_admin support_admin"
    check_page_access "Regions" "merchants_admin"
    check_page_access "Drivers" "drivers_admin support_admin"
    check_page_access "Customers" "customers_admin support_admin"
    check_page_access "Promotions" "campaigns_admin"
    check_page_access "Support" "support_admin"
fi

echo ""
echo -e "${BLUE}📝 Domain Permissions:${NC}"

check_domain_access() {
    local DOMAIN=$1
    local READ_ROLES=$2
    local WRITE_ROLES=$3
    
    local CAN_READ=false
    local CAN_WRITE=false
    
    if echo "$GROUPS" | jq -r '.[]' | grep -q "admins"; then
        CAN_READ=true
        CAN_WRITE=true
    else
        for role in $WRITE_ROLES; do
            if echo "$GROUPS" | jq -r '.[]' | grep -q "$role"; then
                CAN_READ=true
                CAN_WRITE=true
                break
            fi
        done
        
        if [ "$CAN_WRITE" = false ]; then
            for role in $READ_ROLES; do
                if echo "$GROUPS" | jq -r '.[]' | grep -q "$role"; then
                    CAN_READ=true
                    break
                fi
            done
        fi
    fi
    
    if [ "$CAN_WRITE" = true ]; then
        echo -e "  ${GREEN}✅${NC} $DOMAIN: ${GREEN}Read + Write${NC}"
    elif [ "$CAN_READ" = true ]; then
        echo -e "  ${YELLOW}⚠️${NC}  $DOMAIN: ${YELLOW}Read-Only${NC}"
    else
        echo -e "  ${RED}❌${NC} $DOMAIN: ${RED}No Access${NC}"
    fi
}

check_domain_access "Financial" "financial_admin reporting_view" "financial_admin"
check_domain_access "Campaigns" "campaigns_admin merchants_admin" "campaigns_admin"
check_domain_access "Regions" "merchants_admin" "merchants_admin"
check_domain_access "Orders" "support_admin merchants_admin drivers_admin" "support_admin merchants_admin drivers_admin"
check_domain_access "Merchants" "merchants_admin support_admin financial_admin reporting_view" "merchants_admin"
check_domain_access "Drivers" "drivers_admin support_admin" "drivers_admin"
check_domain_access "Customers" "customers_admin support_admin" "customers_admin"
check_domain_access "Support" "support_admin" "support_admin"

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}Test in browser:${NC}"
echo "  1. Login as: $EMAIL"
echo "  2. Navigate to: http://localhost:3000/pages/dashboard.html"
echo "  3. Check sidebar visibility and page access"
echo ""
