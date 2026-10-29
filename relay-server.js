const http = require('http');
const fs = require('fs');
const path = require('path');

// Load local environment values without overwriting variables supplied by the shell.
const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
  }
}
const crypto = require('crypto');
const os = require('os');
const store = require('./relay-store');

const port = Number(process.env.CIRCUX_RELAY_PORT || 3002);
const sessions = new Map();
const projects = new Map(Object.entries(store.data.projects || {}));
let workspaceConfig = { slotA: 'CX-104', slotB: 'CX-106', ...store.data.config };
const judging = store.data.judging || [];
const uploads = store.data.uploads || [];
const SESSION_TTL = Number(process.env.CIRCUX_SESSION_TTL_MS || 4 * 60 * 60 * 1000);
const deviceUrl = process.env.CIRCUX_DEVICE_URL?.replace(/\/$/, '');
const deviceKey = process.env.CIRCUX_DEVICE_KEY;
const adminToken = process.env.CIRCUX_ADMIN_TOKEN || '';

function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  json(res, 401, { error: 'Admin authentication required. Configure CIRCUX_ADMIN_TOKEN and enter it in the browser when prompted.' });
  return false;
}

function isAdmin(req) {
  const supplied = Buffer.from(String(req.headers.authorization || ''));
  const expected = Buffer.from(`Bearer ${adminToken}`);
  return Boolean(adminToken) && supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

function persist() { store.save({ projects: Object.fromEntries(projects), config: workspaceConfig, judging, uploads }); }
function setCors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return;
  try {
    const parsed = new URL(origin);
    const requestHost = String(req.headers.host || '').split(':')[0];
    const configured = (process.env.CIRCUX_ALLOWED_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean);
    const sameHostDevelopmentOrigin = parsed.hostname === requestHost && ['3000', '3001'].includes(parsed.port);
    const allowed = configured.includes(origin) || sameHostDevelopmentOrigin;
    if (allowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
  } catch { }
}

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

function readBody(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; if (data.length > limit) { reject(new Error('Request body too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

function createSession() {
  const token = crypto.randomBytes(12).toString('hex');
  const item = { token, slots: { A: workspaceConfig.slotA || 'CX-104', B: workspaceConfig.displayMode === 'single-project' ? null : (workspaceConfig.slotB || 'CX-106') }, clients: new Set(), updatedAt: new Date().toISOString(), lastActivity: Date.now() };
  sessions.set(token, item);
  return item;
}

function state(item) { return { token: item.token, slots: item.slots, updatedAt: item.updatedAt }; }
function emit(item, event) { item.clients.forEach(client => client.write(`data: ${JSON.stringify(event)}\n\n`)); }
function touch(item, event) { item.updatedAt = new Date().toISOString(); emit(item, { ...event, updatedAt: item.updatedAt }); }
function active(item) { item.lastActivity = Date.now(); }
async function deviceRequest(path, init = {}) {
  if (!deviceUrl) throw new Error('Hardware adapter is not configured');
  const response = await fetch(`${deviceUrl}${path}`, { ...init, signal: AbortSignal.timeout(3000), headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!response.ok) throw new Error(`Hardware adapter failed (${response.status})`);
  return response.json();
}

const server = http.createServer(async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Circux-Device-Key', 'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS' });
    return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);
  try {
    if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, sessions: sessions.size });
    if (req.method === 'GET' && url.pathname === '/projects') { if (!requireAdmin(req, res)) return; return json(res, 200, [...projects.values()]); }
    if (req.method === 'GET' && url.pathname === '/network') {
      const interfaces = os.networkInterfaces();
      const hosts = Object.values(interfaces).flat().filter(item => item && item.family === 'IPv4' && !item.internal).map(item => item.address);
      return json(res, 200, { host: hosts[0] || 'localhost', hosts });
    }
    if (req.method === 'GET' && url.pathname === '/config') { if (!requireAdmin(req, res)) return; return json(res, 200, workspaceConfig); }
    if (req.method === 'PUT' && url.pathname === '/config') {
      if (!requireAdmin(req, res)) return;
      const input = await readBody(req);
      workspaceConfig = { ...workspaceConfig, ...input };
      persist();
      return json(res, 200, workspaceConfig);
    }
    if (req.method === 'GET' && url.pathname === '/device/health') {
      if (!deviceUrl) return json(res, 200, { configured: false, connected: false, mode: 'not-configured' });
      try { return json(res, 200, { configured: true, connected: true, mode: 'hardware', ...(await deviceRequest('/health')) }); } catch (error) { return json(res, 200, { configured: true, connected: false, mode: 'hardware', error: error.message }); }
    }
    if (req.method === 'GET' && url.pathname === '/device/readings') { if (!requireAdmin(req, res)) return; return json(res, 200, await deviceRequest('/readings')); }
    if (req.method === 'POST' && url.pathname === '/device/command') {
      if (!deviceKey || req.headers['x-circux-device-key'] !== deviceKey) return json(res, 401, { error: 'Hardware command authentication required' });
      if (!requireAdmin(req, res)) return;
      if (process.env.CIRCUX_ENABLE_HARDWARE_COMMANDS !== 'true') return json(res, 403, { error: 'Hardware commands are disabled. Enable CIRCUX_ENABLE_HARDWARE_COMMANDS only after validating physical safety interlocks.' });
      const input = await readBody(req, 4096);
      if (!['wake', 'restart', 'power-off'].includes(input.action)) return json(res, 400, { error: 'action must be wake, restart, or power-off' });
      return json(res, 200, await deviceRequest('/command', { method: 'POST', body: JSON.stringify({ action: input.action }) }));
    }
    if (req.method === 'GET' && url.pathname === '/judging') { if (!requireAdmin(req, res)) return; return json(res, 200, judging); }
    if (req.method === 'POST' && url.pathname === '/judging') {
      if (!requireAdmin(req, res)) return;
      const input = await readBody(req, 32 * 1024);
      if (typeof input.projectId !== 'string' || !Array.isArray(input.scores)) return json(res, 400, { error: 'projectId and scores are required' });
      const record = { id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString() };
      judging.push(record); persist(); return json(res, 201, record);
    }
    if (req.method === 'GET' && url.pathname === '/uploads') { if (!requireAdmin(req, res)) return; return json(res, 200, uploads); }
    if (req.method === 'GET' && parts[0] === 'uploads' && parts[1] === 'file' && parts[2]) {
      if (!requireAdmin(req, res)) return;
      const item = uploads.find(upload => upload.id === parts[2]);
      if (!item) return json(res, 404, { error: 'Upload not found' });
      res.writeHead(200, {
        'Content-Type': item.type,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(item.name)}`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      });
      return res.end(store.readUpload(item.id, item.projectId));
    }
    if (req.method === 'POST' && url.pathname === '/uploads') {
      if (!requireAdmin(req, res)) return;
      const input = await readBody(req, 14 * 1024 * 1024);
      if (typeof input.name !== 'string' || !input.name.trim() || typeof input.data !== 'string') return json(res, 400, { error: 'name and data are required' });
      if (input.name.length > 200) return json(res, 400, { error: 'name must be 200 characters or fewer' });
      if (input.projectId && (typeof input.projectId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(input.projectId) || !projects.has(input.projectId))) return json(res, 400, { error: 'projectId must match an existing project' });
      const id = crypto.randomUUID();
      const encoded = input.data.replace(/^data:[^;]+;base64,/, '');
      if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) return json(res, 400, { error: 'data must contain valid base64 file content' });
      const buffer = Buffer.from(encoded, 'base64');
      if (buffer.length > 10 * 1024 * 1024) return json(res, 413, { error: 'file is too large' });
      store.writeUpload(id, buffer, input.projectId);
      const record = { id, name: input.name.slice(0, 200), type: typeof input.type === 'string' && /^[\w.+-]+\/[\w.+-]+$/.test(input.type) ? input.type : 'application/octet-stream', size: buffer.length, projectId: input.projectId || null, createdAt: new Date().toISOString() };
      uploads.push(record); persist(); return json(res, 201, record);
    }
    if (req.method === 'DELETE' && parts[0] === 'uploads' && parts[1]) {
      if (!requireAdmin(req, res)) return;
      const index = uploads.findIndex(item => item.id === parts[1]);
      if (index < 0) return json(res, 404, { error: 'Upload not found' });
      store.removeUpload(uploads[index].id, uploads[index].projectId); uploads.splice(index, 1); persist(); return json(res, 200, { ok: true });
    }
    if (req.method === 'PUT' && url.pathname === '/projects') {
      if (!requireAdmin(req, res)) return;
      const input = await readBody(req, 1024 * 1024);
      if (!Array.isArray(input.projects)) return json(res, 400, { error: 'projects must be an array' });
      const nextProjects = new Map();
      input.projects.forEach(project => {
        if (!project || typeof project.id !== 'string' || typeof project.name !== 'string') throw new Error('Each project needs an id and name');
        nextProjects.set(project.id, project);
      });
      for (const upload of uploads) if (upload.projectId && !nextProjects.has(upload.projectId)) { store.moveUpload(upload.id, upload.projectId, null); upload.projectId = null; }
      projects.clear();
      nextProjects.forEach((project, id) => projects.set(id, project));
      persist();
      return json(res, 200, { count: projects.size });
    }
    if (req.method === 'GET' && parts[0] === 'projects' && parts[1]) {
      const project = projects.get(decodeURIComponent(parts[1]));
      if (!project) return json(res, 404, { error: 'Project not found' });
      if (project.hidden && !isAdmin(req)) return json(res, 404, { error: 'Project hidden', hidden: true });
      return json(res, 200, project);
    }
    if (req.method === 'PUT' && parts[0] === 'projects' && parts[1]) {
      if (!requireAdmin(req, res)) return;
      const input = await readBody(req, 1024 * 1024);
      if (!input || typeof input.id !== 'string' || input.id !== decodeURIComponent(parts[1]) || typeof input.name !== 'string') return json(res, 400, { error: 'A matching project id and name are required' });
      projects.set(input.id, input); persist(); return json(res, 200, input);
    }
    if (req.method === 'POST' && url.pathname === '/session') {
      const item = createSession();
      return json(res, 201, state(item));
    }
    if (parts[0] !== 'session' || !parts[1]) return json(res, 404, { error: 'Not found' });
    const item = sessions.get(parts[1]);
    if (!item) return json(res, 404, { error: 'Session expired or unknown' });
    active(item);
    if (req.method === 'GET' && parts[2] === 'state') return json(res, 200, state(item));
    if (req.method === 'GET' && parts[2] === 'events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
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
    const message = error instanceof Error ? error.message : 'Unknown relay error';
    const clientError = ['Invalid JSON', 'Request body too large', 'Each project needs an id and name'].includes(message);
    if (!clientError) console.error('Relay request failed:', message);
    return json(res, clientError ? 400 : 500, { error: clientError ? message : 'Internal relay error' });
  }
});

setInterval(() => {
  sessions.forEach(item => {
    if (Date.now() - item.lastActivity > SESSION_TTL) {
      item.clients.forEach(client => client.end());
      sessions.delete(item.token);
    }
  });
}, 1500);

if (!adminToken) console.warn('CIRCUX_ADMIN_TOKEN is not set; protected relay routes will reject requests.');
server.listen(port, process.env.CIRCUX_RELAY_HOST || '0.0.0.0', () => console.log(`Circux relay listening on port ${port}`));
