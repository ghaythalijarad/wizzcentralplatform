# 🚀 Quick Start - whizzAI Integration

## Start Here (5 minutes to first AI suggestion)

### Step 1: Configure Agent
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
chmod +x configure-bedrock-agent.sh
./configure-bedrock-agent.sh
```

**Copy the Alias ID from output** ✏️

### Step 2: Install Dependencies
```bash
cd backend
npm install @aws-sdk/client-bedrock-agent-runtime --save
```

### Step 3: Set Environment Variable
```bash
export BEDROCK_AGENT_ALIAS_ID=<paste-your-alias-id>
```

### Step 4: Deploy Backend
```bash
serverless deploy --config serverless.ai-agent.yml
```

**Copy the API endpoint URL** ✏️

### Step 5: Test Health Endpoint
```bash
curl https://YOUR-API-ENDPOINT/dev/agent-suggestion/health
```

Expected: `{"status":"healthy"}`

---

## What You Get

✅ AI-powered response suggestions  
✅ Automatic context understanding  
✅ Professional, empathetic replies  
✅ Supports both customer & merchant chats  
✅ Real-time suggestions in support interface  

---

## Next Steps

1. **Create frontend files** (15 min)
   - `frontend/assets/js/whizz-ai-assistant.js`
   - `frontend/assets/css/ai-assistant.css`

2. **Update support.html** (10 min)
   - Add CSS/JS includes
   - Add API endpoint initialization
   - Add auto-trigger logic

3. **Test locally** (5 min)
   - Open support page
   - Start chat session
   - See AI suggestions appear

4. **Deploy to production** (5 min)
   - Commit changes
   - Push to GitHub
   - Trigger Amplify deployment

---

## Need Help?

📖 **Full Guide**: `AI_INTEGRATION_EXECUTION_PLAN.md`  
🐛 **Troubleshooting**: Section in full guide  
💬 **Questions**: Contact dev team

---

**Status**: Phase 1 Ready ✅  
**Estimated Total Time**: 60 minutes  
**Difficulty**: Medium ⭐⭐⭐
