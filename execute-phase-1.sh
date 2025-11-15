#!/bin/bash

# Execute Phase 1: Configure whizzAI Bedrock Agent
# This script automates the first phase of AI integration

set -e  # Exit on error

echo "🚀 Starting Phase 1: AWS Bedrock Agent Configuration"
echo "====================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "configure-bedrock-agent.sh" ]; then
    echo "❌ Error: configure-bedrock-agent.sh not found"
    echo "Please run this script from the whizzCentralPlatform root directory"
    exit 1
fi

# Make the configuration script executable
echo "📋 Step 1: Making configuration script executable..."
chmod +x configure-bedrock-agent.sh

# Run the configuration script
echo ""
echo "🤖 Step 2: Configuring whizzAI Bedrock Agent..."
echo "This will:"
echo "  - Update agent with instructions"
echo "  - Prepare the agent for use"
echo "  - Create production alias"
echo ""
./configure-bedrock-agent.sh

echo ""
echo "✅ Phase 1 Complete!"
echo ""
echo "📝 NEXT STEPS:"
echo ""
echo "1. Copy the Alias ID from above"
echo "2. Run: export BEDROCK_AGENT_ALIAS_ID=<your-alias-id>"
echo "3. Save to file: echo \"BEDROCK_AGENT_ALIAS_ID=<your-alias-id>\" >> .env.bedrock"
echo "4. Continue to Phase 2: Backend Deployment"
echo "   - Run: cd backend && npm install @aws-sdk/client-bedrock-agent-runtime"
echo "   - Run: serverless deploy --config serverless.ai-agent.yml"
echo ""
echo "📖 See AI_INTEGRATION_EXECUTION_PLAN.md for detailed instructions"
echo ""
