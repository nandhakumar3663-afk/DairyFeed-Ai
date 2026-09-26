/**
 * Smart Feed & Silage Quality Analyzer - Backend Gateway & AI Server
 * SIH 26111: Ministry of Fisheries, Animal Husbandry & Dairying
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const { WebSocketServer, WebSocket } = require('ws');

const simulator = require('./services/telemetrySimulator');
const { inferNutritionalProfile } = require('./services/silageAnalytics');
const { optimizeRation } = require('./services/rationOptimizer');
const { analyzeSilageImage } = require('./services/visionClassifier');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Create HTTP and WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Active WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WebSocket] Client connected. Total clients: ${clients.size}`);

  // Send initial snapshot of all pits
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    data: simulator.getAllPits(),
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'TRIGGER_ANOMALY') {
        const updated = simulator.triggerAnomaly(parsed.pitId, parsed.active);
        broadcast({
          type: 'ANOMALY_STATUS',
          pitId: parsed.pitId,
          active: parsed.active,
          data: updated
        });
      } else if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch (err) {
      console.error('[WebSocket] Message parse error:', err.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WebSocket] Client disconnected. Total clients: ${clients.size}`);
  });
});

function broadcast(payload) {
  const json = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

// Background simulation ticker: emit live telemetry update every 3 seconds
setInterval(() => {
  const updates = simulator.tick();
  broadcast({
    type: 'TELEMETRY_BATCH',
    data: updates,
    timestamp: new Date().toISOString()
  });
}, 3000);

// ================= REST API ROUTES =================

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Smart Feed & Silage Quality Analyzer',
    sihCode: 'SIH26111',
    timestamp: new Date().toISOString(),
    connectedClients: clients.size
  });
});

// Get Latest Telemetry for All Pits
app.get('/api/v1/sensors/latest', (req, res) => {
  res.json({
    success: true,
    data: simulator.getAllPits()
  });
});

// Get Chronological History for Charting
app.get('/api/v1/sensors/history', (req, res) => {
  const pitId = req.query.pit || 'pit-a';
  const limit = parseInt(req.query.limit) || 30;
  const history = simulator.getHistory(pitId, limit);
  res.json({
    success: true,
    pitId,
    count: history.length,
    history
  });
});

// Real ESP32 Hardware Telemetry Ingestion Endpoint
// Real ESP32 microcontrollers POST their sensor data here!
app.post('/api/v1/sensors/telemetry', (req, res) => {
  const { deviceId, pitId, temperature_core, ph_level, moisture_pct, ammonia_ppm, nir_bands } = req.body;

  if (!deviceId || ph_level === undefined || moisture_pct === undefined) {
    return res.status(400).json({
      error: 'Invalid telemetry schema. Required: deviceId, ph_level, moisture_pct'
    });
  }

  const processed = simulator.ingestHardwareTelemetry(req.body);

  // Broadcast to all active browser dashboards in real-time!
  broadcast({
    type: 'HARDWARE_TELEMETRY',
    deviceId,
    pitId: pitId || 'pit-a',
    data: processed,
    timestamp: new Date().toISOString()
  });

  console.log(`[Hardware Ingest] Received telemetry from ${deviceId} for pit ${pitId || 'pit-a'}`);

  res.status(201).json({
    success: true,
    message: 'Telemetry ingested and broadcasted successfully',
    inference: processed.inference
  });
});

// Trigger Anomaly Simulation (e.g. Aerobic Spoilage, Air leak)
app.post('/api/v1/sensors/anomaly-trigger', (req, res) => {
  const { pitId = 'pit-a', active = true } = req.body;
  const result = simulator.triggerAnomaly(pitId, active);
  
  broadcast({
    type: 'ANOMALY_STATUS',
    pitId,
    active,
    data: result
  });

  res.json({
    success: true,
    pitId,
    active,
    status: result ? result.status : 'unknown'
  });
});

// Manual Lab Sample Analysis
app.post('/api/v1/analyze/manual-sample', (req, res) => {
  const inference = inferNutritionalProfile(req.body);
  res.json({
    success: true,
    sampleData: req.body,
    inference
  });
});

// Silage Image Vision Inspection & Penn State Particle Separator analysis
app.post('/api/v1/vision/analyze-image', (req, res) => {
  const analysis = analyzeSilageImage(req.body);
  res.json({
    success: true,
    analysis
  });
});

// ICAR-Compliant Ration Balancer
app.post('/api/v1/ration/optimize', (req, res) => {
  const optimization = optimizeRation(req.body);
  res.json({
    success: true,
    optimization
  });
});

// Firebase / MQTT Configuration Schema
app.get('/api/v1/config/firebase', (req, res) => {
  res.json({
    platform: 'SmartFeed AI Cloud Gateway',
    firebase: {
      authDomain: 'dairyfeed-ai-sih26111.firebaseapp.com',
      databaseURL: 'https://dairyfeed-ai-sih26111-default-rtdb.asia-southeast1.firebasedatabase.app',
      projectId: 'dairyfeed-ai-sih26111',
      storageBucket: 'dairyfeed-ai-sih26111.appspot.com',
      realtimePath: '/telemetry/esp32_nodes/{deviceId}'
    },
    mqtt: {
      broker: 'broker.emqx.io (or private AWS/HiveMQ broker)',
      port: 8883,
      topicTemplate: 'dairy/sih26111/farms/{farmId}/silos/{pitId}/telemetry',
      qos: 1
    },
    supportedSensors: [
      { name: 'DS18B20 Multi-Depth Temperature Probe', protocol: '1-Wire (GPIO 4)' },
      { name: 'Analog pH Probe (DFRobot)', protocol: 'ADC (GPIO 34)' },
      { name: 'DHT22 / SHT31 Headspace Humidity', protocol: 'Digital (GPIO 15)' },
      { name: 'MQ-135 Ammonia & VOC Gas Sensor', protocol: 'ADC (GPIO 35)' },
      { name: 'AS7262 6-Channel Visible NIR Spectrometer', protocol: 'I2C (GPIO 21, 22)' }
    ]
  });
});

server.listen(PORT, () => {
  console.log(`\n=====================================================`);
  console.log(`🚀 Smart Feed & Silage Quality Analyzer Backend (SIH 26111)`);
  console.log(`📡 HTTP Server listening on http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Server active on ws://localhost:${PORT}`);
  console.log(`=====================================================\n`);
});
