const express = require('express');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const cors = require('cors');
const { WebSocketServer, WebSocket } = require('ws');
const { TelemetrySimulator } = require('./services/telemetrySimulator');
const { TelemetryStore } = require('./services/telemetryStore');
const { optimizeRation } = require('./services/rationOptimizer');
const { inferNutritionalProfile } = require('./services/silageAnalytics');
const { validateTelemetry, object, identifier, choice, ValidationError } = require('../shared/validation.mjs');

function matches(secret, supplied) {
  if (!secret || typeof supplied !== 'string' || supplied.length > 512) return false;
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(secret).digest(), crypto.createHash('sha256').update(supplied).digest());
}
function readCredentials(filename) {
  const credentials = filename
    ? object(JSON.parse(fs.readFileSync(filename, 'utf8')), 'Device credentials')
    : process.env.DEVICE_TOKEN
      ? { [process.env.DEVICE_ID || 'ESP32-SILO-01']: { token: process.env.DEVICE_TOKEN, pitIds: [process.env.DEVICE_PIT_ID || 'pit-a'] } }
      : {};
  for (const [id, entry] of Object.entries(credentials)) {
    identifier(id, 'Configured device ID'); object(entry);
    if (typeof entry.token !== 'string' || entry.token.length < 32) throw new Error('Device tokens must contain at least 32 characters');
    if (!Array.isArray(entry.pitIds) || !entry.pitIds.length) throw new Error('Each device requires authorized pitIds');
    entry.pitIds.forEach(pit => identifier(pit, 'Configured pit ID'));
  }
  return credentials;
}
function createApplication(options = {}) {
  const dashboardToken = options.dashboardToken ?? process.env.DASHBOARD_TOKEN ?? '';
  const devices = options.devices ?? readCredentials(process.env.DEVICE_CREDENTIALS_FILE);
  if (dashboardToken && dashboardToken.length < 32) throw new Error('DASHBOARD_TOKEN must contain at least 32 characters');
  if (process.env.NODE_ENV === 'production' && (!dashboardToken || !Object.keys(devices).length)) throw new Error('Production requires dashboard and device credentials');
  const allowedOrigins = options.allowedOrigins ?? (process.env.PUBLIC_ORIGIN || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000,http://localhost:5001,http://127.0.0.1:5001').split(',');
  const store = new TelemetryStore(options.databasePath ?? process.env.DATABASE_PATH ?? path.join(__dirname, 'data', 'telemetry.sqlite'));
  const simulator = new TelemetrySimulator();
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin(origin, callback) { callback(null, !origin || allowedOrigins.includes(origin)); } }));
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'no-referrer');
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    next();
  });
  // Bound unauthenticated traffic as well as authenticated requests. Single-process deployment.
  const rates = new Map();
  app.use('/api', (req, res, next) => {
    const now = Date.now();
    for (const [ip, bucket] of rates) if (bucket.until < now) rates.delete(ip);
    const ip = req.socket.remoteAddress;
    if (!rates.has(ip)) {
      if (rates.size >= 10000) return res.status(503).json({ success: false, error: 'Request capacity reached' });
      rates.set(ip, { count: 0, until: now + 60000 });
    }
    if (++rates.get(ip).count > 300) return res.status(429).json({ success: false, error: 'Too many requests; retry in one minute' });
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  const server = http.createServer(app);
  server.requestTimeout = 15000;
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  const clients = new Map();
  const bearer = req => req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
  function dashboard(req, res, next) {
    if (!matches(dashboardToken, bearer(req))) return res.status(401).json({ success: false, error: 'Dashboard authentication required' });
    next();
  }
  function source(req) { return choice(req.query.source ?? 'measured', 'source', ['measured', 'simulated']); }
  function authorizeSource(req, res, next) { if (source(req) === 'measured') return dashboard(req, res, next); next(); }
  function broadcast(message, targetSource) {
    for (const [ws, subscription] of clients) {
      if (subscription !== targetSource || ws.readyState !== WebSocket.OPEN) continue;
      if (ws.bufferedAmount > 1024 * 1024) { ws.terminate(); continue; }
      ws.send(JSON.stringify({ ...message, source: targetSource }));
    }
  }
  server.on('upgrade', (req, socket, head) => {
    if (req.url !== '/ws' || wss.clients.size >= 200 || (req.headers.origin && !allowedOrigins.includes(req.headers.origin))) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
    }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
  });
  wss.on('connection', ws => {
    let subscribed = false;
    let alive = true;
    const timeout = setTimeout(() => ws.close(1008, 'Subscription required'), 5000);
    ws.on('pong', () => { alive = true; });
    ws.checkAlive = () => { if (!alive) return ws.terminate(); alive = false; ws.ping(); };
    ws.on('error', () => {});
    ws.on('message', raw => {
      try {
        if (subscribed) throw new ValidationError('Already subscribed');
        const message = object(JSON.parse(raw));
        if (message.type !== 'SUBSCRIBE') throw new ValidationError('SUBSCRIBE required');
        const target = choice(message.source, 'source', ['measured', 'simulated']);
        if (target === 'measured' && !matches(dashboardToken, message.token)) { ws.close(1008, 'Unauthorized'); return; }
        subscribed = true; clearTimeout(timeout); clients.set(ws, target);
        ws.send(JSON.stringify({ type: 'INITIAL_STATE', source: target, data: target === 'measured' ? store.latest() : simulator.getAllPits() }));
      } catch { ws.close(1008, 'Invalid subscription'); }
    });
    ws.on('close', () => { clearTimeout(timeout); clients.delete(ws); });
  });
  const ticker = setInterval(() => {
    try { broadcast({ type: 'TELEMETRY_BATCH', data: simulator.tick() }, 'simulated'); }
    catch (error) { console.error('Simulation tick failed:', error.message); }
  }, options.tickMs ?? 3000);
  const heartbeat = setInterval(() => { for (const ws of wss.clients) ws.checkAlive(); }, 15000);

  app.get('/api/v1/health', (_req, res) => res.json({ status: 'healthy', platformVersion: '2.0.0-prototype', storage: 'sqlite', inferenceValidated: false }));
  app.get('/api/v1/sensors/latest', authorizeSource, (req, res) => res.json({ success: true, source: source(req), data: source(req) === 'measured' ? store.latest() : simulator.getAllPits() }));
  app.get('/api/v1/sensors/history', authorizeSource, (req, res) => {
    const pit = identifier(req.query.pit, 'pit');
    const limit = Number(req.query.limit ?? 30);
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new ValidationError('limit must be an integer from 1 to 1000');
    const history = source(req) === 'measured' ? store.history(pit, limit) : simulator.getHistory(pit, limit);
    res.json({ success: true, source: source(req), pitId: pit, count: history.length, history });
  });
  app.post('/api/v1/sensors/telemetry', (req, res) => {
    const body = object(req.body);
    const id = identifier(body.deviceId, 'deviceId');
    const credential = Object.hasOwn(devices, id) ? devices[id] : null;
    if (!credential || !matches(credential.token, bearer(req))) return res.status(401).json({ success: false, error: 'Device authentication required' });
    const data = validateTelemetry(body);
    if (!credential.pitIds.includes(data.pitId)) return res.status(403).json({ success: false, error: 'Device is not authorized for this pit' });
    const processed = store.ingest(data);
    broadcast({ type: 'HARDWARE_TELEMETRY', pitId: data.pitId, data: processed }, 'measured');
    res.status(201).json({ success: true, data: processed });
  });
  app.post('/api/v1/simulation/telemetry', (req, res) => {
    const data = validateTelemetry(req.body);
    if (!Object.hasOwn(simulator.pits, data.pitId)) throw new ValidationError('Use an existing demonstration pit');
    validateTelemetry(simulator.sample(data), { sample: true });
    const result = simulator.ingestSimulationTelemetry(data);
    broadcast({ type: 'TELEMETRY_BATCH', data: simulator.getAllPits() }, 'simulated');
    res.status(201).json({ success: true, source: 'simulated', data: result });
  });
  app.post('/api/v1/sensors/anomaly-trigger', (req, res) => {
    const { pitId, active } = object(req.body);
    identifier(pitId, 'pitId');
    if (typeof active !== 'boolean' || !Object.hasOwn(simulator.pits, pitId)) throw new ValidationError('Existing simulation pit and boolean active required');
    simulator.triggerAnomaly(pitId, active);
    broadcast({ type: 'TELEMETRY_BATCH', data: simulator.getAllPits() }, 'simulated');
    res.json({ success: true, source: 'simulated' });
  });
  app.post('/api/v1/analyze/manual-sample', (req, res) => {
    const sample = validateTelemetry(req.body, { sample: true });
    res.json({ success: true, source: 'manual', inference: inferNutritionalProfile(sample) });
  });
  app.post('/api/v1/vision/analyze-image', (_req, res) => res.status(501).json({ success: false, validated: false, error: 'Real image analysis is not implemented. Image previews and examples are not measurements.' }));
  app.post('/api/v1/ration/optimize', (req, res) => res.json({ success: true, optimization: optimizeRation(req.body) }));
  app.use('/api', (_req, res) => res.status(404).json({ success: false, error: 'Unknown API route' }));
  const clientPath = path.resolve(__dirname, '../client/dist');
  if (fs.existsSync(clientPath)) {
    app.use(express.static(clientPath));
    app.get('*', (_req, res) => res.sendFile(path.join(clientPath, 'index.html')));
  }
  app.use((error, _req, res, _next) => {
    const status = error.status >= 400 && error.status < 500 ? error.status : 500;
    if (status === 500) console.error('Request failed:', error.message);
    res.status(status).json({ success: false, error: status === 500 ? 'Internal server error' : error.message });
  });
  async function close() {
    clearInterval(ticker); clearInterval(heartbeat);
    for (const ws of wss.clients) ws.terminate();
    await new Promise(resolve => wss.close(resolve));
    if (server.listening) await new Promise(resolve => server.close(resolve));
    store.close();
  }
  return { app, server, close };
}
if (require.main === module) {
  const instance = createApplication();
  instance.server.listen(process.env.PORT || 5001, '0.0.0.0', () => console.log('DairyFeed prototype server listening'));
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => instance.close().then(() => process.exit(0)));
}
module.exports = { createApplication };
