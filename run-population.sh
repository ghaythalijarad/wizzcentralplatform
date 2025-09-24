#!/bin/bash

# Iraqi Regions Population Script Runner
echo "🚀 Iraqi Regions Population Script"
echo "=================================="

cd /Users/ghaythallaheebi/wizzcentralplatform

echo "📊 Running comprehensive population..."
node populate-complete-iraqi-regions.js

echo "🔍 Running verification..."
node verify-complete-iraqi-regions.js

echo "✅ Population and verification complete!"
