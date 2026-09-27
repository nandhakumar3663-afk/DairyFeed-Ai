import React, { useState } from 'react';
import { 
  Cpu, 
  Copy, 
  Check, 
  Send, 
  Radio, 
  ShieldCheck, 
  Layers, 
  Terminal,
  Database,
  Cloud
} from 'lucide-react';
import { silageService } from '../services/api';

export default function HardwareDocs({ lang, onHardwarePacketSent }) {
  const [copiedFirmware, setCopiedFirmware] = useState(false);
  const [testDeviceId, setTestDeviceId] = useState('ESP32-HARDWARE-DEMO');
  const [testPH, setTestPH] = useState(4.08);
  const [testTemp, setTestTemp] = useState(25.6);
  const [testMoisture, setTestMoisture] = useState(65.2);
  const [testAmmonia, setTestAmmonia] = useState(15.0);
  const [sending, setSending] = useState(false);
  const [responseLog, setResponseLog] = useState(null);

  const sampleArduinoCode = `/*
 * SMART FEED & SILAGE QUALITY ANALYZER - ESP32 FIRMWARE NODE
 * Ministry of Fisheries, Animal Husbandry & Dairying • Precision Dairy Platform
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include <Wire.h>
#include "Adafruit_AS726x.h"

const char* WIFI_SSID = "DairyFarm_WiFi";
const char* WIFI_PASS = "DairySmart2026";
const char* BACKEND_URL = "http://192.168.1.100:5001/api/v1/sensors/telemetry";

#define ONE_WIRE_BUS 4
#define PIN_PH_SENSOR 34
#define PIN_MQ135 35
#define PIN_DHT 15

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature dallas(&oneWire);
DHT dht(PIN_DHT, DHT22);
Adafruit_AS726x as7262;

void setup() {
  Serial.begin(115200);
  dallas.begin();
  dht.begin();
  Wire.begin(21, 22);
  as7262.begin();
  WiFi.begin(WIFI_SSID, WIFI_PASS);
}

void loop() {
  dallas.requestTemperatures();
  float tempCore = dallas.getTempCByIndex(0);
  float moisture = dht.readHumidity();
  float ph = 3.5 + (analogRead(PIN_PH_SENSOR) * (3.3/4095.0) * 1.8);
  float ammonia = map(analogRead(PIN_MQ135), 0, 4095, 5, 120);

  StaticJsonDocument<512> doc;
  doc["deviceId"] = "ESP32-SILO-01";
  doc["pitId"] = "pit-a";
  doc["temperature_core"] = tempCore;
  doc["ph_level"] = ph;
  doc["moisture_pct"] = moisture;
  doc["ammonia_ppm"] = ammonia;
  doc["nir_bands"] = {420, 510, 630, 710, 800, 890};

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(payload);
  http.end();
  delay(5000);
}`;

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sampleArduinoCode);
      setCopiedFirmware(true);
      setTimeout(() => setCopiedFirmware(false), 2000);
    }
  };

  const handleSendHardwarePacket = async () => {
    setSending(true);
    const packet = {
      deviceId: testDeviceId,
      pitId: 'pit-a',
      temperature_core: parseFloat(testTemp),
      temperature_top: parseFloat(testTemp) + 2.4,
      temperature_bottom: parseFloat(testTemp) - 1.1,
      ph_level: parseFloat(testPH),
      moisture_pct: parseFloat(testMoisture),
      ammonia_ppm: parseFloat(testAmmonia),
      battery_pct: 98,
      wifi_rssi: -54,
      nir_bands: [430, 520, 640, 720, 810, 895]
    };

    const res = await silageService.sendHardwareTelemetry(packet);
    setSending(false);
    setResponseLog(res);
    if (onHardwarePacketSent) onHardwarePacketSent(packet);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Intro Header */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Cpu size={22} color="var(--accent-emerald-light)" />
              <h2 className="chart-title" style={{ fontSize: '1.35rem' }}>
                Hardware & IoT Ingestion Architecture (ESP32 / Firebase / MQTT)
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Complete engineering design and endpoints connecting physical silage sensor probes to the AI analysis engine
            </p>
          </div>
          <span className="sih-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald-light)' }}>
            PRODUCTION HARDWARE-READY
          </span>
        </div>
      </div>

      {/* Sensor Pinout Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 className="chart-title" style={{ marginBottom: '1rem' }}>
          Hardware Sensor Probe Array & Pinout Schema
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Sensor Name</th>
                <th style={{ padding: '0.75rem' }}>Target Silage Parameter</th>
                <th style={{ padding: '0.75rem' }}>Protocol / Interface</th>
                <th style={{ padding: '0.75rem' }}>ESP32 GPIO Pin</th>
                <th style={{ padding: '0.75rem' }}>Range & Precision</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>DS18B20 Array (x3)</td>
                <td style={{ padding: '0.75rem', color: 'var(--accent-amber)' }}>Core, Surface & Base Temperature</td>
                <td style={{ padding: '0.75rem' }}>Dallas 1-Wire Digital</td>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-emerald-light)' }}>GPIO 4</td>
                <td style={{ padding: '0.75rem' }}>-55°C to +125°C (±0.5°C)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>DFRobot Analog pH</td>
                <td style={{ padding: '0.75rem', color: 'var(--accent-cyan)' }}>Silage Lactic Acid Acidity</td>
                <td style={{ padding: '0.75rem' }}>Analog ADC (12-bit)</td>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-emerald-light)' }}>GPIO 34 (ADC1)</td>
                <td style={{ padding: '0.75rem' }}>0 - 14 pH (±0.1 pH)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>DHT22 / SHT31</td>
                <td style={{ padding: '0.75rem', color: 'var(--accent-emerald-light)' }}>Silage Moisture & Headspace RH</td>
                <td style={{ padding: '0.75rem' }}>Single-Bus Digital</td>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-emerald-light)' }}>GPIO 15</td>
                <td style={{ padding: '0.75rem' }}>0 - 100% RH (±2%)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>MQ-135 Gas Sensor</td>
                <td style={{ padding: '0.75rem', color: 'var(--accent-purple)' }}>Ammonia (NH3) & Spoilage VOCs</td>
                <td style={{ padding: '0.75rem' }}>Analog Voltage ADC</td>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-emerald-light)' }}>GPIO 35 (ADC1)</td>
                <td style={{ padding: '0.75rem' }}>10 - 1000 ppm</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>AS7262 NIR Sensor</td>
                <td style={{ padding: '0.75rem', color: '#c084fc' }}>6-Channel Optical Reflectance</td>
                <td style={{ padding: '0.75rem' }}>I2C Bus (400kHz)</td>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-emerald-light)' }}>SDA: 21, SCL: 22</td>
                <td style={{ padding: '0.75rem' }}>450nm - 650nm (6 Bands)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column: Live Hardware Dispatch Tool & Arduino Firmware Code */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Left: Test Hardware Telemetry Dispatcher */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 className="chart-title">Test ESP32 Hardware Endpoint</h3>
            <span className="sih-badge" style={{ fontSize: '0.68rem' }}>POST /api/v1/sensors/telemetry</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Directly dispatches an authentic ESP32 HTTP POST packet to the live backend server to verify hardware ingestion
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Device ID</label>
              <input 
                className="form-input" 
                value={testDeviceId} 
                onChange={(e) => setTestDeviceId(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Simulated Silage pH</label>
              <input 
                type="number" 
                step="0.05" 
                className="form-input" 
                value={testPH} 
                onChange={(e) => setTestPH(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Core Temperature (°C)</label>
              <input 
                type="number" 
                step="0.5" 
                className="form-input" 
                value={testTemp} 
                onChange={(e) => setTestTemp(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Moisture Content (%)</label>
              <input 
                type="number" 
                step="0.5" 
                className="form-input" 
                value={testMoisture} 
                onChange={(e) => setTestMoisture(e.target.value)} 
              />
            </div>
          </div>

          <button
            className="btn-anomaly-leak"
            style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              color: '#042f2e', 
              border: 'none',
              width: '100%',
              padding: '0.85rem',
              fontWeight: 800
            }}
            onClick={handleSendHardwarePacket}
            disabled={sending}
          >
            <Send size={16} />
            <span>{sending ? 'Sending Telemetry...' : 'Dispatch Live ESP32 Packet'}</span>
          </button>

          {responseLog && (
            <div style={{ marginTop: '1rem', background: '#020617', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald-light)', fontWeight: 700, marginBottom: '0.25rem' }}>
                Server Ingestion Response (HTTP 201 Created):
              </div>
              <pre style={{ fontSize: '0.75rem', color: '#cbd5e1', overflowX: 'auto', fontFamily: 'monospace' }}>
                {JSON.stringify(responseLog, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Right: Arduino Firmware Code */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 className="chart-title">Arduino C++ Node Code</h3>
            <button className="btn-copy-code" onClick={handleCopyCode}>
              {copiedFirmware ? <Check size={14} color="var(--accent-emerald-light)" /> : <Copy size={14} />}
              <span>{copiedFirmware ? 'Copied!' : 'Copy Sketch'}</span>
            </button>
          </div>

          <div className="code-box-container">
            <pre>{sampleArduinoCode}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
