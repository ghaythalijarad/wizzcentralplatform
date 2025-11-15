# WhizzMe AI - REAL AWS Bedrock Deployment Guide

## ✅ NO MORE MOCK SERVERS - Using Real AWS Bedrock!

This guide will help you deploy the WhizzMe AI service using **REAL AWS Bedrock API** (Amazon Nova Micro model).

---

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Deploy WhizzMe Backend to AWS

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend

# Deploy to AWS (this creates API Gateway + Lambda + Bedrock integration)
./deploy-ai-agent.sh dev
```

This will:
- ✅ Package Lambda function with Bedrock service
- ✅ Deploy to AWS CloudFormation
- ✅ Create API Gateway endpoint
- ✅ Configure AWS Bedrock Runtime permissions
- ✅ Return the API URL

### Step 2: Get Your API Endpoint

After deployment completes, get the API URL:

```bash
aws cloudformation describe-stacks \
  --stack-name whizzme-agent-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

You'll get something like:
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
```

### Step 3: Update Flutter App Configuration

Open `whizzMerchants/frontend/lib/services/whizzme_service.dart` and update line 15:

```dart
// Replace YOUR_API_ID with the actual API Gateway ID from step 2
static const String AI_ENDPOINT_AWS = 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion';
```

For example:
```dart
static const String AI_ENDPOINT_AWS = 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion';
```

### Step 4: Restart Flutter App

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzMerchants/frontend

# Hot reload or restart
flutter run -d 88546B2F-30DB-4418-8CF6-559EF24D4423
```

---

## 🎯 How It Works

### Architecture

```
┌──────────────┐      HTTPS       ┌─────────────────┐      AWS SDK      ┌──────────────────┐
│              │ ───────────────> │                 │ ─────────────────> │                  │
│ Flutter App  │                  │  API Gateway    │                    │ Lambda Function  │
│ (WhizzMe)    │ <─────────────── │  (REST API)     │ <───────────────── │  (Node.js 18)    │
│              │   JSON Response  │                 │   AI Response      │                  │
└──────────────┘                  └─────────────────┘                    └──────────────────┘
                                                                                   │
                                                                                   │ Bedrock SDK
                                                                                   ▼
                                                                          ┌──────────────────┐
                                                                          │                  │
                                                                          │  AWS Bedrock     │
                                                                          │  (Amazon Nova)   │
                                                                          │                  │
                                                                          └──────────────────┘
```

### API Endpoint

**POST** `/agent-suggestion`

**Request:**
```json
{
  "message": "How do I process a refund?",
  "userType": "merchant",
  "sessionId": "session_123",
  "metadata": {
    "category": "order_management"
  }
}
```

**Response:**
```json
{
  "success": true,
  "suggestion": "To process a refund in WhizzMerchants:\n1. Go to Orders tab\n2. Select the order...",
  "confidence": 0.85,
  "category": "order_management",
  "source": "aws-bedrock",
  "timestamp": "2025-11-14T14:30:00.000Z"
}
```

---

## 🔧 AWS Bedrock Configuration

The backend uses:
- **Model**: Amazon Nova Micro (`amazon.nova-micro-v1:0`)
- **Region**: us-east-1
- **Max Tokens**: 500 (optimized for chat)
- **Temperature**: 0.3 (consistent responses)
- **Cost**: ~$0.000035 per 1K tokens (extremely cheap!)

---

## 📊 Monitoring & Logs

### View Lambda Logs
```bash
aws logs tail /aws/lambda/whizzme-agent-dev --follow
```

### Check API Health
```bash
curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev/health
```

### CloudWatch Metrics
Go to AWS Console → CloudWatch → Dashboards → whizzme-agent-dev

---

## 🐛 Troubleshooting

### Issue: Flutter app shows "Failed to get AI response"

**Check:**
1. Is the API endpoint correct in `whizzme_service.dart`?
2. Is the Lambda function deployed?
   ```bash
   aws lambda get-function --function-name whizzme-agent-dev
   ```
3. Check Lambda logs for errors
4. Test API directly:
   ```bash
   curl -X POST https://YOUR_API.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion \
     -H "Content-Type: application/json" \
     -d '{"message":"test","userType":"merchant","sessionId":"test"}'
   ```

### Issue: "Access Denied" from Bedrock

**Solution:** Ensure your AWS account has Bedrock access:
```bash
# Request model access in AWS Console
# Go to: Bedrock → Model Access → Request Access → Amazon Nova Micro
```

### Issue: High latency

**Check:**
- Lambda cold starts (first request is slower)
- Network connectivity
- Bedrock model region (use us-east-1 for lowest latency)

---

## 💰 Cost Estimate

For 10,000 WhizzMe conversations per month:
- **API Gateway**: $3.50 (10K requests)
- **Lambda**: $0.20 (execution time)
- **Bedrock Nova Micro**: $3.50 (1M tokens ≈ 2K conversations)
- **Total**: ~$7.20/month

**That's $0.00072 per conversation!** 🎉

---

## 🔐 Production Checklist

Before going live:
- [ ] Add Cognito authentication to API
- [ ] Set up API key validation
- [ ] Configure rate limiting
- [ ] Enable CloudWatch alarms
- [ ] Set up WAF for API Gateway
- [ ] Test failover scenarios
- [ ] Configure backup/disaster recovery

---

## 📝 Next Steps

1. ✅ Deploy backend: `./deploy-ai-agent.sh dev`
2. ✅ Update Flutter config with real API URL
3. ✅ Test the flow: Category → WhizzMe → AI Response
4. ✅ Monitor CloudWatch for AI response quality
5. ✅ Fine-tune prompts in `bedrock-agent-service.js`

---

## 📞 Support

If you encounter issues:
1. Check CloudWatch Logs
2. Verify Bedrock model access
3. Test API endpoint directly
4. Check IAM permissions

**No more mock servers! Real AWS Bedrock all the way!** 🚀
