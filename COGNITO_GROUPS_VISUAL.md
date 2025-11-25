# Cognito Groups Visual Structure

```
┌──────────────────────────────────────────────────────────────────┐
│                    WizzCentral User Pool                         │
│                    us-east-1_Cp9YnOQWi                          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    │  8 USER GROUPS    │
                    │                   │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │ TIER 1  │          │ TIER 2  │          │ TIER 3  │
   │ (Super) │          │(Admins) │          │(Read)   │
   └─────────┘          └─────────┘          └─────────┘
        │                     │                     │
        │                     │                     │
   ┌────▼────────┐     ┌─────▼────────────┐  ┌─────▼──────────┐
   │   admins    │     │ financial_admin  │  │ reporting_view │
   │             │     │ support_admin    │  │                │
   │ Precedence:1│     │ merchants_admin  │  │ Precedence:100 │
   │             │     │ drivers_admin    │  │                │
   │ ALL ACCESS  │     │ customers_admin  │  │  READ-ONLY     │
   │             │     │ campaigns_admin  │  │                │
   └─────────────┘     └──────────────────┘  └────────────────┘


USER ASSIGNMENT FLOW:
═════════════════════

   ┌──────────┐
   │   USER   │  (email: user@wizz.com)
   └────┬─────┘
        │
        │ 1. Admin assigns to group(s)
        ▼
   ┌─────────────────┐
   │ Cognito Group(s)│  (e.g., financial_admin)
   └────┬────────────┘
        │
        │ 2. Groups mapped to roles
        ▼
   ┌─────────────────┐
   │  RBAC Roles     │  (financial_admin role)
   └────┬────────────┘
        │
        │ 3. Roles grant permissions
        ▼
   ┌─────────────────────────────────────┐
   │         PERMISSIONS                 │
   │  • Pages: Dashboard, Financial      │
   │  • Domains: Financial (R+W)         │
   │  • Actions: CRUD operations         │
   └─────────────────────────────────────┘


PERMISSION HIERARCHY:
════════════════════

┌────────────────────────────────────────────────────────────┐
│                         ADMIN                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              ALL PAGES + ALL DOMAINS                 │ │
│  │              (Read + Write Everything)               │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    DOMAIN ADMINS                           │
│  ┌──────────────┬──────────────┬──────────────────────┐   │
│  │ Financial    │  Support     │  Merchants           │   │
│  │ • Financial  │  • Support   │  • Merchants         │   │
│  │   (R+W)      │    (R+W)     │    (R+W)             │   │
│  │ • Merchants  │  • Orders    │  • Regions           │   │
│  │   (R)        │    (R+W)     │    (R+W)             │   │
│  └──────────────┴──────────────┴──────────────────────┘   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                   SPECIALIZED ADMINS                       │
│  ┌──────────────┬──────────────┬──────────────────────┐   │
│  │ Drivers      │  Customers   │  Campaigns           │   │
│  │ • Drivers    │  • Customers │  • Campaigns         │   │
│  │   (R+W)      │    (R+W)     │    (R+W)             │   │
│  │ • Orders     │  • Dashboard │  • Dashboard         │   │
│  │   (R+W)      │    (R)       │    (R)               │   │
│  └──────────────┴──────────────┴──────────────────────┘   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                      READ-ONLY                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  reporting_view                                      │ │
│  │  • Dashboard (R)                                     │ │
│  │  • Financial (R)  [Cannot create/edit/delete]       │ │
│  │  • Merchants (R)  [Search only]                     │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘


MULTI-GROUP EXAMPLE:
═══════════════════

User: support-lead@wizz.com
Groups: [support_admin, merchants_admin]

COMBINED PERMISSIONS:
┌─────────────────────────────────────┐
│ Pages Access:                       │
│  ✅ Dashboard                       │
│  ✅ Support      (from support)    │
│  ✅ Orders       (from support)    │
│  ✅ Merchants    (from merchants)  │
│  ✅ Regions      (from merchants)  │
│  ✅ Drivers      (read only)       │
│  ✅ Customers    (read only)       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Domain Permissions:                 │
│  • Support:    R+W ✅               │
│  • Orders:     R+W ✅               │
│  • Merchants:  R+W ✅               │
│  • Regions:    R+W ✅               │
│  • Drivers:    R   📖               │
│  • Customers:  R   📖               │
└─────────────────────────────────────┘


GROUP PRECEDENCE (Priority Order):
══════════════════════════════════

 1  ← admins              (HIGHEST - overrides all)
10  ← financial_admin
20  ← support_admin
30  ← merchants_admin
40  ← drivers_admin
50  ← customers_admin
60  ← campaigns_admin
100 ← reporting_view      (LOWEST - read-only)

Lower number = Higher priority in conflict resolution


TOKEN CLAIMS FLOW:
═════════════════

1. User logs in via Cognito
        ↓
2. Cognito generates JWT token
        ↓
3. Token includes: cognito:groups
   Example: ["financial_admin", "reporting_view"]
        ↓
4. Backend middleware extracts groups
        ↓
5. mapGroupsToRoles() converts to roles
        ↓
6. Roles stored in custom:roles claim
        ↓
7. RBAC guards check roles on each request
        ↓
8. Permissions computed and cached (60s TTL)


REAL-WORLD SCENARIOS:
════════════════════

Scenario 1: New Employee - Customer Support Agent
─────────────────────────────────────────────────
User: agent@wizz.com
Command: ./assign-user-to-group.sh agent@wizz.com support_admin
Access: Dashboard, Support, Orders (full), Customers (read)

Scenario 2: Finance Team Member - Junior Analyst
────────────────────────────────────────────────
User: analyst@wizz.com
Command: ./assign-user-to-group.sh analyst@wizz.com reporting_view
Access: Dashboard, Financial (READ-ONLY - no edit buttons)

Scenario 3: Marketing Manager - Campaign Creator
────────────────────────────────────────────────
User: marketing@wizz.com
Command: ./assign-user-to-group.sh marketing@wizz.com campaigns_admin
Access: Dashboard, Promotions (create/edit campaigns)

Scenario 4: Operations Director - Cross-Functional
──────────────────────────────────────────────────
User: ops@wizz.com
Command: ./assign-user-to-group.sh ops@wizz.com support_admin merchants_admin drivers_admin
Access: Support, Orders, Merchants, Regions, Drivers (all full access)

Scenario 5: CEO/Executive - Full Oversight
──────────────────────────────────────────
User: ceo@wizz.com
Command: ./assign-user-to-group.sh ceo@wizz.com admins
Access: EVERYTHING (superuser)
```
