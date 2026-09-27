export default function SiloFleetManager({ allPits, selectedPitId, setSelectedPitId }) {
  return <section className="glass-panel notice"><h2>Sensor locations</h2><p>Locations from the selected data source. No inventory or capacity measurements are inferred.</p>
    {!allPits.length && <p>No locations available.</p>}
    {allPits.map(pit => <button className="btn-voice" key={pit.pitId} aria-pressed={selectedPitId === pit.pitId} onClick={() => setSelectedPitId(pit.pitId)}>{pit.name || pit.pitId} · {pit.source}</button>)}
  </section>;
}
