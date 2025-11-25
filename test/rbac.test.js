// filepath: whizzCentralPlatform/test/rbac.test.js
// Basic unit tests for RBAC helpers using node:test
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.RBAC_DISABLED = 'false';
const { rbac, app } = require('../local-dev-server.js');
const request = require('supertest');

const makeHeaders = (roles) => ({ 'x-user-roles': roles.join(','), 'x-user-email': 't@ex.com' });

describe('RBAC helpers', () => {
  it('resolvePermissionsForRoles: admin gets all pages and write on all domains', () => {
    const perms = rbac.resolvePermissionsForRoles(['admin']);
    assert.ok(perms.pages.length > 0);
    for (const dom of Object.values(perms.domains)) {
      assert.equal(dom.read, true);
      assert.equal(dom.write, true);
    }
  });

  it('resolvePermissionsForRoles: reporting_view is read-only on financial', () => {
    const perms = rbac.resolvePermissionsForRoles(['reporting_view']);
    assert.equal(perms.domains.financial.read, true);
    assert.equal(perms.domains.financial.write, false);
  });
});

describe('RBAC /api/permissions cache', () => {
  it('returns miss then hit for same roles within TTL', async () => {
    const agent = request(app);
    const headers = makeHeaders(['support_admin']);

    const res1 = await agent.get('/api/permissions').set(headers);
    assert.equal(res1.status, 200);
    assert.equal(res1.body.cache, 'miss');

    const res2 = await agent.get('/api/permissions').set(headers);
    assert.equal(res2.status, 200);
    assert.equal(res2.body.cache, 'hit');
  });
});

describe('roleGuard read vs write', () => {
  // Add a temporary route protected with financialAccess-like guard behavior
  const guard = rbac.roleGuard({ anyOf: ['financial_admin'], allowReadOnly: ['reporting_view'] });

  app.get('/_t/rbac/read', guard, (req, res) => res.json({ ok: true }));
  app.post('/_t/rbac/write', guard, (req, res) => res.json({ ok: true }));

  it('reporting_view can read', async () => {
    const agent = request(app);
    const res = await agent.get('/_t/rbac/read').set(makeHeaders(['reporting_view']));
    assert.equal(res.status, 200);
  });

  it('reporting_view cannot write', async () => {
    const agent = request(app);
    const res = await agent.post('/_t/rbac/write').set(makeHeaders(['reporting_view']));
    assert.equal(res.status, 403);
    assert.equal(res.body.error, 'forbidden');
  });

  it('financial_admin can write', async () => {
    const agent = request(app);
    const res = await agent.post('/_t/rbac/write').set(makeHeaders(['financial_admin']));
    assert.equal(res.status, 200);
  });
});
