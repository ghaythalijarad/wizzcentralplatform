# Changelog

## v2025.11.06-regions-dynamodb

### Backend (local-dev-server.js)
- Migrate Regions to DynamoDB as single source of truth (table: WizzCentral_Regions).
- Switch to AWS SDK v3 (DynamoDBClient + DynamoDBDocumentClient).
- Remove legacy file-based regions data.
- Implement endpoints (DynamoDB-backed):
  - GET /api/regions with filters (level, parent_id, active, search), pagination, numeric-level summary.
  - GET /api/regions/:id by regionId.
  - GET /api/regions/statistics using numeric levels (0 country, 1 governorate, 2 district, 3 neighborhood).
  - PATCH /api/regions/:id/toggle flips is_active and updates timestamps.
  - POST /api/regions to create regions (normalized schema & coordinates).
  - /health reports regionsCount from DynamoDB.
- Add AWS credentials helpers returning 401 with SSO guidance; guard debug endpoints with ENABLE_REGIONS_DEBUG.

### Frontend (regions.html, regions.js)
- Consolidate Regions UI into a single page: frontend/pages/regions.html.
- regions.js:
  - Fetch from /api/regions and normalize to UI model; derive governorate via parent chain.
  - Filters (search, level, status) and pagination; normalize UI Streets (4) to backend 3.
  - Toggle status via PATCH /api/regions/:id/toggle with optimistic UI.
  - Add Region modal: parent/level validation, service types, estimated delivery, coordinates (Leaflet pick/use center), POST /api/regions.
  - AWS SSO auth toast on 401 with profile guidance.
- Map initialization guarded (no crash if container/Leaflet missing).

### Diagnostics/Validation
- Local health OK, real DynamoDB used; verified list, toggle, stats, and create flows.

### Pending (not in this tag)
- Edit/update and delete flows, enhanced map UX, server-side pagination/indexes, stricter validation, docs cleanup.
