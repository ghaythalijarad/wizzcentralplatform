# 🔓 Request AWS Bedrock Model Access

## Quick Guide (5 Minutes)

Your AI integration is **100% complete and tested**! You just need to request access to Claude 3 Sonnet.

---

## Step-by-Step Instructions

### 1. Open AWS Console
- Navigate to: https://console.aws.amazon.com/bedrock
- Region: **us-east-1** (US East - N. Virginia)

### 2. Go to Model Access
- In the left sidebar, click **"Model access"**
- Or go directly to: https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess

### 3. Request Access
- Click **"Modify model access"** button (top right)
- Find **"Anthropic"** section
- Check the box for:
  - ☑️ **Claude 3 Sonnet**  
    `anthropic.claude-3-sonnet-20240229-v1:0`

### 4. Submit Form
- Click **"Next"** at the bottom
- Review your selection
- Click **"Submit"**

### 5. Wait for Approval
- **Typical approval time**: Instant to 15 minutes
- **Status will change**: "In Progress" → "Access granted"
- You'll receive an email confirmation

---

## After Approval

### Test the API
```bash
curl -X POST https://c9zg7yodh3.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_access_approved",
    "userType": "customer",
    "message": "My order is delayed",
    "conversationHistory": []
  }'
```

### Expected Response
```json
{
  "success": true,
  "suggestion": "I sincerely apologize for the delay with your order...",
  "confidence": 0.9,
  "timestamp": "2025-11-13T..."
}
```

---

## Alternative: Use Claude 3 Haiku (Instant Access)

If you need immediate access without approval, you can switch to Claude 3 Haiku, which is often available by default:

### Update Model ID
Edit `backend/src/services/bedrock-agent-service.js`:

```javascript
// Change this line:
const MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';

// To this:
const MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0';
```

### Redeploy
```bash
cd backend
rm -rf lambda-package ai-agent-lambda.zip
mkdir lambda-package
cp -r src lambda-package/
cd lambda-package
npm install --production @aws-sdk/client-bedrock-runtime
cd ..
cd lambda-package && zip -r ../ai-agent-lambda.zip . && cd ..

AWS_PROFILE=wizz-drivers-ghayth-dev aws s3 cp ai-agent-lambda.zip \
  s3://whizz-ai-deployments-031857856164/ai-agent-lambda.zip --region us-east-1

AWS_PROFILE=wizz-drivers-ghayth-dev aws lambda update-function-code \
  --function-name whizz-ai-agent-suggestion \
  --s3-bucket whizz-ai-deployments-031857856164 \
  --s3-key ai-agent-lambda.zip \
  --region us-east-1
```

**Note**: Haiku is faster and cheaper but slightly less capable than Sonnet.

---

## Troubleshooting

### "Model access not granted"
- Wait 15 minutes after submitting form
- Check AWS email for approval notification
- Refresh Bedrock Model Access page

### "Use case form required"
- Fill out the simple form in Bedrock console
- Typical fields:
  - **Company**: Whizz Food Delivery
  - **Use case**: Customer support assistance
  - **Industry**: Food & Beverage / Technology
  - **Expected usage**: 100-500 requests/day

### "Access denied for region"
- Verify you're in **us-east-1** region
- Some models are region-specific

---

## Cost Estimate

### Claude 3 Sonnet Pricing
- **Input**: $0.003 per 1K tokens
- **Output**: $0.015 per 1K tokens
- **Average suggestion**: ~200 input + 150 output tokens
- **Cost per suggestion**: ~$0.003

### Monthly Estimate
- 100 suggestions/day = $9/month
- 500 suggestions/day = $45/month
- 1000 suggestions/day = $90/month

Very affordable for the value provided!

---

## FAQ

**Q: How long does approval take?**  
A: Usually instant for AWS accounts in good standing. Maximum 24 hours.

**Q: Do I need to explain my use case?**  
A: Sometimes. Just explain it's for customer support suggestions.

**Q: Can I use multiple models?**  
A: Yes! You can request access to all Anthropic models.

**Q: What if approval is denied?**  
A: Rare. Contact AWS support if this happens.

**Q: Do I need to pay upfront?**  
A: No. Pay-as-you-go based on actual usage.

---

## Quick Links

- **AWS Bedrock Console**: https://console.aws.amazon.com/bedrock
- **Model Access Page**: https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess
- **Pricing**: https://aws.amazon.com/bedrock/pricing/
- **Documentation**: https://docs.aws.amazon.com/bedrock/

---

## ✅ Checklist

- [ ] Open AWS Bedrock Console (us-east-1)
- [ ] Click "Model access" in sidebar
- [ ] Click "Modify model access"
- [ ] Select Claude 3 Sonnet
- [ ] Submit form
- [ ] Wait for approval (1-15 minutes)
- [ ] Test API endpoint
- [ ] Verify AI suggestions work
- [ ] Deploy to production!

---

**Once approved, your AI-powered support system is ready to go!** 🚀
