# 🚨 TROUBLESHOOTING: Safari Can't Open Page

**Problem:** Safari cannot open `http://localhost:3000/pages/regions-toggle.html`  
**Root Cause:** Server is not running

---

## ✅ SOLUTION: Follow These Steps

### **Step 1: Check if Server is Running**

Open a **NEW terminal** and run:

```bash
lsof -ti:3000
```

**Expected Output:**
- If you see a number (PID): ✅ Server is running → Skip to Step 4
- If you see nothing: ❌ Server is not running → Continue to Step 2

---

### **Step 2: Start the Server (Choose ONE method)**

#### **Method A: Using VS Code Task (Recommended)**

1. In VS Code, go to: **Terminal → Run Task**
2. Select: **"Start Local Dev Server"**
3. Wait 5-10 seconds
4. You should see output like:
   ```
   🚀 WhizzCentral Local Development Server
   📂 Serving static files from: .../frontend
   🌐 Server running at: http://localhost:3000
   ```

#### **Method B: Using Terminal**

Open a **NEW terminal** and run:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
npm run local
```

Keep this terminal open! Don't close it.

---

### **Step 3: Wait for Server to Start**

Give it 10 seconds to fully start. You should see messages like:

```
✅ Loaded regions
🌐 Server running at: http://localhost:3000
📡 API Port: 3001
```

---

### **Step 4: Test the Server**

Open a **NEW terminal** and run:

```bash
curl http://localhost:3000/health
```

**Expected Output:** JSON with server status

```bash
curl http://localhost:3000/api/regions | head -50
```

**Expected Output:** JSON with regions data

---

### **Step 5: Open Safari**

Now that the server is running, open Safari:

```bash
open -a Safari "http://localhost:3000/pages/regions-toggle.html"
```

**OR** manually open Safari and go to:
```
http://localhost:3000/pages/regions-toggle.html
```

---

## 🐛 IF STILL NOT WORKING

### **Check for Errors**

1. **Look at the server terminal output** - Are there any red error messages?

2. **Common errors:**

   **Error: Port 3000 already in use**
   ```bash
   # Kill the old process
   lsof -ti:3000 | xargs kill -9
   
   # Start again
   npm run local
   ```

   **Error: Cannot find module**
   ```bash
   # Reinstall dependencies
   npm install
   
   # Start again
   npm run local
   ```

   **Error: AWS credentials**
   ```bash
   # Set AWS profile
   export AWS_PROFILE=wizz-drivers-ghayth-dev
   export AWS_REGION=us-east-1
   
   # Start again
   npm run local
   ```

---

## 📊 VERIFY DYNAMODB DATA

While troubleshooting, let's also check if DynamoDB has the data:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

export AWS_PAGER=""
export AWS_REGION=us-east-1
export AWS_PROFILE=wizz-drivers-ghayth-dev

# Check table exists and count items
aws dynamodb scan --table-name WizzCentral_Regions --select "COUNT" --query 'Count' --output text
```

**Expected:** Should show `25` or similar (number of regions)

If it shows `0` or errors, the table is empty. Run:

```bash
cd backend
node create-regions-table.js --force-populate
cd ..
```

---

## 🎯 QUICK COMMANDS SUMMARY

### Kill and restart server:
```bash
lsof -ti:3000 | xargs kill -9
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
npm run local
```

### Test server:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/regions | jq 'length'
```

### Open UI:
```bash
open -a Safari "http://localhost:3000/pages/regions-toggle.html"
```

### Check DynamoDB:
```bash
export AWS_PAGER="" AWS_REGION=us-east-1 AWS_PROFILE=wizz-drivers-ghayth-dev
aws dynamodb scan --table-name WizzCentral_Regions --select "COUNT" --query 'Count' --output text
```

---

## ✅ SUCCESS CHECKLIST

Once everything is working, you should see:

- [ ] Server running (check with `lsof -ti:3000`)
- [ ] Health endpoint responds (`curl http://localhost:3000/health`)
- [ ] API returns regions (`curl http://localhost:3000/api/regions`)
- [ ] DynamoDB has data (25+ regions)
- [ ] Safari opens the page successfully
- [ ] Toggle UI shows all 18 governorates
- [ ] Toggle switches work (click to activate/deactivate)

---

## 🆘 STILL STUCK?

**Share this information:**

1. Output of: `lsof -ti:3000`
2. Last 20 lines of server output
3. Output of: `curl http://localhost:3000/health`
4. Any error messages from the server terminal

---

**Start with Step 1 above and work through each step!** 🚀
