#!/bin/bash

echo "🔍 Checking AWS DynamoDB WizzCentral_Regions table..."
echo "=============================================="

# Check total item count
echo "📊 Getting total item count..."
aws dynamodb scan \
  --table-name WizzCentral_Regions \
  --select COUNT \
  --region us-east-1 \
  --output table

echo ""
echo "📋 Getting sample items..."
aws dynamodb scan \
  --table-name WizzCentral_Regions \
  --limit 5 \
  --region us-east-1 \
  --output table

echo ""
echo "🎯 Looking for Iraqi governorates..."
aws dynamodb scan \
  --table-name WizzCentral_Regions \
  --filter-expression "#level = :level_val" \
  --expression-attribute-names '{"#level": "level"}' \
  --expression-attribute-values '{":level_val": {"N": "1"}}' \
  --region us-east-1 \
  --output table

echo ""
echo "✅ Verification complete!"
echo "Expected: Should see all 18 Iraqi governorates if population succeeded"
