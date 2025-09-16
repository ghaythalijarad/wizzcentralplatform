#!/bin/bash
# Fix AWS Permissions for WizzCentral Platform DynamoDB Access

set -e

echo "🔧 Fixing AWS DynamoDB permissions for WizzCentral Platform..."

# Configuration
IDENTITY_POOL_ID="us-east-1:864073dc-423f-42ae-9b1a-67c1c913b38a"
POLICY_NAME="WizzCentralPlatformDynamoDBAccess"
REGION="us-east-1"

# Resolve AWS Account ID dynamically
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
if [ -z "$ACCOUNT_ID" ] || [ "$ACCOUNT_ID" = "None" ]; then
  echo "❌ Could not resolve AWS account ID. Ensure SSO is logged in: aws sso login"
  exit 1
fi

echo "👤 Using AWS account: $ACCOUNT_ID ($REGION)"

# Build policy JSON dynamically for this account/region (avoids hard-coded ARNs)
read -r -d '' POLICY_JSON <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/WizzCentral_Platform_Discounts",
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/WizzCentral_Platform_Discounts/*",
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/WhizzMerchants_Discounts",
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/WhizzMerchants_Discounts/*",
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/WhizzMerchants_Businesses",
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/WhizzMerchants_Businesses/*"
      ]
    }
  ]
}
EOF

TMP_POLICY=$(mktemp)
echo "$POLICY_JSON" > "$TMP_POLICY"
trap 'rm -f "$TMP_POLICY"' EXIT

# Get the roles mapped to the identity pool
echo "📋 Getting roles mapped to the identity pool..."
AUTHENTICATED_ROLE=$(aws cognito-identity get-identity-pool-roles \
  --identity-pool-id $IDENTITY_POOL_ID \
  --region $REGION \
  --query 'Roles.authenticated' \
  --output text || true)

UNAUTHENTICATED_ROLE=$(aws cognito-identity get-identity-pool-roles \
  --identity-pool-id $IDENTITY_POOL_ID \
  --region $REGION \
  --query 'Roles.unauthenticated' \
  --output text || true)

if [ -z "$AUTHENTICATED_ROLE" ] || [ "$AUTHENTICATED_ROLE" = "None" ]; then
  echo "❌ No authenticated role is mapped to the identity pool."
  echo "➡️  Fix by mapping roles (example):"
  echo "    aws cognito-identity set-identity-pool-roles \\
            --identity-pool-id $IDENTITY_POOL_ID \\
            --roles authenticated=arn:aws:iam::$ACCOUNT_ID:role/<YourAuthRole>,unauthenticated=arn:aws:iam::$ACCOUNT_ID:role/<YourUnauthRole>"
  exit 1
fi

echo "✅ Authenticated role: $AUTHENTICATED_ROLE"
[ -n "$UNAUTHENTICATED_ROLE" ] && [ "$UNAUTHENTICATED_ROLE" != "None" ] && echo "ℹ️  Unauthenticated role: $UNAUTHENTICATED_ROLE"

# Extract role names from ARNs
AUTH_ROLE_NAME=$(echo "$AUTHENTICATED_ROLE" | awk -F'/' '{print $NF}')
if [ -n "$UNAUTHENTICATED_ROLE" ] && [ "$UNAUTHENTICATED_ROLE" != "None" ]; then
  UNAUTH_ROLE_NAME=$(echo "$UNAUTHENTICATED_ROLE" | awk -F'/' '{print $NF}')
fi

# Policy ARN using resolved account
POLICY_ARN="arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"

echo "🔍 Checking if policy exists..."
if aws iam get-policy --policy-arn "$POLICY_ARN" &>/dev/null; then
  echo "⚠️  Policy exists, updating it..."
  POLICY_VERSION=$(aws iam create-policy-version \
    --policy-arn "$POLICY_ARN" \
    --policy-document file://$TMP_POLICY \
    --set-as-default \
    --query 'PolicyVersion.VersionId' \
    --output text)
  echo "✅ Updated policy to version: $POLICY_VERSION"
else
  echo "📝 Creating new policy..."
  POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document file://$TMP_POLICY \
    --description "Allows WizzCentral Platform to access DynamoDB tables" \
    --query 'Policy.Arn' \
    --output text)
  echo "✅ Created policy: $POLICY_ARN"
fi

# Attach policy to authenticated role
echo "🔗 Attaching policy to authenticated role ($AUTH_ROLE_NAME)..."
aws iam attach-role-policy --role-name "$AUTH_ROLE_NAME" --policy-arn "$POLICY_ARN" || true

# Optionally attach to unauthenticated role (useful for debug mode)
if [ -n "$UNAUTH_ROLE_NAME" ]; then
  echo "🔗 Attaching policy to unauthenticated role ($UNAUTH_ROLE_NAME)..."
  aws iam attach-role-policy --role-name "$UNAUTH_ROLE_NAME" --policy-arn "$POLICY_ARN" || true
fi

echo "✅ Policy attached."

echo "🎉 DynamoDB permissions fixed!"
echo "   Users can now:"
echo "   - Scan, Query, Get, Put, Update, Delete items in:"
echo "     • WizzCentral_Platform_Discounts"
echo "     • WhizzMerchants_Discounts"
echo "     • WhizzMerchants_Businesses"

echo "📋 Next steps:"
echo "   1) Wait 1–2 minutes for IAM changes to propagate"
echo "   2) Refresh the Promotions page"
echo "   3) Create a promotion and verify it appears with PLATFORM badge"
