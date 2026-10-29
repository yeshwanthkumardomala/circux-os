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
    const sameHostCors = await fetch(base + '/health', { headers: { Origin: 'http://127.0.0.1:3000' } });
    if (sameHostCors.headers.get('access-control-allow-origin') !== 'http://127.0.0.1:3000') throw new Error('Same-host exhibition CORS origin was rejected');
    const unauthenticatedWrite = await fetch(base + '/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projects: [] }) });
    if (unauthenticatedWrite.status !== 401) throw new Error('Unauthenticated project write was accepted');
    const adminHeaders = { 'Content-Type': 'application/json', Authorization: 'Bearer test-admin-token' };
    const projectListDenied = await fetch(base + '/projects');
    if (projectListDenied.status !== 401) throw new Error('Unauthenticated project list was readable');
    const project = { id: 'TEST-1', name: 'Relay test project', team: 'Test team', category: 'Test', status: 'Ready', progress: 100, summary: 'Test project' };
    await request('/projects', { method: 'PUT', headers: adminHeaders, body: JSON.stringify({ projects: [project] }) });
    await request('/projects/TEST-1', { method: 'PUT', headers: adminHeaders, body: JSON.stringify({ ...project, hidden: true }) });
    const hiddenPublic = await fetch(base + '/projects/TEST-1');
    if (hiddenPublic.status !== 404) throw new Error('Hidden project was exposed publicly');
    if (!(await hiddenPublic.json()).hidden) throw new Error('Hidden project response did not identify its visibility state');
    if (!(await request('/projects/TEST-1', { headers: { Authorization: 'Bearer test-admin-token' } })).hidden) throw new Error('Admin could not retrieve a hidden project');
    await request('/projects/TEST-1', { method: 'PUT', headers: adminHeaders, body: JSON.stringify(project) });
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
    const uploaded = await request('/uploads', { method: 'POST', headers: adminHeaders, body: JSON.stringify({ name: 'test.txt', type: 'text/plain', data: 'dGVzdA==', projectId: 'TEST-1' }) });
    if (uploaded.projectId !== 'TEST-1' || !fs.existsSync(path.join(dataDir, 'uploads', 'TEST-1', uploaded.id))) throw new Error('Upload was not stored in its project folder');
    const download = await fetch(base + `/uploads/file/${uploaded.id}`, { headers: { Authorization: 'Bearer test-admin-token' } });
    if (!download.ok || await download.text() !== 'test') throw new Error('Authenticated upload download failed');
    const deleteDenied = await fetch(base + `/uploads/${uploaded.id}`, { method: 'DELETE' });
    if (deleteDenied.status !== 401) throw new Error('Unauthenticated upload delete was accepted');
    const stored = await request('/projects/TEST-1');
    if (stored.name !== project.name) throw new Error('Project sync failed');
    const projectList = await request('/projects', { headers: { Authorization: 'Bearer test-admin-token' } });
    if (!projectList.some(item => item.id === project.id)) throw new Error('Project list failed');
    const session = await request('/session', { method: 'POST' });
    await request(`/session/${session.token}/slot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slot: 'A', projectId: 'TEST-1' }) });
    const state = await request(`/session/${session.token}/state`);
    if (state.slots.A !== 'TEST-1') throw new Error('Slot update failed');
    const events = await fetch(`${base}/session/${session.token}/events`);
    const reader = events.body.getReader();
    await reader.read();
    const fakeFeed = await Promise.race([reader.read().then(() => true), new Promise(resolve => setTimeout(() => resolve(false), 1800))]);
    await reader.cancel();
    if (fakeFeed) throw new Error('Relay emitted unverified sensor data');
    const hardware = await request('/device/health');
    if (hardware.configured !== false || hardware.mode !== 'not-configured') throw new Error('Hardware status is not truthful');
    const unauthorized = await fetch(base + '/device/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'wake' }) });
    if (unauthorized.status !== 401) throw new Error('Hardware command was not protected');
    const deviceOnly = await fetch(base + '/device/command', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Circux-Device-Key': 'test-device-key' }, body: JSON.stringify({ action: 'wake' }) });
    if (deviceOnly.status !== 401) throw new Error('Hardware command did not require admin authentication');
    const hardwareDisabled = await fetch(base + '/device/command', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-admin-token', 'X-Circux-Device-Key': 'test-device-key' }, body: JSON.stringify({ action: 'wake' }) });
    if (hardwareDisabled.status !== 403) throw new Error('Hardware command was not disabled by default');
    const judgingDenied = await fetch(base + '/judging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: 'TEST-1', scores: [] }) });
    if (judgingDenied.status !== 401) throw new Error('Unauthenticated judging write was accepted');
    await request('/projects', { method: 'PUT', headers: adminHeaders, body: JSON.stringify({ projects: [] }) });
    const unassigned = (await request('/uploads', { headers: { Authorization: 'Bearer test-admin-token' } })).find(item => item.id === uploaded.id);
    if (!unassigned || unassigned.projectId !== null || !fs.existsSync(path.join(dataDir, 'uploads', '_unassigned', uploaded.id))) throw new Error('Project deletion did not retain and unassign its uploaded file');
    const retainedDownload = await fetch(base + `/uploads/file/${uploaded.id}`, { headers: { Authorization: 'Bearer test-admin-token' } });
    if (!retainedDownload.ok || await retainedDownload.text() !== 'test') throw new Error('Unassigned upload could not be downloaded after project deletion');
    await request(`/uploads/${uploaded.id}`, { method: 'DELETE', headers: adminHeaders });
    console.log('Relay smoke test passed');
  } finally {
    relay.kill();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
