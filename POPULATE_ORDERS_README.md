# Populate WizzOrders with Sample Data

## Quick Start

Run this script to add 20 sample orders to your `WizzOrders` DynamoDB table:

```bash
node populate-sample-orders.js
```

## What This Script Does

- Creates 20 realistic sample orders
- Uses various statuses (pending, confirmed, out for delivery, delivered, etc.)
- Includes multiple customers and businesses
- Generates realistic order items and prices
- Adds proper timestamps (within last 7 days)
- Assigns drivers to picked-up orders

## Prerequisites

1. **AWS Credentials Configured**
   ```bash
   aws configure
   ```

2. **Node.js Installed**
   ```bash
   node --version  # Should be v14 or higher
   ```

3. **AWS SDK Installed**
   ```bash
   npm install aws-sdk
   ```

## Sample Output

```
🚀 Starting to populate WizzOrders table with sample data...

✅ Created order: ORD-20251104-123 (pending) - Ahmed Hassan from Whizz Burger
✅ Created order: ORD-20251104-456 (confirmed) - Fatima Ali from Pizza Palace
✅ Created order: ORD-20251104-789 (out_for_delivery) - Omar Mohammed from Shawarma King
...

📊 Summary:
✅ Successfully created: 20 orders
❌ Failed: 0 orders
📈 Total: 20 orders

🎉 Done! Visit the Orders page to see your sample orders.
🔗 URL: https://main.d2f5oacwil9cbi.amplifyapp.com/pages/orders.html
```

## Sample Order Structure

Each order includes:

- **Order ID**: `ORD-20251104-001`
- **Customer**: Random from 8 customers
- **Business**: Random from 8 businesses
- **Status**: Random realistic status
- **Items**: 1-3 menu items
- **Total**: Calculated from items
- **Payment Method**: cash, card, or wallet
- **Delivery Address**: Iraqi addresses
- **Timestamps**: Within last 7 days
- **Driver** (if applicable): For picked up/delivery orders

## Customization

Edit `populate-sample-orders.js` to:

- Change number of orders (line 127):
  ```javascript
  const numberOfOrders = 20; // Change this
  ```

- Add more customers (line 12):
  ```javascript
  const customers = [
      { id: 'USER-001', name: 'Your Name' },
      // ... add more
  ];
  ```

- Add more businesses (line 23):
  ```javascript
  const businesses = [
      { id: 'BIZ-001', name: 'Your Business' },
      // ... add more
  ];
  ```

- Add more menu items (line 57):
  ```javascript
  const menuItems = [
      { name: 'Your Item', price: 10000 },
      // ... add more
  ];
  ```

## Troubleshooting

### Error: "Cannot find module 'aws-sdk'"

**Solution:**
```bash
npm install aws-sdk
```

### Error: "User is not authorized to perform: dynamodb:PutItem"

**Solution:** Add DynamoDB permissions to your AWS user/role:
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:PutItem",
    "dynamodb:BatchWriteItem"
  ],
  "Resource": "arn:aws:dynamodb:*:*:table/WizzOrders"
}
```

### Error: "ResourceNotFoundException: Requested resource not found"

**Solution:** Make sure the `WizzOrders` table exists in your AWS region (us-east-1 by default).

## Clear Sample Data

To remove all sample orders:

```bash
aws dynamodb scan --table-name WizzOrders \
  --projection-expression "PK,SK" \
  --filter-expression "begins_with(PK, :prefix)" \
  --expression-attribute-values '{":prefix":{"S":"ORDER#ORD-"}}' \
  | jq -r '.Items[] | "\(.PK.S) \(.SK.S)"' \
  | while read pk sk; do \
    aws dynamodb delete-item --table-name WizzOrders \
      --key "{\"PK\":{\"S\":\"$pk\"},\"SK\":{\"S\":\"$sk\"}}"; \
  done
```

Or use AWS Console to delete items manually.

## Next Steps

After running the script:

1. Open Orders Page: https://main.d2f5oacwil9cbi.amplifyapp.com/pages/orders.html
2. You should see 20 sample orders
3. Test filtering by status
4. Test search functionality
5. Try updating order statuses
6. View order details

## Integration with Real Orders

Once you have real orders coming from the WizzCustomers mobile app:

1. They will appear automatically on the Orders page
2. Sample orders can be distinguished by their Order ID prefix
3. You can keep or delete sample orders as needed

---

**Created:** November 4, 2025  
**For:** WizzCentral Platform Orders Management
