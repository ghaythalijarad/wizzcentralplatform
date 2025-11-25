# RBAC Guide (Phase 1 Implementation)

## Overview
Role Based Access Control (RBAC) has been implemented across backend API routes and frontend pages. Permissions are derived from Cognito `custom:roles` (comma‑separated) or local dev request headers (`x-user-roles`). A centralized matrix drives page visibility and domain read/write capabilities.

## Roles
admin (superuser – implicit full access)
financial_admin
support_admin
merchants_admin
drivers_admin
customers_admin
campaigns_admin
reporting_view (read-only financial & merchants)

## Permission Matrix (Source: local-dev-server.js RBAC_MATRIX)
Pages:
- dashboard: financial_admin, support_admin, merchants_admin, drivers_admin, customers_admin, campaigns_admin, reporting_view
- drivers: drivers_admin, support_admin
- customers: customers_admin, support_admin
- merchants: merchants_admin, support_admin
- orders: support_admin, merchants_admin, drivers_admin
- promotions: campaigns_admin
- regions: merchants_admin
- financial: financial_admin, reporting_view
- support: support_admin

Domains:
- financial: read(financial_admin, reporting_view) write(financial_admin)
- campaigns: read(campaigns_admin, merchants_admin) write(campaigns_admin)
- regions: read(merchants_admin) write(merchants_admin)
- orders: read/write(support_admin, merchants_admin, drivers_admin)
- merchants: read(merchants_admin, support_admin, financial_admin, reporting_view) write(merchants_admin)
- drivers: read(drivers_admin, support_admin) write(drivers_admin)
- customers: read(customers_admin, support_admin) write(customers_admin)
- support: read/write(support_admin)

## Backend Components
- roleGuard(anyOf, allowReadOnly, writeRequires) determines access per HTTP method (write = POST/PATCH/PUT/DELETE)
- Domain guards: financialAccessGuard, campaignsAccessGuard, regionsAccessGuard, ordersAccessGuard, merchantsAccessGuard, merchantsSearchAccessGuard
- /api/permissions returns resolved permissions `{ roles, pages, domains }`
- sendForbidden logs structured `[RBAC_FORBIDDEN]` line and responds with 403 JSON

## Frontend Components
- `assets/js/rbac.js` provides: ensure(), enforcePage(page), can(domain,'read|write'), applyReadOnly(rootSel, domain)
- `assets/js/navigation.js` dynamically hides sidebar items and redirects unauthorized pages
- Each gated page includes RBAC script and calls enforcePage + applyReadOnly; write-only elements marked `data-write-only`
- Dashboard quick actions hidden if target page not permitted

## Write vs Read Semantics
- Write actions (mutations) require role in `anyOf` or `writeRequires`
- Read actions succeed if role in anyOf OR allowReadOnly OR writeRequires OR admin

## Adding a New Role
1. Decide page & domain access.
2. Update RBAC_MATRIX (pages & domains arrays).
3. (Optional) Add new domain guard using roleGuard.
4. Redeploy backend.
5. Frontend: No change if only visibility semantics; ensure new pages reference enforcePage.

## Adding a New Page
1. Assign allowed roles in RBAC_MATRIX.pages.
2. If page maps to existing domain: add to page->domain mapping in navigation.js applyRBACGating.
3. Add `data-page="yourPage"` on `<body>` and include rbac.js.
4. Add inline init: `await RBAC.ensure(); if(!RBAC.enforcePage('yourPage')) return;`.
5. Mark mutating buttons with `data-write-only`.

## Adding a New Domain
1. Add domain entry in RBAC_MATRIX.domains with read/write arrays.
2. Add domain guard constant if needed for backend routes.
3. Update `pageToDomain` map in navigation.js.
4. Tag write-only UI elements.

## Cognito Integration
- Store roles in user pool as custom attribute `custom:roles` (comma separated).
- Option A: Pre Token Generation Lambda – inject computed roles string.
- Option B: Assign Cognito Groups; map groups to role names in a token customization trigger and produce `custom:roles`.
- Ensure Amplify / API Gateway passes claims (already read from authorizer claims).

## Auditing & Logging
- logAudit() persists financial domain actions to FINANCIAL_AUDIT_TABLE.
- sendForbidden logs denied attempts with timestamp, user email, roles, required roles.
- Future: Add unified access_denied audit table (TODO).

## Read-Only UI Pattern
- Body gets class `read-only` when lacking write permission.
- Elements with `data-write-only` are hidden for non-writers.
- Generic disabling: buttons/inputs/select/textarea are disabled under applyReadOnly.

## Testing Strategy (TODO)
Backend:
- Unit test roleGuard permutations.
- Integration tests: each guarded route returns 403 for missing roles, 200 for allowed.
Frontend:
- E2E (Playwright/Cypress): redirect to unauthorized.html; verify hidden write-only controls; verify disabled inputs.

## Performance Considerations
- /api/permissions currently recomputed per request. Add in-memory cache keyed by roles string (TODO).

## Extending
- For granular action-level gating (e.g., separate delete vs update) extend RBAC_MATRIX with action subkeys or per-route guards with writeRequires specialization.

## Cleanup TODOs
- Remove any remnants of legacy financialAuth flags beyond FINANCIAL_AUTH_DISABLED.
- Audit all pages for missing `data-write-only` on mutating buttons.

## Quick Checklist for New Feature
[ ] Backend route uses appropriate domain guard
[ ] Frontend page calls RBAC.ensure + enforcePage
[ ] Mutating controls tagged data-write-only
[ ] Domain mapped in navigation.js pageToDomain map
[ ] Tests updated (when test harness present)

End of guide.
