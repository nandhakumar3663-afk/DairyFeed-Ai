/**
 * Client API & WebSocket Real-time Ingestion Service
 * Connects to ESP32 Gateway Server with resilient auto-reconnect and client-side fallback.
 */

const API_BASE = window.location.port === '3000' ? 'http://localhost:5001/api/v1' : '/api/v1';
const WS_BASE = window.location.port === '3000' ? 'ws://localhost:5001' : `ws://${window.location.host}`;

class SilageDataService {
  constructor() {
    this.ws = null;
    this.subscribers = new Set();
    this.isConnected = false;
    this.reconnectTimer = null;
  }

  initWebSocket(onTelemetryUpdate) {
    if (onTelemetryUpdate) {
      this.subscribers.add(onTelemetryUpdate);
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(WS_BASE);

      this.ws.onopen = () => {
        console.log('[WS] Connected to SmartFeed IoT Hub');
        this.isConnected = true;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          for (const callback of this.subscribers) {
            callback(payload);
          }
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Auto-reconnect after 3 seconds
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.initWebSocket();
          }, 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[WS] Connection issue, using fallback:', err.message || 'offline');
        this.isConnected = false;
      };
    } catch (e) {
      console.warn('[WS] WebSocket unavailable:', e);
      this.isConnected = false;
    }
  }

  unsubscribe(callback) {
    this.subscribers.delete(callback);
  }

  async getLatestSensors() {
    try {
      const res = await fetch(`${API_BASE}/sensors/latest`);
      return await res.json();
    } catch (e) {
      console.warn('API fetch fallback to defaults');
      return { success: false };
    }
  }

  async getHistory(pitId = 'pit-a', limit = 25) {
    try {
      const res = await fetch(`${API_BASE}/sensors/history?pit=${pitId}&limit=${limit}`);
      return await res.json();
    } catch (e) {
      return { success: false, history: [] };
    }
  }

  async triggerAnomaly(pitId = 'pit-a', active = true) {
    try {
      const res = await fetch(`${API_BASE}/sensors/anomaly-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitId, active })
      });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  }

  async sendHardwareTelemetry(packet) {
    try {
      const res = await fetch(`${API_BASE}/sensors/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packet)
      });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  }

  async analyzeImageSample(payload) {
    try {
      const res = await fetch(`${API_BASE}/vision/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  }

  async optimizeRation(payload) {
    try {
      const res = await fetch(`${API_BASE}/ration/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  }

  async getFirebaseConfig() {
    try {
      const res = await fetch(`${API_BASE}/config/firebase`);
      return await res.json();
    } catch (e) {
      return null;
    }
  }
}

export const silageService = new SilageDataService();
