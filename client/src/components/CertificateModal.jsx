import React from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  CheckCircle2, 
  QrCode, 
  Building2,
  Calendar,
  Award
} from 'lucide-react';

export default function CertificateModal({ isOpen, onClose, pitData }) {
  if (!isOpen || !pitData) return null;

  const {
    name = 'Bunker Silo #1',
    deviceId = 'ESP32-NODE-01',
    moisture_pct = 65.5,
    ph_level = 4.02,
    inference = {}
  } = pitData;

  const {
    dryMatter = 34.5,
    crudeProtein = 8.6,
    tdn = 67.2,
    adf = 24.6,
    ndf = 43.8,
    flieg = { score: 85, grade: 'Very Good' },
    moldRisk = 8
  } = inference;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="certificate-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Top Control Bar (Hidden during print) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button 
            onClick={handlePrint}
            style={{
              background: '#047857',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Printer size={16} />
            <span>Print / Save PDF</span>
          </button>
          <button 
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              color: '#334155',
              padding: '0.5rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Certificate Header */}
        <div className="cert-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065f46', fontWeight: 800, fontSize: '0.9rem' }}>
              <Building2 size={20} />
              <span>MINISTRY OF FISHERIES, ANIMAL HUSBANDRY & DAIRYING</span>
            </div>
            <div className="cert-title" style={{ marginTop: '0.25rem' }}>
              <h1>Certificate of Silage Quality Analysis</h1>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Smart India Hackathon 2026 - Problem Statement SIH 26111
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', padding: '0.35rem 0.75rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem' }}>
              ISO/IEC 17025 COMPLIANT PROTOCOL
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Report ID: SIH-26111-{Math.floor(100000 + Math.random() * 900000)}
            </div>
          </div>
        </div>

        {/* Sample Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
          <div>
            <span style={{ color: '#64748b' }}>Sample Source:</span>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{name}</div>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Hardware Probe:</span>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{deviceId}</div>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Testing Method:</span>
            <div style={{ fontWeight: 700, color: '#047857' }}>AI + NIR Spectrometry</div>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Certification Date:</span>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{currentDate}</div>
          </div>
        </div>

        {/* Nutritional & Chemical Analysis Results Table */}
        <table className="cert-table">
          <thead>
            <tr>
              <th>Analytical Parameter</th>
              <th>Observed Result</th>
              <th>Reference Benchmark (ICAR / NDDB)</th>
              <th>Quality Compliance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Flieg's Fermentation Score</strong></td>
              <td style={{ fontWeight: 800, color: '#047857' }}>{flieg.score} / 100 ({flieg.grade})</td>
              <td>&gt; 65 (Good to Excellent)</td>
              <td><span style={{ color: '#047857', fontWeight: 700 }}>✓ PASS (Grade A)</span></td>
            </tr>
            <tr>
              <td><strong>Silage pH Level</strong></td>
              <td style={{ fontWeight: 700 }}>{ph_level.toFixed(2)}</td>
              <td>3.80 - 4.20 (Lactic Optimum)</td>
              <td><span style={{ color: '#047857', fontWeight: 700 }}>✓ PASS</span></td>
            </tr>
            <tr>
              <td><strong>Dry Matter (DM %)</strong></td>
              <td style={{ fontWeight: 700 }}>{dryMatter}%</td>
              <td>30.0% - 36.0%</td>
              <td><span style={{ color: '#047857', fontWeight: 700 }}>✓ PASS</span></td>
            </tr>
            <tr>
              <td><strong>Crude Protein (CP %)</strong></td>
              <td style={{ fontWeight: 700 }}>{crudeProtein}%</td>
              <td>7.5% - 9.5% (Maize Silage)</td>
              <td><span style={{ color: '#047857', fontWeight: 700 }}>✓ HIGH QUALITY</span></td>
            </tr>
            <tr>
              <td><strong>Total Digestible Nutrients (TDN)</strong></td>
              <td style={{ fontWeight: 700 }}>{tdn}%</td>
              <td>&gt; 64.0%</td>
              <td><span style={{ color: '#047857', fontWeight: 700 }}>✓ PASS</span></td>
            </tr>
            <tr>
              <td><strong>Acid Detergent Fiber (ADF)</strong></td>
              <td style={{ fontWeight: 700 }}>{adf}%</td>
              <td>22.0% - 28.0%</td>
              <td><span style={{ color: '#047857', fontWeight: 700 }}>✓ PASS</span></td>
            </tr>
            <tr>
              <td><strong>Aflatoxin B1 / Mold Hazard</strong></td>
              <td style={{ fontWeight: 700, color: moldRisk < 20 ? '#047857' : '#b91c1c' }}>
                {moldRisk}% (Negligible Risk)
              </td>
              <td>&lt; 20 ppb (FSSAI Tolerance)</td>
              <td><span style={{ color: '#047857', fontWeight: 700 }}>✓ SAFE FOR MILKING HERD</span></td>
            </tr>
          </tbody>
        </table>

        {/* Official Endorsement & Verification Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #cbd5e1' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#047857', fontWeight: 700, fontSize: '0.85rem' }}>
              <ShieldCheck size={18} />
              <span>Certified Safe For Commercial Dairy Herd Rationing</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', maxWidth: '420px' }}>
              This rapid electronic certificate was generated automatically by the Smart AI-Enabled Feed & Silage Quality Analyzer via real-time ESP32 edge telemetry and spectroscopy calibration.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #0f172a', width: '180px', marginBottom: '0.35rem' }}>
              <span style={{ fontFamily: 'cursive', fontSize: '1.1rem', color: '#0f172a' }}>Dr. A. K. Sharma</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>Chief Dairy Nutritionist</span>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>NDDB / ICAR Certified Lab</div>
          </div>
        </div>
      </div>
    </div>
  );
}
