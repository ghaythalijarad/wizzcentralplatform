#!/bin/zsh
# Start Mapbox Playground with DynamoDB Integration
# This enables saving to both local file AND AWS DynamoDB

echo "🗺️  Starting Mapbox Geocoding Playground with DynamoDB..."
echo "============================================================"
echo ""

# Set environment variables for DynamoDB
export USE_DYNAMODB=true
export AWS_REGION=us-east-1
export DYNAMODB_TABLE=WizzOrders-Regions-ghayth-dev
export AWS_PROFILE=wizz-drivers-ghayth-dev

echo "✅ DynamoDB Integration: ENABLED"
echo "📍 AWS Region: $AWS_REGION"
echo "📊 DynamoDB Table: $DYNAMODB_TABLE"
echo "👤 AWS Profile: $AWS_PROFILE"
echo ""
echo "💾 Data will be saved to:"
echo "   1. Local file: data/regions.json (backup)"
echo "   2. DynamoDB: $DYNAMODB_TABLE (production)"
echo ""
echo "🚀 Starting server..."
echo ""

# Start the server with DynamoDB enabled
node regions-api/server.js
