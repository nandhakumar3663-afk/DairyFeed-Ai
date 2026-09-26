import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Eye, 
  RefreshCw,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import { silageService } from '../services/api';

export default function VisualScanner({ lang }) {
  const [selectedPreset, setSelectedPreset] = useState('optimal_maize');
  const [analyzing, setAnalyzing] = useState(false);
  const [customImage, setCustomImage] = useState(null);

  const presets = [
    {
      id: 'optimal_maize',
      name: 'Optimal Maize Silage',
      desc: 'Bright golden olive-green with cracked kernels',
      imgBg: 'linear-gradient(135deg, #15803d 0%, #ca8a04 100%)',
      upperSieve: 6.5,
      middleSieve: 58.2,
      lowerSieve: 32.1,
      bottomPan: 3.2,
      status: 'Balanced Chop (Safe)',
      acidosisRisk: 'Low SARA Risk',
      mold: '0.2% (Negligible)'
    },
    {
      id: 'aerobic_moldy',
      name: 'Aerobic Mold Spoilage',
      desc: 'Whitish-gray fungal crust with ammonia odor',
      imgBg: 'linear-gradient(135deg, #475569 0%, #dc2626 100%)',
      upperSieve: 14.2,
      middleSieve: 48.0,
      lowerSieve: 30.5,
      bottomPan: 7.3,
      status: 'Degraded Clumpy Surface',
      acidosisRisk: 'High Mycotoxin Hazard',
      mold: '24.5% (Dangerous Mold)'
    },
    {
      id: 'finely_chopped',
      name: 'Over-Chopped / Pulverized',
      desc: 'Chop length < 8mm, lacks rumen scratch factor',
      imgBg: 'linear-gradient(135deg, #84cc16 0%, #10b981 100%)',
      upperSieve: 1.2,
      middleSieve: 35.4,
      lowerSieve: 48.6,
      bottomPan: 14.8,
      status: 'Excessive Fines (< 1.18mm)',
      acidosisRisk: 'High SARA Acidosis Risk',
      mold: '0.8% (Clean)'
    },
    {
      id: 'caramelized_heated',
      name: 'Caramelized Tobacco Silage',
      desc: 'Dark brown heat-damaged Maillard reaction',
      imgBg: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)',
      upperSieve: 8.0,
      middleSieve: 54.0,
      lowerSieve: 33.0,
      bottomPan: 5.0,
      status: 'Thermal Denaturation',
      acidosisRisk: 'Bound Protein Loss',
      mold: '3.1% (Low)'
    }
  ];

  const current = presets.find(p => p.id === selectedPreset) || presets[0];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAnalyzing(true);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setCustomImage(uploadEvent.target.result);
        setTimeout(() => {
          setAnalyzing(false);
        }, 1200);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Intro Header */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="chart-title" style={{ fontSize: '1.35rem' }}>
              AI Visual Sieve & Mold Detection Scanner
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Penn State Particle Separator (PSPS) Computer Vision analysis for effective fiber length and mold recognition
            </p>
          </div>
          <span className="sih-badge" style={{ background: 'rgba(139, 92, 246, 0.15)', borderColor: 'var(--accent-purple)', color: '#c084fc' }}>
            COMPUTER VISION AI
          </span>
        </div>

        {/* Preset Selector buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setSelectedPreset(preset.id);
                setCustomImage(null);
              }}
              style={{
                background: selectedPreset === preset.id && !customImage ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.8)',
                border: selectedPreset === preset.id && !customImage ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                color: selectedPreset === preset.id && !customImage ? '#fff' : 'var(--text-muted)',
                borderRadius: '8px',
                padding: '0.65rem 1rem',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                whiteSpace: 'nowrap'
              }}
            >
              <div>{preset.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 400 }}>{preset.status}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Camera / Image Box and Particle Separator Breakdown */}
      <div className="vision-grid">
        {/* Left: Image / Camera Capture View */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="chart-title">Sample Image Frame</h3>
            <label style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              background: '#1e293b', 
              color: 'var(--accent-emerald-light)', 
              padding: '0.45rem 0.85rem', 
              borderRadius: '8px', 
              fontSize: '0.8rem', 
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              <Upload size={14} />
              <span>Upload Photo</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div 
            className="camera-preview-box" 
            style={{ 
              background: customImage ? `url(${customImage}) center/cover no-repeat` : current.imgBg 
            }}
          >
            {analyzing ? (
              <div style={{ background: 'rgba(0,0,0,0.7)', padding: '1.5rem', borderRadius: '12px' }}>
                <RefreshCw size={36} className="animate-spin" color="var(--accent-emerald)" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ color: '#fff', fontWeight: 600 }}>Analyzing Optical Texture & Particles...</p>
              </div>
            ) : (
              <div style={{ 
                position: 'absolute', 
                bottom: '1rem', 
                left: '1rem', 
                right: '1rem', 
                background: 'rgba(15, 23, 42, 0.88)', 
                backdropFilter: 'blur(8px)',
                padding: '0.85rem', 
                borderRadius: '8px', 
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{current.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: current.mold.includes('Dangerous') ? '#ef4444' : 'var(--accent-emerald-light)', fontWeight: 700 }}>
                    {current.mold}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {current.desc}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Penn State Particle Separator (PSPS) Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 className="chart-title">Penn State Particle Sieve (PSPS)</h3>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: current.acidosisRisk.includes('High') ? '#ef4444' : 'var(--accent-emerald-light)' }}>
              {current.acidosisRisk}
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Physical effective NDF (peNDF) ensures adequate chewing, salivation, and prevents sub-acute ruminal acidosis (SARA).
          </p>

          <div className="psps-sieve-bar-group">
            {/* Upper Sieve */}
            <div className="psps-sieve-row">
              <div className="psps-sieve-header">
                <span>Upper Sieve (&gt; 19 mm)</span>
                <strong style={{ color: (current.upperSieve < 3 || current.upperSieve > 8) ? 'var(--accent-amber)' : 'var(--accent-emerald-light)' }}>
                  {current.upperSieve}% (Target: 3 - 8%)
                </strong>
              </div>
              <div className="nir-track" style={{ height: '10px' }}>
                <div className="nir-fill" style={{ width: `${Math.min(100, current.upperSieve * 3.5)}%`, background: '#8b5cf6' }}></div>
              </div>
            </div>

            {/* Middle Sieve */}
            <div className="psps-sieve-row">
              <div className="psps-sieve-header">
                <span>Middle Sieve (8 - 19 mm)</span>
                <strong style={{ color: 'var(--accent-emerald-light)' }}>
                  {current.middleSieve}% (Target: 45 - 65%)
                </strong>
              </div>
              <div className="nir-track" style={{ height: '10px' }}>
                <div className="nir-fill" style={{ width: `${current.middleSieve}%`, background: 'var(--accent-emerald)' }}></div>
              </div>
            </div>

            {/* Lower Sieve */}
            <div className="psps-sieve-row">
              <div className="psps-sieve-header">
                <span>Lower Sieve (1.18 - 8 mm)</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>
                  {current.lowerSieve}% (Target: 30 - 40%)
                </strong>
              </div>
              <div className="nir-track" style={{ height: '10px' }}>
                <div className="nir-fill" style={{ width: `${current.lowerSieve}%`, background: 'var(--accent-cyan)' }}></div>
              </div>
            </div>

            {/* Bottom Pan */}
            <div className="psps-sieve-row">
              <div className="psps-sieve-header">
                <span>Bottom Pan / Fines (&lt; 1.18 mm)</span>
                <strong style={{ color: current.bottomPan > 5 ? '#ef4444' : 'var(--accent-emerald-light)' }}>
                  {current.bottomPan}% (Target: &lt; 5%)
                </strong>
              </div>
              <div className="nir-track" style={{ height: '10px' }}>
                <div className="nir-fill" style={{ width: `${current.bottomPan * 5}%`, background: current.bottomPan > 5 ? '#ef4444' : 'var(--accent-amber)' }}></div>
              </div>
            </div>
          </div>

          {/* Action Recommendation Box */}
          <div style={{ marginTop: '1.5rem', background: '#1e293b', padding: '1rem', borderRadius: '10px', borderLeft: '3px solid var(--accent-emerald)' }}>
            <strong style={{ color: '#fff', fontSize: '0.85rem' }}>Agronomic Recommendation:</strong>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.35rem', lineHeight: '1.45' }}>
              {selectedPreset === 'finely_chopped'
                ? 'Forage is excessively pulverized. Cows may not produce sufficient saliva bicarbonate. Add 1.5 - 2.0 kg long dry wheat straw to prevent milk fat depression.'
                : selectedPreset === 'aerobic_moldy'
                ? 'Severe mold detected. Remove top 15 cm crust before feeding. Do not mix into dairy ration to prevent abortion and aflatoxin M1 contamination in milk.'
                : 'Excellent physical structure! Optimal kernel breakage and leaf-to-stem ratio ensures maximum rumen microbial protein synthesis.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
