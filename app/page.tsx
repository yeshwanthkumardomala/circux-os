'use client';

import { useEffect, useState } from 'react';
import { Activity, ArrowRight, BookOpen, Check, ChevronRight, Download, EyeOff, FileText, FolderOpen, LayoutDashboard, Moon, Play, Plus, Settings, Sparkles, Sun, Target, Trophy, Upload, X, Zap } from 'lucide-react';
import { downloadFile, loadLocal, saveLocal } from '../lib/storage';
import { defaultProjects, type Project } from '../lib/project-data';
import { relayRequest, syncRelay } from '../lib/relay';
import QrCard from './components/QrCard';
import WorkspaceSettings, { defaultConfig, type WorkspaceConfig } from './components/WorkspaceSettings';
import ProjectsPanel from './components/ProjectsPanel';
import DocumentationStudio from './components/DocumentationStudio';
import JudgingPanel from './components/JudgingPanel';
import UploadsPanel from './components/UploadsPanel';
import BoardHealthPanel from './components/BoardHealthPanel';
import OperationalStatus from './components/OperationalStatus';
import GlobalProjectSearch from './components/GlobalProjectSearch';
import AppearanceSettings from './components/AppearanceSettings';
import AdminAccessInfo from './components/AdminAccessInfo';

type Page = 'Overview' | 'Projects' | 'Project Builder' | 'Documentation Studio' | 'Showcase' | 'Uploads' | 'Judging' | 'Live Monitor' | 'Power Manager' | 'Settings' | 'Board Health';
const nav: { label: Page; icon: typeof LayoutDashboard }[] = [['Overview', LayoutDashboard], ['Projects', FolderOpen], ['Project Builder', Sparkles], ['Documentation Studio', BookOpen], ['Showcase', Target], ['Uploads', Upload], ['Judging', Trophy], ['Live Monitor', Activity], ['Power Manager', Zap], ['Board Health', Activity], ['Settings', Settings]].map(([label, icon]) => ({ label: label as Page, icon: icon as typeof LayoutDashboard }));

function Btn({ children, primary = false, onClick, type = 'button' }: { children: React.ReactNode; primary?: boolean; onClick?: () => void; type?: 'button' | 'submit' }) { return <button type={type} onClick={onClick} className={'btn ' + (primary ? 'primary' : '')}>{children}</button>; }
function Badge({ children, type = 'blue' }: { children: React.ReactNode; type?: 'green' | 'amber' | 'blue' | 'gray' }) { return <span className={'badge ' + type}>{children}</span>; }
function Header({ page, admin, config, projects, openResult }: { page: Page; admin: string; config: WorkspaceConfig; projects: Project[]; openResult: (project: Project) => void }) { return <header className="topbar"><div className="crumb">{config.organization} / <strong>{page}</strong></div><GlobalProjectSearch projects={projects} onSelect={openResult} /><div className="top-actions"><span className="status"><span className="dot" /><span><strong>{config.eventName}</strong><small className="event-context">{config.venue} · {config.eventDate}</small></span></span><div className="avatar">{admin.slice(0, 2).toUpperCase()}</div></div></header>; }
function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) { return <aside className="sidebar"><div className="brand"><div className="logo">C</div><div><strong>Circux</strong><small>SHOWCASE OS</small></div></div><div className="nav-label">Workspace</div>{nav.map(({ label, icon: Icon }) => <button key={label} className={'nav-item ' + (page === label ? 'active' : '')} onClick={() => setPage(label)}><Icon size={16} /><span>{label}</span></button>)}<div className="sidebar-foot"><div className="demo-pill"><span className="dot" /> FUNCTIONAL MODE</div><div>Projects, reports, and scores use local storage and relay sync when available; hardware is not configured.</div></div></aside>; }
function PageHead({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children?: React.ReactNode }) { return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div><div className="actions">{children}</div></div>; }
function Overview({ projects, setPage, open }: { projects: Project[]; setPage: (p: Page) => void; open: (p: Project) => void }) {
  const [judgingCount, setJudgingCount] = useState(0);
  const [hardwareStatus, setHardwareStatus] = useState('Checking');
  const reportsSaved = projects.filter(project => Object.values(project.report || {}).some(section => section.trim())).length;
  useEffect(() => { relayRequest<Array<unknown>>('/judging').then(records => setJudgingCount(records.length)).catch(() => setJudgingCount(loadLocal('circux-judging', []).length)); relayRequest<{ configured: boolean; connected: boolean }>('/device/health').then(status => setHardwareStatus(status.connected ? 'Connected' : status.configured ? 'Disconnected' : 'Not configured')).catch(() => setHardwareStatus('Unavailable')); }, []);
  return <>
    <PageHead eyebrow="Workspace overview" title="Good morning, Yeshwanth." text="Manage saved projects, reports, uploads, judging, and exhibition status."><Btn onClick={() => setPage('Uploads')}><Upload size={14} /> Upload files</Btn><Btn primary onClick={() => setPage('Project Builder')}><Plus size={14} /> New project</Btn></PageHead>
    <div className="grid stats">
      <div className="card stat"><div className="stat-label">Project records</div><div className="stat-value">{projects.length}</div><div className="trend">Saved in this workspace</div></div>
      <div className="card stat"><div className="stat-label">Saved reports</div><div className="stat-value">{reportsSaved}</div><div className="trend">Projects with report content</div></div>
      <div className="card stat"><div className="stat-label">Hardware</div><div className="stat-value">{hardwareStatus}</div><div className="trend">Verified adapter status</div></div>
      <div className="card stat"><div className="stat-label">Judging records</div><div className="stat-value">{judgingCount}</div><div className="trend">Saved evaluations</div></div>
    </div>
    <div className="grid two"><div className="card"><div className="card-head"><h3>Project workspace</h3><button className="text-button" onClick={() => setPage('Projects')}>View all <ChevronRight size={13} /></button></div>
      {projects.slice(0, 4).map(project => <div className="project-row" key={project.id}><div className="project-icon"><Target size={16} /></div><div style={{ flex: 1 }}><div className="project-name">{project.name}</div><div className="project-meta">{project.team} ? {project.status}</div><div className="progress"><i style={{ width: project.progress + '%' }} /></div></div><button className="icon-btn" onClick={() => open(project)} aria-label={'Open ' + project.name}><ChevronRight size={15} /></button></div>)}
    </div><div className="card"><div className="card-head"><h3>Operational status</h3><Badge type="amber">HARDWARE NOT CONFIGURED</Badge></div><div className="power-state"><div className="power-orb"><Activity size={17} /></div><div><strong style={{ fontSize: 12 }}>Workspace features are available</strong><div className="muted">Projects, documentation, and judging use saved workspace data.</div></div></div><div className="kpi"><span>Project files</span><button className="text-button" onClick={() => setPage('Uploads')}>Open uploads</button></div><div className="kpi"><span>Display and relay health</span><strong>Check monitor</strong></div><div className="actions" style={{ marginTop: 17, flexWrap: 'wrap' }}><Btn onClick={() => setPage('Showcase')}><Play size={13} /> Open showcase</Btn><Btn onClick={() => setPage('Judging')}><Trophy size={13} /> Judging sheets</Btn></div></div></div>
  </>;
}
function Builder({ save }: { save: (p: Project) => void }) { const [name, setName] = useState(''); const [team, setTeam] = useState(''); const [summary, setSummary] = useState(''); const submit = (e: React.FormEvent) => { e.preventDefault(); if (!name.trim() || !team.trim()) return; save({ id: `CX-${Date.now().toString().slice(-4)}`, name: name.trim(), team: team.trim(), summary: summary.trim() || 'New showcase project awaiting a reviewed description.', category: 'STEM project', status: 'Draft', progress: 8 }); setName(''); setTeam(''); setSummary(''); }; return <><PageHead eyebrow="Guided project setup" title="Project builder" text="Create a project card that can become a report, showcase page, and judging entry."><Badge type="amber">Local draft</Badge></PageHead><div className="split"><form className="card" onSubmit={submit}><div className="card-head"><h3>Project identity</h3><Badge type="blue">Required fields</Badge></div><div className="form-grid"><div className="field full"><label>Project title</label><input required value={name} onChange={e => setName(e.target.value)} placeholder="Example: Autonomous Rover" /></div><div className="field"><label>Team or institution</label><input required value={team} onChange={e => setTeam(e.target.value)} placeholder="Team name" /></div><div className="field"><label>Purpose</label><select><option>Exhibition</option><option>Competition</option><option>Learning</option><option>Research</option></select></div><div className="field full"><label>Showcase description</label><textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="What should a visitor understand in 30 seconds?" /></div></div><div className="callout">This workspace stores presentation data. Technical claims, measurements, and safety statements still need human review.</div><div className="builder-footer"><span className="muted">Saved to this browser</span><Btn primary type="submit"><Check size={14} /> Create project</Btn></div></form><div className="card"><div className="card-head"><h3>What happens next</h3></div>{[['1','Build the story','Add the problem, outcome, images, and team details.'],['2','Write the report','Turn the project record into an editable submission.'],['3','Prepare the room','Open showcase mode with demo controls and QR access.'],['4','Collect scores','Use the sample judging sheet and export results.']].map(x => <div className="project-row" key={x[0]}><div className="step-num">{x[0]}</div><div><strong style={{ fontSize: 12 }}>{x[1]}</strong><div className="project-meta">{x[2]}</div></div></div>)}</div></div></>; }
function Uploads() { const [files, setFiles] = useState<string[]>([]); useEffect(() => setFiles(loadLocal('circux-upload-names', [])), []); const add = (e: React.ChangeEvent<HTMLInputElement>) => { const names = Array.from(e.target.files || []).map(f => f.name); const next = [...new Set([...files, ...names])]; setFiles(next); saveLocal('circux-upload-names', next); }; const remove = (name: string) => { const next = files.filter(f => f !== name); setFiles(next); saveLocal('circux-upload-names', next); }; return <><PageHead eyebrow="Project assets" title="Uploads" text="Add images, reference documents, presentation files, and judging attachments locally."><label className="btn primary"><Upload size={14} /> Choose files<input type="file" multiple hidden onChange={add} /></label></PageHead><div className="card"><div className="callout" style={{ marginBottom: 16 }}>Files are only registered in this browser prototype. They are not uploaded to a server.</div>{files.length ? files.map(name => <div className="project-row" key={name}><div className="project-icon"><FileText size={16} /></div><div style={{ flex: 1 }}><strong style={{ fontSize: 12 }}>{name}</strong><div className="project-meta">Local reference file</div></div><button className="icon-btn" onClick={() => remove(name)} aria-label={'Remove ' + name}><X size={15} /></button></div>) : <div className="empty"><Upload size={30} /><h3>No project assets yet</h3><p>Upload project images, PDFs, reports, or presentation files to organize the showcase.</p></div>}</div></>; }
function Showcase({ project, projects, onSelect, setPage }: { project: Project | null; projects: Project[]; onSelect: (project: Project) => void; setPage: (p: Page) => void }) {
  const active = project || projects[0];
  if (!active) return <div className="empty"><h2>No project selected</h2><p>Create a project to prepare its showcase page.</p></div>;
  const reportSaved = Object.values(active.report || {}).some(section => section.trim());
  const savedReadings = active.details?.readings.length || 0;
  const reportCount = Object.values(active.report || {}).filter(section => section.trim()).length;
  return <><PageHead eyebrow="Visitor-facing presentation" title="Project showcase" text="Prepare a clear, polished project view for visitors and judges."><Badge type="blue">{active.hidden ? 'HIDDEN FROM PUBLIC' : 'PUBLIC PROJECT'}</Badge><Btn onClick={() => setPage('Documentation Studio')}><FileText size={14} /> Edit report</Btn></PageHead>
    <div className="field showcase-selector"><label htmlFor="showcase-project">Project to present</label><select id="showcase-project" value={active.id} onChange={event => { const next = projects.find(item => item.id === event.target.value); if (next) onSelect(next); }}>{projects.map(item => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select></div>
    <section className="showcase-hero card"><div className="showcase-copy"><div className="eyebrow">{active.category} · {active.id}</div><h2>{active.name}</h2><p>{active.summary}</p><div className="actions"><Badge type="green">{active.team}</Badge><Badge type="blue">{active.progress}% prepared</Badge><Badge type={reportSaved ? 'green' : 'amber'}>{reportSaved ? 'Report ready' : 'Report in progress'}</Badge></div><div className="showcase-actions">{!active.hidden && <><a className="btn primary" href={`/project/${active.id}`}><ArrowRight size={14} /> Visitor project page</a><a className="btn" href={`/display/${active.id}`} target="_blank" rel="noreferrer"><Target size={14} /> Judge display</a></>}<Btn onClick={() => downloadFile(`${active.id}-showcase.txt`, `${active.name}\n${active.summary}`, 'text/plain')}><Download size={14} /> Download label</Btn></div></div><aside className="showcase-qr">{active.hidden ? <div className="hidden-project-note"><EyeOff size={22} /><strong>Project is hidden</strong><small>Make it public in Projects to enable QR access.</small></div> : <><QrCard id={active.id} /><small>Print this card and place it beside the project.</small></>}</aside></section>
    <div className="showcase-stats"><article className="card"><span>Project status</span><strong>{active.status}</strong><small>{active.progress}% prepared</small></article><article className="card"><span>Reference readings</span><strong>{savedReadings}</strong><small>Saved project values, not live telemetry</small></article><article className="card"><span>Report sections</span><strong>{reportCount}</strong><small>{reportSaved ? 'Content saved in this workspace' : 'Add content in Documentation Studio'}</small></article></div>
    <section className="card showcase-note"><div><div className="eyebrow">Visitor takeaway</div><h3>What this project does</h3><p>{active.summary}</p></div><span className="showcase-note-mark">C</span></section>
  </>;
}
function SettingsPage({ admin, setAdmin, projects, setProjects, config, setConfig, dark, setDark }: { admin: string; setAdmin: (x: string) => void; projects: Project[]; setProjects: (projects: Project[]) => void; config: WorkspaceConfig; setConfig: React.Dispatch<React.SetStateAction<WorkspaceConfig>>; dark: boolean; setDark: (dark: boolean) => void }) { return <><PageHead eyebrow="Workspace preferences" title="Settings" text="Customize the event workspace, appearance, and exhibition display."><Badge type="green">Local workspace</Badge></PageHead><AppearanceSettings dark={dark} setDark={setDark} /><WorkspaceSettings admin={admin} setAdmin={setAdmin} projects={projects} setProjects={setProjects} config={config} setConfig={setConfig} /><AdminAccessInfo /></>; }
export default function App() {
  const [page, setPage] = useState<Page>('Overview');
  const [dark, setDark] = useState(false);
  const [admin, setAdmin] = useState('Yeshwanth');
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [config, setConfig] = useState<WorkspaceConfig>(defaultConfig);
  const [selected, setSelected] = useState<Project | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const localProjects = loadLocal('circux-projects', defaultProjects);
    const localConfig = loadLocal('circux-workspace-config', defaultConfig);
    setDark(loadLocal('circux-dark', false)); setAdmin(loadLocal('circux-admin', 'Yeshwanth'));
    setProjects(localProjects); setConfig(localConfig);
    Promise.all([relayRequest<Project[]>('/projects').catch(() => null), relayRequest<Partial<WorkspaceConfig>>('/config').catch(() => null)]).then(([remoteProjects, remoteConfig]) => {
      if (remoteProjects?.length) setProjects(remoteProjects);
      if (remoteConfig) setConfig({ ...defaultConfig, ...localConfig, ...remoteConfig });
      setHydrated(true);
    });
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    saveLocal('circux-dark', dark); saveLocal('circux-projects', projects); saveLocal('circux-workspace-config', config);
    syncRelay('/config', config); syncRelay('/projects', { projects });
  }, [dark, projects, config, hydrated]);
  const saveProject = (project: Project) => { setProjects(current => current.some(item => item.id === project.id) ? current.map(item => item.id === project.id ? project : item) : [...current, project]); setSelected(project); setPage('Documentation Studio'); };
  const openProject = (project: Project, destination: Page = 'Showcase') => { setSelected(project); setPage(destination); };
  const content = page === 'Overview' ? <Overview projects={projects} setPage={setPage} open={project => openProject(project)} />
    : page === 'Projects' ? <ProjectsPanel projects={projects} open={project => openProject(project)} newProject={() => setPage('Project Builder')} save={project => setProjects(current => current.map(item => item.id === project.id ? project : item))} remove={project => { setProjects(current => current.filter(item => item.id !== project.id)); if (selected?.id === project.id) setSelected(null); }} />
    : page === 'Project Builder' ? <Builder save={saveProject} />
    : page === 'Documentation Studio' ? <DocumentationStudio project={selected} projects={projects} onSelect={project => { setSelected(project); setProjects(current => current.map(item => item.id === project.id ? project : item)); }} setPage={setPage} />
    : page === 'Showcase' ? <Showcase project={selected} projects={projects} onSelect={setSelected} setPage={setPage} />
    : page === 'Uploads' ? <UploadsPanel projects={projects} onProjectsChange={setProjects} />
    : page === 'Judging' ? <JudgingPanel project={selected} projects={projects} onSelect={setSelected} />
    : page === 'Live Monitor' ? <OperationalStatus />
    : page === 'Power Manager' ? <OperationalStatus power />
    : page === 'Board Health' ? <BoardHealthPanel />
    : <SettingsPage admin={admin} setAdmin={setAdmin} projects={projects} setProjects={setProjects} config={config} setConfig={setConfig} dark={dark} setDark={setDark} />;
  return <div className={'app ' + (dark ? 'dark' : '') + ' accent-' + config.accent}><Sidebar page={page} setPage={setPage} /><main className="main"><Header page={page} admin={admin} config={config} projects={projects} openResult={project => openProject(project)} /><div className="content">{content}</div></main><button onClick={() => setDark(!dark)} aria-label="Toggle theme" style={{ position: 'fixed', bottom: 18, right: 18, width: 38, height: 38, borderRadius: '50%', border: 0, background: 'var(--navy)', color: '#fff', display: 'grid', placeItems: 'center' }}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button></div>;
}


