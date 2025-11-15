# 🤖 whizzAI - Intelligent Support Assistant

> AI-powered response suggestions for WhizzCentralPlatform support chat using AWS Bedrock & Claude 3.5 Sonnet

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Run the interactive setup wizard
./ai-integration.sh

# 2. Follow the guided steps through all 5 phases

# 3. That's it! AI suggestions will appear in your support chat
```

## 📚 Documentation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **QUICK_START_AI.md** | Fast track guide | Want to start immediately |
| **AI_INTEGRATION_EXECUTION_PLAN.md** | Complete step-by-step | Detailed implementation |
| **AI_PROJECT_SUMMARY.md** | Overview & architecture | Understanding the system |
| **README_AI.md** | This file | General information |

## 🎯 What Gets Built

### For Support Agents
When a customer or merchant sends a message, whizzAI automatically:
- Analyzes the conversation context
- Understands user type (customer/merchant)
- Detects urgency and issue type
- Generates a professional, empathetic response suggestion
- Shows it in a beautiful purple AI panel
- Lets you use, edit, or regenerate the suggestion

### System Components

```
Frontend                Backend              AWS Bedrock
┌─────────┐            ┌─────────┐          ┌──────────┐
│ Support │  API call  │ Lambda  │  Invoke  │ whizzAI  │
│  Chat   │──────────▶ │ Handler │─────────▶│  Agent   │
│         │◀──────────│         │◀─────────│ (Claude) │
└─────────┘ Suggestion └─────────┘ Response └──────────┘
```

## ⚡ Features

✨ **Auto-Trigger**: Suggestions appear automatically when messages arrive  
🎨 **Beautiful UI**: Purple gradient panel with smooth animations  
🔄 **Regenerate**: Get alternative suggestions instantly  
📝 **Editable**: Use suggestions as starting points, customize before sending  
🎯 **Context-Aware**: Considers conversation history, user type, urgency  
🔐 **Secure**: Cognito authentication, IAM roles, HTTPS only  
💰 **Cost-Effective**: ~$0.01 per suggestion, scales on demand  

## 📦 What's Included

### Backend Services
- ✅ `backend/src/services/bedrock-agent-service.js` - Core AI service
- ✅ `backend/src/handlers/agent-suggestion-handler.js` - Lambda handlers
- ✅ `backend/serverless.ai-agent.yml` - Infrastructure config

### Frontend (Phase 3 - To be created)
- `frontend/assets/js/whizz-ai-assistant.js` - AI assistant class
- `frontend/assets/css/ai-assistant.css` - UI styles
- Updates to `frontend/pages/support.html` - Integration points

### Automation Scripts
- ✅ `ai-integration.sh` - Interactive wizard (RECOMMENDED)
- ✅ `execute-phase-1.sh` - AWS agent configuration
- ✅ `execute-phase-2.sh` - Backend deployment
- ✅ `configure-bedrock-agent.sh` - Agent setup
- ✅ `show-progress.sh` - Progress dashboard

## 🏃 Execution Options

### Option 1: Interactive Wizard (Easiest)
```bash
./ai-integration.sh
```
- Visual progress tracking
- Step-by-step guidance
- Automatic configuration saving
- Built-in testing tools

### Option 2: Phase-by-Phase Manual
```bash
# Phase 1: Configure Agent (5 min)
./execute-phase-1.sh
export BEDROCK_AGENT_ALIAS_ID=<copy-from-output>

# Phase 2: Deploy Backend (15 min)
./execute-phase-2.sh

# Phase 3: Frontend (30 min)
# Follow AI_INTEGRATION_EXECUTION_PLAN.md

# Phase 4: Testing (10 min)
# Follow testing checklist

# Phase 5: Production (5 min)
git add . && git commit -m "feat: AI integration"
./push-to-both.sh
```

### Option 3: Quick Reference
```bash
cat QUICK_START_AI.md
```

## 📊 Check Progress

```bash
./show-progress.sh
```

Shows visual dashboard with:
- Phase completion status
- Configuration details
- Next action to take
- Quick command reference

## 🎓 Example Use Cases

### Scenario 1: Delayed Order
```
Customer: "My order is 30 minutes late!"

AI Suggests: "I sincerely apologize for the delay. Let me check 
your order status immediately and contact the driver. Could you 
please share your order number so I can investigate?"

Agent: [Clicks "Use This Response", adds order number, sends]
```

### Scenario 2: Payment Issue
```
Merchant: "I didn't receive payment for yesterday's orders"

AI Suggests: "I understand this is concerning. Let me investigate 
your payment status right away. Could you provide your merchant ID 
and the specific order numbers? I'll check our system and get back 
to you within 30 minutes."

Agent: [Uses suggestion, personalizes, sends]
```

### Scenario 3: Menu Update Question
```
Merchant: "How do I change prices for my menu items?"

AI Suggests: "You can update menu prices through your merchant 
dashboard. Go to Menu → Items → Select item → Edit Price. The 
changes will be live immediately. Would you like me to walk you 
through it?"

Agent: [Perfect! Sends as-is]
```

## 🔧 Requirements

- ✅ AWS Account with Bedrock access
- ✅ AWS CLI configured
- ✅ Node.js 18+ (already in project)
- ✅ Serverless Framework (already installed)
- ✅ Cognito User Pool (already exists: us-east-1_Cp9YnOQWi)
- ✅ AWS Bedrock Agent created (ID: TNJAPTVUDC) ✅

## 💰 Estimated Costs

| Service | Free Tier | After Free Tier | Monthly Est. |
|---------|-----------|-----------------|--------------|
| Bedrock | None | $0.01/suggestion | $50 |
| Lambda | 1M requests | $0.20/M | ~$0 |
| API Gateway | 1M requests | $3.50/M | ~$0 |
| **Total** | - | - | **~$50** |

*Based on 5,000 suggestions/month (1,000 sessions × 5 each)*

## 🎯 Success Metrics

Track these after deployment:
- **Usage**: % sessions using AI, acceptance rate
- **Quality**: CSAT scores, response time reduction
- **Business**: Tickets per agent, cost per ticket

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Alias ID not set" | Complete Phase 1 first |
| "Unauthorized" | Check Cognito configuration |
| Slow responses | Increase Lambda memory |
| Low quality | Update agent prompts |

See `AI_INTEGRATION_EXECUTION_PLAN.md` for detailed troubleshooting.

## 🔗 Important Resources

- **AWS Bedrock Agent**: [Console](https://console.aws.amazon.com/bedrock/home?region=us-east-1#/agents)
- **Amplify Deployments**: [Console](https://console.aws.amazon.com/amplify/home?region=us-east-1#/d2f5oacwil9cbi)
- **Lambda Functions**: Will be created during Phase 2
- **API Gateway**: Will be created during Phase 2

## 📞 Support

- **Code Issues**: Check documentation files
- **AWS Questions**: See [AWS Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- **Questions**: Contact dev team

## 🎉 Ready to Start?

```bash
# Interactive setup (recommended)
./ai-integration.sh

# Or view progress
./show-progress.sh

# Or quick reference
cat QUICK_START_AI.md
```

---

**Built with**: AWS Bedrock, Claude 3.5 Sonnet, Node.js, Serverless Framework  
**Status**: Ready for Phase 1 execution ✅  
**Estimated Time**: 60 minutes total  
**Difficulty**: Medium ⭐⭐⭐
