# Manual Driver Status Update Commands

## Option 1: Using AWS CLI (Run these commands in your terminal)

```bash
# Update the first driver (5448b458-9021-7074-7452-6110fcc1b504) to online status
aws dynamodb update-item \
    --table-name WhizzDrivers_dev \
    --key '{"driverId":{"S":"5448b458-9021-7074-7452-6110fcc1b504"}}' \
    --update-expression "SET #status = :status, availabilityStatus = :status, driverStatus = :status, statusChangedAt = :timestamp, lastStatusUpdate = :timestamp, activeOrders = :orders, updatedAt = :timestamp" \
    --expression-attribute-names '{"#status":"status"}' \
    --expression-attribute-values '{
        ":status":{"S":"online"},
        ":timestamp":{"S":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"},
        ":orders":{"N":"0"}
    }' \
    --region us-east-1

# Verify the update
aws dynamodb get-item \
    --table-name WhizzDrivers_dev \
    --key '{"driverId":{"S":"5448b458-9021-7074-7452-6110fcc1b504"}}' \
    --region us-east-1
```

## Option 2: Using DynamoDB Console (Manual)

1. Go to your DynamoDB console
2. Open WhizzDrivers_dev table  
3. Find the driver: `5448b458-9021-7074-7452-6110fcc1b504` (hamed jarad)
4. Click "Edit item"
5. Add/Update these fields:

```json
{
    "status": "online",
    "availabilityStatus": "online", 
    "driverStatus": "online",
    "activeOrders": 0,
    "statusChangedAt": "2025-09-28T16:30:00.000Z",
    "lastStatusUpdate": "2025-09-28T16:30:00.000Z",
    "statusReason": "Manual update for testing"
}
```

6. Save the item

## Option 3: Quick Test - Run this single command

```bash
# Simple one-liner to update driver status
aws dynamodb update-item --table-name WhizzDrivers_dev --key '{"driverId":{"S":"5448b458-9021-7074-7452-6110fcc1b504"}}' --update-expression "SET #status = :status, availabilityStatus = :status" --expression-attribute-names '{"#status":"status"}' --expression-attribute-values '{":status":{"S":"online"}}' --region us-east-1
```

## Expected Result

After running any of these options, you should see:
- ✅ status: "online" 
- ✅ availabilityStatus: "online"
- ✅ driverStatus: "online" (if added)
- ✅ activeOrders: 0

## Verification

Run this to check if the update worked:
```bash
aws dynamodb scan --table-name WhizzDrivers_dev --projection-expression "driverId,#name,#status,availabilityStatus,activeOrders" --expression-attribute-names '{"#name":"name","#status":"status"}' --region us-east-1
```

This driver will then be available for order assignment!
