# 🎯 Quick Reference: Cognito Groups for RBAC

## ✅ Groups Created

### 8 User Groups (automatically created)

| Group | Role | Access Level | Use For |
|-------|------|--------------|---------|
| `admins` | Super Admin | 🔓 **ALL** | System administrators |
| `financial_admin` | Financial Admin | 💰 Financial + Reports | Finance team |
| `support_admin` | Support Admin | 🎧 Support + Orders | Customer support |
| `merchants_admin` | Merchants Admin | 🏪 Merchants + Regions | Business relations |
| `drivers_admin` | Drivers Admin | 🚗 Drivers + Orders | Fleet operations |
| `customers_admin` | Customers Admin | 👥 Customer management | CRM team |
| `campaigns_admin` | Campaigns Admin | 🎁 Promotions + Marketing | Marketing team |
| `reporting_view` | Read-Only | 📊 View reports only | Analysts, Executives |

---

## 🚀 Quick Start (3 Steps)

### 1. Create Groups (Run Once)
```bash
cd whizzCentralPlatform
./setup-cognito-groups.sh
```

### 2. Assign User to Group
```bash
# Single group
./assign-user-to-group.sh user@email.com financial_admin

# Multiple groups
./assign-user-to-group.sh user@email.com support_admin merchants_admin
```

### 3. Test Permissions
```bash
./test-rbac-permissions.sh user@email.com
```

---

## 📋 Common Assignments

```bash
# System Admin (full access)
./assign-user-to-group.sh admin@wizz.com admins

# Finance Manager
./assign-user-to-group.sh finance@wizz.com financial_admin

# Support Team
./assign-user-to-group.sh support@wizz.com support_admin

# Merchant Relations
./assign-user-to-group.sh merchants@wizz.com merchants_admin

# Marketing Manager
./assign-user-to-group.sh marketing@wizz.com campaigns_admin

# Financial Analyst (read-only)
./assign-user-to-group.sh analyst@wizz.com reporting_view
```

---

## 🔑 Access Matrix

### Pages Access
- **admins**: ALL PAGES ✅
- **financial_admin**: Dashboard, Financial
- **support_admin**: Dashboard, Support, Orders
- **merchants_admin**: Dashboard, Merchants, Regions, Orders
- **drivers_admin**: Dashboard, Drivers, Orders
- **customers_admin**: Dashboard, Customers
- **campaigns_admin**: Dashboard, Promotions
- **reporting_view**: Dashboard (read-only), Financial (read-only)

### Domain Permissions
- **Read + Write**: Full CRUD operations
- **Read-Only**: View data, no mutations
- **No Access**: Page/feature hidden

---

## 🧪 Test User Account

Create a test user for each role:

```bash
# Create user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username "test-finance@wizz.com" \
  --user-attributes Name=email,Value="test-finance@wizz.com" Name=email_verified,Value=true \
  --region us-east-1

# Assign to group
./assign-user-to-group.sh test-finance@wizz.com financial_admin

# Test
./test-rbac-permissions.sh test-finance@wizz.com
```

---

## 🔧 Troubleshooting

### AWS Login Required
```bash
aws sso login --profile wizz-drivers-ghayth-dev
```

### Check User's Current Groups
```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username "USERNAME" \
  --region us-east-1
```

### Remove User from Group
```bash
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username "USERNAME" \
  --group-name "group_name" \
  --region us-east-1
```

---

## 📚 Documentation

- **Full Guide**: `COGNITO_GROUPS_SETUP.md`
- **RBAC Details**: `RBAC_GUIDE.md`
- **Next Steps**: `RBAC_NEXT_STEPS.md`

---

## 🎯 Production Checklist

- [ ] Create all 8 Cognito groups
- [ ] Assign real users to appropriate groups
- [ ] Test each role's access (login + navigate)
- [ ] Verify read-only users cannot edit
- [ ] Deploy Cognito Pre Token Generation Lambda
- [ ] Remove dev header fallback in production
- [ ] Update documentation with real user emails

---

**User Pool ID**: `us-east-1_Cp9YnOQWi`  
**Region**: `us-east-1`  
**Profile**: `wizz-drivers-ghayth-dev`
