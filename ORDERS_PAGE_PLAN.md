# Orders Page Implementation Plan

## Current WizzOrders Table Schema

Based on the DynamoDB table scan, here are the key fields available:

### Order Identification
- `PK` (String) - ORDER#uuid format
- `SK` (String) - META (metadata)

### Customer Information
- `customerName` - Customer's full name
- `customerPhone` - Phone number with country code
- `createdBy` - Origin (wizzuser_app)

### Order Timeline (Status Tracking)
- `createdAt` - Order creation timestamp
- `confirmedAt` - Merchant confirmation
- `assignedAt` - Driver assignment
- `deliveredAt` - Delivery completion
- `canceledAt` - Cancellation timestamp
- `canceledBy` - Who canceled the order
- `cancelReason` - Reason for cancellation

### Payment Information
- `currency` - Payment currency (IQD)
- `authorizedAt` - Payment authorization
- `capturedAt` - Payment captured
- `cashReceived` - Cash amount received (for COD)
- `changeGiven` - Change returned to customer
- `codCollectedAt` - COD collection timestamp

### Assignment & Fulfillment
- `collectorId` - Assigned driver/collector ID
- `channel` - Order source (android, ios, web)

## Recommended Table Columns

For the orders management interface, display these columns:

1. **Order ID** (truncated) - First 8 chars of ORDER# ID
2. **Customer** - Name + Phone
3. **Status** - Derived from timeline fields
4. **Channel** - android/ios/web with icon
5. **Created** - Formatted creation date/time
6. **Payment** - Currency + COD status
7. **Driver** - collectorId if assigned
8. **Actions** - View/Edit/Cancel buttons

## Status Determination Logic

```javascript
function determineOrderStatus(order) {
    if (order.deliveredAt) return 'delivered';
    if (order.canceledAt) return 'cancelled';
    if (order.assignedAt && order.collectorId) return 'out_for_delivery';
    if (order.assignedAt) return 'ready_for_pickup';
    if (order.confirmedAt) return 'preparing';
    if (order.createdAt) return 'pending';
    return 'unknown';
}
```

## Key Tracking Information

### Order Card/Detail View Should Show:
1. **Timeline Progress**
   - Created → Confirmed → Assigned → Delivered
   - Show timestamp for each stage
   
2. **Payment Status**
   - Authorized/Captured status
   - COD collection status
   - Cash received vs change given

3. **Assignment Details**
   - Driver ID (collectorId)
   - Assignment timestamp
   - Delivery completion time

4. **Cancellation Info** (if applicable)
   - Who canceled (customer/merchant/admin)
   - Reason for cancellation
   - Timestamp

## Next Steps

1. Update HTML table structure with proper columns
2. Update JavaScript data transformation
3. Add status derivation logic
4. Create detailed order view modal
5. Add real-time status updates
