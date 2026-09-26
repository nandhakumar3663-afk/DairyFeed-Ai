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
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Volume2
} from 'lucide-react';
import { TRANSLATIONS } from '../translations';
import { audioService } from '../services/audioSpeech';

export default function LiveTelemetry({
  lang,
  pitData,
  allPits,
  selectedPitId,
  setSelectedPitId,
  history,
  onTriggerAnomaly,
  isLiveMode,
  farmerMode = true
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [chartMetric, setChartMetric] = useState('temperature'); // 'temperature', 'ph', 'moisture'
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!pitData) {
    return (
      <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center' }}>
        <RefreshCw className="animate-spin" size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 1.25rem' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Connecting to Silage Telemetry Nodes...</p>
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

  const isSafe = flieg.score >= 60 && temperature_core < 35 && moldRisk < 40;
  const isCritical = temperature_core >= 36 || flieg.score < 30 || moldRisk >= 50;

  // Real-time Chart Data prep
  const chartPoints = history.length > 0 ? history : [
    { temperature_core: 24.8, ph_level: 3.95, moisture_pct: 65.0 },
    { temperature_core: 25.0, ph_level: 3.98, moisture_pct: 65.2 },
    { temperature_core: 25.2, ph_level: 4.00, moisture_pct: 65.4 },
    { temperature_core: temperature_core, ph_level: ph_level, moisture_pct: moisture_pct }
  ];

  // Calculate Silky Smooth Cubic Bezier SVG Curve
  const renderSvgChart = () => {
    const width = 640;
    const height = 220;
    const padding = 24;

    let values = [];
    let unit = '°C';
    let strokeColor = '#059669';
    let fillColor = 'rgba(5, 150, 105, 0.18)';

    if (chartMetric === 'temperature') {
      values = chartPoints.map(p => p.temperature_core || 25);
      unit = '°C';
      strokeColor = '#d97706';
      fillColor = 'rgba(217, 119, 6, 0.18)';
    } else if (chartMetric === 'ph') {
      values = chartPoints.map(p => p.ph_level || 4.0);
      unit = 'pH';
      strokeColor = '#0284c7';
      fillColor = 'rgba(2, 132, 199, 0.18)';
    } else {
      values = chartPoints.map(p => p.moisture_pct || 65);
      unit = '%';
      strokeColor = '#059669';
      fillColor = 'rgba(5, 150, 105, 0.18)';
    }

    const min = Math.min(...values) * 0.97;
    const max = Math.max(...values) * 1.03;
    const range = max - min || 1;

    // Coordinate mapping
    const coords = values.map((val, idx) => {
      const x = padding + (idx / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return { x, y, val };
    });

    // Build smooth cubic bezier path
    let pathD = '';
    if (coords.length > 0) {
      pathD = `M ${coords[0].x},${coords[0].y}`;
      for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1];
        const curr = coords[i];
        const cp1x = prev.x + (curr.x - prev.x) / 2;
        const cp1y = prev.y;
        const cp2x = prev.x + (curr.x - prev.x) / 2;
        const cp2y = curr.y;
        pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
      }
    }

    const areaD = coords.length > 0
      ? `${pathD} L ${coords[coords.length - 1].x},${height - padding} L ${coords[0].x},${height - padding} Z`
      : '';

    const activePoint = hoverIndex !== null && coords[hoverIndex] ? coords[hoverIndex] : coords[coords.length - 1];

    return (
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'crosshair' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = ((e.clientX - rect.left) / rect.width) * width;
          let closestIdx = 0;
          let closestDist = Infinity;
          coords.forEach((c, idx) => {
            const dist = Math.abs(c.x - mouseX);
            if (dist < closestDist) {
              closestDist = dist;
              closestIdx = idx;
            }
          });
          setHoverIndex(closestIdx);
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={`grad-${chartMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.45" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
          </linearGradient>
          <filter id="glow-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={strokeColor} floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Horizontal grid lines */}
        {[0.2, 0.5, 0.8].map((pct, idx) => {
          const y = padding + pct * (height - padding * 2);
          const gridVal = (max - pct * range).toFixed(1);
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--border-subtle)" strokeDasharray="5 5" />
              <text x={padding - 6} y={y + 4} fill="var(--text-dim)" fontSize="11" fontWeight="600" textAnchor="end">{gridVal}</text>
            </g>
          );
        })}

        {/* Smooth Area fill */}
        {areaD && <path d={areaD} fill={`url(#grad-${chartMetric})`} />}

        {/* Smooth Bezier Path line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow-shadow)"
          />
        )}

        {/* Vertical tracking line on hover */}
        {activePoint && (
          <line
            x1={activePoint.x}
            y1={padding}
            x2={activePoint.x}
            y2={height - padding}
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.8"
          />
        )}

        {/* Active Point pulse & floating readout pill */}
        {activePoint && (
          <g>
            <circle cx={activePoint.x} cy={activePoint.y} r="6.5" fill="#ffffff" stroke={strokeColor} strokeWidth="3" />
            <circle cx={activePoint.x} cy={activePoint.y} r="12" fill="none" stroke={strokeColor} strokeWidth="2" opacity="0.5">
              <animate attributeName="r" values="6.5;18;6.5" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="2.2s" repeatCount="indefinite" />
            </circle>

            {/* Readout Tooltip Box */}
            <g transform={`translate(${Math.min(width - 90, Math.max(activePoint.x - 45, 10))}, ${Math.max(10, activePoint.y - 36)})`}>
              <rect
                width="84"
                height="26"
                rx="6"
                fill="var(--bg-card-solid)"
                stroke={strokeColor}
                strokeWidth="1.5"
                filter="drop-shadow(0 2px 6px rgba(0,0,0,0.25))"
              />
              <text
                x="42"
                y="17"
                fill="var(--text-heading)"
                fontSize="12"
                fontWeight="800"
                textAnchor="middle"
              >
                {activePoint.val.toFixed(2)} {unit}
              </text>
            </g>
          </g>
        )}
      </svg>
    );
  };

  // NIR wavelength channel configurations
  const nirLabels = [
    { nm: '450nm', name: 'Violet (Chlorophyll)', color: '#8b5cf6', val: nir_bands[0] || 420 },
    { nm: '500nm', name: 'Blue (Carotenoids)', color: '#0284c7', val: nir_bands[1] || 510 },
    { nm: '550nm', name: 'Green (Reflectance)', color: '#059669', val: nir_bands[2] || 630 },
    { nm: '570nm', name: 'Yellow (Lutein)', color: '#d97706', val: nir_bands[3] || 710 },
    { nm: '600nm', name: 'Orange (Lignin)', color: '#ea580c', val: nir_bands[4] || 800 },
    { nm: '650nm', name: 'Red (Moisture/Starch)', color: '#dc2626', val: nir_bands[5] || 890 }
  ];

  return (
    <div>
      {/* FARMER FRIENDLY ACTION BANNER */}
      <div className="farmer-action-banner">
        <div>
          <div className="farmer-action-title">
            <span style={{ fontSize: '1.5rem' }}>🌾</span>
            <span>{t.todayFeedingHeader}</span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
            <span style={{ 
              background: isSafe ? '#059669' : isCritical ? '#dc2626' : '#d97706',
              color: '#ffffff',
              padding: '0.4rem 0.95rem',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              {isSafe ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {isSafe ? t.feedSafeBadge : isCritical ? t.feedDangerBadge : t.feedCautionBadge}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              (Score: {flieg.score}/100)
            </span>
          </div>

          <div className="farmer-action-steps">
            <div className="farmer-step-item">
              <span className="farmer-step-bullet">1</span>
              <div>
                <strong>Feeding Quantity: </strong>
                {isSafe 
                  ? 'Give 15 to 18 kg of silage per cow per day along with 2-3 kg dry straw.' 
                  : 'Reduce silage quantity to 8-10 kg and mix thoroughly with dry roughage.'}
              </div>
            </div>

            <div className="farmer-step-item">
              <span className="farmer-step-bullet">2</span>
              <div>
                <strong>Milk Yield Impact: </strong>
                {isSafe 
                  ? 'This prime lactic silage provides high energy, helping cows yield +1.5 to 2.2 Liters extra milk daily.' 
                  : 'Monitor cow milk fat. Supplement 100g mineral mixture to balance acidity.'}
              </div>
            </div>

            <div className="farmer-step-item">
              <span className="farmer-step-bullet">3</span>
              <div>
                <strong>Silo Pit Inspection: </strong>
                {temperature_core > 34 
                  ? '⚠️ Alert: Temperature rising! Inspect the plastic tarp cover for puncture holes or air leaks.' 
                  : 'Seal is tight and anaerobic. Keep face clean and advance by 15-20 cm daily.'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Farmer Test Checklist */}
        <div className="farmer-quick-card">
          <strong style={{ color: 'var(--text-heading)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <HelpCircle size={18} color="var(--accent-emerald)" />
            <span>How to Check by Hand (Field Guide)</span>
          </strong>

          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
            <div>
              <strong>👃 Smell: </strong>
              <span style={{ color: 'var(--text-muted)' }}>Should smell pleasant & slightly sour like vinegar (not like rotten butter).</span>
            </div>
            <div>
              <strong>👀 Color: </strong>
              <span style={{ color: 'var(--text-muted)' }}>Golden olive green is best. Discard any dark burnt or whitish mold spots.</span>
            </div>
            <div>
              <strong>✋ Moisture: </strong>
              <span style={{ color: 'var(--text-muted)' }}>Squeeze a handful: moist ball without dripping water.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Fermentation Quality Banner */}
      <div className="glass-panel hero-quality-banner">
        <div className="flieg-badge-cluster">
          {/* Animated circular gauge */}
          <div className="score-circle" style={{ borderColor: flieg.color, boxShadow: `0 0 28px ${flieg.color}45` }}>
            <span className="score-value">{flieg.score}</span>
            <span className="score-max">/ 100</span>
          </div>

          <div className="score-details">
            <h2>{t.fliegScore}</h2>
            <div className="score-grade-pill" style={{ background: `${flieg.color}20`, color: flieg.color, borderColor: `${flieg.color}50` }}>
              <ShieldCheck size={18} />
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span>Node: <strong style={{ color: 'var(--text-heading)' }}>{deviceId}</strong></span>
            <span>RSSI: <strong style={{ color: 'var(--accent-emerald)' }}>{wifi_rssi} dBm</strong></span>
            <span>Batt: <strong style={{ color: battery_pct > 20 ? 'var(--accent-emerald)' : '#ef4444' }}>{battery_pct}%</strong></span>
          </div>

          <button 
            className={`btn-anomaly-leak ${abnormalTriggered ? 'active' : ''}`}
            onClick={() => onTriggerAnomaly(selectedPitId, !abnormalTriggered)}
          >
            <AlertTriangle size={18} />
            <span>{abnormalTriggered ? t.resolveAnomaly : t.triggerAnomaly}</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Real-Time Metric Cards with Plain Language Explanations */}
      <div className="metrics-grid-4">
        {/* Core Temperature */}
        <div className="glass-panel metric-card">
          <div>
            <div className="metric-card-header">
              <span className="metric-title">{t.coreTemp}</span>
              <div className="metric-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
                <Thermometer size={22} />
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-num" style={{ color: temperature_core > 35 ? '#ef4444' : undefined }}>
                {temperature_core.toFixed(1)}
              </span>
              <span className="metric-unit">°C</span>
            </div>
            <div className="farmer-tagline">
              {temperature_core < 32 
                ? '🟢 Normal warmth — Bad germs killed' 
                : '⚠️ Heating alert — Check for air leak'}
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
                <Flame size={22} />
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-num" style={{ color: (ph_level < 3.8 || ph_level > 4.4) ? 'var(--accent-amber)' : undefined }}>
                {ph_level.toFixed(2)}
              </span>
              <span className="metric-unit">pH</span>
            </div>
            <div className="farmer-tagline">
              {ph_level <= 4.2 
                ? '🟢 Healthy sour taste cows love' 
                : '⚠️ Mild acid — Keep pit covered tightly'}
            </div>
          </div>
          <div className="metric-status-line">
            <span className="status-badge-inline" style={{ color: ph_level <= 4.2 ? 'var(--accent-emerald)' : '#ef4444' }}>
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
                <Droplets size={22} />
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-num">{moisture_pct.toFixed(1)}</span>
              <span className="metric-unit">%</span>
            </div>
            <div className="farmer-tagline">
              {moisture_pct >= 62 && moisture_pct <= 70 
                ? '🟢 Perfect juice — Easy to chew & digest' 
                : '🟡 Slightly wet or dry — Adjust dry straw'}
            </div>
          </div>
          <div className="metric-status-line">
            <span>Dry Matter (DM): <strong style={{ color: 'var(--text-heading)' }}>{dryMatter}%</strong></span>
          </div>
        </div>

        {/* Ammonia & VOC Gas */}
        <div className="glass-panel metric-card">
          <div>
            <div className="metric-card-header">
              <span className="metric-title">{t.ammoniaGas}</span>
              <div className="metric-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)' }}>
                <Wind size={22} />
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-num" style={{ color: ammonia_ppm > 40 ? '#ef4444' : undefined }}>
                {ammonia_ppm.toFixed(1)}
              </span>
              <span className="metric-unit">ppm</span>
            </div>
            <div className="farmer-tagline">
              {ammonia_ppm <= 30 
                ? '🟢 Fresh grass protein preserved' 
                : '⚠️ Protein breaking down into gas'}
            </div>
          </div>
          <div className="metric-status-line">
            <span>Protein Quality: <strong style={{ color: ammonia_ppm > 40 ? '#ef4444' : 'var(--accent-emerald)' }}>
              {ammonia_ppm > 35 ? 'Degrading' : 'Fresh & High'}
            </strong></span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Real-Time Telemetry Graph & NIR Spectroscopy */}
      <div className="telemetry-layout">
        {/* Real-time Graph Box with Smooth Bezier & Tooltip Tracker */}
        <div className="glass-panel chart-panel">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Dynamic Silage Telemetry Stream</h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Streaming live from probe sensor array (smooth Catmull spline)
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
            <span className="sih-badge" style={{ fontSize: '0.68rem' }}>6-BAND OPTICAL</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 600 }}>
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
                    <span style={{ color: ch.color, fontWeight: 800 }}>{ch.val} ADC ({pct}%)</span>
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
      <div className="glass-panel" style={{ padding: '1.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="chart-title">AI Nutritional Proximate Matrix</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Real-time feed quality inference computed from combined NIR reflectance and core electrochemical sensors
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 800 }}>Mold & Mycotoxin Risk:</span>
            <span style={{ 
              fontWeight: 900, 
              fontSize: '0.92rem',
              color: moldRisk < 20 ? 'var(--accent-emerald)' : moldRisk < 50 ? 'var(--accent-amber)' : '#ef4444' 
            }}>
              {moldRisk}% {moldRisk < 20 ? '(Safe)' : moldRisk < 50 ? '(Monitor)' : '(Severe Danger)'}
            </span>
          </div>
        </div>

        <div className="nutrition-grid">
          <div className="nutrition-item">
            <span className="nutrition-param-name">{t.crudeProtein}</span>
            <span className="nutrition-val" style={{ color: 'var(--accent-emerald)' }}>{crudeProtein}%</span>
            <span className="nutrition-benchmark">Boosts cow milk protein & yield</span>
          </div>

          <div className="nutrition-item">
            <span className="nutrition-param-name">{t.dryMatter}</span>
            <span className="nutrition-val">{dryMatter}%</span>
            <span className="nutrition-benchmark">Target: 30% - 36% solid food</span>
          </div>

          <div className="nutrition-item">
            <span className="nutrition-param-name">{t.tdn}</span>
            <span className="nutrition-val" style={{ color: 'var(--accent-cyan)' }}>{tdn}%</span>
            <span className="nutrition-benchmark">Pure digestion energy</span>
          </div>

          <div className="nutrition-item">
            <span className="nutrition-param-name">Neutral Detergent Fiber (NDF)</span>
            <span className="nutrition-val">{ndf}%</span>
            <span className="nutrition-benchmark">Cow stomach fullness indicator</span>
          </div>

          <div className="nutrition-item">
            <span className="nutrition-param-name">Acid Detergent Fiber (ADF)</span>
            <span className="nutrition-val">{adf}%</span>
            <span className="nutrition-benchmark">Digestible plant cell wall</span>
          </div>

          <div className="nutrition-item">
            <span className="nutrition-param-name">Net Energy Lactation (NEL)</span>
            <span className="nutrition-val" style={{ color: 'var(--accent-amber)' }}>{nel} <span style={{ fontSize: '0.9rem' }}>Mcal/kg</span></span>
            <span className="nutrition-benchmark">Direct milk fuel calorie</span>
          </div>
        </div>
      </div>
    </div>
  );
}
