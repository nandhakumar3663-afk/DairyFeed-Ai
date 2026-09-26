import React, { useState } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Flame, 
  ShieldCheck, 
  AlertTriangle, 
  Radio, 
  Battery, 
  TrendingUp,
  Cpu,
  RefreshCw,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { TRANSLATIONS } from '../translations';

export default function LiveTelemetry({
  lang,
  pitData,
  allPits,
  selectedPitId,
  setSelectedPitId,
  history,
  onTriggerAnomaly,
  isLiveMode
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [chartMetric, setChartMetric] = useState('temperature'); // 'temperature', 'ph', 'moisture'

  if (!pitData) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <RefreshCw className="animate-spin" size={32} color="var(--accent-emerald)" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Connecting to Silage Telemetry Nodes...</p>
      </div>
    );
  }

  const {
    temperature_core = 25.4,
    temperature_top = 28.1,
    temperature_bottom = 23.5,
    ph_level = 4.02,
    moisture_pct = 65.5,
    ammonia_ppm = 15.2,
    battery_pct = 92,
    wifi_rssi = -60,
    deviceId = 'ESP32-NODE-01',
    status = 'Optimal Anaerobic',
    abnormalTriggered = false,
    nir_bands = [420, 510, 630, 710, 800, 890],
    inference = {}
  } = pitData;

  const flieg = inference.flieg || {
    score: 85,
    grade: 'Very Good (Excellent)',
    color: '#10b981',
    advisory: 'Optimal lactic fermentation.'
  };

  const {
    dryMatter = 34.5,
    crudeProtein = 8.6,
    ndf = 43.8,
    adf = 24.6,
    tdn = 67.2,
    nel = 1.53,
    moldRisk = 8
  } = inference;

  // Real-time Chart Data prep
  const chartPoints = history.length > 0 ? history : [
    { temperature_core: 24.8, ph_level: 3.95, moisture_pct: 65.0 },
    { temperature_core: 25.0, ph_level: 3.98, moisture_pct: 65.2 },
    { temperature_core: 25.2, ph_level: 4.00, moisture_pct: 65.4 },
    { temperature_core: temperature_core, ph_level: ph_level, moisture_pct: moisture_pct }
  ];

  // Calculate SVG polyline coordinates
  const renderSvgChart = () => {
    const width = 640;
    const height = 220;
    const padding = 20;

    let values = [];
    let unit = '°C';
    let strokeColor = '#10b981';
    let fillColor = 'rgba(16, 185, 129, 0.12)';

    if (chartMetric === 'temperature') {
      values = chartPoints.map(p => p.temperature_core || 25);
      unit = '°C';
      strokeColor = '#f59e0b';
      fillColor = 'rgba(245, 158, 11, 0.15)';
    } else if (chartMetric === 'ph') {
      values = chartPoints.map(p => p.ph_level || 4.0);
      unit = 'pH';
      strokeColor = '#06b6d4';
      fillColor = 'rgba(6, 182, 212, 0.15)';
    } else {
      values = chartPoints.map(p => p.moisture_pct || 65);
      unit = '%';
      strokeColor = '#10b981';
      fillColor = 'rgba(16, 185, 129, 0.15)';
    }

    const min = Math.min(...values) * 0.96;
    const max = Math.max(...values) * 1.04;
    const range = max - min || 1;

    const points = values.map((val, idx) => {
      const x = padding + (idx / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const fillPolygon = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad-${chartMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((pct, idx) => {
          const y = padding + pct * (height - padding * 2);
          const gridVal = (max - pct * range).toFixed(1);
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <text x={padding - 5} y={y + 4} fill="var(--text-dim)" fontSize="10" textAnchor="end">{gridVal}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <polygon points={fillPolygon} fill={`url(#grad-${chartMetric})`} />

        {/* Path line */}
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Current Point pulse */}
        {values.length > 0 && (() => {
          const lastVal = values[values.length - 1];
          const lastX = width - padding;
          const lastY = height - padding - ((lastVal - min) / range) * (height - padding * 2);
          return (
            <g>
              <circle cx={lastX} cy={lastY} r="6" fill={strokeColor} />
              <circle cx={lastX} cy={lastY} r="10" fill="none" stroke={strokeColor} strokeWidth="2" opacity="0.6">
                <animate attributeName="r" values="6;16;6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })()}
      </svg>
    );
  };

  // NIR wavelength channel configurations
  const nirLabels = [
    { nm: '450nm', name: 'Violet (Chlorophyll)', color: '#8b5cf6', val: nir_bands[0] || 420 },
    { nm: '500nm', name: 'Blue (Carotenoids)', color: '#3b82f6', val: nir_bands[1] || 510 },
    { nm: '550nm', name: 'Green (Reflectance)', color: '#10b981', val: nir_bands[2] || 630 },
    { nm: '570nm', name: 'Yellow (Lutein)', color: '#eab308', val: nir_bands[3] || 710 },
    { nm: '600nm', name: 'Orange (Lignin)', color: '#f97316', val: nir_bands[4] || 800 },
    { nm: '650nm', name: 'Red (Moisture/Starch)', color: '#ef4444', val: nir_bands[5] || 890 }
  ];

  return (
    <div>
      {/* Hero Fermentation Quality Banner */}
      <div className="glass-panel hero-quality-banner">
        <div className="flieg-badge-cluster">
          {/* Animated circular gauge */}
          <div className="score-circle" style={{ borderColor: flieg.color, boxShadow: `0 0 25px ${flieg.color}40` }}>
            <span className="score-value">{flieg.score}</span>
            <span className="score-max">/ 100</span>
          </div>

          <div className="score-details">
            <h2>{t.fliegScore}</h2>
            <div className="score-grade-pill" style={{ background: `${flieg.color}20`, color: flieg.color, borderColor: `${flieg.color}50` }}>
              <ShieldCheck size={16} />
              <span>{flieg.grade}</span>
            </div>
            <div className="advisory-box" style={{ borderLeftColor: flieg.color }}>
              <strong>{t.farmerAdvisory}: </strong>
              <span>{flieg.advisory}</span>
            </div>
          </div>
        </div>

        {/* Pit Selector & Anomaly Control */}
        <div className="pit-controls-panel">
          <div className="pit-select-row">
            <label>{t.currentPit}</label>
            <select 
              className="pit-dropdown" 
              value={selectedPitId} 
              onChange={(e) => setSelectedPitId(e.target.value)}
            >
              {allPits && allPits.map((p) => (
                <option key={p.pitId} value={p.pitId}>
                  {p.name || p.pitId}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>Node: <strong style={{ color: '#fff' }}>{deviceId}</strong></span>
            <span>RSSI: <strong style={{ color: 'var(--accent-emerald-light)' }}>{wifi_rssi} dBm</strong></span>
            <span>Batt: <strong style={{ color: battery_pct > 20 ? 'var(--accent-emerald-light)' : '#ef4444' }}>{battery_pct}%</strong></span>
          </div>

          <button 
            className={`btn-anomaly-leak ${abnormalTriggered ? 'active' : ''}`}
            onClick={() => onTriggerAnomaly(selectedPitId, !abnormalTriggered)}
          >
            <AlertTriangle size={16} />
            <span>{abnormalTriggered ? t.resolveAnomaly : t.triggerAnomaly}</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Real-Time Metric Cards */}
      <div className="metrics-grid-4">
        {/* Core Temperature */}
        <div className="glass-panel metric-card">
          <div>
            <div className="metric-card-header">
              <span className="metric-title">{t.coreTemp}</span>
              <div className="metric-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
                <Thermometer size={20} />
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-num" style={{ color: temperature_core > 35 ? '#ef4444' : '#fff' }}>
                {temperature_core.toFixed(1)}
              </span>
              <span className="metric-unit">°C</span>
            </div>
          </div>
          <div className="metric-status-line">
            <span>Surface: {temperature_top.toFixed(1)}°C</span>
            <span>Base: {temperature_bottom.toFixed(1)}°C</span>
          </div>
        </div>

        {/* pH Level */}
        <div className="glass-panel metric-card">
          <div>
            <div className="metric-card-header">
              <span className="metric-title">{t.phLevel}</span>
              <div className="metric-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                <Flame size={20} />
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-num" style={{ color: (ph_level < 3.8 || ph_level > 4.4) ? 'var(--accent-amber)' : '#fff' }}>
                {ph_level.toFixed(2)}
              </span>
              <span className="metric-unit">pH</span>
            </div>
          </div>
          <div className="metric-status-line">
            <span className="status-badge-inline" style={{ color: ph_level <= 4.2 ? 'var(--accent-emerald-light)' : '#ef4444' }}>
              Target: 3.8 - 4.2 (Lactic)
            </span>
          </div>
        </div>

        {/* Moisture % */}
        <div className="glass-panel metric-card">
          <div>
            <div className="metric-card-header">
              <span className="metric-title">{t.moisture}</span>
              <div className="metric-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
                <Droplets size={20} />
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-num">{moisture_pct.toFixed(1)}</span>
              <span className="metric-unit">%</span>
            </div>
          </div>
          <div className="metric-status-line">
            <span>Dry Matter (DM): <strong style={{ color: '#fff' }}>{dryMatter}%</strong></span>
          </div>
        </div>

        {/* Ammonia & VOC Gas */}
        <div className="glass-panel metric-card">
          <div>
            <div className="metric-card-header">
              <span className="metric-title">{t.ammoniaGas}</span>
              <div className="metric-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)' }}>
                <Wind size={20} />
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-num" style={{ color: ammonia_ppm > 40 ? '#ef4444' : '#fff' }}>
                {ammonia_ppm.toFixed(1)}
              </span>
              <span className="metric-unit">ppm</span>
            </div>
          </div>
          <div className="metric-status-line">
            <span>Proteolysis NH3-N: <strong style={{ color: ammonia_ppm > 40 ? '#ef4444' : 'var(--accent-emerald-light)' }}>
              {ammonia_ppm > 35 ? 'Elevated' : 'Normal'}
            </strong></span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Real-Time Telemetry Graph & NIR Spectroscopy */}
      <div className="telemetry-layout">
        {/* Real-time Graph Box */}
        <div className="glass-panel chart-panel">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Dynamic Silage Telemetry Stream</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Streaming live from probe sensor array (every 3s)
              </span>
            </div>
            <div className="chart-tabs-mini">
              <button 
                className={`chart-tab-mini-btn ${chartMetric === 'temperature' ? 'active' : ''}`}
                onClick={() => setChartMetric('temperature')}
              >
                Core Temp
              </button>
              <button 
                className={`chart-tab-mini-btn ${chartMetric === 'ph' ? 'active' : ''}`}
                onClick={() => setChartMetric('ph')}
              >
                pH Level
              </button>
              <button 
                className={`chart-tab-mini-btn ${chartMetric === 'moisture' ? 'active' : ''}`}
                onClick={() => setChartMetric('moisture')}
              >
                Moisture %
              </button>
            </div>
          </div>

          <div className="chart-canvas-wrap">
            {renderSvgChart()}
          </div>
        </div>

        {/* AS7262 NIR Spectrometer Channel Radar */}
        <div className="glass-panel nir-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="chart-title">AS7262 Visible-NIR Channels</h3>
            <span className="sih-badge" style={{ fontSize: '0.65rem' }}>6-BAND OPTICAL</span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Optical reflectance correlated with protein & fiber bonds
          </p>

          <div className="nir-channels-list">
            {nirLabels.map((ch) => {
              const maxVal = 1024;
              const pct = Math.min(100, Math.round((ch.val / maxVal) * 100));
              return (
                <div key={ch.nm} className="nir-bar-item">
                  <div className="nir-bar-label">
                    <span><strong>{ch.nm}</strong> - {ch.name}</span>
                    <span style={{ color: ch.color }}>{ch.val} ADC ({pct}%)</span>
                  </div>
                  <div className="nir-track">
                    <div 
                      className="nir-fill" 
                      style={{ width: `${pct}%`, background: ch.color }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Nutritional Proximate Matrix */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="chart-title">AI Nutritional Proximate Matrix</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Real-time feed quality inference computed from combined NIR reflectance and core electrochemical sensors
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Mold & Mycotoxin Risk:</span>
            <span style={{ 
              fontWeight: 700, 
              fontSize: '0.88rem',
              color: moldRisk < 20 ? 'var(--accent-emerald-light)' : moldRisk < 50 ? 'var(--accent-amber)' : '#ef4444' 
            }}>
              {moldRisk}% {moldRisk < 20 ? '(Safe)' : moldRisk < 50 ? '(Monitor)' : '(Severe Danger)'}
            </span>
          </div>
        </div>

        <div className="nutrition-grid">
          <div className="nutrition-item">
            <span className="nutrition-param-name">{t.crudeProtein}</span>
            <span className="nutrition-val" style={{ color: 'var(--accent-emerald-light)' }}>{crudeProtein}%</span>
            <span className="nutrition-benchmark">Target: 7.5% - 9.5%</span>
          </div>

          <div className="nutrition-item">
            <span className="nutrition-param-name">{t.dryMatter}</span>
            <span className="nutrition-val">{dryMatter}%</span>
            <span className="nutrition-benchmark">Target: 30% - 36%</span>
          </div>

          <div className="nutrition-item">
            <span className="nutrition-param-name">{t.tdn}</span>
            <span className="nutrition-val" style={{ color: 'var(--accent-cyan)' }}>{tdn}%</span>
            <span className="nutrition-benchmark">Energy: 65% - 72%</span>
          </div>

          <div className="nutrition-item">
            <span className="nutrition-param-name">Neutral Detergent Fiber (NDF)</span>
            <span className="nutrition-val">{ndf}%</span>
            <span className="nutrition-benchmark">Rumen Fill: 40% - 48%</span>
          </div>

          <div className="nutrition-item">
            <span className="nutrition-param-name">Acid Detergent Fiber (ADF)</span>
            <span className="nutrition-val">{adf}%</span>
            <span className="nutrition-benchmark">Lignocellulose: 22% - 28%</span>
          </div>

          <div className="nutrition-item">
            <span className="nutrition-param-name">Net Energy Lactation (NEL)</span>
            <span className="nutrition-val" style={{ color: 'var(--accent-amber)' }}>{nel} <span style={{ fontSize: '0.9rem' }}>Mcal/kg</span></span>
            <span className="nutrition-benchmark">Milk fuel factor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
