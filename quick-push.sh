#!/bin/bash
# Quick Git Push Script for WhizzCentralPlatform
# This script adds all changes, commits, and pushes to GitHub

echo "🚀 Quick Push to GitHub - WhizzCentralPlatform"
echo "=============================================="
echo ""

# Navigate to project directory
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Check current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Current branch: $BRANCH"
echo ""

# Show status
echo "📊 Current status:"
git status --short
echo ""

# Add all changes
echo "➕ Adding all changes..."
git add -A
echo ""

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "✅ No changes to commit - everything is up to date!"
    echo ""
    echo "📝 Last 3 commits:"
    git --no-pager log --oneline -3
    exit 0
fi

# Show what will be committed
echo "📝 Changes to be committed:"
git diff --cached --stat
echo ""

# Get commit message
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
COMMIT_MSG="Deploy: WizzCentralPlatform update - $TIMESTAMP"

echo "💬 Commit message: $COMMIT_MSG"
echo ""

# Commit changes
echo "💾 Committing changes..."
git commit -m "$COMMIT_MSG"
echo ""

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push origin $BRANCH
echo ""

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🌐 Amplify will automatically deploy from:"
    echo "   https://main.d2f5oacwil9cbi.amplifyapp.com"
    echo ""
    echo "📊 Monitor build at:"
    echo "   https://console.aws.amazon.com/amplify/apps/d2f5oacwil9cbi/branches/main"
else
    echo "❌ Failed to push to GitHub"
    exit 1
fi
