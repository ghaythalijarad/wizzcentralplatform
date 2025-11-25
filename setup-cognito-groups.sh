#!/bin/bash
# filepath: /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/setup-cognito-groups.sh
# Setup Cognito User Groups for WizzCentral Platform RBAC
# Run this script to create all required user groups in AWS Cognito

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
USER_POOL_ID="us-east-1_Cp9YnOQWi"
AWS_REGION="us-east-1"
AWS_PROFILE="${AWS_PROFILE:-wizz-drivers-ghayth-dev}"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  WizzCentral RBAC - Cognito Groups Setup${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  User Pool ID: $USER_POOL_ID"
echo "  Region: $AWS_REGION"
echo "  Profile: $AWS_PROFILE"
echo ""

# Verify AWS credentials
echo -e "${BLUE}🔐 Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &>/dev/null; then
    echo -e "${RED}❌ AWS credentials not valid. Please run:${NC}"
    echo "   aws sso login --profile $AWS_PROFILE"
    exit 1
fi
echo -e "${GREEN}✅ AWS credentials verified${NC}"
echo ""

# Function to create a Cognito group
create_group() {
    local GROUP_NAME=$1
    local DESCRIPTION=$2
    local PRECEDENCE=$3
    
    echo -e "${BLUE}📋 Creating group: ${GREEN}$GROUP_NAME${NC}"
    
    if aws cognito-idp create-group \
        --user-pool-id "$USER_POOL_ID" \
        --group-name "$GROUP_NAME" \
        --description "$DESCRIPTION" \
        --precedence "$PRECEDENCE" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --no-cli-pager 2>/dev/null; then
        echo -e "${GREEN}   ✅ Created: $GROUP_NAME${NC}"
    else
        # Check if group already exists
        if aws cognito-idp get-group \
            --user-pool-id "$USER_POOL_ID" \
            --group-name "$GROUP_NAME" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE" \
            --no-cli-pager &>/dev/null; then
            echo -e "${YELLOW}   ⚠️  Already exists: $GROUP_NAME${NC}"
        else
            echo -e "${RED}   ❌ Failed to create: $GROUP_NAME${NC}"
            return 1
        fi
    fi
}

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Creating User Groups${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Create all groups (precedence: lower number = higher priority)

# 1. Super Admin (highest precedence)
create_group "admins" \
    "Super administrators with full system access" \
    1

# 2. Domain-Specific Admin Groups
create_group "financial_admin" \
    "Financial administrators - manage commissions, fees, reports" \
    10

create_group "support_admin" \
    "Support administrators - manage tickets, orders, customer service" \
    20

create_group "merchants_admin" \
    "Merchants administrators - manage businesses, regions, merchant relations" \
    30

create_group "drivers_admin" \
    "Drivers administrators - manage driver accounts, assignments" \
    40

create_group "customers_admin" \
    "Customers administrators - manage customer accounts, support" \
    50

create_group "campaigns_admin" \
    "Campaigns administrators - manage promotions, discounts, marketing" \
    60

# 3. Read-Only Group (lowest precedence)
create_group "reporting_view" \
    "Read-only access to financial and analytical reports" \
    100

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✅ Cognito Groups Setup Complete!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# List all groups
echo -e "${BLUE}📋 Created Groups:${NC}"
aws cognito-idp list-groups \
    --user-pool-id "$USER_POOL_ID" \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" \
    --no-cli-pager \
    --query 'Groups[*].[GroupName,Description,Precedence]' \
    --output table

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Assign users to groups using:"
echo "     ${GREEN}./assign-user-to-group.sh <email> <group-name>${NC}"
echo ""
echo "  2. Or use AWS Console:"
echo "     https://console.aws.amazon.com/cognito/v2/idp/user-pools/$USER_POOL_ID/users"
echo ""
echo "  3. Test permissions:"
echo "     ${GREEN}./test-rbac-permissions.sh <email>${NC}"
echo ""
echo -e "${BLUE}================================================${NC}"
