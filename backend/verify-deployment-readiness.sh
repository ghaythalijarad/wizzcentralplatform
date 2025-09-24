#!/bin/bash

# Quick Deployment Verification Script
# Checks if all components are ready for deployment

echo "🔍 WizzDriver Order Assignment System - Deployment Verification"
echo "=============================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

check_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo ""
echo "📋 Checking Backend Components..."
echo "--------------------------------"

# Check backend files
if [ -f "src/handlers/order-stream-processor.js" ]; then
    check_pass "Order stream processor exists"
else
    check_fail "Order stream processor missing"
fi

if [ -f "order-stream-processor-manual.zip" ]; then
    check_pass "Deployment package ready"
else
    check_fail "Deployment package missing"
fi

if [ -f "serverless.yml" ]; then
    check_pass "Serverless configuration exists"
else
    check_fail "Serverless configuration missing"
fi

if [ -f "deploy-order-stream-processor.sh" ]; then
    check_pass "Deployment script ready"
    if [ -x "deploy-order-stream-processor.sh" ]; then
        check_pass "Deployment script is executable"
    else
        check_warn "Deployment script not executable (run: chmod +x deploy-order-stream-processor.sh)"
    fi
else
    check_fail "Deployment script missing"
fi

echo ""
echo "📱 Checking WizzDriver App Components..."
echo "---------------------------------------"

# Check WizzDriver app files
FRONTEND_PATH="../Desktop/hadhir/frontend"

if [ -f "$FRONTEND_PATH/lib/main.dart" ]; then
    if grep -q "OrderAssignmentManager" "$FRONTEND_PATH/lib/main.dart"; then
        check_pass "OrderAssignmentManager integrated in main.dart"
    else
        check_fail "OrderAssignmentManager not integrated in main.dart"
    fi
else
    check_fail "main.dart not found"
fi

if [ -f "$FRONTEND_PATH/lib/widgets/order_assignment_manager.dart" ]; then
    check_pass "OrderAssignmentManager widget exists"
else
    check_fail "OrderAssignmentManager widget missing"
fi

if [ -f "$FRONTEND_PATH/lib/screens/order_assignment_screen.dart" ]; then
    check_pass "Order assignment screen exists"
else
    check_fail "Order assignment screen missing"
fi

if [ -f "$FRONTEND_PATH/lib/providers/riverpod/order_assignment_provider.dart" ]; then
    check_pass "Assignment providers exist"
else
    check_fail "Assignment providers missing"
fi

if [ -f "$FRONTEND_PATH/lib/services/unified_driver_websocket_service.dart" ]; then
    check_pass "WebSocket service exists"
else
    check_fail "WebSocket service missing"
fi

echo ""
echo "🔧 Checking System Dependencies..."
echo "--------------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed ($NODE_VERSION)"
else
    check_fail "Node.js not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    check_pass "npm available"
else
    check_fail "npm not available"
fi

# Check Serverless
if command -v npx &> /dev/null; then
    if npx serverless --version &> /dev/null; then
        check_pass "Serverless framework available"
    else
        check_warn "Serverless framework not found (install: npm install -g serverless)"
    fi
else
    check_fail "npx not available"
fi

# Check AWS CLI
if command -v aws &> /dev/null; then
    check_pass "AWS CLI installed"
    
    # Check AWS credentials
    if aws sts get-caller-identity &> /dev/null; then
        check_pass "AWS credentials configured"
    else
        check_warn "AWS credentials not configured (run: aws configure)"
    fi
else
    check_warn "AWS CLI not installed (install: pip install awscli)"
fi

# Check Flutter (for mobile app)
if command -v flutter &> /dev/null; then
    check_pass "Flutter SDK available"
else
    check_warn "Flutter SDK not found (needed for mobile app testing)"
fi

echo ""
echo "📊 Verification Summary"
echo "======================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 System is ready for deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure AWS credentials (if not done): aws configure"
    echo "2. Run deployment script: ./deploy-order-stream-processor.sh"
    echo "3. Test the system: node test-end-to-end-assignment.js"
    echo "4. Test mobile app: flutter run (in frontend directory)"
else
    echo -e "${RED}❌ System not ready for deployment${NC}"
    echo ""
    echo "Please fix the failed checks before deploying."
fi

if [ $WARNINGS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Warning: Some optional components are missing${NC}"
    echo "These may be needed for full functionality."
fi

echo ""
echo "📚 Documentation available:"
echo "- DEPLOYMENT_GUIDE.md - Detailed deployment instructions"
echo "- IMPLEMENTATION_STATUS_REPORT.md - Complete system overview"
echo "- frontend/INTEGRATION_COMPLETE.md - Mobile app integration details"

echo ""
echo "🧪 Testing scripts available:"
echo "- test-end-to-end-assignment.js - Backend flow testing"
echo "- frontend/test_wizzdriver_assignment.dart - Mobile app testing"
echo "- frontend/integration_verification.dart - Integration verification"
