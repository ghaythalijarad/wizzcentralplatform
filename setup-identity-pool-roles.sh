#!/bin/bash
# Setup IAM Roles for WizzCentralPlatform Identity Pool

IDENTITY_POOL_ID="us-east-1:10dd68af-9c1e-448e-ae67-89eaeb3c8160"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🔧 Setting up IAM roles for Identity Pool: $IDENTITY_POOL_ID"
echo "📍 Region: $REGION"
echo "🏢 Account ID: $ACCOUNT_ID"
echo ""

# Create Authenticated Role Trust Policy
cat > /tmp/auth-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "$IDENTITY_POOL_ID"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated"
        }
      }
    }
  ]
}
EOF

# Create Authenticated Role Policy with DynamoDB permissions
cat > /tmp/auth-role-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/WhizzDrivers_*",
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/WhizzMerchants_*",
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/WizzUser_*",
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/WizzCentral_*",
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/WizzOrders*",
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/ChatMessages",
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/ChatSessions",
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/WebSocketConnections"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::whizz-driver-documents-dev/*",
        "arn:aws:s3:::whizz-merchant-documents-dev/*"
      ]
    }
  ]
}
EOF

# Create Unauthenticated Role Trust Policy
cat > /tmp/unauth-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "$IDENTITY_POOL_ID"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "unauthenticated"
        }
      }
    }
  ]
}
EOF

# Create Unauthenticated Role Policy (minimal permissions)
cat > /tmp/unauth-role-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-identity:GetId",
        "cognito-identity:GetCredentialsForIdentity"
      ],
      "Resource": "*"
    }
  ]
}
EOF

echo "1️⃣ Creating Authenticated Role..."
AUTH_ROLE_NAME="WizzCentral_Cognito_Authenticated_Role"

# Delete existing role if it exists
aws iam delete-role-policy --role-name $AUTH_ROLE_NAME --policy-name AuthenticatedPolicy 2>/dev/null || true
aws iam delete-role --role-name $AUTH_ROLE_NAME 2>/dev/null || true

# Create authenticated role
aws iam create-role \
  --role-name $AUTH_ROLE_NAME \
  --assume-role-policy-document file:///tmp/auth-trust-policy.json \
  --description "Authenticated role for WizzCentral Platform users"

AUTH_ROLE_ARN=$(aws iam get-role --role-name $AUTH_ROLE_NAME --query 'Role.Arn' --output text)
echo "✅ Authenticated Role ARN: $AUTH_ROLE_ARN"

# Attach policy to authenticated role
aws iam put-role-policy \
  --role-name $AUTH_ROLE_NAME \
  --policy-name AuthenticatedPolicy \
  --policy-document file:///tmp/auth-role-policy.json

echo "✅ Authenticated Role Policy attached"
echo ""

echo "2️⃣ Creating Unauthenticated Role..."
UNAUTH_ROLE_NAME="WizzCentral_Cognito_Unauthenticated_Role"

# Delete existing role if it exists
aws iam delete-role-policy --role-name $UNAUTH_ROLE_NAME --policy-name UnauthenticatedPolicy 2>/dev/null || true
aws iam delete-role --role-name $UNAUTH_ROLE_NAME 2>/dev/null || true

# Create unauthenticated role
aws iam create-role \
  --role-name $UNAUTH_ROLE_NAME \
  --assume-role-policy-document file:///tmp/unauth-trust-policy.json \
  --description "Unauthenticated role for WizzCentral Platform"

UNAUTH_ROLE_ARN=$(aws iam get-role --role-name $UNAUTH_ROLE_NAME --query 'Role.Arn' --output text)
echo "✅ Unauthenticated Role ARN: $UNAUTH_ROLE_ARN"

# Attach policy to unauthenticated role
aws iam put-role-policy \
  --role-name $UNAUTH_ROLE_NAME \
  --policy-name UnauthenticatedPolicy \
  --policy-document file:///tmp/unauth-role-policy.json

echo "✅ Unauthenticated Role Policy attached"
echo ""

echo "3️⃣ Attaching roles to Identity Pool..."
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id $IDENTITY_POOL_ID \
  --roles authenticated=$AUTH_ROLE_ARN,unauthenticated=$UNAUTH_ROLE_ARN \
  --region $REGION

echo "✅ Roles attached to Identity Pool"
echo ""

# Clean up temp files
rm /tmp/auth-trust-policy.json
rm /tmp/auth-role-policy.json
rm /tmp/unauth-trust-policy.json
rm /tmp/unauth-role-policy.json

echo "========================================="
echo "✅ Identity Pool Setup Complete!"
echo "========================================="
echo ""
echo "📋 Summary:"
echo "  Identity Pool ID: $IDENTITY_POOL_ID"
echo "  Authenticated Role: $AUTH_ROLE_ARN"
echo "  Unauthenticated Role: $UNAUTH_ROLE_ARN"
echo ""
echo "🎯 DynamoDB Permissions Granted:"
echo "  - WhizzDrivers_*"
echo "  - WhizzMerchants_*"
echo "  - WizzUser_*"
echo "  - WizzCentral_*"
echo "  - WizzOrders*"
echo "  - ChatMessages"
echo "  - ChatSessions"
echo "  - WebSocketConnections"
echo ""
echo "✅ Your application can now access DynamoDB tables!"
