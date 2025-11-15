#!/bin/bash

# Execute Phase 2: Deploy Backend AI Services
# Prerequisites: Phase 1 must be complete and BEDROCK_AGENT_ALIAS_ID must be set

set -e  # Exit on error

echo "🚀 Starting Phase 2: Backend Deployment"
echo "======================================="
echo ""

# Check if BEDROCK_AGENT_ALIAS_ID is set
if [ -z "$BEDROCK_AGENT_ALIAS_ID" ]; then
    echo "❌ Error: BEDROCK_AGENT_ALIAS_ID environment variable not set"
    echo ""
    echo "Please run:"
    echo "  export BEDROCK_AGENT_ALIAS_ID=<your-alias-id-from-phase-1>"
    echo ""
    echo "If you don't have the Alias ID, run Phase 1 first:"
    echo "  ./execute-phase-1.sh"
    exit 1
fi

echo "✅ Alias ID found: $BEDROCK_AGENT_ALIAS_ID"
echo ""

# Navigate to backend directory
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found"
    exit 1
fi

cd backend

# Step 1: Install AWS Bedrock SDK
echo "📦 Step 1: Installing AWS Bedrock Agent Runtime SDK..."
npm install @aws-sdk/client-bedrock-agent-runtime --save

if [ $? -eq 0 ]; then
    echo "✅ SDK installed successfully"
else
    echo "❌ Failed to install SDK"
    exit 1
fi

echo ""

# Step 2: Verify serverless configuration exists
echo "🔍 Step 2: Verifying serverless configuration..."
if [ ! -f "serverless.ai-agent.yml" ]; then
    echo "❌ Error: serverless.ai-agent.yml not found"
    exit 1
fi
echo "✅ Configuration file found"

echo ""

# Step 3: Deploy to AWS
echo "☁️  Step 3: Deploying AI Agent services to AWS..."
echo "This will create:"
echo "  - Lambda function for AI suggestions"
echo "  - Lambda function for health checks"
echo "  - API Gateway endpoints"
echo "  - IAM roles and permissions"
echo ""

serverless deploy --config serverless.ai-agent.yml

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Phase 2 Complete!"
    echo ""
    echo "📝 IMPORTANT: Copy the API endpoint URL from above"
    echo ""
    echo "NEXT STEPS:"
    echo ""
    echo "1. Test health endpoint:"
    echo "   curl https://YOUR-API-ENDPOINT/dev/agent-suggestion/health"
    echo ""
    echo "2. Save the API endpoint:"
    echo "   echo \"AI_AGENT_API_URL=https://YOUR-API-ENDPOINT/dev/agent-suggestion\" >> ../.env.bedrock"
    echo ""
    echo "3. Continue to Phase 3: Frontend Integration"
    echo "   - Create frontend/assets/js/whizz-ai-assistant.js"
    echo "   - Create frontend/assets/css/ai-assistant.css"
    echo "   - Update support.html with integration points"
    echo ""
    echo "📖 See AI_INTEGRATION_EXECUTION_PLAN.md for detailed instructions"
else
    echo "❌ Deployment failed"
    exit 1
fi
