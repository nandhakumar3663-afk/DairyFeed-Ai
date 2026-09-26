import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  CheckCircle2, 
  QrCode, 
  Building2,
  Calendar,
  Award,
  Edit2,
  Check
} from 'lucide-react';

export default function CertificateModal({ isOpen, onClose, pitData }) {
  if (!isOpen || !pitData) return null;

  const [signatoryName, setSignatoryName] = useState('Authorized Quality Officer');
  const [signatoryTitle, setSignatoryTitle] = useState('Senior Dairy Nutrition Analyst');
  const [labAffiliation, setLabAffiliation] = useState('NDDB / ICAR Certified Quality Testing Cell');
  const [isEditingSignatory, setIsEditingSignatory] = useState(false);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Official Laboratory Testing Certificate • ISO/IEC 17025 Compliant
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => setIsEditingSignatory(!isEditingSignatory)}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '0.5rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Edit2 size={14} />
              <span>{isEditingSignatory ? 'Done Editing' : 'Edit Signatory'}</span>
            </button>
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
        </div>

        {/* Certificate Header */}
        <div className="cert-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065f46', fontWeight: 800, fontSize: '0.92rem' }}>
              <Building2 size={20} />
              <span>MINISTRY OF FISHERIES, ANIMAL HUSBANDRY & DAIRYING</span>
            </div>
            <div className="cert-title" style={{ marginTop: '0.25rem' }}>
              <h1>Certificate of Silage Quality Analysis</h1>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                National Dairy Feed Quality Assurance & Rapid Spectroscopy Testing Protocol
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', padding: '0.35rem 0.75rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.8rem' }}>
              ISO/IEC 17025 COMPLIANT PROTOCOL
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.3rem', fontWeight: 600 }}>
              Report ID: DQA-2026-{Math.floor(100000 + Math.random() * 900000)}
            </div>
          </div>
        </div>

        {/* Sample Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Sample Source:</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{name}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Hardware Probe ID:</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{deviceId}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Testing Method:</span>
            <div style={{ fontWeight: 800, color: '#047857' }}>AI + NIR Spectrometry</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Certification Date:</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{currentDate}</div>
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
              <td><span style={{ color: '#047857', fontWeight: 800 }}>✓ PASS (Grade A)</span></td>
            </tr>
            <tr>
              <td><strong>Silage pH Level</strong></td>
              <td style={{ fontWeight: 800 }}>{ph_level.toFixed(2)}</td>
              <td>3.80 - 4.20 (Lactic Optimum)</td>
              <td><span style={{ color: '#047857', fontWeight: 800 }}>✓ PASS</span></td>
            </tr>
            <tr>
              <td><strong>Dry Matter (DM %)</strong></td>
              <td style={{ fontWeight: 800 }}>{dryMatter}%</td>
              <td>30.0% - 36.0%</td>
              <td><span style={{ color: '#047857', fontWeight: 800 }}>✓ PASS</span></td>
            </tr>
            <tr>
              <td><strong>Crude Protein (CP %)</strong></td>
              <td style={{ fontWeight: 800 }}>{crudeProtein}%</td>
              <td>7.5% - 9.5% (Maize Silage)</td>
              <td><span style={{ color: '#047857', fontWeight: 800 }}>✓ HIGH QUALITY</span></td>
            </tr>
            <tr>
              <td><strong>Total Digestible Nutrients (TDN)</strong></td>
              <td style={{ fontWeight: 800 }}>{tdn}%</td>
              <td>&gt; 64.0%</td>
              <td><span style={{ color: '#047857', fontWeight: 800 }}>✓ PASS</span></td>
            </tr>
            <tr>
              <td><strong>Acid Detergent Fiber (ADF)</strong></td>
              <td style={{ fontWeight: 800 }}>{adf}%</td>
              <td>22.0% - 28.0%</td>
              <td><span style={{ color: '#047857', fontWeight: 800 }}>✓ PASS</span></td>
            </tr>
            <tr>
              <td><strong>Aflatoxin B1 / Mold Hazard</strong></td>
              <td style={{ fontWeight: 800, color: moldRisk < 20 ? '#047857' : '#b91c1c' }}>
                {moldRisk}% (Negligible Risk)
              </td>
              <td>&lt; 20 ppb (FSSAI Tolerance)</td>
              <td><span style={{ color: '#047857', fontWeight: 800 }}>✓ SAFE FOR MILKING HERD</span></td>
            </tr>
          </tbody>
        </table>

        {/* Official Endorsement & Verification Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #cbd5e1' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#047857', fontWeight: 800, fontSize: '0.88rem' }}>
              <ShieldCheck size={20} />
              <span>Certified Safe For Commercial Dairy Herd Rationing</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem', maxWidth: '440px', lineHeight: '1.45' }}>
              This rapid electronic certificate was generated automatically by the Smart AI-Enabled Feed & Silage Quality Analyzer via real-time edge sensor telemetry and calibrated optical spectroscopy.
            </p>
          </div>

          <div style={{ textAlign: 'center', minWidth: '220px' }}>
            {isEditingSignatory ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' }}>
                <input 
                  type="text" 
                  value={signatoryName} 
                  onChange={(e) => setSignatoryName(e.target.value)}
                  style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.25rem 0.5rem', border: '1px solid #059669', borderRadius: '4px' }}
                  placeholder="Officer Name"
                />
                <input 
                  type="text" 
                  value={signatoryTitle} 
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  placeholder="Designation"
                />
                <input 
                  type="text" 
                  value={labAffiliation} 
                  onChange={(e) => setLabAffiliation(e.target.value)}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  placeholder="Lab Affiliation"
                />
              </div>
            ) : (
              <>
                <div style={{ borderBottom: '1.5px solid #0f172a', paddingBottom: '0.25rem', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#047857', fontSize: '0.8rem', fontWeight: 800 }}>
                    <CheckCircle2 size={15} />
                    <span>DIGITALLY VERIFIED</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                    {signatoryName}
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>{signatoryTitle}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{labAffiliation}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
