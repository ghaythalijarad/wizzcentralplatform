#!/bin/bash
# =============================
# WizzApp AWS Environment Switcher
# =============================
# 
# Usage:
#   source set_aws_env.sh dev        # Use your dev account
#   source set_aws_env.sh mohammed   # Use Mohammed's dev account
#   source set_aws_env.sh stg        # Use staging (when created)
#   source set_aws_env.sh prod       # Use production (when created)
#

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to set dev environment
set_dev_env() {
    export AWS_PROFILE=ghayth-dev2
    export AWS_DEFAULT_REGION=us-east-1
    export AWS_REGION=us-east-1
    export AWS_ACCOUNT_ID=146152253137
    echo -e "${GREEN}✅ AWS Environment set to: DEV (Your Account)${NC}"
    echo -e "${BLUE}   Profile: ghayth-dev2${NC}"
    echo -e "${BLUE}   Account: 146152253137${NC}"
    echo -e "${BLUE}   Region: us-east-1${NC}"
}

# Function to set Mohammed's dev environment
set_mohammed_env() {
    export AWS_PROFILE=ghayth-dev-mohammed
    export AWS_DEFAULT_REGION=us-east-1
    export AWS_REGION=us-east-1
    export AWS_ACCOUNT_ID=031857856164
    echo -e "${GREEN}✅ AWS Environment set to: DEV (Mohammed's Account)${NC}"
    echo -e "${BLUE}   Profile: ghayth-dev-mohammed${NC}"
    echo -e "${BLUE}   Account: 031857856164${NC}"
    echo -e "${BLUE}   Region: us-east-1${NC}"
}

# Function to set staging environment
set_staging_env() {
    echo -e "${RED}❌ Staging environment not yet created${NC}"
    echo -e "${YELLOW}   Please create the staging AWS account first${NC}"
    return 1
}

# Function to set production environment
set_prod_env() {
    echo -e "${RED}❌ Production environment not yet created${NC}"
    echo -e "${YELLOW}   Please create the production AWS account first${NC}"
    return 1
}

# Function to show current environment
show_current_env() {
    echo -e "${BLUE}════════════════════════════════════${NC}"
    echo -e "${BLUE}   Current AWS Environment${NC}"
    echo -e "${BLUE}════════════════════════════════════${NC}"
    
    if [ -z "$AWS_PROFILE" ]; then
        echo -e "${YELLOW}⚠️  No AWS profile set${NC}"
    else
        echo -e "${GREEN}Profile:${NC} $AWS_PROFILE"
        echo -e "${GREEN}Region:${NC} ${AWS_DEFAULT_REGION:-$AWS_REGION}"
        
        # Try to get account ID from AWS
        CURRENT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Account:${NC} $CURRENT_ACCOUNT"
            
            # Identify which environment this is
            case $CURRENT_ACCOUNT in
                146152253137)
                    echo -e "${GREEN}Environment:${NC} DEV (Your Account)"
                    ;;
                031857856164)
                    echo -e "${GREEN}Environment:${NC} DEV (Mohammed's Account)"
                    ;;
                *)
                    echo -e "${YELLOW}Environment:${NC} Unknown"
                    ;;
            esac
        else
            echo -e "${RED}⚠️  Not authenticated. Run: aws sso login --profile $AWS_PROFILE${NC}"
        fi
    fi
    echo -e "${BLUE}════════════════════════════════════${NC}"
}

# Main script logic
case "${1:-}" in
    dev|d)
        set_dev_env
        ;;
    mohammed|m)
        set_mohammed_env
        ;;
    staging|stg|s)
        set_staging_env
        ;;
    production|prod|p)
        set_prod_env
        ;;
    status|show|current|"")
        show_current_env
        ;;
    help|h|-h|--help)
        echo -e "${BLUE}WizzApp AWS Environment Switcher${NC}"
        echo ""
        echo "Usage:"
        echo "  source set_aws_env.sh dev        # Use your dev account"
        echo "  source set_aws_env.sh mohammed   # Use Mohammed's dev account"
        echo "  source set_aws_env.sh stg        # Use staging (when created)"
        echo "  source set_aws_env.sh prod       # Use production (when created)"
        echo "  source set_aws_env.sh status     # Show current environment"
        echo ""
        echo "Short aliases:"
        echo "  d = dev"
        echo "  m = mohammed"
        echo "  s = stg"
        echo "  p = prod"
        ;;
    *)
        echo -e "${RED}❌ Unknown environment: $1${NC}"
        echo -e "${YELLOW}Run: source set_aws_env.sh help${NC}"
        return 1
        ;;
esac

# Always show a reminder about SSO login if not authenticated
if [ -n "$AWS_PROFILE" ]; then
    aws sts get-caller-identity --profile $AWS_PROFILE >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${YELLOW}💡 To authenticate, run:${NC}"
        echo -e "   ${GREEN}aws sso login --profile $AWS_PROFILE${NC}"
    fi
fi
