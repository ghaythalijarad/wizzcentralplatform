#!/bin/bash

# Add S3 GetObject permissions to Cognito Authenticated Role for Driver Documents
# This allows authenticated users to generate pre-signed URLs for driver documents

set -e

echo "🔧 Adding S3 permissions to WizzCentral_Cognito_Authenticated_Role..."

# Configuration
ROLE_NAME="WizzCentral_Cognito_Authenticated_Role"
BUCKET_NAME="whizz-driver-documents-dev"
POLICY_NAME="WizzCentral_S3_DriverDocuments_Read"

# Create the policy document
POLICY_DOCUMENT=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowDriverDocumentsRead",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            "Resource": [
                "arn:aws:s3:::${BUCKET_NAME}/*"
            ]
        },
        {
            "Sid": "AllowDriverDocumentsBucketList",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${BUCKET_NAME}"
            ]
        }
    ]
}
EOF
)

echo "📄 Policy document created:"
echo "$POLICY_DOCUMENT"

# Check if role exists
echo ""
echo "🔍 Checking if role exists..."
if ! aws iam get-role --role-name "$ROLE_NAME" &>/dev/null; then
    echo "❌ Error: Role '$ROLE_NAME' not found!"
    echo "Please ensure the Cognito Identity Pool is set up correctly."
    exit 1
fi

echo "✅ Role found: $ROLE_NAME"

# Check if policy already exists
echo ""
echo "🔍 Checking if inline policy already exists..."
if aws iam get-role-policy --role-name "$ROLE_NAME" --policy-name "$POLICY_NAME" &>/dev/null; then
    echo "⚠️  Policy '$POLICY_NAME' already exists. Updating..."
    aws iam put-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-name "$POLICY_NAME" \
        --policy-document "$POLICY_DOCUMENT"
    echo "✅ Policy updated successfully!"
else
    echo "📝 Creating new inline policy..."
    aws iam put-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-name "$POLICY_NAME" \
        --policy-document "$POLICY_DOCUMENT"
    echo "✅ Policy created successfully!"
fi

# Verify the policy was added
echo ""
echo "🔍 Verifying policy was added..."
if aws iam get-role-policy --role-name "$ROLE_NAME" --policy-name "$POLICY_NAME" &>/dev/null; then
    echo "✅ Policy verification successful!"
    echo ""
    echo "📋 Current inline policies on role:"
    aws iam list-role-policies --role-name "$ROLE_NAME" --output table
else
    echo "❌ Policy verification failed!"
    exit 1
fi

echo ""
echo "✅ S3 permissions successfully added to Cognito Authenticated Role!"
echo ""
echo "📝 Summary:"
echo "   - Role: $ROLE_NAME"
echo "   - Policy: $POLICY_NAME"
echo "   - Bucket: $BUCKET_NAME"
echo "   - Permissions: s3:GetObject, s3:GetObjectVersion, s3:ListBucket"
echo ""
echo "🎉 Users can now view driver documents in the platform!"
echo ""
echo "⚠️  Note: Users may need to log out and log back in for changes to take effect."
