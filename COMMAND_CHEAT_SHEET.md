# 🚀 AI Integration - Command Cheat Sheet

## Quick Commands (Copy & Paste)

### 🎯 Start Here
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
./ai-integration.sh
```

---

## Phase 1: Configure Agent

```bash
# Option 1: Use master script (recommended)
./ai-integration.sh
# Then choose: Option 1

# Option 2: Direct execution
./execute-phase-1.sh

# Option 3: Manual steps
chmod +x configure-bedrock-agent.sh
./configure-bedrock-agent.sh

# Save Alias ID
echo "BEDROCK_AGENT_ALIAS_ID=XXXXXXXXXX" >> .env.bedrock
```

**Output**: Copy the Alias ID (looks like: `XXXXXXXXXX`)

---

## Phase 2: Deploy Backend

```bash
# Set Alias ID from Phase 1
export BEDROCK_AGENT_ALIAS_ID=<paste-your-alias-id>

# Option 1: Use master script (recommended)
./ai-integration.sh
# Then choose: Option 2

# Option 2: Direct execution
./execute-phase-2.sh

# Option 3: Manual steps
cd backend
npm install @aws-sdk/client-bedrock-agent-runtime --save
serverless deploy --config serverless.ai-agent.yml

# Save API URL
echo "AI_AGENT_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion" >> ../.env.bedrock
```

**Output**: Copy the API Gateway URL

---

## Phase 3: Update Frontend

```bash
# Open support.html
open frontend/pages/support.html

# Or use VS Code
code frontend/pages/support.html

# Find line ~2279 and replace:
# FROM: const AI_API_ENDPOINT = 'YOUR_API_ENDPOINT_HERE';
# TO:   const AI_API_ENDPOINT = 'https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion';
```

**Manual Edit Required**: Update `AI_API_ENDPOINT` with your URL

---

## Phase 4: Test Locally (Optional)

```bash
# Start local server
cd frontend
python3 -m http.server 8000

# Open in browser
open http://localhost:8000/pages/support.html

# Test health endpoint
curl https://YOUR-API-URL/dev/agent-suggestion/health
```

---

## Phase 5: Deploy to Production

```bash
# Option 1: Use master script (recommended)
./ai-integration.sh
# Then choose: Option 5

# Option 2: Manual steps
git add .
git commit -m "feat: Integrate whizzAI for support chat suggestions"
./push-to-both.sh
./quick-amplify-deploy.sh

# Option 3: Direct Amplify trigger
aws amplify start-job \
  --app-id d2f5oacwil9cbi \
  --branch-name main \
  --job-type RELEASE
```

---

## Verification Commands

### Check Files Exist
```bash
ls -la frontend/pages/support.html
ls -la backend/src/services/bedrock-agent-service.js
ls -la backend/src/handlers/agent-suggestion-handler.js
ls -la backend/serverless.ai-agent.yml
ls -la *.sh | grep "ai-integration\|execute-phase"
```

### Check Changes
```bash
git diff frontend/pages/support.html
git status
```

### View Configuration
```bash
cat .env.bedrock
```

### Test Backend Health
```bash
# Replace with your actual URL
curl https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion/health
```

### Check Amplify Deployment
```bash
aws amplify list-jobs --app-id d2f5oacwil9cbi --branch-name main --max-items 5
```

---

## Troubleshooting Commands

### Check AWS Bedrock Agent Status
```bash
aws bedrock-agent get-agent --agent-id TNJAPTVUDC --region us-east-1
```

### Check Lambda Logs
```bash
serverless logs -f agentSuggestion --tail --config backend/serverless.ai-agent.yml
```

### Check API Gateway
```bash
aws apigateway get-rest-apis --query 'items[?name==`whizz-ai-agent-dev`]'
```

### Re-deploy Backend
```bash
cd backend
export BEDROCK_AGENT_ALIAS_ID=<your-alias-id>
serverless deploy --config serverless.ai-agent.yml --force
```

### Remove Deployment (Cleanup)
```bash
cd backend
serverless remove --config serverless.ai-agent.yml
```

---

## Useful Git Commands

### Commit AI Changes
```bash
git add .
git commit -m "feat: Integrate AWS Bedrock whizzAI for support suggestions"
git push origin main
```

### Push to Both Repos
```bash
./push-to-both.sh
```

### View Recent Commits
```bash
git log --oneline -5
```

### Rollback Changes (if needed)
```bash
git checkout HEAD -- frontend/pages/support.html
```

---

## Environment Variables

### Set Temporarily (Current Session)
```bash
export BEDROCK_AGENT_ALIAS_ID=XXXXXXXXXX
export AI_AGENT_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion
```

### Set Permanently (Add to ~/.zshrc)
```bash
echo 'export BEDROCK_AGENT_ALIAS_ID=XXXXXXXXXX' >> ~/.zshrc
echo 'export AI_AGENT_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion' >> ~/.zshrc
source ~/.zshrc
```

### Check Environment Variables
```bash
echo $BEDROCK_AGENT_ALIAS_ID
echo $AI_AGENT_API_URL
```

---

## AWS CLI Commands

### Get Cognito User Pool Info
```bash
aws cognito-idp describe-user-pool --user-pool-id us-east-1_Cp9YnOQWi
```

### List Lambda Functions
```bash
aws lambda list-functions --query 'Functions[?contains(FunctionName, `whizz-ai-agent`)]'
```

### Invoke Lambda Directly (Test)
```bash
aws lambda invoke \
  --function-name whizz-ai-agent-dev-agentSuggestion \
  --payload '{"body": "{\"message\":\"Order delayed\",\"userType\":\"customer\"}"}' \
  response.json

cat response.json
```

### Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/whizz-ai-agent-dev-agentSuggestion --follow
```

---

## NPM Commands

### Install Dependencies
```bash
cd backend
npm install
```

### Update AWS SDK
```bash
cd backend
npm update @aws-sdk/client-bedrock-agent-runtime
```

### Check Installed Packages
```bash
cd backend
npm list @aws-sdk/client-bedrock-agent-runtime
```

---

## Documentation Commands

### View Documentation
```bash
cat START_HERE_AI.md
cat AI_INTEGRATION_SIMPLIFIED.md
cat AI_VISUAL_GUIDE.md
cat INTEGRATION_COMPLETE.md
```

### Open in Browser (macOS)
```bash
open START_HERE_AI.md
```

### Search Documentation
```bash
grep -r "AI_API_ENDPOINT" .
grep -r "requestAISuggestion" frontend/pages/support.html
```

---

## One-Liner Quick Start

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform && ./ai-integration.sh
```

---

## Emergency Rollback

### Revert All Changes
```bash
git checkout HEAD -- frontend/pages/support.html
git checkout HEAD -- backend/
```

### Remove Backend Deployment
```bash
cd backend
serverless remove --config serverless.ai-agent.yml
```

### Delete Created Files
```bash
rm backend/src/services/bedrock-agent-service.js
rm backend/src/handlers/agent-suggestion-handler.js
rm backend/serverless.ai-agent.yml
rm .env.bedrock
```

---

## Success Indicators

### ✅ Phase 1 Success
```bash
# Should output Alias ID
cat .env.bedrock | grep BEDROCK_AGENT_ALIAS_ID
```

### ✅ Phase 2 Success
```bash
# Should return {"status":"healthy"}
curl https://YOUR-API-URL/dev/agent-suggestion/health
```

### ✅ Phase 3 Success
```bash
# Should NOT contain 'YOUR_API_ENDPOINT_HERE'
grep "AI_API_ENDPOINT" frontend/pages/support.html | grep -v "YOUR_API_ENDPOINT_HERE"
```

### ✅ Phase 5 Success
```bash
# Should show recent deployment
aws amplify list-jobs --app-id d2f5oacwil9cbi --branch-name main --max-items 1
```

---

## Performance Monitoring

### Check API Response Time
```bash
time curl -X POST https://YOUR-API-URL/dev/agent-suggestion \
  -H "Content-Type: application/json" \
  -d '{"message":"test","userType":"customer"}'
```

### Monitor Lambda Execution
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=whizz-ai-agent-dev-agentSuggestion \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

---

## Cost Monitoring

### Check Bedrock Usage
```bash
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -v-7d +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity DAILY \
  --metrics UnblendedCost \
  --filter file://bedrock-filter.json
```

### Estimate Monthly Cost
```bash
# Bedrock Claude 3.5 Sonnet: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
# Assume 100 suggestions/day, 200 tokens each = 6K tokens/day
# Monthly: 6K * 30 = 180K tokens = ~$3-5/month
echo "Estimated cost: $3-5/month for 100 suggestions/day"
```

---

## 📋 Checklist Format

Copy and check off as you complete:

```
[ ] Phase 1: Configure Bedrock Agent
    [ ] Run ./ai-integration.sh
    [ ] Choose Option 1
    [ ] Copy Alias ID
    [ ] Save to .env.bedrock

[ ] Phase 2: Deploy Backend
    [ ] Set BEDROCK_AGENT_ALIAS_ID
    [ ] Choose Option 2
    [ ] Copy API URL
    [ ] Test health endpoint

[ ] Phase 3: Update Frontend
    [ ] Open support.html
    [ ] Find line ~2279
    [ ] Replace AI_API_ENDPOINT
    [ ] Save file

[ ] Phase 4: Test Locally (Optional)
    [ ] Start local server
    [ ] Test AI suggestion appears
    [ ] Verify buttons work

[ ] Phase 5: Deploy Production
    [ ] Commit changes
    [ ] Push to repos
    [ ] Trigger Amplify deployment
    [ ] Verify in production

[ ] Final Verification
    [ ] Open production URL
    [ ] Test with real chat session
    [ ] Confirm AI suggestions appear
    [ ] Train support team
```

---

## 🆘 Get Help

### Check Logs
```bash
# Master script logs
./ai-integration.sh | tee integration.log

# Backend deployment logs
cd backend && serverless deploy --verbose
```

### Debug Mode
```bash
# Enable debug output
export DEBUG=*
./execute-phase-1.sh
```

### Contact
- **Technical Issues**: Check logs in CloudWatch
- **AWS Issues**: Check AWS Console → Bedrock → Agents
- **Frontend Issues**: Check browser console (F12)

---

**Last Updated**: January 2025  
**Version**: 1.0
