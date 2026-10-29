'use client';

import { Activity, ShieldAlert } from 'lucide-react';
import type { DashboardMetric, Project } from '../../lib/project-data';

export default function ProjectDashboard({ project, dark = false }: { project: Project; dark?: boolean }) {
  const readings = project.details?.readings || [];
  const metrics: DashboardMetric[] = project.dashboard?.metrics || readings.map(reading => ({ label: reading.label, source: reading.note }));
  const fallback = project.fallback?.active;
  return <section className={dark ? 'display-panel' : 'public-card'}><div className="card-head"><h2><Activity size={dark ? 22 : 17} /> {project.dashboard?.title || 'Live readings'}</h2><span className={`badge ${fallback ? 'amber' : project.dataMode === 'live' ? 'green' : 'blue'}`}>{fallback ? 'FALLBACK' : project.dataMode === 'live' ? 'LIVE DATA' : 'PRESENTATION FEED'}</span></div>{fallback && <div className="display-alert"><ShieldAlert size={14} /> {project.fallback?.reason || 'Showing the last trusted project state.'}</div>}<div className={dark ? 'display-live-grid' : ''}>{metrics.map((metric, index) => { const reading = readings[index]; return <div className={dark ? 'display-reading' : 'reading'} key={metric.label}><div><strong>{metric.label}</strong><small>{metric.source || reading?.note || 'Configured project sensor'}</small></div><b style={metric.color ? { color: metric.color } : undefined}>{reading?.value || '—'}{metric.unit || ''}</b></div>; })}</div>{!metrics.length && <p className="muted">No sensor metrics configured yet.</p>}</section>;
}
