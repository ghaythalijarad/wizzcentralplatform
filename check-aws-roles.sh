#!/bin/bash

# Script to check AWS IAM roles and Cognito Identity Pool configuration
echo "🔍 Checking AWS Role Assignment and Identity Pool Configuration..."

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI to run this check."
    exit 1
fi

# Get current AWS identity
echo "1. Current AWS Identity:"
aws sts get-caller-identity --profile wizz-drivers-ghayth-dev 2>/dev/null || aws sts get-caller-identity

echo -e "\n2. Checking Cognito Identity Pool Configuration:"
IDENTITY_POOL_ID="us-east-1:10dd68af-9c1e-448e-ae67-89eaeb3c8160"

# Get identity pool details
echo "   Identity Pool ID: $IDENTITY_POOL_ID"
aws cognito-identity describe-identity-pool --identity-pool-id $IDENTITY_POOL_ID --region us-east-1 --profile wizz-drivers-ghayth-dev 2>/dev/null || \
aws cognito-identity describe-identity-pool --identity-pool-id $IDENTITY_POOL_ID --region us-east-1

echo -e "\n3. Checking Identity Pool Roles:"
aws cognito-identity get-identity-pool-roles --identity-pool-id $IDENTITY_POOL_ID --region us-east-1 --profile wizz-drivers-ghayth-dev 2>/dev/null || \
aws cognito-identity get-identity-pool-roles --identity-pool-id $IDENTITY_POOL_ID --region us-east-1

echo -e "\n4. Checking User Pool Configuration:"
USER_POOL_ID="us-east-1_Cp9YnOQWi"
aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region us-east-1 --profile wizz-drivers-ghayth-dev 2>/dev/null || \
aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region us-east-1

echo -e "\n5. Checking User Pool Client:"
CLIENT_ID="5hun8p61grnakisu5gammcjelv"
aws cognito-idp describe-user-pool-client --user-pool-id $USER_POOL_ID --client-id $CLIENT_ID --region us-east-1 --profile wizz-drivers-ghayth-dev 2>/dev/null || \
aws cognito-idp describe-user-pool-client --user-pool-id $USER_POOL_ID --client-id $CLIENT_ID --region us-east-1

echo -e "\n6. Testing DynamoDB Table Access:"
aws dynamodb describe-table --table-name WhizzDrivers_dev --region us-east-1 --profile wizz-drivers-ghayth-dev 2>/dev/null || \
aws dynamodb describe-table --table-name WhizzDrivers_dev --region us-east-1

echo -e "\n7. Testing DynamoDB Scan (limited):"
aws dynamodb scan --table-name WhizzDrivers_dev --limit 1 --region us-east-1 --profile wizz-drivers-ghayth-dev 2>/dev/null || \
aws dynamodb scan --table-name WhizzDrivers_dev --limit 1 --region us-east-1

echo -e "\n✅ AWS Role and Configuration Check Complete"
