'use client';

import { useEffect, useState } from 'react';
import { Activity, RefreshCw, ShieldCheck } from 'lucide-react';

type Board = { id: string; name: string; status?: string; last_seen?: number; project_id?: string; last_readings?: unknown[] };
const api = () => `${window.location.protocol}//${window.location.hostname}:8000`;

export default function BoardHealthPanel() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const load = () => { const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}; fetch(`${api()}/api/boards`, { headers }).then(response => response.ok ? response.json() : Promise.reject(new Error('Admin token required or FastAPI is offline.'))).then(setBoards).catch(error => setMessage(error.message)); };
  useEffect(() => { setToken(localStorage.getItem('circux-admin-token') || ''); fetch(`${api()}/api/health`).then(response => response.json()).then(data => setMessage(data.ok ? 'FastAPI connected.' : 'FastAPI is unavailable.')).catch(() => setMessage('FastAPI is offline.')); }, []);
  return <><div className="page-head"><div><div className="eyebrow">Hardware operations</div><h1>Board health</h1><p>Monitor sensor boards in read-only mode before enabling any physical outputs.</p></div><button className="btn" onClick={load}><RefreshCw size={14} /> Refresh</button></div><section className="card"><div className="field"><label>Admin API token</label><input value={token} onChange={event => { setToken(event.target.value); localStorage.setItem('circux-admin-token', event.target.value); }} placeholder="CIRCUX_ADMIN_TOKEN" /></div><div className="callout"><ShieldCheck size={14} /> {message || 'Enter the admin token to load registered boards.'}</div></section><div className="grid three" style={{ marginTop: 16 }}>{boards.map(board => <section className="card" key={board.id}><div className="card-head"><h3>{board.name}</h3><span className={`badge ${board.status === 'healthy' ? 'green' : 'amber'}`}>{board.status || 'Unknown'}</span></div><div className="kpi"><span>Board ID</span><strong>{board.id}</strong></div><div className="kpi"><span>Project</span><strong>{board.project_id || 'Unassigned'}</strong></div><div className="kpi"><span>Last heartbeat</span><strong>{board.last_seen ? new Date(board.last_seen * 1000).toLocaleTimeString() : 'Never'}</strong></div><div className="muted"><Activity size={13} /> Sensor-only monitoring is active.</div></section>)}</div>{!boards.length && <div className="empty"><Activity size={30} /><h3>No registered boards</h3><p>Register a board through the FastAPI backend before connecting hardware.</p></div>}</>;
}
