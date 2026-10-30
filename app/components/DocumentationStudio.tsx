'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Target } from 'lucide-react';
import type { Project } from '../../lib/project-data';
import { relayRequest } from '../../lib/relay';
import { downloadFile, loadLocal, saveLocal } from '../../lib/storage';
import FallbackControl from './FallbackControl';
import { supabaseConfigured } from '../../lib/supabase-browser';
import { supabase } from '../../lib/supabase-browser';
import { useCircuxAuth } from './AuthGate';

const sections = ['Abstract', 'Problem statement', 'Objectives', 'System architecture', 'Exhibition walkthrough', 'Testing evidence', 'Safety and limitations', 'Future improvements', 'Conclusion'];
export default function DocumentationStudio({ project, projects, setPage, onSelect }: { project: Project | null; projects: Project[]; setPage: (page: 'Showcase') => void; onSelect: (project: Project) => void }) {
  const [liveProject, setLiveProject] = useState(project || projects[0] || null);
  useEffect(() => { if (project) setLiveProject(project); else setLiveProject(current => current && projects.some(item => item.id === current.id) ? current : projects[0] || null); }, [project?.id, projects]);
  const active = liveProject;
  const key = `circux-report-${active?.id || ''}`;
  const [section, setSection] = useState(sections[0]);
  const [report, setReport] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState('');
  const { role, user } = useCircuxAuth();
  const canEdit = !supabaseConfigured || role === 'admin' || role === 'instructor';
  const text = report[section] || '';
  useEffect(() => setReport(active ? (supabaseConfigured ? (active.report || {}) : loadLocal(key, active.report || {})) : {}), [key, active?.id]);
  const update = (value: string) => { if (!active) return; const next = { ...report, [section]: value }; setReport(next); if (!supabaseConfigured) saveLocal(key, next); };
  const markdown = useMemo(() => `# ${active?.name || 'Project report'}\n\n${sections.map(name => `## ${name}\n\n${report[name] || ''}`).join('\n\n')}\n\n## Review note\n\nAll measurements, citations, wiring, and safety claims require human review.`, [active?.name, report]);
  const save = async () => {
    if (!active || !canEdit) return;
    const updated = { ...active, report }; setLiveProject(updated); onSelect(updated);
    if (supabaseConfigured && supabase) {
      if (!user) { setSaveStatus('Sign in to save this report.'); return; }
      setSaveStatus('Saving to cloud...');
      const { error } = await supabase.from('projects').upsert({ id: updated.id, name: updated.name, data: updated, is_public: !updated.hidden, updated_by: user.id }, { onConflict: 'id' });
      setSaveStatus(error ? `Cloud save failed: ${error.message}` : 'Saved to cloud.'); return;
    }
    saveLocal('circux-projects', projects.map(item => item.id === updated.id ? updated : item));
    setSaveStatus('Saved in this browser; syncing to local relay...');
    try { await relayRequest(`/projects/${encodeURIComponent(active.id)}`, { method: 'PUT', body: JSON.stringify(updated) }); setSaveStatus('Saved to the local relay.'); }
    catch { setSaveStatus('Saved in this browser; local relay is unavailable.'); }
  };
  if (!active) return <div className="empty"><h2>No project selected</h2><p>Select a project to edit its report.</p></div>;
  return <><div className="page-head"><div><div className="eyebrow">Editable project report</div><h1>Documentation studio</h1><p>{supabaseConfigured ? (canEdit ? 'Reports save to the shared workspace database.' : 'Judge access is read-only.') : 'Drafts save in this browser and sync to the relay backend when available.'}</p></div><div className="actions"><button className="btn" onClick={() => downloadFile(`${active.name.replaceAll(' ', '-')}.md`, markdown, 'text/markdown')}><Download size={14} /> Markdown</button><button className="btn" onClick={() => window.print()}><FileText size={14} /> Print / PDF</button><button className="btn primary" onClick={() => setPage('Showcase')}><Target size={14} /> Preview showcase</button></div></div><div className="field" style={{ maxWidth: 420, marginBottom: 16 }}><label htmlFor="report-project">Project report</label><select id="report-project" value={active.id} onChange={event => { const selected = projects.find(item => item.id === event.target.value); if (selected) { setLiveProject(selected); onSelect(selected); } }}>{projects.map(item => <option key={item.id} value={item.id}>{item.id} — {item.name}</option>)}</select></div>{project && canEdit && <FallbackControl project={active} onChange={setLiveProject} />}<div className="split"><section className="card report"><div className="eyebrow">{active.id} · {active.team}</div><h2>{active.name}</h2><h3>{section}</h3><textarea value={text} onChange={event => update(event.target.value)} readOnly={!canEdit} onBlur={() => void save()} style={{ width: '100%', minHeight: 220, border: '1px solid var(--line)', borderRadius: 7, padding: 14, lineHeight: 1.6 }} /><div className="callout">Drafts never invent measurements or validation results.</div></section><section className="card"><div className="card-head"><h3>Report sections</h3><span className="badge green">{saveStatus || 'Draft'}</span></div><div className="side-list">{sections.map(name => <button key={name} className={name === section ? 'active' : ''} onClick={() => setSection(name)}>{name}</button>)}</div></section></div></>;
}
