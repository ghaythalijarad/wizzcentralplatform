# 🚀 Quick Start - Run the Playground

## Option 1: Using npm (Recommended)

Open your terminal and run:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
npm run playground
```

## Option 2: Direct Node Command

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
node regions-api/server.js
```

## Option 3: Using the Start Script

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
./start.sh
```

---

## What You Should See

When the server starts successfully, you'll see:

```
🚀 WhizzCentral Regions API Server
=====================================
📍 Server running on: http://localhost:3000
🗺️  Playground: http://localhost:3000/mapbox-playground/index.html
📊 API: http://localhost:3000/api/regions
💚 Health: http://localhost:3000/health
=====================================
```

---

## Then Open in Browser

Visit: **http://localhost:3000**

You'll be automatically redirected to the Mapbox Geocoding Playground!

---

## What You'll See

### 🎨 Beautiful UI with:
- **Left Sidebar:**
  - Statistics (Total Regions, API Calls)
  - Search box with quick city buttons
  - Results display area
  - Saved regions list

- **Right Side:**
  - Interactive Mapbox map
  - Click anywhere to reverse geocode
  - Draw tools for custom boundaries
  - Zoom controls

### 🔍 Try This:
1. Click "Baghdad" quick search button
2. See geocoding results with coordinates
3. Click "💾 Save" on a result
4. Watch it appear in "Saved Regions" list
5. Click "📤 Export Data" to download JSON

---

## Troubleshooting

### Port 3000 is Busy?
```bash
# Find what's using it
lsof -i :3000

# Kill it (replace <PID> with the process ID)
kill -9 <PID>
```

### Server Won't Start?
```bash
# Make sure you're in the right directory
pwd
# Should show: /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Check if node is installed
node --version

# Check if the server file exists
ls -la regions-api/server.js
```

### Blank Page?
- Make sure the server is running (check terminal)
- Try refreshing the browser (Cmd+R)
- Check browser console (Cmd+Option+J)
- Visit directly: http://localhost:3000/mapbox-playground/index.html

---

## 🎉 You're Ready!

The playground is your visual tool for creating and managing delivery regions!

**Enjoy exploring! 🗺️✨**
