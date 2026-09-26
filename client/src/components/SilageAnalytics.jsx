import React, { useState } from 'react';
import { 
  Sparkles, 
  FlaskConical, 
  ShieldAlert, 
  CheckCircle2, 
  BarChart3, 
  Scale, 
  RefreshCw,
  Info,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { calculateFliegsScore, inferNutritionalProfile } from '../services/simulator';

export default function SilageAnalytics({ lang, activePitData }) {
  // Manual rapid test state
  const [sampleType, setSampleType] = useState('maize');
  const [inputPH, setInputPH] = useState(4.05);
  const [inputMoisture, setInputMoisture] = useState(66.0);
  const [inputTemp, setInputTemp] = useState(26.5);
  const [inputAmmonia, setInputAmmonia] = useState(16.0);

  // Compute manual simulation
  const manualInference = inferNutritionalProfile({
    moisture_pct: parseFloat(inputMoisture),
    ph_level: parseFloat(inputPH),
    temperature_core: parseFloat(inputTemp),
    ammonia_ppm: parseFloat(inputAmmonia),
    nir_bands: sampleType === 'alfalfa' ? [460, 550, 680, 750, 840, 920] : [420, 510, 630, 710, 800, 890]
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Fermentation Organic Acid Biochemistry */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 className="chart-title" style={{ fontSize: '1.35rem' }}>
              Silage Fermentation Organic Acid Matrix
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Biochemical volatile fatty acid (VFA) partition estimated from pH kinetic curvature
            </p>
          </div>
          <span className="sih-badge">BIOCHEMICAL PROFILE</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {/* Lactic Acid */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '5px solid var(--accent-emerald)', background: 'var(--bg-sub-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--text-heading)' }}>🟢 Lactic Acid (Good Acid)</strong>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>
                {activePitData?.inference?.flieg?.lacticAcid || 5.8}% DM
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
              Primary preservative acid. Rapidly drops pH to stop bad bacteria and preserves grass nutrients with sweet smell.
            </p>
            <div style={{ marginTop: '0.75rem', height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '85%', height: '100%', background: 'var(--accent-emerald)' }}></div>
            </div>
          </div>

          {/* Acetic Acid */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '5px solid var(--accent-cyan)', background: 'var(--bg-sub-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--text-heading)' }}>🔵 Acetic Acid (Preservative)</strong>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
                {activePitData?.inference?.flieg?.aceticAcid || 1.8}% DM
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
              Keeps silage fresh after the pit is opened for feeding. Suppresses wild mold and yeast growth.
            </p>
            <div style={{ marginTop: '0.75rem', height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '35%', height: '100%', background: 'var(--accent-cyan)' }}></div>
            </div>
          </div>

          {/* Butyric Acid */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '5px solid #ef4444', background: 'var(--bg-sub-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--text-heading)' }}>🔴 Butyric Acid (Rotten Acid)</strong>
              <span style={{ color: (activePitData?.inference?.flieg?.butyricAcid || 0.05) > 0.5 ? '#ef4444' : 'var(--accent-emerald)', fontWeight: 800 }}>
                {activePitData?.inference?.flieg?.butyricAcid || 0.05}% DM
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
              Marker of spoiled silage. Imparts rancid butter smell, makes cows reject feed, and can cause sickness.
            </p>
            <div style={{ marginTop: '0.75rem', height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (activePitData?.inference?.flieg?.butyricAcid || 0.05) * 100)}%`, height: '100%', background: '#ef4444' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Rapid Lab Testing AI Simulator */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 className="chart-title" style={{ fontSize: '1.35rem' }}>
              Rapid On-Farm Silage Quality Evaluator
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Test any field batch sample instantly without waiting 7 days for commercial laboratory wet chemistry
            </p>
          </div>
          <span className="sih-badge" style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
            INSTANT INFERENCE
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
          {/* Sliders Input Panel */}
          <div>
            <div className="form-group">
              <label>Crop / Forage Species</label>
              <select 
                className="form-select"
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value)}
              >
                <option value="maize">🌽 Green Fodder Maize / Corn (Zea mays)</option>
                <option value="sorghum">🌾 Multi-cut Sorghum / Jowar (Sorghum bicolor)</option>
                <option value="bajra">🌱 Pearl Millet / Hybrid Napier / CO-4</option>
                <option value="alfalfa">🌿 Alfalfa / Lucerne (Medicago sativa)</option>
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                <label>Silage Sourness (pH Level)</label>
                <strong style={{ color: 'var(--text-heading)' }}>{inputPH} pH</strong>
              </div>
              <input 
                type="range" 
                min="3.2" 
                max="6.2" 
                step="0.05"
                value={inputPH}
                onChange={(e) => setInputPH(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                <label>Moisture Content (%)</label>
                <strong style={{ color: 'var(--text-heading)' }}>{inputMoisture}% (DM: {(100 - inputMoisture).toFixed(1)}%)</strong>
              </div>
              <input 
                type="range" 
                min="50" 
                max="82" 
                step="0.5"
                value={inputMoisture}
                onChange={(e) => setInputMoisture(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                <label>Core Temperature (°C)</label>
                <strong style={{ color: 'var(--text-heading)' }}>{inputTemp}°C</strong>
              </div>
              <input 
                type="range" 
                min="18" 
                max="50" 
                step="0.5"
                value={inputTemp}
                onChange={(e) => setInputTemp(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-amber)', cursor: 'pointer' }}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                <label>Ammonia Gas (ppm)</label>
                <strong style={{ color: 'var(--text-heading)' }}>{inputAmmonia} ppm</strong>
              </div>
              <input 
                type="range" 
                min="5" 
                max="80" 
                step="1"
                value={inputAmmonia}
                onChange={(e) => setInputAmmonia(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Instant Output Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: `2px solid ${manualInference.flieg.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>
                Instant AI Inference Result
              </span>
              <span className="sih-badge" style={{ background: `${manualInference.flieg.color}20`, color: manualInference.flieg.color }}>
                {manualInference.flieg.grade}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="score-circle" style={{ width: '80px', height: '80px', borderColor: manualInference.flieg.color }}>
                <span className="score-value" style={{ fontSize: '1.8rem' }}>{manualInference.flieg.score}</span>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-heading)', fontSize: '1.1rem', fontWeight: 800 }}>Silage Quality Score</h4>
                <p style={{ fontSize: '0.85rem', color: manualInference.flieg.color, fontWeight: 700 }}>
                  {manualInference.flieg.advisory}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div style={{ background: 'var(--bg-sub-card)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Crude Protein (CP)</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  {manualInference.crudeProtein}%
                </div>
              </div>

              <div style={{ background: 'var(--bg-sub-card)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Dry Nutrition (DM)</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                  {manualInference.dryMatter}%
                </div>
              </div>

              <div style={{ background: 'var(--bg-sub-card)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Digestion Energy</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {manualInference.tdn}%
                </div>
              </div>

              <div style={{ background: 'var(--bg-sub-card)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Mold / Fungus Risk</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: manualInference.moldRisk > 40 ? '#ef4444' : 'var(--accent-emerald)' }}>
                  {manualInference.moldRisk}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
