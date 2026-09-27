import { useState } from 'react';
import { silageService } from '../services/api';
import firmware from '../../../server/firmware/esp32_silage_node.ino?raw';
export default function HardwareDocs() {
  const [result, setResult] = useState('');
  const [sending, setSending] = useState(false);
  const send = async () => {
    setSending(true);
    const res = await silageService.sendSimulationTelemetry({ deviceId: 'DEMO-ONLY', pitId: 'pit-a', temperature_core: 25.6, ph_level: 4.08, moisture_pct: 65.2, ammonia_ppm: 15, nir_bands: [430, 520, 640, 720, 810, 895] });
    setSending(false); setResult(res.success ? 'Demonstration packet accepted into simulation only.' : res.error);
  };
  return <section className="glass-panel notice"><h2>Hardware integration</h2>
    <p>Measured packets require a device-specific bearer token and an authorized location. Only actual readings are sent; failed or uncalibrated sensors are omitted. Headspace humidity is separate from feed moisture.</p>
    <p>Firmware configuration and TLS certificate instructions are in server/firmware/README.md. The sketch has not been validated on physical hardware.</p>
    <button className="btn-voice" onClick={send} disabled={sending}>{sending ? 'Sending…' : 'Send demonstration packet (simulation only)'}</button><p role="status">{result}</p>
    <details><summary>ESP32 firmware source</summary><pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap' }}>{firmware}</pre></details>
  </section>;
}
