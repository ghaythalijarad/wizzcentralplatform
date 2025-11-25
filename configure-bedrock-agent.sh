#!/bin/bash

# Configure whizzAI Bedrock Agent
# Agent ID: TNJAPTVUDC
# Region: us-east-1

AGENT_ID="TNJAPTVUDC"
REGION="us-east-1"

echo "🤖 Configuring whizzAI Bedrock Agent..."

# Step 1: Update agent with instructions
aws bedrock-agent update-agent \
  --agent-id $AGENT_ID \
  --agent-name "whizzAI" \
  --region $REGION \
  --foundation-model "anthropic.claude-3-5-sonnet-20241022-v2:0" \
  --instruction "You are whizzAI, an intelligent support assistant for Whizz - a food delivery platform in Iraq. Your role is to help support agents respond to customer and merchant inquiries with context-aware, professional, and culturally appropriate responses.

CONTEXT:
- Whizz connects customers with local restaurants and merchants in Iraq
- Support agents handle inquiries from both customers (food orders) and merchants (restaurant partners)
- Common topics: order status, delivery issues, payment problems, merchant onboarding, technical issues

RESPONSE GUIDELINES:
1. Be professional, empathetic, and solution-oriented
2. Keep responses concise (2-3 sentences max)
3. Provide specific action steps when possible
4. Use appropriate tone based on issue severity
5. Reference Whizz policies and procedures accurately
6. Be culturally sensitive to Iraqi context

TONE OPTIONS:
- Professional: For general inquiries and standard issues
- Empathetic: For complaints, delays, or frustrations
- Friendly: For positive interactions and thank-yous

Always prioritize customer satisfaction while maintaining company policies." \
  --agent-resource-role-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/service-role/AmazonBedrockExecutionRoleForAgents_28PY9TVBRYE"

echo "✅ Agent configuration updated"

# Step 2: Prepare the agent
echo "🔄 Preparing agent..."
aws bedrock-agent prepare-agent \
  --agent-id $AGENT_ID \
  --region $REGION

echo "⏳ Waiting for agent to be prepared..."
sleep 10

# Step 3: Create production alias
echo "🏷️ Creating production alias..."
ALIAS_ID=$(aws bedrock-agent create-agent-alias \
  --agent-id $AGENT_ID \
  --agent-alias-name "production" \
  --region $REGION \
  --query 'agentAlias.agentAliasId' \
  --output text)

echo ""
echo "✅ whizzAI Agent Configuration Complete!"
echo "=================================="
echo "Agent ID: $AGENT_ID"
echo "Alias ID: $ALIAS_ID"
echo "Region: $REGION"
echo "Model: Claude 3.5 Sonnet v2"
echo ""
echo "⚠️  IMPORTANT: Copy the Alias ID above and update it in the backend code!"
echo ""
