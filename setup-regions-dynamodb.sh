#!/bin/zsh

echo "🗺️  Setting up WizzCentral Regions DynamoDB Table"
echo "=================================================="
echo ""

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend

# Set AWS credentials
export AWS_REGION=us-east-1
export AWS_PROFILE=wizz-drivers-ghayth-dev

echo "📋 Configuration:"
echo "   Region: $AWS_REGION"
echo "   Profile: $AWS_PROFILE"
echo ""

# Run the table creation script
node create-regions-table.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Regions table setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Restart your local dev server"
    echo "2. Open: http://localhost:3000/pages/regions.html"
    echo "3. Start managing regions with DynamoDB!"
else
    echo ""
    echo "❌ Setup failed. Check the error above."
    exit 1
fi
