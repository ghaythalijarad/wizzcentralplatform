# Financial Management System - Quick Start Guide (Updated)

## 🚀 Getting Started

Provision tables, start the server, create rules, run calculations, and generate reports.

---

## 1. Create DynamoDB Tables

```bash
node create-financial-tables.js
```

Tables:

- WizzCentral_Commission_Rules
- WizzCentral_Delivery_Fee_Rules
- WizzCentral_Financial_Transactions
- WizzCentral_Financial_Audit
- WizzCentral_Financial_Settings

---

## 2. (Optional) Seed Sample Rules

```bash
node setup-financial-system.js
```

---

## 3. Start / Restart Dev Server

```bash
npm run local
```

Or use VS Code task: Restart Local Dev Server.

---

## 4. Open UI

<http://localhost:3000/financial-management.html>

---

## 5. Create Commission Rule

Use merchant search to select a merchant, set non-overlapping effective window, choose type and priority, then submit.

---

## 6. Delivery Fee Rule

Add region/service type rule with base/perKm, min/max caps, free threshold.

---

## 7. Persist Settings

Update and save settings; stored in WizzCentral_Financial_Settings.

```bash
GET  /api/financial-settings
PATCH /api/financial-settings
```

Payload example:

```json
{
  "defaultCurrency": "IQD",
  "taxRate": 0,
  "autoCalculateCommission": true,
  "dynamicDeliveryFees": true
}
```

---

## 8. Generate Reports

Use Reports tab (optionally merchantId). API examples:

```bash
GET /api/financial-reports/summary?startDate=2025-10-01&endDate=2025-11-09
GET /api/financial-reports/commission?startDate=2025-10-01&endDate=2025-11-09&merchantId=business_XXXX
GET /api/financial-reports/delivery-fees?startDate=2025-10-01&endDate=2025-11-09
```

---

## 9. Audit Logs

Query audit with filters:

```bash
GET /api/financial-audit?entityType=commission_rule&startTime=0&endTime=9999999999999
GET /api/financial-audit?actionType=create&startTime=0&endTime=9999999999999
```

---

## 10. Commission Calculation

```bash
curl -X POST http://localhost:3000/api/commissions/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "orderData": {
      "totalAmount": 50000,
      "merchantId": "business_1756855226821_cshyb2wugda",
      "orderId": "TEST_001"
    }
  }'
```

---

## 11. Delivery Fee Calculation

```bash
curl -X POST http://localhost:3000/api/delivery-fees/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryData": {
      "distance": 3.5,
      "orderValue": 30000,
      "regionId": "REG_IQ_NJF",
      "serviceType": "standard"
    }
  }'
```

---

## 12. Sample Rule Tables

Commission (example):

| Name | Type | Rate | Merchant | Active | Priority |
|------|------|------|----------|--------|----------|
| Standard Merchant Commission | percentage | 15% | سنونو | true | 1 |

Delivery Fee (example):

| Name | Type | Region | Base | /Km | Min | Max | Active |
|------|------|--------|------|-----|-----|-----|--------|
| Baghdad Standard | distance_based | REG_IQ_BGD | 2000 | 250 | 1500 | 8000 | true |

---

## 13. Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| AWS credentials error | Expired SSO | aws sso login --profile wizz-drivers-ghayth-dev |
| Missing tables | Not provisioned | node create-financial-tables.js |
| No commission rule | None active / overlapping avoided | Create active non-overlapping rule |
| Index missing | GSI not yet deployed | Fallback Scan auto-applied |

---

## 14. Notes

- isActive stored as string 'true'/'false' for GSI compatibility.
- Overlap prevention enforced for active commission windows per merchant.
- Reports filter by merchantId post-scan (optimize later with GSI on transactions).

---

## ✅ Success Criteria

- CRUD for commission & delivery fee rules works
- Calculations produce expected amounts
- Settings persist and reload
- Audit endpoint returns entries
- Reports generate for ranges

---

Last Updated: 2025-11-09
