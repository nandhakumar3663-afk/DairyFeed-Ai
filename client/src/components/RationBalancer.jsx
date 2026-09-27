import { useState } from 'react';
import { ANIMAL_PROFILES, optimizeRation } from '../../../shared/rationOptimizer.mjs';
export default function RationBalancer({ activePitData }) {
  const [animalType, setAnimalType] = useState('crossbred_hf');
  const [bodyWeight, setBodyWeight] = useState(480);
  const [milkYield, setMilkYield] = useState(14);
  const [fatPercentage, setFat] = useState(4);
  const [lactationStage, setStage] = useState('mid');
  const [baseline, setBaseline] = useState('');
  const [prices, setPrices] = useState({ silage: 3.5, green: 2, straw: 5, concentrate: 28, mineralsDaily: 12 });
  const [shareStatus, setShareStatus] = useState('');
  const inference = activePitData?.inference;
  let result; let error;
  if (inference) {
    try { result = optimizeRation({ animalType, bodyWeight, milkYield, fatPercentage, lactationStage, prices,
      baselineDailyCostINR: baseline === '' ? null : Number(baseline),
      silageQuality: { ...inference, fliegScore: inference.flieg.score } }); }
    catch (e) { error = e.message; }
  }
  const plan = result?.rationPlan;
  const share = async () => {
    const message = `UNVALIDATED ILLUSTRATION — not a feeding prescription\nSource: ${activePitData.source}\n${result.warning}\n${result.warnings.join('\n')}\n${JSON.stringify(plan, null, 2)}\nEstimated cost: ₹${result.economics.dailyFeedCostINR}\nComparison savings: ${result.economics.dailySavingsINR === null ? 'Not supplied' : `₹${result.economics.dailySavingsINR}`}`;
    try { await navigator.clipboard.writeText(message); setShareStatus('Copied'); } catch { setShareStatus('Copy unavailable in this browser'); }
  };
  return <section className="glass-panel notice"><h2>Experimental ration calculator</h2>
    <p>Uses shared illustrative assumptions in the browser and API. This is not a validated nutrition recommendation or a least-cost optimization.</p>
    <div className="measurement-grid">
      <label>Animal<select className="form-select" value={animalType} onChange={e => setAnimalType(e.target.value)}>{Object.entries(ANIMAL_PROFILES).map(([key, p]) => <option key={key} value={key}>{p.name}</option>)}</select></label>
      <label>Body weight (kg)<input type="number" min="150" max="1000" value={bodyWeight} onChange={e => setBodyWeight(e.target.value === '' ? NaN : Number(e.target.value))} /></label>
      <label>Milk yield (L/day)<input type="number" min="0" max="60" disabled={lactationStage === 'dry'} value={milkYield} onChange={e => setMilkYield(e.target.value === '' ? NaN : Number(e.target.value))} /></label>
      <label>Milk fat (%)<input type="number" min="2" max="10" step="0.1" value={fatPercentage} onChange={e => setFat(e.target.value === '' ? NaN : Number(e.target.value))} /></label>
      <label>Lactation stage<select className="form-select" value={lactationStage} onChange={e => { setStage(e.target.value); if (e.target.value === 'dry') setMilkYield(0); }}>{['early', 'mid', 'late', 'dry'].map(s => <option key={s}>{s}</option>)}</select></label>
      <label>Actual comparison diet cost (₹/day, optional)<input type="number" min="0" max="10000" value={baseline} onChange={e => setBaseline(e.target.value)} /></label>
    </div>
    <details><summary>Assumed ingredient prices — edit for your farm</summary><div className="measurement-grid">{Object.entries(prices).map(([key, value]) => <label key={key}>{key} (₹/{key === 'mineralsDaily' ? 'day' : 'kg'})<input type="number" min="0" max="1000" step="0.1" value={value} onChange={e => setPrices(prev => ({ ...prev, [key]: e.target.value === '' ? NaN : Number(e.target.value) }))} /></label>)}</div></details>
    {!inference && <p role="status">No complete, current sample available. Select a source and sample first.</p>}
    {error && <p role="alert">{error}</p>}
    {result && <><p><strong>{result.warning}</strong></p>{result.warnings.map(w => <p role="alert" key={w}>{w}</p>)}<p>Source: {activePitData.source}. Calculation status: {result.status}.</p></>}
    {plan && <>
      <table className="reading-table"><thead><tr><th>Illustrative daily amount</th><th>Total</th><th>Morning</th><th>Evening</th></tr></thead><tbody>
        {[['analyzedSilageKg', 'Silage (kg)'], ['greenFodderKg', 'Green fodder (kg)'], ['dryStrawKg', 'Dry straw (kg)'], ['compoundConcentrateKg', 'Concentrate (kg)']].map(([key, label]) => { const morning = Number((plan[key] / 2).toFixed(2)); return <tr key={key}><td>{label}</td><td>{plan[key]}</td><td>{morning}</td><td>{(plan[key] - morning).toFixed(2)}</td></tr>; })}
      </tbody></table>
      <p>Mineral mixture: {plan.mineralMixtureGrams} g/day · Water estimate: {plan.cleanWaterLiters} L/day</p>
      <p>Dry matter supplied: {result.supplied.dryMatterKg} / capacity {result.dmiCapacity} kg · Protein: {result.supplied.totalCP_grams} / target {result.requirements.totalCP_grams} g · TDN: {result.supplied.totalTDN_kg} / target {result.requirements.totalTDN_kg} kg</p>
      <p>Estimated daily cost: <strong>₹{result.economics.dailyFeedCostINR}</strong></p>
      <p>{result.economics.dailySavingsINR === null ? 'Enter an actual comparison cost to calculate savings.' : result.economics.dailySavingsINR < 0 ? `Costs ₹${Math.abs(result.economics.dailySavingsINR)} more per day than your comparison.` : `Estimated difference from your comparison: ₹${result.economics.dailySavingsINR} less per day.`}</p>
      <button className="btn-voice" onClick={share}>Copy illustrative plan</button><span role="status">{shareStatus}</span>
    </>}
  </section>;
}
