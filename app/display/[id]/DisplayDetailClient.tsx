'use client';

import Link from 'next/link';
import { ArrowLeft, Play, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { defaultProjects, getProject, type Project } from '../../../lib/project-data';
import { relayRequest } from '../../../lib/relay';
import { loadLocal } from '../../../lib/storage';
import ProjectDashboard from '../../components/ProjectDashboard';
import GlobalProjectSearch from '../../components/GlobalProjectSearch';

export default function DisplayDetailClient({ id, initialProject }: { id: string; initialProject: Project | null }) {
  const [project, setProject] = useState<Project | null>(initialProject);
  useEffect(() => { relayRequest<Project>(`/projects/${encodeURIComponent(id)}`).then(setProject).catch(() => setProject(loadLocal<Project[]>('circux-projects', defaultProjects).find(item => item.id === id) || getProject(id))); }, [id]);
  if (!project) return <main className="display-page"><h1>Loading project…</h1></main>;
  const details = project.details || { members: [], readings: [], documents: [], circuit: '', video: '' };
  return <main className="display-page"><header className="display-header"><span>CIRCUX OS · JUDGE DISPLAY</span><GlobalProjectSearch compact /><Link href={`/project/${project.id}`}> <ArrowLeft size={15} /> Project details</Link></header><section className="display-hero"><div><div className="display-eyebrow">{project.category} · {project.id}</div><h1>{project.name}</h1><p>{project.summary}</p><div className="display-tags"><span>{project.team}</span><span>{project.progress}% prepared</span></div></div><div className="display-state"><span className="dot" /> {project.dataMode === 'live' ? 'LIVE DATA' : 'PRESENTATION FEED'}<br /><small>{project.dataMode === 'live' ? 'External device feed' : 'Simulated readings'}</small></div></section><div className="display-grid"><ProjectDashboard project={project} dark /><section className="display-panel"><h2><Users size={22} /> Team</h2>{details.members.map(member => <div className="display-member" key={member.name}><strong>{member.name}</strong><span>{member.role}</span></div>)}</section><section className="display-panel"><h2><Play size={22} /> Story</h2><p>{details.circuit}</p><div className="display-note">Use the phone QR page to read the full documentation and open the development video.</div></section></div><footer>Scan the project QR to view the full project page · Circux project display</footer></main>;
}
