'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Target } from 'lucide-react';
import type { Project } from '../../lib/project-data';
import { relayRequest } from '../../lib/relay';
import { downloadFile, loadLocal, saveLocal } from '../../lib/storage';
import FallbackControl from './FallbackControl';

const sections = ['Abstract', 'Problem statement', 'Objectives', 'System architecture', 'Exhibition walkthrough', 'Testing evidence', 'Safety and limitations', 'Future improvements', 'Conclusion'];
export default function DocumentationStudio({ project, setPage }: { project: Project | null; setPage: (page: 'Showcase') => void }) {
  const [liveProject, setLiveProject] = useState(project);
  useEffect(() => setLiveProject(project), [project]);
  const active = liveProject || { id: 'CX-104', name: 'Aqua Smart Irrigation', team: 'Eco club' } as Project;
  const key = `circux-report-${active.id}`;
  const [section, setSection] = useState(sections[0]);
  const [report, setReport] = useState<Record<string, string>>({});
  const text = report[section] || `Add the reviewed ${section.toLowerCase()} for this project.`;
  useEffect(() => setReport(loadLocal(key, active.report || {})), [key]);
  const update = (value: string) => { const next = { ...report, [section]: value }; setReport(next); saveLocal(key, next); };
  const markdown = useMemo(() => `# ${active.name}\n\n${sections.map(name => `## ${name}\n\n${report[name] || ''}`).join('\n\n')}\n\n## Review note\n\nAll measurements, citations, wiring, and safety claims require human review.`, [active.name, report]);
  const save = () => relayRequest(`/projects/${encodeURIComponent(active.id)}`, { method: 'PUT', body: JSON.stringify({ ...active, report }) }).catch(() => undefined);
  return <><div className="page-head"><div><div className="eyebrow">Editable project report</div><h1>Documentation studio</h1><p>Drafts save in this browser and sync to the relay backend when available.</p></div><div className="actions"><button className="btn" onClick={() => downloadFile(`${active.name.replaceAll(' ', '-')}.md`, markdown, 'text/markdown')}><Download size={14} /> Markdown</button><button className="btn" onClick={() => window.print()}><FileText size={14} /> Print / PDF</button><button className="btn primary" onClick={() => setPage('Showcase')}><Target size={14} /> Preview showcase</button></div></div>{project && <FallbackControl project={active} onChange={setLiveProject} />}<div className="split"><section className="card report"><div className="eyebrow">{active.id} · {active.team}</div><h2>{active.name}</h2><h3>{section}</h3><textarea value={text} onChange={event => update(event.target.value)} onBlur={save} style={{ width: '100%', minHeight: 220, border: '1px solid var(--line)', borderRadius: 7, padding: 14, lineHeight: 1.6 }} /><div className="callout">Drafts never invent measurements or validation results.</div></section><section className="card"><div className="card-head"><h3>Report sections</h3><span className="badge green">Saved</span></div><div className="side-list">{sections.map(name => <button key={name} className={name === section ? 'active' : ''} onClick={() => setSection(name)}>{name}</button>)}</div></section></div></>;
}
