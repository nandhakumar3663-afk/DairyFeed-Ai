const metrics = [
  ['temperature_core', 'Core temperature', '°C'], ['temperature_top', 'Surface temperature', '°C'],
  ['temperature_bottom', 'Base temperature', '°C'], ['ph_level', 'pH', ''],
  ['moisture_pct', 'Feed moisture', '%'], ['humidity_pct', 'Headspace humidity', '% RH'],
  ['ammonia_ppm', 'Ammonia', 'ppm'], ['battery_pct', 'Battery', '%'],
];
const format = value => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : 'Unavailable';
export default function LiveTelemetry({ pitData, allPits, selectedPitId, setSelectedPitId, history, isLiveMode, isStale, onTriggerAnomaly }) {
  if (!pitData) return <div className="glass-panel notice">{isLiveMode ? 'No authenticated measurements are available. Connect with a dashboard token and wait for an authorized device.' : 'Waiting for the demonstration server. No local fallback values will be generated.'}</div>;
  return <section className="telemetry-content">
    <div className="glass-panel notice">
      <label>Sensor location <select className="form-select" value={selectedPitId} onChange={e => setSelectedPitId(e.target.value)}>
        {allPits.map(p => <option value={p.pitId} key={p.pitId}>{p.name || p.pitId}</option>)}
      </select></label>
      <p>{pitData.source === 'measured' ? 'Measured' : 'Simulated'} · {pitData.deviceId} · {pitData.timestamp ? new Date(pitData.timestamp).toLocaleString() : 'Demo starting state'}</p>
      {isStale && <p role="alert">Stale measurements. Values below are the last received readings, not the current state.</p>}
      {!isLiveMode && <button className="btn-voice" onClick={() => onTriggerAnomaly(pitData.pitId, !pitData.abnormalTriggered)}>{pitData.abnormalTriggered ? 'Reset demonstration' : 'Simulate heating'}</button>}
    </div>
    <div className="measurement-grid">{metrics.map(([key, label, unit]) => <div className="glass-panel notice" key={key}><h3>{label}</h3><p className="measurement-value">{format(pitData[key])} {pitData[key] == null ? '' : unit}</p></div>)}</div>
    <div className="glass-panel notice">
      <h3>Experimental estimates — not laboratory results</h3>
      {pitData.inference ? <div className="measurement-grid">{[['dryMatter', 'Dry matter', '%'], ['crudeProtein', 'Crude protein', '%'], ['tdn', 'Total digestible nutrients', '%']].map(([key, label, unit]) => <p key={key}>{label}: <strong>{format(pitData.inference[key])}{unit}</strong></p>)}</div> : <p>Insufficient measurements for estimation. Feed moisture cannot be replaced with headspace humidity.</p>}
    </div>
    <div className="glass-panel notice" style={{ overflowX: 'auto' }}><h3>Recent {isLiveMode ? 'measured' : 'simulated'} readings</h3>
      {history.length ? <table className="reading-table"><thead><tr><th>Received at</th><th>Core °C</th><th>pH</th><th>Feed moisture %</th></tr></thead><tbody>{history.slice(-15).map((p, i) => <tr key={`${p.timestamp}-${i}`}><td>{new Date(p.timestamp).toLocaleTimeString()}</td><td>{format(p.temperature_core)}</td><td>{format(p.ph_level)}</td><td>{format(p.moisture_pct)}</td></tr>)}</tbody></table> : <p>No history available.</p>}
    </div>
  </section>;
}
