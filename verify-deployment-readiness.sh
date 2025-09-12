#!/bin/bash

# WizzCentral Platform - GitHub to Amplify Deployment Verification Script
# This script helps verify that your platform is ready for Amplify deployment

echo "🚀 WizzCentral Platform - GitHub to Amplify Deployment Verification"
echo "=================================================================="

# Check if we're in the right directory
if [ ! -f "amplify.yml" ]; then
    echo "❌ Error: amplify.yml not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Found amplify.yml build configuration"

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found"
    exit 1
fi

echo "✅ Frontend directory exists"

# Count frontend files
FRONTEND_FILES=$(find frontend -type f | wc -l)
echo "✅ Frontend contains $FRONTEND_FILES files"

# Check essential files
ESSENTIAL_FILES=(
    "frontend/index.html"
    "frontend/dashboard.js"
    "frontend/support.js"
    "frontend/data-service.js"
    "package.json"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Found $file"
    else
        echo "⚠️  Warning: $file not found"
    fi
done

# Check git status
echo ""
echo "📋 Git Status:"
echo "============="

# Check if we have commits
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
if [ "$COMMIT_COUNT" -gt "0" ]; then
    echo "✅ Repository has $COMMIT_COUNT commits"
    echo "✅ Latest commit: $(git log -1 --oneline)"
else
    echo "❌ No commits found"
fi

# Check remote repository
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "none")
if [ "$REMOTE_URL" != "none" ]; then
    echo "✅ Remote repository: $REMOTE_URL"
else
    echo "❌ No remote repository configured"
fi

# Check if we're up to date with remote
if git diff --quiet HEAD origin/main 2>/dev/null; then
    echo "✅ Local branch is up to date with remote"
else
    echo "⚠️  Local branch may not be up to date with remote"
fi

echo ""
echo "🎯 Deployment Readiness Check:"
echo "=============================="

READY=true

# Check amplify.yml syntax
if python3 -c "import yaml; yaml.safe_load(open('amplify.yml'))" 2>/dev/null; then
    echo "✅ amplify.yml syntax is valid"
else
    echo "❌ amplify.yml syntax error"
    READY=false
fi

# Check if package.json exists (for npm ci command)
if [ -f "package.json" ]; then
    echo "✅ package.json found for dependency installation"
else
    echo "⚠️  package.json not found - npm ci command may fail"
fi

echo ""
if [ "$READY" = true ]; then
    echo "🎉 READY FOR DEPLOYMENT!"
    echo "========================"
    echo ""
    echo "Next steps:"
    echo "1. Open AWS Amplify Console: https://console.aws.amazon.com/amplify/"
    echo "2. Click 'New app' → 'Host web app'"
    echo "3. Choose 'GitHub' as source"
    echo "4. Select your repository and 'main' branch"
    echo "5. Amplify will auto-detect the amplify.yml configuration"
    echo "6. Click 'Save and Deploy'"
    echo ""
    echo "Estimated deployment time: 5-10 minutes"
    echo ""
    echo "📖 For detailed instructions, see: GITHUB_TO_AMPLIFY_DEPLOYMENT.md"
else
    echo "⚠️  DEPLOYMENT NOT READY"
    echo "========================"
    echo "Please fix the issues above before deploying."
fi

echo ""
echo "📊 Platform Statistics:"
echo "======================"
echo "Total files in frontend: $FRONTEND_FILES"
echo "Project size: $(du -sh . | cut -f1)"
echo "Git repository size: $(du -sh .git | cut -f1)"

# Check for large files that might slow deployment
echo ""
echo "🔍 Large Files Check:"
echo "===================="
find . -type f -size +10M 2>/dev/null | grep -v node_modules | grep -v .git | head -5 | while read file; do
    size=$(du -sh "$file" | cut -f1)
    echo "⚠️  Large file: $file ($size)"
done || echo "✅ No large files found"

echo ""
echo "🚀 Ready to deploy to AWS Amplify!"
