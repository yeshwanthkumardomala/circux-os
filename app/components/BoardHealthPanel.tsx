'use client';

import { useEffect, useState } from 'react';
import { Activity, RefreshCw, ShieldCheck, Upload, Wrench } from 'lucide-react';

type Board = { id: string; name: string; status?: string; last_seen?: number; project_id?: string; last_readings?: unknown[] };
type Port = { address: string; label: string; boards: { fqbn?: string; name?: string }[] };
type ArduinoState = { ok: boolean; configured: boolean; version?: string; ports: Port[]; error?: string };
const agentUrl = () => typeof window === 'undefined' ? 'http://localhost:8000' : localStorage.getItem('circux-hardware-agent-url') || 'http://localhost:8000';

export default function BoardHealthPanel() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [token, setToken] = useState('');
  const [url, setUrl] = useState('http://localhost:8000');
  const [arduino, setArduino] = useState<ArduinoState | null>(null);
  const [sketch, setSketch] = useState('');
  const [fqbn, setFqbn] = useState('');
  const [port, setPort] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const base = () => url.replace(/\/$/, '');
  const headers = (): HeadersInit => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
  const load = async () => {
    try { const response = await fetch(`${base()}/api/boards`, { headers: headers() }); if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || 'Admin token required or hardware agent offline.'); setBoards(await response.json()); setMessage('Board registry refreshed.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load boards.'); }
  };
  const checkArduino = async () => {
    try { const response = await fetch(`${base()}/api/hardware/health`, { headers: headers() }); const state = await response.json() as ArduinoState; setArduino(state); setPort(current => current || state.ports[0]?.address || ''); setMessage(state.ok ? `Arduino CLI ready; ${state.ports.length} port(s) detected.` : state.error || 'Arduino CLI is not ready.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Hardware agent is unavailable.'); }
  };
  const run = async (action: 'compile' | 'upload') => {
    if (!sketch.trim() || !fqbn.trim()) { setMessage('Enter the sketch folder and Arduino FQBN.'); return; }
    if (action === 'upload' && !window.confirm(`Upload firmware to ${port}? The board will restart.`)) return;
    setBusy(true); setMessage(`${action === 'compile' ? 'Compiling' : 'Uploading'}…`);
    try { const response = await fetch(`${base()}/api/hardware/${action}`, { method: 'POST', headers: headers(), body: JSON.stringify({ sketch: sketch.trim(), fqbn: fqbn.trim(), ...(action === 'upload' ? { port } : {}) }) }); const result = await response.json(); if (!response.ok) throw new Error(result.detail || `${action} failed.`); setMessage(`${action === 'compile' ? 'Compile succeeded' : `Upload succeeded on ${port}`}. ${result.output || ''}`); }
    catch (error) { setMessage(error instanceof Error ? error.message : `${action} failed.`); }
    finally { setBusy(false); }
  };
  useEffect(() => { const savedUrl = agentUrl(); setUrl(savedUrl); setToken(localStorage.getItem('circux-admin-token') || ''); fetch(`${savedUrl.replace(/\/$/, '')}/api/health`).then(response => response.json()).then(data => setMessage(data.ok ? 'Local FastAPI reachable.' : 'Local FastAPI unavailable.')).catch(() => setMessage('Local hardware agent is offline.')); }, []);
  return <><div className="page-head"><div><div className="eyebrow">Hardware operations</div><h1>Board health</h1><p>Check verified local board and Arduino CLI status before firmware operations.</p></div><button className="btn" onClick={() => void load()}><RefreshCw size={14} /> Refresh boards</button></div>
    <section className="card"><div className="form-grid"><label className="field">Local hardware agent URL<input value={url} onChange={event => { setUrl(event.target.value); localStorage.setItem('circux-hardware-agent-url', event.target.value); }} placeholder="http://localhost:8000" /></label><label className="field">Local admin token<input type="password" value={token} onChange={event => { setToken(event.target.value); localStorage.setItem('circux-admin-token', event.target.value); }} placeholder="CIRCUX_ADMIN_TOKEN" /></label></div><div className="callout"><ShieldCheck size={14} /> {message || 'Configure the local agent URL. Hosted pages need their origin allowed in CIRCUX_ALLOWED_ORIGIN.'}</div><button className="btn" onClick={() => void checkArduino()}><Wrench size={14} /> Check Arduino CLI and ports</button></section>
    <section className="card" style={{ marginTop: 16 }}><div className="card-head"><h2>Arduino CLI</h2><span className={`badge ${arduino?.ok ? 'green' : 'amber'}`}>{arduino?.ok ? 'Connected' : arduino?.configured ? 'Error' : 'Not configured'}</span></div>{arduino?.version && <p className="muted">{arduino.version}</p>}{arduino?.error && <p role="alert">{arduino.error}</p>}<div className="form-grid"><label className="field">Sketch folder inside configured sketches directory<input value={sketch} onChange={event => setSketch(event.target.value)} placeholder="sensor-node" /></label><label className="field">Arduino FQBN<input value={fqbn} onChange={event => setFqbn(event.target.value)} placeholder="arduino:avr:uno" /></label>{arduino?.ports.length ? <label className="field">Detected serial port<select value={port} onChange={event => setPort(event.target.value)}>{arduino.ports.map(item => <option key={item.address} value={item.address}>{item.label} {item.boards.map(board => board.name).filter(Boolean).join(', ')}</option>)}</select></label> : <p className="muted">No serial board detected. Connect it and check again.</p>}</div><div className="actions"><button className="btn" disabled={busy || !arduino?.ok} onClick={() => void run('compile')}><Wrench size={14} /> Compile firmware</button><button className="btn primary" disabled={busy || !arduino?.ok || !port} onClick={() => void run('upload')}><Upload size={14} /> Upload to board</button></div><p className="callout">Uploading firmware restarts the board. Use a reviewed sensor-only sketch and test with actuators disconnected.</p></section>
    <div className="grid three" style={{ marginTop: 16 }}>{boards.map(board => <section className="card" key={board.id}><div className="card-head"><h3>{board.name}</h3><span className={`badge ${board.status === 'healthy' ? 'green' : 'amber'}`}>{board.status || 'Unknown'}</span></div><div className="kpi"><span>Board ID</span><strong>{board.id}</strong></div><div className="kpi"><span>Project</span><strong>{board.project_id || 'Unassigned'}</strong></div><div className="kpi"><span>Last heartbeat</span><strong>{board.last_seen ? new Date(board.last_seen * 1000).toLocaleTimeString() : 'Never'}</strong></div><div className="muted"><Activity size={13} /> Status comes from the FastAPI heartbeat.</div></section>)}</div>{!boards.length && <div className="empty"><Activity size={30} /><h3>No registered boards</h3><p>Register a board through the local FastAPI backend before connecting hardware.</p></div>}</>;
}
