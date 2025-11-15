#!/bin/bash
# Deploy support.html changes to Amplify

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

echo "📦 Adding changes..."
git add frontend/pages/support.html

echo "📝 Committing..."
git commit -m "fix: bump version to 1763060500 - complete WebSocket diagnostic deployment"

echo "🚀 Pushing to origin..."
git push origin main

echo "🚀 Pushing to amplify..."
git push amplify main

echo "✅ Deployment triggered!"
