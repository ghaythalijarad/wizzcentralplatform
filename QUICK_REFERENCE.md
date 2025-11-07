# WhizzCentral Platform - Quick Reference Guide

## 🔗 Important URLs

### Production Environment
- **Regions Dashboard:** https://main.d2f5oacwil9cbi.amplifyapp.com/pages/regions.html
- **Frontend Home:** https://main.d2f5oacwil9cbi.amplifyapp.com
- **Lambda API Endpoint:** https://wkmj5ihhypx7oviwo3yk6bi6lu0vjrum.lambda-url.us-east-1.on.aws/

### AWS Resources
- **Lambda Function:** `WizzCentral-RegionsAPI` (us-east-1)
- **DynamoDB Table:** `WizzCentral_Regions` (us-east-1)
- **Amplify App ID:** `d2f5oacwil9cbi`
- **Amplify Branch:** `main`

---

## ⚡ Quick Commands

### Test Lambda Function
```bash
curl https://wkmj5ihhypx7oviwo3yk6bi6lu0vjrum.lambda-url.us-east-1.on.aws/
```

### Check Amplify Build Status
```bash
aws amplify list-jobs --app-id d2f5oacwil9cbi --branch-name main --max-results 1 --region us-east-1
```

### Deploy Lambda Function
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
./deploy-regions-api.sh
```

### Start Local Dev Server
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
node local-dev-server.js
# Access: http://localhost:3000/pages/regions.html
```

### Push Changes to Production
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
git add .
git commit -m "your message"
git push origin main      # Primary repository
git push amplify main     # Amplify auto-deploys from this
```

---

## �� System Status

### Health Checks
```bash
# Check Lambda
curl -I https://wkmj5ihhypx7oviwo3yk6bi6lu0vjrum.lambda-url.us-east-1.on.aws/

# Check Frontend
curl -I https://main.d2f5oacwil9cbi.amplifyapp.com/pages/regions.html

# Check DynamoDB Item Count
aws dynamodb scan --table-name WizzCentral_Regions --select COUNT --region us-east-1
```

### View Logs
```bash
# Lambda logs
aws logs tail /aws/lambda/WizzCentral-RegionsAPI --follow --region us-east-1

# Amplify build logs
aws amplify get-job --app-id d2f5oacwil9cbi --branch-name main --job-id LATEST --region us-east-1
```

---

## 🛠️ Configuration

### Key Files
- `frontend/config.js` - Frontend configuration
- `backend/lambda-regions-api.js` - Lambda function code
- `amplify.yml` - Amplify build configuration
- `deploy-regions-api.sh` - Lambda deployment script
- `local-dev-server.js` - Local development server

### Environment Variables
- **Lambda:** `NODE_ENV=production`, `REGIONS_TABLE=WizzCentral_Regions`
- **Amplify (optional):** `API_BASE_URL` (overrides hardcoded URL)

---

## 🚨 Troubleshooting

### Regions Not Loading?
1. Check browser console for errors (F12)
2. Verify Lambda is responding: `curl https://wkmj5ihhypx7oviwo3yk6bi6lu0vjrum.lambda-url.us-east-1.on.aws/`
3. Check network tab for failed requests
4. Verify DynamoDB table has data: `aws dynamodb scan --table-name WizzCentral_Regions --select COUNT`

### CORS Errors?
- Lambda Function URL CORS is configured at AWS level (not in code)
- Verify: `aws lambda get-function-url-config --function-name WizzCentral-RegionsAPI --region us-east-1`

### Deployment Failed?
- Check Amplify Console: https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d2f5oacwil9cbi
- View build logs in Amplify Console
- Verify `amplify.yml` syntax

---

## 📞 Support

- **Documentation:** See `DEPLOYMENT_SUCCESS_SUMMARY.md`
- **Production Deployment:** See `PRODUCTION_DEPLOYMENT_SUMMARY.md`
- **Git Repositories:**
  - Primary: https://github.com/whizzgo/whizzCentralPlatform
  - Amplify: https://github.com/ghaythalijarad/wizzcentralplatform

---

## ✅ Quick Verification

```bash
# All-in-one health check
echo "=== Lambda Health ===" && \
curl -s -o /dev/null -w "Status: %{http_code}\nTime: %{time_total}s\n" https://wkmj5ihhypx7oviwo3yk6bi6lu0vjrum.lambda-url.us-east-1.on.aws/ && \
echo -e "\n=== Frontend Health ===" && \
curl -s -o /dev/null -w "Status: %{http_code}\nTime: %{time_total}s\n" https://main.d2f5oacwil9cbi.amplifyapp.com/pages/regions.html && \
echo -e "\n=== DynamoDB Count ===" && \
aws dynamodb scan --table-name WizzCentral_Regions --select COUNT --region us-east-1 --query 'Count'
```

Expected Output:
```
=== Lambda Health ===
Status: 200
Time: ~1.1s

=== Frontend Health ===
Status: 200
Time: ~0.2s

=== DynamoDB Count ===
132
```

---

**Last Updated:** November 7, 2025  
**Status:** 🟢 PRODUCTION LIVE
