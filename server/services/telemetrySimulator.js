/**
 * ESP32 Silage Probe Telemetry Simulator
 * Generates dynamic physical sensor readings reflecting microbial fermentation kinetics.
 */

const { inferNutritionalProfile } = require('./silageAnalytics');

class TelemetrySimulator {
  constructor() {
    this.pits = {
      'pit-a': {
        pitId: 'pit-a',
        name: 'Bunker Silo #1 (Kharif Maize)',
        deviceId: 'ESP32-NODE-01',
        moisture_pct: 65.4,
        ph_level: 3.92,
        temperature_core: 24.8,
        temperature_top: 28.2,
        temperature_bottom: 23.1,
        ammonia_ppm: 14.2,
        co2_ppm: 1250,
        battery_pct: 94,
        wifi_rssi: -58,
        nir_bands: [430, 520, 640, 720, 810, 895],
        status: 'Optimal Anaerobic',
        abnormalTriggered: false
      },
      'pit-b': {
        pitId: 'pit-b',
        name: 'Trench Pit #2 (Sorghum / Jowar)',
        deviceId: 'ESP32-NODE-02',
        moisture_pct: 69.8,
        ph_level: 4.45,
        temperature_core: 33.6,
        temperature_top: 36.8,
        temperature_bottom: 31.0,
        ammonia_ppm: 34.5,
        co2_ppm: 2100,
        battery_pct: 82,
        wifi_rssi: -67,
        nir_bands: [415, 495, 610, 690, 780, 860],
        status: 'Sub-Optimal / Warm',
        abnormalTriggered: false
      },
      'bale-04': {
        pitId: 'bale-04',
        name: 'Silage Bale #04 (Alfalfa / Lucerne)',
        deviceId: 'ESP32-PORTABLE-01',
        moisture_pct: 58.2,
        ph_level: 4.60,
        temperature_core: 22.4,
        temperature_top: 23.5,
        temperature_bottom: 22.1,
        ammonia_ppm: 16.0,
        co2_ppm: 980,
        battery_pct: 76,
        wifi_rssi: -72,
        nir_bands: [440, 530, 650, 730, 825, 910],
        status: 'Stable Bale',
        abnormalTriggered: false
      }
    };

    this.history = {
      'pit-a': [],
      'pit-b': [],
      'bale-04': []
    };

    // Pre-seed 30 minutes of historical readings
    for (const pit of Object.values(this.pits)) pit.source = 'simulated';
    this.seedHistory();
  }

  sample(pit) {
    return Object.fromEntries(['temperature_core', 'ph_level', 'moisture_pct', 'ammonia_ppm', 'nir_bands'].map(key => [key, pit[key]]));
  }

  seedHistory() {
    const now = Date.now();
    for (const pitId of Object.keys(this.pits)) {
      const pit = this.pits[pitId];
      for (let i = 25; i >= 0; i--) {
        const timestamp = new Date(now - i * 60 * 1000).toISOString();
        const reading = {
          ...pit,
          timestamp,
          temperature_core: Number((pit.temperature_core + (Math.random() * 0.4 - 0.2)).toFixed(2)),
          ph_level: Number((pit.ph_level + (Math.random() * 0.04 - 0.02)).toFixed(2)),
          moisture_pct: Number((pit.moisture_pct + (Math.random() * 0.3 - 0.15)).toFixed(1)),
          ammonia_ppm: Number((pit.ammonia_ppm + (Math.random() * 1.0 - 0.5)).toFixed(1))
        };
        const inference = inferNutritionalProfile(this.sample(reading));
        this.history[pitId].push({ ...reading, inference });
      }
    }
  }

  tick() {
    const updates = [];
    const timestamp = new Date().toISOString();

    for (const pitId of Object.keys(this.pits)) {
      const pit = this.pits[pitId];

      if (pit.abnormalTriggered) {
        // Simulating aerobic spoilage or air seal rupture:
        // Core temp climbs rapidly, pH rises, ammonia rises
        pit.temperature_core = Math.min(48.0, Number((pit.temperature_core + 0.35).toFixed(2)));
        pit.temperature_top = Math.min(52.0, Number((pit.temperature_top + 0.50).toFixed(2)));
        pit.ph_level = Math.min(5.8, Number((pit.ph_level + 0.04).toFixed(2)));
        pit.ammonia_ppm = Math.min(85.0, Number((pit.ammonia_ppm + 1.2).toFixed(1)));
        pit.status = 'AEROBIC SPOILAGE ALERT!';
      } else {
        // Natural micro-variations
        const tDelta = (Math.random() * 0.16 - 0.08);
        pit.temperature_core = Number(Math.max(18, Math.min(45, pit.temperature_core + tDelta)).toFixed(2));
        pit.temperature_top = Number((pit.temperature_core + 2.5 + Math.random() * 0.4).toFixed(2));
        
        const phDelta = (Math.random() * 0.02 - 0.01);
        pit.ph_level = Number(Math.max(3.5, Math.min(6.5, pit.ph_level + phDelta)).toFixed(2));

        const mDelta = (Math.random() * 0.1 - 0.05);
        pit.moisture_pct = Number(Math.max(45, Math.min(78, pit.moisture_pct + mDelta)).toFixed(1));

        pit.ammonia_ppm = Number(Math.max(5, Math.min(100, pit.ammonia_ppm + (Math.random() * 0.4 - 0.2))).toFixed(1));
      }

      // Decrement battery very slowly
      if (Math.random() > 0.95) {
        pit.battery_pct = Math.max(10, pit.battery_pct - 1);
      }

      const reading = {
        ...pit,
        timestamp
      };

      const inference = inferNutritionalProfile(this.sample(reading));
      const fullTelemetry = { ...reading, inference };

      // Push to history
      this.history[pitId].push(fullTelemetry);
      if (this.history[pitId].length > 100) {
        this.history[pitId].shift();
      }

      updates.push(fullTelemetry);
    }

    return updates;
  }

  triggerAnomaly(pitId, activate = true) {
    if (this.pits[pitId]) {
      this.pits[pitId].abnormalTriggered = activate;
      if (!activate) {
        // Reset to nominal values
        if (pitId === 'pit-a') {
          this.pits[pitId].temperature_core = 24.8;
          this.pits[pitId].ph_level = 3.92;
          this.pits[pitId].ammonia_ppm = 14.2;
          this.pits[pitId].status = 'Optimal Anaerobic';
        } else if (pitId === 'pit-b') {
          this.pits[pitId].temperature_core = 32.0;
          this.pits[pitId].ph_level = 4.40;
          this.pits[pitId].ammonia_ppm = 30.0;
          this.pits[pitId].status = 'Sub-Optimal / Warm';
        }
      }
      return this.pits[pitId];
    }
    return null;
  }

  getPitData(pitId) {
    return this.pits[pitId] || null;
  }

  getAllPits() {
    return Object.values(this.pits).map(pit => ({
      ...pit,
      inference: inferNutritionalProfile(this.sample(pit))
    }));
  }

  getHistory(pitId, limit = 50) {
    const list = this.history[pitId] || [];
    return list.slice(-limit);
  }

  ingestSimulationTelemetry(data) {
    const pitId = data.pitId || 'pit-a';
    if (!this.pits[pitId]) {
      this.pits[pitId] = {
        pitId,
        name: `ESP32 Remote Node (${data.deviceId || 'ESP32-LIVE'})`,
        history: []
      };
      this.history[pitId] = [];
    }

    Object.assign(this.pits[pitId], data, { source: 'simulated' });
    const timestamp = new Date().toISOString();
    const reading = { ...this.pits[pitId], timestamp };
    const inference = inferNutritionalProfile(this.sample(reading));
    const fullTelemetry = { ...reading, inference };

    this.history[pitId].push(fullTelemetry);
    if (this.history[pitId].length > 100) this.history[pitId].shift();

    return fullTelemetry;
  }
}

module.exports = { TelemetrySimulator };
