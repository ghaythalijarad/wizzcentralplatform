#!/bin/bash

# Master Execution Script for whizzAI Integration
# This script guides you through all 5 phases of the AI integration

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   whizzAI Integration - Master Execution Script   ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env.bedrock exists
ENV_FILE=".env.bedrock"
if [ ! -f "$ENV_FILE" ]; then
    echo "# whizzAI Configuration" > $ENV_FILE
    echo "# Created: $(date)" >> $ENV_FILE
fi

# Function to read from .env.bedrock
get_env_var() {
    grep "^$1=" $ENV_FILE 2>/dev/null | cut -d'=' -f2
}

# Function to save to .env.bedrock
save_env_var() {
    # Remove existing entry
    grep -v "^$1=" $ENV_FILE > $ENV_FILE.tmp 2>/dev/null || true
    mv $ENV_FILE.tmp $ENV_FILE
    # Add new entry
    echo "$1=$2" >> $ENV_FILE
}

# Check current progress
ALIAS_ID=$(get_env_var "BEDROCK_AGENT_ALIAS_ID")
API_URL=$(get_env_var "AI_AGENT_API_URL")

echo -e "${BLUE}Current Status:${NC}"
echo "  Phase 1 (Agent Config): $([ -n "$ALIAS_ID" ] && echo -e "${GREEN}✅ Complete${NC}" || echo "⏳ Pending")"
echo "  Phase 2 (Backend): $([ -n "$API_URL" ] && echo -e "${GREEN}✅ Complete${NC}" || echo "⏳ Pending")"
echo "  Phase 3 (Frontend): ⏳ Pending"
echo "  Phase 4 (Testing): ⏳ Pending"
echo "  Phase 5 (Production): ⏳ Pending"
echo ""

# Main menu
while true; do
    echo -e "${BOLD}What would you like to do?${NC}"
    echo ""
    echo "  1) Execute Phase 1: Configure AWS Bedrock Agent"
    echo "  2) Execute Phase 2: Deploy Backend Services"
    echo "  3) View Phase 3 Instructions: Frontend Integration"
    echo "  4) View Phase 4 Instructions: Testing"
    echo "  5) Execute Phase 5: Deploy to Production"
    echo "  6) View current configuration"
    echo "  7) Test health endpoint"
    echo "  8) View full documentation"
    echo "  0) Exit"
    echo ""
    read -p "Enter your choice (0-8): " choice

    case $choice in
        1)
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════${NC}"
            echo -e "${BOLD}   PHASE 1: Configure Bedrock Agent   ${NC}"
            echo -e "${BLUE}═══════════════════════════════════════${NC}"
            echo ""
            
            if [ -n "$ALIAS_ID" ]; then
                echo -e "${YELLOW}⚠️  Phase 1 appears to be complete (Alias ID: $ALIAS_ID)${NC}"
                read -p "Do you want to re-run? (y/N): " confirm
                if [[ ! $confirm =~ ^[Yy]$ ]]; then
                    continue
                fi
            fi
            
            chmod +x execute-phase-1.sh
            ./execute-phase-1.sh
            
            echo ""
            read -p "Enter the Alias ID from above: " new_alias_id
            if [ -n "$new_alias_id" ]; then
                save_env_var "BEDROCK_AGENT_ALIAS_ID" "$new_alias_id"
                export BEDROCK_AGENT_ALIAS_ID=$new_alias_id
                echo -e "${GREEN}✅ Alias ID saved!${NC}"
            fi
            echo ""
            ;;
            
        2)
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════${NC}"
            echo -e "${BOLD}   PHASE 2: Deploy Backend Services   ${NC}"
            echo -e "${BLUE}═══════════════════════════════════════${NC}"
            echo ""
            
            if [ -z "$ALIAS_ID" ]; then
                echo -e "${RED}❌ Error: Phase 1 must be completed first${NC}"
                echo "Please run Phase 1 to get the Alias ID"
                continue
            fi
            
            if [ -n "$API_URL" ]; then
                echo -e "${YELLOW}⚠️  Phase 2 appears to be complete (API: $API_URL)${NC}"
                read -p "Do you want to re-deploy? (y/N): " confirm
                if [[ ! $confirm =~ ^[Yy]$ ]]; then
                    continue
                fi
            fi
            
            export BEDROCK_AGENT_ALIAS_ID=$ALIAS_ID
            chmod +x execute-phase-2.sh
            ./execute-phase-2.sh
            
            echo ""
            read -p "Enter the API Gateway URL from above: " api_url
            if [ -n "$api_url" ]; then
                # Ensure it ends with /agent-suggestion
                if [[ ! $api_url =~ /agent-suggestion$ ]]; then
                    api_url="${api_url}/agent-suggestion"
                fi
                save_env_var "AI_AGENT_API_URL" "$api_url"
                echo -e "${GREEN}✅ API URL saved!${NC}"
            fi
            echo ""
            ;;
            
        3)
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════${NC}"
            echo -e "${BOLD}   PHASE 3: Frontend Integration      ${NC}"
            echo -e "${BLUE}═══════════════════════════════════════${NC}"
            echo ""
            echo "Phase 3 requires manual file creation and editing."
            echo ""
            echo "Steps:"
            echo "  1. Create frontend/assets/js/whizz-ai-assistant.js"
            echo "  2. Create frontend/assets/css/ai-assistant.css"
            echo "  3. Edit frontend/pages/support.html to:"
            echo "     - Add CSS/JS includes"
            echo "     - Initialize AI with API endpoint"
            echo "     - Add auto-trigger logic"
            echo ""
            echo "All code is provided in: AI_INTEGRATION_EXECUTION_PLAN.md"
            echo ""
            read -p "Press Enter to continue..."
            ;;
            
        4)
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════${NC}"
            echo -e "${BOLD}   PHASE 4: Testing & Validation      ${NC}"
            echo -e "${BLUE}═══════════════════════════════════════${NC}"
            echo ""
            echo "Testing checklist:"
            echo "  [ ] AI trigger button appears in support interface"
            echo "  [ ] Clicking button shows loading state"
            echo "  [ ] AI suggestion appears with text"
            echo "  [ ] 'Use This Response' copies to input"
            echo "  [ ] 'Regenerate' requests new suggestion"
            echo "  [ ] Error handling works"
            echo ""
            echo "Test with scenarios:"
            echo "  1. Delayed order complaint"
            echo "  2. Payment issue"
            echo "  3. Merchant onboarding question"
            echo ""
            echo "See AI_INTEGRATION_EXECUTION_PLAN.md for detailed testing guide"
            echo ""
            read -p "Press Enter to continue..."
            ;;
            
        5)
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════${NC}"
            echo -e "${BOLD}   PHASE 5: Deploy to Production      ${NC}"
            echo -e "${BLUE}═══════════════════════════════════════${NC}"
            echo ""
            
            read -p "Have you completed testing (Phase 4)? (y/N): " tested
            if [[ ! $tested =~ ^[Yy]$ ]]; then
                echo "Please complete testing before deploying to production"
                continue
            fi
            
            echo ""
            echo "Committing changes..."
            git add .
            git commit -m "feat: Integrate AWS Bedrock whizzAI agent for support chat

- Added Bedrock agent service with Claude 3.5 Sonnet
- Created Lambda handlers for AI suggestions
- Built frontend AI assistant with suggestion panel
- Integrated auto-trigger in support chat

Agent ID: TNJAPTVUDC
Region: us-east-1"
            
            echo ""
            echo "Pushing to repositories..."
            if [ -f "push-to-both.sh" ]; then
                ./push-to-both.sh
            else
                git push origin main
            fi
            
            echo ""
            echo "Triggering Amplify deployment..."
            if [ -f "quick-amplify-deploy.sh" ]; then
                ./quick-amplify-deploy.sh
            else
                aws amplify start-job \
                  --app-id d2f5oacwil9cbi \
                  --branch-name main \
                  --job-type RELEASE
            fi
            
            echo ""
            echo -e "${GREEN}✅ Deployment triggered!${NC}"
            echo "Monitor at: https://console.aws.amazon.com/amplify/home?region=us-east-1#/d2f5oacwil9cbi"
            echo ""
            ;;
            
        6)
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════${NC}"
            echo -e "${BOLD}   Current Configuration              ${NC}"
            echo -e "${BLUE}═══════════════════════════════════════${NC}"
            echo ""
            echo "Agent ID: TNJAPTVUDC"
            echo "Region: us-east-1"
            echo "Model: Claude 3.5 Sonnet v2"
            echo ""
            echo "Alias ID: ${ALIAS_ID:-"❌ Not set"}"
            echo "API URL: ${API_URL:-"❌ Not set"}"
            echo ""
            if [ -f "$ENV_FILE" ]; then
                echo "Configuration file: $ENV_FILE"
                cat $ENV_FILE
            fi
            echo ""
            ;;
            
        7)
            echo ""
            echo -e "${BLUE}Testing health endpoint...${NC}"
            if [ -z "$API_URL" ]; then
                echo -e "${RED}❌ API URL not configured${NC}"
                echo "Complete Phase 2 first"
            else
                health_url="${API_URL%/agent-suggestion}/agent-suggestion/health"
                echo "Calling: $health_url"
                echo ""
                curl -s "$health_url" | python3 -m json.tool
                echo ""
            fi
            echo ""
            ;;
            
        8)
            echo ""
            echo "Opening documentation..."
            if command -v open &> /dev/null; then
                open AI_INTEGRATION_EXECUTION_PLAN.md
            elif command -v xdg-open &> /dev/null; then
                xdg-open AI_INTEGRATION_EXECUTION_PLAN.md
            else
                echo "Please open: AI_INTEGRATION_EXECUTION_PLAN.md"
            fi
            echo ""
            ;;
            
        0)
            echo ""
            echo -e "${GREEN}Thank you for using whizzAI Integration!${NC}"
            echo ""
            exit 0
            ;;
            
        *)
            echo -e "${RED}Invalid choice. Please try again.${NC}"
            echo ""
            ;;
    esac
done
