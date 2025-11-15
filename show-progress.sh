#!/bin/zsh

# Visual Progress Tracker for whizzAI Integration
# Shows a beautiful progress dashboard

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

clear

echo ""
echo -e "${PURPLE}${BOLD}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║            🤖 whizzAI Integration Progress Tracker             ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check environment file
ENV_FILE=".env.bedrock"
if [ -f "$ENV_FILE" ]; then
    source $ENV_FILE 2>/dev/null || true
fi

# Check Phase 1
PHASE1_STATUS="⏳ Pending"
PHASE1_COLOR=$YELLOW
if [ -n "$BEDROCK_AGENT_ALIAS_ID" ]; then
    PHASE1_STATUS="✅ Complete"
    PHASE1_COLOR=$GREEN
fi

# Check Phase 2
PHASE2_STATUS="⏳ Pending"
PHASE2_COLOR=$YELLOW
if [ -n "$AI_AGENT_API_URL" ]; then
    PHASE2_STATUS="✅ Complete"
    PHASE2_COLOR=$GREEN
fi

# Check Phase 3
PHASE3_STATUS="⏳ Pending"
PHASE3_COLOR=$YELLOW
if [ -f "frontend/assets/js/whizz-ai-assistant.js" ]; then
    PHASE3_STATUS="✅ Complete"
    PHASE3_COLOR=$GREEN
fi

# Check Phase 4
PHASE4_STATUS="⏳ Pending"
PHASE4_COLOR=$YELLOW

# Check Phase 5
PHASE5_STATUS="⏳ Pending"
PHASE5_COLOR=$YELLOW

echo ""
echo -e "${CYAN}${BOLD}📊 Progress Overview${NC}"
echo "══════════════════════════════════════════════════════════════════"
echo ""

# Progress bar
COMPLETED=0
[ "$PHASE1_STATUS" = "✅ Complete" ] && ((COMPLETED++))
[ "$PHASE2_STATUS" = "✅ Complete" ] && ((COMPLETED++))
[ "$PHASE3_STATUS" = "✅ Complete" ] && ((COMPLETED++))

TOTAL_PHASES=5
PROGRESS=$((COMPLETED * 100 / TOTAL_PHASES))

echo -n "Overall Progress: ["
for i in {1..20}; do
    if [ $i -le $((COMPLETED * 4)) ]; then
        echo -n "█"
    else
        echo -n "░"
    fi
done
echo -e "] ${PROGRESS}%"
echo ""

# Detailed phase status
echo -e "${BLUE}${BOLD}Phase 1: AWS Bedrock Agent Configuration${NC}"
echo -e "  Status: ${PHASE1_COLOR}${PHASE1_STATUS}${NC}"
echo -e "  Time: ~5 minutes"
[ -n "$BEDROCK_AGENT_ALIAS_ID" ] && echo -e "  Alias ID: ${GREEN}${BEDROCK_AGENT_ALIAS_ID}${NC}"
echo ""

echo -e "${BLUE}${BOLD}Phase 2: Backend Services Deployment${NC}"
echo -e "  Status: ${PHASE2_COLOR}${PHASE2_STATUS}${NC}"
echo -e "  Time: ~15 minutes"
[ -n "$AI_AGENT_API_URL" ] && echo -e "  API URL: ${GREEN}${AI_AGENT_API_URL}${NC}"
echo ""

echo -e "${BLUE}${BOLD}Phase 3: Frontend Integration${NC}"
echo -e "  Status: ${PHASE3_COLOR}${PHASE3_STATUS}${NC}"
echo -e "  Time: ~30 minutes"
echo ""

echo -e "${BLUE}${BOLD}Phase 4: Testing & Validation${NC}"
echo -e "  Status: ${PHASE4_COLOR}${PHASE4_STATUS}${NC}"
echo -e "  Time: ~10 minutes"
echo ""

echo -e "${BLUE}${BOLD}Phase 5: Production Deployment${NC}"
echo -e "  Status: ${PHASE5_COLOR}${PHASE5_STATUS}${NC}"
echo -e "  Time: ~5 minutes"
echo ""

echo "══════════════════════════════════════════════════════════════════"
echo ""

# Next action
if [ "$PHASE1_STATUS" != "✅ Complete" ]; then
    echo -e "${YELLOW}${BOLD}🎯 Next Step: Execute Phase 1${NC}"
    echo ""
    echo "Run: ./ai-integration.sh"
    echo "Or:  ./execute-phase-1.sh"
elif [ "$PHASE2_STATUS" != "✅ Complete" ]; then
    echo -e "${YELLOW}${BOLD}🎯 Next Step: Execute Phase 2${NC}"
    echo ""
    echo "Run: ./ai-integration.sh"
    echo "Or:  ./execute-phase-2.sh"
elif [ "$PHASE3_STATUS" != "✅ Complete" ]; then
    echo -e "${YELLOW}${BOLD}🎯 Next Step: Create Frontend Files${NC}"
    echo ""
    echo "Follow instructions in: AI_INTEGRATION_EXECUTION_PLAN.md"
    echo "Section: Phase 3"
else
    echo -e "${GREEN}${BOLD}🎉 Great progress! Continue with testing and deployment${NC}"
fi

echo ""
echo -e "${CYAN}Quick Commands:${NC}"
echo "  ./ai-integration.sh     - Interactive setup wizard"
echo "  ./show-progress.sh      - Show this dashboard again"
echo "  cat QUICK_START_AI.md   - Quick reference guide"
echo ""
