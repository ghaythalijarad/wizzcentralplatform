# 🚀 START SERVER & OPEN IN SAFARI

## ⚡ QUICK START (One Command)

**Copy and paste this into your Terminal:**

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform && ./LAUNCH_SAFARI.sh
```

This will:
1. ✅ Kill any old server processes
2. ✅ Check dependencies
3. ✅ Start the Node.js server
4. ✅ Verify it's running
5. ✅ Open Safari automatically at the regions page

---

## 🔧 Alternative: Manual Steps

If the script doesn't work, follow these steps manually:

### Step 1: Kill old processes
```bash
pkill -f "node local-dev-server.js"
lsof -ti:3000 | xargs kill -9
```

### Step 2: Navigate to project
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
```

### Step 3: Start server
```bash
node local-dev-server.js
```

Keep this terminal window open! The server will show logs.

### Step 4: Open Safari
In a **new terminal window**, run:
```bash
open -a Safari http://localhost:3000/pages/regions.html
```

---

## 🌐 URLs to Access

| Page | URL |
|------|-----|
| **Regions** (Main) | http://localhost:3000/pages/regions.html |
| Dashboard | http://localhost:3000/pages/dashboard.html |
| Orders | http://localhost:3000/pages/orders.html |
| API Test | http://localhost:3000/api/regions |

---

## 🐛 Troubleshooting

### Blank Page in Safari?

1. **Clear Safari Cache:**
   - Press `Cmd + Option + E` (Empty Caches)
   - Or: Safari → Settings → Privacy → Manage Website Data → Remove All

2. **Hard Refresh:**
   - Press `Cmd + Shift + R`

3. **Check Console for Errors:**
   - Press `Cmd + Option + C` (Open Console)
   - Look for red error messages

4. **Disable Extensions:**
   - Safari → Settings → Extensions
   - Temporarily disable all extensions

### Server Not Starting?

```bash
# Check if port 3000 is in use
lsof -i:3000

# Check Node.js version (should be v14+)
node --version

# Check for syntax errors
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
node -c local-dev-server.js

# Check dependencies
ls node_modules
# If empty, run: npm install
```

### "Connection Refused" Error?

```bash
# Verify server is actually running
ps aux | grep local-dev-server

# Check what's on port 3000
lsof -i:3000

# Try accessing via curl
curl http://localhost:3000/api/regions
```

---

## 🛑 Stop the Server

```bash
pkill -f "node local-dev-server.js"
```

Or press `Ctrl + C` in the terminal where the server is running.

---

## 📊 Check Server Status

```bash
# Is server running?
lsof -i:3000

# View server process
ps aux | grep local-dev-server

# Test API endpoint
curl http://localhost:3000/api/regions
```

---

## ✅ Expected Result

When you open Safari, you should see:

```
🗺️ Regions Management
- Material 3 Design interface
- Interactive map with Leaflet
- Table view with regions data
- Add/Edit/Delete buttons
- Search and filters
```

---

**Created:** November 5, 2025  
**Location:** `/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/`
