#!/bin/bash

# Quick script to delete and redeploy WhizzMe stack

STACK_NAME="whizzme-agent-dev"
PROFILE="wizz-drivers-ghayth-dev"
REGION="us-east-1"

echo "🗑️  Deleting stack: $STACK_NAME"
aws cloudformation delete-stack \
  --stack-name "$STACK_NAME" \
  --profile "$PROFILE" \
  --region "$REGION"

echo "⏳ Waiting for stack deletion to complete (this may take 2-3 minutes)..."
aws cloudformation wait stack-delete-complete \
  --stack-name "$STACK_NAME" \
  --profile "$PROFILE" \
  --region "$REGION"

echo "✅ Stack deleted successfully!"
echo ""
echo "🚀 Starting fresh deployment..."
./deploy-whizzme-agent.sh dev us-east-1 wizz-drivers-ghayth-dev
