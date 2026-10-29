'use client';

import { useState } from 'react';
import type { Project } from '../../lib/project-data';

const api = () => `${window.location.protocol}//${window.location.hostname}:8000`;

export default function FallbackControl({ project, onChange }: { project: Project; onChange: (project: Project) => void }) {
  const [reason, setReason] = useState('Hardware unavailable — display saved project values.');
  const [message, setMessage] = useState('');
  const run = async (restore: boolean) => { const token = localStorage.getItem('circux-admin-token') || ''; const response = await fetch(`${api()}/api/projects/${encodeURIComponent(project.id)}/fallback${restore ? '/restore' : ''}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: restore ? undefined : JSON.stringify({ reason, mode: 'saved-project' }) }); if (!response.ok) { setMessage('FastAPI unavailable or admin token invalid.'); return; } const fallback = await response.json(); onChange({ ...project, fallback }); setMessage(restore ? 'Saved project view restored.' : 'Saved project content is being displayed.'); };
  return <section className="card"><div className="card-head"><h3>Emergency display fallback</h3><span className={`badge ${project.fallback?.active ? 'amber' : 'green'}`}>{project.fallback?.active ? 'Active' : 'Ready'}</span></div><p className="muted">Displays saved project values without claiming they are live telemetry or sending hardware commands.</p><input value={reason} onChange={event => setReason(event.target.value)} aria-label="Fallback reason" /><div className="actions"><button className="btn" onClick={() => run(false)}>Activate display-only</button>{project.fallback?.active && <button className="btn" onClick={() => run(true)}>Restore saved view</button>}</div>{message && <small className="muted">{message}</small>}</section>;
}
