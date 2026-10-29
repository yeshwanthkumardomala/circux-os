'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, Play, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { defaultProjects, getProject, type Project } from '../../../lib/project-data';
import { relayFetch } from '../../../lib/relay';
import { loadLocal } from '../../../lib/storage';
import ProjectDashboard from '../../components/ProjectDashboard';
import GlobalProjectSearch from '../../components/GlobalProjectSearch';

const emptyDetails: NonNullable<Project['details']> = { members: [], readings: [], documents: [], circuit: '', video: '', media: { photos: [], documents: [], videos: [] } };

export default function DisplayDetailClient({ id, initialProject }: { id: string; initialProject: Project | null }) {
  const [project, setProject] = useState<Project | null>(initialProject);
  const [loaded, setLoaded] = useState(Boolean(initialProject));
  useEffect(() => {
    relayFetch(`/projects/${encodeURIComponent(id)}`).then(async response => {
      if (response.status === 404) {
        const issue = await response.json().catch(() => null);
        const local = loadLocal<Project[]>('circux-projects', defaultProjects).find(item => item.id === id);
        const fallback = issue?.hidden ? null : local || getProject(id);
        setProject(fallback?.hidden ? null : fallback);
        return;
      }
      if (!response.ok) throw new Error('Project service unavailable');
      const remote = await response.json() as Project;
      setProject(remote.hidden ? null : remote);
    }).catch(() => {
      const local = loadLocal<Project[]>('circux-projects', defaultProjects).find(item => item.id === id);
      const fallback = local || getProject(id);
      setProject(fallback?.hidden ? null : fallback);
    }).finally(() => setLoaded(true));
  }, [id]);

  if (!loaded) return <main className="display-page"><h1>Loading project…</h1></main>;
  if (!project) return <main className="display-page"><h1>Project unavailable</h1><p>This project may be hidden or deleted.</p><Link href="/">Return to Circux OS</Link></main>;
  const details = project.details || emptyDetails;
  const report = Object.entries(project.report || {}).filter(([, text]) => text.trim());
  return <main className="display-page"><header className="display-header"><div className="display-brand"><img src="/icon.svg" alt="" /><span>CIRCUX OS<small>JUDGE PRESENTATION</small></span></div><GlobalProjectSearch compact /><Link href={`/project/${project.id}`}><ArrowLeft size={15} /> Project details</Link></header>
    <section className="display-hero"><div><div className="display-eyebrow">{project.category} · {project.id}</div><h1>{project.name}</h1><p>{project.summary}</p><div className="display-tags"><span>{project.team}</span><span>{project.status}</span><span>{project.progress}% prepared</span></div></div><div className="display-state"><strong>SAVED PROJECT DATA</strong><small>Reference values from this project record; not live telemetry.</small></div></section>
    <div className="display-grid"><ProjectDashboard project={project} dark /><section className="display-panel"><h2><Users size={22} /> Project team</h2>{details.members.length ? details.members.map(member => <div className="display-member" key={member.name}><strong>{member.name}</strong><span>{member.role}</span></div>) : <p>Team members have not been added yet.</p>}</section><section className="display-panel"><h2><Play size={22} /> Project story</h2><p>{details.circuit || project.summary}</p><div className="display-note">Read the full project page for supporting links and documentation.</div></section></div>
    <section className="display-panel display-report"><h2><BookOpen size={20} /> Project report</h2>{report.length ? report.map(([heading, text]) => <article key={heading}><h3>{heading}</h3><p>{text}</p></article>) : <p>No report sections have been published for this project yet.</p>}</section>
    <footer>Scan the project QR to open the visitor page · Circux OS</footer>
  </main>;
}
