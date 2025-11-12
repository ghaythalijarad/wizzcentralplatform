# WizzCentral Platform - Cognito User Groups Setup Guide

**Generated:** November 9, 2025  
**Purpose:** Complete guide to setting up Cognito user groups for RBAC

---

## 📋 Overview

WizzCentral Platform uses AWS Cognito User Groups to implement Role-Based Access Control (RBAC). Each user is assigned to one or more groups, which map to specific roles with defined permissions.

---

## 🎯 Required Cognito Groups

### 1. **admins** (Super Admin)
- **Precedence:** 1 (highest priority)
- **Description:** Super administrators with full system access
- **Permissions:** Full read and write access to all pages and domains
- **Use Case:** System administrators, CTO, platform owners

### 2. **financial_admin**
- **Precedence:** 10
- **Description:** Financial administrators - manage commissions, fees, reports
- **Page Access:** Dashboard, Financial
- **Domain Access:**
  - Financial: Read + Write
  - Merchants: Read (for search)
- **Use Case:** Finance team, accounting managers

### 3. **support_admin**
- **Precedence:** 20
- **Description:** Support administrators - manage tickets, orders, customer service
- **Page Access:** Dashboard, Support, Orders, Merchants (read), Drivers (read), Customers (read)
- **Domain Access:**
  - Support: Read + Write
  - Orders: Read + Write
  - Merchants: Read
  - Drivers: Read
  - Customers: Read
- **Use Case:** Customer support team, support managers

### 4. **merchants_admin**
- **Precedence:** 30
- **Description:** Merchants administrators - manage businesses, regions, merchant relations
- **Page Access:** Dashboard, Merchants, Regions, Orders (read)
- **Domain Access:**
  - Merchants: Read + Write
  - Regions: Read + Write
  - Orders: Read + Write
  - Campaigns: Read
  - Financial: Read
- **Use Case:** Merchant relations team, business development

### 5. **drivers_admin**
- **Precedence:** 40
- **Description:** Drivers administrators - manage driver accounts, assignments
- **Page Access:** Dashboard, Drivers, Orders
- **Domain Access:**
  - Drivers: Read + Write
  - Orders: Read + Write
- **Use Case:** Fleet managers, driver operations

### 6. **customers_admin**
- **Precedence:** 50
- **Description:** Customers administrators - manage customer accounts, support
- **Page Access:** Dashboard, Customers
- **Domain Access:**
  - Customers: Read + Write
- **Use Case:** Customer success team, CRM managers

### 7. **campaigns_admin**
- **Precedence:** 60
- **Description:** Campaigns administrators - manage promotions, discounts, marketing
- **Page Access:** Dashboard, Promotions
- **Domain Access:**
  - Campaigns: Read + Write
- **Use Case:** Marketing team, growth managers

### 8. **reporting_view** (Read-Only)
- **Precedence:** 100 (lowest priority)
- **Description:** Read-only access to financial and analytical reports
- **Page Access:** Dashboard, Financial (read-only)
- **Domain Access:**
  - Financial: Read-Only
  - Merchants: Read
- **Use Case:** Analysts, executives, auditors

---

## 🚀 Setup Instructions

### Step 1: Create Cognito Groups

Run the automated setup script:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Make scripts executable
chmod +x setup-cognito-groups.sh
chmod +x assign-user-to-group.sh
chmod +x test-rbac-permissions.sh

# Create all groups
./setup-cognito-groups.sh
```

**Expected Output:**
```
================================================
  WizzCentral RBAC - Cognito Groups Setup
================================================

Configuration:
  User Pool ID: us-east-1_Cp9YnOQWi
  Region: us-east-1
  Profile: wizz-drivers-ghayth-dev

🔐 Verifying AWS credentials...
✅ AWS credentials verified

================================================
  Creating User Groups
================================================

📋 Creating group: admins
   ✅ Created: admins
📋 Creating group: financial_admin
   ✅ Created: financial_admin
...
✅ Cognito Groups Setup Complete!
```

### Step 2: Assign Users to Groups

**Single Group Assignment:**
```bash
./assign-user-to-group.sh admin@wizz.com admins
```

**Multiple Groups Assignment:**
```bash
./assign-user-to-group.sh support@wizz.com support_admin merchants_admin
```

**Common Assignments:**
```bash
# System Admin
./assign-user-to-group.sh admin@wizz.com admins

# Finance Manager
./assign-user-to-group.sh finance@wizz.com financial_admin

# Support Team Lead (needs support + merchant read)
./assign-user-to-group.sh support-lead@wizz.com support_admin merchants_admin

# Merchant Relations Manager
./assign-user-to-group.sh merchants@wizz.com merchants_admin

# Driver Operations Manager
./assign-user-to-group.sh drivers@wizz.com drivers_admin

# Marketing Manager
./assign-user-to-group.sh marketing@wizz.com campaigns_admin

# Financial Analyst (read-only)
./assign-user-to-group.sh analyst@wizz.com reporting_view
```

### Step 3: Test User Permissions

```bash
./test-rbac-permissions.sh admin@wizz.com
```

**Expected Output:**
```
================================================
  RBAC Permissions Test
================================================

  User: admin@wizz.com

✅ Found user: abc123-def456

📋 User's Cognito Groups:
  • admins

================================================
  Computed Permissions
================================================

📊 Mapped Roles:
  • admin (SUPERUSER - ALL ACCESS)

🔓 Page Access:
  ✅ ALL PAGES (admin access)

📝 Domain Permissions:
  ✅ Financial: Read + Write
  ✅ Campaigns: Read + Write
  ✅ Regions: Read + Write
  ...
```

---

## 🔧 Manual Setup (AWS Console)

If you prefer using the AWS Console:

1. **Navigate to Cognito:**
   - Open AWS Console
   - Go to Cognito → User Pools
   - Select: `us-east-1_Cp9YnOQWi`

2. **Create Groups:**
   - Click "Groups" tab
   - Click "Create group"
   - Enter details from table above
   - Set precedence (lower = higher priority)

3. **Assign Users:**
   - Click "Users" tab
   - Select a user
   - Click "Add user to group"
   - Select group(s)
   - Click "Add"

---

## 📊 Permission Matrix

| Role | Dashboard | Financial | Orders | Merchants | Regions | Drivers | Customers | Promotions | Support |
|------|-----------|-----------|--------|-----------|---------|---------|-----------|------------|---------|
| **admin** | ✅ R+W | ✅ R+W | ✅ R+W | ✅ R+W | ✅ R+W | ✅ R+W | ✅ R+W | ✅ R+W | ✅ R+W |
| **financial_admin** | ✅ R | ✅ R+W | ❌ | 🔍 R | ❌ | ❌ | ❌ | ❌ | ❌ |
| **support_admin** | ✅ R | ❌ | ✅ R+W | 🔍 R | ❌ | 🔍 R | 🔍 R | ❌ | ✅ R+W |
| **merchants_admin** | ✅ R | 🔍 R | ✅ R+W | ✅ R+W | ✅ R+W | ❌ | ❌ | 🔍 R | ❌ |
| **drivers_admin** | ✅ R | ❌ | ✅ R+W | ❌ | ❌ | ✅ R+W | ❌ | ❌ | ❌ |
| **customers_admin** | ✅ R | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ R+W | ❌ | ❌ |
| **campaigns_admin** | ✅ R | ❌ | ❌ | 🔍 R | ❌ | ❌ | ❌ | ✅ R+W | ❌ |
| **reporting_view** | ✅ R | 📊 R | ❌ | 🔍 R | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ R+W = Full read and write access
- 📊 R = Read-only access
- 🔍 R = Read access (for search/reference)
- ❌ = No access

---

## 🔐 Security Best Practices

### 1. **Principle of Least Privilege**
- Assign only the minimum groups needed for each user's role
- Use `reporting_view` for users who only need to view data
- Avoid assigning `admins` group unless absolutely necessary

### 2. **Multi-Group Strategy**
- Users can belong to multiple groups for cross-functional roles
- Example: Support lead may need `support_admin` + `merchants_admin` (read)

### 3. **Regular Audits**
```bash
# List all users and their groups
aws cognito-idp list-users \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --query 'Users[*].[Username,Attributes[?Name==`email`].Value|[0]]' \
  --output table
```

### 4. **Group Naming Convention**
- Keep group names lowercase with underscores
- Groups map 1:1 to RBAC roles in backend
- Do NOT rename groups after deployment (breaks mappings)

---

## 🧪 Testing Workflow

### 1. **Create Test Users**
```bash
# Financial admin test user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username "test-finance@wizz.com" \
  --user-attributes Name=email,Value="test-finance@wizz.com" Name=email_verified,Value=true \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev

# Assign to group
./assign-user-to-group.sh test-finance@wizz.com financial_admin
```

### 2. **Login and Test**
```bash
# Start dev server
npm run local

# Open browser
open http://localhost:3000

# Login with test user credentials
# Check access to financial page
# Verify read-only for reporting_view
```

### 3. **Verify API Permissions**
```bash
# Test with curl (simulate Cognito token)
curl -X GET http://localhost:3000/api/permissions \
  -H "x-user-roles: financial_admin" \
  -H "x-user-email: test-finance@wizz.com"
```

---

## 🔄 Common Operations

### Add User to Group
```bash
./assign-user-to-group.sh user@example.com group_name
```

### Remove User from Group
```bash
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username "USERNAME" \
  --group-name "group_name" \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev
```

### List User's Groups
```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username "USERNAME" \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev
```

### Delete a Group
```bash
aws cognito-idp delete-group \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --group-name "group_name" \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev
```

---

## 📝 Group Mapping Reference

**Backend Mapping (local-dev-server.js):**
```javascript
function mapGroupsToRoles(groups = []) {
    const map = new Map([
        ['admins','admin'],
        ['financial_admin','financial_admin'],
        ['support_admin','support_admin'],
        ['merchants_admin','merchants_admin'],
        ['drivers_admin','drivers_admin'],
        ['customers_admin','customers_admin'],
        ['campaigns_admin','campaigns_admin'],
        ['reporting_view','reporting_view']
    ]);
    // ...
}
```

**Frontend Detection (assets/js/rbac.js):**
```javascript
// Automatically fetches user's roles from /api/me
await RBAC.fetchMe();
const roles = state.me.roles; // ['financial_admin']
```

---

## 🚨 Troubleshooting

### Issue: User has no access after group assignment
**Solution:**
1. Verify group exists: `aws cognito-idp get-group --user-pool-id us-east-1_Cp9YnOQWi --group-name GROUP_NAME`
2. Check user is in group: `./test-rbac-permissions.sh user@email.com`
3. Force user to re-login (token needs refresh)
4. Clear browser cache/cookies

### Issue: Script fails with "not authorized"
**Solution:**
```bash
aws sso login --profile wizz-drivers-ghayth-dev
```

### Issue: Group already exists
**Expected:** Script will show warning but continue. This is normal.

### Issue: Read-only user can still see write buttons
**Check:**
1. Verify `data-write-only` attributes on buttons
2. Check `navigation.js` is loaded
3. Verify RBAC scripts are not blocked by CORS
4. Check browser console for errors

---

## 📞 Support

For issues or questions:
1. Check `RBAC_GUIDE.md` for detailed RBAC documentation
2. Review `RBAC_NEXT_STEPS.md` for pending enhancements
3. Test permissions: `./test-rbac-permissions.sh <email>`
4. Check audit logs: `/api/financial-audit` endpoint

---

**Last Updated:** November 9, 2025  
**Related Files:**
- `setup-cognito-groups.sh`
- `assign-user-to-group.sh`
- `test-rbac-permissions.sh`
- `RBAC_GUIDE.md`
- `RBAC_NEXT_STEPS.md`
