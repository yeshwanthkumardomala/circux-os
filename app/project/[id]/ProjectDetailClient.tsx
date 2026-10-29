'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, CircuitBoard, ExternalLink, Images, Play, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { defaultProjects, getProject, type Project } from '../../../lib/project-data';
import { relayFetch } from '../../../lib/relay';
import { loadLocal } from '../../../lib/storage';
import QrCard from '../../components/QrCard';
import DisplayActions from '../../components/DisplayActions';
import ProjectDashboard from '../../components/ProjectDashboard';
import GlobalProjectSearch from '../../components/GlobalProjectSearch';

export default function ProjectDetailClient({ id, initialProject }: { id: string; initialProject: Project | null }) {
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

  if (!loaded) return <main className="public-page"><div className="public-card"><p>Loading project…</p></div></main>;
  if (!project) return <main className="public-page"><div className="public-card"><h1>Project not found</h1><p>This QR code does not match a Circux project.</p><Link href="/">Back to Circux</Link></div></main>;
  const details = project.details || { members: [], readings: [], documents: [], circuit: '', video: '', media: { photos: [], documents: [], videos: [] } };
  return <main className="public-page"><div className="public-wrap"><div className="public-search-row"><GlobalProjectSearch /><Link href="/" className="back-link"><ArrowLeft size={14} /> Circux OS</Link></div><section className="public-card detail-hero"><div><div className="eyebrow">{project.category} · {project.id}</div><h1>{project.name}</h1><p>{project.summary}</p><div className="actions"><span className="badge green">{project.team}</span><span className="badge blue">{project.status}</span></div></div><QrCard id={project.id} /></section><DisplayActions projectId={project.id} /><section className="public-card"><div className="card-head"><h2><Images size={17} /> Project photos</h2><span className="badge blue">Visitor view</span></div><div className="detail-photo-grid">{details.media?.photos?.map(photo => <img key={photo} src={photo} alt={`${project.name} project`} />) || <p>No project photos published yet.</p>}</div></section><div className="detail-grid"><section className="public-card"><div className="card-head"><h2><Users size={17} /> Team members</h2></div>{details.members.map(member => <div className="kpi" key={member.name}><span>{member.name}</span><span className="muted">{member.role}</span></div>)}</section><section className="public-card"><div className="card-head"><h2><CircuitBoard size={17} /> Saved project readings</h2><span className="badge amber">SAVED PROJECT DATA</span></div>{details.readings.map(reading => <div className="reading" key={reading.label}><div><strong>{reading.label}</strong><small>{reading.note}</small></div><b>{reading.value}</b></div>)}</section></div><div className="detail-grid"><section className="public-card"><div className="card-head"><h2><BookOpen size={17} /> Documentation</h2></div>{details.media?.documents?.map(document => <a className="document" key={document.title} href={document.url} target="_blank" rel="noreferrer">{document.title}<span>Open <ExternalLink size={11} /></span></a>)}<h2 className="section-title">Circuit overview</h2><p>{details.circuit}</p></section><section className="public-card"><div className="card-head"><h2><Play size={17} /> Development video</h2></div><div className="video-placeholder"><Play size={28} /><span>Project build walkthrough</span></div>{details.media?.videos?.map(video => <a className="video-link" key={video.title} href={video.url} target="_blank" rel="noreferrer">{video.title} <ExternalLink size={13} /></a>)}</section></div><Link className="display-link" href={`/display/${project.id}`}>Open judge display for this project →</Link></div></main>;
}
