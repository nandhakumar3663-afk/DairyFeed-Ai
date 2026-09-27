import React, { useState } from 'react';
import { 
  Users, 
  Award, 
  Send, 
  IndianRupee, 
  CheckCircle2, 
  TrendingUp, 
  MapPin, 
  Building2,
  BellRing
} from 'lucide-react';

export default function CooperativePortal({ lang }) {
  const [smsSent, setSmsSent] = useState(false);

  const farmers = [
    { rank: 1, name: 'Ramesh Patel', village: 'Kheda MPCS', cows: 14, flieg: 92, cp: '9.2%', bonus: '+₹1.50/L', status: 'Gold Grade' },
    { rank: 2, name: 'Suresh Kumar', village: 'Anand Society #3', cows: 22, flieg: 88, cp: '8.9%', bonus: '+₹1.50/L', status: 'Gold Grade' },
    { rank: 3, name: 'Balvinder Singh', village: 'Ludhiana Union', cows: 18, flieg: 85, cp: '8.7%', bonus: '+₹1.50/L', status: 'Silver Grade' },
    { rank: 4, name: 'Muthusamy G.', village: 'Erode Dairy Circle', cows: 12, flieg: 82, cp: '8.5%', bonus: '+₹1.00/L', status: 'Silver Grade' },
    { rank: 5, name: 'Pravin Deshmukh', village: 'Baramati Co-op', cows: 9, flieg: 74, cp: '7.8%', bonus: '+₹0.50/L', status: 'Standard' },
    { rank: 6, name: 'Rajesh Sharma', village: 'Karnal MPCS', cows: 16, flieg: 48, cp: '6.9%', bonus: '₹0.00/L', status: 'Warning (Warm Pit)' },
  ];

  const handleBroadcastSMS = () => {
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Cooperative Union Overview Header */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Building2 size={22} color="var(--accent-emerald)" />
              <h2 className="chart-title" style={{ fontSize: '1.35rem' }}>
                District Dairy Cooperative Union & NDDB Portal
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Village Milk Producers Cooperative Societies (MPCS) silage quality indexing and milk procurement incentive disbursement
            </p>
          </div>
          <button 
            className="btn-voice"
            onClick={handleBroadcastSMS}
            style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', border: 'none' }}
          >
            <BellRing size={16} />
            <span>{smsSent ? 'SMS Broadcast Sent!' : 'Broadcast Moisture Advisory SMS'}</span>
          </button>
        </div>

        {/* Cooperative KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--bg-sub-card)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Monitored Dairy Farmers</span>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-heading)', marginTop: '0.25rem' }}>1,280+</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>↑ 24% enrollment this season</span>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--bg-sub-card)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Avg Silage Quality Score</span>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>84.2</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Grade: Very Good</span>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--bg-sub-card)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Village Milk Yield Boost</span>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>+18.4%</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Avg +2.2 L/cow/day</span>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--bg-sub-card)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Quality Bonus Disbursed</span>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.25rem' }}>₹4.82 Lakh</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Direct DB-Transfer to Farmers</span>
          </div>
        </div>
      </div>

      {/* Village MPCS Farmer Leaderboard Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 className="chart-title" style={{ marginBottom: '1rem' }}>
          Village MPCS Farmer Silage Quality Leaderboard
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Rank</th>
                <th style={{ padding: '0.75rem' }}>Farmer Name</th>
                <th style={{ padding: '0.75rem' }}>Village / Society</th>
                <th style={{ padding: '0.75rem' }}>Dairy Herd</th>
                <th style={{ padding: '0.75rem' }}>Quality Score</th>
                <th style={{ padding: '0.75rem' }}>Crude Protein</th>
                <th style={{ padding: '0.75rem' }}>Milk Bonus</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((farmer) => (
                <tr key={farmer.rank} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    <span style={{ 
                      width: '26px', 
                      height: '26px', 
                      borderRadius: '50%', 
                      background: farmer.rank <= 3 ? 'var(--accent-emerald)' : 'var(--bg-sub-card)',
                      color: farmer.rank <= 3 ? '#ffffff' : 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.78rem'
                    }}>
                      {farmer.rank}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem', fontWeight: 700, color: 'var(--text-heading)' }}>{farmer.name}</td>
                  <td style={{ padding: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{farmer.village}</td>
                  <td style={{ padding: '0.85rem', color: 'var(--text-main)', fontWeight: 700 }}>{farmer.cows} Cows</td>
                  <td style={{ padding: '0.85rem' }}>
                    <strong style={{ color: farmer.flieg >= 80 ? 'var(--accent-emerald)' : farmer.flieg >= 60 ? 'var(--accent-amber)' : '#ef4444' }}>
                      {farmer.flieg} / 100
                    </strong>
                  </td>
                  <td style={{ padding: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>{farmer.cp}</td>
                  <td style={{ padding: '0.85rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{farmer.bonus}</td>
                  <td style={{ padding: '0.85rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      padding: '0.25rem 0.6rem', 
                      borderRadius: '4px',
                      background: farmer.status.includes('Gold') ? 'rgba(16, 185, 129, 0.15)' : farmer.status.includes('Silver') ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: farmer.status.includes('Gold') ? 'var(--accent-emerald)' : farmer.status.includes('Silver') ? 'var(--accent-cyan)' : '#dc2626'
                    }}>
                      {farmer.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
