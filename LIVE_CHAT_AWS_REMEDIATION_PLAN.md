# Live Chat Stabilization & AWS Remediation Plan

Date: 2025-09-13
Scope: Driver (Flutter), Central Platform (Web), Realtime Backend (AWS)

## 1) Summary and Goals

- Root cause: WebSocket requires a valid Cognito JWT; unauthenticated driver sessions produced 401/403/426 and rejected connections.
- Goals
  - Authenticated, stable WebSocket connections for driver and agent UIs.
  - Presence/roster feature (who is online) with low-latency updates.
  - Observable, recoverable system with clear status reporting and alarms.

Success criteria (DoD)

- 99% successful connect attempts with valid JWTs; <1% unexpected disconnects per day per user.
- p95 reconnect < 5s after transient network loss; messages not lost during reconnect.
- No unexpected 410 Gone except on reload/app close; automatic cleanup verified.
- Presence endpoint returns accurate online roster within 60s staleness window.

## 2) Target Architecture (AWS-Native)

- Amazon API Gateway (WebSocket)
  - Routes: $connect, $disconnect, $default, register, heartbeat, sendMessage
  - Optional: Lambda Authorizer or JWT validation in $connect Lambda
- AWS Lambda
  - connect: Validate JWT, resolve userId, write Connections item
  - default/router: Route app messages (chat, register, heartbeat)
  - disconnect: Clean up connection and adjust presence
  - presence-list: REST GET /api/presence/online for agents
  - chat-bridge: Bridge to Central Platform / Agent UI if needed
- Amazon DynamoDB
  - Connections: pk=connectionId; userId, platform, lastSeen, ttl
  - Presence: pk=userId; status, lastSeen, ttl
  - Optional Messages: for store-and-forward/backfill
- CloudWatch
  - Logs for all Lambdas; dashboards for API GW metrics (Connect, Message, 4XX/5XX)
  - Alarms: API GW 4XX/5XX spikes, Lambda errors, abnormal disconnects

## 3) Security & Authentication

- Drivers: Cognito JWT (Amplify Auth). Use accessToken.raw. Refresh before connect when near expiry.
- Agents: Same Cognito pool or a trusted backend issuing short-lived WS tokens.
- WebSocket auth patterns
  - Preferred: Header-based via $connect (Lambda validates JWT)
  - Browser fallback: Short-lived pre-signed token in query param; rotate frequently; validate audience, issuer, exp
- Close code mapping
  - 401/4401 -> authentication_failed
  - 426 -> upgrade required (unauthenticated HTTP probe expected)
  - 410 Gone -> stale connection; perform cleanup and reconnect

## 4) Client Changes

### Driver (Flutter)

- Single active WS instance; connection guard
- Exponential backoff with jitter (1s -> 60s)
- Heartbeat every 45–60s; server updates Presence.lastSeen
- Queue outgoing messages while disconnected; flush on connect/ack
- Lifecycle & connectivity awareness (pause/resume, offline/online)
- Status surface: connected, authentication_required, authentication_failed, connection_failed
- Token handling: Amplify.Auth.fetchAuthSession(); refresh near expiry; on 401 close, refresh and reconnect

### Central Platform (Web)

- Ensure a single WS initialization per page; remove duplicates
- Unify banners/status sources; one canonical connection state
- Consistent auth: either header-based via backend or pre-signed token in query param
- Clear service worker and cache; version assets to avoid stale JS
- Reconnect with backoff + ping/pong; log frames in devtools during test

## 5) Backend Work Items

- Implement DynamoDB tables
  - Connections (ttl ~2h), Presence (ttl ~2–5m)
- Lambda handlers
  - $connect: validate JWT, write Connections, seed Presence
  - $default: handle register, heartbeat, sendMessage; route to recipient
  - $disconnect: remove Connections, update Presence
  - presence-list (REST): GET /api/presence/online (agent-only)
  - chat-bridge: deliver to Central Platform user or broadcast
- Cleanup: handle 410 Gone when sending via postToConnection; remove stale
- Observability: structured logs (userId, connectionId, route), dashboards, alarms

## 6) Infrastructure as Code (CDK outline)

- Stacks
  - RealtimeStack: API GW WS + Lambdas + DynamoDB + permissions
  - ApiStack: REST /api/presence/online for agents
- Outputs for endpoints and env wiring
- CI/CD: Deploy to dev → staging → prod with smoke tests

## 7) Testing & Validation

- Pre-req: Authenticated driver and agent
- E2E tests
  - Valid token connect; exchange messages both directions; verify frames
  - Invalid/expired token -> fail with authentication_failed; refresh then connect
  - Network flap -> reconnect < 5s; queued messages delivered post-connect
  - Heartbeat running; Presence reflects online within 60s; drops within TTL after disconnect
  - 410 Gone cleanup verified via CloudWatch logs
- Tooling
  - Use existing scripts: final-validation-test.js, PRODUCTION_INTEGRATION_TEST.js, debug-flutter-jwt-flow.js
  - Browser DevTools WS frames; CloudWatch Logs Insights queries

## 8) Monitoring & Runbooks

- Dashboards: API GW connects/messages, 4XX/5XX; Lambda errors/duration; Presence count
- Alarms: sustained 4XX>2% or 5XX>0.5% (5m), Lambda error rate >1%, disconnect spikes
- Runbooks
  - 401 spikes: verify Cognito config, token expiry, clock skew, app refresh
  - 410 spikes: check TTLs and disconnect cleanup
  - No presence updates: heartbeat route and cron, client timer

## 9) Rollout Plan

- Phase 1 (Dev): Backend + Driver beta; feature flag off for agents
- Phase 2 (Staging): Enable presence; validate dashboards/alarms
- Phase 3 (Prod): Gradual rollout 10% → 50% → 100%; rollback switch

## 10) Task Checklist

Backend

- [ ] Create DynamoDB: Connections, Presence with TTL
- [ ] Implement $connect/$default/$disconnect Lambdas
- [ ] Implement presence REST endpoint
- [ ] Add 410 Gone cleanup in bridge
- [ ] Dashboards + alarms

Central Platform

- [ ] Remove duplicate WS initializations
- [ ] Unify status banners
- [ ] Adopt consistent auth to WS
- [ ] Cache-busting + service worker hygiene

Driver (Flutter)

- [ ] Backoff + jitter reconnect
- [ ] Single connection guard
- [ ] Heartbeat 45–60s
- [ ] Message queue and flush
- [ ] Token refresh on 401

Testing

- [ ] Run final-validation-test.js and record results
- [ ] CloudWatch log review shows expected flow
- [ ] Presence roster accurate within 60s

## 11) Acceptance Criteria

- Authenticated driver connects and remains stable >30m idle with heartbeats
- Loss/recovery: reconnect <5s p95; messages delivered without loss
- Presence list reflects accurate online users; stale entries cleared per TTL
- Dashboards green; no persistent alarms for 24h post-rollout

## 12) References

- Existing docs: FINAL_ACTION_PLAN.md, LIVE_CHAT_DEBUG_FINAL_SOLUTION.md, FLUTTER_CENTRAL_PLATFORM_TESTING_GUIDE.md
- Scripts: final-validation-test.js, debug-flutter-jwt-flow.js, PRODUCTION_INTEGRATION_TEST.js
