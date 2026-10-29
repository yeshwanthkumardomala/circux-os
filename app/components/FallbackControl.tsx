'use client';

import { useState } from 'react';
import type { Project } from '../../lib/project-data';

const api = () => `${window.location.protocol}//${window.location.hostname}:8000`;

export default function FallbackControl({ project, onChange }: { project: Project; onChange: (project: Project) => void }) {
  const [reason, setReason] = useState('Hardware unavailable — display last trusted readings.');
  const [message, setMessage] = useState('');
  const run = async (restore: boolean) => { const token = localStorage.getItem('circux-admin-token') || ''; const response = await fetch(`${api()}/api/projects/${encodeURIComponent(project.id)}/fallback${restore ? '/restore' : ''}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: restore ? undefined : JSON.stringify({ reason, mode: 'last-trusted' }) }); if (!response.ok) { setMessage('FastAPI unavailable or admin token invalid.'); return; } const fallback = await response.json(); onChange({ ...project, fallback }); setMessage(restore ? 'Live mode restored.' : 'Display-only fallback is active.'); };
  return <section className="card"><div className="card-head"><h3>Emergency display fallback</h3><span className={`badge ${project.fallback?.active ? 'amber' : 'green'}`}>{project.fallback?.active ? 'Active' : 'Ready'}</span></div><p className="muted">Shows trusted readings without sending commands to hardware.</p><input value={reason} onChange={event => setReason(event.target.value)} aria-label="Fallback reason" /><div className="actions"><button className="btn" onClick={() => run(false)}>Activate display-only</button>{project.fallback?.active && <button className="btn" onClick={() => run(true)}>Restore live</button>}</div>{message && <small className="muted">{message}</small>}</section>;
}
