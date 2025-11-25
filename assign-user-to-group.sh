#!/bin/bash
# filepath: /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/assign-user-to-group.sh
# Assign a Cognito user to one or more groups
# Usage: ./assign-user-to-group.sh <email> <group-name> [<group-name2> ...]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

USER_POOL_ID="us-east-1_Cp9YnOQWi"
AWS_REGION="us-east-1"
AWS_PROFILE="${AWS_PROFILE:-wizz-drivers-ghayth-dev}"

if [ "$#" -lt 2 ]; then
    echo -e "${RED}Usage: $0 <email> <group-name> [<group-name2> ...]${NC}"
    echo ""
    echo "Available groups:"
    echo "  - admins              (Super admin - full access)"
    echo "  - financial_admin     (Financial management)"
    echo "  - support_admin       (Support & customer service)"
    echo "  - merchants_admin     (Merchants & regions)"
    echo "  - drivers_admin       (Driver management)"
    echo "  - customers_admin     (Customer management)"
    echo "  - campaigns_admin     (Promotions & campaigns)"
    echo "  - reporting_view      (Read-only reports)"
    echo ""
    echo "Examples:"
    echo "  $0 admin@wizz.com admins"
    echo "  $0 finance@wizz.com financial_admin"
    echo "  $0 support@wizz.com support_admin merchants_admin"
    exit 1
fi

EMAIL=$1
shift
GROUPS=("$@")

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Assign User to Cognito Groups${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "  User: $EMAIL"
echo "  Groups: ${GROUPS[*]}"
echo ""

# Verify AWS credentials
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &>/dev/null; then
    echo -e "${RED}❌ AWS credentials not valid. Run: aws sso login --profile $AWS_PROFILE${NC}"
    exit 1
fi

# Get username from email
echo -e "${BLUE}🔍 Finding user...${NC}"
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
    echo ""
    echo "Create user first using AWS Console or:"
    echo "  aws cognito-idp admin-create-user \\"
    echo "    --user-pool-id $USER_POOL_ID \\"
    echo "    --username \"$EMAIL\" \\"
    echo "    --user-attributes Name=email,Value=\"$EMAIL\" Name=email_verified,Value=true \\"
    echo "    --region $AWS_REGION \\"
    echo "    --profile $AWS_PROFILE"
    exit 1
fi

echo -e "${GREEN}✅ Found user: $USERNAME${NC}"
echo ""

# Assign to each group
for GROUP in "${GROUPS[@]}"; do
    echo -e "${BLUE}📋 Adding to group: ${GREEN}$GROUP${NC}"
    
    if aws cognito-idp admin-add-user-to-group \
        --user-pool-id "$USER_POOL_ID" \
        --username "$USERNAME" \
        --group-name "$GROUP" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --no-cli-pager 2>/dev/null; then
        echo -e "${GREEN}   ✅ Added to: $GROUP${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Already in group or group doesn't exist: $GROUP${NC}"
    fi
done

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✅ User Group Assignment Complete!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Show user's current groups
echo -e "${BLUE}📋 User's Current Groups:${NC}"
aws cognito-idp admin-list-groups-for-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$USERNAME" \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" \
    --no-cli-pager \
    --query 'Groups[*].[GroupName,Description]' \
    --output table

echo ""
echo -e "${YELLOW}Test the user's permissions:${NC}"
echo "  1. Log in as: $EMAIL"
echo "  2. Check dashboard access"
echo "  3. Verify page-level restrictions"
echo ""
