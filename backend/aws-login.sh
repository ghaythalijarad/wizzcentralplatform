#!/bin/bash

# AWS SSO Login Helper for whizzAI Deployment
# This script helps you login to AWS SSO for the AI deployment

echo "🔐 AWS SSO Login Helper"
echo "======================="
echo ""

# Check if already logged in
if aws sts get-caller-identity > /dev/null 2>&1; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
    echo "✅ You are already logged in!"
    echo "   Account: $ACCOUNT_ID"
    echo "   Identity: $USER_ARN"
    echo ""
    echo "You can proceed with deployment:"
    echo "   ./deploy-ai-simple.sh"
    exit 0
fi

echo "You are not logged in to AWS SSO."
echo ""
echo "Available SSO profiles:"
echo "  1) Default (no profile specified)"
echo "  2) wizz-drivers-ghayth-dev"
echo "  3) wizz-merchants-dev"
echo ""
read -p "Select option (1-3) or press Enter for default: " choice

case $choice in
    1|"")
        echo ""
        echo "Logging in with default profile..."
        aws sso login
        ;;
    2)
        echo ""
        echo "Logging in with wizz-drivers-ghayth-dev profile..."
        aws sso login --profile wizz-drivers-ghayth-dev
        ;;
    3)
        echo ""
        echo "Logging in with wizz-merchants-dev profile..."
        aws sso login --profile wizz-merchants-dev
        ;;
    *)
        echo ""
        echo "Invalid option. Trying default..."
        aws sso login
        ;;
esac

# Verify login
echo ""
echo "Verifying login..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
    echo ""
    echo "✅ Login successful!"
    echo "   Account: $ACCOUNT_ID"
    echo "   Identity: $USER_ARN"
    echo ""
    echo "You can now deploy the AI backend:"
    echo "   ./deploy-ai-simple.sh"
else
    echo ""
    echo "❌ Login failed. Please try again or check your SSO configuration."
    exit 1
fi
