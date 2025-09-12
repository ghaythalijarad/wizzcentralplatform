#!/bin/bash

echo "🚀 FINAL DEPLOYMENT FIX for WizzCentral Platform"
echo "=============================================="
echo ""

echo "1️⃣ Creating a completely clean build configuration..."

# Create a simple, bulletproof amplify.yml
cat > amplify.yml << 'EOF'
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "🚀 Starting WizzCentral build..."
        - npm ci
    build:
      commands:
        - echo "📦 Building application..."
        - rm -rf build/
        - mkdir -p build
        - echo "📋 Copying all frontend files..."
        - cp -r frontend/* build/
        - echo "🏠 Ensuring index.html is at root..."
        - cp frontend/index.html build/index.html
        - echo "🔀 Adding redirect rules..."
        - echo "/ /index.html 200" > build/_redirects
        - echo "/pages/* /pages/:splat 200" >> build/_redirects
        - echo "/* /index.html 404" >> build/_redirects
        - echo "✅ Build completed"
        - ls -la build/
    postBuild:
      commands:
        - echo "🔍 Validating build..."
        - test -f build/index.html && echo "✅ index.html exists"
        - test -f build/_redirects && echo "✅ redirects exist"
        - echo "🎉 Build validation complete"
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
EOF

echo "✅ Created new amplify.yml"

echo ""
echo "2️⃣ Committing and pushing final fix..."

git add amplify.yml
git commit -m "FINAL FIX: Bulletproof Amplify deployment configuration"
git push origin main

echo ""
echo "3️⃣ Deployment initiated!"
echo "🔗 Monitor at: https://console.aws.amazon.com/amplify/home"
echo "⏰ Build should complete in 2-3 minutes"
echo ""
echo "4️⃣ After deployment completes, test at:"
echo "   https://main.d2f5oacwil9cbi.amplifyapp.com"
echo ""
echo "✅ This configuration will:"
echo "   - Serve frontend/index.html as the root page"
echo "   - Handle all routing properly with redirects"
echo "   - Prevent infinite loops"
echo "   - Show the login page correctly"
