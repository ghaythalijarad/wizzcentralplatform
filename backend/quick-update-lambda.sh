#!/bin/bash

# Quick Lambda code update without full redeployment

echo "🔄 Quick Lambda Code Update"
echo "=============================="
echo ""

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend

# Clean and rebuild lambda package
echo "1️⃣ Cleaning old package..."
rm -rf lambda-package
mkdir -p lambda-package

echo "2️⃣ Copying updated code..."
cp -r src lambda-package/
cp lambda-package.json lambda-package/package.json

echo "3️⃣ Installing dependencies..."
cd lambda-package
npm install --production --no-optional
cd ..

echo "4️⃣ Creating deployment package..."
cd lambda-package
zip -r ../lambda-update.zip . -q
cd ..

echo "5️⃣ Updating Lambda function..."
aws lambda update-function-code \
  --function-name whizzme-chat-dev \
  --zip-file fileb://lambda-update.zip \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1

echo ""
echo "✅ Lambda function updated!"
echo ""
echo "Wait 5 seconds for deployment to complete..."
sleep 5

echo ""
echo "🧪 Testing endpoint..."
curl -X POST https://utqr95jjx4.execute-api.us-east-1.amazonaws.com/dev/whizzme/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"How do I process refunds?","userType":"merchant","sessionId":"test","metadata":{"category":"order_management"}}'

echo ""
echo ""
echo "✅ Update complete!"
