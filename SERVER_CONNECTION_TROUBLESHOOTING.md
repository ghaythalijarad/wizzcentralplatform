# 🚀 Server Connection Troubleshooting Guide

## Issue: Cannot Connect to WhizzCentral Server

### Quick Fix Steps

#### Option 1: Using Terminal (Recommended)
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Check if dependencies are installed
ls node_modules > /dev/null 2>&1 && echo "✅ Dependencies OK" || npm install

# Start the server
npm run local
```

#### Option 2: Using the Start Script
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
chmod +x start-simple.sh
./start-simple.sh
```

#### Option 3: Direct Node Execution
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
node local-dev-server.js
```

---

## Common Issues & Solutions

### 1. Port 3000 Already in Use
**Check what's using port 3000:**
```bash
lsof -i :3000
```

**Kill the process:**
```bash
kill -9 $(lsof -t -i:3000)
```

**Then restart:**
```bash
npm run local
```

### 2. Dependencies Not Installed
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
npm install
npm run local
```

### 3. AWS Credentials Issue
**Check AWS credentials:**
```bash
aws sts get-caller-identity --profile wizz-drivers-ghayth-dev
```

**If credentials are missing, configure:**
```bash
aws configure --profile wizz-drivers-ghayth-dev
```

### 4. DynamoDB Connection Issue
The server connects to real DynamoDB. Ensure:
- ✅ AWS credentials are configured
- ✅ Profile `wizz-drivers-ghayth-dev` exists
- ✅ Region is set to `us-east-1`

---

## Server URLs (Once Running)

**Main Dashboard:**
- http://localhost:3000

**Regions Management (Simple System):**
- http://localhost:3000/pages/regions-simple.html

**Login Page:**
- http://localhost:3000/login.html

**Dashboard:**
- http://localhost:3000/dashboard.html

---

## Verify Server is Running

**Check if server is listening:**
```bash
lsof -i :3000
```

**Check Node processes:**
```bash
ps aux | grep "local-dev-server"
```

**Test the server:**
```bash
curl http://localhost:3000
```

---

## Expected Server Output

When server starts successfully, you should see:
```
🔧 AWS Configuration:
   Region: us-east-1
   Profile: wizz-drivers-ghayth-dev
   Using Real DynamoDB: ✅

📊 Campaign API initialized

🚀 WizzCentral Platform running on port 3000
   Frontend: http://localhost:3000
   Regions: http://localhost:3000/pages/regions-simple.html
```

---

## Still Having Issues?

### Check Server Logs
If the server starts but you can't connect:

1. **Open Browser Console** (F12)
   - Check for CORS errors
   - Check for network errors
   - Look for 404 or 500 errors

2. **Check Server Terminal**
   - Look for error messages
   - Check if port binding failed
   - Verify DynamoDB connection

3. **Try Alternative Port**
   Edit `local-dev-server.js` and change:
   ```javascript
   const PORT = process.env.PORT || 3001; // Changed from 3000
   ```

---

## Quick Health Check

```bash
# Navigate to project
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Check all files exist
ls -l local-dev-server.js   # Should exist
ls -l package.json           # Should exist
ls -d frontend/              # Should exist
ls -d backend/               # Should exist

# Check dependencies
ls node_modules/ | wc -l     # Should show many packages

# Try starting
npm run local
```

---

## Alternative: Use Simple HTTP Server

If all else fails, use a simple HTTP server for frontend only:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/frontend
python3 -m http.server 8000
```

Then open: http://localhost:8000/pages/regions-simple.html

**Note:** This won't have backend API access, but you can test the UI.

---

## Contact Points

- **Server file:** `local-dev-server.js`
- **Package config:** `package.json`
- **Start command:** `npm run local`
- **Expected port:** 3000
- **Expected region:** us-east-1
- **Expected profile:** wizz-drivers-ghayth-dev

---

Generated: November 5, 2025
