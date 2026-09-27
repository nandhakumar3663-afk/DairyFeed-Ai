import { useState, useEffect } from 'react';
import { TRANSLATIONS } from './translations';
import Navbar from './components/Navbar';
import LiveTelemetry from './components/LiveTelemetry';
import SilageAnalytics from './components/SilageAnalytics';
import VisualScanner from './components/VisualScanner';
import RationBalancer from './components/RationBalancer';
import SiloFleetManager from './components/SiloFleetManager';
import CooperativePortal from './components/CooperativePortal';
import HardwareDocs from './components/HardwareDocs';
import CertificateModal from './components/CertificateModal';
import { silageService, connectTelemetry } from './services/api';

export default function App() {
  const [lang, setLang] = useState('en');
  const [theme, setTheme] = useState(() => localStorage.getItem('dfa_theme') || 'light');
  const [farmerMode, setFarmerMode] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [selectedPitId, setSelectedPitId] = useState('pit-a');
  const [allPits, setAllPits] = useState([]);
  const [history, setHistory] = useState([]);
  const [connection, setConnection] = useState('connecting');
  const [error, setError] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [token, setToken] = useState(''); // Memory only; never persisted in browser storage.
  const [now, setNow] = useState(() => Date.now());
  const needsBackend = import.meta.env.VITE_PAGES_BUILD === 'true' && !import.meta.env.VITE_API_URL;
  const source = isLiveMode ? 'measured' : 'simulated';
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dfa_theme', theme);
  }, [theme]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    setAllPits([]); setHistory([]); setError(''); setCertificate(null);
    if (needsBackend) { setConnection('backend not configured'); return; }
    if (source === 'measured' && !token) { setConnection('authentication required'); return; }
    const abort = new AbortController();
    let alive = true;
    let streamRevision = 0;
    const refresh = async () => {
      const revision = streamRevision;
      const res = await silageService.getLatestSensors(source, token, abort.signal);
      if (!alive) return;
      if (res.success) { if (revision === streamRevision) setAllPits(res.data); setError(''); }
      else setError(res.error);
    };
    const stop = connectTelemetry({ source, token, onStatus: status => { if (alive) setConnection(status); }, onMessage: message => {
      if (!alive) return;
      streamRevision++;
      if (['INITIAL_STATE', 'TELEMETRY_BATCH'].includes(message.type)) setAllPits(message.data);
      else if (message.type === 'HARDWARE_TELEMETRY') setAllPits(prev => [...prev.filter(p => p.pitId !== message.data.pitId), message.data]);
    } });
    refresh();
    const poll = setInterval(refresh, 5000);
    return () => { alive = false; abort.abort(); stop(); clearInterval(poll); };
  }, [source, token, needsBackend]);
  const visiblePits = allPits.filter(p => p.source === source);
  const activePitData = visiblePits.find(p => p.pitId === selectedPitId) || visiblePits[0];
  const activeId = activePitData?.pitId;
  const isStale = activePitData?.source === 'measured' && now - Date.parse(activePitData.timestamp) > 30000;
  useEffect(() => {
    setHistory([]);
    if (!activeId || (source === 'measured' && !token)) return;
    const abort = new AbortController();
    let alive = true;
    const refresh = async () => {
      const res = await silageService.getHistory(activeId, source, token, abort.signal);
      if (alive && res.success) setHistory(res.history);
    };
    refresh(); const timer = setInterval(refresh, 5000);
    return () => { alive = false; abort.abort(); clearInterval(timer); };
  }, [activeId, source, token]);
  const handleTriggerAnomaly = async (pitId, active) => {
    if (isLiveMode) return;
    const res = await silageService.triggerAnomaly(pitId, active);
    if (!res.success) setError(res.error);
  };
  return <div>
    <a className="skip-link" href="#main-content">Skip to dashboard</a>
    <Navbar {...{ lang, setLang, theme, setTheme, farmerMode, setFarmerMode, activeTab, setActiveTab, isLiveMode, setIsLiveMode, isSpeaking, setIsSpeaking, activePitData }}
      onOpenCertificate={() => activePitData && setCertificate(structuredClone({ ...activePitData, stale: isStale }))} />
    <main id="main-content" className="main-wrapper" tabIndex={-1}>
      <div className="page-heading"><div><span className="eyebrow">DAIRYFEED AI / WORKSPACE</span><h1>{(TRANSLATIONS[lang] || TRANSLATIONS.en).tabs[activeTab]}</h1><p>Understand your feed. Keep every reading in view.</p></div><span className="source-label">{isLiveMode ? "Measured data" : "Demo workspace"}</span></div>
      <div className="glass-panel notice data-notice" role="status">
        <strong>{isLiveMode ? 'Measured sensor data' : 'Simulation — generated demonstration data'}</strong>
        <p>Experimental prototype. Nutrient estimates, quality scores and ration calculations are unvalidated. They do not establish feed safety or detect aflatoxins.</p>
        <p>Connection: {connection}{isStale ? ' · Readings are stale (no update within 30 seconds)' : ''}</p>
        {error && <p role="alert">{error}</p>}
      </div>
      {needsBackend && <div className="glass-panel notice" role="note"><h2>Dashboard preview</h2><p>This GitHub Pages site hosts the interface. Sensor readings and server-generated demonstrations need a connected DairyFeed backend.</p><p>No live measurements are available on this preview.</p></div>}
      {isLiveMode && !needsBackend && <form className="glass-panel notice" onSubmit={e => { e.preventDefault(); setToken(tokenInput); setTokenInput(''); }}>
        <label>Dashboard access token <input aria-label="Dashboard access token" type="password" autoComplete="off" value={tokenInput} onChange={e => setTokenInput(e.target.value)} /></label>
        <button className="btn-voice" type="submit">Connect measurements</button>
        {token && <button className="btn-voice" type="button" onClick={() => { setToken(''); setTokenInput(''); setAllPits([]); setCertificate(null); }}>Disconnect and clear token</button>}
        <p>The token stays in memory for this page session. Device tokens belong on devices, not in this dashboard.</p>
      </form>}
      {activeTab === 'overview' && !needsBackend && <LiveTelemetry {...{ lang, farmerMode, allPits: visiblePits, history: history.filter(p => p.source === source), isLiveMode, isStale }} pitData={activePitData} selectedPitId={activeId || ''} setSelectedPitId={setSelectedPitId} onTriggerAnomaly={handleTriggerAnomaly} />}
      {activeTab === 'analytics' && (activePitData?.inference && !isStale ? <SilageAnalytics lang={lang} activePitData={activePitData} /> : <div className="glass-panel notice">No complete, current sample is available for experimental analytics.</div>)}
      {activeTab === 'vision' && <VisualScanner lang={lang} />}
      {activeTab === 'ration' && <RationBalancer activePitData={isStale ? null : activePitData} />}
      {activeTab === 'silos' && <SiloFleetManager allPits={visiblePits} selectedPitId={activeId} setSelectedPitId={id => { setSelectedPitId(id); setActiveTab('overview'); }} />}
      {activeTab === 'cooperative' && <CooperativePortal lang={lang} />}
      {activeTab === 'hardware' && <HardwareDocs />}
    </main>
    <CertificateModal isOpen={!!certificate} onClose={() => setCertificate(null)} pitData={certificate} />
  </div>;
}
