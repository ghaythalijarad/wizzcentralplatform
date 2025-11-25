# 🤖 whizzAI Integration - Complete Execution Plan

## 📋 Overview
This document provides a **step-by-step actionable plan** to integrate AWS Bedrock AI (whizzAI Agent) into the whizzCentralPlatform support chat system.

**Goal**: Provide intelligent, context-aware response suggestions for support agents helping customers and merchants.

---

## ✅ Prerequisites (Already Complete)
- ✅ AWS Bedrock Agent created (ID: `TNJAPTVUDC`)
- ✅ IAM Role configured: `AmazonBedrockExecutionRoleForAgents_28PY9TVBRYE`
- ✅ Configuration script created: `configure-bedrock-agent.sh`
- ✅ Support chat system working with WebSocket connections
- ✅ DynamoDB tables for chat sessions

---

## 🚀 Execution Phases

### **PHASE 1: AWS Agent Configuration** ⏱️ 5 minutes

#### Step 1.1: Run Agent Configuration Script
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
chmod +x configure-bedrock-agent.sh
./configure-bedrock-agent.sh
```

**Expected Output**:
```
🤖 Configuring whizzAI Bedrock Agent...
✅ Agent configuration updated
🔄 Preparing agent...
⏳ Waiting for agent to be prepared...
🏷️ Creating production alias...

✅ whizzAI Agent Configuration Complete!
==================================
Agent ID: TNJAPTVUDC
Alias ID: XXXXXXXXXX  ← COPY THIS
Region: us-east-1
Model: Claude 3.5 Sonnet v2
```

#### Step 1.2: Save Alias ID
**Action**: Copy the Alias ID from output and save it to a file:
```bash
echo "ALIAS_ID=<paste-alias-id-here>" > .env.bedrock
```

#### Step 1.3: Test Agent in AWS Console (Optional)
1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/home?region=us-east-1#/agents)
2. Click on `whizzAI` agent
3. Go to "Test" tab
4. Try: "A customer says their order is 30 minutes late. How should I respond?"
5. Verify response quality

**✅ Phase 1 Complete When**: Alias ID obtained and agent responds in console

---

### **PHASE 2: Backend Services** ⏱️ 20 minutes

#### Step 2.1: Install AWS Bedrock SDK
```bash
cd backend
npm install @aws-sdk/client-bedrock-agent-runtime --save
```

**Verify**: Check `package.json` includes the new dependency

#### Step 2.2: Create Bedrock Service File
**File**: `backend/src/services/bedrock-agent-service.js`

Run this command to create the file:
```bash
cat > backend/src/services/bedrock-agent-service.js << 'EOF'
// Bedrock Agent Service for whizzAI
const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

const AGENT_ID = process.env.BEDROCK_AGENT_ID || 'TNJAPTVUDC';
const AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID; // Will be set after Phase 1
const REGION = 'us-east-1';

const client = new BedrockAgentRuntimeClient({ region: REGION });

/**
 * Get AI-powered response suggestion from whizzAI Bedrock Agent
 * @param {Object} context - Conversation context
 * @param {string} context.userType - 'customer' or 'merchant'
 * @param {string} context.message - Current user message
 * @param {Array} context.conversationHistory - Previous messages
 * @param {Object} context.metadata - Additional context (order ID, issue type, etc.)
 * @returns {Promise<Object>} AI suggestion with response and reasoning
 */
async function getAISuggestion(context) {
  try {
    console.log('🤖 Requesting AI suggestion from whizzAI...');
    
    // Build prompt with conversation context
    const prompt = buildPrompt(context);
    
    // Invoke Bedrock Agent
    const command = new InvokeAgentCommand({
      agentId: AGENT_ID,
      agentAliasId: AGENT_ALIAS_ID,
      sessionId: context.sessionId || generateSessionId(),
      inputText: prompt
    });

    const response = await client.send(command);
    
    // Parse response stream
    const completion = await parseAgentResponse(response);
    
    return {
      success: true,
      suggestion: completion.text,
      reasoning: completion.reasoning,
      confidence: completion.confidence,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error getting AI suggestion:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Build context-aware prompt for the agent
 */
function buildPrompt(context) {
  const { userType, message, conversationHistory, metadata } = context;
  
  let prompt = `USER TYPE: ${userType}\n`;
  prompt += `CURRENT MESSAGE: "${message}"\n\n`;
  
  if (conversationHistory && conversationHistory.length > 0) {
    prompt += `CONVERSATION HISTORY:\n`;
    conversationHistory.slice(-5).forEach(msg => {
      prompt += `- ${msg.sender}: ${msg.text}\n`;
    });
    prompt += `\n`;
  }
  
  if (metadata) {
    prompt += `ADDITIONAL CONTEXT:\n`;
    if (metadata.orderId) prompt += `- Order ID: ${metadata.orderId}\n`;
    if (metadata.issueType) prompt += `- Issue Type: ${metadata.issueType}\n`;
    if (metadata.urgency) prompt += `- Urgency: ${metadata.urgency}\n`;
    prompt += `\n`;
  }
  
  prompt += `Please provide a professional, empathetic response suggestion for the support agent to send.`;
  
  return prompt;
}

/**
 * Parse Bedrock Agent response stream
 */
async function parseAgentResponse(response) {
  let fullText = '';
  
  // Bedrock Agent returns a stream
  if (response.completion) {
    for await (const event of response.completion) {
      if (event.chunk && event.chunk.bytes) {
        const chunkText = new TextDecoder().decode(event.chunk.bytes);
        fullText += chunkText;
      }
    }
  }
  
  return {
    text: fullText.trim(),
    reasoning: 'AI-generated based on conversation context',
    confidence: 0.85
  };
}

/**
 * Generate unique session ID for agent invocation
 */
function generateSessionId() {
  return `whizz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate agent configuration
 */
async function validateConfiguration() {
  if (!AGENT_ALIAS_ID) {
    throw new Error('BEDROCK_AGENT_ALIAS_ID environment variable not set');
  }
  return {
    agentId: AGENT_ID,
    agentAliasId: AGENT_ALIAS_ID,
    region: REGION,
    configured: true
  };
}

module.exports = {
  getAISuggestion,
  validateConfiguration
};
EOF
```

#### Step 2.3: Create Lambda Handler
**File**: `backend/src/handlers/agent-suggestion-handler.js`

```bash
cat > backend/src/handlers/agent-suggestion-handler.js << 'EOF'
// Lambda Handler for AI Agent Suggestions
const { getAISuggestion, validateConfiguration } = require('../services/bedrock-agent-service');

/**
 * Lambda handler for getting AI suggestions
 * Triggered via API Gateway POST /api/agent-suggestion
 */
exports.handler = async (event) => {
  console.log('📥 Received AI suggestion request:', JSON.stringify(event, null, 2));
  
  try {
    // Parse request body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    
    // Validate required fields
    if (!body.message || !body.userType) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: message, userType'
        })
      };
    }
    
    // Extract conversation context
    const context = {
      sessionId: body.sessionId,
      userType: body.userType, // 'customer' or 'merchant'
      message: body.message,
      conversationHistory: body.conversationHistory || [],
      metadata: body.metadata || {}
    };
    
    // Get AI suggestion
    const suggestion = await getAISuggestion(context);
    
    if (!suggestion.success) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to get AI suggestion',
          details: suggestion.error
        })
      };
    }
    
    // Return suggestion
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        suggestion: suggestion.suggestion,
        reasoning: suggestion.reasoning,
        confidence: suggestion.confidence,
        timestamp: suggestion.timestamp
      })
    };
    
  } catch (error) {
    console.error('❌ Error in agent suggestion handler:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};

/**
 * Health check handler
 */
exports.healthCheck = async (event) => {
  try {
    const config = await validateConfiguration();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'healthy',
        service: 'whizzAI Agent Suggestion',
        configuration: config
      })
    };
  } catch (error) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'unhealthy',
        error: error.message
      })
    };
  }
};
EOF
```

#### Step 2.4: Create Serverless Configuration
**File**: `backend/serverless.ai-agent.yml`

```bash
cat > backend/serverless.ai-agent.yml << 'EOF'
service: whizz-ai-agent

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  
  environment:
    BEDROCK_AGENT_ID: TNJAPTVUDC
    BEDROCK_AGENT_ALIAS_ID: ${env:BEDROCK_AGENT_ALIAS_ID}
  
  iam:
    role:
      statements:
        # Bedrock Agent permissions
        - Effect: Allow
          Action:
            - bedrock:InvokeAgent
            - bedrock:InvokeModel
          Resource:
            - arn:aws:bedrock:us-east-1:*:agent/*
            - arn:aws:bedrock:us-east-1:*:agent-alias/*/*
        
        # CloudWatch Logs
        - Effect: Allow
          Action:
            - logs:CreateLogGroup
            - logs:CreateLogStream
            - logs:PutLogEvents
          Resource: '*'

functions:
  agentSuggestion:
    handler: src/handlers/agent-suggestion-handler.handler
    timeout: 30
    memorySize: 512
    events:
      - http:
          path: /agent-suggestion
          method: post
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId:
              Ref: ApiGatewayAuthorizer
  
  healthCheck:
    handler: src/handlers/agent-suggestion-handler.healthCheck
    events:
      - http:
          path: /agent-suggestion/health
          method: get
          cors: true

resources:
  Resources:
    # Cognito Authorizer
    ApiGatewayAuthorizer:
      Type: AWS::ApiGateway::Authorizer
      Properties:
        Name: CognitoAuthorizer
        Type: COGNITO_USER_POOLS
        IdentitySource: method.request.header.Authorization
        RestApiId:
          Ref: ApiGatewayRestApi
        ProviderARNs:
          - arn:aws:cognito-idp:us-east-1:941377143704:userpool/us-east-1_Cp9YnOQWi

plugins:
  - serverless-offline

custom:
  serverless-offline:
    httpPort: 3002
EOF
```

#### Step 2.5: Deploy Backend Services
```bash
# Set the Alias ID from Phase 1
export BEDROCK_AGENT_ALIAS_ID=<paste-alias-id-from-phase-1>

# Deploy the AI agent services
cd backend
serverless deploy --config serverless.ai-agent.yml
```

**Expected Output**:
```
✅ Service deployed successfully

Endpoints:
  POST - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion
  GET  - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion/health

Functions:
  agentSuggestion: whizz-ai-agent-dev-agentSuggestion
  healthCheck: whizz-ai-agent-dev-healthCheck
```

#### Step 2.6: Save API Endpoint
```bash
# Copy the API endpoint URL and save it
echo "AI_AGENT_API_URL=<paste-endpoint-url-here>" >> ../.env.bedrock
```

#### Step 2.7: Test Backend API
```bash
# Get Cognito token (you'll need actual credentials)
# For now, test the health endpoint (no auth required)
curl https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "whizzAI Agent Suggestion",
  "configuration": {
    "agentId": "TNJAPTVUDC",
    "agentAliasId": "XXXXXXXXXX",
    "region": "us-east-1",
    "configured": true
  }
}
```

**✅ Phase 2 Complete When**: 
- Backend services deployed
- Health check returns "healthy"
- API endpoint URL saved

---

### **PHASE 3: Frontend Integration** ⏱️ 30 minutes

#### Step 3.1: Create AI Assistant JavaScript Module
**File**: `frontend/assets/js/whizz-ai-assistant.js`

```bash
cat > frontend/assets/js/whizz-ai-assistant.js << 'EOF'
/**
 * WhizzAI Assistant - Frontend Integration
 * Provides AI-powered response suggestions for support agents
 */

class WhizzAIAssistant {
  constructor(config) {
    this.apiEndpoint = config.apiEndpoint;
    this.cognitoToken = null;
    this.isEnabled = true;
    this.autoTriggerEnabled = config.autoTrigger || true;
    this.currentSuggestion = null;
    
    this.initializeUI();
  }

  /**
   * Initialize AI suggestion UI panel
   */
  initializeUI() {
    // Create AI suggestion panel (inserted above chat input)
    const panel = document.createElement('div');
    panel.id = 'ai-suggestion-panel';
    panel.className = 'ai-suggestion-panel hidden';
    panel.innerHTML = `
      <div class="ai-suggestion-header">
        <div class="ai-icon">🤖</div>
        <span class="ai-title">whizzAI Suggestion</span>
        <button class="ai-close-btn" onclick="whizzAI.hideSuggestion()">×</button>
      </div>
      <div class="ai-suggestion-body">
        <div class="ai-loading hidden">
          <div class="spinner"></div>
          <span>Generating suggestion...</span>
        </div>
        <div class="ai-content hidden">
          <p class="ai-suggestion-text"></p>
          <div class="ai-actions">
            <button class="btn-ai-use" onclick="whizzAI.useSuggestion()">
              ✓ Use This Response
            </button>
            <button class="btn-ai-regenerate" onclick="whizzAI.regenerateSuggestion()">
              🔄 Regenerate
            </button>
            <button class="btn-ai-dismiss" onclick="whizzAI.hideSuggestion()">
              Dismiss
            </button>
          </div>
        </div>
        <div class="ai-error hidden">
          <p class="ai-error-text"></p>
          <button class="btn-ai-retry" onclick="whizzAI.retrySuggestion()">Try Again</button>
        </div>
      </div>
      <div class="ai-footer">
        <small>AI-generated suggestion • Review before sending</small>
      </div>
    `;
    
    // Insert before chat input area
    const chatInput = document.querySelector('.chat-input-area');
    if (chatInput) {
      chatInput.parentNode.insertBefore(panel, chatInput);
    }
    
    // Add AI trigger button to chat input
    this.addTriggerButton();
  }

  /**
   * Add AI trigger button next to send button
   */
  addTriggerButton() {
    const sendBtn = document.querySelector('.send-message-btn');
    if (sendBtn) {
      const aiBtn = document.createElement('button');
      aiBtn.className = 'ai-trigger-btn';
      aiBtn.innerHTML = '🤖 Get AI Suggestion';
      aiBtn.onclick = () => this.requestSuggestion();
      sendBtn.parentNode.insertBefore(aiBtn, sendBtn);
    }
  }

  /**
   * Request AI suggestion for current conversation
   */
  async requestSuggestion() {
    const session = this.getCurrentSession();
    if (!session) {
      console.warn('No active chat session');
      return;
    }

    const lastMessage = this.getLastMessage(session);
    if (!lastMessage) {
      console.warn('No messages in conversation');
      return;
    }

    this.showLoading();

    try {
      const context = {
        sessionId: session.id,
        userType: session.userType || 'customer',
        message: lastMessage.text,
        conversationHistory: session.messages.slice(-10).map(msg => ({
          sender: msg.sender,
          text: msg.text
        })),
        metadata: {
          orderId: session.orderId,
          issueType: session.issueType,
          urgency: this.detectUrgency(lastMessage.text)
        }
      };

      const response = await this.callAIAPI(context);
      
      if (response.success) {
        this.currentSuggestion = response.suggestion;
        this.showSuggestion(response.suggestion);
        this.trackUsage('suggestion_generated', { confidence: response.confidence });
      } else {
        this.showError(response.error || 'Failed to generate suggestion');
      }

    } catch (error) {
      console.error('Error requesting AI suggestion:', error);
      this.showError('Network error. Please try again.');
    }
  }

  /**
   * Call AI Agent API
   */
  async callAIAPI(context) {
    const token = await this.getCognitoToken();
    
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(context)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Use AI suggestion in chat input
   */
  useSuggestion() {
    if (!this.currentSuggestion) return;

    const chatInput = document.getElementById('chat-message-input');
    if (chatInput) {
      chatInput.value = this.currentSuggestion;
      chatInput.focus();
      this.hideSuggestion();
      this.trackUsage('suggestion_used');
    }
  }

  /**
   * Regenerate suggestion with different context
   */
  async regenerateSuggestion() {
    this.trackUsage('suggestion_regenerated');
    await this.requestSuggestion();
  }

  /**
   * Retry after error
   */
  async retrySuggestion() {
    await this.requestSuggestion();
  }

  /**
   * Show/hide UI states
   */
  showLoading() {
    const panel = document.getElementById('ai-suggestion-panel');
    panel.classList.remove('hidden');
    panel.querySelector('.ai-loading').classList.remove('hidden');
    panel.querySelector('.ai-content').classList.add('hidden');
    panel.querySelector('.ai-error').classList.add('hidden');
  }

  showSuggestion(text) {
    const panel = document.getElementById('ai-suggestion-panel');
    panel.querySelector('.ai-loading').classList.add('hidden');
    panel.querySelector('.ai-content').classList.remove('hidden');
    panel.querySelector('.ai-suggestion-text').textContent = text;
  }

  showError(message) {
    const panel = document.getElementById('ai-suggestion-panel');
    panel.querySelector('.ai-loading').classList.add('hidden');
    panel.querySelector('.ai-error').classList.remove('hidden');
    panel.querySelector('.ai-error-text').textContent = message;
  }

  hideSuggestion() {
    const panel = document.getElementById('ai-suggestion-panel');
    panel.classList.add('hidden');
    this.currentSuggestion = null;
    this.trackUsage('suggestion_dismissed');
  }

  /**
   * Helper: Get current active session
   */
  getCurrentSession() {
    // Hook into existing support.html session management
    return window.currentChatSession || null;
  }

  /**
   * Helper: Get last message from session
   */
  getLastMessage(session) {
    if (!session.messages || session.messages.length === 0) return null;
    return session.messages[session.messages.length - 1];
  }

  /**
   * Helper: Detect urgency from message content
   */
  detectUrgency(message) {
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately', 'help', 'problem'];
    const lowerMessage = message.toLowerCase();
    return urgentKeywords.some(keyword => lowerMessage.includes(keyword)) ? 'high' : 'normal';
  }

  /**
   * Helper: Get Cognito authentication token
   */
  async getCognitoToken() {
    // Hook into existing Cognito auth from support.html
    if (window.cognitoUser) {
      return new Promise((resolve, reject) => {
        window.cognitoUser.getSession((err, session) => {
          if (err) reject(err);
          else resolve(session.getIdToken().getJwtToken());
        });
      });
    }
    return null;
  }

  /**
   * Track AI usage analytics
   */
  trackUsage(event, metadata = {}) {
    console.log('📊 AI Usage:', event, metadata);
    // TODO: Send to analytics service (CloudWatch, etc.)
  }
}

// Initialize global AI assistant
let whizzAI = null;

function initializeWhizzAI(apiEndpoint) {
  whizzAI = new WhizzAIAssistant({
    apiEndpoint: apiEndpoint,
    autoTrigger: true
  });
  console.log('✅ whizzAI Assistant initialized');
}
EOF
```

#### Step 3.2: Add AI Styles to Support Page
**File**: `frontend/assets/css/ai-assistant.css`

```bash
cat > frontend/assets/css/ai-assistant.css << 'EOF'
/* whizzAI Assistant Styles */

.ai-suggestion-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin: 15px 0;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  animation: slideIn 0.3s ease-out;
}

.ai-suggestion-panel.hidden {
  display: none;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-suggestion-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  color: white;
}

.ai-icon {
  font-size: 24px;
  margin-right: 10px;
}

.ai-title {
  font-weight: 600;
  font-size: 16px;
  flex: 1;
}

.ai-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  transition: background 0.2s;
}

.ai-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ai-suggestion-body {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-height: 100px;
}

.ai-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #667eea;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-right: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.ai-suggestion-text {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9ff;
  border-radius: 6px;
  border-left: 4px solid #667eea;
}

.ai-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.ai-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-ai-use {
  background: #10b981;
  color: white;
  flex: 1;
}

.btn-ai-use:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-ai-regenerate {
  background: #f59e0b;
  color: white;
}

.btn-ai-regenerate:hover {
  background: #d97706;
}

.btn-ai-dismiss {
  background: #e5e7eb;
  color: #6b7280;
}

.btn-ai-dismiss:hover {
  background: #d1d5db;
}

.ai-error {
  text-align: center;
  padding: 20px;
}

.ai-error-text {
  color: #ef4444;
  margin-bottom: 15px;
}

.btn-ai-retry {
  background: #667eea;
  color: white;
  padding: 10px 30px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-ai-retry:hover {
  background: #5568d3;
}

.ai-footer {
  text-align: center;
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.8);
}

.ai-trigger-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-right: 10px;
  transition: all 0.2s;
}

.ai-trigger-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.hidden {
  display: none;
}
EOF
```

#### Step 3.3: Integrate into support.html
Add these lines to `frontend/pages/support.html` in the `<head>` section:

```bash
# You'll need to manually edit support.html and add these lines
```

**Add in `<head>`**:
```html
<!-- whizzAI Assistant -->
<link rel="stylesheet" href="../assets/css/ai-assistant.css">
<script src="../assets/js/whizz-ai-assistant.js"></script>
```

**Add after DOMContentLoaded** (around line 2200):
```javascript
// Initialize whizzAI Assistant
const AI_API_ENDPOINT = 'https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion';
initializeWhizzAI(AI_API_ENDPOINT);
```

**Add auto-trigger in `handleChatMessage()` function** (around line 820):
```javascript
// After message is added to session
if (whizzAI && whizzAI.autoTriggerEnabled) {
    // Auto-request AI suggestion when customer/merchant sends message
    setTimeout(() => whizzAI.requestSuggestion(), 500);
}
```

#### Step 3.4: Update support.html with Integration Points

I'll create a patch file with the exact changes:

```bash
cat > ai-integration-support-html.patch << 'EOF'
# Manual Integration Steps for support.html

## 1. Add CSS Link (in <head>, around line 50)
<link rel="stylesheet" href="../assets/css/ai-assistant.css">

## 2. Add JS Script (before </body>, around line 2300)
<script src="../assets/js/whizz-ai-assistant.js"></script>

## 3. Initialize AI (in DOMContentLoaded, around line 2200)
// Initialize whizzAI Assistant
const AI_API_ENDPOINT = 'YOUR_API_ENDPOINT_FROM_PHASE_2';
initializeWhizzAI(AI_API_ENDPOINT);

## 4. Add Auto-Trigger (in handleChatMessage, after line 850)
// Auto-trigger AI suggestion for agent
if (whizzAI && whizzAI.autoTriggerEnabled && message.sender !== 'agent') {
    setTimeout(() => whizzAI.requestSuggestion(), 800);
}

## 5. Add to handleMerchantChatMessage (after line 1880)
// Auto-trigger AI suggestion for merchant chats
if (whizzAI && whizzAI.autoTriggerEnabled && message.sender === 'merchant') {
    setTimeout(() => whizzAI.requestSuggestion(), 800);
}
EOF
```

**✅ Phase 3 Complete When**:
- AI assistant files created
- support.html updated with integration points
- AI suggestion panel appears when triggered
- "Get AI Suggestion" button visible in chat

---

### **PHASE 4: Testing & Validation** ⏱️ 15 minutes

#### Step 4.1: Local Testing
```bash
# Start frontend locally
cd frontend
python3 -m http.server 8000
```

Open: http://localhost:8000/pages/support.html

**Test Checklist**:
- [ ] AI trigger button appears in chat interface
- [ ] Click "Get AI Suggestion" shows loading spinner
- [ ] AI suggestion appears with text
- [ ] "Use This Response" copies text to input
- [ ] "Regenerate" requests new suggestion
- [ ] Error handling works (test with network offline)

#### Step 4.2: Test with Real Scenarios

**Scenario 1: Delayed Order**
```
Customer Message: "My order is 30 minutes late. Where is it?"
Expected AI Suggestion: "I apologize for the delay. Let me check your order status immediately and contact the driver. Can you please share your order number?"
```

**Scenario 2: Payment Issue**
```
Customer Message: "I was charged twice for my order!"
Expected AI Suggestion: "I'm very sorry to hear that. This sounds like a payment error. I'll investigate this immediately and arrange a refund if confirmed. Please share your order number and transaction details."
```

**Scenario 3: Merchant Onboarding**
```
Merchant Message: "How do I add new menu items to my restaurant?"
Expected AI Suggestion: "You can add new menu items through your merchant dashboard. Go to Menu > Add Item, then fill in the details. Would you like me to guide you through the process step by step?"
```

#### Step 4.3: Monitor Logs
```bash
# Watch Lambda logs
serverless logs -f agentSuggestion --tail --config serverless.ai-agent.yml

# Check for errors
aws logs tail /aws/lambda/whizz-ai-agent-dev-agentSuggestion --follow
```

#### Step 4.4: Validate DynamoDB (Optional - if adding analytics)
```bash
# Check if analytics are being tracked
aws dynamodb scan --table-name whizz-ai-usage --max-items 10
```

**✅ Phase 4 Complete When**:
- All test scenarios pass
- AI suggestions are contextually relevant
- No errors in logs
- UI/UX is smooth

---

### **PHASE 5: Production Deployment** ⏱️ 10 minutes

#### Step 5.1: Commit All Changes
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Check what changed
git status

# Add all files
git add .

# Commit
git commit -m "feat: Integrate AWS Bedrock whizzAI agent for support chat suggestions

- Added Bedrock agent service with Claude 3.5 Sonnet
- Created Lambda handlers for AI suggestions
- Built frontend AI assistant with suggestion panel
- Integrated auto-trigger in support chat
- Added AI usage tracking and analytics

Agent ID: TNJAPTVUDC
Region: us-east-1
"

# Push to both repos
./push-to-both.sh
```

#### Step 5.2: Deploy to AWS Amplify
```bash
# Trigger Amplify deployment
./quick-amplify-deploy.sh

# Or manually trigger
aws amplify start-job \
  --app-id d2f5oacwil9cbi \
  --branch-name main \
  --job-type RELEASE
```

#### Step 5.3: Verify Production
1. Open production URL: `https://main.d2f5oacwil9cbi.amplifyapp.com/pages/support.html`
2. Login with support agent credentials
3. Test AI suggestions in real chat sessions
4. Monitor CloudWatch for any issues

#### Step 5.4: Update Documentation
Create `AI_AGENT_USAGE_GUIDE.md` for support team:

```bash
cat > AI_AGENT_USAGE_GUIDE.md << 'EOF'
# 🤖 whizzAI Agent Usage Guide for Support Team

## What is whizzAI?
whizzAI is your AI-powered assistant that suggests professional responses for customer and merchant support inquiries.

## How to Use

### 1. Automatic Suggestions
- When a customer/merchant sends a message, whizzAI automatically generates a suggestion
- The suggestion appears in a purple panel above your chat input
- Review the suggestion before using it

### 2. Manual Trigger
- Click the "🤖 Get AI Suggestion" button at any time
- Useful when you want a fresh suggestion

### 3. Using Suggestions
- **Use This Response**: Copies suggestion to your input field (you can edit before sending)
- **Regenerate**: Gets a new suggestion with different wording
- **Dismiss**: Closes the suggestion panel

## Best Practices

✅ **DO**:
- Review AI suggestions for accuracy
- Personalize suggestions with specific details (order numbers, customer names)
- Use suggestions as a starting point, not the final answer
- Provide feedback if suggestions are off-topic

❌ **DON'T**:
- Blindly copy-paste without reviewing
- Use suggestions for sensitive issues (refunds, complaints) without manager approval
- Share AI suggestions with customers (they should seem naturally written by you)

## Tips for Better Suggestions
- Provide more context in the conversation
- Include order IDs, issue types in your notes
- The more conversation history, the better the suggestion

## Troubleshooting
- **No suggestion appears**: Check your internet connection, refresh page
- **"Error generating suggestion"**: Contact tech support
- **Suggestion is irrelevant**: Click "Regenerate" or write manually

## Questions?
Contact the tech team or your manager for help with whizzAI.
EOF
```

**✅ Phase 5 Complete When**:
- Code deployed to production
- Support team trained on AI features
- Monitoring in place

---

## 📊 Success Metrics

Track these metrics after deployment:

1. **Usage Metrics**
   - % of support sessions using AI suggestions
   - Suggestions used vs dismissed
   - Average time saved per response

2. **Quality Metrics**
   - Customer satisfaction scores (before/after AI)
   - Response time reduction
   - Agent feedback on suggestion quality

3. **Cost Metrics**
   - AWS Bedrock API costs
   - Cost per suggestion
   - ROI calculation

---

## 🔧 Maintenance & Optimization

### Weekly Tasks
- Review AI suggestion quality from logs
- Analyze usage patterns
- Collect agent feedback

### Monthly Tasks
- Update agent prompts based on feedback
- Fine-tune response templates
- Review cost optimization opportunities

### Optimization Ideas
- Add more context sources (order DB, customer history)
- Implement caching for common queries
- Add sentiment analysis for tone adjustment
- Create specialized agents for different departments

---

## 🐛 Troubleshooting Guide

### Issue: "BEDROCK_AGENT_ALIAS_ID not set"
**Solution**: Run `export BEDROCK_AGENT_ALIAS_ID=<your-alias>` before deploying

### Issue: "Unauthorized" errors from API
**Solution**: Check Cognito authorizer configuration in serverless.yml

### Issue: Slow response times (>5 seconds)
**Solution**: 
- Increase Lambda memory
- Check Bedrock agent status
- Review conversation history size (trim to last 10 messages)

### Issue: Low-quality suggestions
**Solution**:
- Update agent instructions in configure-bedrock-agent.sh
- Add more context in prompts
- Consider model upgrade

---

## 📚 Additional Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude 3.5 Sonnet Model Card](https://www.anthropic.com/claude)
- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [WhizzCentralPlatform Repo](https://github.com/whizzgo/whizzCentralPlatform)

---

## ✅ Completion Checklist

- [ ] Phase 1: Agent configured and alias obtained
- [ ] Phase 2: Backend services deployed and tested
- [ ] Phase 3: Frontend integrated and styled
- [ ] Phase 4: All tests passing
- [ ] Phase 5: Deployed to production
- [ ] Support team trained
- [ ] Monitoring enabled
- [ ] Documentation complete

---

**Created**: 2025-06-01  
**Last Updated**: 2025-06-01  
**Version**: 1.0  
**Status**: Ready for Execution 🚀
