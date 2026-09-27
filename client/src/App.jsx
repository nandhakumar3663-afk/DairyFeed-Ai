import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LiveTelemetry from './components/LiveTelemetry';
import SilageAnalytics from './components/SilageAnalytics';
import VisualScanner from './components/VisualScanner';
import RationBalancer from './components/RationBalancer';
import SiloFleetManager from './components/SiloFleetManager';
import CooperativePortal from './components/CooperativePortal';
import HardwareDocs from './components/HardwareDocs';
import CertificateModal from './components/CertificateModal';

import { silageService } from './services/api';
import { inferNutritionalProfile } from './services/simulator';
import { AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState('en');
  // Default to light green theme as requested by user
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dfa_theme') || 'light';
  });
  const [farmerMode, setFarmerMode] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [selectedPitId, setSelectedPitId] = useState('pit-a');
  const [alertNotice, setAlertNotice] = useState(null);

  // Sync theme with document attribute & localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dfa_theme', theme);
  }, [theme]);

  // Default fallback pits
  const defaultPits = [
    {
      pitId: 'pit-a',
      name: 'Bunker Silo #1 (Kharif Maize)',
      deviceId: 'ESP32-NODE-01',
      temperature_core: 25.4,
      temperature_top: 28.1,
      temperature_bottom: 23.5,
      ph_level: 4.02,
      moisture_pct: 65.5,
      ammonia_ppm: 15.2,
      battery_pct: 92,
      wifi_rssi: -60,
      abnormalTriggered: false,
      nir_bands: [430, 520, 640, 720, 810, 895],
      inference: inferNutritionalProfile({
        moisture_pct: 65.5,
        ph_level: 4.02,
        temperature_core: 25.4,
        ammonia_ppm: 15.2,
        nir_bands: [430, 520, 640, 720, 810, 895]
      })
    },
    {
      pitId: 'pit-b',
      name: 'Trench Pit #2 (Sorghum / Jowar)',
      deviceId: 'ESP32-NODE-02',
      temperature_core: 33.2,
      temperature_top: 36.4,
      temperature_bottom: 30.8,
      ph_level: 4.45,
      moisture_pct: 69.8,
      ammonia_ppm: 34.0,
      battery_pct: 84,
      wifi_rssi: -67,
      abnormalTriggered: false,
      nir_bands: [415, 495, 610, 690, 780, 860],
      inference: inferNutritionalProfile({
        moisture_pct: 69.8,
        ph_level: 4.45,
        temperature_core: 33.2,
        ammonia_ppm: 34.0,
        nir_bands: [415, 495, 610, 690, 780, 860]
      })
    },
    {
      pitId: 'bale-04',
      name: 'Silage Bale #04 (Alfalfa / Lucerne)',
      deviceId: 'ESP32-PORTABLE-01',
      temperature_core: 22.8,
      temperature_top: 23.9,
      temperature_bottom: 22.4,
      ph_level: 4.58,
      moisture_pct: 58.4,
      ammonia_ppm: 16.5,
      battery_pct: 78,
      wifi_rssi: -72,
      abnormalTriggered: false,
      nir_bands: [440, 530, 650, 730, 825, 910],
      inference: inferNutritionalProfile({
        moisture_pct: 58.4,
        ph_level: 4.58,
        temperature_core: 22.8,
        ammonia_ppm: 16.5,
        nir_bands: [440, 530, 650, 730, 825, 910]
      })
    }
  ];

  const [allPits, setAllPits] = useState(defaultPits);
  const [history, setHistory] = useState([]);

  // Connect to WebSocket and fetch initial telemetry
  useEffect(() => {
    // 1. Initial REST fetch
    silageService.getLatestSensors().then((res) => {
      if (res && res.success && res.data) {
        setAllPits(res.data);
      }
    });

    // 2. Fetch history
    silageService.getHistory(selectedPitId, 25).then((res) => {
      if (res && res.success && res.history) {
        setHistory(res.history);
      }
    });

    // 3. Setup WebSocket Listener
    const handleWsMessage = (message) => {
      if (message.type === 'INITIAL_STATE' && message.data) {
        setAllPits(message.data);
      } else if (message.type === 'TELEMETRY_BATCH' && message.data) {
        setAllPits(message.data);

        // Update history for current pit
        const currentUpdate = message.data.find(p => p.pitId === selectedPitId);
        if (currentUpdate) {
          setHistory(prev => {
            const next = [...prev, currentUpdate];
            return next.slice(-30);
          });

          // Check for spoilage temperature spike
          if (currentUpdate.temperature_core > 36 && !alertNotice) {
            setAlertNotice({
              title: 'Aerobic Spoilage Heating Warning!',
              message: `Core temperature in ${currentUpdate.name || currentUpdate.pitId} reached ${currentUpdate.temperature_core}°C. Check plastic seal immediately!`
            });
          }
        }
      } else if (message.type === 'HARDWARE_TELEMETRY' && message.data) {
        // Hardware ESP32 packet received!
        setAllPits(prev => {
          const index = prev.findIndex(p => p.pitId === message.pitId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = message.data;
            return updated;
          }
          return [...prev, message.data];
        });

        if (message.pitId === selectedPitId) {
          setHistory(prev => [...prev, message.data].slice(-30));
        }
      }
    };

    silageService.initWebSocket(handleWsMessage);

    // Fallback ticker if WebSocket or server is dormant
    const fallbackTicker = setInterval(() => {
      if (!silageService.isConnected) {
        setAllPits(prevPits => 
          prevPits.map(pit => {
            const tempDelta = (Math.random() * 0.16 - 0.08);
            const phDelta = (Math.random() * 0.02 - 0.01);
            const moistDelta = (Math.random() * 0.1 - 0.05);

            const newTemp = Number((pit.temperature_core + tempDelta).toFixed(2));
            const newPh = Number(Math.max(3.6, Math.min(6.0, pit.ph_level + phDelta)).toFixed(2));
            const newMoist = Number(Math.max(50, Math.min(75, pit.moisture_pct + moistDelta)).toFixed(1));

            const updatedReading = {
              ...pit,
              temperature_core: newTemp,
              ph_level: newPh,
              moisture_pct: newMoist,
              timestamp: new Date().toISOString()
            };

            updatedReading.inference = inferNutritionalProfile(updatedReading);
            return updatedReading;
          })
        );
      }
    }, 3000);

    return () => {
      silageService.unsubscribe(handleWsMessage);
      clearInterval(fallbackTicker);
    };
  }, [selectedPitId]);

  // Current active pit data
  const activePitData = allPits.find(p => p.pitId === selectedPitId) || allPits[0];

  const handleTriggerAnomaly = async (pitId, active) => {
    // 1. Send to server
    await silageService.triggerAnomaly(pitId, active);

    // 2. Optimistic local update
    setAllPits(prev => prev.map(p => {
      if (p.pitId === pitId) {
        const abnormalTriggered = active;
        const newTemp = active ? 39.5 : 25.4;
        const newPh = active ? 4.85 : 4.02;
        const updated = {
          ...p,
          abnormalTriggered,
          temperature_core: newTemp,
          ph_level: newPh,
          status: active ? 'AEROBIC SPOILAGE ALERT!' : 'Optimal Anaerobic'
        };
        updated.inference = inferNutritionalProfile(updated);
        return updated;
      }
      return p;
    }));

    if (active) {
      setAlertNotice({
        title: 'Aerobic Spoilage Simulated!',
        message: 'Air leak triggered: Core temperature climbing, pH rising towards butyric spoilage.'
      });
    } else {
      setAlertNotice(null);
    }
  };

  const handleHardwarePacketSent = (packet) => {
    setAllPits(prev => {
      const idx = prev.findIndex(p => p.pitId === packet.pitId);
      const withInference = {
        ...packet,
        name: 'Live ESP32 Streamed Node',
        inference: inferNutritionalProfile(packet)
      };
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = withInference;
        return copy;
      }
      return [withInference, ...prev];
    });
    setSelectedPitId(packet.pitId);
    setActiveTab('overview');
  };

  return (
    <div>
      {/* Navigation Header with Theme & Farmer Mode toggles */}
      <Navbar
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        farmerMode={farmerMode}
        setFarmerMode={setFarmerMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLiveMode={isLiveMode}
        setIsLiveMode={setIsLiveMode}
        isSpeaking={isSpeaking}
        setIsSpeaking={setIsSpeaking}
        onOpenCertificate={() => setIsCertOpen(true)}
        activePitData={activePitData}
      />

      {/* Real-time Spoilage Alert Toast Notification */}
      {alertNotice && (
        <div style={{
          maxWidth: '1440px',
          margin: '1rem auto 0',
          padding: '0 1.75rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.25) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.6)',
            borderRadius: '12px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={22} color="#dc2626" />
              <div>
                <strong style={{ color: '#991b1b', fontSize: '0.92rem' }}>{alertNotice.title}</strong>
                <p style={{ color: '#b91c1c', fontSize: '0.84rem', margin: 0, fontWeight: 600 }}>{alertNotice.message}</p>
              </div>
            </div>
            <button 
              onClick={() => setAlertNotice(null)}
              style={{ background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="main-wrapper">
        {activeTab === 'overview' && (
          <LiveTelemetry
            lang={lang}
            pitData={activePitData}
            allPits={allPits}
            selectedPitId={selectedPitId}
            setSelectedPitId={setSelectedPitId}
            history={history}
            onTriggerAnomaly={handleTriggerAnomaly}
            isLiveMode={isLiveMode}
            farmerMode={farmerMode}
          />
        )}

        {activeTab === 'analytics' && (
          <SilageAnalytics
            lang={lang}
            activePitData={activePitData}
          />
        )}

        {activeTab === 'vision' && (
          <VisualScanner
            lang={lang}
          />
        )}

        {activeTab === 'ration' && (
          <RationBalancer
            lang={lang}
            activePitData={activePitData}
          />
        )}

        {activeTab === 'silos' && (
          <SiloFleetManager
            lang={lang}
            allPits={allPits}
            selectedPitId={selectedPitId}
            setSelectedPitId={setSelectedPitId}
          />
        )}

        {activeTab === 'cooperative' && (
          <CooperativePortal
            lang={lang}
          />
        )}

        {activeTab === 'hardware' && (
          <HardwareDocs
            lang={lang}
            onHardwarePacketSent={handleHardwarePacketSent}
          />
        )}
      </main>

      {/* Printable Lab Certificate Modal */}
      <CertificateModal
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
        pitData={activePitData}
      />
    </div>
  );
}
