# 🚀 Cognito Groups - Usage Examples & Common Tasks

This guide provides practical examples for managing Cognito User Groups and user assignments.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Creating Test Users](#creating-test-users)
3. [Assigning Users to Groups](#assigning-users-to-groups)
4. [Testing Permissions](#testing-permissions)
5. [Common Scenarios](#common-scenarios)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Step 1: Verify Groups are Created

```bash
aws cognito-idp list-groups \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager
```

### Step 2: List Existing Users

```bash
aws cognito-idp list-users \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager
```

### Step 3: Assign User to Group

```bash
./assign-user-to-group.sh user@example.com admins
```

---

## 👤 Creating Test Users

### Create a Super Admin User

```bash
# Create the user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username admin@wizz.com \
  --user-attributes \
    Name=email,Value=admin@wizz.com \
    Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username admin@wizz.com \
  --password "YourSecurePassword123!" \
  --permanent \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager

# Assign to admins group
./assign-user-to-group.sh admin@wizz.com admins
```

### Create a Financial Admin User

```bash
# Create user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username finance@wizz.com \
  --user-attributes \
    Name=email,Value=finance@wizz.com \
    Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager

# Set password
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username finance@wizz.com \
  --password "SecureFinance123!" \
  --permanent \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager

# Assign to financial_admin group
./assign-user-to-group.sh finance@wizz.com financial_admin
```

### Create a Support Admin User

```bash
# Create user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username support@wizz.com \
  --user-attributes \
    Name=email,Value=support@wizz.com \
    Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager

# Set password
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username support@wizz.com \
  --password "SecureSupport123!" \
  --permanent \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager

# Assign to support_admin group
./assign-user-to-group.sh support@wizz.com support_admin
```

### Batch Create All Test Users

```bash
#!/bin/bash
# Create all test users at once

USERS=(
  "admin@wizz.com:admins"
  "finance@wizz.com:financial_admin"
  "support@wizz.com:support_admin"
  "merchants@wizz.com:merchants_admin"
  "drivers@wizz.com:drivers_admin"
  "customers@wizz.com:customers_admin"
  "campaigns@wizz.com:campaigns_admin"
  "reports@wizz.com:reporting_view"
)

for user_group in "${USERS[@]}"; do
  IFS=':' read -r email group <<< "$user_group"
  
  echo "Creating $email..."
  
  # Create user
  aws cognito-idp admin-create-user \
    --user-pool-id us-east-1_Cp9YnOQWi \
    --username "$email" \
    --user-attributes Name=email,Value="$email" Name=email_verified,Value=true \
    --message-action SUPPRESS \
    --profile wizz-drivers-ghayth-dev \
    --region us-east-1 \
    --no-cli-pager 2>/dev/null || echo "  Already exists"
  
  # Set password
  aws cognito-idp admin-set-user-password \
    --user-pool-id us-east-1_Cp9YnOQWi \
    --username "$email" \
    --password "Test123!" \
    --permanent \
    --profile wizz-drivers-ghayth-dev \
    --region us-east-1 \
    --no-cli-pager 2>/dev/null
  
  # Assign to group
  ./assign-user-to-group.sh "$email" "$group"
  
  echo ""
done

echo "✅ All test users created!"
```

---

## 🔐 Assigning Users to Groups

### Single Group Assignment

```bash
# Assign user to one group
./assign-user-to-group.sh user@example.com financial_admin
```

### Multiple Groups Assignment

```bash
# Assign user to multiple groups
./assign-user-to-group.sh user@example.com support_admin merchants_admin
```

### Direct AWS CLI Assignment

```bash
# Get username first
USERNAME=$(aws cognito-idp list-users \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --filter "email = \"user@example.com\"" \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager \
  --query 'Users[0].Username' \
  --output text)

# Assign to group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username "$USERNAME" \
  --group-name financial_admin \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager
```

### Remove User from Group

```bash
# Get username
USERNAME=$(aws cognito-idp list-users \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --filter "email = \"user@example.com\"" \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager \
  --query 'Users[0].Username' \
  --output text)

# Remove from group
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username "$USERNAME" \
  --group-name financial_admin \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager
```

---

## 🧪 Testing Permissions

### Test User Permissions

```bash
# Test what a user can access
./test-rbac-permissions.sh user@example.com
```

### Check User's Current Groups

```bash
# Get username
USERNAME=$(aws cognito-idp list-users \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --filter "email = \"user@example.com\"" \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager \
  --query 'Users[0].Username' \
  --output text)

# List groups
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username "$USERNAME" \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager
```

### Test Login in Browser

1. Start your local dev server:
   ```bash
   npm run local
   ```

2. Open browser to `http://localhost:3000`

3. Login with test user credentials

4. Check the browser console for JWT token claims:
   ```javascript
   // In browser console
   const token = localStorage.getItem('idToken');
   const claims = JSON.parse(atob(token.split('.')[1]));
   console.log('Cognito Groups:', claims['cognito:groups']);
   console.log('Custom Roles:', claims['custom:roles']);
   ```

---

## 📚 Common Scenarios

### Scenario 1: New Employee Onboarding

**Role:** Financial Analyst (needs read-only financial access)

```bash
# Create user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username analyst@wizz.com \
  --user-attributes Name=email,Value=analyst@wizz.com Name=email_verified,Value=true \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager

# Assign to reporting_view group (read-only)
./assign-user-to-group.sh analyst@wizz.com reporting_view

# Test permissions
./test-rbac-permissions.sh analyst@wizz.com
```

### Scenario 2: Promoting User to Admin

**Upgrade:** Support Admin → Full Admin

```bash
# Add to admins group (keeps existing group memberships)
./assign-user-to-group.sh support@wizz.com admins

# Verify
./test-rbac-permissions.sh support@wizz.com
```

### Scenario 3: Cross-Functional Role

**Role:** Support lead who also manages merchants

```bash
# Assign to multiple groups
./assign-user-to-group.sh lead@wizz.com support_admin merchants_admin

# Test combined permissions
./test-rbac-permissions.sh lead@wizz.com
```

### Scenario 4: Temporary Access

**Grant temporary financial access to a support admin**

```bash
# Add financial_admin temporarily
./assign-user-to-group.sh support@wizz.com financial_admin

# Later, remove it
USERNAME=$(aws cognito-idp list-users \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --filter "email = \"support@wizz.com\"" \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager \
  --query 'Users[0].Username' \
  --output text)

aws cognito-idp admin-remove-user-from-group \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username "$USERNAME" \
  --group-name financial_admin \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager
```

### Scenario 5: Employee Offboarding

**Remove all access from departing employee**

```bash
EMAIL="departing@wizz.com"

# Get username
USERNAME=$(aws cognito-idp list-users \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --filter "email = \"$EMAIL\"" \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager \
  --query 'Users[0].Username' \
  --output text)

# Get all groups
GROUPS=$(aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username "$USERNAME" \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager \
  --query 'Groups[*].GroupName' \
  --output text)

# Remove from each group
for GROUP in $GROUPS; do
  echo "Removing from $GROUP..."
  aws cognito-idp admin-remove-user-from-group \
    --user-pool-id us-east-1_Cp9YnOQWi \
    --username "$USERNAME" \
    --group-name "$GROUP" \
    --profile wizz-drivers-ghayth-dev \
    --region us-east-1 \
    --no-cli-pager
done

# Optionally disable the user
aws cognito-idp admin-disable-user \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username "$USERNAME" \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager

echo "✅ User offboarded successfully"
```

---

## 🔧 Troubleshooting

### Issue: User Not Found

**Error:** `❌ User not found: user@example.com`

**Solution:**
```bash
# List all users to find the correct email
aws cognito-idp list-users \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager

# Or create the user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --username user@example.com \
  --user-attributes Name=email,Value=user@example.com Name=email_verified,Value=true \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager
```

### Issue: Group Doesn't Exist

**Error:** `❌ Group not found`

**Solution:**
```bash
# List all groups
aws cognito-idp list-groups \
  --user-pool-id us-east-1_Cp9YnOQWi \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --no-cli-pager

# Re-run setup if groups are missing
./setup-cognito-groups.sh
```

### Issue: AWS Credentials Expired

**Error:** `❌ AWS credentials not valid`

**Solution:**
```bash
# Re-authenticate
aws sso login --profile wizz-drivers-ghayth-dev
```

### Issue: User Has No Access After Assignment

**Check:**
1. Verify group assignment:
   ```bash
   ./test-rbac-permissions.sh user@example.com
   ```

2. Check JWT token in browser console:
   ```javascript
   const token = localStorage.getItem('idToken');
   console.log(JSON.parse(atob(token.split('.')[1])));
   ```

3. Token might be cached - logout and login again

4. Verify backend is reading groups:
   ```bash
   # Check dev server logs
   tail -f logs/dev-server.log
   ```

### Issue: Permission Denied Despite Being in Group

**Check:**
1. Verify the RBAC_MATRIX in `local-dev-server.js`
2. Check if user has the correct role mapping
3. Clear browser cache and cookies
4. Restart the development server:
   ```bash
   npm run local
   ```

---

## 📊 Quick Reference Commands

```bash
# List all groups
aws cognito-idp list-groups --user-pool-id us-east-1_Cp9YnOQWi --profile wizz-drivers-ghayth-dev --region us-east-1 --no-cli-pager

# List all users
aws cognito-idp list-users --user-pool-id us-east-1_Cp9YnOQWi --profile wizz-drivers-ghayth-dev --region us-east-1 --no-cli-pager

# Assign user to group
./assign-user-to-group.sh <email> <group-name>

# Test permissions
./test-rbac-permissions.sh <email>

# Check user groups
aws cognito-idp admin-list-groups-for-user --user-pool-id us-east-1_Cp9YnOQWi --username <username> --profile wizz-drivers-ghayth-dev --region us-east-1 --no-cli-pager
```

---

## 🎯 Best Practices

1. **Principle of Least Privilege:** Assign users only the groups they need
2. **Regular Audits:** Review group memberships monthly
3. **Test Accounts:** Create separate test accounts for each role
4. **Documentation:** Document why users are in specific groups
5. **Offboarding:** Remove all group memberships when employees leave
6. **Multi-Group:** Use multiple groups for cross-functional roles
7. **Password Policy:** Use strong passwords for all accounts

---

*Last Updated: November 9, 2025*
