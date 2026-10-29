'use client';

import { Activity, ShieldAlert } from 'lucide-react';
import type { DashboardMetric, Project } from '../../lib/project-data';

export default function ProjectDashboard({ project, dark = false }: { project: Project; dark?: boolean }) {
  const readings = project.details?.readings || [];
  const metrics: DashboardMetric[] = project.dashboard?.metrics || readings.map(reading => ({ label: reading.label, source: reading.note }));
  const fallback = project.fallback?.active;
  return <section className={dark ? 'display-panel' : 'public-card'}><div className="card-head"><h2><Activity size={dark ? 22 : 17} /> {project.dashboard?.title || 'Saved project readings'}</h2><span className={`badge ${fallback ? 'amber' : 'blue'}`}>{fallback ? 'SAVED DATA FALLBACK' : 'SAVED PROJECT DATA'}</span></div>{fallback && <div className="display-alert"><ShieldAlert size={14} /> {project.fallback?.reason || 'Showing saved project content; this is not live telemetry.'}</div>}<div className={dark ? 'display-live-grid' : ''}>{metrics.map((metric, index) => { const reading = readings[index]; return <div className={dark ? 'display-reading' : 'reading'} key={metric.label}><div><strong>{metric.label}</strong><small>{metric.source || reading?.note || 'Saved project record; not verified telemetry'}</small></div><b style={metric.color ? { color: metric.color } : undefined}>{reading?.value || '—'}{metric.unit || ''}</b></div>; })}</div>{!metrics.length && <p className="muted">No sensor metrics configured yet.</p>}</section>;
}
