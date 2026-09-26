import React from 'react';
import { 
  Activity, 
  Wifi, 
  Radio, 
  Volume2, 
  VolumeX, 
  FileText, 
  Globe, 
  Layers, 
  Cpu, 
  Sparkles,
  ShieldCheck,
  Camera,
  Scale,
  Users,
  Sun,
  Moon,
  Sprout,
  FlaskConical
} from 'lucide-react';
import { TRANSLATIONS } from '../translations';
import { audioService } from '../services/audioSpeech';

export default function Navbar({
  lang,
  setLang,
  theme,
  setTheme,
  farmerMode,
  setFarmerMode,
  activeTab,
  setActiveTab,
  isLiveMode,
  setIsLiveMode,
  isSpeaking,
  setIsSpeaking,
  onOpenCertificate,
  activePitData
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleVoiceToggle = () => {
    if (isSpeaking) {
      audioService.stop();
      setIsSpeaking(false);
    } else {
      const advisory = activePitData?.inference?.flieg?.advisory || 
        "Silage fermentation is optimal. Core temperature is stable at 25 degrees. Continue standard feeding.";
      const speechText = `${t.fliegScore}: ${activePitData?.inference?.flieg?.score || 85}. ${advisory}`;
      setIsSpeaking(true);
      audioService.speak(speechText, lang, () => setIsSpeaking(false));
    }
  };

  const navItems = [
    { id: 'overview', label: t.tabs.overview, icon: Activity },
    { id: 'analytics', label: t.tabs.analytics, icon: Sparkles },
    { id: 'vision', label: t.tabs.vision, icon: Camera },
    { id: 'ration', label: t.tabs.ration, icon: Scale },
    { id: 'silos', label: t.tabs.silos, icon: Layers },
    { id: 'cooperative', label: t.tabs.cooperative, icon: Users },
    { id: 'hardware', label: t.tabs.hardware, icon: Cpu },
  ];

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand & Ministry Title */}
        <div className="brand-section">
          <div className="brand-logo-glow">
            <Activity size={24} />
          </div>
          <div>
            <div className="brand-title">
              {t.appTitle}
              <span className="sih-badge">LIVE AI + IoT</span>
            </div>
            <span className="brand-subtitle">{t.subTitle}</span>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="header-actions">
          {/* Light / Dark Mode Switcher */}
          <button 
            className="btn-theme-toggle"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Green Mode'}
          >
            {theme === 'light' ? (
              <>
                <Moon size={16} color="var(--accent-emerald)" />
                <span>{t.themeDark}</span>
              </>
            ) : (
              <>
                <Sun size={16} color="#fbbf24" />
                <span>{t.themeLight}</span>
              </>
            )}
          </button>

          {/* Farmer Friendly Simple View vs Lab Expert View */}
          <button 
            className={`btn-farmer-toggle ${farmerMode ? 'active' : ''}`}
            onClick={() => setFarmerMode(!farmerMode)}
            title="Toggle Farmer Friendly Simplified View"
          >
            {farmerMode ? <Sprout size={16} /> : <FlaskConical size={16} />}
            <span>{farmerMode ? t.farmerModeTitle : t.expertModeTitle}</span>
          </button>

          {/* Live ESP32 vs Simulation Mode Toggle */}
          <button 
            className="mode-toggle-pill"
            onClick={() => setIsLiveMode(!isLiveMode)}
            title={isLiveMode ? t.toggleLive : t.toggleSim}
          >
            <span className={`pulse-dot ${isLiveMode ? 'live' : 'sim'}`}></span>
            <span>{isLiveMode ? t.liveStatus : t.simStatus}</span>
          </button>

          {/* Vernacular Language Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Globe size={16} color="var(--text-muted)" />
            <select 
              className="lang-selector" 
              value={lang} 
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>

          {/* Voice Assistant Audio */}
          <button 
            className={`btn-voice ${isSpeaking ? 'speaking' : ''}`}
            onClick={handleVoiceToggle}
            title={isSpeaking ? t.voiceStop : t.voiceAdvisory}
          >
            {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isSpeaking ? t.voiceStop : t.voiceAdvisory}</span>
          </button>

          {/* Lab Certificate Modal Trigger */}
          <button 
            className="btn-voice"
            style={{ 
              background: 'var(--bg-sub-card)', 
              borderColor: 'var(--border-subtle)', 
              color: 'var(--text-main)' 
            }}
            onClick={onOpenCertificate}
          >
            <FileText size={16} color="var(--accent-emerald)" />
            <span>{t.exportCertificate}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="nav-tabs-bar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
