# ✅ COMPLETE SETUP - COPY & PASTE THESE COMMANDS

## 🎯 Run These 5 Commands in Your Terminal

Open your Terminal app and run these commands **one at a time**:

---

### Command 1: Set AWS Environment (Disable Pager)
```bash
export AWS_PAGER=""
export AWS_REGION=us-east-1
export AWS_PROFILE=wizz-drivers-ghayth-dev
```

### Command 2: Create DynamoDB Table
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend && node create-regions-table.js
```

**Expected Output:**
```
🗺️  Creating WizzCentral Regions Table...
📋 Creating table: WizzCentral_Regions
✅ Table WizzCentral_Regions created successfully
⏳ Waiting for table to be active...
✅ Table is active
📝 Inserting initial Iraqi regions data...
   ✅ Added: Iraq (العراق)
   ✅ Added: Baghdad (بغداد)
   ... (11 regions total)
✅ REGIONS TABLE SETUP COMPLETE
```

### Command 3: Kill Old Server
```bash
pkill -f "node local-dev-server.js"
sleep 2
```

### Command 4: Start New Server
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform && node local-dev-server.js &
sleep 5
```

**Expected Output:**
```
🚀 WizzCentral Platform - Development Server Started
===============================================
🌐 Server running at: http://localhost:3000
📊 DynamoDB: Real AWS connection (us-east-1)
```

### Command 5: Open Safari
```bash
open -a Safari "http://localhost:3000/pages/regions.html"
```

---

## ✅ Verify It's Working

### Test 1: Check API Response
```bash
curl http://localhost:3000/api/regions | python3 -m json.tool
```

**Expected:** JSON with 11 regions (Iraq + 4 governorates + 6 districts)

### Test 2: Toggle Region Status
```bash
curl -X PATCH http://localhost:3000/api/regions/basra/toggle
```

**Expected:**
```json
{
  "success": true,
  "is_active": false,
  "message": "Region is now inactive"
}
```

### Test 3: Get Only Active Regions
```bash
curl "http://localhost:3000/api/regions?is_active=true"
```

---

## 🎨 What You'll See in Safari

After opening Safari, you should see:

### Header:
```
🗺️ Regions Management
```

### Table with Columns:
- **Region Name** (English & Arabic)
- **Governorate**
- **Status** (ACTIVE/INACTIVE badge)
- **Actions** (View, Edit, Toggle, Delete buttons)

### Sample Data:
```
Baghdad Central (بغداد المركز)  | Baghdad  | 🟢 ACTIVE   | [Actions]
Basra Downtown (البصرة وسط)      | Basra    | 🔴 INACTIVE | [Actions]
Najaf Old City (النجف القديمة)  | Najaf    | 🟢 ACTIVE   | [Actions]
```

### Key Difference from Mock Data:
✅ **Real DynamoDB data** - Changes persist!
✅ **Toggle buttons work** - Click to activate/deactivate
✅ **Add/Edit/Delete** - All changes save to DynamoDB
❌ No "Development mode: showing sample data" message

---

## 🔧 Troubleshooting

### Issue: "Table already exists" Error
**Solution:** Table was created successfully before. Continue to Command 3.

### Issue: Blank page in Safari
**Solution:** 
1. Clear Safari cache: `Cmd + Option + E`
2. Hard refresh: `Cmd + Shift + R`
3. Check console: `Cmd + Option + C` (look for red errors)

### Issue: "Connection refused"
**Solution:** Server not running. Re-run Command 4.

### Issue: Still seeing mock data
**Solution:**
1. Check server logs for errors
2. Verify table exists:
   ```bash
   aws dynamodb describe-table --table-name WizzCentral_Regions --profile wizz-drivers-ghayth-dev --region us-east-1 --query 'Table.TableStatus'
   ```
3. Should return: `"ACTIVE"`

---

## 📊 Quick API Reference

### Get All Regions:
```bash
curl http://localhost:3000/api/regions
```

### Get Governorates Only:
```bash
curl "http://localhost:3000/api/regions?level=governorate"
```

### Get Districts Under Baghdad:
```bash
curl "http://localhost:3000/api/regions?parent_id=baghdad"
```

### Add New Region:
```bash
curl -X POST http://localhost:3000/api/regions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Karbala",
    "name_ar": "كربلاء",
    "level": "governorate",
    "parent_id": "iraq",
    "coordinates": {"lat": 32.6160, "lng": 44.0250},
    "is_active": true
  }'
```

### Toggle Active Status:
```bash
curl -X PATCH http://localhost:3000/api/regions/baghdad/toggle
```

### Delete Region:
```bash
curl -X DELETE http://localhost:3000/api/regions/baghdad_karkh
```

---

## 📝 Summary

After running the 5 commands above, you will have:

✅ **DynamoDB Table:** `WizzCentral_Regions` with 11 Iraqi regions
✅ **Running Server:** Port 3000 with DynamoDB integration
✅ **Safari Browser:** Showing real regions data (not mock)
✅ **Full CRUD:** Create, Read, Update, Delete, Toggle active/inactive
✅ **Persistent Data:** All changes saved to DynamoDB

---

## 🚀 Next Steps

1. **Add More Regions:** Use the "Add Region" button in the UI
2. **Manage Active Status:** Click toggle buttons to activate/deactivate
3. **Test Hierarchy:** Add districts under governorates
4. **Check Persistence:** Refresh page, data stays!

---

**Created:** November 5, 2025
**Ready to use!** 🎉
