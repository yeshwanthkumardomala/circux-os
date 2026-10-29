const http = require('http');
const crypto = require('crypto');
const os = require('os');

const port = Number(process.env.CIRCUX_RELAY_PORT || 3002);
const sessions = new Map();

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

function createSession() {
  const token = crypto.randomBytes(12).toString('hex');
  const item = { token, slots: { A: 'CX-104', B: 'CX-106' }, clients: new Set(), updatedAt: new Date().toISOString() };
  sessions.set(token, item);
  return item;
}

function state(item) { return { token: item.token, slots: item.slots, updatedAt: item.updatedAt }; }
function emit(item, event) { item.clients.forEach(client => client.write(`data: ${JSON.stringify(event)}\n\n`)); }
function touch(item, event) { item.updatedAt = new Date().toISOString(); emit(item, { ...event, updatedAt: item.updatedAt }); }

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' });
    return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);
  try {
    if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, sessions: sessions.size });
    if (req.method === 'GET' && url.pathname === '/network') {
      const interfaces = os.networkInterfaces();
      const hosts = Object.values(interfaces).flat().filter(item => item && item.family === 'IPv4' && !item.internal).map(item => item.address);
      return json(res, 200, { host: hosts[0] || 'localhost', hosts });
    }
    if (req.method === 'POST' && url.pathname === '/session') {
      const item = createSession();
      return json(res, 201, state(item));
    }
    if (parts[0] !== 'session' || !parts[1]) return json(res, 404, { error: 'Not found' });
    const item = sessions.get(parts[1]);
    if (!item) return json(res, 404, { error: 'Session expired or unknown' });
    if (req.method === 'GET' && parts[2] === 'state') return json(res, 200, state(item));
    if (req.method === 'GET' && parts[2] === 'events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' });
      res.write(`data: ${JSON.stringify({ type: 'state', ...state(item) })}\n\n`);
      item.clients.add(res);
      req.on('close', () => item.clients.delete(res));
      return;
    }
    if (req.method === 'POST' && parts[2] === 'slot') {
      const input = await readBody(req);
      if (!['A', 'B'].includes(input.slot) || typeof input.projectId !== 'string') return json(res, 400, { error: 'slot and projectId are required' });
      item.slots[input.slot] = input.projectId;
      touch(item, { type: 'slot:update', slot: input.slot, projectId: input.projectId });
      return json(res, 200, state(item));
    }
    if (req.method === 'POST' && parts[2] === 'clear') {
      const input = await readBody(req);
      if (!['A', 'B'].includes(input.slot)) return json(res, 400, { error: 'slot must be A or B' });
      item.slots[input.slot] = null;
      touch(item, { type: 'slot:clear', slot: input.slot });
      return json(res, 200, state(item));
    }
    if (req.method === 'POST' && parts[2] === 'swap') {
      [item.slots.A, item.slots.B] = [item.slots.B, item.slots.A];
      touch(item, { type: 'slots:swap' });
      return json(res, 200, state(item));
    }
    return json(res, 404, { error: 'Not found' });
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
});

setInterval(() => {
  sessions.forEach(item => {
    [...new Set([item.slots.A, item.slots.B].filter(Boolean))].forEach(projectId => {
      const tick = Math.round(Date.now() / 1500);
      touch(item, { type: 'feed:update', projectId, state: 'running', readings: [
        { label: 'Signal', value: `${50 + (tick % 18)}%`, note: 'Simulated relay feed' },
        { label: 'Temperature', value: `${(24 + (tick % 12) / 10).toFixed(1)}°C`, note: 'Simulated relay feed' },
        { label: 'State', value: 'Running', note: 'Simulated relay feed' },
      ] });
    });
  });
}, 1500);

server.listen(port, '0.0.0.0', () => console.log(`Circux relay listening on http://0.0.0.0:${port}`));
