# 🚀 AWS Amplify Deployment Guide - whizzCentralPlatform

## Current Status
- ✅ Repository: `whizzgo/whizzCentralPlatform` (pushed to GitHub)
- ✅ Build configuration: `amplify.yml` exists and configured
- ✅ Code is ready for deployment
- ⚠️ Amplify app needs to be connected to repository

---

## 📋 Deployment Steps

### Method 1: AWS Console (Recommended - Easiest)

#### Step 1: Navigate to AWS Amplify Console
1. Open AWS Console: https://console.aws.amazon.com/amplify/
2. Select region: **us-east-1** (N. Virginia)
3. Click **"New app"** → **"Host web app"**

#### Step 2: Connect Repository
1. Select **GitHub** as your Git provider
2. Click **"Authorize AWS Amplify"** (if not already authorized)
3. Select repository: **whizzgo/whizzCentralPlatform**
4. Select branch: **main**
5. Click **Next**

#### Step 3: Configure Build Settings
The `amplify.yml` file will be automatically detected. Review it:

```yaml
✅ Build command: Already configured in amplify.yml
✅ Output directory: dist
✅ Node version: Will use latest (or specify in amplify.yml)
```

**Important**: Make sure these settings are configured:
- **App name**: `whizzCentralPlatform`
- **Environment name**: `production` (or `main`)
- **Build specification**: Use the amplify.yml in your repo

#### Step 4: Add Environment Variables
Add these environment variables in Amplify Console:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `API_BASE_URL` | Your API Gateway URL | Backend API endpoint |
| `NODE_ENV` | `production` | Environment mode |

**How to add**:
1. In Amplify Console → Your App
2. Go to **"Environment variables"** (left sidebar)
3. Click **"Manage variables"**
4. Add each variable

#### Step 5: Configure Custom Domain (Optional)
1. Go to **"Domain management"**
2. Click **"Add domain"**
3. Enter your custom domain
4. Follow DNS configuration instructions

#### Step 6: Deploy
1. Click **"Save and deploy"**
2. Wait for build to complete (~3-5 minutes)
3. Your app will be live at: `https://main.xxxxxxxx.amplifyapp.com`

---

### Method 2: AWS CLI (Advanced)

#### Prerequisites
```bash
# Install Amplify CLI if not installed
npm install -g @aws-amplify/cli

# Configure AWS credentials
aws configure
```

#### Step 1: Create GitHub Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `admin:repo_hook` (Full control of repository hooks)
4. Copy the token

#### Step 2: Store Token in AWS Secrets Manager (Recommended)
```bash
aws secretsmanager create-secret \
  --name github-token-whizz \
  --description "GitHub token for Amplify deployments" \
  --secret-string "YOUR_GITHUB_TOKEN" \
  --region us-east-1
```

#### Step 3: Create Amplify App via CLI
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Create app with GitHub token
aws amplify create-app \
  --name "whizzCentralPlatform" \
  --repository "https://github.com/whizzgo/whizzCentralPlatform" \
  --access-token "YOUR_GITHUB_TOKEN" \
  --platform WEB \
  --region us-east-1 \
  --enable-branch-auto-build \
  --custom-rules source=/<*>,target=/index.html,status=404-200
```

#### Step 4: Create Branch
```bash
# Get the app ID from previous command output
APP_ID="your-app-id"

aws amplify create-branch \
  --app-id $APP_ID \
  --branch-name main \
  --enable-auto-build \
  --region us-east-1
```

#### Step 5: Start Deployment
```bash
aws amplify start-job \
  --app-id $APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --region us-east-1
```

---

### Method 3: Using Existing App (Update Repository)

If you want to use the existing app `d2f5oacwil9cbi`:

```bash
# Update the app repository
aws amplify update-app \
  --app-id d2f5oacwil9cbi \
  --name "whizzCentralPlatform" \
  --repository "https://github.com/whizzgo/whizzCentralPlatform" \
  --access-token "YOUR_GITHUB_TOKEN" \
  --region us-east-1

# Update or create the main branch
aws amplify update-branch \
  --app-id d2f5oacwil9cbi \
  --branch-name main \
  --enable-auto-build \
  --region us-east-1

# Start deployment
aws amplify start-job \
  --app-id d2f5oacwil9cbi \
  --branch-name main \
  --job-type RELEASE \
  --region us-east-1
```

---

## 🔧 Build Configuration Details

### Current amplify.yml Configuration
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - rm -rf dist/
        - mkdir -p dist
        - cp -r frontend/* dist/
        - cp frontend/index.html dist/index.html
    postBuild:
      commands:
        - test -f dist/index.html && echo "✅ index.html exists"
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### What Gets Deployed
- ✅ All frontend files from `frontend/` directory
- ✅ Static assets (CSS, JS, images)
- ✅ HTML pages
- ✅ Configuration files
- ✅ Redirects for SPA routing

---

## 🌐 Post-Deployment Steps

### 1. Verify Deployment
Once deployed, check:
```bash
# Get app details
aws amplify get-app --app-id YOUR_APP_ID --region us-east-1

# Check branch status
aws amplify get-branch --app-id YOUR_APP_ID --branch-name main --region us-east-1
```

### 2. Test Your Application
Visit your Amplify URL:
- Default: `https://main.d2f5oacwil9cbi.amplifyapp.com`
- Or your custom domain

Test these pages:
- ✅ Login page: `/index.html`
- ✅ Dashboard: `/pages/dashboard.html`
- ✅ Support: `/pages/support.html`
- ✅ Regions: `/pages/regions.html`

### 3. Configure Redirects
The `_redirects` file should handle SPA routing. If you encounter issues:

1. Go to Amplify Console → Your App → **"Rewrites and redirects"**
2. Add rule:
   - Source: `/<*>`
   - Target: `/index.html`
   - Type: `404 (Rewrite)`

### 4. Set Up Continuous Deployment
Amplify will automatically deploy when you push to `main` branch:

```bash
# Make changes
git add .
git commit -m "Update app"
git push origin main

# Amplify will automatically build and deploy
```

---

## 📊 Monitoring & Logs

### View Build Logs
1. Go to Amplify Console
2. Select your app
3. Click on **"main"** branch
4. View build logs in real-time

### Monitor Deployments
```bash
# List all jobs
aws amplify list-jobs --app-id YOUR_APP_ID --branch-name main --region us-east-1

# Get job details
aws amplify get-job --app-id YOUR_APP_ID --branch-name main --job-id JOB_ID --region us-east-1
```

---

## 🐛 Troubleshooting

### Build Fails
**Check:**
1. Build logs in Amplify Console
2. Ensure `package.json` has all dependencies
3. Verify `amplify.yml` syntax
4. Check Node.js version compatibility

**Common issues:**
```bash
# Missing dependencies
npm install

# Wrong Node version - add to amplify.yml:
frontend:
  phases:
    preBuild:
      commands:
        - nvm install 18
        - nvm use 18
        - npm ci
```

### 404 Errors After Deployment
**Solution**: Add redirect rules in Amplify Console
```
Source: /<*>
Target: /index.html
Type: 404 (Rewrite)
```

### API Connection Issues
**Check:**
1. API_BASE_URL environment variable is set
2. CORS is configured on API Gateway
3. Cognito configuration is correct

---

## 🎯 Quick Start Commands

### Deploy Now (Console Method)
1. Open: https://console.aws.amazon.com/amplify/
2. Click **"New app"** → **"Host web app"**
3. Connect **whizzgo/whizzCentralPlatform**
4. Deploy **main** branch
5. Done! 🎉

### Deploy Now (CLI Method)
```bash
# 1. Get GitHub token from: https://github.com/settings/tokens

# 2. Create app (replace YOUR_TOKEN)
aws amplify create-app \
  --name "whizzCentralPlatform" \
  --repository "https://github.com/whizzgo/whizzCentralPlatform" \
  --access-token "YOUR_TOKEN" \
  --platform WEB \
  --region us-east-1 \
  --enable-branch-auto-build

# 3. Note the appId from output, then create branch
aws amplify create-branch \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --enable-auto-build \
  --region us-east-1

# 4. Start deployment
aws amplify start-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --region us-east-1
```

---

## 📝 Next Steps

After successful deployment:

1. ✅ **Test all pages** - Verify functionality
2. ✅ **Configure custom domain** - Set up your domain
3. ✅ **Set up monitoring** - CloudWatch logs
4. ✅ **Configure CI/CD** - Automated deployments
5. ✅ **Set up staging environment** - Create dev branch
6. ✅ **Enable PR previews** - Test before merging

---

## 🔗 Useful Links

- AWS Amplify Console: https://console.aws.amazon.com/amplify/
- Amplify Documentation: https://docs.aws.amazon.com/amplify/
- GitHub Repository: https://github.com/whizzgo/whizzCentralPlatform
- Current Cognito Pool: `us-east-1_Cp9YnOQWi`

---

## 🎉 Success Checklist

After deployment, verify:

```
[ ] App is accessible via Amplify URL
[ ] Login page loads correctly
[ ] Dashboard is accessible after login
[ ] Support page works with WebSocket
[ ] All assets load (CSS, JS, images)
[ ] API calls work correctly
[ ] Cognito authentication works
[ ] Auto-deployment triggers on git push
[ ] Environment variables are set
[ ] Custom domain configured (optional)
```

---

**Ready to deploy? Start with Method 1 (AWS Console) - it's the easiest!** 🚀
