# RBAC Implementation - Next Steps

**Generated:** November 9, 2025  
**Status:** Phase 1 Complete - Financial Management Page Migration Complete

---

## ✅ Recently Completed (November 9, 2025)

- **Financial Management Page Migration:**
  - Created `/frontend/pages/financial-management.html` with full content and RBAC integration
  - Added legacy redirect `/financial-management(.html)` → `/pages/financial-management.html`
  - Updated sidebar navigation link to new path
  - Included explicit RBAC script loading for consistency
  - Fixed lint errors (empty CSS rulesets)

---

## 📋 Pending Tasks

### 1. Code Cleanup & Organization

#### a. Remove Legacy Financial Management File
- **File:** `/frontend/financial-management.html` (root level)
- **Action:** Delete after documentation is updated
- **Keep:** Redirect rule in `local-dev-server.js` until all references updated
- **Timeline:** After docs/links verified

#### b. Delivery-Fee Routes Deduplication
- **Location:** `local-dev-server.js` lines ~1308-1420
- **Action:** Verify only one complete set of delivery-fee endpoints exists:
  - `POST /api/delivery-fees` (create)
  - `GET /api/delivery-fees` (list with filters)
  - `PATCH /api/delivery-fees/:ruleId` (update)
  - `DELETE /api/delivery-fees/:ruleId` (soft delete)
  - `POST /api/delivery-fees/calculate` (calculate fee)
- **Check:** Remove any older/incomplete placeholder segments if duplicated

#### c. Remove FINANCIAL_AUTH_DISABLED Remnants
- **Current:** `process.env.FINANCIAL_AUTH_DISABLED` still exists in codebase
- **Action:** 
  - Remove env var references (replaced by `RBAC_DISABLED`)
  - Clean up any conditional logic using old flag
  - Update `.env.example` if present

---

### 2. Testing & Quality Assurance

#### a. Expand Unit Tests (`test/rbac.test.js`)
**Current Coverage:** Basic permissions resolution, cache hit/miss, read/write guards

**Add Tests For:**
- **Cache Expiry:**
  - Advance time beyond TTL (60s)
  - Verify cache miss after expiry
  - Test cache invalidation

- **roleGuard Edge Cases:**
  - Empty roles array → 403
  - Multiple roles in `allowReadOnly` → read access granted
  - Multiple roles in `writeRequires` → write access granted
  - Admin shortcut bypasses all checks
  - Combination: `anyOf` + `allowReadOnly` + `writeRequires`

- **Permissions Resolution:**
  - Multiple roles with overlapping permissions
  - Role with no page access but domain read access
  - Admin role grants all pages and domains

- **Action-Level Permissions (if implemented):**
  - Separate delete vs update role requirements
  - Per-domain action permissions

**Example Test Template:**
```javascript
describe('roleGuard cache expiry', () => {
  it('returns miss after TTL expiry', async () => {
    // Mock time advance, verify cache miss
  });
});

describe('roleGuard edge cases', () => {
  it('denies access for empty roles', async () => {
    const res = await agent.get('/test').set(makeHeaders([]));
    assert.equal(res.status, 403);
  });
  
  it('admin bypasses all checks', async () => {
    const res = await agent.post('/test').set(makeHeaders(['admin']));
    assert.equal(res.status, 200);
  });
});
```

#### b. Stabilize CI Tests
- **Issue:** Browser/SSO/AWS-dependent legacy tests fail locally
- **Options:**
  1. Skip browser-dependent tests in CI (`test/*.browser.test.js`)
  2. Mock AWS SDK responses for DynamoDB tests
  3. Isolate RBAC tests in separate suite
  4. Add `--filter` flag to `npm test` script for selective runs

**Recommended Script Update (`package.json`):**
```json
{
  "scripts": {
    "test": "node --test",
    "test:rbac": "node --test test/rbac.test.js",
    "test:unit": "node --test test/*.test.js --exclude=**/browser.test.js"
  }
}
```

---

### 3. Frontend Enhancements

#### a. Extend Write-Only Annotations
**Current:** `data-write-only` attribute used on financial, orders, merchants pages

**Check & Add to:**
- **Promotions Page:**
  - Advanced modal controls (create/edit/delete buttons)
  - Campaign activation toggles
  - Condition editor save buttons

- **Regions Page:**
  - Add/Edit region forms
  - Toggle active status buttons
  - Delete region actions

- **Support Page:**
  - Ticket mutation actions
  - Chat assignment controls

- **Drivers/Customers Pages:**
  - Add/Edit/Delete user buttons
  - Status change controls

**Pattern:**
```html
<button data-write-only class="action-btn">Save Changes</button>
<input data-write-only type="text" id="edit-field">
```

**Enforcement (already in `navigation.js`):**
```javascript
if (!window.RBAC.can(domain, 'write')) {
  window.RBAC.applyReadOnly('body', domain);
}
```

#### b. Generic Disable Pattern Verification
- Audit all pages for consistent read-only behavior
- Verify disabled state styling (`.disabled`, `.rbac-disabled` classes)
- Test keyboard navigation on disabled elements

---

### 4. Advanced RBAC Features

#### a. Granular Action-Level Permissions
**Current:** Read/write separation only

**Proposed Extension:**
```javascript
const RBAC_MATRIX = {
  domains: {
    financial: { 
      read: ['financial_admin','reporting_view'], 
      write: ['financial_admin'],
      delete: ['admin'], // More restrictive
      export: ['financial_admin','reporting_view'] // Special action
    },
    // ...
  }
};
```

**Use Cases:**
- Separate `delete` permission from `write`
- `export` permission for reporting
- `approve` permission for workflows
- `publish` permission for campaigns

**Implementation:**
- Extend `roleGuard` to accept `action` parameter
- Update `RBAC.can(domain, action)` to support custom actions
- Add frontend helpers: `RBAC.canDelete(domain)`, `RBAC.canExport(domain)`

#### b. Resource-Level Permissions
**Future:** Per-merchant, per-region access control

**Example:**
```javascript
{
  userId: 'user-123',
  roles: ['support_admin'],
  resourceAccess: {
    merchants: ['business_abc', 'business_xyz'], // Specific merchants only
    regions: ['REG_IQ_BGD'] // Baghdad only
  }
}
```

---

### 5. Production Readiness

#### a. Cognito Pre Token Generation Lambda
**Current:** Dev headers (`x-user-roles`, `x-user-groups`) used for local testing

**Required for Production:**
1. **Create Lambda Function:**
   ```javascript
   exports.handler = async (event) => {
     const groups = event.request.groupConfiguration?.groupsToOverride || [];
     const roles = mapGroupsToRoles(groups);
     event.response = {
       claimsOverrideDetails: {
         claimsToAddOrOverride: {
           'custom:roles': roles.join(',')
         }
       }
     };
     return event;
   };
   ```

2. **Attach to Cognito User Pool:**
   - Trigger: Pre Token Generation
   - Deploy Lambda to production AWS account
   - Grant Cognito invoke permissions

3. **Remove Dev Fallback:**
   ```javascript
   // DELETE in production:
   const finalRoles = headerRoles.length ? headerRoles : 
                     (rolesFromGroups.length ? rolesFromGroups : 
                     ['admin','user','financial_admin']); // ❌ Remove default
   
   // KEEP only:
   const finalRoles = headerRoles.length ? headerRoles : rolesFromGroups;
   if (!finalRoles.length) {
     return res.status(401).json({ error: 'No roles assigned' });
   }
   ```

#### b. Environment-Specific Configuration
- **Local:** `RBAC_DISABLED=false` (default)
- **Dev/Staging:** `RBAC_DISABLED=false`, dev headers allowed
- **Production:** `RBAC_DISABLED=false`, Cognito-only, no dev headers

**Add to `.env.example`:**
```bash
# RBAC Configuration
RBAC_DISABLED=false
ALLOW_DEV_HEADERS=true  # Set to false in production
```

---

### 6. Documentation Updates

#### a. Update Documentation References
**Files to Update:**
- `FINANCIAL_IMPLEMENTATION_SUCCESS.md` (line 332, 457)
- `FINANCIAL_PAGE_ANALYSIS.md` (line 27, 47)
- `FINANCIAL_QUICK_START.md` (line 45)
- `SIDEBAR_FIXES_COMPLETE.md` (line 59)
- `create-financial-tables.js` (line 186)
- `setup-financial-system.js` (line 210)

**Change:**
```markdown
# Before
http://localhost:3000/financial-management.html

# After
http://localhost:3000/pages/financial-management.html
```

#### b. Add RBAC Examples to Guide
**File:** `RBAC_GUIDE.md`

**Add Sections:**
- Troubleshooting common access denied scenarios
- Testing RBAC with different role combinations
- Production deployment checklist
- Performance tuning (cache TTL, permissions resolution)

#### c. Create API Documentation
**New File:** `API_RBAC_ENDPOINTS.md`

**Content:**
- `/api/me` - Current user info
- `/api/permissions` - Computed permissions for current roles
- Guard middleware usage examples
- Error response formats (401, 403 with guidance)

---

### 7. Performance & Monitoring

#### a. Permissions Cache Optimization
**Current:** 60-second TTL, in-memory Map

**Enhancements:**
- Add cache hit/miss metrics
- Configurable TTL via environment variable
- Cache size limits (LRU eviction)
- Redis/Elasticache for distributed cache (multi-instance)

**Example:**
```javascript
// Add metrics
let cacheHits = 0;
let cacheMisses = 0;

app.get('/api/rbac/metrics', (req, res) => {
  res.json({
    cacheHits,
    cacheMisses,
    hitRate: cacheHits / (cacheHits + cacheMisses),
    cacheSize: PERMISSIONS_CACHE.size
  });
});
```

#### b. Audit Log Analysis
**Current:** Best-effort DynamoDB writes to `WizzCentral_Financial_Audit`

**Add:**
- Audit log query endpoint with filters (already exists: `/api/financial-audit`)
- CloudWatch dashboard for access denied events
- Alerts for suspicious activity patterns
- Regular audit log retention policy (archive old records)

#### c. RBAC Enforcement Monitoring
- Track 403 response rates by endpoint
- Alert on excessive forbidden attempts (potential attack)
- Monitor permission resolution latency

---

### 8. Optional Enhancements

#### a. Role Management UI
**New Admin Page:** `/pages/role-management.html`

**Features:**
- List all Cognito groups
- Assign users to groups
- Visualize role hierarchy
- Test permissions for a given role combination

#### b. Audit Trail Viewer
**New Page:** `/pages/audit-logs.html`

**Features:**
- Search audit logs by user, entity, action
- Time range filters
- Export audit reports
- Real-time audit stream (WebSocket)

#### c. Permission Testing Tool
**Dev-only Endpoint:** `/dev/test-permissions`

**Usage:**
```bash
curl -X POST http://localhost:3000/dev/test-permissions \
  -H "Content-Type: application/json" \
  -d '{
    "roles": ["reporting_view"],
    "action": "write",
    "domain": "financial"
  }'

# Response:
{
  "allowed": false,
  "reason": "Write access denied",
  "required": ["financial_admin"],
  "provided": ["reporting_view"]
}
```

---

## 🗓️ Suggested Timeline

### Week 1: Testing & Cleanup
- [ ] Expand unit tests (cache, edge cases)
- [ ] Dedupe delivery-fee routes
- [ ] Remove FINANCIAL_AUTH_DISABLED references
- [ ] Update documentation links

### Week 2: Frontend Completeness
- [ ] Add write-only annotations to remaining pages
- [ ] Verify generic disable pattern across all pages
- [ ] Test read-only mode on all gated pages

### Week 3: Advanced Features (Optional)
- [ ] Implement action-level permissions if needed
- [ ] Add cache metrics
- [ ] Create audit log viewer

### Week 4: Production Prep
- [ ] Deploy Cognito Pre Token Generation Lambda
- [ ] Remove dev header fallback
- [ ] Load test with production-like traffic
- [ ] Final security review

---

## 📊 Success Metrics

**Code Quality:**
- [ ] 80%+ test coverage for RBAC logic
- [ ] Zero lint errors
- [ ] All legacy code removed

**Security:**
- [ ] No unauthorized access in penetration tests
- [ ] Audit logs capture all mutations
- [ ] 403 responses include clear guidance

**Performance:**
- [ ] Permissions resolution < 10ms (p95)
- [ ] Cache hit rate > 90%
- [ ] No noticeable UI latency from RBAC checks

**User Experience:**
- [ ] Clear error messages on access denied
- [ ] Consistent read-only UI across pages
- [ ] No broken links or 404s

---

## 🔗 Related Files

- `local-dev-server.js` - Backend RBAC guards and matrix
- `frontend/assets/js/rbac.js` - Frontend RBAC utility
- `frontend/assets/js/navigation.js` - Page gating and read-only enforcement
- `test/rbac.test.js` - Unit tests
- `RBAC_GUIDE.md` - Developer documentation
- `frontend/pages/unauthorized.html` - Access denied page

---

## 📝 Notes

- **Backward Compatibility:** Keep redirects until all external links updated
- **Gradual Rollout:** Consider feature flag for RBAC in production
- **User Communication:** Notify users of new permissions model before enforcement
- **Training:** Provide admin documentation for role assignment

---

**Last Updated:** November 9, 2025  
**Next Review:** Week of November 16, 2025
