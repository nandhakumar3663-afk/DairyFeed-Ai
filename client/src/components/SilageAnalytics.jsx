export default function SilageAnalytics({ activePitData }) {
  const inference = activePitData?.inference;
  if (!inference) return <div className="glass-panel notice">No complete sample for estimation.</div>;
  return <section className="glass-panel notice"><h2>Experimental sample estimates</h2>
    <p>Source: {activePitData.source}. These formulas have not been calibrated against laboratory results. The fermentation score is an experimental heuristic, not an accredited Flieg measurement.</p>
    <div className="measurement-grid">{[['dryMatter', 'Dry matter (%)'], ['crudeProtein', 'Crude protein (%)'], ['ndf', 'NDF (%)'], ['adf', 'ADF (%)'], ['tdn', 'TDN (%)'], ['nel', 'Energy estimate (Mcal/kg)'], ['starch', 'Starch (%)']].map(([key, label]) => <div className="glass-panel notice" key={key}><h3>{label}</h3><p className="measurement-value">{inference[key]}</p><p>Unvalidated estimate</p></div>)}</div>
    <p>Experimental fermentation score: {inference.flieg.score}/100. Spoilage indicator: {inference.moldRisk}/100 (not a probability or toxin concentration).</p>
    <p>No organic-acid concentrations or feed-safety decisions are established by this display. Obtain laboratory analysis before making safety or certification claims.</p>
  </section>;
}
