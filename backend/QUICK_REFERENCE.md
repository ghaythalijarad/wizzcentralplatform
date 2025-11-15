# whizzAI Deployment - Quick Reference

## 🚀 One Command to Rule Them All

```bash
cd backend
./deploy-ai-agent.sh [dev|staging|prod]
```

---

## 📋 Common Commands

| Action | Command |
|--------|---------|
| **Deploy to Dev** | `./deploy-ai-agent.sh dev` |
| **Deploy to Staging** | `./deploy-ai-agent.sh staging` |
| **Deploy to Production** | `./deploy-ai-agent.sh prod` |
| **View Logs** | `aws logs tail /aws/lambda/whizz-ai-agent-dev --follow` |
| **Test API** | `curl -X POST https://{API_URL}/agent-suggestion -d '{"message":"test"}'` |
| **Check Stack** | `aws cloudformation describe-stacks --stack-name whizz-ai-agent-dev` |
| **Delete Stack** | `aws cloudformation delete-stack --stack-name whizz-ai-agent-dev` |

---

## 🎯 What's New

### ✅ DO THIS
- Use `./deploy-ai-agent.sh`
- Edit `template-ai-agent.yaml`
- Check `DEPLOYMENT_GUIDE.md`

### ❌ DON'T DO THIS
- ~~`serverless deploy`~~ (deprecated)
- ~~Edit `serverless.ai-agent.yml`~~ (deprecated)
- ~~`deploy-ai-simple.sh`~~ (old script)

---

## 🔧 File Reference

| File | Purpose | Status |
|------|---------|--------|
| `deploy-ai-agent.sh` | **Deployment script** | ✅ USE THIS |
| `template-ai-agent.yaml` | **Infrastructure config** | ✅ SOURCE OF TRUTH |
| `DEPLOYMENT_GUIDE.md` | **Documentation** | ✅ READ THIS |
| `serverless.ai-agent.yml` | Serverless config | ❌ DEPRECATED |
| `deploy-ai-simple.sh` | Old script | ❌ DELETE LATER |

---

## 🧪 Test API

```bash
# Get endpoint from deployment output
API_URL="https://abc123.execute-api.us-east-1.amazonaws.com/dev"

# Test request
curl -X POST ${API_URL}/agent-suggestion \
  -H 'Content-Type: application/json' \
  -d '{
    "userType": "customer",
    "message": "My delivery is very late",
    "conversationHistory": []
  }'
```

**Expected:** JSON response with AI suggestion

---

## 📊 Monitoring

```bash
# View recent logs
aws logs tail /aws/lambda/whizz-ai-agent-dev --since 5m

# Follow logs in real-time
aws logs tail /aws/lambda/whizz-ai-agent-dev --follow

# Check API metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=whizz-ai-api-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Deployment fails | Check `aws cloudformation describe-stack-events --stack-name whizz-ai-agent-dev` |
| API returns 502 | Check Lambda logs: `aws logs tail /aws/lambda/whizz-ai-agent-dev` |
| Permission denied | Verify AWS SSO: `aws sso login` |
| Module not found | Verify ZIP structure: `unzip -l lambda-deployment.zip | head` |

---

## 📱 Frontend Integration

**File:** `frontend/pages/support.html` (line ~2308)

```javascript
// Update this after deployment
const AI_API_ENDPOINT = 'https://{YOUR_API_ID}.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion';
```

---

## 🔄 Quick Workflow

```bash
# 1. Make code changes
vim src/services/bedrock-agent-service.js

# 2. Deploy
./deploy-ai-agent.sh dev

# 3. Test
curl -X POST https://{API_URL}/agent-suggestion -d '{"message":"test"}'

# 4. Check logs if needed
aws logs tail /aws/lambda/whizz-ai-agent-dev --follow

# 5. Deploy to staging
./deploy-ai-agent.sh staging

# 6. Deploy to production
./deploy-ai-agent.sh prod
```

---

## 🆘 Need Help?

1. **Read:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Check:** [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
3. **Logs:** `aws logs tail /aws/lambda/whizz-ai-agent-dev`
4. **Ask:** DevOps team

---

**Single Source of Truth:**  
`template-ai-agent.yaml` + `deploy-ai-agent.sh`

**Last Updated:** November 13, 2025
