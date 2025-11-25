# 🚀 COPY-PASTE AI DEPLOYMENT GUIDE

## Step 1: Configure AWS SSO

Copy and paste this command:

```bash
aws configure sso
```

When prompted, enter:
- **SSO session name**: `whizz`
- **SSO start URL**: `https://d-90663b8ebd.awsapps.com/start`
- **SSO region**: `us-east-1`
- Press Enter for registration scopes
- Select account `031857856164`
- Select role `AdministratorAccess`
- **CLI default region**: `us-east-1`
- **CLI output format**: `json`
- Press Enter for profile name

## Step 2: Login

```bash
aws sso login
```

Browser will open - login to AWS.

## Step 3: Verify Login

```bash
aws sts get-caller-identity
```

You should see your account info.

## Step 4: Deploy AI Backend

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend
./deploy-ai-simple.sh
```

## Step 5: Get API Endpoint

After deployment, copy the API endpoint shown (looks like):
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion
```

## Step 6: Update Frontend

Open `frontend/pages/support.html`

Find line ~2394 (search for `AI_API_ENDPOINT`)

Change:
```javascript
const AI_API_ENDPOINT = 'YOUR_API_ENDPOINT_HERE';
```

To:
```javascript
const AI_API_ENDPOINT = 'YOUR-ACTUAL-ENDPOINT-FROM-STEP-5';
```

## Done! 🎉

The AI panel will now work when customers send messages.

---

## If You Get Stuck

**Problem**: AWS SSO not configured
**Solution**: Run `aws configure sso` first

**Problem**: Credentials expired
**Solution**: Run `aws sso login` again

**Problem**: Deployment fails
**Solution**: Check you're logged in: `aws sts get-caller-identity`

---

## Quick Reference

| Command | What it does |
|---------|--------------|
| `aws configure sso` | Setup AWS SSO |
| `aws sso login` | Login to AWS |
| `aws sts get-caller-identity` | Check if logged in |
| `./deploy-ai-simple.sh` | Deploy AI backend |
