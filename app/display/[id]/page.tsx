import Link from 'next/link';
import { ArrowLeft, CircuitBoard, Play, Users } from 'lucide-react';
import { defaultProjects, getProject } from '../../../lib/project-data';

export function generateStaticParams() { return defaultProjects.map(project => ({ id: project.id })); }

export default function DisplayPage({ params }: { params: { id: string } }) {
  const project = getProject(decodeURIComponent(params.id));
  if (!project) return <main className="display-page"><h1>Project not found</h1><Link href="/display/CX-104">Open sample display</Link></main>;
  const details = project.details!;
  return <main className="display-page"><header className="display-header"><span>CIRCUX OS · JUDGE DISPLAY</span><Link href={`/project/${project.id}`}><ArrowLeft size={15} /> Project details</Link></header><section className="display-hero"><div><div className="display-eyebrow">{project.category} · {project.id}</div><h1>{project.name}</h1><p>{project.summary}</p><div className="display-tags"><span>{project.team}</span><span>{project.progress}% prepared</span></div></div><div className="display-state"><span className="dot" /> LIVE DEMO<br /><small>Simulated readings</small></div></section><div className="display-grid"><section className="display-panel"><h2><CircuitBoard size={22} /> Readings</h2>{details.readings.map(reading => <div className="display-reading" key={reading.label}><span>{reading.label}</span><strong>{reading.value}</strong></div>)}</section><section className="display-panel"><h2><Users size={22} /> Team</h2>{details.members.map(member => <div className="display-member" key={member.name}><strong>{member.name}</strong><span>{member.role}</span></div>)}</section><section className="display-panel"><h2><Play size={22} /> Story</h2><p>{details.circuit}</p><div className="display-note">Use the phone QR page to read the full documentation and open the development video.</div></section></div><footer>Scan the project QR to view the full project page · Circux prototype · no hardware connected</footer></main>;
}
