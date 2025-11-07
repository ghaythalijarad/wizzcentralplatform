#!/bin/bash
# AWS SSO Login Script for WizzCentral Platform

echo "🔐 Logging in to AWS SSO..."
echo "Profile: wizz-drivers-ghayth-dev"
echo "Region: us-east-1"
echo ""

# Login to AWS SSO
aws sso login --profile wizz-drivers-ghayth-dev

# Verify login
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ AWS SSO login successful!"
    echo ""
    echo "Verifying credentials..."
    aws sts get-caller-identity --profile wizz-drivers-ghayth-dev
    echo ""
    echo "✅ Ready to use AWS services"
    echo ""
    echo "Next steps:"
    echo "  1. Restart the local server with: npm run local"
    echo "  2. Test API: http://localhost:3000/api/regions"
else
    echo ""
    echo "❌ AWS SSO login failed"
    echo "Please check your AWS CLI installation and SSO configuration"
    exit 1
fi
