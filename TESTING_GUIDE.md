# 🧪 Testing Guide - Regions V2 System

Complete guide for testing the new Regions Management System V2.

---

## 📋 Test Checklist

### ✅ Phase 1: Basic System Tests
- [ ] Install dependencies
- [ ] Start API server
- [ ] Access playground UI
- [ ] Verify file storage
- [ ] Test health endpoint

### ✅ Phase 2: API Endpoint Tests
- [ ] Create single region
- [ ] Get all regions
- [ ] Get single region
- [ ] Update region
- [ ] Delete region
- [ ] Bulk import regions
- [ ] Export regions

### ✅ Phase 3: DynamoDB Tests
- [ ] Test DynamoDB connection
- [ ] Verify dual storage (file + DynamoDB)
- [ ] Test bulk import to DynamoDB
- [ ] Verify data consistency

### ✅ Phase 4: UI/Playground Tests
- [ ] Search Iraqi cities
- [ ] View geocoding results
- [ ] Save regions from UI
- [ ] Delete regions from UI
- [ ] Export data
- [ ] View statistics

---

## 🚀 Quick Test Commands

### 1. Install Dependencies
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
npm install
```

### 2. Start API Server (File Storage Only)
```bash
npm run playground
# OR
./start.sh
```

### 3. Start API Server (With DynamoDB)
```bash
./start-with-dynamodb.sh
```

### 4. Test DynamoDB Connection
```bash
# Set AWS credentials first
export AWS_PROFILE=wizz-drivers-ghayth-dev
export AWS_REGION=us-east-1
export DYNAMODB_TABLE=WizzOrders-Regions-ghayth-dev

# Run test
node test-dynamodb-connection.js
```

### 5. Test API Endpoints
```bash
# Start server in one terminal
npm run playground

# Run tests in another terminal
./test-regions-api.sh
```

---

## 📝 Manual Testing Steps

### Test 1: Health Check
```bash
curl http://localhost:3000/health | jq
```

**Expected Output:**
```json
{
  "status": "healthy",
  "storage": {
    "file": "enabled",
    "dynamodb": "enabled" // or "disabled"
  },
  "dataFile": "data/regions.json",
  "timestamp": "2025-11-05T..."
}
```

### Test 2: Create a Region
```bash
curl -X POST http://localhost:3000/api/regions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Baghdad",
    "nameAr": "بغداد",
    "type": "governorate",
    "coordinates": {"lat": 33.3152, "lng": 44.3661},
    "delivery": {
      "enabled": true,
      "radius": 50000,
      "minOrderValue": 10000,
      "deliveryFee": 2000
    },
    "status": "active"
  }' | jq
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Region created successfully",
  "region": {
    "id": "reg_...",
    "name": "Baghdad",
    "nameAr": "بغداد",
    ...
  },
  "savedTo": {
    "file": true,
    "dynamodb": true  // if DynamoDB enabled
  }
}
```

### Test 3: Get All Regions
```bash
curl http://localhost:3000/api/regions | jq
```

**Expected Output:**
```json
{
  "success": true,
  "regions": [...],
  "summary": {
    "total": 1,
    "active": 1,
    "inactive": 0,
    "byType": {
      "governorate": 1
    }
  }
}
```

### Test 4: Update a Region
```bash
# Get region ID first
REGION_ID=$(curl -s http://localhost:3000/api/regions | jq -r '.regions[0].id')

# Update it
curl -X PUT http://localhost:3000/api/regions/$REGION_ID \
  -H "Content-Type: application/json" \
  -d '{
    "delivery": {
      "enabled": true,
      "radius": 50000,
      "minOrderValue": 10000,
      "deliveryFee": 3000
    }
  }' | jq
```

### Test 5: Delete a Region
```bash
REGION_ID=$(curl -s http://localhost:3000/api/regions | jq -r '.regions[0].id')
curl -X DELETE http://localhost:3000/api/regions/$REGION_ID | jq
```

### Test 6: Bulk Import
```bash
curl -X POST http://localhost:3000/api/regions/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "regions": [
      {
        "name": "Baghdad",
        "nameAr": "بغداد",
        "type": "governorate",
        "coordinates": {"lat": 33.3152, "lng": 44.3661},
        "status": "active"
      },
      {
        "name": "Basra",
        "nameAr": "البصرة",
        "type": "governorate",
        "coordinates": {"lat": 30.5085, "lng": 47.7835},
        "status": "active"
      }
    ]
  }' | jq
```

---

## 🗄️ DynamoDB Testing

### Prerequisites
1. AWS credentials configured
2. DynamoDB table exists
3. IAM permissions set

### Test Connection
```bash
# Method 1: Use test script
export AWS_PROFILE=wizz-drivers-ghayth-dev
node test-dynamodb-connection.js

# Method 2: Manual AWS CLI test
aws dynamodb describe-table \
  --table-name WizzOrders-Regions-ghayth-dev \
  --profile wizz-drivers-ghayth-dev
```

### Verify Dual Storage
```bash
# Start server with DynamoDB
./start-with-dynamodb.sh

# Create a region
curl -X POST http://localhost:3000/api/regions \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "type": "governorate", "coordinates": {"lat": 33.3, "lng": 44.3}, "status": "active"}'

# Check file storage
cat data/regions.json | jq

# Check DynamoDB
aws dynamodb scan \
  --table-name WizzOrders-Regions-ghayth-dev \
  --profile wizz-drivers-ghayth-dev \
  --max-items 5
```

---

## 🎨 UI/Playground Testing

### 1. Open Playground
```bash
npm run playground
# Open browser: http://localhost:3000
```

### 2. Test Search
- Click "Baghdad" quick button
- Observe search results
- Check map marker placement
- Verify coordinates display

### 3. Test Save Region
- Enter region details
- Click "Save Region"
- Check "Saved Regions" list
- Verify it appears

### 4. Test Delete Region
- Find region in saved list
- Click delete button
- Confirm deletion
- Verify it's removed

### 5. Test Export
- Click "Export JSON" button
- Check downloaded file
- Verify data format

---

## 📊 Performance Testing

### Load Test (Multiple Regions)
```bash
# Create 100 regions
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/regions \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Test Region $i\", \"type\": \"district\", \"coordinates\": {\"lat\": 33.$i, \"lng\": 44.$i}, \"status\": \"active\"}" \
    > /dev/null 2>&1
done

# Check performance
time curl http://localhost:3000/api/regions > /dev/null
```

---

## 🐛 Troubleshooting

### Issue: API Server Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 $(lsof -t -i:3000)

# Restart server
npm run playground
```

### Issue: DynamoDB Connection Failed
```bash
# Verify credentials
aws sts get-caller-identity --profile wizz-drivers-ghayth-dev

# Verify table exists
aws dynamodb list-tables --profile wizz-drivers-ghayth-dev

# Check table details
aws dynamodb describe-table \
  --table-name WizzOrders-Regions-ghayth-dev \
  --profile wizz-drivers-ghayth-dev
```

### Issue: File Storage Not Working
```bash
# Check data directory
ls -la data/

# Check permissions
chmod 755 data/
touch data/regions.json

# Check file contents
cat data/regions.json
```

### Issue: CORS Errors in Browser
The API server has CORS enabled by default. If you still see errors:
```javascript
// In regions-api/server.js, CORS is configured as:
app.use(cors());
```

---

## ✅ Success Criteria

### All Tests Pass When:
- ✅ API server starts without errors
- ✅ Health endpoint returns 200
- ✅ CRUD operations work correctly
- ✅ Bulk import succeeds
- ✅ File storage persists data
- ✅ DynamoDB saves data (if enabled)
- ✅ UI loads and displays correctly
- ✅ Search returns valid results
- ✅ Export generates valid JSON

---

## 📈 Next Steps After Testing

1. **Deploy to Production**
   - Set production environment variables
   - Configure production DynamoDB table
   - Deploy API server

2. **Build Iraqi Regions Dataset**
   - 18 Governorates
   - 50+ Districts
   - 100+ Neighborhoods
   - Validate coordinates

3. **Integrate with Apps**
   - WhizzDrivers Flutter app
   - WhizzMerchants Flutter app
   - WhizzCustomers Flutter app

4. **Monitor & Optimize**
   - Add CloudWatch metrics
   - Set up error alerts
   - Optimize query performance

---

## 📞 Support

If tests fail or you encounter issues:
1. Check server logs in terminal
2. Review `TROUBLESHOOTING.md` (if exists)
3. Verify AWS credentials and permissions
4. Check network connectivity
5. Ensure all dependencies are installed

---

**Last Updated:** November 5, 2025  
**System Version:** V2.0  
**Status:** Ready for Testing
