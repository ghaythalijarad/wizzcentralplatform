#!/bin/bash
# Manual AWS Permissions Setup Guide for WizzCentral Platform

echo "🔧 AWS PERMISSIONS SETUP GUIDE"
echo "==============================="
echo ""
echo "❌ CURRENT ISSUE:"
echo "   Your application can't access DynamoDB table: WizzCentral_Platform_Discounts"
echo "   Error: AccessDeniedException on dynamodb:Scan and dynamodb:PutItem"
echo ""
echo "🎯 SOLUTION:"
echo "   You need to attach DynamoDB permissions to your Cognito Identity Pool's authenticated role"
echo ""
echo "📋 STEP-BY-STEP INSTRUCTIONS:"
echo ""
echo "1. 📱 Open AWS Console: https://console.aws.amazon.com/"
echo ""
echo "2. 🔑 Go to IAM Service:"
echo "   - Search for 'IAM' in the search bar"
echo "   - Click on 'IAM'"
echo ""
echo "3. 🎭 Find Your Role:"
echo "   - Click 'Roles' in the left sidebar"
echo "   - Search for: 'amplify-wizzcentralplatfo-amplifyAuthauthenticatedU'"
echo "   - Click on the role (should be something like: amplify-wizzcentralplatfo-amplifyAuthauthenticatedU-JodP9DSt6mfl)"
echo ""
echo "4. 📝 Create and Attach Policy:"
echo "   - Click 'Add permissions' → 'Create inline policy'"
echo "   - Click the 'JSON' tab"
echo "   - Copy and paste the policy from: $(pwd)/wizzcentral-platform-dynamodb-policy.json"
echo "   - Click 'Review policy'"
echo "   - Name it: 'WizzCentralPlatformDynamoDBAccess'"
echo "   - Click 'Create policy'"
echo ""
echo "5. ✅ Verify:"
echo "   - The role should now have the new policy attached"
echo "   - Wait 1-2 minutes for changes to propagate"
echo "   - Refresh your promotions page and try creating a promotion"
echo ""
echo "🔍 POLICY FILE LOCATION:"
echo "   $(pwd)/wizzcentral-platform-dynamodb-policy.json"
echo ""
echo "📋 ROLE ARN FROM ERROR:"
echo "   arn:aws:sts::031857856164:assumed-role/amplify-wizzcentralplatfo-amplifyAuthauthenticatedU-JodP9DSt6mfl/CognitoIdentityCredentials"
echo ""
echo "💡 ALTERNATIVE - If you can't access AWS Console:"
echo "   1. Run: aws configure sso"
echo "   2. Then run: ./fix-dynamodb-permissions.sh"
echo ""

# Check if policy file exists
if [ -f "wizzcentral-platform-dynamodb-policy.json" ]; then
    echo "✅ Policy file exists: wizzcentral-platform-dynamodb-policy.json"
    echo ""
    echo "📄 POLICY CONTENT:"
    echo "=================="
    cat wizzcentral-platform-dynamodb-policy.json
else
    echo "❌ Policy file not found. Creating it now..."
    cat > wizzcentral-platform-dynamodb-policy.json << 'EOF'
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
        "arn:aws:dynamodb:us-east-1:031857856164:table/WizzCentral_Platform_Discounts",
        "arn:aws:dynamodb:us-east-1:031857856164:table/WizzCentral_Platform_Discounts/*",
        "arn:aws:dynamodb:us-east-1:031857856164:table/WhizzMerchants_Discounts",
        "arn:aws:dynamodb:us-east-1:031857856164:table/WhizzMerchants_Discounts/*",
        "arn:aws:dynamodb:us-east-1:031857856164:table/WhizzMerchants_Businesses",
        "arn:aws:dynamodb:us-east-1:031857856164:table/WhizzMerchants_Businesses/*"
      ]
    }
  ]
}
EOF
    echo "✅ Policy file created!"
fi

echo ""
echo "🚀 AFTER FIXING PERMISSIONS:"
echo "   Your promotion creation will work perfectly!"
echo "   All the code is already implemented and tested."
