# S3 Access Permissions Fix for Driver Documents

## Problem

When viewing driver documents, users get an "Access Denied" error:

```xml
<Error>
<Code>AccessDenied</Code>
<Message>
User: arn:aws:sts::031857856164:assumed-role/WizzCentral_Cognito_Authenticated_Role/CognitoIdentityCredentials 
is not authorized to perform: s3:GetObject on resource: 
"arn:aws:s3:::whizz-driver-documents-dev/drivers/.../registration_paper.jpg" 
because no identity-based policy allows the s3:GetObject action
</Message>
</Error>
```

## Root Cause

The **Cognito Identity Pool Authenticated Role** (`WizzCentral_Cognito_Authenticated_Role`) doesn't have permissions to:
- Read objects from S3 bucket (`s3:GetObject`)
- Generate pre-signed URLs requires the role to have GetObject permissions
- List bucket contents (`s3:ListBucket`)

Even though we generate pre-signed URLs in the frontend, the AWS SDK uses the **Cognito authenticated role's credentials** to sign the URLs. If that role doesn't have S3 permissions, the signed URLs won't work.

---

## Solution

Add an **inline IAM policy** to the Cognito Authenticated Role that grants:
1. `s3:GetObject` - Read individual files
2. `s3:GetObjectVersion` - Read specific versions
3. `s3:ListBucket` - List bucket contents (optional but helpful)

---

## Implementation

### Method 1: Automated Script (Recommended)

Run the provided script:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
chmod +x add-s3-permissions-to-cognito.sh
./add-s3-permissions-to-cognito.sh
```

The script will:
- ✅ Check if the Cognito role exists
- ✅ Create/update the inline policy
- ✅ Verify the policy was applied
- ✅ Show summary of permissions

---

### Method 2: AWS Console (Manual)

1. **Go to IAM Console**
   - Navigate to: https://console.aws.amazon.com/iam/

2. **Find the Cognito Role**
   - Click "Roles" in the left sidebar
   - Search for: `WizzCentral_Cognito_Authenticated_Role`
   - Click on the role name

3. **Add Inline Policy**
   - Click "Add permissions" → "Create inline policy"
   - Click the "JSON" tab
   - Paste this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowDriverDocumentsRead",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            "Resource": [
                "arn:aws:s3:::whizz-driver-documents-dev/*"
            ]
        },
        {
            "Sid": "AllowDriverDocumentsBucketList",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::whizz-driver-documents-dev"
            ]
        }
    ]
}
```

4. **Name and Create**
   - Click "Review policy"
   - Name: `WizzCentral_S3_DriverDocuments_Read`
   - Click "Create policy"

---

### Method 3: AWS CLI (Manual)

```bash
# Create policy document
cat > /tmp/s3-driver-docs-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowDriverDocumentsRead",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            "Resource": [
                "arn:aws:s3:::whizz-driver-documents-dev/*"
            ]
        },
        {
            "Sid": "AllowDriverDocumentsBucketList",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::whizz-driver-documents-dev"
            ]
        }
    ]
}
EOF

# Apply the policy
aws iam put-role-policy \
    --role-name WizzCentral_Cognito_Authenticated_Role \
    --policy-name WizzCentral_S3_DriverDocuments_Read \
    --policy-document file:///tmp/s3-driver-docs-policy.json

# Verify
aws iam get-role-policy \
    --role-name WizzCentral_Cognito_Authenticated_Role \
    --policy-name WizzCentral_S3_DriverDocuments_Read
```

---

## Verification

### 1. Check Policy Was Added

```bash
# List all inline policies on the role
aws iam list-role-policies --role-name WizzCentral_Cognito_Authenticated_Role

# View the specific policy
aws iam get-role-policy \
    --role-name WizzCentral_Cognito_Authenticated_Role \
    --policy-name WizzCentral_S3_DriverDocuments_Read
```

### 2. Test in Browser

1. **Log out** from WhizzCentral Platform
2. **Log back in** (to get fresh credentials)
3. Go to **Drivers** page
4. Click **"View"** on a driver with documents
5. Documents should now load! 🎉

### 3. Check Console Logs

Open browser DevTools (F12) → Console:

```
Loading regions from WizzCentral_Regions...
✅ Loaded 8 regions into dropdown
Generating pre-signed URL for bucket: whizz-driver-documents-dev, key: drivers/xxx/license.jpg
✅ Generated pre-signed URL (expires in 3600s)
```

No more "Access Denied" errors!

---

## Security Considerations

### ✅ **What This Allows:**
- Authenticated users can **read** driver documents
- Users can generate pre-signed URLs for documents
- Documents remain in private S3 bucket

### ❌ **What This Does NOT Allow:**
- Public access to bucket (still private)
- Uploading new documents (no `PutObject`)
- Deleting documents (no `DeleteObject`)
- Modifying documents (no write permissions)
- Unauthenticated access (Cognito authentication still required)

### 🔒 **Best Practices Applied:**
1. **Least Privilege:** Only GetObject, not full S3 access
2. **Scoped Resource:** Only `whizz-driver-documents-dev/*`
3. **No Public Access:** Bucket ACLs remain private
4. **Temporary URLs:** Pre-signed URLs expire after 1 hour
5. **Audit Trail:** CloudTrail logs all S3 access

---

## Troubleshooting

### Issue: Policy Not Working After Adding

**Solution:** Users need to refresh their credentials
```bash
# Users should:
1. Log out of WhizzCentral Platform
2. Log back in
3. Try viewing documents again
```

IAM policies are cached in Cognito credentials for ~1 hour. Logging out/in forces new credential fetch.

---

### Issue: "Role Not Found" Error

**Symptom:** Script says role doesn't exist

**Solution:** Check your Cognito Identity Pool
```bash
# List all roles
aws iam list-roles --query 'Roles[?contains(RoleName, `Cognito`)].RoleName'

# Find your specific role name
aws cognito-identity describe-identity-pool \
    --identity-pool-id us-east-1:864073dc-423f-42ae-9b1a-67c1c913b38a \
    --query 'Roles'
```

Update `ROLE_NAME` in the script if it's different.

---

### Issue: Still Getting Access Denied

**Checklist:**
1. ✅ Policy added to correct role?
2. ✅ Bucket name is correct? (`whizz-driver-documents-dev`)
3. ✅ Resource ARN includes `/*` at the end?
4. ✅ User logged out and back in?
5. ✅ Check IAM policy simulator:
   ```bash
   aws iam simulate-principal-policy \
       --policy-source-arn arn:aws:iam::031857856164:role/WizzCentral_Cognito_Authenticated_Role \
       --action-names s3:GetObject \
       --resource-arns arn:aws:s3:::whizz-driver-documents-dev/drivers/test.jpg
   ```

---

### Issue: Pre-signed URL Generation Fails

**Symptom:** Console shows "Could not generate pre-signed URL"

**Possible Causes:**
1. S3 URL format not recognized
2. AWS SDK not loaded
3. Credentials expired

**Debug:**
```javascript
// In browser console
console.log('AWS SDK loaded:', typeof AWS !== 'undefined');
console.log('S3 client:', AWSUtils.s3Client);
console.log('Credentials:', AWS.config.credentials);

// Test pre-signed URL generation
const testUrl = 'https://whizz-driver-documents-dev.s3.us-east-1.amazonaws.com/test.jpg';
AWSUtils.getPresignedUrl(testUrl).then(url => console.log('Pre-signed URL:', url));
```

---

## Alternative Solutions (If Main Solution Doesn't Work)

### Option 1: CloudFront with Signed URLs

Instead of pre-signed S3 URLs, use CloudFront distribution:

1. Create CloudFront distribution for S3 bucket
2. Use CloudFront signed URLs instead
3. Longer expiration times possible
4. Better performance (CDN caching)

**Pros:** Better performance, more control  
**Cons:** More complex setup, additional costs

---

### Option 2: API Gateway Proxy

Create Lambda function that proxies S3 GetObject:

```javascript
// Lambda function
exports.handler = async (event) => {
    const { documentKey } = JSON.parse(event.body);
    
    // Verify user permissions
    // Get object from S3
    // Return base64-encoded image
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'image/jpeg' },
        body: base64Image,
        isBase64Encoded: true
    };
};
```

**Pros:** Full control, can add logging/analytics  
**Cons:** Slower, Lambda costs, more complex

---

### Option 3: Move Documents to Public Folder (NOT RECOMMENDED)

Make documents folder public in S3:

```bash
# DON'T DO THIS - Security risk!
aws s3api put-object-acl \
    --bucket whizz-driver-documents-dev \
    --key drivers/ \
    --acl public-read
```

**Pros:** Simple, no authentication needed  
**Cons:** ❌ MAJOR SECURITY RISK - Anyone can access all driver documents

---

## Summary

The fix is simple: **Add S3 GetObject permissions to the Cognito Authenticated Role.**

### Quick Fix Command:
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
./add-s3-permissions-to-cognito.sh
```

### What Happens Next:
1. ✅ Script adds inline policy to Cognito role
2. ✅ Users log out and back in (fresh credentials)
3. ✅ Driver documents load perfectly with pre-signed URLs
4. ✅ URLs expire after 1 hour (secure)

---

## Files Created/Modified

1. **`add-s3-permissions-to-cognito.sh`** - Automated script to add permissions
2. **`S3_PERMISSIONS_FIX.md`** - This documentation (you're reading it)

---

## Related Documentation

- [DRIVER_DOCUMENTS_S3_FIX.md](./DRIVER_DOCUMENTS_S3_FIX.md) - Pre-signed URLs implementation
- [DRIVER_HOME_REGION_UPDATE.md](./DRIVER_HOME_REGION_UPDATE.md) - Region dropdown fix
- [DRIVER_EDIT_FINAL.md](./DRIVER_EDIT_FINAL.md) - Driver edit functionality

---

**Status:** ✅ **READY TO DEPLOY**

Run the script, have users log out/in, and documents will work! 🚀
