const { test } = require('node:test');
const assert = require('node:assert/strict');

test('client uses WSS for HTTPS and reconnects after repeated failed attempts', async t => {
  const { websocketURL, connectTelemetry } = await import('../../client/src/services/api.js');
  assert.equal(websocketURL({ href: 'https://farm.example/dashboard' }, '/api/v1'), 'wss://farm.example/ws');
  const sockets = [];
  class FakeSocket {
    constructor() { sockets.push(this); }
    send(payload) { this.sent = JSON.parse(payload); }
    close() {}
  }
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const messages = [];
  const stop = connectTelemetry({ source: 'measured', token: 'test', onMessage: m => messages.push(m), onStatus: () => {}, WebSocketImpl: FakeSocket, url: 'ws://example/ws', retryMs: 10 });
  sockets[0].onclose({ code: 1006 }); t.mock.timers.tick(10);
  sockets[1].onclose({ code: 1006 }); t.mock.timers.tick(10);
  assert.equal(sockets.length, 3);
  sockets[2].onopen(); assert.equal(sockets[2].sent.source, 'measured');
  sockets[2].onmessage({ data: JSON.stringify({ source: 'simulated' }) }); assert.equal(messages.length, 0);
  sockets[2].onclose({ code: 1006 }); stop(); t.mock.timers.tick(10);
  assert.equal(sockets.length, 3);
});
test('client does not endlessly retry rejected authentication', async t => {
  const { connectTelemetry } = await import('../../client/src/services/api.js');
  const sockets = []; const states = [];
  class FakeSocket { constructor() { sockets.push(this); } close() {} }
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const stop = connectTelemetry({ source: 'measured', token: 'bad', onMessage() {}, onStatus: s => states.push(s), WebSocketImpl: FakeSocket, url: 'ws://example/ws' });
  sockets[0].onclose({ code: 1008 }); t.mock.timers.tick(10000);
  assert.equal(sockets.length, 1); assert.equal(states.at(-1), 'authentication or subscription rejected'); stop();
});
