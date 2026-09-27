const API_BASE = import.meta.env?.VITE_API_URL || '/api/v1';
export function websocketURL(location, apiBase = API_BASE) {
  const url = new URL(apiBase, location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws'; url.search = ''; url.hash = '';
  return url.toString();
}
export function connectTelemetry({ source, token = '', onMessage, onStatus, WebSocketImpl = globalThis.WebSocket,
  url = websocketURL(window.location), retryMs = 3000 }) {
  let socket;
  let timer;
  let stopped = false;
  const retry = () => {
    if (stopped || timer) return;
    timer = setTimeout(() => { timer = null; open(); }, retryMs);
  };
  const open = () => {
    if (stopped) return;
    onStatus('connecting');
    try {
      socket = new WebSocketImpl(url);
      socket.onopen = () => socket.send(JSON.stringify({ type: 'SUBSCRIBE', source, token: source === 'measured' ? token : undefined }));
      socket.onmessage = event => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.source !== source) return;
          onStatus('connected'); onMessage(payload);
        } catch { onStatus('invalid response'); }
      };
      socket.onclose = event => {
        if (stopped) return;
        if (event.code === 1008) { onStatus('authentication or subscription rejected'); return; }
        onStatus('disconnected'); retry();
      };
      socket.onerror = () => { onStatus('disconnected'); socket.close(); };
    } catch { onStatus('disconnected'); retry(); }
  };
  open();
  return () => {
    stopped = true; clearTimeout(timer);
    if (socket) { socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null; socket.close(); }
  };
}
async function request(path, { body, token, signal } = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ?? AbortSignal.timeout(10000),
    });
    const result = await res.json();
    if (!res.ok) return { success: false, error: result.error || `Request failed (${res.status})` };
    return result;
  } catch (error) { return { success: false, error: error.name === 'AbortError' ? 'Request cancelled' : 'Server unavailable. No replacement readings have been generated.' }; }
}
export const silageService = {
  getLatestSensors: (source, token, signal) => request(`/sensors/latest?source=${encodeURIComponent(source)}`, { token, signal }),
  getHistory: (pit, source, token, signal) => request(`/sensors/history?pit=${encodeURIComponent(pit)}&source=${encodeURIComponent(source)}&limit=30`, { token, signal }),
  triggerAnomaly: (pitId, active) => request('/sensors/anomaly-trigger', { body: { pitId, active } }),
  sendSimulationTelemetry: body => request('/simulation/telemetry', { body }),
  optimizeRation: body => request('/ration/optimize', { body }),
};
