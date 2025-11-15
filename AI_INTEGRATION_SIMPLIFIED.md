# 🤖 AI Integration - Simplified Approach

## What We're Actually Doing

**INTEGRATING AI INTO EXISTING SUPPORT CHAT** - Not creating a new interface!

### Current Flow:
```
┌─────────────────────────────────────┐
│   Support Agent Dashboard           │
├─────────────────────────────────────┤
│ Sessions List │  Chat Messages      │
│ (left panel)  │  [Customer msg]     │
│               │  [Agent reply]      │
│               │  [Customer msg]     │
│               │                     │
│               │  ┌───────────────┐  │
│               │  │ Type message  │  │
│               │  │ [Send button] │  │
│               │  └───────────────┘  │
└─────────────────────────────────────┘
```

### NEW Flow with AI:
```
┌─────────────────────────────────────┐
│   Support Agent Dashboard           │
├─────────────────────────────────────┤
│ Sessions List │  Chat Messages      │
│ (left panel)  │  [Customer msg]     │
│               │  [Agent reply]      │
│               │  [Customer msg] ⬅ NEW!
│               │                     │
│               │  ╔═══════════════╗  │ ⬅ AI PANEL
│               │  ║ 🤖 whizzAI   ║  │   (NEW!)
│               │  ║ Suggestion:   ║  │
│               │  ║ "I apologize  ║  │
│               │  ║  for delay... ║  │
│               │  ║ [Use] [Retry] ║  │
│               │  ╚═══════════════╝  │
│               │  ┌───────────────┐  │
│               │  │ Type message  │  │
│               │  │ [Send button] │  │
│               │  └───────────────┘  │
└─────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Add AI Styles to support.html (Inline)

**Location**: In `<style>` section (around line 420)

**Add this CSS**:
```css
/* ========================================
   whizzAI Suggestion Panel Styles
   ======================================== */

#ai-suggestion-panel {
    margin: 0 1.5rem 0.5rem 1.5rem;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 0.75rem;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.ai-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
}

.ai-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
}

.ai-close {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    transition: background 0.2s;
}

.ai-close:hover {
    background: rgba(255, 255, 255, 0.3);
}

.ai-content {
    background: white;
    border-radius: 0.5rem;
    padding: 0.75rem;
}

.ai-suggestion-text {
    color: #374151;
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 0.375rem;
    border-left: 3px solid #667eea;
}

.ai-actions {
    display: flex;
    gap: 0.5rem;
}

.ai-btn {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.813rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.ai-btn-use {
    background: #10b981;
    color: white;
}

.ai-btn-use:hover {
    background: #059669;
}

.ai-btn-retry {
    background: #f59e0b;
    color: white;
}

.ai-btn-retry:hover {
    background: #d97706;
}

.ai-btn-dismiss {
    background: #e5e7eb;
    color: #6b7280;
}

.ai-btn-dismiss:hover {
    background: #d1d5db;
}

.ai-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    color: white;
}

.ai-spinner {
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    animation: spin 0.8s linear infinite;
    margin-right: 0.5rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.hidden {
    display: none !important;
}
```

---

### Step 2: Add AI Panel HTML to support.html

**Location**: After `chatMessages` div, BEFORE `chatInputArea` (around line 577)

**Add this HTML**:
```html
<!-- whizzAI Suggestion Panel (Hidden by default) -->
<div id="ai-suggestion-panel" class="hidden">
    <div class="ai-header">
        <div class="ai-title">
            <span>🤖</span>
            <span>whizzAI Suggestion</span>
        </div>
        <button class="ai-close" onclick="hideAISuggestion()">×</button>
    </div>
    
    <!-- Loading State -->
    <div id="ai-loading" class="ai-loading hidden">
        <div class="ai-spinner"></div>
        <span>Generating suggestion...</span>
    </div>
    
    <!-- Content State -->
    <div id="ai-content" class="ai-content hidden">
        <div class="ai-suggestion-text" id="ai-suggestion-text"></div>
        <div class="ai-actions">
            <button class="ai-btn ai-btn-use" onclick="useAISuggestion()">
                ✓ Use This
            </button>
            <button class="ai-btn ai-btn-retry" onclick="retryAISuggestion()">
                🔄 Retry
            </button>
            <button class="ai-btn ai-btn-dismiss" onclick="hideAISuggestion()">
                Dismiss
            </button>
        </div>
    </div>
</div>
```

---

### Step 3: Add AI JavaScript Functions

**Location**: In the `<script>` section, after line 850 in `handleChatMessage()` function

**Add Auto-Trigger**:
```javascript
// After processing incoming message
if (message.sender !== 'agent' && currentSessionId === sessionId) {
    // Auto-trigger AI suggestion for customer/merchant messages
    setTimeout(() => {
        requestAISuggestion(session, message);
    }, 800);
}
```

**Add AI Functions** (at the end of script, before closing `</script>`):

```javascript
// ========================================
// whizzAI Integration Functions
// ========================================

const AI_API_ENDPOINT = 'YOUR_API_ENDPOINT_HERE'; // Set after Phase 2
let currentAISuggestion = null;

/**
 * Request AI suggestion from Bedrock Agent
 */
async function requestAISuggestion(session, lastMessage) {
    if (!AI_API_ENDPOINT || AI_API_ENDPOINT === 'YOUR_API_ENDPOINT_HERE') {
        console.warn('🤖 AI API endpoint not configured yet');
        return;
    }

    try {
        // Show panel with loading state
        showAIPanel('loading');
        
        // Build request context
        const context = {
            sessionId: session.id,
            userType: session.userType || 'customer',
            message: lastMessage.text,
            conversationHistory: session.messages.slice(-5).map(msg => ({
                sender: msg.sender,
                text: msg.text
            })),
            metadata: {
                customerName: session.customer,
                timestamp: new Date().toISOString()
            }
        };
        
        // Get Cognito token
        const token = await getCognitoToken();
        if (!token) {
            throw new Error('Authentication required');
        }
        
        // Call AI API
        const response = await fetch(AI_API_ENDPOINT, {
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
        
        const data = await response.json();
        
        if (data.success && data.suggestion) {
            currentAISuggestion = data.suggestion;
            showAIPanel('content', data.suggestion);
            console.log('🤖 AI suggestion generated successfully');
        } else {
            throw new Error(data.error || 'Failed to generate suggestion');
        }
        
    } catch (error) {
        console.error('🤖 AI suggestion error:', error);
        hideAIPanel();
        // Fail silently - don't interrupt agent workflow
    }
}

/**
 * Show AI panel with different states
 */
function showAIPanel(state, suggestionText = '') {
    const panel = document.getElementById('ai-suggestion-panel');
    const loading = document.getElementById('ai-loading');
    const content = document.getElementById('ai-content');
    const textEl = document.getElementById('ai-suggestion-text');
    
    if (!panel) return;
    
    panel.classList.remove('hidden');
    
    if (state === 'loading') {
        loading.classList.remove('hidden');
        content.classList.add('hidden');
    } else if (state === 'content') {
        loading.classList.add('hidden');
        content.classList.remove('hidden');
        if (textEl) textEl.textContent = suggestionText;
    }
}

/**
 * Hide AI panel
 */
function hideAISuggestion() {
    const panel = document.getElementById('ai-suggestion-panel');
    if (panel) {
        panel.classList.add('hidden');
    }
    currentAISuggestion = null;
}

/**
 * Use AI suggestion - copy to input field
 */
function useAISuggestion() {
    if (!currentAISuggestion) return;
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = currentAISuggestion;
        messageInput.focus();
        
        // Auto-resize textarea
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        
        console.log('✅ AI suggestion used by agent');
    }
    
    hideAISuggestion();
}

/**
 * Retry AI suggestion
 */
async function retryAISuggestion() {
    const session = activeChatSessions.get(currentSessionId);
    if (!session || session.messages.length === 0) return;
    
    const lastMessage = session.messages[session.messages.length - 1];
    await requestAISuggestion(session, lastMessage);
}

/**
 * Get Cognito authentication token
 */
async function getCognitoToken() {
    // Hook into existing auth from support.html
    return new Promise((resolve, reject) => {
        if (window.cognitoUser) {
            window.cognitoUser.getSession((err, session) => {
                if (err) {
                    console.error('Failed to get Cognito session:', err);
                    resolve(null); // Return null instead of rejecting
                } else {
                    resolve(session.getIdToken().getJwtToken());
                }
            });
        } else {
            console.warn('No Cognito user available');
            resolve(null);
        }
    });
}

// Hide AI panel by default
window.hideAIPanel = hideAISuggestion;
```

---

## Quick Integration Checklist

### Phase 1: Configure Agent (5 min)
```bash
./execute-phase-1.sh
# Copy Alias ID from output
```

### Phase 2: Deploy Backend (10 min)
```bash
export BEDROCK_AGENT_ALIAS_ID=<your-alias-id>
cd backend
npm install @aws-sdk/client-bedrock-agent-runtime
serverless deploy --config serverless.ai-agent.yml
# Copy API endpoint URL
```

### Phase 3: Update support.html (5 min)
1. Add CSS styles (inline in `<style>`)
2. Add HTML panel (after `chatMessages`)
3. Add JavaScript functions (in `<script>`)
4. Set `AI_API_ENDPOINT` to your API URL

### Phase 4: Test (5 min)
1. Open support dashboard
2. Select a chat session
3. Customer sends message → AI panel appears
4. Click "Use This" → text copies to input
5. Edit and send

---

## Visual Example

When a customer sends: **"My order is 30 minutes late!"**

AI Panel appears above input:
```
┌─────────────────────────────────────┐
│ 🤖 whizzAI Suggestion               │
├─────────────────────────────────────┤
│ "I sincerely apologize for the      │
│ delay with your order. Let me check │
│ the status immediately. Could you   │
│ please share your order number?"    │
│                                     │
│ [✓ Use This] [🔄 Retry] [Dismiss]  │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Type your message...                │
│                            [Send →] │
└─────────────────────────────────────┘
```

Agent can:
- **Use it** → Text copies to input (can edit before sending)
- **Retry** → Get new suggestion
- **Dismiss** → Hide panel and type manually

---

## Key Benefits

✅ **Non-intrusive** - Only appears when needed
✅ **Optional** - Agent can ignore and type manually
✅ **Fast** - Suggestions in <2 seconds
✅ **Context-aware** - Understands conversation history
✅ **Professional** - Maintains brand tone
✅ **Integrated** - Matches existing UI perfectly

---

## Configuration

After deploying backend, update this line in support.html:
```javascript
const AI_API_ENDPOINT = 'https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion';
```

---

## Total Time: 25 minutes
- Phase 1: 5 min
- Phase 2: 10 min
- Phase 3: 5 min
- Phase 4: 5 min

**Ready to integrate!** 🚀
