#!/bin/bash

# Create DynamoDB Table for Regions Management
# This script creates the table and loads all 18 Iraqi governorates

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend

export AWS_PAGER=""
export AWS_REGION=us-east-1
export AWS_PROFILE=wizz-drivers-ghayth-dev

echo "🚀 Creating DynamoDB table: WizzCentral_Regions"
echo "================================================"
echo ""

node create-regions-table.js

echo ""
echo "✅ Done! Check the output above for results."
