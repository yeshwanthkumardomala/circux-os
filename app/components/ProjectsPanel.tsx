'use client';

import { useState } from 'react';
import { ArrowRight, Plus, Search } from 'lucide-react';
import type { Project } from '../../lib/project-data';

export default function ProjectsPanel({ projects, open, newProject }: { projects: Project[]; open: (project: Project) => void; newProject: () => void }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const shown = projects.filter(project => (!query || `${project.name} ${project.team}`.toLowerCase().includes(query.toLowerCase())) && (status === 'All' || project.status === status));
  return <><div className="page-head"><div><div className="eyebrow">Project gallery</div><h1>Projects</h1><p>Select what visitors, mentors, and judges should see.</p></div><button className="btn primary" onClick={newProject}><Plus size={14} /> New project</button></div><div className="card"><div className="toolbar"><div className="search" style={{ maxWidth: 390 }}><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search project names and teams..." /></div><select value={status} onChange={event => setStatus(event.target.value)}><option>All</option>{[...new Set(projects.map(project => project.status))].map(value => <option key={value}>{value}</option>)}</select></div><div className="grid project-grid">{shown.map(project => <div className="card project-card" key={project.id}><div className="project-name">{project.name}</div><div className="project-meta">{project.category} · {project.team}</div><p>{project.summary}</p><div className="progress"><i style={{ width: `${project.progress}%` }} /></div><div className="project-footer"><span className="muted">{project.status} · {project.progress}%</span><button className="text-button" onClick={() => open(project)}>Open project <ArrowRight size={13} /></button></div></div>)}</div>{shown.length === 0 && <div className="empty"><h3>No matching projects</h3><p>Try another search or status.</p></div>}</div></>;
}
