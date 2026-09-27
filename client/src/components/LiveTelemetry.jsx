import { Thermometer, Droplets, FlaskConical, Battery, Wind, MapPin, ArrowRight } from 'lucide-react';
const metrics = [
  ['temperature_core', 'Core temperature', '°C'], ['temperature_top', 'Surface temperature', '°C'],
  ['temperature_bottom', 'Base temperature', '°C'], ['ph_level', 'pH', ''],
  ['moisture_pct', 'Feed moisture', '%'], ['humidity_pct', 'Headspace humidity', '% RH'],
  ['ammonia_ppm', 'Ammonia', 'ppm'], ['battery_pct', 'Battery', '%'],
];
const icons = { temperature_core: Thermometer, temperature_top: Thermometer, temperature_bottom: Thermometer, ph_level: FlaskConical, moisture_pct: Droplets, humidity_pct: Droplets, ammonia_ppm: Wind, battery_pct: Battery };
const essentials = ['temperature_core', 'ph_level', 'moisture_pct', 'battery_pct'];
const format = value => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : 'Unavailable';
export default function LiveTelemetry({ farmerMode, pitData, allPits, selectedPitId, setSelectedPitId, history, isLiveMode, isStale, onTriggerAnomaly }) {
  if (!pitData) return <div className="glass-panel notice">{isLiveMode ? 'No authenticated measurements are available. Connect with a dashboard token and wait for an authorized device.' : 'Waiting for the demonstration server. No local fallback values will be generated.'}</div>;
  return <section className="telemetry-content">
    <div className="glass-panel notice location-panel">
      <div><span className="eyebrow"><MapPin size={14} /> SENSOR LOCATION</span><label className="location-selector"><span className="sr-only">Sensor location</span> <select className="form-select" value={selectedPitId} onChange={e => setSelectedPitId(e.target.value)}>
        {allPits.map(p => <option value={p.pitId} key={p.pitId}>{p.name || p.pitId}</option>)}
      </select></label>
      <p>{pitData.source === 'measured' ? 'Measured' : 'Simulated'} · {pitData.deviceId} · {pitData.timestamp ? new Date(pitData.timestamp).toLocaleString() : 'Demo starting state'}</p>
      {isStale && <p role="alert">Stale measurements. Values below are the last received readings, not the current state.</p>}
      </div>
      {!isLiveMode && <button className="btn-voice" onClick={() => onTriggerAnomaly(pitData.pitId, !pitData.abnormalTriggered)}>{pitData.abnormalTriggered ? 'Reset demonstration' : 'Simulate heating'}<ArrowRight size={16} /></button>}
    </div>
    <div className="sensor-grid">{metrics.filter(([key]) => !farmerMode || essentials.includes(key)).map(([key, label, unit]) => {
      const Icon = icons[key];
      return <div className="glass-panel sensor-card" key={key}><div className="sensor-card-heading"><h3>{label}</h3><span className="sensor-icon"><Icon size={20} /></span></div><p className="sensor-value">{format(pitData[key])} <span>{pitData[key] == null ? '' : unit}</span></p><span className="sensor-caption">{isStale ? 'Last received reading' : isLiveMode ? 'Device measurement' : 'Simulated reading'}</span></div>;
    })}</div>
    <div className="glass-panel notice">
      <h3>Experimental estimates — not laboratory results</h3>
      {pitData.inference ? <div className="measurement-grid">{[['dryMatter', 'Dry matter', '%'], ['crudeProtein', 'Crude protein', '%'], ['tdn', 'Total digestible nutrients', '%']].map(([key, label, unit]) => <p key={key}>{label}: <strong>{format(pitData.inference[key])}{unit}</strong></p>)}</div> : <p>Insufficient measurements for estimation. Feed moisture cannot be replaced with headspace humidity.</p>}
    </div>
    <div className="glass-panel notice" style={{ overflowX: 'auto' }}><h3>Recent {isLiveMode ? 'measured' : 'simulated'} readings</h3>
      {history.length ? <table className="reading-table"><caption className="sr-only">Last 15 sensor readings, newest first</caption><thead><tr><th>Received at</th><th>Core °C</th><th>pH</th><th>Feed moisture %</th></tr></thead><tbody>{history.slice(-15).reverse().map((p, i) => <tr key={`${p.timestamp}-${i}`}><td>{new Date(p.timestamp).toLocaleTimeString()}</td><td>{format(p.temperature_core)}</td><td>{format(p.ph_level)}</td><td>{format(p.moisture_pct)}</td></tr>)}</tbody></table> : <p>No history available.</p>}
    </div>
  </section>;
}
