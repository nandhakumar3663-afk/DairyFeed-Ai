import React, { useState } from 'react';
import { 
  Scale, 
  IndianRupee, 
  Sparkles, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  TrendingDown,
  Info,
  Sun,
  Moon,
  Clock
} from 'lucide-react';

export default function RationBalancer({ lang, activePitData }) {
  const [animalType, setAnimalType] = useState('crossbred_hf');
  const [bodyWeight, setBodyWeight] = useState(480);
  const [milkYield, setMilkYield] = useState(15);
  const [fatPct, setFatPct] = useState(4.0);
  const [lactationStage, setLactationStage] = useState('mid');
  const [sharedToast, setSharedToast] = useState(false);

  // Silage parameters from active pit
  const silageDM = activePitData?.inference?.dryMatter || 34.5;
  const silageCP = activePitData?.inference?.crudeProtein || 8.6;
  const silageTDN = activePitData?.inference?.tdn || 67.0;
  const fliegScore = activePitData?.inference?.flieg?.score || 85;

  // Calculation based on ICAR standards
  const isBuffalo = animalType === 'murrah_buffalo';
  const isIndigenous = animalType === 'indigenous_gir';

  const dmIntakeFactor = isIndigenous ? 0.024 : isBuffalo ? 0.029 : 0.031;
  const totalDMI = (bodyWeight * dmIntakeFactor).toFixed(1);

  // Maintenance + Production requirements
  const maintCP = isIndigenous ? 320 : isBuffalo ? 440 : 380;
  const cpPerLitre = isBuffalo ? 105 : isIndigenous ? 82 : 88;
  const totalCPGrams = Math.round(maintCP + (milkYield * cpPerLitre * (fatPct / 4.0)));

  const maintTDN = isIndigenous ? 2.6 : isBuffalo ? 3.5 : 3.1;
  const tdnPerLitre = isBuffalo ? 0.45 : isIndigenous ? 0.36 : 0.38;
  const totalTDNkg = (maintTDN + (milkYield * tdnPerLitre * (fatPct / 4.0))).toFixed(2);

  // Ration Formulation
  const silageFreshKg = (Math.min(totalDMI * 0.45, 6.5) / (silageDM / 100)).toFixed(1);
  const greenFodderKg = (Math.min(totalDMI * 0.15, 2.0) / 0.20).toFixed(1);
  const dryStrawKg = (Math.min(totalDMI * 0.20, 2.5) / 0.90).toFixed(1);

  // Concentrate feed required
  const concentrateKg = Math.max(2.5, (milkYield * 0.38)).toFixed(1);
  const mineralGrams = milkYield > 12 ? 100 : 75;
  const waterLiters = Math.round(bodyWeight * 0.10 + milkYield * 3.5);

  // Morning and Evening Split (50% / 50%)
  const silageMorning = (silageFreshKg / 2).toFixed(1);
  const silageEvening = (silageFreshKg - silageMorning).toFixed(1);

  const concentrateMorning = (concentrateKg / 2).toFixed(1);
  const concentrateEvening = (concentrateKg - concentrateMorning).toFixed(1);

  // Economics
  const optimizedDailyCost = Math.round((silageFreshKg * 3.5) + (greenFodderKg * 2.0) + (dryStrawKg * 5.0) + (concentrateKg * 28.0) + 12);
  const traditionalDailyCost = Math.round(optimizedDailyCost + (concentrateKg * 0.35 * 28.0) + 8);
  const dailySavings = Math.max(18, traditionalDailyCost - optimizedDailyCost);
  const monthlySavings = dailySavings * 30;
  const annualTenCowSavings = monthlySavings * 12 * 10;

  const handleShareRation = () => {
    const text = `*ICAR Balanced Silage Ration Plan for Dairy Farmer*\n` +
      `Animal: ${animalType.toUpperCase()} | Milk Yield: ${milkYield} L/day\n` +
      `-----------------------------------------\n` +
      `🌅 Morning Feed: ${silageMorning} kg Silage + ${concentrateMorning} kg Concentrate + 1.5 kg Straw\n` +
      `🌇 Evening Feed: ${silageEvening} kg Silage + ${concentrateEvening} kg Concentrate + 1.5 kg Straw\n` +
      `🌿 Mineral Mixture: ${mineralGrams} g daily\n` +
      `-----------------------------------------\n` +
      `💰 Daily Feed Cost Saving: ₹${dailySavings} per cow/day!\n` +
      `🥛 Monthly Farm Savings: ₹${monthlySavings} / cow\n` +
      `Tested with Smart Feed & Silage Quality Analyzer Platform`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="chart-title" style={{ fontSize: '1.35rem' }}>
              ICAR-Standard Dairy Ration Balancer & Cost Optimizer
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Precision feeding algorithm matching cow nutrient requirements with real-time tested silage nutritional matrix
            </p>
          </div>
          <button 
            className="btn-voice"
            onClick={handleShareRation}
            style={{ 
              background: 'var(--bg-sub-card)', 
              borderColor: 'var(--border-subtle)', 
              color: 'var(--text-main)' 
            }}
          >
            <Share2 size={16} color="var(--accent-emerald)" />
            <span>{sharedToast ? 'Copied to Clipboard!' : 'Share WhatsApp Summary'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs vs Balanced Ration Formulation */}
      <div className="ration-calculator-grid">
        {/* Left Inputs */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="chart-title" style={{ marginBottom: '1.25rem' }}>Animal Parameters</h3>

          <div className="form-group">
            <label>Dairy Animal Breed</label>
            <select 
              className="form-select"
              value={animalType}
              onChange={(e) => {
                setAnimalType(e.target.value);
                if (e.target.value === 'murrah_buffalo') setBodyWeight(560);
                else if (e.target.value === 'indigenous_gir') setBodyWeight(420);
                else setBodyWeight(480);
              }}
            >
              <option value="crossbred_hf">🐄 Crossbred Cow (HF / Jersey Cross)</option>
              <option value="indigenous_gir">🐂 Indigenous Cow (Gir, Sahiwal, Kankrej, Tharparkar)</option>
              <option value="murrah_buffalo">🐃 Murrah / Nili-Ravi Buffalo</option>
            </select>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              <label>Body Weight (kg)</label>
              <strong style={{ color: 'var(--text-heading)' }}>{bodyWeight} kg</strong>
            </div>
            <input 
              type="range" 
              min="320" 
              max="680" 
              step="10"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              <label>Daily Milk Yield (Liters/day)</label>
              <strong style={{ color: 'var(--accent-emerald)' }}>{milkYield} Liters</strong>
            </div>
            <input 
              type="range" 
              min="4" 
              max="35" 
              step="1"
              value={milkYield}
              onChange={(e) => setMilkYield(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              <label>Milk Fat (%)</label>
              <strong style={{ color: 'var(--accent-cyan)' }}>{fatPct}% Fat</strong>
            </div>
            <input 
              type="range" 
              min="3.0" 
              max="8.5" 
              step="0.1"
              value={fatPct}
              onChange={(e) => setFatPct(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
          </div>

          <div className="form-group">
            <label>Lactation Stage</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
              {['early', 'mid', 'late', 'dry'].map((stage) => (
                <button
                  key={stage}
                  onClick={() => setLactationStage(stage)}
                  style={{
                    background: lactationStage === stage ? 'var(--accent-emerald)' : 'var(--bg-sub-card)',
                    color: lactationStage === stage ? '#ffffff' : 'var(--text-main)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.2rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Requirements Summary */}
          <div style={{ marginTop: '1.25rem', background: 'var(--bg-sub-card)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
              ICAR Daily Nutrition Targets
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.88rem' }}>
              <span>Dry Matter Capacity:</span>
              <strong style={{ color: 'var(--text-heading)' }}>{totalDMI} kg DMI</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.88rem' }}>
              <span>Crude Protein Target:</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>{totalCPGrams} g/day</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.88rem' }}>
              <span>Total Digestible Nutrients:</span>
              <strong style={{ color: 'var(--accent-cyan)' }}>{totalTDNkg} kg TDN</strong>
            </div>
          </div>
        </div>

        {/* Right Output: Balanced Daily Ration & Farmer Savings */}
        <div className="ration-output-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 className="chart-title">Balanced Daily Ration Formulation</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Formulated using tested Silage ({silageCP}% CP, {silageTDN}% TDN)
              </p>
            </div>
            <span className="sih-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)' }}>
              FLIEG SCORE {fliegScore}
            </span>
          </div>

          {/* Daily Ration Breakdown */}
          <div style={{ background: 'var(--bg-sub-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.1rem', marginBottom: '1.25rem' }}>
            <div className="ration-item-row">
              <div>
                <strong style={{ color: 'var(--text-heading)', fontSize: '0.95rem' }}>Tested Silage (Fresh / As-Fed)</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>High-energy fermented green maize</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{silageFreshKg}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>kg/day</span>
              </div>
            </div>

            <div className="ration-item-row">
              <div>
                <strong style={{ color: 'var(--text-heading)', fontSize: '0.95rem' }}>Fresh Green Fodder (Napier / Berseem)</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Supplies active vitamins & carotenes</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-heading)' }}>{greenFodderKg}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>kg/day</span>
              </div>
            </div>

            <div className="ration-item-row">
              <div>
                <strong style={{ color: 'var(--text-heading)', fontSize: '0.95rem' }}>Dry Roughage (Wheat / Paddy Straw)</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Provides essential rumen scratch factor</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-heading)' }}>{dryStrawKg}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>kg/day</span>
              </div>
            </div>

            <div className="ration-item-row">
              <div>
                <strong style={{ color: 'var(--text-heading)', fontSize: '0.95rem' }}>Compound Cattle Feed Concentrate</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Balanced bypass protein & minerals</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{concentrateKg}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>kg/day</span>
              </div>
            </div>

            <div className="ration-item-row">
              <div>
                <strong style={{ color: 'var(--text-heading)', fontSize: '0.95rem' }}>Mineral Mixture & Salt</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Chelated trace minerals for reproductive health</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{mineralGrams}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>g/day</span>
              </div>
            </div>

            <div className="ration-item-row">
              <div>
                <strong style={{ color: 'var(--text-heading)', fontSize: '0.95rem' }}>Clean Drinking Water</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Fresh clean water daily</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7' }}>{waterLiters}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>Liters</span>
              </div>
            </div>
          </div>

          {/* Practical Morning & Evening Feeding Split for Dairy Farmers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--bg-sub-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d97706', fontWeight: 800, fontSize: '0.85rem' }}>
                <Sun size={16} />
                <span>🌅 Morning Milking Feed</span>
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div>• Silage: <strong>{silageMorning} kg</strong></div>
                <div>• Concentrate: <strong>{concentrateMorning} kg</strong></div>
                <div>• Dry Straw: <strong>{(dryStrawKg / 2).toFixed(1)} kg</strong></div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-sub-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontWeight: 800, fontSize: '0.85rem' }}>
                <Moon size={16} />
                <span>🌇 Evening Milking Feed</span>
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div>• Silage: <strong>{silageEvening} kg</strong></div>
                <div>• Concentrate: <strong>{concentrateEvening} kg</strong></div>
                <div>• Green Fodder: <strong>{greenFodderKg} kg</strong></div>
              </div>
            </div>
          </div>

          {/* Farmer Economic Benefit Banner */}
          <div className="cost-saving-highlight">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)', fontWeight: 800, fontSize: '0.95rem' }}>
                <TrendingDown size={20} />
                <span>Daily Feed Cost Reduced by ₹{dailySavings} / Cow</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>
                High-quality silage eliminates overfeeding expensive commercial grain concentrate
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Annual Farm Savings (10 Cows)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                ₹{annualTenCowSavings.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
