const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { WebSocket } = require('ws');
const { createApplication } = require('../server');
const { TelemetryStore, enrich } = require('../services/telemetryStore');
const { optimizeRation } = require('../services/rationOptimizer');
const { validateTelemetry } = require('../../shared/validation.mjs');
const dashboardToken = 'dashboard-test-credential-32-characters';
const deviceToken = 'device-test-credential-at-least-32-chars';
const packet = { deviceId: 'node-1', pitId: 'pit-a', temperature_core: 12, ph_level: 4, moisture_pct: 65, ammonia_ppm: 15, nir_bands: [430, 520, 640, 720, 810, 895] };
const quality = { dryMatter: 34, crudeProtein: 8.5, tdn: 66, fliegScore: 82, moldRisk: 5 };
async function start(t, options = {}) {
  const instance = createApplication({ dashboardToken, devices: { 'node-1': { token: deviceToken, pitIds: ['pit-a'] } }, databasePath: ':memory:', tickMs: 25, ...options });
  instance.server.listen(0, '127.0.0.1'); await once(instance.server, 'listening');
  t.after(() => instance.close());
  const base = `http://127.0.0.1:${instance.server.address().port}`;
  async function api(route, { body, token } = {}) {
    const response = await fetch(`${base}/api/v1${route}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }
  return { ...instance, base, api };
}

test('health and static frontend are served by one backend', async t => {
  const { api, base } = await start(t);
  assert.equal((await api('/health')).status, 200);
  const response = await fetch(base);
  // CI builds before integration tests.
  assert.equal(response.status, 200);
  assert.match(await response.text(), /id="root"/);
});
test('measured endpoints and WebSocket subscriptions require dashboard credentials', async t => {
  const { api, base } = await start(t);
  assert.equal((await api('/sensors/latest')).status, 401);
  assert.equal((await api('/sensors/history?pit=pit-a')).status, 401);
  assert.equal((await api('/sensors/latest', { token: deviceToken })).status, 401);
  assert.equal((await api('/sensors/latest', { token: dashboardToken })).status, 200);
  const ws = new WebSocket(base.replace('http:', 'ws:') + '/ws');
  await once(ws, 'open'); const closed = once(ws, 'close');
  ws.send(JSON.stringify({ type: 'SUBSCRIBE', source: 'measured', token: 'wrong' }));
  assert.equal((await closed)[0], 1008);
});
test('only a configured device can write its assigned pit', async t => {
  const { api } = await start(t);
  assert.equal((await api('/sensors/telemetry', { body: packet })).status, 401);
  assert.equal((await api('/sensors/telemetry', { body: packet, token: dashboardToken })).status, 401);
  assert.equal((await api('/sensors/telemetry', { body: { ...packet, pitId: 'pit-b' }, token: deviceToken })).status, 403);
  const accepted = await api('/sensors/telemetry', { body: packet, token: deviceToken });
  assert.equal(accepted.status, 201); assert.equal(accepted.body.data.source, 'measured');
});
test('malformed packets return 400 and do not poison subsequent reads or ticks', async t => {
  const { api } = await start(t);
  await api('/sensors/telemetry', { body: packet, token: deviceToken });
  for (const patch of [{ nir_bands: null }, { nir_bands: [1] }, { ph_level: '4' }, { moisture_pct: 100 }, { temperature_core: null }, { source: 'simulated' }, { abnormalTriggered: true }, { pitId: '__proto__' }]) {
    const response = await api('/sensors/telemetry', { body: { ...packet, ...patch }, token: deviceToken });
    assert.equal(response.status, 400, JSON.stringify(patch));
  }
  const latest = await api('/sensors/latest', { token: dashboardToken });
  assert.equal(latest.body.data[0].temperature_core, 12);
  assert.equal((await api('/health')).status, 200);
});
test('simulation ticks and anomaly controls never change measured history', async t => {
  const { api, base } = await start(t);
  await api('/sensors/telemetry', { body: packet, token: deviceToken });
  const ws = new WebSocket(base.replace('http:', 'ws:') + '/ws');
  t.after(() => ws.terminate()); await once(ws, 'open');
  const messages = [];
  const tick = new Promise(resolve => ws.on('message', raw => { const m = JSON.parse(raw); messages.push(m); if (m.type === 'TELEMETRY_BATCH') resolve(); }));
  ws.send(JSON.stringify({ type: 'SUBSCRIBE', source: 'simulated' }));
  await api('/sensors/anomaly-trigger', { body: { pitId: 'pit-a', active: true } });
  await tick;
  const history = await api('/sensors/history?pit=pit-a', { token: dashboardToken });
  assert.equal(history.body.count, 1); assert.equal(history.body.history[0].temperature_core, 12);
  assert.ok(messages.every(m => m.source === 'simulated' && m.data.every(p => p.source === 'simulated')));
});
test('measured websocket receives only measured snapshots and packets', async t => {
  const { api, base } = await start(t);
  const ws = new WebSocket(base.replace('http:', 'ws:') + '/ws');
  t.after(() => ws.terminate()); await once(ws, 'open');
  const first = once(ws, 'message'); ws.send(JSON.stringify({ type: 'SUBSCRIBE', source: 'measured', token: dashboardToken }));
  assert.deepEqual(JSON.parse((await first)[0]).data, []);
  const next = once(ws, 'message'); await api('/sensors/telemetry', { body: packet, token: deviceToken });
  const message = JSON.parse((await next)[0]);
  assert.equal(message.type, 'HARDWARE_TELEMETRY'); assert.equal(message.source, 'measured'); assert.equal(message.data.temperature_core, 12);
});
test('missing sensors remain missing, with no invented inference', async t => {
  const { api } = await start(t);
  const res = await api('/sensors/telemetry', { token: deviceToken, body: { deviceId: 'node-1', pitId: 'pit-a', temperature_core: 24, humidity_pct: 65 } });
  assert.equal(res.status, 201); assert.equal(res.body.data.inference, null);
  assert.equal(res.body.data.moisture_pct, undefined);
});
test('SQLite survives reopen and retention remains bounded', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'dairyfeed-test-'));
  const filename = path.join(dir, 'telemetry.sqlite');
  try {
    let store = new TelemetryStore(filename, 3);
    for (let i = 0; i < 5; i++) store.ingest({ ...packet, temperature_core: 20 + i });
    store.close(); store = new TelemetryStore(filename, 3);
    assert.equal(store.latest()[0].temperature_core, 24);
    assert.deepEqual(store.history('pit-a', 10).map(p => p.temperature_core), [22, 23, 24]);
    store.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('freshness depends on received timestamp', () => {
  const timestamp = new Date(0).toISOString();
  assert.equal(enrich({ ...packet, timestamp }, 30001).stale, true);
  assert.equal(enrich({ ...packet, timestamp }, 29999).stale, false);
});
test('source, history limit and unimplemented vision are explicit', async t => {
  const { api } = await start(t);
  assert.equal((await api('/sensors/latest?source=unknown')).status, 400);
  assert.equal((await api('/sensors/history?source=simulated&pit=pit-a&limit=-1')).status, 400);
  assert.equal((await api('/vision/analyze-image', { body: {} })).status, 501);
});
test('telemetry rejects non-finite numbers before mutation', () => {
  for (const value of [NaN, Infinity, -Infinity, '20', null]) assert.throws(() => validateTelemetry({ ...packet, temperature_core: value }));
});
test('ration rejects invalid dry matter, missing quality and incompatible dry stage', () => {
  assert.throws(() => optimizeRation({}));
  for (const dryMatter of [0, null, NaN, -1, 100, '34']) assert.throws(() => optimizeRation({ silageQuality: { ...quality, dryMatter } }));
  assert.throws(() => optimizeRation({ silageQuality: quality, lactationStage: 'dry', milkYield: 14 }));
});
test('ration never invents a baseline or floors negative savings', () => {
  const result = optimizeRation({ silageQuality: quality });
  assert.equal(result.economics.dailySavingsINR, null);
  const comparison = optimizeRation({ silageQuality: quality, baselineDailyCostINR: 1 });
  assert.equal(comparison.economics.dailySavingsINR, Number((1 - comparison.economics.dailyFeedCostINR).toFixed(2)));
  assert.ok(comparison.economics.dailySavingsINR < 0);
});
test('quality, stage and nutrients affect the shared calculation', () => {
  const normal = optimizeRation({ milkYield: 8, silageQuality: quality });
  const early = optimizeRation({ milkYield: 8, silageQuality: quality, lactationStage: 'early' });
  assert.notEqual(normal.dmiCapacity, early.dmiCapacity);
  const protein = optimizeRation({ milkYield: 8, silageQuality: { ...quality, crudeProtein: 2 } });
  assert.notEqual(normal.rationPlan.compoundConcentrateKg, protein.rationPlan.compoundConcentrateKg);
  assert.equal(optimizeRation({ silageQuality: { ...quality, fliegScore: 10 } }).status, 'blocked');
});
test('infeasible high-yield rations are flagged instead of exceeding intake capacity', () => {
  const result = optimizeRation({ bodyWeight: 320, milkYield: 60, silageQuality: quality });
  assert.equal(result.status, 'infeasible'); assert.ok(result.warnings.length);
  assert.ok(result.supplied.dryMatterKg <= result.dmiCapacity + .02);
});
test('API ration matches the calculation imported by the frontend', async t => {
  const { api } = await start(t);
  const input = { silageQuality: quality, milkYield: 20, baselineDailyCostINR: 300 };
  assert.deepEqual((await api('/ration/optimize', { body: input })).body.optimization, optimizeRation(input));
});
test('invalid JSON is handled without leaking stack traces or stopping server', async t => {
  const { base, api } = await start(t);
  const response = await fetch(`${base}/api/v1/ration/optimize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(response.status, 400); assert.equal((await api('/health')).status, 200);
});
