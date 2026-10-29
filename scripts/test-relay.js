const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const port = 3012;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'circux-relay-test-'));
const relay = spawn(process.execPath, ['relay-server.js'], { env: { ...process.env, CIRCUX_RELAY_PORT: String(port), CIRCUX_DATA_DIR: dataDir, CIRCUX_ADMIN_TOKEN: 'test-admin-token', CIRCUX_DEVICE_KEY: 'test-device-key', CIRCUX_ENABLE_HARDWARE_COMMANDS: 'false' }, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}`;

async function request(path, init) {
  const response = await fetch(base + path, init);
  const body = await response.json();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${JSON.stringify(body)}`);
  return body;
}

async function waitForRelay() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try { return await request('/health'); } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  throw new Error('Relay did not start');
}

(async () => {
  try {
    await waitForRelay();
    const cors = await fetch(base + '/health', { headers: { Origin: 'http://evil.example:3000' } });
    if (cors.headers.get('access-control-allow-origin')) throw new Error('Untrusted CORS origin was allowed');
    const unauthenticatedWrite = await fetch(base + '/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projects: [] }) });
    if (unauthenticatedWrite.status !== 401) throw new Error('Unauthenticated project write was accepted');
    const adminHeaders = { 'Content-Type': 'application/json', Authorization: 'Bearer test-admin-token' };
    const project = { id: 'TEST-1', name: 'Relay test project', team: 'Test team', category: 'Test', status: 'Ready', progress: 100, summary: 'Test project' };
    await request('/projects', { method: 'PUT', headers: adminHeaders, body: JSON.stringify({ projects: [project] }) });
    for (const path of ['/config', '/judging', '/uploads', '/device/readings']) {
      const denied = await fetch(base + path);
      if (denied.status !== 401) throw new Error(`Protected endpoint ${path} returned ${denied.status} without admin auth`);
    }
    const uploadDenied = await fetch(base + '/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'test.txt', data: 'dGVzdA==' }) });
    if (uploadDenied.status !== 401) throw new Error('Unauthenticated upload was accepted');
    const configDenied = await fetch(base + '/config');
    if (configDenied.status !== 401) throw new Error('Config read was not protected');
    const config = await request('/config', { headers: { Authorization: 'Bearer test-admin-token' } });
    if (!config.slotA) throw new Error('Authorized config read failed');
    const uploaded = await request('/uploads', { method: 'POST', headers: adminHeaders, body: JSON.stringify({ name: 'test.txt', type: 'text/plain', data: 'dGVzdA==' }) });
    const download = await fetch(base + `/uploads/file/${uploaded.id}`, { headers: { Authorization: 'Bearer test-admin-token' } });
    if (!download.ok || await download.text() !== 'test') throw new Error('Authenticated upload download failed');
    const deleteDenied = await fetch(base + `/uploads/${uploaded.id}`, { method: 'DELETE' });
    if (deleteDenied.status !== 401) throw new Error('Unauthenticated upload delete was accepted');
    await request(`/uploads/${uploaded.id}`, { method: 'DELETE', headers: { Authorization: 'Bearer test-admin-token' } });
    const stored = await request('/projects/TEST-1');
    if (stored.name !== project.name) throw new Error('Project sync failed');
    const session = await request('/session', { method: 'POST' });
    await request(`/session/${session.token}/slot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slot: 'A', projectId: 'TEST-1' }) });
    const state = await request(`/session/${session.token}/state`);
    if (state.slots.A !== 'TEST-1') throw new Error('Slot update failed');
    const hardware = await request('/device/health');
    if (hardware.configured !== false || hardware.mode !== 'simulation') throw new Error('Hardware fallback failed');
    const unauthorized = await fetch(base + '/device/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'wake' }) });
    if (unauthorized.status !== 401) throw new Error('Hardware command was not protected');
    const deviceOnly = await fetch(base + '/device/command', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Circux-Device-Key': 'test-device-key' }, body: JSON.stringify({ action: 'wake' }) });
    if (deviceOnly.status !== 401) throw new Error('Hardware command did not require admin authentication');
    const hardwareDisabled = await fetch(base + '/device/command', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-admin-token', 'X-Circux-Device-Key': 'test-device-key' }, body: JSON.stringify({ action: 'wake' }) });
    if (hardwareDisabled.status !== 403) throw new Error('Hardware command was not disabled by default');
    const judgingDenied = await fetch(base + '/judging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: 'TEST-1', scores: [] }) });
    if (judgingDenied.status !== 401) throw new Error('Unauthenticated judging write was accepted');
    console.log('Relay smoke test passed');
  } finally {
    relay.kill();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
