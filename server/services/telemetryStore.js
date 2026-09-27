const { DatabaseSync } = require('node:sqlite');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const { inferNutritionalProfile } = require('./silageAnalytics');

function enrich(reading, now = Date.now()) {
  const sampleKeys = ['temperature_core', 'ph_level', 'moisture_pct', 'ammonia_ppm', 'nir_bands'];
  const complete = sampleKeys.every(key => reading[key] !== undefined);
  return { ...reading, source: 'measured', stale: now - Date.parse(reading.timestamp) > 30000,
    inference: complete ? inferNutritionalProfile(Object.fromEntries(sampleKeys.map(key => [key, reading[key]]))) : null,
    inferenceStatus: complete ? 'unvalidated' : 'insufficient_measurements' };
}
class TelemetryStore {
  constructor(filename, retention = 10000) {
    if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true });
    this.db = new DatabaseSync(filename);
    this.retention = retention;
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS telemetry (id INTEGER PRIMARY KEY, pit_id TEXT NOT NULL, received_at TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS telemetry_pit_id ON telemetry(pit_id, id DESC);`);
  }
  ingest(data) {
    const reading = { ...data, source: 'measured', timestamp: new Date().toISOString(), name: data.pitId };
    // Compute before mutation. A failed inference never poisons persistent state.
    const result = enrich(reading);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('INSERT INTO telemetry(pit_id, received_at, payload) VALUES (?, ?, ?)').run(data.pitId, reading.timestamp, JSON.stringify(reading));
      this.db.prepare('DELETE FROM telemetry WHERE pit_id = ? AND id NOT IN (SELECT id FROM telemetry WHERE pit_id = ? ORDER BY id DESC LIMIT ?)').run(data.pitId, data.pitId, this.retention);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
    return result;
  }
  latest() {
    return this.db.prepare('SELECT payload FROM telemetry WHERE id IN (SELECT MAX(id) FROM telemetry GROUP BY pit_id) ORDER BY pit_id').all().map(row => enrich(JSON.parse(row.payload)));
  }
  history(pitId, limit) {
    return this.db.prepare('SELECT payload FROM telemetry WHERE pit_id = ? ORDER BY id DESC LIMIT ?').all(pitId, limit).reverse().map(row => enrich(JSON.parse(row.payload)));
  }
  close() { this.db.close(); }
}
module.exports = { TelemetryStore, enrich };
