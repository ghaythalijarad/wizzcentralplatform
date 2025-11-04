#!/bin/bash
# Apply WizzOrders DynamoDB permissions to Cognito Authenticated Role

echo "🔐 Applying WizzOrders DynamoDB permissions..."

# Variables
ROLE_NAME="WizzCentral_Cognito_Authenticated_Role"
POLICY_NAME="WizzOrders_DynamoDB_Access"
POLICY_FILE="wizzorders-dynamodb-policy.json"
REGION="us-east-1"

# Check if policy file exists
if [ ! -f "$POLICY_FILE" ]; then
    echo "❌ Policy file not found: $POLICY_FILE"
    exit 1
fi

echo "📋 Policy file found: $POLICY_FILE"

# Create the policy
echo "📝 Creating IAM policy: $POLICY_NAME..."
POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "file://$POLICY_FILE" \
    --description "Allows read access to WizzOrders DynamoDB table" \
    --region "$REGION" \
    --output json | jq -r '.Policy.Arn')

if [ $? -eq 0 ] && [ -n "$POLICY_ARN" ]; then
    echo "✅ Policy created: $POLICY_ARN"
else
    echo "⚠️  Policy might already exist, trying to get existing ARN..."
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"
    echo "📌 Using existing policy: $POLICY_ARN"
fi

# Attach the policy to the role
echo "🔗 Attaching policy to role: $ROLE_NAME..."
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "$POLICY_ARN" \
    --region "$REGION"

if [ $? -eq 0 ]; then
    echo "✅ Policy attached successfully!"
else
    echo "❌ Failed to attach policy to role"
    exit 1
fi

# Verify the attachment
echo "🔍 Verifying policy attachment..."
aws iam list-attached-role-policies \
    --role-name "$ROLE_NAME" \
    --region "$REGION" \
    --output json | jq -r '.AttachedPolicies[] | "  - \(.PolicyName)"'

echo ""
echo "🎉 Done! WizzOrders DynamoDB permissions have been applied."
echo ""
echo "⏰ Note: It may take a few seconds for the permissions to propagate."
echo "🔄 Please refresh your browser and try loading orders again."
