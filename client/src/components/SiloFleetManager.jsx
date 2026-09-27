import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Calendar, 
  Weight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  MapPin,
  ChevronRight
} from 'lucide-react';

export default function SiloFleetManager({ lang, allPits, selectedPitId, setSelectedPitId }) {
  const [silos, setSilos] = useState([
    {
      id: 'pit-a',
      name: 'Bunker Silo #1 (Kharif Maize)',
      type: 'Concrete Bunker',
      capacityTons: 120,
      currentTons: 84,
      ensiledDate: '2026-08-10',
      daysEnsiled: 47,
      densityKgM3: 690,
      feedOutRateCmDay: 22,
      phase: 'Active Feed-Out',
      status: 'Prime Fermentation',
      healthColor: 'var(--accent-emerald)'
    },
    {
      id: 'pit-b',
      name: 'Trench Pit #2 (Sorghum / Jowar)',
      type: 'Earthen Trench',
      capacityTons: 85,
      currentTons: 72,
      ensiledDate: '2026-08-28',
      daysEnsiled: 29,
      densityKgM3: 640,
      feedOutRateCmDay: 15,
      phase: 'Secondary Storage',
      status: 'Sub-Optimal / Warm',
      healthColor: 'var(--accent-amber)'
    },
    {
      id: 'bale-04',
      name: 'Silage Bale Stack #04 (Alfalfa)',
      type: 'Wrapped Bales (750mm)',
      capacityTons: 35,
      currentTons: 28,
      ensiledDate: '2026-09-02',
      daysEnsiled: 24,
      densityKgM3: 710,
      feedOutRateCmDay: 30,
      phase: 'Stable Anaerobic',
      status: 'Optimal Bale Seal',
      healthColor: 'var(--accent-emerald)'
    },
    {
      id: 'tmr-01',
      name: 'Total Mixed Ration (TMR) Wagon #01',
      type: 'Daily TMR Mix',
      capacityTons: 6,
      currentTons: 4.2,
      ensiledDate: '2026-09-26',
      daysEnsiled: 0,
      densityKgM3: 450,
      feedOutRateCmDay: 100,
      phase: 'Fresh Ration Feeding',
      status: 'Freshly Prepared',
      healthColor: 'var(--accent-cyan)'
    }
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Fleet Header */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="chart-title" style={{ fontSize: '1.35rem' }}>
              Dairy Farm Silo & Bunker Fleet Management
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Real-time monitoring of all farm storage structures, compaction densities, and feed-out face advance rates
            </p>
          </div>
          <span className="sih-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)' }}>
            4 ACTIVE STORAGE SITES
          </span>
        </div>
      </div>

      {/* Silo Fleet Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {silos.map((silo) => {
          const isSelected = selectedPitId === silo.id;
          const tonnagePct = Math.round((silo.currentTons / silo.capacityTons) * 100);

          return (
            <div 
              key={silo.id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                border: isSelected ? '2px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedPitId(silo.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ color: 'var(--text-heading)', fontSize: '1.1rem', fontWeight: 800 }}>{silo.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{silo.type}</span>
                </div>
                <span 
                  className="status-badge-inline" 
                  style={{ color: silo.healthColor, fontSize: '0.75rem', background: 'var(--bg-sub-card)', border: '1px solid var(--border-subtle)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}
                >
                  {silo.phase}
                </span>
              </div>

              {/* Progress capacity bar */}
              <div style={{ margin: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 700 }}>
                  <span>Remaining Feed Stock:</span>
                  <strong style={{ color: 'var(--text-heading)' }}>{silo.currentTons} / {silo.capacityTons} Tons ({tonnagePct}%)</strong>
                </div>
                <div className="nir-track" style={{ height: '9px' }}>
                  <div className="nir-fill" style={{ width: `${tonnagePct}%`, background: isSelected ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }}></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.82rem', background: 'var(--bg-sub-card)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Ensiled Days:</span>
                  <div style={{ fontWeight: 800, color: 'var(--text-heading)' }}>{silo.daysEnsiled} Days</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Packing Density:</span>
                  <div style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>{silo.densityKgM3} kg/m³</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Daily Removal:</span>
                  <div style={{ fontWeight: 800, color: silo.feedOutRateCmDay < 20 ? 'var(--accent-amber)' : 'var(--text-heading)' }}>
                    {silo.feedOutRateCmDay} cm/day
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Fermentation Status:</span>
                  <div style={{ fontWeight: 800, color: silo.healthColor }}>{silo.status}</div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  style={{
                    background: isSelected ? 'var(--accent-emerald)' : 'transparent',
                    border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    padding: '0.45rem 0.95rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <span>{isSelected ? 'Currently Monitored' : 'Select Probe Stream'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
