#!/bin/zsh

echo "🔧 Adding chat_merchant_connect route to WebSocket API"
echo "======================================================="
echo ""

# Step 1: Get integrations
echo "📋 Step 1: Getting integration IDs..."
INTEGRATIONS=$(aws apigatewayv2 get-integrations \
  --api-id 7ysrz3rspi \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --no-cli-pager \
  --output json 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Failed to get integrations"
  echo "$INTEGRATIONS"
  exit 1
fi

# Extract first integration ID (they all likely point to same Lambda)
INTEGRATION_ID=$(echo "$INTEGRATIONS" | grep -o '"IntegrationId": "[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$INTEGRATION_ID" ]; then
  echo "❌ No integration ID found"
  exit 1
fi

echo "✅ Found Integration ID: $INTEGRATION_ID"
echo ""

# Step 2: Create the route
echo "📋 Step 2: Creating chat_merchant_connect route..."
ROUTE_RESULT=$(aws apigatewayv2 create-route \
  --api-id 7ysrz3rspi \
  --route-key chat_merchant_connect \
  --target "integrations/$INTEGRATION_ID" \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --no-cli-pager 2>&1)

if [ $? -ne 0 ]; then
  echo "⚠️  Route creation result: $ROUTE_RESULT"
  if echo "$ROUTE_RESULT" | grep -q "ConflictException"; then
    echo "ℹ️  Route already exists"
  else
    echo "❌ Failed to create route"
    exit 1
  fi
else
  echo "✅ Route created successfully"
fi
echo ""

# Step 3: Deploy the API stage
echo "📋 Step 3: Deploying API stage..."
DEPLOY_RESULT=$(aws apigatewayv2 create-deployment \
  --api-id 7ysrz3rspi \
  --description "Add merchant chat route" \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --no-cli-pager 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed: $DEPLOY_RESULT"
  exit 1
fi

echo "✅ API stage deployed"
echo ""

# Step 4: Verify routes
echo "📋 Step 4: Verifying routes..."
ROUTES=$(aws apigatewayv2 get-routes \
  --api-id 7ysrz3rspi \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --no-cli-pager \
  --query 'Items[].RouteKey' \
  --output text 2>&1)

if echo "$ROUTES" | grep -q "chat_merchant_connect"; then
  echo "✅ chat_merchant_connect route is active!"
else
  echo "❌ chat_merchant_connect route not found in:"
  echo "$ROUTES"
  exit 1
fi

echo ""
echo "✅ SUCCESS! Merchant chat route is now live."
echo ""
echo "Next steps:"
echo "  1. Run iOS app: bash /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzMerchants/run-ios.sh"
echo "  2. Open: About App → Chat Support"
echo "  3. Send message: 'Test merchant chat'"
echo "  4. Check support dashboard: http://localhost:3000/pages/support.html"
echo ""
