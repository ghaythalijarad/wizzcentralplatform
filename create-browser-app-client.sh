#!/bin/bash
# Create a new Cognito App Client without client secret for browser use

echo "🚀 Creating new Cognito App Client for browser authentication..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

USER_POOL_ID="us-east-1_Cp9YnOQWi"
REGION="us-east-1"
CLIENT_NAME="WizzCentral-Browser-Client"

echo "📋 Configuration:"
echo "   User Pool ID: $USER_POOL_ID"
echo "   Region: $REGION"
echo "   Client Name: $CLIENT_NAME"
echo ""

echo "🔧 Creating app client without secret..."

# Create the app client
RESPONSE=$(aws cognito-idp create-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-name "$CLIENT_NAME" \
    --no-generate-secret \
    --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_PASSWORD_AUTH \
    --prevent-user-existence-errors ENABLED \
    --enable-token-revocation \
    --access-token-validity 60 \
    --id-token-validity 60 \
    --refresh-token-validity 5 \
    --token-validity-units AccessToken=minutes,IdToken=minutes,RefreshToken=days \
    --region "$REGION" \
    --output json 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ App client created successfully!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 New App Client Details:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    CLIENT_ID=$(echo "$RESPONSE" | grep -o '"ClientId": "[^"]*' | cut -d'"' -f4)
    CLIENT_NAME_RESP=$(echo "$RESPONSE" | grep -o '"ClientName": "[^"]*' | cut -d'"' -f4)
    
    echo ""
    echo "   Client Name: $CLIENT_NAME_RESP"
    echo "   Client ID: $CLIENT_ID"
    echo "   Client Secret: NONE (not generated)"
    echo "   User Pool ID: $USER_POOL_ID"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 Next Steps:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Update frontend/config.js with the new Client ID:"
    echo ""
    echo "   COGNITO_CLIENT_ID: '$CLIENT_ID',"
    echo ""
    echo "2. Clear browser cache (Cmd+Shift+R)"
    echo ""
    echo "3. Test login at http://localhost:3000/index.html"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Save to a file for easy reference
    cat > cognito-browser-client.txt <<EOF
WizzCentral Browser App Client
==============================

Created: $(date)

Client Name: $CLIENT_NAME_RESP
Client ID: $CLIENT_ID
User Pool ID: $USER_POOL_ID
Region: $REGION

Client Secret: NONE (browser-safe)

Auth Flows Enabled:
- ALLOW_USER_SRP_AUTH
- ALLOW_REFRESH_TOKEN_AUTH
- ALLOW_USER_PASSWORD_AUTH

Token Expiration:
- Access Token: 60 minutes
- ID Token: 60 minutes
- Refresh Token: 5 days

Configuration for frontend/config.js:
COGNITO_CLIENT_ID: '$CLIENT_ID',
EOF
    
    echo "📄 Details saved to: cognito-browser-client.txt"
    echo ""
    
else
    echo "❌ Failed to create app client!"
    echo ""
    echo "Error details:"
    echo "$RESPONSE"
    echo ""
    exit 1
fi
