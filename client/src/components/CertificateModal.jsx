export default function CertificateModal({ isOpen, onClose, pitData }) {
  if (!isOpen || !pitData) return null;
  const capturedAt = pitData.timestamp || 'Demo starting state';
  return <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Unvalidated sample report" onClick={onClose}>
    <div className="certificate-sheet notice" onClick={e => e.stopPropagation()}>
      <div className="no-print"><button className="btn-voice" onClick={onClose}>Close report</button><button className="btn-voice" onClick={() => window.print()}>Print / save PDF</button></div>
      <h1>Experimental sample report</h1>
      <p><strong>UNVALIDATED — NOT A LABORATORY CERTIFICATE OR FEED SAFETY APPROVAL</strong></p>
      <p>Source: {pitData.source} · Device: {pitData.deviceId} · Location: {pitData.pitId}</p>
      <p>Received at: {capturedAt}. This is a frozen snapshot; live updates do not change this report.</p>
      {pitData.stale && <p>STALE: no recent measurement at the time this report was opened.</p>}
      <table className="reading-table"><thead><tr><th>Sensor reading</th><th>Value</th></tr></thead><tbody>
        {[['temperature_core', 'Core temperature (°C)'], ['ph_level', 'pH'], ['moisture_pct', 'Feed moisture (%)'], ['humidity_pct', 'Headspace humidity (% RH)'], ['ammonia_ppm', 'Ammonia (ppm)']].map(([key, label]) => <tr key={key}><td>{label}</td><td>{pitData[key] ?? 'Not measured'}</td></tr>)}
      </tbody></table>
      <h2>Unvalidated estimates</h2>
      {pitData.inference ? <table className="reading-table"><tbody>{[['dryMatter', 'Dry matter (%)'], ['crudeProtein', 'Crude protein (%)'], ['tdn', 'TDN (%)'], ['ndf', 'NDF (%)'], ['adf', 'ADF (%)']].map(([key, label]) => <tr key={key}><td>{label}</td><td>{pitData.inference[key]}</td></tr>)}</tbody></table> : <p>Insufficient measurements for inference.</p>}
      <p>These estimates use experimental formulas without laboratory-backed calibration. No aflatoxin concentration, mold identification, certification, accreditation or digital verification is provided.</p>
    </div>
  </div>;
}
